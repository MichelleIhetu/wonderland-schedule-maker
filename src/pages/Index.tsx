import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sparkles, ImageIcon, Clock } from "lucide-react";
import { toast } from "sonner";
import SpiderWebBackground from "@/components/SpiderWebBackground";
import ThemeBackground from "@/components/ThemeBackground";
import BunnyClock from "@/components/BunnyClock";
import WizardInterface from "@/components/WizardInterface";
import ScheduleDisplay from "@/components/ScheduleDisplay";
import PomodoroTimer from "@/components/PomodoroTimer";
import ThemeSelector from "@/components/ThemeSelector";
import ThemeCustomizer, { CustomColors, defaultThemeColors } from "@/components/ThemeCustomizer";
import CheckInModal, { CheckInData } from "@/components/CheckInModal";
import { useHourlyCheckIn } from "@/hooks/useHourlyCheckIn";
import { useChat } from "@/hooks/useChat";
import { UserSettings, backgroundThemes } from "@/types/schedule";
import { Button } from "@/components/ui/button";

const defaultSettings: UserSettings = {
  energyLevel: "motivated",
  stressLevel: "medium",
  theme: "hearts",
  backgroundTheme: "gothic",
  wakeTime: "07:00",
  bedTime: "23:00",
};

type ViewMode = "wizard" | "schedule" | "pomodoro";

