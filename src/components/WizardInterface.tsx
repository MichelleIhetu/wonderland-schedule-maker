import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Moon, Sun, Coffee, Battery, BatteryLow, Heart, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserSettings, EnergyLevel, StressLevel } from "@/types/schedule";

interface WizardInterfaceProps {
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
  onComplete: (tasks: string) => void;
  isLoading: boolean;
}

type WizardStep = "greeting" | "mood" | "stress" | "sleep" | "breaks" | "tasks";

const WizardInterface = ({ settings, onSettingsChange, onComplete, isLoading }: WizardInterfaceProps) => {
  const [step, setStep] = useState<WizardStep>("greeting");
  const [breakFrequency, setBreakFrequency] = useState<"minimal" | "moderate" | "frequent">("moderate");
  const [tasks, setTasks] = useState("");

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleComplete = () => {
    const breakText = breakFrequency === "minimal" ? "Include minimal short breaks" 
      : breakFrequency === "moderate" ? "Include regular 15-minute breaks every 2 hours"
      : "Include frequent breaks - 10 minutes every hour";
    
    onComplete(`${tasks}\n\n${breakText}`);
  };

  const steps: WizardStep[] = ["greeting", "mood", "stress", "sleep", "breaks", "tasks"];
  const currentIndex = steps.indexOf(step);

  const bunnyMessages: Record<WizardStep, string> = {
    greeting: "Hello there! I'm the White Rabbit, and I'm here to help you plan your day! Let's make sure you're never late again! 🐰",
    mood: "How are you feeling today? Your energy level helps me plan the perfect schedule!",
    stress: "And what about your stress level? Don't worry, I'll make sure to include some calming activities!",
    sleep: "When do you wake up and when do you plan to sleep? Every minute counts in Wonderland!",
    breaks: "Everyone needs a break for tea time! How often would you like to rest?",
    tasks: "Wonderful! Now tell me about your tasks for today, and I'll weave them into the perfect schedule!"
  };

  return (
    <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-primary/20 shadow-glow p-6 min-h-[500px] flex flex-col">
      {/* Progress indicator */}
      <div className="flex gap-2 mb-6">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full transition-all duration-300 ${
              i <= currentIndex ? "bg-primary" : "bg-muted/30"
            }`}
          />
        ))}
      </div>

      {/* Bunny message */}
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex items-start gap-4 mb-8"
      >
        <div className="text-4xl">🐰</div>
        <div className="bg-muted/30 rounded-2xl rounded-tl-none p-4 flex-1">
          <p className="text-foreground font-body">{bunnyMessages[step]}</p>
        </div>
      </motion.div>

      {/* Step content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {step === "greeting" && (
            <motion.div
              key="greeting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center h-full gap-6"
            >
              <div className="text-6xl animate-bounce">⏰</div>
              <Button
                size="lg"
                onClick={() => setStep("mood")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Let's Begin!
              </Button>
            </motion.div>
          )}

          {step === "mood" && (
            <motion.div
              key="mood"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <button
                onClick={() => {
                  updateSetting("energyLevel", "motivated");
                  setStep("stress");
                }}
                className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                  settings.energyLevel === "motivated"
                    ? "border-primary bg-primary/20"
                    : "border-primary/20 bg-card/50 hover:border-primary/50"
                }`}
              >
                <Battery className="w-12 h-12 mx-auto mb-3 text-green-400" />
                <h3 className="font-display text-lg text-foreground">Energized</h3>
                <p className="text-sm text-muted-foreground mt-1">Ready to tackle anything!</p>
              </button>

              <button
                onClick={() => {
                  updateSetting("energyLevel", "unmotivated");
                  setStep("stress");
                }}
                className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                  settings.energyLevel === "unmotivated"
                    ? "border-primary bg-primary/20"
                    : "border-primary/20 bg-card/50 hover:border-primary/50"
                }`}
              >
                <BatteryLow className="w-12 h-12 mx-auto mb-3 text-amber-400" />
                <h3 className="font-display text-lg text-foreground">Low Energy</h3>
                <p className="text-sm text-muted-foreground mt-1">Taking it easy today</p>
              </button>
            </motion.div>
          )}

          {step === "stress" && (
            <motion.div
              key="stress"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              {(["low", "medium", "high"] as StressLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    updateSetting("stressLevel", level);
                    setStep("sleep");
                  }}
                  className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                    settings.stressLevel === level
                      ? "border-primary bg-primary/20"
                      : "border-primary/20 bg-card/50 hover:border-primary/50"
                  }`}
                >
                  {level === "low" && <Heart className="w-10 h-10 mx-auto mb-3 text-green-400" />}
                  {level === "medium" && <Coffee className="w-10 h-10 mx-auto mb-3 text-amber-400" />}
                  {level === "high" && <Zap className="w-10 h-10 mx-auto mb-3 text-red-400" />}
                  <h3 className="font-display text-lg text-foreground capitalize">{level}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {level === "low" && "Calm and relaxed"}
                    {level === "medium" && "Some pressure"}
                    {level === "high" && "Lots on my mind"}
                  </p>
                </button>
              ))}
            </motion.div>
          )}

          {step === "sleep" && (
            <motion.div
              key="sleep"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-card/50 rounded-xl p-6 border border-primary/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Sun className="w-6 h-6 text-amber-400" />
                    <span className="font-display text-foreground">Wake Up Time</span>
                  </div>
                  <input
                    type="time"
                    value={settings.wakeTime}
                    onChange={(e) => updateSetting("wakeTime", e.target.value)}
                    className="w-full bg-background/50 border border-primary/20 rounded-lg p-3 text-foreground text-center text-xl"
                  />
                </div>

                <div className="bg-card/50 rounded-xl p-6 border border-primary/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Moon className="w-6 h-6 text-primary" />
                    <span className="font-display text-foreground">Bed Time</span>
                  </div>
                  <input
                    type="time"
                    value={settings.bedTime}
                    onChange={(e) => updateSetting("bedTime", e.target.value)}
                    className="w-full bg-background/50 border border-primary/20 rounded-lg p-3 text-foreground text-center text-xl"
                  />
                </div>
              </div>

              <Button
                onClick={() => setStep("breaks")}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Continue
              </Button>
            </motion.div>
          )}

          {step === "breaks" && (
            <motion.div
              key="breaks"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              {([
                { value: "minimal", label: "Minimal", desc: "Short breaks only", icon: "⚡" },
                { value: "moderate", label: "Balanced", desc: "15 min every 2 hours", icon: "☕" },
                { value: "frequent", label: "Frequent", desc: "10 min every hour", icon: "🍵" },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setBreakFrequency(option.value);
                    setStep("tasks");
                  }}
                  className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                    breakFrequency === option.value
                      ? "border-primary bg-primary/20"
                      : "border-primary/20 bg-card/50 hover:border-primary/50"
                  }`}
                >
                  <span className="text-4xl block mb-3">{option.icon}</span>
                  <h3 className="font-display text-lg text-foreground">{option.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{option.desc}</p>
                </button>
              ))}
            </motion.div>
          )}

          {step === "tasks" && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <textarea
                value={tasks}
                onChange={(e) => setTasks(e.target.value)}
                placeholder="Tell me about your tasks for today...&#10;&#10;For example:&#10;- Study for math exam (2 hours)&#10;- Work on essay (1 hour)&#10;- Go to gym&#10;- Call mom"
                className="w-full h-48 bg-background/50 border border-primary/20 rounded-xl p-4 text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/50"
              />

              <Button
                onClick={handleComplete}
                disabled={!tasks.trim() || isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                {isLoading ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin" />
                    Creating your schedule...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate My Schedule!
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Back button */}
      {step !== "greeting" && (
        <Button
          variant="ghost"
          onClick={() => setStep(steps[currentIndex - 1])}
          className="mt-4 text-muted-foreground"
          disabled={isLoading}
        >
          ← Go Back
        </Button>
      )}
    </div>
  );
};

export default WizardInterface;
