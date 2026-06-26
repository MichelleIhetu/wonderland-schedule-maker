import { useState, useEffect, useCallback, useMemo } from "react";
import SEO from "@/components/SEO";
import { useClockTick } from "@/hooks/useClockTick";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ImageIcon, Clock, LogOut, Target, ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import { getFormattedDate } from "@/lib/dayGreetings";
import { toast } from "sonner";
import SpiderWebBackground from "@/components/SpiderWebBackground";
import ThemeBackground from "@/components/ThemeBackground";
import WizardInterface from "@/components/WizardInterface";
import ScheduleDisplay from "@/components/ScheduleDisplay";
import ThemeSelector from "@/components/ThemeSelector";
import ThemeCustomizer, { CustomColors, defaultThemeColors } from "@/components/ThemeCustomizer";
import CheckInModal, { CheckInData } from "@/components/CheckInModal";
import { useHourlyCheckIn } from "@/hooks/useHourlyCheckIn";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { useSchedulePersistence, loadScheduleSnapshot } from "@/hooks/useSchedulePersistence";
import { UserSettings, backgroundThemes } from "@/types/schedule";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import CalendarAnalysisModal, { AnalyzedTask } from "@/components/CalendarAnalysisModal";
import { supabase } from "@/integrations/supabase/client";
import { requestGoogleCalendarAccessToken } from "@/lib/googleCalendarAccess";
import bunnyMascot from "@/assets/bunny-mascot.png";
import speechBubble from "@/assets/bunny-with-speech-bubble.png";

const defaultSettings: UserSettings = {
  energyLevel: "motivated",
  stressLevel: "medium",
  theme: "hearts",
  backgroundTheme: "gothic",
  wakeTime: "07:00",
  bedTime: "23:00",
};

type ViewMode = "landing" | "wizard" | "schedule";
const RESUME_CALENDAR_ANALYSIS_KEY = "resume_calendar_analysis";