// Helper to convert hex to HSL values for CSS variables
const hexToHsl = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0 0% 0%";
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
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
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [viewMode, setViewMode] = useState<ViewMode>("wizard");
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [customColors, setCustomColors] = useState<CustomColors>(defaultThemeColors.gothic);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  
  const { 
    isLoading, 
    sendMessage, 
    generatedSchedule,
    setGeneratedSchedule 
  } = useChat(settings);

  // Hourly check-in hook - enabled when in pomodoro mode or has schedule
  const {
    isCheckInDue,
    minutesUntilNextCheckIn,
    completeCheckIn,
    skipCheckIn,
    triggerCheckIn,
    checkInHistory,
  } = useHourlyCheckIn({
    enabled: viewMode === "pomodoro" || generatedSchedule.length > 0,
    intervalMinutes: 60,
    onCheckInDue: () => {
      navigate("/vibe-check", { state: { backgroundTheme: settings.backgroundTheme } });
    },
  });

  // Get current task for check-in context
  const currentTask = generatedSchedule[0]?.title;

  // Handle vibe check result when returning from /vibe-check
  useEffect(() => {
    const state = location.state as any;
    if (state?.vibeCheckResult) {
      const result = state.vibeCheckResult;
      completeCheckIn({
        mood: result.mood,
        energy: result.energy,
        taskUpdate: result.notes,
        needBreak: result.needBreak,
      });

      if (result.mood === "struggling") {
        toast("Hang in there! We've noted your vibe.", { icon: "💪" });
      } else if (result.mood === "great") {
        toast("You're killing it! Keep going!", { icon: "🔥" });
      } else {
        toast("Vibe check complete!", { icon: "✨" });
      }

      if (result.adjustSchedule === "lighten" && generatedSchedule.length > 0) {
        toast("Lightening your load — non-urgent tasks pushed back", { icon: "📋" });
      } else if (result.adjustSchedule === "reschedule") {
        toast("Let's rebuild your schedule from here", { icon: "🔄" });
        setGeneratedSchedule([]);
        setViewMode("wizard");
      }

      if (result.needBreak && viewMode === "pomodoro") {
        toast("Adding a break for you — take it easy!", { icon: "☕" });
      }

      // Clear the state so it doesn't re-trigger
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Update custom colors when theme changes
  useEffect(() => {
    setCustomColors(defaultThemeColors[settings.backgroundTheme]);
  }, [settings.backgroundTheme]);

  // Apply theme class and custom colors to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove("theme-peppy-pink", "theme-ocean-calm", "theme-sunset-warm", "theme-forest-zen");
    
    // Add current theme class (gothic uses default, so no class needed)
    if (settings.backgroundTheme !== "gothic") {
      root.classList.add(`theme-${settings.backgroundTheme}`);
    }

    // Apply custom colors as CSS variables
    root.style.setProperty("--primary", hexToHsl(customColors.primary));
    root.style.setProperty("--secondary", hexToHsl(customColors.secondary));
    root.style.setProperty("--accent", hexToHsl(customColors.accent));
    root.style.setProperty("--background", hexToHsl(customColors.background));
    root.style.setProperty("--card", hexToHsl(customColors.card));
    root.style.setProperty("--foreground", hexToHsl(customColors.foreground));
    root.style.setProperty("--card-foreground", hexToHsl(customColors.foreground));
    root.style.setProperty("--popover-foreground", hexToHsl(customColors.foreground));
  }, [settings.backgroundTheme, customColors]);

  const handleWizardComplete = (tasks: string) => {
    sendMessage(tasks);
    setViewMode("schedule");
  };

  const handleClearSchedule = () => {
    setGeneratedSchedule([]);
    setViewMode("wizard");
  };

  const handleStartPomodoro = () => {
    setViewMode("pomodoro");
  };

  const handleBackToSchedule = () => {
    setViewMode("schedule");
  };

  const handleResetColors = () => {
    setCustomColors(defaultThemeColors[settings.backgroundTheme]);
  };

  const handleCheckInSubmit = (data: CheckInData) => {
    completeCheckIn(data);
    
    // Show feedback based on mood
    if (data.mood === "struggling") {
      toast("Hang in there! Consider taking a longer break.", {
        description: "It's okay to adjust your pace.",
        icon: "💪",
      });
    } else if (data.mood === "great") {
      toast("Amazing! Keep up the great work!", {
        description: "You're doing wonderfully!",
        icon: "🌟",
      });
    } else {
      toast("Check-in complete!", {
        description: "Keep going, you've got this!",
        icon: "✨",
      });
    }

    // If they need a break and are in pomodoro mode
    if (data.needBreak && viewMode === "pomodoro") {
      toast("Taking a longer break", {
        description: "Enjoy your rest time!",
        icon: "☕",
      });
    }
  };

  // Auto-switch to schedule view when schedule is generated
  if (generatedSchedule.length > 0 && viewMode === "wizard") {
    setViewMode("schedule");
  }

  const currentBgTheme = backgroundThemes[settings.backgroundTheme];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background based on theme */}
      {settings.backgroundTheme === "gothic" ? (
        <SpiderWebBackground />
      ) : (
        <ThemeBackground theme={settings.backgroundTheme} />
      )}

      {/* Theme Customizer Panel */}
      <ThemeCustomizer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        currentTheme={settings.backgroundTheme}
        customColors={customColors}
        onColorsChange={setCustomColors}
        onReset={handleResetColors}
      />

      {/* Check-In Modal */}
      <CheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => {
          setIsCheckInModalOpen(false);
          skipCheckIn();
        }}
        onSubmit={handleCheckInSubmit}
        currentTask={currentTask}
      />

      {/* Main content */}
      <div className="container max-w-4xl mx-auto px-4 py-6 relative z-10 min-h-screen flex flex-col">
        {/* Theme Selector and Check-In Button */}
        <div className="mb-4 flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <ThemeSelector 
            currentTheme={settings.backgroundTheme}
            onChange={(theme) => setSettings({ ...settings, backgroundTheme: theme })}
            onOpenCustomizer={() => setIsCustomizerOpen(true)}
          />
          
          {/* Check-In Button - show when schedule is active */}
          {(viewMode === "pomodoro" || generatedSchedule.length > 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/vibe-check", { state: { backgroundTheme: settings.backgroundTheme } })}
              className="gap-2"
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Vibe Check</span>
              {minutesUntilNextCheckIn < 60 && (
                <span className="text-xs text-muted-foreground">
                  ({minutesUntilNextCheckIn}m)
                </span>
              )}
            </Button>
          )}
        </div>

        {/* Header with Bunny Clock - hide during pomodoro */}
        {viewMode !== "pomodoro" && (
          <header className="text-center mb-6 flex-shrink-0">
            <div className="flex flex-col items-center gap-4 mb-4">
              {/* Bunny with Clock */}
              <BunnyClock />
              
              <div className="flex flex-col items-center">
                <div 
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-body mb-3 border border-primary/30 backdrop-blur-sm bg-card/80"
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-foreground">{currentBgTheme.emoji} {currentBgTheme.name}</span>
                </div>
                <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2 drop-shadow-lg">
                  Wonderland Scheduler
                </h1>
                <p className="text-sm text-muted-foreground font-body">
                  Let the White Rabbit guide you through your perfect day
                </p>
              </div>
            </div>
          </header>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          {viewMode === "pomodoro" ? (
            <PomodoroTimer
              schedule={generatedSchedule}
              onBack={handleBackToSchedule}
            />
          ) : viewMode === "schedule" && generatedSchedule.length > 0 ? (
            <ScheduleDisplay
              schedule={generatedSchedule}
              onClear={handleClearSchedule}
              onStartPomodoro={handleStartPomodoro}
              theme={settings.theme}
            />
          ) : (
            <WizardInterface
              settings={settings}
              onSettingsChange={setSettings}
              onComplete={handleWizardComplete}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Footer - hide during pomodoro */}
        {viewMode !== "pomodoro" && (
          <footer className="mt-6 text-center flex-shrink-0 space-y-3">
            {/* Moodboard Link */}
            <Link
              to="/moodboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 border border-border hover:border-primary/50 transition-colors text-sm font-body text-foreground hover:text-primary"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Browse Moodboard for Inspiration</span>
              <span className="text-muted-foreground">✨</span>
            </Link>
            
            <p className="text-xs text-muted-foreground/60 font-body italic">
              "I'm late! I'm late! For a very important date!" — White Rabbit
            </p>
          </footer>
        )}
      </div>
    </div>
  );
};

export default Index;