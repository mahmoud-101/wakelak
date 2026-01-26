 import { useState, useEffect } from "react";
 import { User, Session } from "@supabase/supabase-js";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 
 export function useAuth() {
   const [user, setUser] = useState<User | null>(null);
   const [session, setSession] = useState<Session | null>(null);
   const [loading, setLoading] = useState(true);
   const { toast } = useToast();
 
   useEffect(() => {
     // Set up auth state listener first
     const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
       setSession(session);
       setUser(session?.user ?? null);
       setLoading(false);
     });
 
     // Then check for existing session
     supabase.auth.getSession().then(({ data: { session } }) => {
       setSession(session);
       setUser(session?.user ?? null);
       setLoading(false);
     });
 
     return () => subscription.unsubscribe();
   }, []);
 
   const signUp = async (email: string, password: string, fullName?: string) => {
     try {
       const { data, error } = await supabase.auth.signUp({
         email,
         password,
         options: {
           emailRedirectTo: `${window.location.origin}/`,
           data: { full_name: fullName },
         },
       });
 
       if (error) throw error;
 
       // Create profile
       if (data.user) {
         const { error: profileError } = await supabase.from("profiles").insert({
           id: data.user.id,
           email: data.user.email,
           full_name: fullName,
         });
 
         if (profileError) console.error("Profile creation error:", profileError);
       }
 
       toast({ title: "تم!", description: "تم إنشاء الحساب بنجاح" });
       return { data, error: null };
     } catch (error: any) {
       const message = error.message === "User already registered" 
         ? "البريد الإلكتروني مسجل مسبقاً" 
         : "فشل إنشاء الحساب";
       toast({ variant: "destructive", title: "خطأ", description: message });
       return { data: null, error };
     }
   };
 
   const signIn = async (email: string, password: string) => {
     try {
       const { data, error } = await supabase.auth.signInWithPassword({ email, password });
       if (error) throw error;
       toast({ title: "أهلاً بك!", description: "تم تسجيل الدخول بنجاح" });
       return { data, error: null };
     } catch (error: any) {
       const message = error.message === "Invalid login credentials"
         ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
         : "فشل تسجيل الدخول";
       toast({ variant: "destructive", title: "خطأ", description: message });
       return { data: null, error };
     }
   };
 
   const signOut = async () => {
     try {
       const { error } = await supabase.auth.signOut();
       if (error) throw error;
       toast({ title: "تم", description: "تم تسجيل الخروج" });
     } catch (error: any) {
       toast({ variant: "destructive", title: "خطأ", description: "فشل تسجيل الخروج" });
     }
   };
 
   return { user, session, loading, signUp, signIn, signOut, isAuthenticated: !!user };
 }