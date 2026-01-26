 import { useState } from "react";
 import { Bot, Send, Sparkles, Link2, Code2, LogIn, LogOut, User } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Textarea } from "@/components/ui/textarea";
 import { Card } from "@/components/ui/card";
 import { useDevChat } from "@/hooks/useDevChat";
 import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
 import { useAuth } from "@/hooks/useAuth";
 import { Badge } from "@/components/ui/badge";

const Index = () => {
   const { messages, isLoading, sendMessage } = useDevChat();
   const [input, setInput] = useState("");
  const navigate = useNavigate();
   const { user, isAuthenticated, signOut } = useAuth();
 
   const handleSend = () => {
     if (!input.trim() || isLoading) return;
     sendMessage(input);
     setInput("");
   };
 
   const handleKeyDown = (e: React.KeyboardEvent) => {
     if (e.key === "Enter" && !e.shiftKey) {
       e.preventDefault();
       handleSend();
     }
   };
 
  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md shadow-glow">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow">
            <Bot className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">وكيل التطوير الذكي</h1>
            <p className="text-xs text-muted-foreground">مساعدك الشخصي في تطوير المشاريع</p>
          </div>
          <div className="mr-auto">
            <div className="relative">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <div className="absolute inset-0 h-5 w-5 text-primary animate-ping opacity-20" />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/integrations")}>
            <Link2 className="ml-2 h-4 w-4" />
            التكاملات
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/editor")}>
            <Code2 className="ml-2 h-4 w-4" />
            المحرر
          </Button>
           {isAuthenticated && user ? (
             <div className="flex items-center gap-2">
               <Badge variant="secondary" className="gap-2">
                 <User className="h-3 w-3" />
                 {user.email?.split('@')[0]}
               </Badge>
               <Button variant="outline" size="sm" onClick={signOut}>
                 <LogOut className="ml-2 h-4 w-4" />
                 تسجيل خروج
               </Button>
             </div>
           ) : (
             <Button variant="default" size="sm" onClick={() => navigate("/auth")}>
               <LogIn className="ml-2 h-4 w-4" />
               تسجيل الدخول
             </Button>
           )}
        </div>
      </header>
 
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          {messages.length === 0 ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-glow">
                <Bot className="h-10 w-10 text-primary" />
              </div>
              <h2 className="mb-3 text-2xl font-bold text-foreground">مرحباً بك!</h2>
              <p className="mb-8 max-w-md text-muted-foreground">
                أنا وكيل التطوير الذكي. أساعدك في تطوير مشروعك، كتابة الكود، وحل المشاكل البرمجية.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Card className="cursor-pointer p-4 transition-all hover:shadow-glow hover:border-primary/50" onClick={() => setInput("كيف أبني نظام سلة تسوق؟")}>
                  <p className="text-sm text-foreground">كيف أبني نظام سلة تسوق؟</p>
                </Card>
                <Card className="cursor-pointer p-4 transition-all hover:shadow-glow hover:border-primary/50" onClick={() => setInput("ما هي أفضل الممارسات في React؟")}>
                  <p className="text-sm text-foreground">ما هي أفضل الممارسات في React؟</p>
                </Card>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 shadow-glow">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <Card className={`max-w-[80%] p-4 ${msg.role === "user" ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow" : "bg-card border-primary/20"}`}>
                    {msg.role === "user" ? (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
 
      {/* Input Area */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <div className="flex gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب سؤالك هنا... (اضغط Enter للإرسال)"
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[60px] w-[60px] shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
