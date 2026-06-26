import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Moodboard from "./pages/Moodboard";
import VibeCheck from "./pages/VibeCheck";
import Goals from "./pages/Goals";
import Auth from "./pages/Auth";
import Pomodoro from "./pages/Pomodoro";
import NotFound from "./pages/NotFound";
import WelcomeBack from "./pages/WelcomeBack";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Temporarily bypassing auth - remove this to re-enable login
  return <>{children}</>;
};

/**
 * Route guard: authenticated users hitting the library entry (`/`) are
 * redirected to `/welcome-back` unless they explicitly arrived via the
 * Back button from Welcome Back (state.fromLibraryBack) or chose to skip
 * sign-in from /auth (state.skipToWizard).
 */
const LibraryEntryGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  const state = (location.state ?? {}) as { fromLibraryBack?: boolean; skipToWizard?: boolean };
  const explicitlyAllowed = state.fromLibraryBack === true || state.skipToWizard === true;
  if (user && !explicitlyAllowed) {
    return <Navigate to="/welcome-back" replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/moodboard" element={<ProtectedRoute><Moodboard /></ProtectedRoute>} />
          <Route path="/vibe-check" element={<ProtectedRoute><VibeCheck /></ProtectedRoute>} />
          <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
          <Route path="/pomodoro" element={<ProtectedRoute><Pomodoro /></ProtectedRoute>} />
          <Route path="/welcome-back" element={<ProtectedRoute><WelcomeBack /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
