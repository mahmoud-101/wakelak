 import { Github, Rocket, Database, ExternalLink, CheckCircle2, AlertCircle, Unlink } from "lucide-react";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { useGitHubAuth } from "@/hooks/useGitHubAuth";
 import { Separator } from "@/components/ui/separator";
 
 const Integrations = () => {
   const { connectGitHub, disconnectGitHub, isConnecting, isConnected, githubUsername, repos } = useGitHubAuth();
   
   const integrations = [
     {
       id: "github",
       name: "GitHub",
       icon: Github,
       description: "ربط المشروع بـ GitHub للتحكم بالإصدارات ومشاركة الكود",
       status: "available",
       color: "hsl(220 100% 65%)",
       features: [
         "مزامنة ثنائية الاتجاه مع GitHub",
         "إنشاء repository تلقائياً",
         "دعم Branches والـ Pull Requests",
         "GitHub Actions للـ CI/CD"
       ],
       steps: [
         "انقر على GitHub في القائمة العلوية",
         "اختر Connect to GitHub",
         "صرّح للتطبيق بالوصول لحسابك",
         "اختر المنظمة أو الحساب",
         "انقر Create Repository"
       ],
       docsUrl: "https://docs.lovable.dev/tips-tricks/github-integration"
     },
     {
       id: "vercel",
       name: "Vercel",
       icon: Rocket,
       description: "نشر المشروع على Vercel للاستضافة السريعة والموثوقة",
       status: "available",
       color: "hsl(0 0% 0%)",
       features: [
         "نشر تلقائي من GitHub",
         "Preview deployments لكل Pull Request",
         "CDN عالمي وأداء عالي",
         "SSL مجاني وDomain مخصص"
       ],
       steps: [
         "اربط المشروع بـ GitHub أولاً",
         "سجّل دخول على vercel.com",
         "اختر Import Project",
         "اختر Repository من GitHub",
         "اضبط إعدادات Build وانشر"
       ],
       docsUrl: "https://vercel.com/docs"
     },
     {
       id: "cloud",
       name: "Lovable Cloud",
       icon: Database,
       description: "Backend متكامل مع قاعدة بيانات ومصادقة وتخزين",
       status: "connected",
       color: "hsl(200 95% 50%)",
       features: [
         "قاعدة بيانات PostgreSQL",
         "نظام مصادقة كامل",
         "Edge Functions للـ Backend",
         "تخزين الملفات والصور"
       ],
       steps: [
         "✅ Cloud متصل بالفعل!",
         "يمكنك الوصول للـ Backend من الإعدادات",
         "استخدم الوكيل الذكي لإنشاء جداول",
         "راجع الـ Analytics والـ Logs"
       ],
       docsUrl: "https://docs.lovable.dev/features/cloud"
     }
   ];
 
   return (
     <div className="min-h-screen bg-background" dir="rtl">
       {/* Header */}
       <header className="border-b border-border bg-card/50 backdrop-blur-sm">
         <div className="container mx-auto flex h-16 items-center gap-3 px-4">
           <Button variant="ghost" size="icon" onClick={() => window.location.href = "/"}>
             <span className="text-2xl">←</span>
           </Button>
           <div>
             <h1 className="text-lg font-bold text-foreground">التكاملات</h1>
             <p className="text-xs text-muted-foreground">اربط مشروعك بأقوى المنصات</p>
           </div>
         </div>
       </header>
 
       {/* Content */}
       <div className="container mx-auto max-w-6xl px-4 py-8">
         <div className="mb-8">
           <h2 className="mb-2 text-2xl font-bold text-foreground">المنصات المتاحة</h2>
           <p className="text-muted-foreground">
             قم بربط مشروعك مع GitHub للتحكم بالإصدارات، Vercel للنشر السريع، و Cloud للـ Backend المتكامل
           </p>
         </div>
 
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           {integrations.map((integration) => (
             <Card key={integration.id} className="relative overflow-hidden flex flex-col">
               <div 
                 className="absolute left-0 top-0 h-1 w-full" 
                 style={{ backgroundColor: integration.color }}
               />
               <CardHeader>
                 <div className="flex items-start justify-between">
                   <div className="flex items-center gap-3">
                     <div 
                       className="flex h-12 w-12 items-center justify-center rounded-lg"
                       style={{ backgroundColor: `${integration.color}15` }}
                     >
                       <integration.icon 
                         className="h-6 w-6" 
                         style={{ color: integration.color }}
                       />
                     </div>
                     <div>
                       <CardTitle className="text-xl">{integration.name}</CardTitle>
                       {integration.status === "connected" ? (
                        <Badge className="mt-1 bg-success/20 text-success">
                           <CheckCircle2 className="ml-1 h-3 w-3" />
                           متصل
                         </Badge>
                       ) : (
                         <Badge variant="outline" className="mt-1">
                           <AlertCircle className="ml-1 h-3 w-3" />
                           متاح
                         </Badge>
                       )}
                     </div>
                   </div>
                 </div>
                 <CardDescription className="mt-3">{integration.description}</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4 flex-1 flex flex-col">
                 {/* GitHub-specific connection UI */}
                 {integration.id === "github" && (
                   <div className="space-y-4">
                     {!isConnected ? (
                       <>
                         <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                           <p className="text-sm text-foreground font-medium mb-2">✨ ربط تلقائي مع الوكيل الذكي</p>
                           <p className="text-xs text-muted-foreground">
                             عند الربط، سيتمكن الوكيل من قراءة وفهم جميع ملفات مشروعك والتطوير عليها مباشرة
                           </p>
                         </div>
                         <Button 
                           onClick={connectGitHub}
                           disabled={isConnecting}
                           className="w-full"
                         >
                           <Github className="ml-2 h-4 w-4" />
                           {isConnecting ? "جاري الربط..." : "ربط GitHub الآن"}
                         </Button>
                       </>
                     ) : (
                       <>
                         <div className="space-y-2">
                           <div className="flex items-center justify-between">
                             <span className="text-sm font-medium">الحساب:</span>
                             <Badge variant="secondary" className="gap-2">
                               <Github className="h-3 w-3" />
                               @{githubUsername}
                             </Badge>
                           </div>
                           <div className="flex items-center justify-between">
                             <span className="text-sm font-medium">المستودعات:</span>
                             <Badge variant="outline">{repos.length}</Badge>
                           </div>
                         </div>
                         
                         <Separator />
                         
                         {repos.length > 0 && (
                           <div className="space-y-2">
                             <p className="text-sm font-medium">المستودعات المتاحة للوكيل:</p>
                             <div className="max-h-32 overflow-y-auto space-y-1">
                               {repos.slice(0, 8).map((repo) => (
                                 <div 
                                   key={repo.fullName}
                                   className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-xs"
                                 >
                                   <span className="font-mono truncate">{repo.fullName}</span>
                                   {repo.private && <Badge variant="secondary" className="text-xs shrink-0">خاص</Badge>}
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}
                         
                         <Button 
                           onClick={disconnectGitHub}
                           variant="outline"
                           size="sm"
                           className="w-full"
                         >
                           <Unlink className="ml-2 h-4 w-4" />
                           فصل الربط
                         </Button>
                         <Separator />
                       </>
                     )}
                   </div>
                 )}
                 
                 <div>
                   <h4 className="mb-2 text-sm font-semibold text-foreground">المميزات:</h4>
                   <ul className="space-y-1">
                     {integration.features.map((feature, idx) => (
                       <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                         <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                         {feature}
                       </li>
                     ))}
                   </ul>
                 </div>
 
                 <div>
                   <h4 className="mb-2 text-sm font-semibold text-foreground">خطوات الربط:</h4>
                   <ol className="space-y-1">
                     {integration.steps.map((step, idx) => (
                       <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                         <span className="text-primary">{idx + 1}.</span>
                         {step}
                       </li>
                     ))}
                   </ol>
                 </div>
 
                 <Button 
                   variant="outline" 
                   className="w-full"
                   onClick={() => window.open(integration.docsUrl, '_blank')}
                 >
                   <ExternalLink className="ml-2 h-4 w-4" />
                   اقرأ التوثيق
                 </Button>
               </CardContent>
             </Card>
           ))}
         </div>
 
         {/* Tips Section */}
         <Card className="mt-8 border-primary/20 bg-primary/5">
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <span className="text-2xl">💡</span>
               نصائح مهمة
             </CardTitle>
           </CardHeader>
               <CardContent className="space-y-3 text-foreground">
             <div className="flex gap-3">
               <div className="text-2xl">🔄</div>
               <div>
                 <h4 className="font-semibold text-foreground">GitHub أولاً</h4>
                 <p className="text-sm text-muted-foreground">
                   يُنصح بربط GitHub قبل Vercel لتحصل على مزامنة تلقائية ونشر مستمر
                 </p>
               </div>
             </div>
             <div className="flex gap-3">
               <div className="text-2xl">⚡</div>
               <div>
                 <h4 className="font-semibold text-foreground">Lovable Cloud نشط</h4>
                 <p className="text-sm text-muted-foreground">
                   مشروعك متصل بالفعل بـ Cloud - يمكنك استخدام قاعدة البيانات والمصادقة فوراً
                 </p>
               </div>
             </div>
             <div className="flex gap-3">
               <div className="text-2xl">🤖</div>
               <div>
                 <h4 className="font-semibold text-foreground">استخدم الوكيل الذكي</h4>
                 <p className="text-sm text-muted-foreground">
                   اسأل الوكيل الذكي عن كيفية استخدام أي من هذه التكاملات وسيساعدك خطوة بخطوة
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
     </div>
   );
 };
 
 export default Integrations;