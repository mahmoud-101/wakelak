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
  const { toast } = useToast();

  const INVOKE_TIMEOUT_MS = 15000;
  function withTimeout<T>(promise: Promise<T>, label: string, ms = INVOKE_TIMEOUT_MS): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = window.setTimeout(() => reject(new Error(`Timeout: ${label}`)), ms);
      promise
        .then((v) => {
          window.clearTimeout(id);
          resolve(v);
        })
        .catch((e) => {
          window.clearTimeout(id);
          reject(e);
        });
    });
  }

  const loadRepository = useCallback(async (owner: string, repo: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke("github-sync", {
          body: { action: "list", owner, repo },
        }),
        "github-sync:list"
      );

      if (error) throw error;
      if (!data?.tree) throw new Error("فشل تحميل المستودع");

      setFiles(data.tree.filter((f: FileNode) => f.type === "blob"));
      toast({ title: "تم التحميل", description: `تم تحميل ${data.tree.length} ملف` });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: e instanceof Error ? e.message : "خطأ غير معروف" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadFile = useCallback(async (owner: string, repo: string, path: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke("github-sync", {
          body: { action: "read", owner, repo, path },
        }),
        "github-sync:read"
      );

      if (error) throw error;
      if (!data?.content || !data?.sha) throw new Error("فشل قراءة الملف");

      setCurrentFile({ path, content: data.content, sha: data.sha });
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: e instanceof Error ? e.message : "خطأ غير معروف" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // ========== التعديل الرئيسي هنا ==========
  const saveFile = useCallback(async (owner: string, repo: string, path: string, content: string) => {
    setIsLoading(true);
    try {
      // ✅ إضافة commit message
      const message = `Update ${path} via Lak Dev`;
      
      const { data, error } = await withTimeout(
        supabase.functions.invoke("github-sync", {
          body: { 
            action: "write", 
            owner, 
            repo, 
            path, 
            content,
            message  // ← أضفت السطر ده
          },
        }),
        "github-sync:write"
      );

      if (error) throw error;
      if (!data?.success) throw new Error("فشل حفظ الملف");

      // ✅ رسالة Toast محدّثة
      toast({ 
        title: "تم الحفظ ✓", 
        description: data.commit ? `Committed to GitHub: ${data.message}` : "تم حفظ التغييرات على GitHub" 
      });
      return true;
    } catch (e) {
      toast({ 
        variant: "destructive", 
        title: "خطأ", 
        description: e instanceof Error ? e.message : "خطأ غير معروف" 
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fixError = useCallback(async (code: string, error: string, filePath: string) => {
    setIsLoading(true);
    try {
      const { data, error: invokeError } = await withTimeout(
        supabase.functions.invoke("fix-errors", {
          body: { code, error, filePath },
        }),
        "fix-errors"
      );

      if (invokeError) throw invokeError;
      if (!data?.fixedCode) throw new Error("فشل إصلاح الخطأ");
      
      // Extract code from markdown if present
      let fixedCode = data.fixedCode as string;
      // Matches fenced code blocks: ```lang\n...\n```
      const codeMatch = fixedCode.match(/```[\w-]*\n([\s\S]*?)\n```/);
      if (codeMatch?.[1]) fixedCode = codeMatch[1];
      
      return fixedCode;
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: e instanceof Error ? e.message : "خطأ غير معروف" });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return { files, currentFile, isLoading, loadRepository, loadFile, saveFile, fixError };
}