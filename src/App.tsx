import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/dashboard/Dashboard";
import Tasks from "./pages/tasks/Tasks";
import Learning from "./pages/learning/Learning";
import Profile from "./pages/profile/Profile";
import Payments from "./pages/payments/Payments";
import Admin from "./pages/admin/Admin";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />

            <Route path="/welcome" element={
              <ProtectedRoute requireOnboarded={false}><Welcome /></ProtectedRoute>
            } />
            <Route path="/onboarding" element={
              <ProtectedRoute requireOnboarded={false}><Onboarding /></ProtectedRoute>
            } />

            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/learning" element={<Learning />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/payments" element={<Payments />} />
            </Route>

            <Route element={<ProtectedRoute requireAdmin><MainLayout /></ProtectedRoute>}>
              <Route path="/admin" element={<Admin />} />
            </Route>

            <Route path="/index" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
