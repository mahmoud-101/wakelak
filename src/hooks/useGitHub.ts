 import { useState, useCallback } from "react";
import { useEffect } from "react";
 import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
 
 export type FileNode = {
   path: string;
   type: "blob" | "tree";
   sha: string;
 };
 
 export function useGitHub() {
   const [files, setFiles] = useState<FileNode[]>([]);
   const [currentFile, setCurrentFile] = useState<{ path: string; content: string; sha: string } | null>(null);
   const [isLoading, setIsLoading] = useState(false);
  const [githubToken, setGithubToken] = useState<string | null>(null);
   const { toast } = useToast();
 
   const GITHUB_SYNC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-sync`;
   const FIX_ERRORS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fix-errors`;
   const AUTH_HEADER = `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;
 
  // Load GitHub token on mount
  useEffect(() => {
    const loadGitHubToken = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("github_token")
        .eq("id", user.id)
        .single();
      
      if (profile?.github_token) {
        setGithubToken(profile.github_token);
      }
    };
    loadGitHubToken();
  }, []);

   const loadRepository = useCallback(async (owner: string, repo: string) => {
    if (!githubToken) {
      toast({ variant: "destructive", title: "خطأ", description: "يجب ربط حساب GitHub أولاً" });
      return;
    }
     setIsLoading(true);
     try {
       const resp = await fetch(GITHUB_SYNC_URL, {
         method: "POST",
         headers: { "Content-Type": "application/json", Authorization: AUTH_HEADER },
        body: JSON.stringify({ action: "list", owner, repo, token: githubToken }),
       });
 
       if (!resp.ok) throw new Error("فشل تحميل المستودع");
       const data = await resp.json();
       setFiles(data.tree.filter((f: FileNode) => f.type === "blob"));
       toast({ title: "تم التحميل", description: `تم تحميل ${data.tree.length} ملف` });
     } catch (e) {
       toast({ variant: "destructive", title: "خطأ", description: e instanceof Error ? e.message : "خطأ غير معروف" });
     } finally {
       setIsLoading(false);
     }
  }, [toast, GITHUB_SYNC_URL, AUTH_HEADER, githubToken]);
 
   const loadFile = useCallback(async (owner: string, repo: string, path: string) => {
    if (!githubToken) {
      toast({ variant: "destructive", title: "خطأ", description: "يجب ربط حساب GitHub أولاً" });
      return;
    }
     setIsLoading(true);
     try {
       const resp = await fetch(GITHUB_SYNC_URL, {
         method: "POST",
         headers: { "Content-Type": "application/json", Authorization: AUTH_HEADER },
        body: JSON.stringify({ action: "read", owner, repo, path, token: githubToken }),
       });
 
       if (!resp.ok) throw new Error("فشل قراءة الملف");
       const data = await resp.json();
       setCurrentFile({ path, content: data.content, sha: data.sha });
     } catch (e) {
       toast({ variant: "destructive", title: "خطأ", description: e instanceof Error ? e.message : "خطأ غير معروف" });
     } finally {
       setIsLoading(false);
     }
  }, [toast, GITHUB_SYNC_URL, AUTH_HEADER, githubToken]);
 
   const saveFile = useCallback(async (owner: string, repo: string, path: string, content: string) => {
    if (!githubToken) {
      toast({ variant: "destructive", title: "خطأ", description: "يجب ربط حساب GitHub أولاً" });
      return false;
    }
     setIsLoading(true);
     try {
       const resp = await fetch(GITHUB_SYNC_URL, {
         method: "POST",
         headers: { "Content-Type": "application/json", Authorization: AUTH_HEADER },
        body: JSON.stringify({ action: "write", owner, repo, path, content, token: githubToken }),
       });
 
       if (!resp.ok) throw new Error("فشل حفظ الملف");
       toast({ title: "تم الحفظ", description: "تم حفظ التغييرات على GitHub" });
       return true;
     } catch (e) {
       toast({ variant: "destructive", title: "خطأ", description: e instanceof Error ? e.message : "خطأ غير معروف" });
       return false;
     } finally {
       setIsLoading(false);
     }
  }, [toast, GITHUB_SYNC_URL, AUTH_HEADER, githubToken]);
 
   const fixError = useCallback(async (code: string, error: string, filePath: string) => {
     setIsLoading(true);
     try {
       const resp = await fetch(FIX_ERRORS_URL, {
         method: "POST",
         headers: { "Content-Type": "application/json", Authorization: AUTH_HEADER },
         body: JSON.stringify({ code, error, filePath }),
       });
 
       if (!resp.ok) throw new Error("فشل إصلاح الخطأ");
       const data = await resp.json();
       
       // Extract code from markdown if present
       let fixedCode = data.fixedCode;
       const codeMatch = fixedCode.match(/```[\w]*\n([\s\S]*?)\n```/);
       if (codeMatch) {
         fixedCode = codeMatch[1];
       }
       
       return fixedCode;
     } catch (e) {
       toast({ variant: "destructive", title: "خطأ", description: e instanceof Error ? e.message : "خطأ غير معروف" });
       return null;
     } finally {
       setIsLoading(false);
     }
   }, [toast, FIX_ERRORS_URL, AUTH_HEADER]);
 
   return { files, currentFile, isLoading, loadRepository, loadFile, saveFile, fixError };
 }