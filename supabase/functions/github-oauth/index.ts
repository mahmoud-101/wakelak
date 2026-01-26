 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
 
   try {
     const { action, code } = await req.json();
     const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
 
     if (action === "exchange") {
       // Exchange code for access token
       const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Accept: "application/json",
         },
         body: JSON.stringify({
           client_id: Deno.env.get("GITHUB_CLIENT_ID"),
           client_secret: Deno.env.get("GITHUB_CLIENT_SECRET"),
           code,
         }),
       });
 
       const tokenData = await tokenResp.json();
 
       if (tokenData.access_token) {
         // Get user info
         const userResp = await fetch("https://api.github.com/user", {
           headers: {
             Authorization: `Bearer ${tokenData.access_token}`,
             Accept: "application/vnd.github.v3+json",
           },
         });
 
         const userData = await userResp.json();
 
         return new Response(
           JSON.stringify({
             access_token: tokenData.access_token,
             user: userData,
           }),
           { headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
       throw new Error("Failed to exchange code");
     }
 
     if (action === "repos") {
       // List user repositories
       const reposResp = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
         headers: {
           Authorization: `Bearer ${GITHUB_TOKEN}`,
           Accept: "application/vnd.github.v3+json",
         },
       });
 
       const repos = await reposResp.json();
 
       return new Response(JSON.stringify({ repos }), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     throw new Error("Invalid action");
   } catch (e) {
     console.error("GitHub OAuth error:", e);
     return new Response(
       JSON.stringify({ error: e instanceof Error ? e.message : "خطأ غير معروف" }),
       {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });