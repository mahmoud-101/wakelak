 import { useState, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
import { Plus, Folder, LogOut, Github, Clock, Trash2, Database as DatabaseIcon, Settings } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { useAuth } from "@/hooks/useAuth";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 
 type Project = {
   id: string;
   name: string;
   description: string | null;
   github_repo: string | null;
   github_owner: string | null;
   last_opened_at: string;
   created_at: string;
 };
 
 const Projects = () => {
   const navigate = useNavigate();
   const { user, loading, signOut } = useAuth();
   const { toast } = useToast();
   const [projects, setProjects] = useState<Project[]>([]);
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [newProject, setNewProject] = useState({ name: "", description: "", github_repo: "", github_owner: "" });
 
   useEffect(() => {
     if (!loading && !user) navigate("/auth");
   }, [user, loading, navigate]);
 
   useEffect(() => {
     if (user) loadProjects();
   }, [user]);
 
   const loadProjects = async () => {
     const { data, error } = await supabase
       .from("projects")
       .select("*")
       .order("last_opened_at", { ascending: false });
 
     if (error) {
       toast({ variant: "destructive", title: "خطأ", description: "فشل تحميل المشاريع" });
     } else {
       setProjects(data || []);
     }
   };
 
   const createProject = async () => {
     if (!newProject.name) return;
 
     const { error } = await supabase.from("projects").insert({
       user_id: user?.id,
       name: newProject.name,
       description: newProject.description || null,
       github_repo: newProject.github_repo || null,
       github_owner: newProject.github_owner || null,
     });
 
     if (error) {
       toast({ variant: "destructive", title: "خطأ", description: "فشل إنشاء المشروع" });
     } else {
       toast({ title: "تم!", description: "تم إنشاء المشروع بنجاح" });
       setNewProject({ name: "", description: "", github_repo: "", github_owner: "" });
       setIsDialogOpen(false);
       loadProjects();
     }
   };
 
   const deleteProject = async (id: string) => {
     const { error } = await supabase.from("projects").delete().eq("id", id);
 
     if (error) {
       toast({ variant: "destructive", title: "خطأ", description: "فشل حذف المشروع" });
     } else {
       toast({ title: "تم!", description: "تم حذف المشروع" });
       loadProjects();
     }
   };
 
   const openProject = async (project: Project) => {
     await supabase.from("projects").update({ last_opened_at: new Date().toISOString() }).eq("id", project.id);
     navigate("/editor", { state: { project } });
   };
 
   if (loading) {
     return <div className="flex min-h-screen items-center justify-center">جاري التحميل...</div>;
   }
 
   return (
     <div className="min-h-screen bg-background" dir="rtl">
       <header className="border-b border-border bg-card/50 backdrop-blur-sm">
         <div className="container mx-auto flex h-16 items-center justify-between px-4">
           <div className="flex items-center gap-3">
             <Folder className="h-6 w-6 text-primary" />
             <h1 className="text-lg font-bold">مشاريعي</h1>
           </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/database")}>
              <DatabaseIcon className="ml-2 h-4 w-4" />
              قاعدة البيانات
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
         </div>
       </header>
 
       <div className="container mx-auto p-6 space-y-6">
         <div className="flex items-center justify-between">
           <div>
             <h2 className="text-2xl font-bold">المشاريع</h2>
             <p className="text-muted-foreground">إدارة مشاريعك على GitHub</p>
           </div>
           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
             <DialogTrigger asChild>
               <Button>
                 <Plus className="ml-2 h-4 w-4" />
                 مشروع جديد
               </Button>
             </DialogTrigger>
             <DialogContent dir="rtl">
               <DialogHeader>
                 <DialogTitle>إنشاء مشروع جديد</DialogTitle>
               </DialogHeader>
               <div className="space-y-4 mt-4">
                 <Input
                   placeholder="اسم المشروع"
                   value={newProject.name}
                   onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                 />
                 <Input
                   placeholder="الوصف (اختياري)"
                   value={newProject.description}
                   onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                 />
                 <Input
                   placeholder="GitHub Owner (اختياري)"
                   value={newProject.github_owner}
                   onChange={(e) => setNewProject({ ...newProject, github_owner: e.target.value })}
                 />
                 <Input
                   placeholder="GitHub Repository (اختياري)"
                   value={newProject.github_repo}
                   onChange={(e) => setNewProject({ ...newProject, github_repo: e.target.value })}
                 />
                 <Button onClick={createProject} className="w-full" disabled={!newProject.name}>
                   إنشاء المشروع
                 </Button>
               </div>
             </DialogContent>
           </Dialog>
         </div>
 
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           {projects.map((project) => (
             <Card key={project.id} className="cursor-pointer hover:border-primary transition-colors">
               <CardHeader>
                 <CardTitle className="flex items-center justify-between">
                   <span className="truncate">{project.name}</span>
                   <Button
                     variant="ghost"
                     size="icon"
                     onClick={(e) => {
                       e.stopPropagation();
                       deleteProject(project.id);
                     }}
                   >
                     <Trash2 className="h-4 w-4 text-destructive" />
                   </Button>
                 </CardTitle>
                 {project.description && (
                   <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                 )}
               </CardHeader>
               <CardContent>
                 <div className="space-y-2">
                   {project.github_repo && (
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                       <Github className="h-4 w-4" />
                       <span className="truncate">
                         {project.github_owner}/{project.github_repo}
                       </span>
                     </div>
                   )}
                   <div className="flex items-center gap-2 text-xs text-muted-foreground">
                     <Clock className="h-3 w-3" />
                     <span>آخر فتح: {new Date(project.last_opened_at).toLocaleDateString("ar")}</span>
                   </div>
                   <Button onClick={() => openProject(project)} className="w-full mt-2">
                     فتح المشروع
                   </Button>
                 </div>
               </CardContent>
             </Card>
           ))}
         </div>
 
         {projects.length === 0 && (
           <Card className="p-12 text-center">
             <Folder className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
             <h3 className="text-xl font-semibold mb-2">لا توجد مشاريع</h3>
             <p className="text-muted-foreground mb-4">ابدأ بإنشاء مشروعك الأول</p>
             <Button onClick={() => setIsDialogOpen(true)}>
               <Plus className="ml-2 h-4 w-4" />
               إنشاء مشروع
             </Button>
           </Card>
         )}
       </div>
     </div>
   );
 };
 
 export default Projects;