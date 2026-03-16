import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Moon, Sun, Coffee, Battery, BatteryLow, Heart, Zap, Clock, Calendar, X, PlayCircle, Plus, AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserSettings, EnergyLevel, StressLevel, ScheduleItem } from "@/types/schedule";
import CalendarImportModal, { CalendarEvent } from "./CalendarImportModal";
import { getFormattedDate, getTimeOfDayGreeting, getDayName } from "@/lib/dayGreetings";
import libraryBg from "@/assets/library-background.png";
import cozyBg from "@/assets/cozy-background.png";
import scheduleBg from "@/assets/schedule-background.png";
import bunnyMascot from "@/assets/bunny-mascot.png";
import speechBubbleWelcome from "@/assets/speech-bubble-welcome.png";

interface TaskEntry {
  id: string;
  title: string;
  duration: string;
  deadline: string;
  priority: "high" | "medium" | "low";
}

interface WizardInterfaceProps {
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
  onComplete: (tasks: string) => void;
  isLoading: boolean;
  generatedSchedule: ScheduleItem[];
}

// ─── SCENE DEFINITIONS ───
// Each scene has: background image, bunny position, bunny size, dialogue messages
type Scene = "library" | "cozy" | "energy" | "stress" | "schedule";

const SCENE_CONFIG = {
  library: {
    background: libraryBg,
    bunnyPosition: "bottom-[0%] right-[-1%]",
    bunnySize: "w-[22rem]",
    messages: [
      `${getTimeOfDayGreeting()}! It's ${getFormattedDate()} 🗓️`,
      "Hi there, my name is TimeBunny! Welcome to my home!",
      "Click on one of the books so we can get an idea of what your schedule is like!",
    ],
  },
  cozy: {
    background: cozyBg,
    bunnyPosition: "bottom-[16%] right-[-4%]",
    bunnySize: "w-[28rem]",
    messages: [
      "Great! Now that I have a better understanding of what your day is like, let's get started!",
      "Life can get messy and chaotic with responsibilities, school, work etc. It's hard to keep track of everything",
      "Here is a safe space for you to write about your day, tell me what's going on. I'm all ears",
      "Let it out, write it out! Click on the notepad to write about your day 📝",
    ],
  },
  energy: {
    background: scheduleBg,
    bunnyPosition: "bottom-[28%] right-[-4%]",
    bunnySize: "w-[28rem]",
    messages: [
      "Wow! You have a lot on your plate dear, what is your energy level?",
    ],
  },
  stress: {
    background: scheduleBg,
    bunnyPosition: "bottom-[28%] right-[-4%]",
    bunnySize: "w-[28rem]",
    messages: [
      "How is your stress level?",
    ],
  },
  schedule: {
    background: scheduleBg,
    bunnyPosition: "bottom-[28%] right-[-4%]",
    bunnySize: "w-[28rem]",
    messages: [
      `Here's your ${getDayName()} schedule! Tap on a task to get started!`,
    ],
  },
} as const;

type WizardStep = "greeting" | "mood" | "stress" | "sleep" | "breaks" | "tasks";

const WizardInterface = ({ settings, onSettingsChange, onComplete, isLoading, generatedSchedule }: WizardInterfaceProps) => {
  // ─── SCENE STATE (single source of truth) ───
  const [scene, setScene] = useState<Scene>("library");

  const [step, setStep] = useState<WizardStep>("tasks");
  const [breakFrequency, setBreakFrequency] = useState<"minimal" | "moderate" | "frequent">("moderate");
  const [taskEntries, setTaskEntries] = useState<TaskEntry[]>([
    { id: "1", title: "", duration: "", deadline: "", priority: "medium" },
  ]);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [importedEvents, setImportedEvents] = useState<CalendarEvent[]>([]);
  const [activeBookIndex, setActiveBookIndex] = useState<number | null>(null);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isAutoAdvancePending, setIsAutoAdvancePending] = useState(false);
  const [bubbleClickCount, setBubbleClickCount] = useState(0);
  const [journalText, setJournalText] = useState("");
  const [isJournalFocused, setIsJournalFocused] = useState(false);
  const [activeTask, setActiveTask] = useState<ScheduleItem | null>(null);
  const [showUpNext, setShowUpNext] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDuration, setTimerDuration] = useState(0); // total seconds
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer countdown effect
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [timerRunning]);

  const startTask = (item: ScheduleItem) => {
    const sorted = [...generatedSchedule].sort((a, b) => a.time.localeCompare(b.time));
    const idx = sorted.findIndex(s => s.id === item.id);
    let durationMinutes = 30; // default 30 min
    if (idx < sorted.length - 1) {
      const [h1, m1] = sorted[idx].time.split(":").map(Number);
      const [h2, m2] = sorted[idx + 1].time.split(":").map(Number);
      durationMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (durationMinutes <= 0) durationMinutes = 30;
    }
    const totalSec = durationMinutes * 60;
    setActiveTask(item);
    setTimerDuration(totalSec);
    setTimerSeconds(totalSec);
    setTimerRunning(true);
  };

  const stopTask = () => {
    setActiveTask(null);
    setTimerRunning(false);
    setTimerSeconds(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Auto-show bunny message when schedule arrives
  useEffect(() => {
    if (scene === "schedule" && generatedSchedule.length > 0 && !showSpeechBubble) {
      setShowSpeechBubble(true);
      setBubbleClickCount(1);
      typeMessage("Here's your schedule! Tap on a task to get started!");
    }
  }, [scene, generatedSchedule.length]);
  const nowStr = (() => {
    const n = new Date();
    return `${n.getHours().toString().padStart(2, "0")}:${n.getMinutes().toString().padStart(2, "0")}`;
  })();
  const [startTime, setStartTime] = useState(nowStr);

  const config = SCENE_CONFIG[scene];

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  // ─── TYPEWRITER HELPER ───
  const typeMessage = (msg: string, onDone?: () => void) => {
    setIsTyping(true);
    let i = 0;
    // Set first character immediately to avoid blank flicker
    setTypedText(msg.slice(0, 1));
    i = 1;
    if (msg.length <= 1) {
      setIsTyping(false);
      onDone?.();
      return;
    }
    const interval = setInterval(() => {
      i++;
      setTypedText(msg.slice(0, i));
      if (i >= msg.length) {
        clearInterval(interval);
        setIsTyping(false);
        onDone?.();
      }
    }, 40);
  };

  const handleCalendarImport = (events: CalendarEvent[]) => {
    setImportedEvents(events);
    // Transition from library → cozy scene
    setScene("cozy");
    // Reset speech bubble state for new scene
    setShowSpeechBubble(false);
    setTypedText("");
    setBubbleClickCount(0);
    setIsAutoAdvancePending(false);
  };

  const removeImportedEvent = (id: string) => {
    setImportedEvents(importedEvents.filter(e => e.id !== id));
  };

  const addTask = () => {
    setTaskEntries(prev => [...prev, {
      id: Date.now().toString(),
      title: "",
      duration: "",
      deadline: "",
      priority: "medium",
    }]);
  };

  const updateTask = (id: string, field: keyof TaskEntry, value: string) => {
    setTaskEntries(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const removeTask = (id: string) => {
    if (taskEntries.length > 1) {
      setTaskEntries(prev => prev.filter(t => t.id !== id));
    }
  };

  // Called when user clicks "Generate Schedule" in the journal
  const handleComplete = () => {
    setIsJournalFocused(false);
    setIsAutoAdvancePending(false);
    // Transition to energy scene
    setScene("energy");
    setBubbleClickCount(1);
    setShowSpeechBubble(true);
    typeMessage("How is your energy level?");
  };

  // Called after energy level is selected
  const submitSchedule = () => {
    const breakText = breakFrequency === "minimal" ? "Include minimal short breaks" 
      : breakFrequency === "moderate" ? "Include regular 15-minute breaks every 2 hours"
      : "Include frequent breaks - 10 minutes every hour";
    
    const validTasks = taskEntries.filter(t => t.title.trim());
    const tasksText = validTasks.map(t => {
      let line = `- ${t.title}`;
      if (t.duration) line += ` (estimated: ${t.duration})`;
      if (t.deadline) line += ` ⏰ DEADLINE: ${t.deadline}`;
      if (t.priority === "high") line += ` 🔴 HIGH PRIORITY`;
      else if (t.priority === "low") line += ` 🟢 LOW PRIORITY`;
      return line;
    }).join('\n');

    const deadlineTasks = validTasks.filter(t => t.deadline);
    const deadlineWarning = deadlineTasks.length > 0
      ? `\n\n🚨 DEADLINE ALERT: ${deadlineTasks.length} task(s) have deadlines. These MUST be completed before their deadline times. Schedule them with enough buffer time to finish. If a deadline is tight, WARN me.`
      : '';

    const eventsList = importedEvents.length > 0 
      ? `\n\n⚠️ FIXED CALENDAR EVENTS — These are immutable time blocks. Schedule everything else AROUND them:\n${importedEvents.map(e => 
          `- [FIXED] ${e.title} (${e.isAllDay ? 'All day' : `${e.startTime} - ${e.endTime}`})${e.description ? ` — ${e.description}` : ''}`
        ).join('\n')}\n\nPlease include these fixed events in the final schedule output and fill the gaps between them with my tasks.`
      : '';

    const startNote = `\n\nSchedule starts NOW at ${startTime} (current real time). Only schedule tasks from this time onwards, not from wake time.`;

    const journalNote = journalText.trim()
      ? `\n\nHere's what the user wrote about their day:\n"${journalText.trim()}"\nPlease incorporate any mentioned tasks, commitments, or context into the schedule.`
      : '';
    
    onComplete(`My tasks:\n${tasksText}${deadlineWarning}${eventsList}${journalNote}${startNote}\n\n${breakText}`);
  };

  const hasValidTasks = taskEntries.some(t => t.title.trim());

  // Book colors for the shelves
  const shelfBooks = [
    ["hsl(170 40% 60%)", "hsl(340 60% 70%)", "hsl(170 35% 55%)", "hsl(330 50% 75%)", "hsl(40 50% 80%)", "hsl(340 55% 65%)", "hsl(170 30% 65%)", "hsl(330 45% 70%)", "hsl(340 50% 60%)"],
    ["hsl(340 55% 75%)", "hsl(200 60% 65%)", "hsl(340 50% 70%)", "hsl(50 50% 70%)", "hsl(200 55% 60%)", "hsl(340 45% 65%)", "hsl(200 50% 70%)", "hsl(330 55% 75%)"],
    ["hsl(280 40% 65%)", "hsl(200 50% 60%)", "hsl(50 55% 65%)", "hsl(340 50% 70%)", "hsl(40 45% 75%)", "hsl(200 55% 65%)", "hsl(50 50% 60%)", "hsl(340 45% 60%)"],
  ];

  // ─── BUNNY CLICK HANDLER ───
  const handleBunnyClick = () => {
    if (isTyping || isAutoAdvancePending) return;

    const messages = config.messages;
    const maxMessages = messages.length;
    const nextCount = bubbleClickCount + 1;

    // Dismiss bubble after all messages shown
    if (showSpeechBubble && nextCount >= maxMessages + 1) {
      setShowSpeechBubble(false);
      setTypedText("");
      setBubbleClickCount(0);
      return;
    }

    const msgIndex = showSpeechBubble ? Math.min(nextCount - 1, messages.length - 1) : 0;
    const resetCount = showSpeechBubble ? nextCount : 1;
    setBubbleClickCount(resetCount);
    setShowSpeechBubble(true);

    const fullText = messages[msgIndex];
    typeMessage(fullText, () => {
      // Auto-advance in cozy scene: "Life can get messy..." → 2s → "Here is a safe space..."
      if (scene === "cozy" && fullText === SCENE_CONFIG.cozy.messages[1]) {
        setIsAutoAdvancePending(true);
        setTimeout(() => {
          const autoMsg = SCENE_CONFIG.cozy.messages[2];
          setBubbleClickCount(prev => prev + 1);
          setIsAutoAdvancePending(false);
          typeMessage(autoMsg);
        }, 2000);
      }
    });
  };

  return (
    <div className="fixed inset-0 overflow-hidden flex flex-col" style={{ background: "hsl(280 40% 85%)" }}>
      {/* Background image — driven by scene */}
      <AnimatePresence mode="wait">
        <motion.img
          key={scene}
          src={config.background}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
      </AnimatePresence>

      {/* Journal overlay — cozy scene only */}
      {scene === "cozy" && (
        <div
          className="absolute inset-0 z-[15] cursor-text"
          onClick={() => setIsJournalFocused(true)}
        >
          <AnimatePresence>
            {isJournalFocused && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute top-[8%] left-[8%] right-[40%] bottom-[15%]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative w-full h-full bg-card/90 backdrop-blur-md rounded-xl border border-primary/20 shadow-xl p-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsJournalFocused(false); }}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-foreground z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-muted-foreground mb-2" style={{ fontFamily: "var(--font-body)" }}>📝 Write about your day...</p>
                  <textarea
                    value={journalText}
                    onChange={(e) => setJournalText(e.target.value)}
                    placeholder="What's on your mind today?"
                    className="w-full bg-transparent resize-none focus:outline-none text-white placeholder:text-white/40 leading-[2rem]"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "1rem",
                      caretColor: "white",
                      height: journalText.trim() ? "calc(100% - 4.5rem)" : "calc(100% - 2rem)",
                    }}
                    autoFocus
                  />
                  {journalText.trim() && (
                    <div className="absolute bottom-3 left-4 right-4">
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleComplete(); }}
                        disabled={isLoading}
                        className="w-full text-lg"
                        size="lg"
                        style={{ fontFamily: "'Comic Sans MS', 'Comic Sans', cursive" }}
                      >
                        {isLoading ? "Sending..." : "Send"}
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Task step: interactive bookshelf — library scene only */}
      {scene === "library" && step === "tasks" && (
        <div className="relative z-10 flex-1 flex">
          {/* Left side - Bookshelf with clickable books */}
          <div className="w-1/2 relative flex flex-col justify-center p-4">
            <div className="absolute inset-0 flex flex-col justify-between py-[5%] px-[4%]">
              {shelfBooks.map((shelf, shelfIdx) => (
                <div key={shelfIdx} className="flex items-end gap-[2px] h-[28%] px-[2%] pb-[2%]">
                  {shelf.map((_, bookIdx) => {
                    const globalIdx = shelfIdx * shelf.length + bookIdx;
                    return (
                      <button
                        key={bookIdx}
                        onClick={() => setIsCalendarModalOpen(true)}
                        className="flex-1 h-full rounded-sm transition-all hover:brightness-110 hover:scale-y-105 cursor-pointer"
                        style={{ background: "transparent" }}
                        title={`Book ${globalIdx + 1} — click to import calendar`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Task input panel */}
          <div className="w-1/2 relative flex flex-col justify-end p-4">
            <div className="absolute top-4 left-4 right-4 bottom-[45%] z-20">
              <AnimatePresence mode="wait">
                {activeBookIndex !== null && taskEntries[activeBookIndex] ? (
                  <motion.div
                    key={activeBookIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-card/95 backdrop-blur-md rounded-xl border border-primary/20 shadow-xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="pixel-title-alt text-xs" style={{ color: "hsl(280 40% 50%)" }}>Book {activeBookIndex + 1}</span>
                      <button onClick={() => setActiveBookIndex(null)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={taskEntries[activeBookIndex].title}
                      onChange={(e) => updateTask(taskEntries[activeBookIndex].id, "title", e.target.value)}
                      placeholder="Write your task here..."
                      className="w-full bg-background/50 border border-primary/20 rounded-lg p-2 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <input type="text" value={taskEntries[activeBookIndex].duration} onChange={(e) => updateTask(taskEntries[activeBookIndex].id, "duration", e.target.value)} placeholder="Duration (e.g., 2h)" className="flex-1 bg-muted/20 border border-primary/10 rounded-lg px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none" />
                      <input type="text" value={taskEntries[activeBookIndex].deadline} onChange={(e) => updateTask(taskEntries[activeBookIndex].id, "deadline", e.target.value)} placeholder="Deadline" className="flex-1 bg-muted/20 border border-primary/10 rounded-lg px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none" />
                      <select value={taskEntries[activeBookIndex].priority} onChange={(e) => updateTask(taskEntries[activeBookIndex].id, "priority", e.target.value)} className="bg-muted/20 border border-primary/10 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none">
                        <option value="high">🔴 High</option>
                        <option value="medium">🟡 Med</option>
                        <option value="low">🟢 Low</option>
                      </select>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 pt-4">
                    {hasValidTasks && (
                      <div className="bg-card/80 backdrop-blur-sm rounded-lg p-2 border border-primary/10 w-full">
                        <p className="text-xs text-muted-foreground mb-1">Tasks added:</p>
                        {taskEntries.filter(t => t.title.trim()).map((t) => (
                          <div key={t.id} className="text-xs text-foreground flex items-center gap-1">
                            <span>{t.priority === "high" ? "🔴" : t.priority === "low" ? "🟢" : "🟡"}</span>
                            <span className="truncate">{t.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {hasValidTasks && (
                      <Button onClick={handleComplete} disabled={isLoading} className="w-full mt-2 gap-2 font-body text-sm" size="sm">
                        <PlayCircle className="w-4 h-4" />
                        {isLoading ? "Generating..." : "Generate Schedule"}
                      </Button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* Energy level buttons — energy scene only */}
      <AnimatePresence>
        {scene === "energy" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute left-[6%] top-[20%] z-30 flex flex-col gap-10"
          >
            {(["high", "standard", "low"] as const).map((level) => (
              <button
                key={level}
                onClick={() => {
                  updateSetting("energyLevel", level === "high" ? "motivated" : "unmotivated");
                  // Transition to stress scene
                  setScene("stress");
                  setBubbleClickCount(1);
                  setShowSpeechBubble(true);
                  typeMessage("How is your stress level?");
                }}
                className="px-10 py-3 rounded-full cursor-pointer transition-all hover:scale-105 active:scale-95"
                style={{ background: "hsl(197 71% 73%)" }}
              >
                <span className="pixel-title-alt text-xl" style={{ color: "hsl(330 80% 55%)" }}>
                  {level}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stress level buttons — stress scene only */}
      <AnimatePresence>
        {scene === "stress" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute left-[6%] top-[20%] z-30 flex flex-col gap-10"
          >
            {(["high", "average", "low"] as const).map((level) => (
              <button
                key={level}
                onClick={() => {
                  updateSetting("stressLevel", level === "average" ? "medium" : level);
                  setShowSpeechBubble(false);
                  setTypedText("");
                  submitSchedule();
                  setScene("schedule");
                }}
                className="px-10 py-3 rounded-full cursor-pointer transition-all hover:scale-105 active:scale-95"
                style={{ background: "hsl(50 100% 50%)" }}
              >
                <span className="pixel-title-alt text-xl" style={{ color: "hsl(120 60% 20%)" }}>
                  {level}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule display — schedule scene */}
      {scene === "schedule" && (
        <div className="absolute inset-0 z-[15] flex items-center justify-start p-8">
          <div className="max-w-md w-full max-h-[80vh] overflow-y-auto">
            {isLoading && generatedSchedule.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4 p-8"
              >
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: "hsl(280 40% 50%)" }} />
                <p className="pixel-title-alt text-lg" style={{ color: "hsl(280 40% 40%)" }}>
                  Creating your schedule...
                </p>
              </motion.div>
            ) : activeTask ? (
              /* Timer view — active task with clock background */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
                style={{ background: "hsl(300 50% 88%)" }}
              >
                {/* Clock outline background */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                  <div
                    className="rounded-full absolute"
                    style={{
                      width: "140vmax",
                      height: "140vmax",
                      border: "16px solid hsl(90 80% 45%)",
                      background: "hsl(40 60% 95%)",
                    }}
                  >
                    <div className="absolute top-[2%] left-1/2 -translate-x-1/2 w-[16px] h-[60px] rounded-full" style={{ background: "hsl(90 80% 45%)" }} />
                    <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2 w-[16px] h-[60px] rounded-full" style={{ background: "hsl(90 80% 45%)" }} />
                    <div className="absolute left-[2%] top-1/2 -translate-y-1/2 w-[60px] h-[16px] rounded-full" style={{ background: "hsl(90 80% 45%)" }} />
                    <div className="absolute right-[2%] top-1/2 -translate-y-1/2 w-[60px] h-[16px] rounded-full" style={{ background: "hsl(90 80% 45%)" }} />
                    <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[10px] h-[30%] rounded-full origin-bottom rotate-[30deg]" style={{ background: "hsl(90 80% 45% / 0.7)" }} />
                    <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[8px] h-[35%] rounded-full origin-bottom rotate-[-60deg]" style={{ background: "hsl(90 80% 45% / 0.7)" }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full" style={{ background: "hsl(90 80% 45%)" }} />
                  </div>
                </div>

                {/* Clock tick marks */}
                <div className="absolute inset-0 pointer-events-none z-[1] flex items-center justify-center">
                  <div className="relative" style={{ width: "min(150vw, 150vh)", height: "min(150vw, 150vh)" }}>
                    {Array.from({ length: 60 }).map((_, i) => {
                      const isHour = i % 5 === 0;
                      const angle = i * 6;
                      return (
                        <div
                          key={i}
                          className="absolute top-0 left-1/2 -translate-x-1/2 origin-bottom"
                          style={{ height: "50%", transform: `translateX(-50%) rotate(${angle}deg)` }}
                        >
                          <div
                            className="rounded-full mx-auto"
                            style={{
                              width: isHour ? "6px" : "3px",
                              height: isHour ? "24px" : "12px",
                              background: isHour ? "hsl(90 80% 45% / 0.7)" : "hsl(90 80% 45% / 0.3)",
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Up Next tab - positioned top-left */}
                {(() => {
                  const sorted = [...generatedSchedule].sort((a, b) => a.time.localeCompare(b.time));
                  const currentIdx = sorted.findIndex(s => s.id === activeTask.id);
                  const upcoming = sorted.slice(currentIdx + 1);
                  return (
                    <div className="absolute top-24 left-6 z-20 w-64">
                      {/* Tab header */}
                      <button
                        onClick={() => setShowUpNext(prev => !prev)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-t-2xl shadow-lg transition-all hover:brightness-105"
                        style={{
                          background: "hsl(280 30% 92%)",
                          border: "2px solid hsl(280 30% 75%)",
                          borderBottom: showUpNext ? "none" : undefined,
                          borderRadius: showUpNext ? "1rem 1rem 0 0" : "1rem",
                        }}
                      >
                        <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-body)", color: "hsl(280 40% 25%)" }}>
                          Up Next
                        </span>
                        <motion.span
                          animate={{ rotate: showUpNext ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ color: "hsl(280 40% 50%)" }}
                        >
                          ▼
                        </motion.span>
                      </button>

                      {/* Expandable task list */}
                      <AnimatePresence>
                        {showUpNext && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden rounded-b-2xl shadow-lg"
                            style={{
                              background: "hsl(280 30% 96%)",
                              border: "2px solid hsl(280 30% 75%)",
                              borderTop: "1px solid hsl(280 30% 85%)",
                            }}
                          >
                            <div className="max-h-[50vh] overflow-y-auto p-2 space-y-1.5">
                              {upcoming.length === 0 ? (
                                <p className="text-xs text-center py-3" style={{ fontFamily: "var(--font-body)", color: "hsl(280 40% 50%)" }}>
                                  No more tasks — you're done! ✧
                                </p>
                              ) : (
                                upcoming.map((item, i) => (
                                  <button
                                    key={item.id}
                                    onClick={() => startTask(item)}
                                    className="w-full text-left px-3 py-2 rounded-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    style={{
                                      background: item.title.toLowerCase().includes("break")
                                        ? "hsl(150 50% 85%)"
                                        : "hsl(280 30% 92%)",
                                      border: `1.5px solid ${item.title.toLowerCase().includes("break") ? "hsl(150 40% 65%)" : "hsl(280 30% 80%)"}`,
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] shrink-0" style={{ color: "hsl(0 0% 0%)", fontFamily: "'Squartiqa 4F', 'Share Tech Mono', monospace" }}>
                                        {(() => {
                                          const [h, m] = item.time.split(":");
                                          const hour = parseInt(h);
                                          const ampm = hour >= 12 ? "PM" : "AM";
                                          const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                                          return `${h12}:${m} ${ampm}`;
                                        })()}
                                      </span>
                                      <span className="text-xs font-semibold truncate" style={{ fontFamily: "var(--font-body)", color: "hsl(280 40% 25%)" }}>
                                        {item.title}
                                      </span>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })()}

                {/* Timer content */}
                <div className="relative z-10 flex flex-col items-center gap-6 mt-[35vh]">

                {/* Countdown timer */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="text-6xl font-bold tracking-wider"
                    style={{ fontFamily: "'SCR N Seven', 'Share Tech Mono', monospace", color: "hsl(280 40% 30%)" }}
                  >
                    {formatTimer(timerSeconds)}
                  </div>
                  <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "hsl(280 40% 50%)" }}>
                    {timerSeconds === 0 ? "Time's up!" : timerRunning ? "In progress..." : "Paused"}
                  </p>
                </div>

                {/* Timer controls */}
                <div className="flex gap-3">
                  {timerRunning ? (
                    <button
                      onClick={() => setTimerRunning(false)}
                      className="px-6 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
                      style={{ background: "hsl(45 90% 55%)", fontFamily: "var(--font-body)" }}
                    >
                      Pause
                    </button>
                  ) : timerSeconds > 0 ? (
                    <button
                      onClick={() => setTimerRunning(true)}
                      className="px-6 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
                      style={{ background: "hsl(150 50% 65%)", fontFamily: "var(--font-body)" }}
                    >
                      Resume
                    </button>
                  ) : null}
                  <button
                    onClick={stopTask}
                    className="px-6 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
                    style={{ background: "hsl(350 60% 75%)", fontFamily: "var(--font-body)" }}
                  >
                    {timerSeconds === 0 ? "Back to Schedule" : "Stop"}
                  </button>
                </div>

                {/* Progress bar */}
                {timerDuration > 0 && (
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "hsl(280 20% 85%)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "hsl(280 40% 55%)" }}
                      animate={{ width: `${((timerDuration - timerSeconds) / timerDuration) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-3">
                {[...generatedSchedule].sort((a, b) => a.time.localeCompare(b.time)).map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    onClick={() => startTask(item)}
                    className="w-full text-left px-5 py-3 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
                    style={{
                      background: item.title.toLowerCase().includes("break")
                        ? "hsl(150 50% 85%)"
                        : "hsl(280 30% 92%)",
                      border: `2px solid ${item.title.toLowerCase().includes("break") ? "hsl(150 40% 65%)" : "hsl(280 30% 75%)"}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs shrink-0" style={{ color: "hsl(0 0% 0%)", fontFamily: "'Squartiqa 4F', 'Share Tech Mono', monospace" }}>
                        {(() => {
                          const [h, m] = item.time.split(":");
                          const hour = parseInt(h);
                          const ampm = hour >= 12 ? "PM" : "AM";
                          const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                          return `${h12}:${m} ${ampm}`;
                        })()}
                      </span>
                      <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-body)", color: "hsl(280 40% 25%)" }}>
                        {item.title}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs mt-1 ml-12 opacity-70" style={{ fontFamily: "var(--font-body)", color: "hsl(280 40% 35%)" }}>
                        {item.description}
                      </p>
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bunny mascot — position & size driven by scene config */}
      <div className={`absolute z-20 transition-all duration-700 ${config.bunnyPosition}`}>
        <div className="relative cursor-pointer" onClick={handleBunnyClick}>
          <AnimatePresence>
            {showSpeechBubble && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className="absolute -top-16 right-[60%] w-72 sm:w-80 z-30"
              >
                <div
                  className="relative bg-white p-5 shadow-xl"
                  style={{
                    borderRadius: "50%",
                    minHeight: "5.5rem",
                    border: "3px solid hsl(280 40% 20%)",
                    outline: "2px solid hsl(280 40% 20%)",
                    outlineOffset: "3px",
                    boxShadow: "4px 4px 0px hsl(280 40% 20%)",
                  }}
                >
                  <p className="text-sm text-center leading-relaxed" style={{ fontFamily: "var(--font-body)", color: "hsl(280 40% 25%)" }}>
                    {typedText}
                    {isTyping && <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />}
                  </p>
                </div>
                {/* Comic tail */}
                <div className="relative h-12 w-full">
                  <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="absolute right-[30%] top-0 w-4 h-4 bg-white border-2 rounded-full" style={{ borderColor: "hsl(280 40% 20%)" }} />
                  <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="absolute right-[20%] top-4 w-2.5 h-2.5 bg-white border-2 rounded-full" style={{ borderColor: "hsl(280 40% 20%)" }} />
                  <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="absolute right-[12%] top-8 w-1.5 h-1.5 bg-white border-2 rounded-full" style={{ borderColor: "hsl(280 40% 20%)" }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <img
            src={bunnyMascot}
            alt="TimeBunny mascot"
            className={`object-contain drop-shadow-xl transition-all duration-700 hover:scale-105 active:scale-95 ${config.bunnySize}`}
          />
        </div>
      </div>

      <CalendarImportModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        onImport={handleCalendarImport}
      />
    </div>
  );
};

export default WizardInterface;
