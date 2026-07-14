import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import WelcomeBack from "./pages/WelcomeBack";
import Goals from "./pages/Goals";
import Moodboard from "./pages/Moodboard";
import VibeCheck from "./pages/VibeCheck";
import Pomodoro from "./pages/Pomodoro";
import NotFound from "./pages/NotFound";
import FloatingNav from "./components/FloatingNav";
import DevLabel from "./components/DevLabel";
import { DevLabelProvider } from "./contexts/DevLabelContext";
import { supabase } from "@/integrations/supabase/client";
import "@/lib/googleCalendarAccess";

const queryClient = new QueryClient();

const ConditionalNav = () => {
  const location = useLocation();
  if (location.pathname === "/auth") return null;
  return <FloatingNav />;
};

const TokenCapture = () => {
  useEffect(() => {
    const saveTokens = async (session: any) => {
      if (!session) return;
      const refreshToken = session.provider_refresh_token;
      const accessToken = session.provider_token;
      if (refreshToken || accessToken) {
        await supabase.functions.invoke("google-token-save", {
          body: {
            refresh_token: refreshToken ?? null,
            access_token: accessToken ?? null,
            expires_in: 3600,
            scope:
              "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly",
          },
        });
      }
    };

    // Capture tokens from existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      saveTokens(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        await saveTokens(session);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <DevLabelProvider>
        <BrowserRouter>
          <TokenCapture />
          <DevLabel />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/welcome-back" element={<WelcomeBack />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/moodboard" element={<Moodboard />} />
            <Route path="/vibe-check" element={<VibeCheck />} />
            <Route path="/pomodoro" element={<Pomodoro />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ConditionalNav />
        </BrowserRouter>
      </DevLabelProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
