 import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Save, RefreshCw, Github, FileCode, AlertCircle, Eye, EyeOff } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card } from "@/components/ui/card";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Textarea } from "@/components/ui/textarea";
 import { useGitHub } from "@/hooks/useGitHub";
 import Editor from "@monaco-editor/react";
import { CodePreview } from "@/components/CodePreview";
 
 const EditorPage = () => {
   const navigate = useNavigate();
  const location = useLocation();
   const { files, currentFile, isLoading, loadRepository, loadFile, saveFile, fixError } = useGitHub();
  const project = location.state?.project;
  const [owner, setOwner] = useState(project?.github_owner || "");
  const [repo, setRepo] = useState(project?.github_repo || "");
  const [connected, setConnected] = useState(!!project?.github_repo);
   const [code, setCode] = useState("");
   const [errorInput, setErrorInput] = useState("");
  const [showPreview, setShowPreview] = useState(false);
 
   const handleConnect = () => {
     if (owner && repo) {
       loadRepository(owner, repo);
       setConnected(true);
     }
   };
 
   const handleFileClick = (path: string) => {
     if (owner && repo) {
       loadFile(owner, repo, path);
     }
   };
 
   const handleSave = () => {
     if (owner && repo && currentFile) {
       saveFile(owner, repo, currentFile.path, code);
     }
   };
 
   const handleFixError = async () => {
     if (currentFile && errorInput) {
       const fixed = await fixError(code, errorInput, currentFile.path);
       if (fixed) {
         setCode(fixed);
         setErrorInput("");
       }
     }
   };
 
   const getLanguage = (path: string) => {
     const ext = path.split(".").pop();
     const langMap: Record<string, string> = {
       ts: "typescript",
       tsx: "typescript",
       js: "javascript",
       jsx: "javascript",
       json: "json",
       css: "css",
       html: "html",
       md: "markdown",
     };
     return langMap[ext || ""] || "plaintext";
   };
 
   if (currentFile && code !== currentFile.content) {
     setCode(currentFile.content);
   }
 
   return (
     <div className="flex h-screen flex-col bg-background" dir="rtl">
       {/* Header */}
       <header className="border-b border-border bg-card/50 backdrop-blur-sm">
         <div className="container mx-auto flex h-16 items-center gap-3 px-4">
           <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
           </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/projects")} className="mr-2">
            المشاريع
          </Button>
           <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
             <FileCode className="h-6 w-6 text-primary-foreground" />
           </div>
           <div>
             <h1 className="text-lg font-bold text-foreground">محرر الأكواد</h1>
             <p className="text-xs text-muted-foreground">تطوير وإصلاح تلقائي</p>
           </div>
         </div>
       </header>
 
       {!connected ? (
         <div className="flex flex-1 items-center justify-center p-4">
           <Card className="w-full max-w-md p-6 space-y-4">
             <div className="flex items-center gap-3 mb-4">
               <Github className="h-8 w-8 text-primary" />
               <h2 className="text-xl font-bold">اتصل بـ GitHub</h2>
             </div>
             <Input
               placeholder="اسم المالك (owner)"
               value={owner}
               onChange={(e) => setOwner(e.target.value)}
             />
             <Input
               placeholder="اسم المستودع (repository)"
               value={repo}
               onChange={(e) => setRepo(e.target.value)}
             />
             <Button onClick={handleConnect} disabled={!owner || !repo || isLoading} className="w-full">
               <Github className="ml-2 h-4 w-4" />
               اتصل بالمستودع
             </Button>
           </Card>
         </div>
       ) : (
         <div className="flex flex-1 overflow-hidden">
           {/* Sidebar */}
           <div className="w-64 border-l border-border bg-card/50">
             <div className="p-3 border-b border-border">
               <p className="text-sm font-medium truncate">{owner}/{repo}</p>
             </div>
             <ScrollArea className="h-[calc(100vh-8rem)]">
               <div className="p-2 space-y-1">
                 {files.map((file) => (
                   <Button
                     key={file.path}
                     variant={currentFile?.path === file.path ? "secondary" : "ghost"}
                     className="w-full justify-start text-right"
                     size="sm"
                     onClick={() => handleFileClick(file.path)}
                   >
                     <FileCode className="ml-2 h-4 w-4" />
                     <span className="truncate text-xs">{file.path}</span>
                   </Button>
                 ))}
               </div>
             </ScrollArea>
           </div>
 
           {/* Editor */}
           <div className="flex-1 flex flex-col">
             {currentFile ? (
               <>
                 <div className="flex items-center gap-2 p-3 border-b border-border bg-card/50">
                   <span className="text-sm font-medium flex-1">{currentFile.path}</span>
                   <Button size="sm" onClick={handleSave} disabled={isLoading}>
                     <Save className="ml-2 h-4 w-4" />
                     حفظ
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowPreview(!showPreview)}>
                    {showPreview ? <EyeOff className="ml-2 h-4 w-4" /> : <Eye className="ml-2 h-4 w-4" />}
                    {showPreview ? "إخفاء المعاينة" : "معاينة"}
                   </Button>
                 </div>
                <div className="flex-1 flex gap-2">
                  <div className={showPreview ? "flex-1" : "w-full"}>
                   <Editor
                     height="100%"
                     language={getLanguage(currentFile.path)}
                     value={code}
                     onChange={(value) => setCode(value || "")}
                     theme="vs-dark"
                     options={{
                       minimap: { enabled: false },
                       fontSize: 14,
                       lineNumbers: "on",
                       scrollBeyondLastLine: false,
                       automaticLayout: true,
                       tabSize: 2,
                     }}
                   />
                  </div>
                  {showPreview && (
                    <div className="flex-1 border-r border-border">
                      <CodePreview code={code} language={getLanguage(currentFile.path)} />
                    </div>
                  )}
                 </div>
                 <div className="border-t border-border bg-card/50 p-3">
                   <div className="flex gap-2">
                     <Textarea
                       placeholder="الصق رسالة الخطأ هنا للإصلاح التلقائي..."
                       value={errorInput}
                       onChange={(e) => setErrorInput(e.target.value)}
                       className="min-h-[60px] resize-none flex-1"
                     />
                     <Button
                       onClick={handleFixError}
                       disabled={!errorInput || isLoading}
                       size="icon"
                       className="h-[60px] w-[60px] shrink-0"
                     >
                       <RefreshCw className="h-5 w-5" />
                     </Button>
                   </div>
                 </div>
               </>
             ) : (
               <div className="flex flex-1 items-center justify-center text-muted-foreground">
                 <div className="text-center space-y-2">
                   <AlertCircle className="h-12 w-12 mx-auto opacity-50" />
                   <p>اختر ملفاً من القائمة الجانبية</p>
                 </div>
               </div>
             )}
           </div>
         </div>
       )}
     </div>
   );
 };
 
 export default EditorPage;