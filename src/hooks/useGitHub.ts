 import { useState, useCallback } from "react";
 import { useToast } from "@/hooks/use-toast";
 
 export type FileNode = {
   path: string;
   type: "blob" | "tree";
   sha: string;
 };
 
 export function useGitHub() {
   const [files, setFiles] = useState<FileNode[]>([]);
   const [currentFile, setCurrentFile] = useState<{ path: string; content: string; sha: string } | null>(null);
   const [isLoading, setIsLoading] = useState(false);
   const { toast } = useToast();
 
   const GITHUB_SYNC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-sync`;
   const FIX_ERRORS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fix-errors`;
   const AUTH_HEADER = `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;
 
   const loadRepository = useCallback(async (owner: string, repo: string) => {
     setIsLoading(true);
     try {
       const resp = await fetch(GITHUB_SYNC_URL, {
         method: "POST",
         headers: { "Content-Type": "application/json", Authorization: AUTH_HEADER },
         body: JSON.stringify({ action: "list", owner, repo }),
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
   }, [toast, GITHUB_SYNC_URL, AUTH_HEADER]);
 
   const loadFile = useCallback(async (owner: string, repo: string, path: string) => {
     setIsLoading(true);
     try {
       const resp = await fetch(GITHUB_SYNC_URL, {
         method: "POST",
         headers: { "Content-Type": "application/json", Authorization: AUTH_HEADER },
         body: JSON.stringify({ action: "read", owner, repo, path }),
       });
 
       if (!resp.ok) throw new Error("فشل قراءة الملف");
       const data = await resp.json();
       setCurrentFile({ path, content: data.content, sha: data.sha });
     } catch (e) {
       toast({ variant: "destructive", title: "خطأ", description: e instanceof Error ? e.message : "خطأ غير معروف" });
     } finally {
       setIsLoading(false);
     }
   }, [toast, GITHUB_SYNC_URL, AUTH_HEADER]);
 
   const saveFile = useCallback(async (owner: string, repo: string, path: string, content: string) => {
     setIsLoading(true);
     try {
       const resp = await fetch(GITHUB_SYNC_URL, {
         method: "POST",
         headers: { "Content-Type": "application/json", Authorization: AUTH_HEADER },
         body: JSON.stringify({ action: "write", owner, repo, path, content }),
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
   }, [toast, GITHUB_SYNC_URL, AUTH_HEADER]);
 
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