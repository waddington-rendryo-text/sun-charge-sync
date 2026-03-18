import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import AppHeader from "@/components/AppHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import ClienteDashboard from "./pages/ClienteDashboard";
import PostoDashboard from "./pages/PostoDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <AppHeader />
    {children}
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-right" richColors />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout><Index /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cliente"
              element={
                <ProtectedRoute requiredRole="cliente">
                  <AppLayout><ClienteDashboard /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/posto"
              element={
                <ProtectedRoute requiredRole="posto">
                  <AppLayout><PostoDashboard /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
