import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Calendar, LogOut } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import WizardInterface from "@/components/WizardInterface";
import CalendarAnalysisModal, { AnalyzedTask } from "@/components/CalendarAnalysisModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { useSchedulePersistence } from "@/hooks/useSchedulePersistence";
import { UserSettings } from "@/types/schedule";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { connectGoogleCalendar } from "@/lib/googleCalendarAccess";

import bunnyMascot from "@/assets/bunny-mascot.png";

const requestGoogleCalendarAccessToken = async (): Promise<{ accessToken: string | null; error?: string }> => {
  const result = await connectGoogleCalendar();
  return { accessToken: result.accessToken ?? null, error: result.error };
};
const defaultSettings: UserSettings = {
  energyLevel: "motivated",
  stressLevel: "medium",
  theme: "hearts",
  backgroundTheme: "gothic",
  wakeTime: "07:00",
  bedTime: "23:00",
};

type View = "landing" | "wizard" | "schedule";
const RESUME_CALENDAR_ANALYSIS_KEY = "resume_calendar_analysis_wb";
const CALENDAR_OAUTH_ATTEMPT_KEY = "calendar_oauth_attempt";
const POST_GOOGLE_AUTH_REDIRECT_KEY = "timebunny_post_google_auth_redirect";

const WelcomeBack = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [view, setView] = useState<View>("landing");
  const [calendarAnalyzing, setCalendarAnalyzing] = useState(false);
  const [analyzedTasks, setAnalyzedTasks] = useState<AnalyzedTask[] | null>(null);
  const [calendarImported, setCalendarImported] = useState(false);
  const [scope, setScope] = useState<"day" | "week" | "month">("month");

  const { isLoading, sendMessage, generatedSchedule } = useChat(settings);
  const { saveSchedule } = useSchedulePersistence(user?.id);

  // Auth returns should always land on the Welcome Back screen, not an in-progress wizard scene.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const forceLanding = params.get("landing") === "1" || (location.state as any)?.forceLanding;
    if (forceLanding) {
      setView("landing");
      window.history.replaceState({}, document.title, "/welcome-back");
    }
  }, [location.search, location.state]);

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

  // Save schedule once generated; user reviews it then taps Start Focus Timer.
  useEffect(() => {
    if (generatedSchedule.length > 0) {
      saveSchedule(generatedSchedule, settings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedSchedule]);

  // Resume calendar analysis after Google OAuth round-trip, or auto-scan when arriving via nav.
  useEffect(() => {
    if (authLoading) return;
    const autoScan = (location.state as any)?.autoScan === true;
    if (sessionStorage.getItem(RESUME_CALENDAR_ANALYSIS_KEY) === "1") {
      sessionStorage.removeItem(RESUME_CALENDAR_ANALYSIS_KEY);
      setTimeout(() => {
        runCalendarAnalysis(scope);
      }, 600);
    } else if (autoScan) {
      window.history.replaceState({}, document.title, "/welcome-back");
      setTimeout(() => {
        runCalendarAnalysis(scope);
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  useEffect(() => {
    if (user) sessionStorage.removeItem(CALENDAR_OAUTH_ATTEMPT_KEY);
  }, [user]);

  const runCalendarAnalysis = async (chosenScope: "day" | "week" | "month" = scope) => {
    if (calendarAnalyzing) return;
    setCalendarAnalyzing(true);
    let calendarConsentAttempted = false;
    // Watchdog: never let the spinner hang forever.
    const watchdog = window.setTimeout(() => {
      console.warn("[calendar] watchdog timeout — releasing spinner");
      setCalendarAnalyzing(false);
      toast.error("Calendar scan timed out. Tap My Calendar to try again or Skip to continue.");
    }, 30000);

    const waitForAuthSession = async (timeoutMs = 6000) => {
      const started = Date.now();
      while (Date.now() - started < timeoutMs) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) return session;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      return null;
    };

    const requestCalendarConsent = async (): Promise<string | null> => {
      if (calendarConsentAttempted) {
        toast.error(
          "Google sign-in finished, but Calendar access still is not available. Please check the app's Google Calendar setup before trying again.",
        );
        return null;
      }

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      if (currentSession) {
        return null;
      }

      // Guard: if we already attempted a Google redirect once and still have
      // no session, don't bounce the user into another redirect (infinite loop).
      if (sessionStorage.getItem(CALENDAR_OAUTH_ATTEMPT_KEY) === "1") {
        const settledSession = await waitForAuthSession();
        if (settledSession) {
          await persistGoogleTokens(settledSession);
          sessionStorage.removeItem(CALENDAR_OAUTH_ATTEMPT_KEY);
          sessionStorage.removeItem(POST_GOOGLE_AUTH_REDIRECT_KEY);
          return settledSession.provider_token ?? null;
        }
        sessionStorage.removeItem(CALENDAR_OAUTH_ATTEMPT_KEY);
        toast.error("Google sign-in didn't complete. Please try again.");
        return null;
      }

      toast("Opening Google sign-in first…", { icon: "🔐" });
      calendarConsentAttempted = true;
      sessionStorage.setItem(RESUME_CALENDAR_ANALYSIS_KEY, "1");
      sessionStorage.setItem(CALENDAR_OAUTH_ATTEMPT_KEY, "1");
      sessionStorage.setItem(POST_GOOGLE_AUTH_REDIRECT_KEY, "/welcome-back");
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
        extraParams: {
          prompt: "consent",
          access_type: "offline",
          include_granted_scopes: "true",
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly",
        },
      });

      if (result.error) {
        sessionStorage.removeItem(RESUME_CALENDAR_ANALYSIS_KEY);
        sessionStorage.removeItem(CALENDAR_OAUTH_ATTEMPT_KEY);
        sessionStorage.removeItem(POST_GOOGLE_AUTH_REDIRECT_KEY);
        toast.error(result.error.message || "Could not start Google sign-in");
        return null;
      }

      if (result.redirected) return null;

      const refreshedSession = await waitForAuthSession();
      await persistGoogleTokens(refreshedSession);
      if (refreshedSession) {
        sessionStorage.removeItem(RESUME_CALENDAR_ANALYSIS_KEY);
        sessionStorage.removeItem(CALENDAR_OAUTH_ATTEMPT_KEY);
      }
      sessionStorage.removeItem(POST_GOOGLE_AUTH_REDIRECT_KEY);
      return refreshedSession?.provider_token ?? null;
    };

    try {
      let {
        data: { session },
      } = await supabase.auth.getSession();
      await persistGoogleTokens(session);

      // Got a session: clear the redirect-attempt guard so future re-auths work.
      if (session) sessionStorage.removeItem(CALENDAR_OAUTH_ATTEMPT_KEY);

      if (!session) {
        await requestCalendarConsent();
        const resumedSession = await waitForAuthSession();
        if (!resumedSession) return;
        session = resumedSession;
        await persistGoogleTokens(session);
        sessionStorage.removeItem(CALENDAR_OAUTH_ATTEMPT_KEY);
      }

      const scopeOrder: Array<"day" | "week" | "month"> = ["day", "week", "month"];
      const startIdx = scopeOrder.indexOf(chosenScope);
      const tryOrder = scopeOrder.slice(startIdx);

      const fetchCalendar = async (scopeKey: "day" | "week" | "month", calendarAccessToken?: string) => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        const scopeDays = scopeKey === "day" ? 1 : scopeKey === "week" ? 7 : 31;
        end.setDate(end.getDate() + scopeDays);

        return supabase.functions.invoke("google-calendar", {
          body: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timeMin: start.toISOString(),
            timeMax: end.toISOString(),
          },
        });
      };

      let events: any[] = [];
      let calData: any = null;
      let calErr: any = null;
      let usedScope: "day" | "week" | "month" = chosenScope;

      for (const scopeKey of tryOrder) {
        const label = scopeKey === "day" ? "today" : scopeKey === "week" ? "this week" : "the next 31 days";
        toast(`Scanning ${label} of your calendar…`, { icon: "🔍" });

        let res = await fetchCalendar(scopeKey);
        if (res.data?.needsAuth) {
          if (res.data?.events?.length) {
            toast("Using your saved calendar while refreshing permissions…", { icon: "📅" });
          } else {
            toast("Calendar permission needs to be refreshed.", { icon: "📅" });
          }
          await requestCalendarConsent();
          res = await fetchCalendar(scopeKey);
          if (res.data?.needsAuth) {
            toast.error("Calendar access unavailable. Please sign in again.");
            setCalendarAnalyzing(false);
            window.clearTimeout(watchdog);
            return;
          }
        }

        calData = res.data;
        calErr = res.error;
        if (calErr || calData?.error) {
          toast.error(calData?.error || "Failed to fetch calendar");
          setCalendarAnalyzing(false);
          window.clearTimeout(watchdog);
          return;
        }

        const fetched = calData?.events ?? [];
        const diag = calData?.diagnostics;
        console.log(`[calendar] scope=${scopeKey} fetched ${fetched.length} events`, diag);
        if (fetched.length > 0) {
          events = fetched;
          usedScope = scopeKey;
          if (scopeKey !== chosenScope) {
            toast(`No events in ${chosenScope === "day" ? "today" : "this week"} — widened to ${label}`, {
              icon: "🔭",
            });
          }
          break;
        }
      }

      const todayStr = new Date().toISOString().slice(0, 10);

      if (events.length === 0) {
        const diag = calData?.diagnostics;
        const breakdown = diag?.perCalendar
          ?.map((c: any) => `${c.summary}: ${c.rawCount}${c.error ? ` (${c.error})` : ""}`)
          .join(" • ");
        if (breakdown) {
          toast.error(`No upcoming events in next 31 days. Calendars scanned — ${breakdown}`, { duration: 9000 });
        } else {
          toast.error(
            "Still no upcoming events found across the next 31 days. Double-check the Google account you signed in with has events on its calendar.",
          );
        }
        setAnalyzedTasks([]);
        setCalendarImported(true);
        return;
      }


      const { data: ana, error: anaErr } = await supabase.functions.invoke("analyze-calendar-tasks", {
        body: { events, today: todayStr },
      });
      if (anaErr || ana?.error) {
        toast.error(ana?.error || "Analysis failed");
        setCalendarAnalyzing(false);
        window.clearTimeout(watchdog);
        return;
      }

      setAnalyzedTasks(ana?.analyzed ?? []);
      setCalendarImported(true);
      toast.success(`Analyzed ${ana?.analyzed?.length ?? 0} events ✨`);
    } catch (e) {
      console.error(e);
      toast.error("Could not analyze calendar");
    } finally {
      window.clearTimeout(watchdog);
      setCalendarAnalyzing(false);
    }
  };

  const handleWizardComplete = (tasks: string) => {
    sendMessage(tasks);
    setView("schedule");
  };

  // ─── WIZARD VIEW (starts at cozy) ───
  if (view === "wizard") {
    return (
      <>
        <SEO
          title="Welcome Back — TimeBunny"
          description="Pick up where you left off: journal, energy, stress, focus."
          path="/welcome-back"
        />
        <WizardInterface
          settings={settings}
          onSettingsChange={setSettings}
          onComplete={handleWizardComplete}
          isLoading={isLoading}
          generatedSchedule={generatedSchedule}
          initialScene="cozy"
          onBackFromInitial={() => setView("landing")}
          onStartFocus={() => navigate("/pomodoro", { state: { schedule: generatedSchedule } })}
        />
      </>
    );
  }

  // ─── LANDING (returning user) ───
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "hsl(300 50% 88%)" }}>
      <SEO
        title="Welcome Back — TimeBunny"
        description="Returning? Sync your calendar, journal, and jump straight to your focus timer."
        path="/welcome-back"
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4">
        <Link
          to="/"
          state={{ fromLibraryBack: true }}
          className="text-sm font-body font-semibold"
          style={{ color: "hsl(280 40% 40%)" }}
        >
          ← Back
        </Link>
        {user ? (
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-[hsl(280_40%_40%)]">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        ) : (
          <Link to="/auth?returnTo=/welcome-back">
            <Button variant="ghost" size="sm" className="gap-2 text-[hsl(280_40%_40%)] glass-pill rounded-full px-4">
              <span className="font-body font-semibold">Sign In</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 pt-8 pb-24 text-center">
        <h1
          className="pixel-title text-5xl sm:text-6xl md:text-7xl leading-none tracking-[0.15em]"
          style={{ color: "hsl(280 50% 65%)" }}
        >
          WELCOME
        </h1>
        <h1
          className="pixel-title text-5xl sm:text-6xl md:text-7xl leading-none mt-3 tracking-[0.15em]"
          style={{ color: "hsl(185 70% 60%)" }}
        >
          BACK
        </h1>
        <p className="mt-6 max-w-md font-body text-base sm:text-lg" style={{ color: "hsl(280 40% 35%)" }}>
          Sync your calendar, then we'll jump straight into journaling and a fresh focus session.
        </p>

        {/* Scope selector */}
        <div
          className="mt-8 flex items-center gap-2 glass-pill rounded-full p-1"
          role="group"
          aria-label="Calendar scope"
        >
          {(["day", "week", "month"] as const).map((s) => {
            const active = scope === s;
            return (
              <button
                key={s}
                onClick={() => setScope(s)}
                className="px-4 py-1.5 rounded-full text-sm font-body font-semibold capitalize transition-all"
                style={{
                  background: active ? "hsl(280 60% 60%)" : "transparent",
                  color: active ? "white" : "hsl(280 40% 40%)",
                }}
                aria-pressed={active}
              >
                {s}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => runCalendarAnalysis(scope)}
          disabled={calendarAnalyzing}
          className="mt-6 flex items-center gap-3 px-8 py-4 rounded-full glass-pill text-lg transition-all hover:scale-105 disabled:opacity-60"
          style={{ color: "hsl(280 40% 40%)" }}
          aria-label="Sync my calendar"
        >
          <Calendar className="w-6 h-6" />
          <span className="font-body font-semibold">
            {calendarAnalyzing ? "Analyzing…" : calendarImported ? "Re-sync Calendar" : "My Calendar"}
          </span>
          <span>📅</span>
        </button>

        {calendarImported && (
          <p className="mt-4 text-sm font-body" style={{ color: "hsl(140 50% 35%)" }}>
            ✓ Calendar synced — tap Next to continue
          </p>
        )}

        <button
          onClick={() => {
            setCalendarAnalyzing(false);
            setView("wizard");
          }}
          className="mt-3 text-sm font-body underline opacity-70 hover:opacity-100"
          style={{ color: "hsl(280 40% 40%)" }}
        >
          Skip calendar →
        </button>

        <button
          onClick={async () => {
            const { data: { session } } = await supabase.auth.getSession();
            console.log('SESSION DEBUG:', {
              hasSession: !!session,
              hasProviderToken: !!session?.provider_token,
              hasProviderRefreshToken: !!session?.provider_refresh_token,
              userId: session?.user?.id,
            });
            toast('Session logged to console', { icon: '🐞' });
          }}
          className="mt-3 text-xs font-body underline opacity-60 hover:opacity-100"
          style={{ color: "hsl(280 40% 40%)" }}
        >
          Debug Session
        </button>
      </div>

      {/* Bunny mascot */}
      <div className="absolute bottom-0 left-[8%] z-[5] pointer-events-none">
        <img
          src={bunnyMascot}
          alt="TimeBunny mascot"
          className="w-64 sm:w-80 md:w-96 object-contain drop-shadow-xl pixel-img"
          draggable={false}
        />
      </div>

      {/* Next button — fixed bottom-right, appears after calendar sync */}
      {calendarImported && (
        <button
          onClick={() => setView("wizard")}
          className="fixed bottom-4 right-4 z-50 flex items-center justify-center gap-1 px-4 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg transition-all hover:scale-105 active:scale-95"
          style={{ background: "hsl(280 70% 50%)" }}
          aria-label="Continue to journal"
        >
          <span>Next</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      )}

      <CalendarAnalysisModal
        isOpen={analyzedTasks !== null}
        onClose={() => setAnalyzedTasks(null)}
        onNext={() => {
          setAnalyzedTasks(null);
          setView("wizard");
        }}
        tasks={analyzedTasks ?? []}
        monthLabel={new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })}
      />
    </div>
  );
};

export default WelcomeBack;
