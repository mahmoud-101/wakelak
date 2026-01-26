 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
 
   try {
     const { action, messages, files, projectContext, model = "google/gemini-3-flash-preview" } = await req.json();
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     
     if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
 
     if (action === "generate-app") {
       // Generate complete application
       const systemPrompt = `أنت مطور خبير في React، TypeScript، Tailwind CSS، و shadcn/ui.
 
 مهمتك: بناء تطبيقات ويب كاملة احترافية من الصفر.
 
 **قواعد مهمة:**
 1. استخدم React مع TypeScript فقط
 2. Tailwind CSS للتنسيق (استخدم design tokens من index.css)
 3. shadcn/ui للمكونات الجاهزة
 4. React Query للـ data fetching
 5. React Router للتنقل
 6. Lovable Cloud للـ backend (Supabase)
 
 **البنية:**
 - src/pages/ للصفحات
 - src/components/ للمكونات
 - src/hooks/ للـ custom hooks
 - src/lib/ للـ utilities
 
 **الأمان:**
 - دائماً استخدم RLS policies
 - التحقق من المدخلات
 - معالجة الأخطاء
 
 قدم كود نظيف، موثق، وجاهز للإنتاج.`;
 
       const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
         method: "POST",
         headers: {
           Authorization: `Bearer ${LOVABLE_API_KEY}`,
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           model,
           messages: [
             { role: "system", content: systemPrompt },
             ...messages,
           ],
           stream: true,
         }),
       });
 
       if (!response.ok) throw new Error(`AI API error: ${response.status}`);
 
       return new Response(response.body, {
         headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
       });
     }
 
     if (action === "fix-code") {
       // Fix code with context
       const systemPrompt = `أنت خبير في إصلاح الأخطاء البرمجية.
 
 السياق المتاح:
 ${projectContext ? `- المشروع: ${JSON.stringify(projectContext)}` : ''}
 ${files ? `- الملفات: ${JSON.stringify(files)}` : ''}
 
 مهمتك:
 1. تحليل الخطأ بدقة
 2. فهم السياق الكامل
 3. إصلاح الكود بذكاء
 4. تحسين الجودة
 5. شرح التغييرات
 
 قدم الحل الأمثل مع التوضيح.`;
 
       const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
         method: "POST",
         headers: {
           Authorization: `Bearer ${LOVABLE_API_KEY}`,
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           model,
           messages: [
             { role: "system", content: systemPrompt },
             ...messages,
           ],
         }),
       });
 
       if (!response.ok) throw new Error(`AI API error: ${response.status}`);
 
       const data = await response.json();
       return new Response(JSON.stringify(data), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     if (action === "analyze-project") {
       // Analyze entire project structure
       const systemPrompt = `أنت محلل خبير للمشاريع البرمجية.
 
 قم بتحليل المشروع من حيث:
 1. البنية والتنظيم
 2. جودة الكود
 3. الأداء
 4. الأمان
 5. أفضل الممارسات
 
 قدم تقرير مفصل مع اقتراحات التحسين.`;
 
       const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
         method: "POST",
         headers: {
           Authorization: `Bearer ${LOVABLE_API_KEY}`,
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           model: "google/gemini-3-pro-preview", // Use more powerful model
           messages: [
             { role: "system", content: systemPrompt },
             { role: "user", content: `المشروع:\n${JSON.stringify(projectContext, null, 2)}` },
           ],
         }),
       });
 
       if (!response.ok) throw new Error(`AI API error: ${response.status}`);
 
       const data = await response.json();
       return new Response(JSON.stringify(data), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     throw new Error("Invalid action");
   } catch (e) {
     console.error("Advanced AI Agent error:", e);
     return new Response(
       JSON.stringify({ error: e instanceof Error ? e.message : "خطأ غير معروف" }),
       {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });