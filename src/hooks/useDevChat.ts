 import { useState, useCallback } from "react";
import { useEffect } from "react";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 
 type Message = { role: "user" | "assistant"; content: string };
 
 export function useDevChat() {
   const [messages, setMessages] = useState<Message[]>([]);
   const [isLoading, setIsLoading] = useState(false);
   const [githubContext, setGithubContext] = useState<any>(null);
   const { toast } = useToast();
   
   const loadGitHubContext = async () => {
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return;
     
     const { data: profile } = await supabase
       .from("profiles")
      .select("github_username")
       .eq("id", user.id)
       .single();
     
    if (profile?.github_username) {
       setGithubContext({
        connected: true,
         username: profile.github_username,
       });
     }
   };

  // Load GitHub context on mount
  useEffect(() => {
    loadGitHubContext();
  }, []);
 
   const sendMessage = useCallback(async (input: string) => {
     const userMsg: Message = { role: "user", content: input };
     setMessages(prev => [...prev, userMsg]);
     setIsLoading(true);
 
     let assistantSoFar = "";
     const upsertAssistant = (nextChunk: string) => {
       assistantSoFar += nextChunk;
       setMessages(prev => {
         const last = prev[prev.length - 1];
         if (last?.role === "assistant") {
           return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
         }
         return [...prev, { role: "assistant", content: assistantSoFar }];
       });
     };
 
     try {
       const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dev-chat`;
       
       const resp = await fetch(CHAT_URL, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
         },
         body: JSON.stringify({ 
           messages: [...messages, userMsg],
           githubContext: githubContext ? {
             connected: true,
             username: githubContext.username,
           } : { connected: false }
         }),
       });
 
       if (!resp.ok) {
         const errorData = await resp.json();
         toast({
           variant: "destructive",
           title: "خطأ",
           description: errorData.error || "فشل الاتصال بالوكيل الذكي",
         });
         setMessages(prev => prev.slice(0, -1));
         setIsLoading(false);
         return;
       }
 
       if (!resp.body) throw new Error("لا يوجد رد من الخادم");
 
       const reader = resp.body.getReader();
       const decoder = new TextDecoder();
       let textBuffer = "";
       let streamDone = false;
 
       while (!streamDone) {
         const { done, value } = await reader.read();
         if (done) break;
         textBuffer += decoder.decode(value, { stream: true });
 
         let newlineIndex: number;
         while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
           let line = textBuffer.slice(0, newlineIndex);
           textBuffer = textBuffer.slice(newlineIndex + 1);
 
           if (line.endsWith("\r")) line = line.slice(0, -1);
           if (line.startsWith(":") || line.trim() === "") continue;
           if (!line.startsWith("data: ")) continue;
 
           const jsonStr = line.slice(6).trim();
           if (jsonStr === "[DONE]") {
             streamDone = true;
             break;
           }
 
           try {
             const parsed = JSON.parse(jsonStr);
             const content = parsed.choices?.[0]?.delta?.content as string | undefined;
             if (content) upsertAssistant(content);
           } catch {
             textBuffer = line + "\n" + textBuffer;
             break;
           }
         }
       }
 
       if (textBuffer.trim()) {
         for (let raw of textBuffer.split("\n")) {
           if (!raw) continue;
           if (raw.endsWith("\r")) raw = raw.slice(0, -1);
           if (raw.startsWith(":") || raw.trim() === "") continue;
           if (!raw.startsWith("data: ")) continue;
           const jsonStr = raw.slice(6).trim();
           if (jsonStr === "[DONE]") continue;
           try {
             const parsed = JSON.parse(jsonStr);
             const content = parsed.choices?.[0]?.delta?.content as string | undefined;
             if (content) upsertAssistant(content);
           } catch { /* ignore */ }
         }
       }
 
       setIsLoading(false);
     } catch (e) {
       console.error(e);
       setIsLoading(false);
       setMessages(prev => prev.slice(0, -1));
       toast({
         variant: "destructive",
         title: "خطأ",
         description: "حدث خطأ أثناء الاتصال بالوكيل الذكي",
       });
     }
   }, [messages, toast]);
 
   return { messages, isLoading, sendMessage };
 }