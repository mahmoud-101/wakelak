 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Alert, AlertDescription } from "@/components/ui/alert";
 import { Github, ExternalLink, CheckCircle2, Copy, AlertTriangle } from "lucide-react";
 import { useNavigate } from "react-router-dom";
 import { useToast } from "@/hooks/use-toast";
 
 const GitHubSetup = () => {
   const navigate = useNavigate();
   const { toast } = useToast();
   const redirectUrl = `${window.location.origin}/integrations`;
 
   const copyToClipboard = (text: string) => {
     navigator.clipboard.writeText(text);
     toast({ title: "تم النسخ!", description: "تم نسخ الرابط" });
   };
 
   return (
     <div className="min-h-screen bg-background" dir="rtl">
       <header className="border-b border-border bg-card/50 backdrop-blur-sm">
         <div className="container mx-auto flex h-16 items-center gap-3 px-4">
           <Button variant="ghost" size="icon" onClick={() => navigate("/integrations")}>
             <span className="text-2xl">←</span>
           </Button>
           <div>
             <h1 className="text-lg font-bold text-foreground">إعداد GitHub OAuth</h1>
             <p className="text-xs text-muted-foreground">خطوات تكوين التطبيق</p>
           </div>
         </div>
       </header>
 
       <div className="container mx-auto max-w-4xl px-4 py-8">
         <Alert className="mb-6 border-primary/50 bg-primary/10">
           <AlertTriangle className="h-4 w-4 text-primary" />
           <AlertDescription>
             يجب إعداد GitHub OAuth Application أولاً لتتمكن من ربط حسابك
           </AlertDescription>
         </Alert>
 
         <Card className="mb-6">
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Github className="h-6 w-6" />
               الخطوة 1: إنشاء GitHub OAuth App
             </CardTitle>
             <CardDescription>
               قم بإنشاء تطبيق OAuth جديد على GitHub
             </CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <ol className="space-y-3 text-sm">
               <li className="flex gap-2">
                 <span className="text-primary font-bold">1.</span>
                 <span>اذهب إلى GitHub → Settings → Developer settings</span>
               </li>
               <li className="flex gap-2">
                 <span className="text-primary font-bold">2.</span>
                 <span>اختر "OAuth Apps" ثم انقر "New OAuth App"</span>
               </li>
               <li className="flex gap-2">
                 <span className="text-primary font-bold">3.</span>
                 <div className="flex-1">
                   <p className="mb-2">املأ البيانات التالية:</p>
                   <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
                     <div>
                       <p className="font-medium text-xs mb-1">Application name:</p>
                       <code className="text-xs bg-background px-2 py-1 rounded">Lovable Dev Agent</code>
                     </div>
                     <div>
                       <p className="font-medium text-xs mb-1">Homepage URL:</p>
                       <div className="flex items-center gap-2">
                         <code className="text-xs bg-background px-2 py-1 rounded flex-1">{window.location.origin}</code>
                         <Button size="sm" variant="ghost" onClick={() => copyToClipboard(window.location.origin)}>
                           <Copy className="h-3 w-3" />
                         </Button>
                       </div>
                     </div>
                     <div>
                       <p className="font-medium text-xs mb-1">Authorization callback URL:</p>
                       <div className="flex items-center gap-2">
                         <code className="text-xs bg-background px-2 py-1 rounded flex-1">{redirectUrl}</code>
                         <Button size="sm" variant="ghost" onClick={() => copyToClipboard(redirectUrl)}>
                           <Copy className="h-3 w-3" />
                         </Button>
                       </div>
                     </div>
                   </div>
                 </div>
               </li>
             </ol>
             <Button 
               onClick={() => window.open("https://github.com/settings/developers", "_blank")}
               className="w-full"
             >
               <ExternalLink className="ml-2 h-4 w-4" />
               فتح GitHub Developer Settings
             </Button>
           </CardContent>
         </Card>
 
         <Card className="mb-6">
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <CheckCircle2 className="h-6 w-6 text-primary" />
               الخطوة 2: نسخ البيانات
             </CardTitle>
             <CardDescription>
               انسخ Client ID و Client Secret من GitHub
             </CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <p className="text-sm text-muted-foreground">
               بعد إنشاء التطبيق، ستحصل على:
             </p>
             <ul className="space-y-2 text-sm">
               <li className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-primary" />
                 <strong>Client ID:</strong> معرف التطبيق العام
               </li>
               <li className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-primary" />
                 <strong>Client Secret:</strong> المفتاح السري (اضغط "Generate a new client secret")
               </li>
             </ul>
             <Alert>
               <AlertDescription className="text-xs">
                 ⚠️ احفظ Client Secret في مكان آمن - لن تتمكن من رؤيته مرة أخرى!
               </AlertDescription>
             </Alert>
           </CardContent>
         </Card>
 
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <CheckCircle2 className="h-6 w-6 text-success" />
               الخطوة 3: تحديث الأسرار
             </CardTitle>
             <CardDescription>
               قم بتحديث GITHUB_CLIENT_ID و GITHUB_CLIENT_SECRET في إعدادات المشروع
             </CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <p className="text-sm text-muted-foreground">
               بعد الحصول على البيانات من GitHub، اتبع الخطوات:
             </p>
             <ol className="space-y-2 text-sm">
               <li className="flex gap-2">
                 <span className="text-primary font-bold">1.</span>
                 <span>اذهب إلى إعدادات Lovable Cloud</span>
               </li>
               <li className="flex gap-2">
                 <span className="text-primary font-bold">2.</span>
                 <span>ابحث عن GITHUB_CLIENT_ID وقم بتحديثه</span>
               </li>
               <li className="flex gap-2">
                 <span className="text-primary font-bold">3.</span>
                 <span>ابحث عن GITHUB_CLIENT_SECRET وقم بتحديثه</span>
               </li>
               <li className="flex gap-2">
                 <span className="text-primary font-bold">4.</span>
                 <span>ارجع إلى صفحة التكاملات وحاول الربط مرة أخرى</span>
               </li>
             </ol>
             <div className="flex gap-3">
               <Button 
                 onClick={() => navigate("/integrations")}
                 className="flex-1"
               >
                 العودة للتكاملات
               </Button>
             </div>
           </CardContent>
         </Card>
       </div>
     </div>
   );
 };
 
 export default GitHubSetup;