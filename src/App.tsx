import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import WelcomeBack from "./pages/WelcomeBack";
import Goals from "./pages/Goals";
import Moodboard from "./pages/Moodboard";
import VibeCheck from "./pages/VibeCheck";
import Pomodoro from "./pages/Pomodoro";
import NotFound from "./pages/NotFound";
import FloatingNav from "./components/FloatingNav";
import "@/lib/googleCalendarAccess";

const queryClient = new QueryClient();

const ConditionalNav = () => {
  const location = useLocation();
  if (location.pathname === "/auth") return null;
  return <FloatingNav />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
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
      <BrowserRouter>
        <TokenCapture />
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
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
