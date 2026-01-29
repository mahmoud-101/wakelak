import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, projectFiles } = await req.json();

    // Perplexity API بتاعك!
    const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer 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",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-large-128k-online", // أفضل model
        messages: [
          {
            role: "system",
            content: `أنت wakelak bot. شوف ${projectFiles?.length || 0} ملف. اقترح 1-2 تغييرات مهمة. لما يقول "نفّذ" رجّع JSON changes array فقط:
            [
              {"path": "src/file.tsx", "content": "الكود الجديد", "description": "الوصف"}
            ]
            استخدم projectFiles: ${JSON.stringify(projectFiles?.map((f) => f.path) || [])}`,
          },
          ...messages,
        ],
        max_tokens: 4000,
        stream: false,
      }),
    });

    const aiData = await perplexityResponse.json();
    const content = aiData.choices[0].message.content;

    // لو JSON changes → stream كـ changes
    let streamData;
    try {
      const changes = JSON.parse(content);
      streamData = { choices: [{ delta: { content: JSON.stringify(changes) } }] };
    } catch {
      streamData = { choices: [{ delta: { content } }] };
    }

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(`data: ${JSON.stringify(streamData)}\n\n`);
        controller.enqueue("data: [DONE]\n\n");
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
