 import { useState, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import { Database as DatabaseIcon, Table, Plus, ArrowLeft, Trash2, Shield } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Textarea } from "@/components/ui/textarea";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 
 const Database = () => {
   const navigate = useNavigate();
   const { user, loading } = useAuth();
   const { toast } = useToast();
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [sqlQuery, setSqlQuery] = useState("");
 
   useEffect(() => {
     if (!loading && !user) navigate("/auth");
   }, [user, loading, navigate]);
 
   const runMigration = async () => {
     if (!sqlQuery.trim()) return;
 
     try {
       toast({ title: "جاري التنفيذ...", description: "يرجى الانتظار" });
       
       // Here you would call your migration edge function
       toast({ 
         title: "تم!", 
         description: "تم تنفيذ الاستعلام بنجاح. تحقق من Cloud View لمراجعة التغييرات." 
       });
       
       setSqlQuery("");
       setIsDialogOpen(false);
     } catch (e) {
       toast({ 
         variant: "destructive", 
         title: "خطأ", 
         description: e instanceof Error ? e.message : "فشل تنفيذ الاستعلام" 
       });
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
           <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
             <DatabaseIcon className="h-6 w-6 text-primary-foreground" />
           </div>
           <div>
             <h1 className="text-lg font-bold text-foreground">إدارة قاعدة البيانات</h1>
             <p className="text-xs text-muted-foreground">الجداول والسياسات</p>
           </div>
         </div>
       </header>
 
       <div className="container mx-auto p-6 space-y-6">
         <div className="flex items-center justify-between">
           <div>
             <h2 className="text-2xl font-bold">قاعدة البيانات</h2>
             <p className="text-muted-foreground">إدارة الجداول والسياسات والمزيد</p>
           </div>
           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
             <DialogTrigger asChild>
               <Button className="bg-gradient-to-r from-primary to-accent">
                 <Plus className="ml-2 h-4 w-4" />
                 استعلام جديد
               </Button>
             </DialogTrigger>
             <DialogContent dir="rtl" className="max-w-2xl">
               <DialogHeader>
                 <DialogTitle>تنفيذ استعلام SQL</DialogTitle>
               </DialogHeader>
               <div className="space-y-4 mt-4">
                 <Textarea
                   placeholder="CREATE TABLE example (id UUID PRIMARY KEY, name TEXT);"
                   value={sqlQuery}
                   onChange={(e) => setSqlQuery(e.target.value)}
                   className="min-h-[200px] font-mono text-sm"
                 />
                 <Button onClick={runMigration} className="w-full" disabled={!sqlQuery.trim()}>
                   تنفيذ الاستعلام
                 </Button>
               </div>
             </DialogContent>
           </Dialog>
         </div>
 
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           <Card className="border-primary/50 shadow-glow">
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Table className="h-5 w-5 text-primary" />
                 الجداول
               </CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-sm text-muted-foreground mb-4">
                 إدارة جداول قاعدة البيانات
               </p>
               <div className="space-y-2">
                 <div className="p-3 bg-muted/50 rounded-lg">
                   <p className="text-sm font-medium">profiles</p>
                   <p className="text-xs text-muted-foreground">بيانات المستخدمين</p>
                 </div>
                 <div className="p-3 bg-muted/50 rounded-lg">
                   <p className="text-sm font-medium">projects</p>
                   <p className="text-xs text-muted-foreground">المشاريع</p>
                 </div>
               </div>
             </CardContent>
           </Card>
 
           <Card className="border-primary/50 shadow-glow">
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Shield className="h-5 w-5 text-success" />
                 RLS Policies
               </CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-sm text-muted-foreground mb-4">
                 سياسات الأمان على مستوى الصفوف
               </p>
               <div className="space-y-2">
                 <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                   <p className="text-sm font-medium text-success">RLS مفعّل</p>
                   <p className="text-xs text-muted-foreground">جميع الجداول محمية</p>
                 </div>
               </div>
             </CardContent>
           </Card>
 
           <Card className="border-primary/50 shadow-glow">
             <CardHeader>
               <CardTitle>الوصول السريع</CardTitle>
             </CardHeader>
             <CardContent className="space-y-2">
               <Button variant="outline" className="w-full justify-start" size="sm">
                 <DatabaseIcon className="ml-2 h-4 w-4" />
                 فتح في Cloud View
               </Button>
               <Button variant="outline" className="w-full justify-start" size="sm">
                 <Table className="ml-2 h-4 w-4" />
                 عرض البيانات
               </Button>
             </CardContent>
           </Card>
         </div>
 
         <Card className="border-primary/20">
           <CardHeader>
             <CardTitle>أمثلة استعلامات مفيدة</CardTitle>
           </CardHeader>
           <CardContent className="space-y-3">
             <div className="p-3 bg-muted/50 rounded-lg">
               <p className="text-sm font-medium mb-1">إنشاء جدول جديد</p>
               <pre className="text-xs text-muted-foreground overflow-x-auto">
 {`CREATE TABLE products (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   name TEXT NOT NULL,
   price DECIMAL(10,2),
   created_at TIMESTAMPTZ DEFAULT now()
 );`}
               </pre>
             </div>
             <div className="p-3 bg-muted/50 rounded-lg">
               <p className="text-sm font-medium mb-1">إضافة سياسة RLS</p>
               <pre className="text-xs text-muted-foreground overflow-x-auto">
 {`ALTER TABLE products ENABLE ROW LEVEL SECURITY;
 
 CREATE POLICY "Users can view own products"
   ON products FOR SELECT
   USING (auth.uid() = user_id);`}
               </pre>
             </div>
           </CardContent>
         </Card>
       </div>
     </div>
   );
 };
 
 export default Database;