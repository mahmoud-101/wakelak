import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Github,
  FileCode,
  AlertCircle,
  Eye,
  EyeOff,
  History,
  Terminal as TerminalIcon,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useGitHub } from "@/hooks/useGitHub";
import Editor from "@monaco-editor/react";
import { CodePreview } from "@/components/CodePreview";
import { useIsMobile } from "@/hooks/use-mobile";

const EditorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { files, currentFile, isLoading, loadRepository, loadFile, saveFile, fixError } = useGitHub();
  const project = location.state?.project;
  const isMobile = useIsMobile();

  const [owner, setOwner] = useState(project?.github_owner || "");
  const [repo, setRepo] = useState(project?.github_repo || "");
  const [connected, setConnected] = useState(!!project?.github_repo);
  const [code, setCode] = useState("");
  const [errorInput, setErrorInput] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  const autoLoadedRef = useRef(false);

  useEffect(() => {
    if (!connected) return;
    if (!owner || !repo) return;
    if (autoLoadedRef.current) return;
    autoLoadedRef.current = true;
    loadRepository(owner, repo);
  }, [connected, owner, repo, loadRepository]);

  const handleConnect = () => {
    if (owner && repo) {
      loadRepository(owner, repo);
      setConnected(true);
    }
  };

  const handleFileClick = (path: string) => {
    if (owner && repo) {
      loadFile(owner, repo, path);
      if (isMobile) {
        setIsSidebarOpen(false);
      }
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

  useEffect(() => {
    if (!currentFile) return;
    setCode(currentFile.content);
  }, [currentFile]);

  return (
    <div className="flex h-screen flex-col bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
        <div className="container mx-auto flex h-14 items-center gap-2 px-3">
          {!isMobile && (
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          {connected && isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shrink-0">
            <FileCode className="h-5 w-5 text-primary-foreground" />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className={`font-bold text-foreground truncate ${isMobile ? "text-sm" : "text-lg"}`}>
              {isMobile && currentFile ? currentFile.path : "محرر الأكواد"}
            </h1>
            {!isMobile && <p className="text-xs text-muted-foreground">تطوير وإصلاح تلقائي</p>}
          </div>

          {!isMobile && (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
                المشاريع
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/history", { state: { projectId: project?.id } })}
              >
                <History className="ml-2 h-4 w-4" />
                السجل
              </Button>
            </>
          )}

          {connected && currentFile && isMobile && (
            <Button size="sm" onClick={handleSave} disabled={isLoading}>
              <Save className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      {!connected ? (
        <div className="flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Github className="h-8 w-8 text-primary" />
              <h2 className="text-xl font-bold">اتصل بـ GitHub</h2>
            </div>
            <Input placeholder="اسم المالك (owner)" value={owner} onChange={(e) => setOwner(e.target.value)} />
            <Input placeholder="اسم المستودع (repository)" value={repo} onChange={(e) => setRepo(e.target.value)} />
            <Button onClick={handleConnect} disabled={!owner || !repo || isLoading} className="w-full">
              <Github className="ml-2 h-4 w-4" />
              اتصل بالمستودع
            </Button>
          </Card>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div
            className={`${
              isMobile
                ? `fixed inset-y-0 right-0 z-50 w-4/5 max-w-xs transform transition-transform duration-300 ${
                    isSidebarOpen ? "translate-x-0" : "translate-x-full"
                  }`
                : "w-64"
            } border-l border-border bg-card flex flex-col shrink-0`}
          >
            <div className="p-3 border-b border-border shrink-0">
              <p className="text-sm font-medium truncate">
                {owner}/{repo}
              </p>
              {isMobile && (
                <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setIsSidebarOpen(false)}>
                  <X className="ml-2 h-4 w-4" />
                  إغلاق
                </Button>
              )}
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {files.map((file) => (
                  <Button
                    key={file.path}
                    variant={currentFile?.path === file.path ? "secondary" : "ghost"}
                    className="w-full justify-start text-right"
                    size="sm"
                    onClick={() => handleFileClick(file.path)}
                  >
                    <FileCode className="ml-2 h-4 w-4 shrink-0" />
                    <span className="truncate text-xs">{file.path}</span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Overlay for mobile sidebar */}
          {isMobile && isSidebarOpen && (
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsSidebarOpen(false)} />
          )}

          {/* Editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {currentFile ? (
              <>
                {/* Editor Toolbar */}
                {!isMobile && (
                  <div className="flex items-center gap-2 p-3 border-b border-border bg-card/50 shrink-0">
                    <span className="text-sm font-medium flex-1 truncate">{currentFile.path}</span>
                    <Button size="sm" onClick={handleSave} disabled={isLoading}>
                      <Save className="ml-2 h-4 w-4" />
                      حفظ
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowPreview(!showPreview)}>
                      {showPreview ? <EyeOff className="ml-2 h-4 w-4" /> : <Eye className="ml-2 h-4 w-4" />}
                      {showPreview ? "إخفاء" : "معاينة"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowTerminal(!showTerminal)}>
                      <TerminalIcon className="ml-2 h-4 w-4" />
                      Terminal
                    </Button>
                  </div>
                )}

                {/* Mobile Toolbar */}
                {isMobile && (
                  <div className="flex items-center gap-1 p-2 border-b border-border bg-card/50 shrink-0 overflow-x-auto">
                    <Button size="sm" variant="outline" onClick={() => setShowPreview(!showPreview)}>
                      {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowTerminal(!showTerminal)}>
                      <TerminalIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Editor Area */}
                <div className={`flex gap-2 ${showTerminal ? "h-[calc(100%-200px)]" : "flex-1"} overflow-hidden`}>
                  <div className={showPreview && !isMobile ? "flex-1" : "w-full"}>
                    <Editor
                      height="100%"
                      language={getLanguage(currentFile.path)}
                      value={code}
                      onChange={(value) => setCode(value || "")}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: !isMobile },
                        fontSize: isMobile ? 12 : 14,
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: isMobile ? "on" : "off",
                      }}
                    />
                  </div>
                  {showPreview && !isMobile && (
                    <div className="flex-1 border-r border-border overflow-auto">
                      <CodePreview code={code} language={getLanguage(currentFile.path)} />
                    </div>
                  )}
                </div>

                {/* Terminal */}
                {showTerminal && (
                  <div className="h-[200px] border-t border-border bg-muted p-4 font-mono text-sm text-primary overflow-auto shrink-0">
                    <div className="mb-2">$ lovable@dev:~</div>
                    <div className="text-muted-foreground">Terminal جاهز للاستخدام...</div>
                  </div>
                )}

                {/* Error Fix Section */}
                <div className="border-t border-border bg-card/50 p-3 shrink-0">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="الصق رسالة الخطأ هنا للإصلاح التلقائي..."
                      value={errorInput}
                      onChange={(e) => setErrorInput(e.target.value)}
                      className={`resize-none flex-1 ${isMobile ? "min-h-[50px] text-sm" : "min-h-[60px]"}`}
                    />
                    <Button
                      onClick={handleFixError}
                      disabled={!errorInput || isLoading}
                      size="icon"
                      className={`shrink-0 ${isMobile ? "h-[50px] w-[50px]" : "h-[60px] w-[60px]"}`}
                    >
                      <RefreshCw className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-muted-foreground p-4">
                <div className="text-center space-y-2">
                  <AlertCircle className="h-12 w-12 mx-auto opacity-50" />
                  <p className="text-sm">اختر ملفاً من القائمة الجانبية</p>
                  {isMobile && (
                    <Button variant="outline" onClick={() => setIsSidebarOpen(true)} className="mt-4">
                      <Menu className="ml-2 h-4 w-4" />
                      فتح القائمة
                    </Button>
                  )}
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
