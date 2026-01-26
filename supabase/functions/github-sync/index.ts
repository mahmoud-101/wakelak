 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
 
   try {
    const { action, owner, repo, path, content, branch = "main", token } = await req.json();
     
    if (!token) throw new Error("GitHub token is required");
 
     const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
 
     if (action === "list") {
       // Get repository tree
       const treeResp = await fetch(`${baseUrl}/git/trees/${branch}?recursive=1`, {
         headers: {
          Authorization: `Bearer ${token}`,
           Accept: "application/vnd.github.v3+json",
         },
       });
 
       if (!treeResp.ok) throw new Error("Failed to fetch repository tree");
       const data = await treeResp.json();
 
       return new Response(JSON.stringify({ tree: data.tree }), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     if (action === "read") {
       // Read file content
       const fileResp = await fetch(`${baseUrl}/contents/${path}?ref=${branch}`, {
         headers: {
          Authorization: `Bearer ${token}`,
           Accept: "application/vnd.github.v3+json",
         },
       });
 
       if (!fileResp.ok) throw new Error("Failed to read file");
       const fileData = await fileResp.json();
 
       return new Response(JSON.stringify({
         content: atob(fileData.content),
         sha: fileData.sha,
       }), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     if (action === "write") {
       // Get current file SHA if it exists
       let sha = null;
       try {
         const existingResp = await fetch(`${baseUrl}/contents/${path}?ref=${branch}`, {
           headers: {
            Authorization: `Bearer ${token}`,
             Accept: "application/vnd.github.v3+json",
           },
         });
         if (existingResp.ok) {
           const existingData = await existingResp.json();
           sha = existingData.sha;
         }
       } catch {}
 
       // Write file
       const writeResp = await fetch(`${baseUrl}/contents/${path}`, {
         method: "PUT",
         headers: {
          Authorization: `Bearer ${token}`,
           Accept: "application/vnd.github.v3+json",
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           message: `Update ${path} via Lovable`,
           content: btoa(content),
           branch,
           ...(sha && { sha }),
         }),
       });
 
       if (!writeResp.ok) throw new Error("Failed to write file");
       const writeData = await writeResp.json();
 
       return new Response(JSON.stringify({ success: true, sha: writeData.content.sha }), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     throw new Error("Invalid action");
   } catch (e) {
     console.error("GitHub sync error:", e);
     return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "خطأ غير معروف" }), {
       status: 500,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   }
 });