 import { useEffect, useRef } from "react";
 import { Card } from "@/components/ui/card";
 import { AlertCircle } from "lucide-react";
 
 type CodePreviewProps = {
   code: string;
   language: string;
 };
 
 export function CodePreview({ code, language }: CodePreviewProps) {
   const iframeRef = useRef<HTMLIFrameElement>(null);
 
   useEffect(() => {
     if (!iframeRef.current) return;
 
     const isHTML = language === "html";
     const isCSS = language === "css";
     const isJS = language === "javascript" || language === "typescript";
 
     let content = "";
 
     if (isHTML) {
       content = `
         <!DOCTYPE html>
         <html>
           <head>
             <meta charset="UTF-8">
             <meta name="viewport" content="width=device-width, initial-scale=1.0">
             <style>body { margin: 0; padding: 16px; font-family: system-ui; }</style>
           </head>
           <body>${code}</body>
         </html>
       `;
     } else if (isCSS) {
       content = `
         <!DOCTYPE html>
         <html>
           <head>
             <meta charset="UTF-8">
             <meta name="viewport" content="width=device-width, initial-scale=1.0">
             <style>${code}</style>
           </head>
           <body>
             <div style="padding: 16px;">
               <h1>نموذج CSS</h1>
               <p>هذا نص تجريبي لعرض تأثير CSS</p>
               <button>زر تجريبي</button>
             </div>
           </body>
         </html>
       `;
     } else if (isJS) {
       content = `
         <!DOCTYPE html>
         <html>
           <head>
             <meta charset="UTF-8">
             <meta name="viewport" content="width=device-width, initial-scale=1.0">
             <style>
              body { margin: 0; padding: 16px; font-family: system-ui; background: #0f0f0f; color: #e5e5e5; }
              pre { background: #1a1a1a; padding: 12px; border-radius: 4px; overflow-x: auto; border: 1px solid #333; }
             </style>
           </head>
           <body>
             <pre id="output">جاري تنفيذ الكود...</pre>
             <script>
               const output = document.getElementById('output');
               const originalLog = console.log;
               let logs = [];
               
               console.log = function(...args) {
                 logs.push(args.join(' '));
                 output.textContent = logs.join('\\n');
                 originalLog.apply(console, args);
               };
               
               try {
                 ${code}
                 if (logs.length === 0) {
                   output.textContent = 'تم تنفيذ الكود بنجاح (لا يوجد مخرجات)';
                 }
               } catch (e) {
                 output.textContent = 'خطأ: ' + e.message;
                output.style.color = '#ef4444';
               }
             </script>
           </body>
         </html>
       `;
     }
 
     if (content) {
       const doc = iframeRef.current.contentDocument;
       if (doc) {
         doc.open();
         doc.write(content);
         doc.close();
       }
     }
   }, [code, language]);
 
   const canPreview = ["html", "css", "javascript", "typescript"].includes(language);
 
   if (!canPreview) {
     return (
       <Card className="flex h-full items-center justify-center p-8 bg-muted/30">
         <div className="text-center space-y-2">
           <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
           <p className="text-muted-foreground">المعاينة متاحة فقط لملفات HTML و CSS و JavaScript</p>
         </div>
       </Card>
     );
   }
 
   return (
     <iframe
       ref={iframeRef}
       className="w-full h-full bg-white dark:bg-gray-900 rounded-lg border border-border"
       title="معاينة الكود"
       sandbox="allow-scripts"
     />
   );
 }