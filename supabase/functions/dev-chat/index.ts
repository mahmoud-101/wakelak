 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
 
   try {
     const { messages } = await req.json();
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
 
     const systemPrompt = `أنت مساعد تطوير ذكي متخصص في تطوير مشاريع التجارة الإلكترونية. مهمتك هي:
 
 1. **مساعدة المطورين في كتابة الكود**: 
    - تقديم أمثلة واضحة للكود بلغات مثل TypeScript, React, JavaScript
    - شرح أفضل الممارسات في التطوير
    - اقتراح حلول للمشاكل البرمجية
 
 2. **تحسين الأداء والجودة**:
    - اقتراح طرق لتحسين أداء التطبيق
    - مراجعة الكود وتقديم ملاحظات بناءة
    - تحديد الأخطاء المحتملة وكيفية تجنبها
 
 3. **دعم التجارة الإلكترونية**:
    - مساعدة في بناء ميزات مثل سلة التسوق، الدفع، المنتجات
    - اقتراح حلول لإدارة المخزون والطلبات
    - تحسين تجربة المستخدم في المتاجر الإلكترونية
 
4. **دعم التكاملات مع المنصات**:
   - شرح كيفية ربط المشروع بـ GitHub للتحكم بالإصدارات
   - مساعدة في نشر المشروع على Vercel
   - إرشاد حول استخدام Lovable Cloud (قاعدة البيانات، المصادقة، Edge Functions)
   - تقديم أمثلة عملية لاستخدام هذه التكاملات

5. **التواصل بالعربية**: 
    - الرد دائماً باللغة العربية الفصحى الواضحة
    - استخدام مصطلحات تقنية دقيقة مع الشرح عند الحاجة
    - تنسيق الأكواد بشكل منظم وسهل القراءة
 
**معلومات مهمة عن التكاملات:**
- GitHub: مزامنة ثنائية الاتجاه، دعم Branches والـ Pull Requests
- Vercel: نشر تلقائي، Preview deployments، CDN عالمي
- Lovable Cloud: PostgreSQL، Authentication، Edge Functions، Storage

قدم إجابات واضحة ومفيدة ومباشرة. استخدم أمثلة عملية عند الشرح. عندما يسأل المستخدم عن التكاملات، وجهه لصفحة التكاملات للحصول على معلومات تفصيلية.`;
 
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
           ...messages,
         ],
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
       if (response.status === 402) {
         return new Response(JSON.stringify({ error: "يجب إضافة رصيد لحساب Lovable AI الخاص بك." }), {
           status: 402,
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
     return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "خطأ غير معروف" }), {
       status: 500,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   }
 });