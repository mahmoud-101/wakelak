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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "غير مصرح" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

     // Fetch GitHub token
     // 1) Prefer per-user token from secure storage (if user completed OAuth in-app)
     // 2) Fallback to project secret GITHUB_TOKEN (so sync works without in-app linking)
     let token: string | null = null;
     try {
       const { data: credentials } = await supabaseClient
         .from("secure_credentials")
         .select("github_token")
         .eq("user_id", user.id)
         .single();

       token = credentials?.github_token ?? null;
     } catch {
       // ignore
     }

     token = token ?? Deno.env.get("GITHUB_TOKEN") ?? null;

     if (!token) {
       return new Response(
         JSON.stringify({
           error:
             "لا يوجد توكن GitHub متاح. أضف GITHUB_TOKEN كسِرّ في الباك-إند أو اربط GitHub من داخل التطبيق.",
         }),
         {
           status: 400,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         }
       );
     }

    // Validate and parse input
    const { action, owner, repo, path, content, branch = "main" } = await req.json();
    
    // Validate action
    if (!["list", "read", "write"].includes(action)) {
      return new Response(JSON.stringify({ error: "عملية غير صحيحة" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate owner and repo
    if (!owner || !repo || !/^[a-zA-Z0-9-]+$/.test(owner) || !/^[a-zA-Z0-9-_.]+$/.test(repo)) {
      return new Response(JSON.stringify({ error: "اسم المستودع غير صحيح" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate path (no directory traversal)
    if (path && (path.includes("..") || path.startsWith("/"))) {
      return new Response(JSON.stringify({ error: "مسار الملف غير صحيح" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate content size (max 1MB)
    if (content && content.length > 1000000) {
      return new Response(JSON.stringify({ error: "حجم المحتوى كبير جداً" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
 
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
    return new Response(JSON.stringify({ error: "حدث خطأ أثناء معالجة طلبك" }), {
       status: 500,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   }
 });