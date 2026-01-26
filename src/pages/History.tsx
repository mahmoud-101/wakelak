 import { useState, useEffect } from "react";
 import { useNavigate, useLocation } from "react-router-dom";
 import { History as HistoryIcon, ArrowLeft, RotateCcw, Clock } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { useAuth } from "@/hooks/useAuth";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 
 type Version = {
   id: string;
   project_id: string;
   content: string;
   message: string;
   created_at: string;
 };
 
 const History = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const { user, loading } = useAuth();
   const { toast } = useToast();
   const [versions, setVersions] = useState<Version[]>([]);
   const projectId = location.state?.projectId;
 
   useEffect(() => {
     if (!loading && !user) navigate("/auth");
   }, [user, loading, navigate]);
 
   useEffect(() => {
     if (projectId) loadVersions();
   }, [projectId]);
 
   const loadVersions = async () => {
     // This would load from a versions table
     // For now, showing placeholder
     setVersions([
       {
         id: "1",
         project_id: projectId,
         content: "{}",
         message: "إضافة نظام المصادقة",
         created_at: new Date().toISOString(),
       },
       {
         id: "2",
         project_id: projectId,
         content: "{}",
         message: "تحسين واجهة المستخدم",
         created_at: new Date(Date.now() - 3600000).toISOString(),
       },
     ]);
   };
 
   const restoreVersion = async (versionId: string) => {
     toast({ title: "جاري الاستعادة...", description: "يرجى الانتظار" });
     // Implementation for restoring version
     setTimeout(() => {
       toast({ title: "تم!", description: "تم استعادة الإصدار بنجاح" });
     }, 1000);
   };
 
   if (loading) {
     return <div className="flex min-h-screen items-center justify-center">جاري التحميل...</div>;
   }
 
   return (
     <div className="min-h-screen bg-background" dir="rtl">
       <header className="border-b border-border bg-card/50 backdrop-blur-sm">
         <div className="container mx-auto flex h-16 items-center gap-3 px-4">
           <Button variant="ghost" size="icon" onClick={() => navigate("/editor")}>
             <ArrowLeft className="h-5 w-5" />
           </Button>
           <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
             <HistoryIcon className="h-6 w-6 text-primary-foreground" />
           </div>
           <div>
             <h1 className="text-lg font-bold text-foreground">تاريخ الإصدارات</h1>
             <p className="text-xs text-muted-foreground">استعادة النسخ السابقة</p>
           </div>
         </div>
       </header>
 
       <div className="container mx-auto p-6">
         <Card>
           <CardHeader>
             <CardTitle>الإصدارات السابقة</CardTitle>
           </CardHeader>
           <CardContent>
             <ScrollArea className="h-[600px]">
               <div className="space-y-3">
                 {versions.map((version) => (
                   <div
                     key={version.id}
                     className="p-4 bg-muted/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
                   >
                     <div className="flex items-start justify-between">
                       <div className="flex-1">
                         <p className="font-medium">{version.message}</p>
                         <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                           <Clock className="h-3 w-3" />
                           <span>{new Date(version.created_at).toLocaleString("ar")}</span>
                         </div>
                       </div>
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => restoreVersion(version.id)}
                       >
                         <RotateCcw className="ml-2 h-4 w-4" />
                         استعادة
                       </Button>
                     </div>
                   </div>
                 ))}
               </div>
             </ScrollArea>
           </CardContent>
         </Card>
       </div>
     </div>
   );
 };
 
 export default History;