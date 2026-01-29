import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ✅ التعديل هنا - استخدم SERVICE_ROLE_KEY بدل ANON_KEY
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate input
    const body = (await req.json()) as unknown;
    const payload = (body && typeof body === "object" ? body : {}) as {
      messages?: unknown;
      githubContext?: unknown;
      fileContext?: unknown;
    };

    const messages = payload.messages;
    const githubContext = payload.githubContext as any;
    const fileContext = payload.fileContext as any;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "يجب إرسال رسائل صحيحة" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (messages.length > 50) {
      return new Response(JSON.stringify({ error: "عدد الرسائل كبير جداً" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "إعدادات الذكاء الصناعي غير مكتملة" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = `أنت مساعد تطوير لتطبيق React/TypeScript.

قواعد الرد:
1) اشرح أولاً بشكل مختصر وواضح.
2) ثم اكتب الكود/الخطوات.
3) عند اقتراح تعديل ملفات، ضع في نهاية الرد بلوك واحد فقط داخل \`\`\`apply\`\`\` بصيغة JSON تحتوي message و changes[] (path + content).
4) لا تضع أي أسرار أو مفاتيح في الكود.

هدفك: اكتشاف الأخطاء والتحسينات واقتراحها، ثم توفير تغييرات قابلة للتطبيق عند طلب المستخدم.

----

ملاحظة: واجهة العميل ستعرض محتوى ردّك كـ Markdown.`;

    // File context (optional)
    if (fileContext && typeof fileContext === "object") {
      const fc = fileContext as { path?: unknown; content?: unknown };
      if (typeof fc.path === "string" && typeof fc.content === "string") {
        const safeContent = fc.content.slice(0, 12000);
        systemPrompt += `

**سياق الملف الحالي:**
- path: ${fc.path}

**محتوى مختصر (قد يكون مقطوعاً):**
\`\`\`tsx
${safeContent}
\`\`\``;
      }
    }

    // إضافة سياق GitHub إذا كان متصلاً
    if (githubContext?.connected) {
      systemPrompt += `

**معلومات GitHub:**
- المستخدم متصل بـ GitHub باسم: @${githubContext.username ?? ""}
- عند اقتراح تغييرات، استخدم paths حقيقية داخل المشروع.`;
    }

    // Backward compatibility: keep some of the older guidance
    systemPrompt += `

إرشادات إضافية:
- التزم بـ TypeScript strict.
- استخدم shadcn/ui وTailwind بشكل متجاوب.
- تجنب إضافة Dependencies جديدة.
- اذكر المخاطر/البدائل عند وجود أكثر من حل.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "خطأ في الاتصال بخدمة الذكاء الصناعي" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: "حدث خطأ أثناء معالجة طلبك" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
