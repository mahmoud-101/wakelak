import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
 import { Bot, Mail, Lock, User } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card } from "@/components/ui/card";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
 
 const Auth = () => {
   const navigate = useNavigate();
  const [searchParams] = useSearchParams();
   const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
   const [loginEmail, setLoginEmail] = useState("");
   const [loginPassword, setLoginPassword] = useState("");
   const [signupEmail, setSignupEmail] = useState("");
   const [signupPassword, setSignupPassword] = useState("");
   const [signupName, setSignupName] = useState("");
   const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
 
   useEffect(() => {
     if (user) navigate("/projects");
    
    if (searchParams.get('reset') === 'true') {
      setShowUpdatePassword(true);
    }
  }, [user, navigate, searchParams]);
 
   const handleLogin = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsLoading(true);
     await signIn(loginEmail, loginPassword);
     setIsLoading(false);
   };
 
   const handleSignup = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsLoading(true);
     await signUp(signupEmail, signupPassword, signupName);
     setIsLoading(false);
   };
 
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "تم!", description: "تم تغيير كلمة المرور بنجاح" });
      setShowUpdatePassword(false);
      setNewPassword("");
      navigate("/projects");
    } catch (error: any) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تغيير كلمة المرور" });
    }
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      if (error) throw error;
      toast({ title: "تم!", description: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني" });
      setShowResetPassword(false);
      setResetEmail("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إرسال رابط إعادة التعيين" });
    }
    setIsLoading(false);
  };

   return (
     <div className="flex min-h-screen items-center justify-center bg-background p-4" dir="rtl">
       <Card className="w-full max-w-md p-6 space-y-6">
         <div className="flex flex-col items-center gap-3 text-center">
           <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
             <Bot className="h-8 w-8 text-primary-foreground" />
           </div>
           <div>
             <h1 className="text-2xl font-bold text-foreground">وكيل التطوير الذكي</h1>
            <p className="text-sm text-muted-foreground">
              {showUpdatePassword ? "تحديث كلمة المرور" : showResetPassword ? "إعادة تعيين كلمة المرور" : "سجل دخولك للبدء"}
            </p>
           </div>
         </div>
 
        {showUpdatePassword ? (
          <form onSubmit={handleUpdatePassword} className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="كلمة المرور الجديدة (6 أحرف على الأقل)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "جاري التحديث..." : "تحديث كلمة المرور"}
            </Button>
          </form>
        ) : showResetPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="البريد الإلكتروني"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="pr-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setShowResetPassword(false)}
            >
              العودة لتسجيل الدخول
            </Button>
          </form>
        ) : (
         <Tabs defaultValue="login" className="w-full">
           <TabsList className="grid w-full grid-cols-2">
             <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
             <TabsTrigger value="signup">إنشاء حساب</TabsTrigger>
           </TabsList>
 
           <TabsContent value="login">
             <form onSubmit={handleLogin} className="space-y-4 mt-4">
               <div className="space-y-2">
                 <div className="relative">
                   <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                   <Input
                     type="email"
                     placeholder="البريد الإلكتروني"
                     value={loginEmail}
                     onChange={(e) => setLoginEmail(e.target.value)}
                     className="pr-10"
                     required
                   />
                 </div>
               </div>
               <div className="space-y-2">
                 <div className="relative">
                   <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                   <Input
                     type="password"
                     placeholder="كلمة المرور"
                     value={loginPassword}
                     onChange={(e) => setLoginPassword(e.target.value)}
                     className="pr-10"
                     required
                   />
                 </div>
               </div>
              <button
                type="button"
                onClick={() => setShowResetPassword(true)}
                className="text-sm text-primary hover:underline"
              >
                نسيت كلمة المرور؟
              </button>
               <Button type="submit" className="w-full" disabled={isLoading}>
                 {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
               </Button>
             </form>
           </TabsContent>
 
           <TabsContent value="signup">
             <form onSubmit={handleSignup} className="space-y-4 mt-4">
               <div className="space-y-2">
                 <div className="relative">
                   <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                   <Input
                     type="text"
                     placeholder="الاسم الكامل"
                     value={signupName}
                     onChange={(e) => setSignupName(e.target.value)}
                     className="pr-10"
                     required
                   />
                 </div>
               </div>
               <div className="space-y-2">
                 <div className="relative">
                   <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                   <Input
                     type="email"
                     placeholder="البريد الإلكتروني"
                     value={signupEmail}
                     onChange={(e) => setSignupEmail(e.target.value)}
                     className="pr-10"
                     required
                   />
                 </div>
               </div>
               <div className="space-y-2">
                 <div className="relative">
                   <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                   <Input
                     type="password"
                     placeholder="كلمة المرور (6 أحرف على الأقل)"
                     value={signupPassword}
                     onChange={(e) => setSignupPassword(e.target.value)}
                     className="pr-10"
                     required
                     minLength={6}
                   />
                 </div>
               </div>
               <Button type="submit" className="w-full" disabled={isLoading}>
                 {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
               </Button>
             </form>
           </TabsContent>
         </Tabs>
        )}
       </Card>
     </div>
   );
 };
 
 export default Auth;