const hexToHsl = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0 0% 0%";
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [viewMode, setViewMode] = useState<ViewMode>("landing");
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [customColors, setCustomColors] = useState<CustomColors>(defaultThemeColors.gothic);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [calendarAnalyzing, setCalendarAnalyzing] = useState(false);
  const [analyzedTasks, setAnalyzedTasks] = useState<AnalyzedTask[] | null>(null);

  useClockTick(viewMode === "landing");

  const { isLoading, sendMessage, generatedSchedule, setGeneratedSchedule } = useChat(settings);
  const { saveSchedule, loadTodaySchedule } = useSchedulePersistence(user?.id);

  const persistGoogleTokens = async (activeSession: any) => {
    const refreshToken = activeSession?.provider_refresh_token as string | undefined;
    if (!refreshToken) return;

    await supabase.functions.invoke("google-token-save", {
      body: {
        refresh_token: refreshToken,
        access_token: activeSession?.provider_token || null,
        expires_in: 3600,
        scope: "https://www.googleapis.com/auth/calendar.readonly",
      },
    });
  };

  // Load today's schedule on mount (works with or without auth via localStorage fallback)
  useEffect(() => {
    if (scheduleLoaded) return;
    loadTodaySchedule().then((result) => {
      if (result && result.schedule.length > 0) {
        setGeneratedSchedule(result.schedule);
        if (result.settings) setSettings(result.settings);
        setViewMode("schedule");
        toast.success("Welcome back! Your schedule is ready 🐰");
      }
      setScheduleLoaded(true);
    });
  }, [scheduleLoaded, loadTodaySchedule]);

  // Save schedule whenever it changes
  useEffect(() => {
    if (generatedSchedule.length > 0 && scheduleLoaded) {
      saveSchedule(generatedSchedule, settings);
    }
  }, [generatedSchedule, settings, scheduleLoaded]);

  const {
    minutesUntilNextCheckIn,
    completeCheckIn,
    skipCheckIn,
  } = useHourlyCheckIn({
    enabled: generatedSchedule.length > 0,
    intervalMinutes: 15,
    onCheckInDue: () => {
      navigate("/vibe-check", { state: { backgroundTheme: settings.backgroundTheme } });
    },
  });

  const currentTask = generatedSchedule[0]?.title;

  useEffect(() => {
    const state = location.state as any;
    if (state?.vibeCheckResult) {
      const result = state.vibeCheckResult;
      completeCheckIn({ mood: result.mood, energy: result.energy, taskUpdate: result.notes, needBreak: result.needBreak });
      if (result.mood === "struggling") toast("Hang in there! We've noted your vibe.", { icon: "💪" });
      else if (result.mood === "great") toast("You're killing it! Keep going!", { icon: "🔥" });
      else toast("Vibe check complete!", { icon: "✨" });
      if (result.adjustSchedule === "lighten" && generatedSchedule.length > 0) toast("Lightening your load — non-urgent tasks pushed back", { icon: "📋" });
      else if (result.adjustSchedule === "reschedule") { toast("Let's rebuild your schedule from here", { icon: "🔄" }); setGeneratedSchedule([]); setViewMode("wizard"); }
      if (result.needBreak) toast("Adding a break for you — take it easy!", { icon: "☕" });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Skip flow from Auth page: jump directly to the wizard (library scene).
  useEffect(() => {
    const state = location.state as any;
    if (state?.skipToWizard) {
      setViewMode("wizard");
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => { setCustomColors(defaultThemeColors[settings.backgroundTheme]); }, [settings.backgroundTheme]);

  // Auto-resume calendar analysis after returning from Google OAuth redirect.
  useEffect(() => {
    if (sessionStorage.getItem(RESUME_CALENDAR_ANALYSIS_KEY) === "1") {
      sessionStorage.removeItem(RESUME_CALENDAR_ANALYSIS_KEY);
      // Wait a tick for the auth state to settle, then resume.
      setTimeout(() => { runCalendarAnalysis(); }, 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-peppy-pink", "theme-ocean-calm", "theme-sunset-warm", "theme-forest-zen");
    if (settings.backgroundTheme !== "gothic") root.classList.add(`theme-${settings.backgroundTheme}`);
    root.style.setProperty("--primary", hexToHsl(customColors.primary));
    root.style.setProperty("--secondary", hexToHsl(customColors.secondary));
    root.style.setProperty("--accent", hexToHsl(customColors.accent));
    root.style.setProperty("--background", hexToHsl(customColors.background));
    root.style.setProperty("--card", hexToHsl(customColors.card));
    root.style.setProperty("--foreground", hexToHsl(customColors.foreground));
    root.style.setProperty("--card-foreground", hexToHsl(customColors.foreground));
    root.style.setProperty("--popover-foreground", hexToHsl(customColors.foreground));
  }, [settings.backgroundTheme, customColors]);

  const handleWizardComplete = (tasks: string) => { sendMessage(tasks); setViewMode("schedule"); };
  const handleClearSchedule = () => { setGeneratedSchedule([]); setViewMode("wizard"); };
  const handleStartPomodoro = () => { navigate("/pomodoro", { state: { schedule: generatedSchedule } }); };
  const handleBackToSchedule = () => { setViewMode("schedule"); };
  const handleResetColors = () => { setCustomColors(defaultThemeColors[settings.backgroundTheme]); };

  const handleCheckInSubmit = (data: CheckInData) => {
    completeCheckIn(data);
    if (data.mood === "struggling") toast("Hang in there! Consider taking a longer break.", { description: "It's okay to adjust your pace.", icon: "💪" });
    else if (data.mood === "great") toast("Amazing! Keep up the great work!", { description: "You're doing wonderfully!", icon: "🌟" });
    else toast("Check-in complete!", { description: "Keep going, you've got this!", icon: "✨" });
    if (data.needBreak) toast("Taking a longer break", { description: "Enjoy your rest time!", icon: "☕" });
  };

  if (generatedSchedule.length > 0 && viewMode === "landing") setViewMode("schedule");

  const playBing = () => {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    // Layer multiple tones for a chime effect
    [1046, 1318, 1568].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      const offset = i * 0.08;
      osc.frequency.setValueAtTime(freq, now + offset);
      gain.gain.setValueAtTime(0.2, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.6);
      osc.start(now + offset);
      osc.stop(now + offset + 0.6);
    });
  };

  const todayDate = useMemo(() => getFormattedDate(), []);

  const handleStart = () => { playBing(); navigate("/welcome-back"); };
  const handleBackToLanding = () => { if (generatedSchedule.length === 0) setViewMode("landing"); };

  const runCalendarAnalysis = async () => {
    if (calendarAnalyzing) return;
    setCalendarAnalyzing(true);
    let calendarConsentAttempted = false;

    const requestCalendarConsent = async (): Promise<string | null> => {
      if (calendarConsentAttempted) {
        toast.error("Google sign-in finished, but Calendar access still is not available. Please check the app's Google Calendar setup before trying again.");
        return null;
      }

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        toast("Opening Google Calendar permission…", { icon: "🔐" });
        calendarConsentAttempted = true;
        const tokenResult = await requestGoogleCalendarAccessToken();
        if (!tokenResult.accessToken) {
          toast.error(tokenResult.error || "Google Calendar access was not granted.");
          return null;
        }
        return tokenResult.accessToken;
      }

      toast("Opening Google sign-in first…", { icon: "🔐" });
      calendarConsentAttempted = true;
      sessionStorage.setItem(RESUME_CALENDAR_ANALYSIS_KEY, "1");
      const { lovable } = await import("@/integrations/lovable");
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
        extraParams: {
          prompt: "consent",
          access_type: "offline",
          include_granted_scopes: "true",
          scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly",
        },
      });

      if (result.error) {
        sessionStorage.removeItem(RESUME_CALENDAR_ANALYSIS_KEY);
        toast.error(result.error.message || "Could not start Google sign-in");
        return null;
      }

      if (result.redirected) return null;

      const { data: { session: refreshedSession } } = await supabase.auth.getSession();
      await persistGoogleTokens(refreshedSession);
      return null;
    };

    try {
      // Check existing session. The backend can use saved refresh tokens even
      // when the current session no longer has a provider_token.
      let { data: { session } } = await supabase.auth.getSession();
      await persistGoogleTokens(session);

      if (!session) {
        await requestCalendarConsent();
        return;
      }




      // Scan full month (31-day horizon).
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(start); end.setDate(end.getDate() + 31);

      toast("Scanning the next 31 days of your calendar…", { icon: "🔍" });

      const fetchCalendar = async (calendarAccessToken?: string) => {
        const { data: { session: latestSession } } = await supabase.auth.getSession();
        await persistGoogleTokens(latestSession);
        const headers: Record<string, string> = {};
        const tokenToUse = calendarAccessToken || latestSession?.provider_token;
        if (tokenToUse) headers["x-provider-token"] = tokenToUse;

        return supabase.functions.invoke("google-calendar", {
          headers,
          body: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timeMin: start.toISOString(),
            timeMax: end.toISOString(),
          },
        });
      };

      let { data: calData, error: calErr } = await fetchCalendar();
      if (calData?.needsAuth) {
        if (calData?.events?.length) {
          toast("Using your saved calendar while refreshing permissions…", { icon: "📅" });
        } else {
          toast("Calendar permission needs to be refreshed.", { icon: "📅" });
        }
        const calendarAccessToken = await requestCalendarConsent();
        if (!calendarAccessToken) return;

        ({ data: calData, error: calErr } = await fetchCalendar(calendarAccessToken));
        if (calData?.needsAuth) {
          toast.error(calData?.error || "Calendar permission still needs approval");
          return;
        }
      }
      if (calErr || calData?.error) {
        toast.error(calData?.error || "Failed to fetch calendar");
        setCalendarAnalyzing(false);
        return;
      }
      const allEvents = calData?.events ?? [];

      // Smart fallback: try today → this week → this month
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);

      const getEventDate = (ev: any): string | null => {
        const raw = ev?.date ?? ev?.startTime ?? ev?.start ?? null;
        if (!raw) return null;
        try { return new Date(raw).toISOString().slice(0, 10); } catch { return null; }
      };

      const inRange = (ev: any, fromStr: string, toStr: string) => {
        const d = getEventDate(ev);
        return !!d && d >= fromStr && d <= toStr;
      };

      let scope: "today" | "week" | "month" = "today";
      let events = allEvents.filter((e: any) => inRange(e, todayStr, todayStr));
      if (events.length === 0) {
        const weekEndStr = weekEnd.toISOString().slice(0, 10);
        events = allEvents.filter((e: any) => inRange(e, todayStr, weekEndStr));
        scope = "week";
      }
      if (events.length === 0) {
        events = allEvents;
        scope = "month";
      }

      const scopeLabel = scope === "today" ? "today" : scope === "week" ? "this week" : "this month";
      toast(`Nothing ${scope === "today" ? "" : "for today — "}analyzing ${scopeLabel}…`, { icon: "🧠" });

      const { data: ana, error: anaErr } = await supabase.functions.invoke("analyze-calendar-tasks", {
        body: { events, today: todayStr },
      });
      if (anaErr || ana?.error) {
        toast.error(ana?.error || "Analysis failed");
        setCalendarAnalyzing(false);
        return;
      }

      setAnalyzedTasks(ana?.analyzed ?? []);
      toast.success(`Analyzed ${ana?.analyzed?.length ?? 0} events from ${scopeLabel} ✨`);

    } catch (e) {
      console.error(e);
      toast.error("Could not analyze calendar");
    } finally {
      setCalendarAnalyzing(false);
    }
  };



  // ─── LANDING PAGE ───
  if (viewMode === "landing") {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: "hsl(300 50% 88%)" }}>
      <SEO title="TimeBunny — AI Schedule Builder & Atomic Habits Companion" description="Build a focused daily plan from your calendar, energy, and long-term goals with a kawaii bunny mascot and built-in Pomodoro timer." path="/" />

      {/* Clock outline background - FULL PAGE */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div
          className="rounded-full absolute"
          style={{
            width: "140vmax",
            height: "140vmax",
            border: "16px solid hsl(90 80% 45%)",
            background: "hsl(40 60% 95%)",
          }}
        >
          {/* Hour marks - 12, 3, 6, 9 - visible portions */}
          <div className="absolute top-[2%] left-1/2 -translate-x-1/2 w-[16px] h-[60px] rounded-full" style={{ background: "hsl(90 80% 45%)" }} />
          <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2 w-[16px] h-[60px] rounded-full" style={{ background: "hsl(90 80% 45%)" }} />
          <div className="absolute left-[2%] top-1/2 -translate-y-1/2 w-[60px] h-[16px] rounded-full" style={{ background: "hsl(90 80% 45%)" }} />
          <div className="absolute right-[2%] top-1/2 -translate-y-1/2 w-[60px] h-[16px] rounded-full" style={{ background: "hsl(90 80% 45%)" }} />
          {/* Clock hands - visible portion */}
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[10px] h-[30%] rounded-full origin-bottom rotate-[30deg]" style={{ background: "hsl(90 80% 45% / 0.7)" }} />
          <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[8px] h-[35%] rounded-full origin-bottom rotate-[-60deg]" style={{ background: "hsl(90 80% 45% / 0.7)" }} />
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full" style={{ background: "hsl(90 80% 45%)" }} />
        </div>
      </div>

      {/* Clock tick marks in circular pattern */}
      <div className="absolute inset-0 pointer-events-none z-[1] flex items-center justify-center">
        <div className="relative" style={{ width: "min(150vw, 150vh)", height: "min(150vw, 150vh)" }}>
          {Array.from({ length: 60 }).map((_, i) => {
            const isHour = i % 5 === 0;
            const angle = i * 6;
            return (
              <div
                key={i}
                className="absolute top-0 left-1/2 -translate-x-1/2 origin-bottom"
                style={{
                  height: "50%",
                  transform: `translateX(-50%) rotate(${angle}deg)`,
                }}
              >
                <div
                  className="rounded-full mx-auto"
                  style={{
                    width: isHour ? "6px" : "3px",
                    height: isHour ? "24px" : "12px",
                    background: isHour
                      ? "hsl(90 80% 45% / 0.7)"
                      : "hsl(90 80% 45% / 0.3)",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Content - positioned above and below clock */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-4">
          <div />
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-[hsl(280_40%_40%)] hover:text-[hsl(280_40%_30%)]">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="gap-2 text-[hsl(280_40%_40%)] hover:text-[hsl(280_40%_30%)] glass-pill rounded-full px-4">
                <span className="font-body font-semibold">Sign In / Sign Up</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Title and Start button - centered */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <h1 className="pixel-title text-6xl sm:text-7xl md:text-8xl lg:text-[8rem] leading-none tracking-[0.15em]" style={{ color: "hsl(280 50% 65%)" }}>
              TIME
            </h1>
            <h1 className="pixel-title text-6xl sm:text-7xl md:text-8xl lg:text-[8rem] leading-none mt-4 sm:mt-6 md:mt-8 tracking-[0.15em] ml-4 sm:ml-8 md:ml-12" style={{ color: "hsl(185 70% 60%)" }}>
              BUNNY
            </h1>
          </div>

          <button
            onClick={handleStart}
            className="glass-pill px-12 sm:px-16 py-4 sm:py-5 rounded-full cursor-pointer transition-all hover:scale-105 active:scale-95 mt-4 sm:mt-6"
          >
            <span className="pixel-title-alt text-2xl sm:text-3xl" style={{ color: "hsl(330 80% 55%)" }}>
              start
            </span>
          </button>

          {generatedSchedule.length > 0 && (
            <button
              onClick={() => setViewMode("schedule")}
              className="glass-pill px-8 sm:px-10 py-3 rounded-full cursor-pointer transition-all hover:scale-105 active:scale-95 mt-4"
            >
              <span className="font-body font-semibold text-base sm:text-lg" style={{ color: "hsl(280 50% 50%)" }}>
                take me to my schedule →
              </span>
            </button>
          )}

          <Link
            to="/welcome-back"
            className="mt-4 text-sm font-body font-semibold underline-offset-4 hover:underline"
            style={{ color: "hsl(280 40% 40%)" }}
          >
            Returning? Welcome back →
          </Link>
        </div>

        {/* Nav links - at the bottom of the page */}
        <div className="flex flex-wrap items-center justify-center gap-8 pb-8 sm:pb-12 mt-6">
          {generatedSchedule.length > 0 && (
            <button
              onClick={handleStartPomodoro}
              className="flex items-center gap-2 px-6 py-3 rounded-full glass-pill text-base transition-all hover:scale-105"
              style={{ color: "hsl(330 80% 45%)" }}
            >
              <Clock className="w-5 h-5" />
              <span className="font-body font-semibold">Focus Timer</span>
              <span>⏱️</span>
            </button>
          )}
          <Link
            to="/goals"
            className="flex items-center gap-2 px-7 py-3.5 rounded-full glass-pill text-lg transition-all hover:scale-105"
            style={{ color: "hsl(280 40% 40%)" }}
          >
            <Target className="w-6 h-6" />
            <span className="font-body font-semibold">Goals</span>
            <span>🎯</span>
          </Link>
          <button
            onClick={runCalendarAnalysis}
            disabled={calendarAnalyzing}
            className="flex items-center gap-2 px-7 py-3.5 rounded-full glass-pill text-lg transition-all hover:scale-105 disabled:opacity-60"
            style={{ color: "hsl(280 40% 40%)" }}
            aria-label="Scan and analyze my calendar for the month"
            title={`Scan calendar (next 31 days) • ${todayDate}`}
          >
            <Calendar className="w-6 h-6" />
            <span className="font-body font-semibold">
              {calendarAnalyzing ? "Analyzing…" : "My Calendar"}
            </span>
            <span>📅</span>
          </button>
        </div>


        {/* Bunny mascot - positioned on the right */}
        <div className="absolute bottom-4 -right-28 sm:bottom-8 sm:-right-24 lg:-right-20 z-10">
          <div role="button" tabIndex={0} aria-label="Toggle TimeBunny mascot speech bubble" className="relative cursor-pointer" onClick={() => setShowSpeechBubble(!showSpeechBubble)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setShowSpeechBubble(!showSpeechBubble); }}>
            {/* Bunny mascot */}
            <img
              src={bunnyMascot}
              alt="TimeBunny mascot"
              className="w-72 sm:w-96 md:w-[28rem] lg:w-[32rem] object-contain drop-shadow-xl transition-transform duration-200 hover:scale-105 active:scale-95 pixel-img"
              draggable={false}
            />
          </div>
        </div>
      </div>
      <CalendarAnalysisModal
        isOpen={analyzedTasks !== null}
        onClose={() => setAnalyzedTasks(null)}
        onNext={() => { playBing(); setViewMode("wizard"); }}
        tasks={analyzedTasks ?? []}
        monthLabel={new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })}
      />
    </div>
    );
  }

  // ─── APP VIEW ───
  return (
    <>
      <SEO title="Build Your Schedule — TimeBunny" description="Walk through the TimeBunny wizard to capture energy, stress, and tasks, then generate today's focused schedule." path="/" />
      <WizardInterface settings={settings} onSettingsChange={setSettings} onComplete={handleWizardComplete} isLoading={isLoading} generatedSchedule={generatedSchedule} />
    </>
  );

};

export default Index;