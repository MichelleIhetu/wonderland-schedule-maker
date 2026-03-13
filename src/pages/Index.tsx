import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ImageIcon, Clock, LogOut, Target, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import SpiderWebBackground from "@/components/SpiderWebBackground";
import ThemeBackground from "@/components/ThemeBackground";
import WizardInterface from "@/components/WizardInterface";
import ScheduleDisplay from "@/components/ScheduleDisplay";
import PomodoroTimer from "@/components/PomodoroTimer";
import ThemeSelector from "@/components/ThemeSelector";
import ThemeCustomizer, { CustomColors, defaultThemeColors } from "@/components/ThemeCustomizer";
import CheckInModal, { CheckInData } from "@/components/CheckInModal";
import { useHourlyCheckIn } from "@/hooks/useHourlyCheckIn";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { useSchedulePersistence } from "@/hooks/useSchedulePersistence";
import { UserSettings, backgroundThemes } from "@/types/schedule";
import { Button } from "@/components/ui/button";
import bunnyWithSpeechBubble from "@/assets/bunny-with-speech-bubble.png";

const defaultSettings: UserSettings = {
  energyLevel: "motivated",
  stressLevel: "medium",
  theme: "hearts",
  backgroundTheme: "gothic",
  wakeTime: "07:00",
  bedTime: "23:00",
};

