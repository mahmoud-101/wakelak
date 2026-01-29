import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, Check, Copy, Send, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useDevChat } from "@/hooks/useDevChat";
import { useToast } from "@/hooks/use-toast";

type ApplyChange = { path: string; content: string };

function extractApplyBlock(text: string): { message?: string; changes: ApplyChange[] } | null {
  // We support either:
  // ```apply\n{...json...}\n```
  // or ```json\n{...}\n```
  const match = text.match(/```(?:apply|json)\s*\n([\s\S]*?)\n```/m);
  if (!match?.[1]) return null;

  try {
    const parsed = JSON.parse(match[1]) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const obj = parsed as { message?: unknown; changes?: unknown };
    const changesRaw = Array.isArray(obj.changes) ? obj.changes : [];
    const changes = changesRaw
      .map((c) => {
        if (!c || typeof c !== "object") return null;
        const cc = c as { path?: unknown; content?: unknown };
        if (typeof cc.path !== "string" || typeof cc.content !== "string") return null;
        return { path: cc.path, content: cc.content } satisfies ApplyChange;
      })
      .filter(Boolean) as ApplyChange[];

    return { message: typeof obj.message === "string" ? obj.message : undefined, changes };
  } catch {
    return null;
  }
}

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

export function DevChatPanel({
  className,
  filePath,
  fileContent,
  onApplyChanges,
  onClose,
}: {
  className?: string;
  filePath?: string;
  fileContent?: string;
  onApplyChanges: (changes: ApplyChange[], message?: string) => Promise<void>;
  onClose?: () => void;
}) {
  const { toast } = useToast();
  const { messages, isLoading, sendMessage } = useDevChat();

  const [input, setInput] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [pendingApply, setPendingApply] = useState<{ changes: ApplyChange[]; message?: string } | null>(null);
  const scrollAreaRootRef = useRef<HTMLDivElement | null>(null);

  const lastAssistant = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.role === "assistant") return messages[i];
    }
    return null;
  }, [messages]);

  useEffect(() => {
    // auto-scroll to bottom
    const root = scrollAreaRootRef.current;
    if (!root) return;
    const viewport = root.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]");
    if (!viewport) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [messages.length, isLoading]);

  useEffect(() => {
    if (!lastAssistant?.content) {
      setPendingApply(null);
      return;
    }
    const extracted = extractApplyBlock(lastAssistant.content);
    if (extracted?.changes?.length) {
      setPendingApply({ changes: extracted.changes, message: extracted.message });
    } else {
      setPendingApply(null);
    }
  }, [lastAssistant?.content]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");

    // We append file context inline in the user content (no extra deps, minimal coupling).
    // The backend also receives githubContext already (in useDevChat).
    const payload = filePath
      ? `${text}\n\n---\nسياق الملف الحالي (للاسترشاد):\nPATH: ${filePath}\n\nCONTENT:\n\n\`\`\`tsx\n${(fileContent ?? "").slice(0, 12000)}\n\`\`\`\n---\n\nمطلوب منك: اشرح أولاً ثم ضع الكود. إذا اقترحت تعديلات ملفات، أضف في نهاية الرد بلوك واحد فقط بالشكل التالي:\n\n\`\`\`apply\n{\n  \"message\": \"سبب التغيير\",\n  \"changes\": [{\"path\": \"src/...\", \"content\": \"...\"}]\n}\n\`\`\``
      : `${text}\n\nمطلوب منك: اشرح أولاً ثم ضع الكود. إذا اقترحت تعديلات ملفات، أضف في نهاية الرد بلوك واحد فقط بالشكل التالي:\n\n\`\`\`apply\n{\n  \"message\": \"سبب التغيير\",\n  \"changes\": [{\"path\": \"src/...\", \"content\": \"...\"}]\n}\n\`\`\``;

    await sendMessage(payload);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const markdownComponents = useMemo(
    () => ({
      code: ({ children, className }: { children: unknown; className?: string }) => {
        const raw = String(children ?? "");
        const isBlock = Boolean(className);
        const key = `${isBlock ? "block" : "inline"}:${raw.slice(0, 64)}`;

        if (!isBlock) {
          return <code className="rounded bg-muted px-1 py-0.5 text-xs">{raw}</code>;
        }

        return (
          <div className="relative my-2 rounded-md border border-border bg-muted/40">
            <div className="absolute left-2 top-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={async () => {
                  try {
                    await copyToClipboard(raw);
                    setCopiedKey(key);
                    setTimeout(() => setCopiedKey((v) => (v === key ? null : v)), 1200);
                  } catch {
                    toast({ variant: "destructive", title: "خطأ", description: "تعذر النسخ" });
                  }
                }}
                aria-label="نسخ الكود"
              >
                {copiedKey === key ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <pre className="overflow-x-auto p-3 pt-10 text-xs leading-relaxed">
              <code className="whitespace-pre">{raw}</code>
            </pre>
          </div>
        );
      },
    }),
    [copiedKey, toast],
  );

  return (
    <Card className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)} dir="rtl">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-card/50 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Bot className="h-4 w-4 text-foreground" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">دردشة المطوّر</div>
            <div className="truncate text-[11px] text-muted-foreground">
              {filePath ? `ملف: ${filePath}` : "اسأل عن أخطاء/تحسينات المشروع"}
            </div>
          </div>
        </div>

        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            إغلاق
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1" ref={scrollAreaRootRef}>
        <div className="space-y-3 p-3">
          {messages.length === 0 && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              اكتب سؤالك هنا—سأراجع الأخطاء والتحسينات ثم أعطيك خطة “تطبيق”.
            </div>
          )}

          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            const bubble = isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted/40 text-foreground border border-border";
            const align = isUser ? "items-end" : "items-start";

            return (
              <div key={`${m.role}-${idx}`} className={cn("flex flex-col gap-1", align)}>
                <div className={cn("flex items-center gap-2 text-[11px] text-muted-foreground", isUser && "flex-row-reverse")}>
                  {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  <span>{isUser ? "أنت" : "الوكيل"}</span>
                </div>

                <div className={cn("max-w-[92%] rounded-xl px-3 py-2 text-sm", bubble)}>
                  <div className="prose prose-sm max-w-none prose-pre:m-0 prose-pre:bg-transparent prose-code:before:content-none prose-code:after:content-none">
                    <ReactMarkdown components={markdownComponents as any}>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              جارٍ الكتابة...
            </div>
          )}
        </div>
      </ScrollArea>

      {pendingApply?.changes?.length ? (
        <div className="border-t border-border bg-card/50 p-3">
          <div className="mb-2 text-xs text-muted-foreground">اقتراحات جاهزة للتطبيق:</div>
          <div className="mb-3 space-y-1">
            {pendingApply.changes.slice(0, 5).map((c) => (
              <div key={c.path} className="truncate rounded-md border border-border bg-muted/30 px-2 py-1 text-xs">
                {c.path}
              </div>
            ))}
            {pendingApply.changes.length > 5 && (
              <div className="text-xs text-muted-foreground">+ {pendingApply.changes.length - 5} ملفات أخرى…</div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={isLoading}
              onClick={async () => {
                try {
                  await onApplyChanges(pendingApply.changes, pendingApply.message);
                  toast({ title: "تم", description: "تم تطبيق التعديلات" });
                } catch (e) {
                  console.error(e);
                  toast({ variant: "destructive", title: "خطأ", description: "فشل تطبيق التعديلات" });
                }
              }}
            >
              تطبيق التعديلات
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // hide apply UI until next assistant response
                setPendingApply(null);
              }}
            >
              تجاهل
            </Button>
          </div>
        </div>
      ) : null}

      <div className="border-t border-border bg-card/50 p-3">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب سؤالك… (Enter للإرسال، Shift+Enter لسطر جديد)"
            className="min-h-[44px] resize-none"
            disabled={isLoading}
          />
          <Button
            size="icon"
            className="h-[44px] w-[44px] shrink-0"
            onClick={() => void handleSend()}
            disabled={isLoading || !input.trim()}
            aria-label="إرسال"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 text-[11px] text-muted-foreground">
          اكتب “راجع المشروع” لاقتراح تحسينات عامة، أو حدّد صفحة/ملف معيّن.
        </div>
      </div>
    </Card>
  );
}
