 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
 
   try {
     const { action, owner, repo, files, commitMessage } = await req.json();
     const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
     
     if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is not configured");
 
     const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
 
     if (action === "auto-commit") {
       // Auto commit multiple files
       const results = [];
       
       for (const file of files) {
         // Get current file SHA
         let sha = null;
         try {
           const existingResp = await fetch(`${baseUrl}/contents/${file.path}`, {
             headers: {
               Authorization: `Bearer ${GITHUB_TOKEN}`,
               Accept: "application/vnd.github.v3+json",
             },
           });
           if (existingResp.ok) {
             const existingData = await existingResp.json();
             sha = existingData.sha;
           }
         } catch {}
 
         // Commit file
         const commitResp = await fetch(`${baseUrl}/contents/${file.path}`, {
           method: "PUT",
           headers: {
             Authorization: `Bearer ${GITHUB_TOKEN}`,
             Accept: "application/vnd.github.v3+json",
             "Content-Type": "application/json",
           },
           body: JSON.stringify({
             message: commitMessage || `Update ${file.path} via Lovable Clone`,
             content: btoa(file.content),
             ...(sha && { sha }),
           }),
         });
 
         if (commitResp.ok) {
           results.push({ path: file.path, status: "success" });
         } else {
           results.push({ path: file.path, status: "failed" });
         }
       }
 
       return new Response(JSON.stringify({ results }), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     if (action === "pull-changes") {
       // Pull latest changes from GitHub
       const commitsResp = await fetch(`${baseUrl}/commits?per_page=10`, {
         headers: {
           Authorization: `Bearer ${GITHUB_TOKEN}`,
           Accept: "application/vnd.github.v3+json",
         },
       });
 
       if (!commitsResp.ok) throw new Error("Failed to fetch commits");
       
       const commits = await commitsResp.json();
 
       return new Response(JSON.stringify({ commits }), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     if (action === "setup-webhook") {
       // Setup GitHub webhook for auto-sync
       const webhookResp = await fetch(`${baseUrl}/hooks`, {
         method: "POST",
         headers: {
           Authorization: `Bearer ${GITHUB_TOKEN}`,
           Accept: "application/vnd.github.v3+json",
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           name: "web",
           active: true,
           events: ["push", "pull_request"],
           config: {
             url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/github-webhook`,
             content_type: "json",
           },
         }),
       });
 
       if (!webhookResp.ok) throw new Error("Failed to setup webhook");
       
       const webhook = await webhookResp.json();
 
       return new Response(JSON.stringify({ webhook }), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     throw new Error("Invalid action");
   } catch (e) {
     console.error("GitHub Auto Sync error:", e);
     return new Response(
       JSON.stringify({ error: e instanceof Error ? e.message : "خطأ غير معروف" }),
       {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });