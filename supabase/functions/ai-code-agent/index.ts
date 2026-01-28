import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Change = { path: string; content: string };

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isValidOwnerRepo(owner: unknown, repo: unknown) {
  if (typeof owner !== "string" || typeof repo !== "string") return false;
  if (!/^[a-zA-Z0-9-]+$/.test(owner)) return false;
  if (!/^[a-zA-Z0-9-_.]+$/.test(repo)) return false;
  return true;
}

function sanitizeChanges(changes: unknown): Change[] {
  if (!Array.isArray(changes)) return [];
  const out: Change[] = [];
  for (const c of changes) {
    const path = (c as any)?.path;
    const content = (c as any)?.content;
    if (typeof path !== "string" || typeof content !== "string") continue;
    if (!path || path.includes("..") || path.startsWith("/")) continue;
    if (content.length > 1_000_000) continue;
    out.push({ path, content });
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json(401, { error: "غير مصرح" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("ai-code-agent auth error:", authError);
      return json(401, { error: "غير مصرح" });
    }

    const body = await req.json().catch(() => null);
    const prompt = body?.prompt;
    const owner = body?.owner;
    const repo = body?.repo;

    if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 8000) {
      return json(400, { error: "prompt غير صحيح" });
    }
    if (!isValidOwnerRepo(owner, repo)) {
      return json(400, { error: "owner/repo غير صحيح" });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return json(500, { error: "LOVABLE_API_KEY غير متاح" });
    }

    const systemPrompt =
      "أنت AI متخصص في React/TypeScript، مهمتك تحليل طلب المستخدم وإنشاء/تعديل الملفات المطلوبة. \n" +
      "أرجِع التعديلات كقائمة ملفات (path) ومحتواها الكامل (content). لا تشرح كثيراً.\n" +
      "قواعد مهمة: لا تستخدم Next.js. هذا مشروع React + Vite + Tailwind + TypeScript + shadcn/ui.\n" +
      "استخدم الاستيرادات من @/.. عند الحاجة. تجنب تغييرات غير مطلوبة.";

    const tools = [
      {
        type: "function",
        function: {
          name: "propose_file_changes",
          description: "Return a list of file changes (path + full content).",
          parameters: {
            type: "object",
            properties: {
              changes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    path: { type: "string" },
                    content: { type: "string" },
                  },
                  required: ["path", "content"],
                  additionalProperties: false,
                },
              },
            },
            required: ["changes"],
            additionalProperties: false,
          },
        },
      },
    ];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content:
              `Repo: ${owner}/${repo}\n` +
              `طلب المستخدم: ${prompt.trim()}\n\n` +
              "مخرجاتك يجب أن تكون tool call إلى propose_file_changes فقط.",
          },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "propose_file_changes" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("ai gateway error:", aiResp.status, t);
      if (aiResp.status === 429) return json(429, { error: "تم تجاوز حد الطلبات، حاول لاحقاً." });
      if (aiResp.status === 402) return json(402, { error: "لا توجد رصيد كافٍ لخدمة الذكاء الاصطناعي." });
      return json(500, { error: "فشل الاتصال بخدمة الذكاء الاصطناعي" });
    }

    const aiJson = await aiResp.json();
    const toolCalls = aiJson?.choices?.[0]?.message?.tool_calls;
    const argsStr = toolCalls?.[0]?.function?.arguments;
    const parsedArgs = typeof argsStr === "string" ? JSON.parse(argsStr) : argsStr;
    const changes = sanitizeChanges(parsedArgs?.changes);

    if (changes.length === 0) {
      return json(500, { error: "لم يتم توليد تعديلات صالحة" });
    }

    return json(200, { changes });
  } catch (e) {
    console.error("ai-code-agent error:", e);
    return json(500, { error: e instanceof Error ? e.message : "حدث خطأ" });
  }
});
