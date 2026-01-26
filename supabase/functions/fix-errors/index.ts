 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
 
   try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Validate input
     const { code, error, filePath } = await req.json();
    
    if (!code || !error || !filePath) {
      return new Response(JSON.stringify({ error: "بيانات غير مكتملة" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate sizes
    if (code.length > 100000 || error.length > 5000 || filePath.length > 500) {
      return new Response(JSON.stringify({ error: "حجم البيانات كبير جداً" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     
     if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
 
     const systemPrompt = `أنت خبير في إصلاح الأخطاء البرمجية. مهمتك:
 
 1. **تحليل الخطأ**: فهم سبب المشكلة بدقة
 2. **اقتراح الحل**: تقديم الكود المصحح مباشرة
 3. **الشرح**: شرح مختصر للتغييرات
 
 قدم الكود المصحح كاملاً بدون أي نص إضافي قبله أو بعده.
 استخدم تنسيق markdown مع \`\`\`language للكود.`;
 
     const userPrompt = `الملف: ${filePath}
 
 الكود الحالي:
 \`\`\`
 ${code}
 \`\`\`
 
 الخطأ:
 ${error}
 
 أصلح هذا الخطأ وقدم الكود المصحح كاملاً.`;
 
     const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${LOVABLE_API_KEY}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model: "google/gemini-3-flash-preview",
         messages: [
           { role: "system", content: systemPrompt },
           { role: "user", content: userPrompt },
         ],
       }),
     });
 
     if (!response.ok) {
       throw new Error(`AI API error: ${response.status}`);
     }
 
     const data = await response.json();
     const fixedCode = data.choices[0].message.content;
 
     return new Response(JSON.stringify({ fixedCode }), {
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   } catch (e) {
     console.error("Fix error:", e);
    return new Response(JSON.stringify({ error: "حدث خطأ أثناء معالجة طلبك" }), {
       status: 500,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   }
 });