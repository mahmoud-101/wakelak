import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Index() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-10">
        <Card className="w-full max-w-xl p-6">
          <header className="space-y-2">
            <h1 className="text-xl font-bold text-foreground">Wakelak — محرر + دردشة مطوّر</h1>
            <p className="text-sm text-muted-foreground">
              افتح المشاريع، ثم ادخل للمحرر واستخدم “دردشة المطوّر” لمراجعة المشروع واقتراح تعديلات قابلة للتطبيق.
            </p>
          </header>

          <section className="mt-6 flex flex-col gap-3">
            <Button onClick={() => navigate("/projects")} className="w-full">
              فتح المشاريع
            </Button>
            <Button variant="outline" onClick={() => navigate("/integrations")} className="w-full">
              التكاملات والإعدادات
            </Button>
            <Button variant="ghost" onClick={() => navigate("/auth")} className="w-full">
              تسجيل الدخول
            </Button>
          </section>
        </Card>
      </div>
    </main>
  );
}
