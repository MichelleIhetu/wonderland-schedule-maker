import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import SpiderWebBackground from "@/components/SpiderWebBackground";
import ThemeBackground from "@/components/ThemeBackground";
import BunnyClock from "@/components/BunnyClock";
import WizardInterface from "@/components/WizardInterface";
import ScheduleDisplay from "@/components/ScheduleDisplay";
import PomodoroTimer from "@/components/PomodoroTimer";
import ThemeSelector from "@/components/ThemeSelector";
import ThemeCustomizer, { CustomColors, defaultThemeColors } from "@/components/ThemeCustomizer";
import { useChat } from "@/hooks/useChat";
import { UserSettings, backgroundThemes } from "@/types/schedule";

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
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [viewMode, setViewMode] = useState<ViewMode>("wizard");
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [customColors, setCustomColors] = useState<CustomColors>(defaultThemeColors.gothic);
  
  const { 
    isLoading, 
    sendMessage, 
    generatedSchedule,
    setGeneratedSchedule 
  } = useChat(settings);

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

      {/* Main content */}
      <div className="container max-w-4xl mx-auto px-4 py-6 relative z-10 min-h-screen flex flex-col">
        {/* Theme Selector - always visible at top */}
        <div className="mb-4 flex-shrink-0">
          <ThemeSelector 
            currentTheme={settings.backgroundTheme}
            onChange={(theme) => setSettings({ ...settings, backgroundTheme: theme })}
            onOpenCustomizer={() => setIsCustomizerOpen(true)}
          />
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
          <footer className="mt-6 text-center flex-shrink-0">
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