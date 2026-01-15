import { useState } from "react";
import { Sparkles } from "lucide-react";
import SpiderWebBackground from "@/components/SpiderWebBackground";
import BunnyClock from "@/components/BunnyClock";
import SettingsPanel from "@/components/SettingsPanel";
import ChatInterface from "@/components/ChatInterface";
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    clearChat, 
    generatedSchedule,
    setGeneratedSchedule 
  } = useChat(settings);

  const themeColor = themeColors[settings.theme];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Spider web background */}
      <SpiderWebBackground />

      {/* Settings Panel */}
      <SettingsPanel
        settings={settings}
        onSettingsChange={setSettings}
        isOpen={isSettingsOpen}
        onToggle={() => setIsSettingsOpen(!isSettingsOpen)}
      />

      {/* Main content */}
      <div className="container max-w-6xl mx-auto px-4 py-6 relative z-10 h-screen flex flex-col">
        {/* Header with Bunny Clock */}
        <header className="text-center mb-6 flex-shrink-0">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 mb-4">
            {/* Bunny with Clock */}
            <div className="hidden md:block">
              <BunnyClock />
            </div>
            
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
                Tell me your tasks, and I'll craft the perfect schedule for you
              </p>
            </div>

            {/* Mobile clock */}
            <div className="md:hidden scale-75">
              <BunnyClock />
            </div>
          </div>
        </header>

        {/* Main Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 mt-8 lg:mt-0">
          {/* Chat Section */}
          <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-primary/20 shadow-glow overflow-hidden flex flex-col min-h-[500px]">
            <ChatInterface
              messages={messages}
              isLoading={isLoading}
              onSendMessage={sendMessage}
              onClearChat={clearChat}
              settings={settings}
            />
          </div>

          {/* Schedule Section */}
          <div className={`min-h-[500px] ${generatedSchedule.length === 0 ? "hidden lg:flex lg:items-center lg:justify-center" : ""}`}>
            {generatedSchedule.length > 0 ? (
              <ScheduleDisplay
                schedule={generatedSchedule}
                onClear={() => setGeneratedSchedule([])}
                theme={settings.theme}
              />
            ) : (
              <div className="text-center p-8 bg-card/50 backdrop-blur-sm rounded-2xl border border-primary/10">
                <div 
                  className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-muted/50 border border-primary/20"
                >
                  <span className="text-3xl">🕸️</span>
                </div>
                <p className="font-body text-muted-foreground">
                  Your schedule will appear here once generated
                </p>
              </div>
            )}
          </div>
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