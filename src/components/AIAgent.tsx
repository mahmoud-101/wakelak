import { useMemo, useState } from "react";
import { Bot, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type FileChange = {
  path: string;
  content: string;
};

export type AIAgentProps = {
  owner: string;
  repo: string;
  disabled?: boolean;
  onApplyChanges: (changes: FileChange[]) => Promise<void>;
};

export default function AIAgent({ owner, repo, disabled, onApplyChanges }: AIAgentProps) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);

  const examples = useMemo(
    () =>
      [
        "أضف زر login في الصفحة الرئيسية",
        "أنشئ صفحة /about بتصميم بسيط ومتجاوب",
        "حوّل زر الحفظ في المحرر إلى disabled أثناء التحميل",
        "أضف validation لحقول البريد وكلمة المرور باستخدام zod",
      ],
    [],
  );

  const run = async () => {
    const clean = prompt.trim();
    if (!clean) return;
    if (!owner || !repo) {
      toast({ variant: "destructive", title: "خطأ", description: "اربط المشروع بـ Repo أولاً." });
      return;
    }

    setIsRunning(true);
    setLastSuccess(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-code-agent", {
        body: { prompt: clean, owner, repo },
      });

      if (error) throw error;
      const changes = (data?.changes ?? []) as FileChange[];
      if (!Array.isArray(changes) || changes.length === 0) {
        throw new Error("لم يتم إرجاع أي تعديلات.");
      }

      await onApplyChanges(changes);
      setLastSuccess(`تم تنفيذ الأمر وتعديل ${changes.length} ملف`);
      toast({ title: "تم التنفيذ ✓", description: `تم حفظ ${changes.length} ملف على GitHub` });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "فشل التنفيذ",
        description: e instanceof Error ? e.message : "حدث خطأ غير معروف",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-3">
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-bold">AI Code Agent</h3>
            <p className="text-xs text-muted-foreground">اكتب أمراً وسيقوم الوكيل بتعديل الملفات وحفظها على GitHub.</p>
          </div>
          <Button size="sm" onClick={run} disabled={!!disabled || isRunning || !prompt.trim()}>
            {isRunning ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Bot className="ml-2 h-4 w-4" />}
            تنفيذ الأمر
          </Button>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-5">
          <div className="md:col-span-3">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='مثال: "أضف زر login في الصفحة الرئيسية"'
              className="min-h-[90px]"
              disabled={!!disabled || isRunning}
            />
          </div>

          <div className="md:col-span-2">
            <div className="text-xs font-medium mb-2">أمثلة سريعة:</div>
            <div className="space-y-2">
              {examples.map((ex) => (
                <Button
                  key={ex}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-right h-auto whitespace-normal"
                  onClick={() => setPrompt(ex)}
                  disabled={!!disabled || isRunning}
                >
                  {ex}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {lastSuccess && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-foreground">{lastSuccess}</span>
          </div>
        )}
      </Card>
    </div>
  );
}
