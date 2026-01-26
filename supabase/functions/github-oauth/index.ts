 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
 
   try {
    const { action, code } = await req.json();
 
      if (action === "get_client_id") {
        // Return GitHub Client ID for OAuth flow
        return new Response(
          JSON.stringify({
            client_id: Deno.env.get("GITHUB_CLIENT_ID"),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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
      // Authenticate user first
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // Fetch token from secure storage
      const { data: credentials, error: credError } = await supabaseClient
        .from("secure_credentials")
        .select("github_token")
        .eq("user_id", user.id)
        .single();
      
      if (credError || !credentials?.github_token) {
        return new Response(JSON.stringify({ error: "يجب ربط حساب GitHub أولاً" }), { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      const token = credentials.github_token;

       const reposResp = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
         headers: {
          Authorization: `Bearer ${token}`,
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
      JSON.stringify({ error: "حدث خطأ أثناء معالجة طلبك" }),
       {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });