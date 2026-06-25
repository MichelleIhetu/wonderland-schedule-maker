import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import bunnyMascot from "@/assets/bunny-mascot.png";

const defaultSettings: UserSettings = {
  energyLevel: "motivated",
  stressLevel: "medium",
  theme: "hearts",
  backgroundTheme: "gothic",
  wakeTime: "07:00",
  bedTime: "23:00",
};

type View = "landing" | "wizard" | "schedule";

const WelcomeBack = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [view, setView] = useState<View>("landing");
  const [calendarAnalyzing, setCalendarAnalyzing] = useState(false);
  const [analyzedTasks, setAnalyzedTasks] = useState<AnalyzedTask[] | null>(null);
  const [calendarImported, setCalendarImported] = useState(false);
  const [scope, setScope] = useState<"day" | "week" | "month">("month");

  const { isLoading, sendMessage, generatedSchedule } = useChat(settings);
  const { saveSchedule } = useSchedulePersistence(user?.id);

  // Save schedule once generated, then jump to focus timer.
  useEffect(() => {
    if (generatedSchedule.length > 0) {
      saveSchedule(generatedSchedule, settings);
      navigate("/pomodoro", { state: { schedule: generatedSchedule } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedSchedule]);

  // Resume calendar analysis after Google OAuth round-trip.
  useEffect(() => {
    if (sessionStorage.getItem("resume_calendar_analysis_wb") === "1") {
      sessionStorage.removeItem("resume_calendar_analysis_wb");
      setTimeout(() => { runCalendarAnalysis(scope); }, 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runCalendarAnalysis = async (chosenScope: "day" | "week" | "month" = scope) => {
    if (calendarAnalyzing) return;
    setCalendarAnalyzing(true);
    try {
      let { data: { session } } = await supabase.auth.getSession();
      let providerToken = session?.provider_token ?? null;

      if (!session || !providerToken) {
        toast("Opening Google sign-in for Calendar access…", { icon: "🔐" });
        sessionStorage.setItem("resume_calendar_analysis_wb", "1");
        const { error } = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin + "/welcome-back",
          extraParams: {
            prompt: "consent",
            access_type: "offline",
            include_granted_scopes: "true",
            scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly",
          },
        });
        if (error) { toast.error(error.message || "Could not start Google sign-in"); setCalendarAnalyzing(false); }
        return;
      }

      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      const scopeDays = chosenScope === "day" ? 1 : chosenScope === "week" ? 7 : 31;
      end.setDate(end.getDate() + scopeDays);
      const scopeLabel = chosenScope === "day" ? "today" : chosenScope === "week" ? "this week" : "the next 31 days";
      toast(`Scanning ${scopeLabel} of your calendar…`, { icon: "🔍" });
      const { data: calData, error: calErr } = await supabase.functions.invoke("google-calendar", {
        headers: { "x-provider-token": providerToken },
        body: { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, timeMin: start.toISOString(), timeMax: end.toISOString() },
      });
      if (calErr || calData?.error) { toast.error(calData?.error || "Failed to fetch calendar"); setCalendarAnalyzing(false); return; }

      const events = calData?.events ?? [];
      const todayStr = new Date().toISOString().slice(0, 10);

      const { data: ana, error: anaErr } = await supabase.functions.invoke("analyze-calendar-tasks", {
        body: { events, today: todayStr },
      });
      if (anaErr || ana?.error) { toast.error(ana?.error || "Analysis failed"); setCalendarAnalyzing(false); return; }

      setAnalyzedTasks(ana?.analyzed ?? []);
      setCalendarImported(true);
      toast.success(`Analyzed ${ana?.analyzed?.length ?? 0} events ✨`);
    } catch (e) {
      console.error(e);
      toast.error("Could not analyze calendar");
    } finally {
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
        <SEO title="Welcome Back — TimeBunny" description="Pick up where you left off: journal, energy, stress, focus." path="/welcome-back" />
        <WizardInterface
          settings={settings}
          onSettingsChange={setSettings}
          onComplete={handleWizardComplete}
          isLoading={isLoading}
          generatedSchedule={generatedSchedule}
          initialScene="cozy"
          onBackFromInitial={() => setView("landing")}
        />
      </>
    );
  }

  // ─── LANDING (returning user) ───
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "hsl(300 50% 88%)" }}>
      <SEO title="Welcome Back — TimeBunny" description="Returning? Sync your calendar, journal, and jump straight to your focus timer." path="/welcome-back" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4">
        <Link to="/" className="text-sm font-body font-semibold" style={{ color: "hsl(280 40% 40%)" }}>
          ← Home
        </Link>
        {user ? (
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-[hsl(280_40%_40%)]">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        ) : (
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="gap-2 text-[hsl(280_40%_40%)] glass-pill rounded-full px-4">
              <span className="font-body font-semibold">Sign In</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 pt-8 pb-24 text-center">
        <h1 className="pixel-title text-5xl sm:text-6xl md:text-7xl leading-none tracking-[0.15em]" style={{ color: "hsl(280 50% 65%)" }}>
          WELCOME
        </h1>
        <h1 className="pixel-title text-5xl sm:text-6xl md:text-7xl leading-none mt-3 tracking-[0.15em]" style={{ color: "hsl(185 70% 60%)" }}>
          BACK
        </h1>
        <p className="mt-6 max-w-md font-body text-base sm:text-lg" style={{ color: "hsl(280 40% 35%)" }}>
          Sync your calendar, then we'll jump straight into journaling and a fresh focus session.
        </p>

        {/* Scope selector */}
        <div className="mt-8 flex items-center gap-2 glass-pill rounded-full p-1" role="group" aria-label="Calendar scope">
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
      </div>

      {/* Bunny mascot */}
      <div className="absolute bottom-0 left-0 z-[5] pointer-events-none">
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
        onNext={() => { setAnalyzedTasks(null); setView("wizard"); }}
        tasks={analyzedTasks ?? []}
        monthLabel={new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })}
      />
    </div>
  );
};

export default WelcomeBack;
