import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, Shield, Zap } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Hero Section */}
      <header className="py-20 px-4 text-center bg-white border-b">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          أهلاً بك في تطبيق واكلك (Wakelak)
        </h1>
        <p className="text-xl text-slate-600 mb-8">
          الوكيل الذكي لتطوير تطبيقاتك بسرعة الصاروخ 🚀
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" className="font-bold">ابدأ الآن</Button>
          <Button size="lg" variant="outline">تعرف علينا</Button>
        </div>
      </header>

      {/* Features Section */}
      <main className="max-w-6xl mx-auto py-16 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <Zap className="w-12 h-12 mx-auto text-yellow-500 mb-2" />
              <CardTitle>سرعة فائقة</CardTitle>
            </CardHeader>
            <CardContent>
              بناء واجهات احترافية في ثواني باستخدام React و Tailwind.
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="w-12 h-12 mx-auto text-blue-500 mb-2" />
              <CardTitle>أمان تام</CardTitle>
            </CardHeader>
            <CardContent>
              ربط مباشر مع Supabase مع تفعيل سياسات الأمان RLS.
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Rocket className="w-12 h-12 mx-auto text-purple-500 mb-2" />
              <CardTitle>جاهز للنشر</CardTitle>
            </CardHeader>
            <CardContent>
              دعم كامل لـ GitHub و Vercel للنشر بضغطة زر واحدة.
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;