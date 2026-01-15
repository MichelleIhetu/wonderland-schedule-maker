import { useState } from "react";
import { Sparkles } from "lucide-react";
import SpiderWebBackground from "@/components/SpiderWebBackground";
import BunnyClock from "@/components/BunnyClock";
import WizardInterface from "@/components/WizardInterface";
import ScheduleDisplay from "@/components/ScheduleDisplay";
import { useChat } from "@/hooks/useChat";
import { UserSettings, themeColors } from "@/types/schedule";

const defaultSettings: UserSettings = {
  energyLevel: "motivated",
  stressLevel: "medium",
  theme: "hearts",
  wakeTime: "07:00",
  bedTime: "23:00",
};

const Index = () => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  
  const { 
    isLoading, 
    sendMessage, 
    generatedSchedule,
    setGeneratedSchedule 
  } = useChat(settings);

  const themeColor = themeColors[settings.theme];

  const handleWizardComplete = (tasks: string) => {
    sendMessage(tasks);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Spider web background */}
      <SpiderWebBackground />

      {/* Main content */}
      <div className="container max-w-4xl mx-auto px-4 py-6 relative z-10 min-h-screen flex flex-col">
        {/* Header with Bunny Clock */}
        <header className="text-center mb-6 flex-shrink-0">
          <div className="flex flex-col items-center gap-4 mb-4">
            {/* Bunny with Clock */}
            <BunnyClock />
            
            <div className="flex flex-col items-center">
              <div 
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-body mb-3 border border-primary/30 backdrop-blur-sm"
                style={{ backgroundColor: 'hsl(270 40% 15% / 0.8)' }}
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-foreground">{themeColors[settings.theme].name}</span>
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          {generatedSchedule.length > 0 ? (
            <ScheduleDisplay
              schedule={generatedSchedule}
              onClear={() => setGeneratedSchedule([])}
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

        {/* Footer */}
        <footer className="mt-6 text-center flex-shrink-0">
          <p className="text-xs text-muted-foreground/60 font-body italic">
            "I'm late! I'm late! For a very important date!" — White Rabbit
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;