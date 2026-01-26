 import { useState, useEffect } from "react";
 import { useNavigate, useLocation } from "react-router-dom";
 import { Rocket, ArrowLeft, Github, ExternalLink, CheckCircle2, XCircle, Loader2 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 
 const Deploy = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const { user, loading } = useAuth();
   const { toast } = useToast();
   const project = location.state?.project;
   
   const [deployments, setDeployments] = useState<any[]>([]);
   const [isDeploying, setIsDeploying] = useState(false);
   const [vercelToken, setVercelToken] = useState("");
 
   useEffect(() => {
     if (!loading && !user) navigate("/auth");
   }, [user, loading, navigate]);
 
   useEffect(() => {
     if (project) loadDeployments();
   }, [project]);
 
   const loadDeployments = async () => {
     const { data } = await supabase
       .from("deployments")
       .select("*")
       .eq("project_id", project.id)
       .order("created_at", { ascending: false });
 
     if (data) setDeployments(data);
   };
 
   const deployToVercel = async () => {
     if (!project.github_repo || !project.github_owner) {
       toast({
         variant: "destructive",
         title: "خطأ",
         description: "يجب ربط المشروع بـ GitHub أولاً",
       });
       return;
     }
 
     setIsDeploying(true);
     
     try {
       const DEPLOY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vercel-deploy`;
       const AUTH_HEADER = `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;
 
       const resp = await fetch(DEPLOY_URL, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: AUTH_HEADER,
         },
         body: JSON.stringify({
           action: "deploy",
           projectName: project.name.toLowerCase().replace(/\s+/g, "-"),
           gitUrl: `${project.github_owner}/${project.github_repo}`,
         }),
       });
 
       const data = await resp.json();
 
       if (resp.ok) {
         // Save to database
         await supabase.from("deployments").insert({
           project_id: project.id,
           platform: "vercel",
           deployment_url: data.deploymentUrl,
           status: "success",
         });
 
         toast({
           title: "تم النشر! 🚀",
           description: `المشروع منشور على ${data.deploymentUrl}`,
         });
 
         loadDeployments();
       } else {
         throw new Error(data.error);
       }
     } catch (e) {
       toast({
         variant: "destructive",
         title: "فشل النشر",
         description: e instanceof Error ? e.message : "حدث خطأ",
       });
     } finally {
       setIsDeploying(false);
     }
   };
 
   if (loading) {
     return <div className="flex min-h-screen items-center justify-center">جاري التحميل...</div>;
   }
 
   return (
     <div className="min-h-screen bg-background" dir="rtl">
       <header className="border-b border-border bg-card/50 backdrop-blur-sm">
         <div className="container mx-auto flex h-16 items-center gap-3 px-4">
           <Button variant="ghost" size="icon" onClick={() => navigate("/projects")}>
             <ArrowLeft className="h-5 w-5" />
           </Button>
           <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow">
             <Rocket className="h-6 w-6 text-primary-foreground" />
           </div>
           <div>
             <h1 className="text-lg font-bold text-foreground">النشر والإطلاق</h1>
             <p className="text-xs text-muted-foreground">انشر مشروعك على الإنترنت</p>
           </div>
         </div>
       </header>
 
       <div className="container mx-auto p-6 space-y-6">
         <div className="grid gap-6 md:grid-cols-2">
           <Card className="border-primary/50 shadow-glow">
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Rocket className="h-5 w-5 text-primary" />
                 نشر على Vercel
               </CardTitle>
               <CardDescription>
                 نشر تلقائي مع CDN عالمي و SSL مجاني
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               {!project?.github_repo && (
                 <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                   <p className="text-sm text-destructive">
                     يجب ربط المشروع بـ GitHub أولاً من المحرر
                   </p>
                 </div>
               )}
               <Button
                 onClick={deployToVercel}
                 disabled={isDeploying || !project?.github_repo}
                 className="w-full bg-gradient-to-r from-primary to-accent"
                 size="lg"
               >
                 {isDeploying ? (
                   <>
                     <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                     جاري النشر...
                   </>
                 ) : (
                   <>
                     <Rocket className="ml-2 h-4 w-4" />
                     نشر الآن
                   </>
                 )}
               </Button>
             </CardContent>
           </Card>
 
           <Card className="border-primary/50 shadow-glow">
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Github className="h-5 w-5" />
                 ربط GitHub
               </CardTitle>
               <CardDescription>
                 مزامنة تلقائية مع المستودع
               </CardDescription>
             </CardHeader>
             <CardContent>
               {project?.github_repo ? (
                 <div className="space-y-2">
                   <div className="flex items-center gap-2 text-success">
                     <CheckCircle2 className="h-4 w-4" />
                     <span className="text-sm">مرتبط: {project.github_owner}/{project.github_repo}</span>
                   </div>
                   <Button variant="outline" size="sm" className="w-full" asChild>
                     <a
                       href={`https://github.com/${project.github_owner}/${project.github_repo}`}
                       target="_blank"
                       rel="noopener noreferrer"
                     >
                       <ExternalLink className="ml-2 h-4 w-4" />
                       فتح في GitHub
                     </a>
                   </Button>
                 </div>
               ) : (
                 <div className="space-y-2">
                   <div className="flex items-center gap-2 text-muted-foreground">
                     <XCircle className="h-4 w-4" />
                     <span className="text-sm">غير مرتبط</span>
                   </div>
                   <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/editor", { state: { project } })}>
                     <Github className="ml-2 h-4 w-4" />
                     ربط في المحرر
                   </Button>
                 </div>
               )}
             </CardContent>
           </Card>
         </div>
 
         <Card>
           <CardHeader>
             <CardTitle>سجل النشر</CardTitle>
           </CardHeader>
           <CardContent>
             {deployments.length === 0 ? (
               <p className="text-center text-muted-foreground py-8">لا توجد نشرات بعد</p>
             ) : (
               <div className="space-y-3">
                 {deployments.map((deployment) => (
                   <div
                     key={deployment.id}
                     className="p-4 bg-muted/50 rounded-lg border border-border"
                   >
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="font-medium">{deployment.platform.toUpperCase()}</p>
                         <p className="text-sm text-muted-foreground">
                           {new Date(deployment.created_at).toLocaleString("ar")}
                         </p>
                       </div>
                       <div className="flex items-center gap-2">
                         {deployment.status === "success" ? (
                           <CheckCircle2 className="h-5 w-5 text-success" />
                         ) : (
                           <XCircle className="h-5 w-5 text-destructive" />
                         )}
                         {deployment.deployment_url && (
                           <Button variant="outline" size="sm" asChild>
                             <a href={deployment.deployment_url} target="_blank" rel="noopener noreferrer">
                               <ExternalLink className="ml-2 h-4 w-4" />
                               فتح
                             </a>
                           </Button>
                         )}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </CardContent>
         </Card>
       </div>
     </div>
   );
 };
 
 export default Deploy;