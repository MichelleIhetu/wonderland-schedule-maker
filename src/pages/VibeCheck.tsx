import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smile, Meh, Frown, Battery, BatteryLow, BatteryMedium,
  Coffee, CheckCircle2, ArrowRight, ArrowLeft, Sparkles,
  RefreshCw, CalendarClock, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CartoonBunny from "@/components/KawaiiBunny";
import SpiderWebBackground from "@/components/SpiderWebBackground";
import ThemeBackground from "@/components/ThemeBackground";
import type { BackgroundTheme } from "@/types/schedule";

export interface VibeCheckResult {
  mood: "great" | "okay" | "struggling";
  energy: "high" | "medium" | "low";
  needBreak: boolean;
  adjustSchedule: "keep" | "lighten" | "reschedule";
  notes: string;
}

type Step = "mood" | "energy" | "break" | "adjust" | "done";

const stepOrder: Step[] = ["mood", "energy", "break", "adjust", "done"];

const VibeCheck = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const backgroundTheme: BackgroundTheme = (location.state as any)?.backgroundTheme ?? "gothic";

  const [step, setStep] = useState<Step>("mood");
  const [mood, setMood] = useState<VibeCheckResult["mood"] | null>(null);
  const [energy, setEnergy] = useState<VibeCheckResult["energy"] | null>(null);
  const [needBreak, setNeedBreak] = useState(false);
  const [adjustSchedule, setAdjustSchedule] = useState<VibeCheckResult["adjustSchedule"] | null>(null);
  const [notes, setNotes] = useState("");

  const currentIndex = stepOrder.indexOf(step);
  const progress = ((currentIndex + 1) / stepOrder.length) * 100;

  const canProceed = () => {
    if (step === "mood") return mood !== null;
    if (step === "energy") return energy !== null;
    if (step === "break") return true;
    if (step === "adjust") return adjustSchedule !== null;
    return true;
  };

  const goNext = () => {
    const idx = stepOrder.indexOf(step);
    if (idx < stepOrder.length - 1) setStep(stepOrder[idx + 1]);
  };

  const goBack = () => {
    const idx = stepOrder.indexOf(step);
    if (idx > 0) setStep(stepOrder[idx - 1]);
  };

  const getBunnyMessage = () => {
    switch (step) {
      case "mood": return "Hey! How are you vibing right now? 🐰";
      case "energy": return "And your energy levels?";
      case "break": return "Do you need some time to recharge?";
      case "adjust": return "Should we change up your schedule?";
      case "done": return getResultMessage();
    }
  };

  const getResultMessage = () => {
    if (mood === "struggling") return "Hang in there! Let's make things easier for you 💪";
    if (mood === "great") return "You're on fire! Keep that momentum! 🔥";
    return "Steady progress is still progress! ✨";
  };

  const getBunnyMood = () => {
    if (step === "done" && mood === "great") return "celebrating" as const;
    if (step === "done" && mood === "struggling") return "encouraging" as const;
    return "happy" as const;
  };

  const handleFinish = () => {
    const result: VibeCheckResult = {
      mood: mood!,
      energy: energy!,
      needBreak,
      adjustSchedule: adjustSchedule!,
      notes,
    };
    navigate("/", { state: { vibeCheckResult: result } });
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {backgroundTheme === "gothic" ? (
        <SpiderWebBackground />
      ) : (
        <ThemeBackground theme={backgroundTheme} />
      )}

      <div className="relative z-10 w-full max-w-lg mx-auto px-4">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center font-body">
            Vibe Check — Step {currentIndex + 1} of {stepOrder.length}
          </p>
        </div>

        {/* Card */}
        <motion.div
          className="bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Bunny header */}
          <div className="pt-8 pb-4 flex flex-col items-center">
            <CartoonBunny mood={getBunnyMood()} size="sm" message={getBunnyMessage()} />
          </div>

          {/* Step content */}
          <div className="px-6 pb-6">
            <AnimatePresence mode="wait">
              {step === "mood" && (
                <motion.div key="mood" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
                  <h2 className="text-center font-display text-xl text-foreground">How's your motivation?</h2>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { value: "great" as const, icon: Smile, label: "Locked in 🔥", color: "green" },
                      { value: "okay" as const, icon: Meh, label: "Mid vibes", color: "yellow" },
                      { value: "struggling" as const, icon: Frown, label: "Not it 😮‍💨", color: "red" },
                    ]).map(({ value, icon: Icon, label, color }) => (
                      <button
                        key={value}
                        onClick={() => setMood(value)}
                        className={`p-5 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                          mood === value
                            ? `border-${color}-500 bg-${color}-500/10 scale-105`
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <Icon className={`w-10 h-10 ${mood === value ? `text-${color}-500` : "text-muted-foreground"}`} />
                        <p className="text-xs font-body font-medium">{label}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === "energy" && (
                <motion.div key="energy" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
                  <h2 className="text-center font-display text-xl text-foreground">Energy level?</h2>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { value: "high" as const, icon: Battery, label: "Full charge ⚡", color: "green" },
                      { value: "medium" as const, icon: BatteryMedium, label: "Getting there", color: "yellow" },
                      { value: "low" as const, icon: BatteryLow, label: "Running low 🪫", color: "red" },
                    ]).map(({ value, icon: Icon, label, color }) => (
                      <button
                        key={value}
                        onClick={() => setEnergy(value)}
                        className={`p-5 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                          energy === value
                            ? `border-${color}-500 bg-${color}-500/10 scale-105`
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <Icon className={`w-10 h-10 ${energy === value ? `text-${color}-500` : "text-muted-foreground"}`} />
                        <p className="text-xs font-body font-medium">{label}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === "break" && (
                <motion.div key="break" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
                  <h2 className="text-center font-display text-xl text-foreground">Need a break?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setNeedBreak(false)}
                      className={`p-5 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                        !needBreak ? "border-primary bg-primary/10 scale-105" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <Zap className={`w-10 h-10 ${!needBreak ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="text-center">
                        <p className="text-sm font-body font-medium">Nah, I'm good</p>
                        <p className="text-xs text-muted-foreground">Keep the grind going</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setNeedBreak(true)}
                      className={`p-5 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                        needBreak ? "border-primary bg-primary/10 scale-105" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <Coffee className={`w-10 h-10 ${needBreak ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="text-center">
                        <p className="text-sm font-body font-medium">Yes please 🙏</p>
                        <p className="text-xs text-muted-foreground">Add a break soon</p>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "adjust" && (
                <motion.div key="adjust" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
                  <h2 className="text-center font-display text-xl text-foreground">Adjust your schedule?</h2>
                  <div className="space-y-3">
                    {([
                      { value: "keep" as const, icon: CheckCircle2, title: "Keep it as is", desc: "I'm on track, no changes needed" },
                      { value: "lighten" as const, icon: CalendarClock, title: "Lighten the load", desc: "Push non-urgent tasks to later or tomorrow" },
                      { value: "reschedule" as const, icon: RefreshCw, title: "Reschedule everything", desc: "Rebuild my schedule from now" },
                    ]).map(({ value, icon: Icon, title, desc }) => (
                      <button
                        key={value}
                        onClick={() => setAdjustSchedule(value)}
                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left ${
                          adjustSchedule === value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <Icon className={`w-6 h-6 shrink-0 ${adjustSchedule === value ? "text-primary" : "text-muted-foreground"}`} />
                        <div>
                          <p className="text-sm font-body font-medium text-foreground">{title}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <Textarea
                    placeholder="Anything else on your mind? (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[80px] resize-none mt-2"
                  />
                </motion.div>
              )}

              {step === "done" && (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-body text-foreground">Vibe Check Complete!</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 py-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Mood</p>
                      <p className="text-lg">{mood === "great" ? "🔥" : mood === "okay" ? "😐" : "😮‍💨"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Energy</p>
                      <p className="text-lg">{energy === "high" ? "⚡" : energy === "medium" ? "🔋" : "🪫"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Break</p>
                      <p className="text-lg">{needBreak ? "☕" : "💪"}</p>
                    </div>
                  </div>

                  {adjustSchedule !== "keep" && (
                    <p className="text-sm text-muted-foreground font-body">
                      {adjustSchedule === "lighten"
                        ? "We'll push non-urgent tasks out to lighten your load."
                        : "We'll rebuild your schedule from now — hang tight!"}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer nav */}
          <div className="px-6 pb-6 flex gap-3">
            {step !== "mood" && step !== "done" && (
              <Button variant="outline" onClick={goBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            )}
            <div className="flex-1" />
            {step !== "done" ? (
              <Button onClick={goNext} disabled={!canProceed()} className="gap-2">
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} className="gap-2 w-full">
                <Sparkles className="w-4 h-4" />
                {adjustSchedule === "keep" ? "Back to Schedule" : "Update Schedule"}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VibeCheck;
