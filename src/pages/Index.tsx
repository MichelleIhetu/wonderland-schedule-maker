import { useState } from "react";
import { Sparkles } from "lucide-react";
import FloatingCard from "@/components/FloatingCard";
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
      {/* Floating decorative cards */}
      <FloatingCard suit="hearts" className="top-20 left-[5%] opacity-40" delay={0} />
      <FloatingCard suit="diamonds" className="top-40 right-[8%] opacity-30" delay={1} />
      <FloatingCard suit="clubs" className="bottom-32 left-[10%] opacity-30" delay={2} />
      <FloatingCard suit="spades" className="bottom-48 right-[5%] opacity-40" delay={0.5} />

      {/* Settings Panel */}
      <SettingsPanel
        settings={settings}
        onSettingsChange={setSettings}
        isOpen={isSettingsOpen}
        onToggle={() => setIsSettingsOpen(!isSettingsOpen)}
      />

      {/* Main content */}
      <div className="container max-w-6xl mx-auto px-4 py-6 relative z-10 h-screen flex flex-col">
        {/* Header */}
        <header className="text-center mb-6 flex-shrink-0">
          <div 
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-body mb-3"
            style={{ backgroundColor: themeColor.secondary, color: themeColor.primary }}
          >
            <Sparkles className="w-4 h-4" />
            <span>{themeColors[settings.theme].name}</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
            Wonderland Scheduler
          </h1>
          <p className="text-sm text-muted-foreground font-body">
            Tell me your tasks, and I'll craft the perfect schedule for you
          </p>
        </header>

        {/* Main Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
          {/* Chat Section */}
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden flex flex-col min-h-[500px]">
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
              <div className="text-center p-8">
                <div 
                  className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center opacity-50"
                  style={{ backgroundColor: themeColor.secondary }}
                >
                  <span className="text-3xl">🗓️</span>
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