type ViewMode = "landing" | "wizard" | "schedule" | "pomodoro";

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

  const { isLoading, sendMessage, generatedSchedule, setGeneratedSchedule } = useChat(settings);
  const { saveSchedule, loadTodaySchedule } = useSchedulePersistence(user?.id);

  // Load today's schedule on mount
  useEffect(() => {
    if (!user || scheduleLoaded) return;
    loadTodaySchedule().then((result) => {
      if (result && result.schedule.length > 0) {
        setGeneratedSchedule(result.schedule);
        if (result.settings) setSettings(result.settings);
        setViewMode("schedule");
        toast.success("Welcome back! Your schedule is ready 🐰");
      }
      setScheduleLoaded(true);
    });
  }, [user, scheduleLoaded]);

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
    enabled: viewMode === "pomodoro" || generatedSchedule.length > 0,
    intervalMinutes: 60,
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
      if (result.needBreak && viewMode === "pomodoro") toast("Adding a break for you — take it easy!", { icon: "☕" });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => { setCustomColors(defaultThemeColors[settings.backgroundTheme]); }, [settings.backgroundTheme]);

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
  const handleStartPomodoro = () => { setViewMode("pomodoro"); };
  const handleBackToSchedule = () => { setViewMode("schedule"); };
  const handleResetColors = () => { setCustomColors(defaultThemeColors[settings.backgroundTheme]); };

  const handleCheckInSubmit = (data: CheckInData) => {
    completeCheckIn(data);
    if (data.mood === "struggling") toast("Hang in there! Consider taking a longer break.", { description: "It's okay to adjust your pace.", icon: "💪" });
    else if (data.mood === "great") toast("Amazing! Keep up the great work!", { description: "You're doing wonderfully!", icon: "🌟" });
    else toast("Check-in complete!", { description: "Keep going, you've got this!", icon: "✨" });
    if (data.needBreak && viewMode === "pomodoro") toast("Taking a longer break", { description: "Enjoy your rest time!", icon: "☕" });
  };

  if (generatedSchedule.length > 0 && viewMode === "landing") setViewMode("schedule");

  const handleStart = () => setViewMode("wizard");
  const handleBackToLanding = () => { if (generatedSchedule.length === 0) setViewMode("landing"); };

  // ─── LANDING PAGE ───
  if (viewMode === "landing") {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: "hsl(300 50% 88%)" }}>
        {/* Clock outline background - shifted left */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -translate-x-[10%] sm:-translate-x-[15%]">
          <div
            className="rounded-full relative"
            style={{
              width: "min(80vw, 550px)",
              height: "min(80vw, 550px)",
              border: "8px solid hsl(90 80% 45%)",
              background: "hsl(40 60% 95%)",
            }}
          >
            {/* Hour marks - 12, 3, 6, 9 */}
            <div className="absolute top-[-16px] left-1/2 -translate-x-1/2 w-[8px] h-[28px] rounded-full" style={{ background: "hsl(90 80% 45%)" }} />
            <div className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 w-[8px] h-[28px] rounded-full" style={{ background: "hsl(90 80% 45%)" }} />
            <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-[28px] h-[8px] rounded-full" style={{ background: "hsl(90 80% 45%)" }} />
            <div className="absolute right-[-16px] top-1/2 -translate-y-1/2 w-[28px] h-[8px] rounded-full" style={{ background: "hsl(90 80% 45%)" }} />
            {/* Clock hands */}
            <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[6px] h-[35%] rounded-full origin-bottom rotate-[30deg]" style={{ background: "hsl(90 80% 45% / 0.7)" }} />
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[5px] h-[40%] rounded-full origin-bottom rotate-[-60deg]" style={{ background: "hsl(90 80% 45% / 0.7)" }} />
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full" style={{ background: "hsl(90 80% 45%)" }} />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 sm:px-8 py-4">
            <div />
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-[hsl(280_40%_40%)] hover:text-[hsl(280_40%_30%)]">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>

          {/* Main hero area */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 sm:px-12 relative w-full">
            {/* Title - centered */}
            <div className="text-center w-full relative z-10">
              <h1 className="pixel-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight mx-auto" style={{ color: "hsl(280 50% 65%)" }}>
                TIME
              </h1>
              <h1 className="pixel-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight mt-2 mx-auto" style={{ color: "hsl(185 70% 60%)" }}>
                BUNNY
              </h1>
            </div>

            {/* Glass Start button */}
            <button
              onClick={handleStart}
              className="glass-pill px-12 sm:px-16 py-4 sm:py-5 rounded-full cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <span className="pixel-title-alt text-2xl sm:text-3xl" style={{ color: "hsl(330 80% 55%)" }}>
                start
              </span>
            </button>

            {/* Nav links - positioned lower towards bottom of clock */}
            <div className="flex flex-wrap items-center gap-3 mt-12 sm:mt-16 md:mt-20 lg:mt-24">
              <Link
                to="/goals"
                className="flex items-center gap-2 px-4 py-2 rounded-full glass-pill text-sm transition-all hover:scale-105"
                style={{ color: "hsl(280 40% 40%)" }}
              >
                <Target className="w-4 h-4" />
                <span className="font-body font-semibold">Goals</span>
                <span>🎯</span>
              </Link>
              <Link
                to="/moodboard"
                className="flex items-center gap-2 px-4 py-2 rounded-full glass-pill text-sm transition-all hover:scale-105"
                style={{ color: "hsl(280 40% 40%)" }}
              >
                <ImageIcon className="w-4 h-4" />
                <span className="font-body font-semibold">Moodboard</span>
                <span>✨</span>
              </Link>
            </div>
          </div>

          {/* Bunny mascot with integrated speech bubble - positioned on the right */}
          <div className="absolute bottom-4 -right-4 sm:bottom-8 sm:-right-2 lg:right-0 z-10">
            <img
              src={bunnyWithSpeechBubble}
              alt="TimeBunny mascot with speech bubble"
              className="w-64 sm:w-80 md:w-96 lg:w-[28rem] object-contain drop-shadow-xl"
            />
          </div>
        </div>
      </div>
    );
  }

  // ─── APP VIEW (wizard / schedule / pomodoro) ───
  return (
    <div className="min-h-screen relative overflow-hidden">
      {settings.backgroundTheme === "gothic" ? <SpiderWebBackground /> : <ThemeBackground theme={settings.backgroundTheme} />}

      <ThemeCustomizer isOpen={isCustomizerOpen} onClose={() => setIsCustomizerOpen(false)} currentTheme={settings.backgroundTheme} customColors={customColors} onColorsChange={setCustomColors} onReset={handleResetColors} />
      <CheckInModal isOpen={isCheckInModalOpen} onClose={() => { setIsCheckInModalOpen(false); skipCheckIn(); }} onSubmit={handleCheckInSubmit} currentTask={currentTask} />

      <div className="container max-w-4xl mx-auto px-4 py-6 relative z-10 min-h-screen flex flex-col">
        {/* Top bar */}
        <div className="mb-4 flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {viewMode === "wizard" && generatedSchedule.length === 0 && (
              <Button variant="ghost" size="sm" onClick={handleBackToLanding} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Home
              </Button>
            )}
            <ThemeSelector currentTheme={settings.backgroundTheme} onChange={(theme) => setSettings({ ...settings, backgroundTheme: theme })} onOpenCustomizer={() => setIsCustomizerOpen(true)} />
          </div>

          <div className="flex items-center gap-2">
            {(viewMode === "pomodoro" || generatedSchedule.length > 0) && (
              <Button variant="outline" size="sm" onClick={() => navigate("/vibe-check", { state: { backgroundTheme: settings.backgroundTheme } })} className="gap-2">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Vibe Check</span>
                {minutesUntilNextCheckIn < 60 && <span className="text-xs text-muted-foreground">({minutesUntilNextCheckIn}m)</span>}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>

        {/* App content */}
        <div className="flex-1 flex flex-col gap-6">
          {viewMode === "pomodoro" ? (
            <PomodoroTimer schedule={generatedSchedule} onBack={handleBackToSchedule} />
          ) : viewMode === "schedule" && generatedSchedule.length > 0 ? (
            <ScheduleDisplay schedule={generatedSchedule} onClear={handleClearSchedule} onStartPomodoro={handleStartPomodoro} theme={settings.theme} />
          ) : (
            <WizardInterface settings={settings} onSettingsChange={setSettings} onComplete={handleWizardComplete} isLoading={isLoading} />
          )}
        </div>

        {viewMode !== "pomodoro" && (
          <footer className="mt-6 text-center flex-shrink-0 space-y-3">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/moodboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 border border-border hover:border-primary/50 transition-colors text-sm font-body text-foreground hover:text-primary">
                <ImageIcon className="w-4 h-4" />
                <span>Moodboard</span>
                <span className="text-muted-foreground">✨</span>
              </Link>
              <Link to="/goals" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 border border-border hover:border-primary/50 transition-colors text-sm font-body text-foreground hover:text-primary">
                <Target className="w-4 h-4" />
                <span>Long-term Goals</span>
                <span className="text-muted-foreground">🎯</span>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground/60 font-body italic">"I'm late! I'm late! For a very important date!" — White Rabbit</p>
          </footer>
        )}
      </div>
    </div>
  );
};

export default Index;
