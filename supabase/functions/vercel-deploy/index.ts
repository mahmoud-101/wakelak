 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
 
   try {
     const { action, projectName, gitUrl, envVars } = await req.json();
     const VERCEL_TOKEN = Deno.env.get("VERCEL_TOKEN");
     
     if (!VERCEL_TOKEN) {
       return new Response(
         JSON.stringify({ 
           error: "يرجى إضافة Vercel Token في الإعدادات أولاً",
           setup_url: "https://vercel.com/account/tokens" 
         }),
         {
           status: 400,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         }
       );
     }
 
     if (action === "deploy") {
       // Create Vercel deployment
       const deployResp = await fetch("https://api.vercel.com/v13/deployments", {
         method: "POST",
         headers: {
           Authorization: `Bearer ${VERCEL_TOKEN}`,
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           name: projectName,
           gitSource: {
             type: "github",
             repo: gitUrl,
             ref: "main",
           },
           ...(envVars && {
             env: envVars,
           }),
           buildCommand: "npm run build",
           framework: "vite",
         }),
       });
 
       if (!deployResp.ok) {
         const error = await deployResp.text();
         throw new Error(`Vercel deployment failed: ${error}`);
       }
 
       const deployment = await deployResp.json();
 
       return new Response(
         JSON.stringify({
           success: true,
           deploymentUrl: `https://${deployment.url}`,
           deploymentId: deployment.id,
           status: deployment.readyState,
         }),
         {
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         }
       );
     }
 
     if (action === "status") {
       // Check deployment status
       const { deploymentId } = await req.json();
       
       const statusResp = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
         headers: {
           Authorization: `Bearer ${VERCEL_TOKEN}`,
         },
       });
 
       if (!statusResp.ok) throw new Error("Failed to fetch deployment status");
       
       const status = await statusResp.json();
 
       return new Response(JSON.stringify(status), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     if (action === "list") {
       // List all deployments
       const listResp = await fetch("https://api.vercel.com/v6/deployments", {
         headers: {
           Authorization: `Bearer ${VERCEL_TOKEN}`,
         },
       });
 
       if (!listResp.ok) throw new Error("Failed to list deployments");
       
       const deployments = await listResp.json();
 
       return new Response(JSON.stringify(deployments), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     throw new Error("Invalid action");
   } catch (e) {
     console.error("Vercel Deploy error:", e);
     return new Response(
       JSON.stringify({ error: e instanceof Error ? e.message : "خطأ غير معروف" }),
       {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });