import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smile, Meh, Frown, Battery, BatteryLow, BatteryMedium, Coffee, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CartoonBunny from "./KawaiiBunny";

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CheckInData) => void;
  currentTask?: string;
}

export interface CheckInData {
  mood: "great" | "okay" | "struggling";
  energy: "high" | "medium" | "low";
  taskUpdate: string;
  needBreak: boolean;
}

const CheckInModal = ({ isOpen, onClose, onSubmit, currentTask }: CheckInModalProps) => {
  const [mood, setMood] = useState<CheckInData["mood"] | null>(null);
  const [energy, setEnergy] = useState<CheckInData["energy"] | null>(null);
  const [taskUpdate, setTaskUpdate] = useState("");
  const [needBreak, setNeedBreak] = useState(false);
  const [step, setStep] = useState(1);

  const getBunnyMessage = () => {
    if (step === 1) return "How are you feeling right now?";
    if (step === 2) return "How's your energy level?";
    if (step === 3) return "Any updates on your tasks?";
    return "Thank you for checking in!";
  };

  const getBunnyMood = () => {
    if (mood === "great") return "celebrating";
    if (mood === "struggling") return "encouraging";
    return "happy";
  };

  const handleSubmit = () => {
    if (mood && energy) {
      onSubmit({
        mood,
        energy,
        taskUpdate,
        needBreak,
      });
      // Reset form
      setMood(null);
      setEnergy(null);
      setTaskUpdate("");
      setNeedBreak(false);
      setStep(1);
      onClose();
    }
  };

  const canProceed = () => {
    if (step === 1) return mood !== null;
    if (step === 2) return energy !== null;
    return true;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg text-foreground">Hourly Check-In</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Bunny */}
              <div className="flex justify-center mb-6">
                <CartoonBunny mood={getBunnyMood()} size="sm" message={getBunnyMessage()} />
              </div>

              <AnimatePresence mode="wait">
                {/* Step 1: Mood */}
                {step === 1 && (
                  <motion.div
                    key="mood"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <p className="text-center text-sm text-muted-foreground font-body">
                      It's been an hour! Let's see how you're doing.
                    </p>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setMood("great")}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          mood === "great"
                            ? "border-green-500 bg-green-500/10"
                            : "border-border hover:border-green-500/50"
                        }`}
                      >
                        <Smile className={`w-8 h-8 mx-auto mb-2 ${mood === "great" ? "text-green-500" : "text-muted-foreground"}`} />
                        <p className="text-xs font-body text-center">Great!</p>
                      </button>
                      
                      <button
                        onClick={() => setMood("okay")}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          mood === "okay"
                            ? "border-yellow-500 bg-yellow-500/10"
                            : "border-border hover:border-yellow-500/50"
                        }`}
                      >
                        <Meh className={`w-8 h-8 mx-auto mb-2 ${mood === "okay" ? "text-yellow-500" : "text-muted-foreground"}`} />
                        <p className="text-xs font-body text-center">Okay</p>
                      </button>
                      
                      <button
                        onClick={() => setMood("struggling")}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          mood === "struggling"
                            ? "border-red-500 bg-red-500/10"
                            : "border-border hover:border-red-500/50"
                        }`}
                      >
                        <Frown className={`w-8 h-8 mx-auto mb-2 ${mood === "struggling" ? "text-red-500" : "text-muted-foreground"}`} />
                        <p className="text-xs font-body text-center">Struggling</p>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Energy */}
                {step === 2 && (
                  <motion.div
                    key="energy"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setEnergy("high")}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          energy === "high"
                            ? "border-green-500 bg-green-500/10"
                            : "border-border hover:border-green-500/50"
                        }`}
                      >
                        <Battery className={`w-8 h-8 mx-auto mb-2 ${energy === "high" ? "text-green-500" : "text-muted-foreground"}`} />
                        <p className="text-xs font-body text-center">High</p>
                      </button>
                      
                      <button
                        onClick={() => setEnergy("medium")}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          energy === "medium"
                            ? "border-yellow-500 bg-yellow-500/10"
                            : "border-border hover:border-yellow-500/50"
                        }`}
                      >
                        <BatteryMedium className={`w-8 h-8 mx-auto mb-2 ${energy === "medium" ? "text-yellow-500" : "text-muted-foreground"}`} />
                        <p className="text-xs font-body text-center">Medium</p>
                      </button>
                      
                      <button
                        onClick={() => setEnergy("low")}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          energy === "low"
                            ? "border-red-500 bg-red-500/10"
                            : "border-border hover:border-red-500/50"
                        }`}
                      >
                        <BatteryLow className={`w-8 h-8 mx-auto mb-2 ${energy === "low" ? "text-red-500" : "text-muted-foreground"}`} />
                        <p className="text-xs font-body text-center">Low</p>
                      </button>
                    </div>

                    {/* Need break option */}
                    <button
                      onClick={() => setNeedBreak(!needBreak)}
                      className={`w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        needBreak
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Coffee className={`w-5 h-5 ${needBreak ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-sm font-body">I need a longer break</span>
                      {needBreak && <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />}
                    </button>
                  </motion.div>
                )}

                {/* Step 3: Task Update */}
                {step === 3 && (
                  <motion.div
                    key="update"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {currentTask && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Current Task:</p>
                        <p className="text-sm font-body text-foreground">{currentTask}</p>
                      </div>
                    )}
                    
                    <Textarea
                      placeholder="Share any updates, blockers, or wins..."
                      value={taskUpdate}
                      onChange={(e) => setTaskUpdate(e.target.value)}
                      className="min-h-[100px] resize-none"
                    />
                    
                    <p className="text-xs text-muted-foreground text-center">
                      This helps you track your progress throughout the day!
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border flex gap-3">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                  Back
                </Button>
              )}
              
              {step < 3 ? (
                <Button 
                  onClick={() => setStep(step + 1)} 
                  disabled={!canProceed()}
                  className="flex-1"
                >
                  Continue
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="flex-1 gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Complete Check-In
                </Button>
              )}
            </div>

            {/* Progress dots */}
            <div className="pb-4 flex justify-center gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    s === step ? "bg-primary" : s < step ? "bg-primary/50" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CheckInModal;
