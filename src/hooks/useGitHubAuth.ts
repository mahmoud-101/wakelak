 import { useState, useEffect } from "react";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";

const SINGLE_USER_EMAIL = "telmahmoud4@gmail.com";
 
 type GitHubRepo = {
   name: string;
   owner: string;
   fullName: string;
   defaultBranch: string;
   private: boolean;
 };
 
 export function useGitHubAuth() {
   const [isConnecting, setIsConnecting] = useState(false);
   const [isConnected, setIsConnected] = useState(false);
   const [githubUsername, setGithubUsername] = useState<string | null>(null);
   const [repos, setRepos] = useState<GitHubRepo[]>([]);
   const [isAuthenticated, setIsAuthenticated] = useState(false);
   const { toast } = useToast();
 
   useEffect(() => {
     const checkAuth = async () => {
     const { data: { user } } = await supabase.auth.getUser();
      const allowed = !!user && (user.email ?? "").toLowerCase() === SINGLE_USER_EMAIL;
      setIsAuthenticated(allowed);
      if (allowed) {
       await checkGitHubConnection();
      } else if (user) {
        // Defensive: if a non-allowed user somehow exists, sign them out.
        await supabase.auth.signOut();
     }
   };
 
     checkAuth();
 
     // Listen to auth state changes
     const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const allowed = !!session?.user && (session.user.email ?? "").toLowerCase() === SINGLE_USER_EMAIL;
      setIsAuthenticated(allowed);
      if (allowed) {
         await checkGitHubConnection();
       } else {
         setIsConnected(false);
         setGithubUsername(null);
         setRepos([]);

        if (session?.user) {
          await supabase.auth.signOut();
        }
       }
     });
 
     return () => subscription.unsubscribe();
   }, []);
 
   // Handle OAuth callback
   useEffect(() => {
     const params = new URLSearchParams(window.location.search);
     const code = params.get("code");
     const state = params.get("state");
     
     if (code && state) {
       handleOAuthCallback(code, state);
     }
   }, []);
 
  const checkGitHubConnection = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("github_username, github_connected_at")
      .eq("id", user.id)
      .single();
    
    if (profile?.github_username) {
      setIsConnected(true);
      setGithubUsername(profile.github_username);
      await fetchUserRepos();
    }
  };

  const fetchUserRepos = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("github-oauth", {
        body: { action: "repos" },
      });
      
      if (!error && data?.repos) {
        setRepos(data.repos.map((r: any) => ({
          name: r.name,
          owner: r.owner.login,
          fullName: r.full_name,
          defaultBranch: r.default_branch,
          private: r.private,
        })));
      }
    } catch (error) {
      console.error("Failed to fetch repos:", error);
    }
  };
 
   const handleOAuthCallback = async (code: string, state: string) => {
     setIsConnecting(true);
     
     try {
       const { data, error } = await supabase.functions.invoke("github-oauth", {
         body: { action: "exchange", code },
       });
 
       if (error) throw error;
       
       if (data?.access_token) {
         // Store in profiles
         const { data: { user } } = await supabase.auth.getUser();
         if (user) {
          // Store token in secure_credentials (server-side only)
          await supabase
            .from("secure_credentials")
            .upsert({
              user_id: user.id,
              github_token: data.access_token,
            });
          
          // Store non-sensitive data in profiles
           await supabase
             .from("profiles")
             .update({
               github_username: data.user.login,
               github_connected_at: new Date().toISOString(),
             })
             .eq("id", user.id);
         }
         
         setIsConnected(true);
         setGithubUsername(data.user.login);
        await fetchUserRepos();
         
         toast({
           title: "تم الربط بنجاح! ✓",
           description: `تم ربط حسابك بـ GitHub (@${data.user.login})`,
         });
         
         // Clean URL
         window.history.replaceState({}, "", window.location.pathname);
       }
     } catch (error) {
       console.error("GitHub OAuth error:", error);
       toast({
         variant: "destructive",
         title: "فشل الربط",
         description: "حدث خطأ أثناء الربط بـ GitHub. حاول مرة أخرى.",
       });
     } finally {
       setIsConnecting(false);
     }
   };
 
    const connectGitHub = async () => {
      setIsConnecting(true);
      
     const { data: { user } } = await supabase.auth.getUser();
     
     if (!user) {
        setIsConnecting(false);
       toast({
         variant: "destructive",
         title: "تسجيل الدخول مطلوب",
         description: "يجب تسجيل الدخول أولاً للربط بـ GitHub",
       });
       return;
     }

      if ((user.email ?? "").toLowerCase() !== SINGLE_USER_EMAIL) {
        setIsConnecting(false);
        toast({
          variant: "destructive",
          title: "غير مصرح",
          description: "الربط بـ GitHub مسموح للحساب الأساسي فقط",
        });
        return;
      }
     
      try {
        // Get GitHub Client ID from edge function
        const { data, error } = await supabase.functions.invoke("github-oauth", {
          body: { action: "get_client_id" },
        });
        
        if (error || !data?.client_id) {
          throw new Error("Failed to get GitHub Client ID");
        }
        
        const redirectUri = `${window.location.origin}/integrations`;
        const scope = "repo,user,read:org";
        const state = user.id;
        
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${data.client_id}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
      } catch (error) {
        console.error("Failed to start GitHub OAuth:", error);
        setIsConnecting(false);
       toast({
         variant: "destructive",
          title: "فشل الربط",
          description: "حدث خطأ أثناء بدء عملية الربط. حاول مرة أخرى.",
       });
     }
   };
   
   const disconnectGitHub = async () => {
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return;
     
    // Remove from secure_credentials
    await supabase
      .from("secure_credentials")
      .delete()
      .eq("user_id", user.id);
    
    // Remove from profiles
     const { error } = await supabase
       .from("profiles")
       .update({
         github_username: null,
         github_connected_at: null,
       })
       .eq("id", user.id);
     
     if (!error) {
       setIsConnected(false);
       setGithubUsername(null);
       setRepos([]);
       
       toast({
         title: "تم فصل الربط",
         description: "تم فصل حسابك عن GitHub",
       });
     }
   };
 
   return { 
     connectGitHub, 
     disconnectGitHub,
     isConnecting, 
     isConnected,
     githubUsername,
     repos,
     isAuthenticated,
   };
 }