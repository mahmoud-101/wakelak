import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Projects from "./pages/Projects";
import Database from "./pages/Database";
import Deploy from "./pages/Deploy";
import History from "./pages/History";
import Integrations from "./pages/Integrations";
import GitHubSetup from "./pages/GitHubSetup";
import Editor from "./pages/Editor";

const queryClient = new QueryClient();

const App = () => {
  // إضافة console.log للتأكد إن التطبيق شغال
  console.log("App component rendered 🚀");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/database" element={<Database />} />
            <Route path="/deploy" element={<Deploy />} />
            <Route path="/history" element={<History />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/github-setup" element={<GitHubSetup />} />
            <Route path="/editor" element={<Editor />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;