import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Moon, Sun, Coffee, Battery, BatteryLow, Heart, Zap, Clock, Calendar, X, PlayCircle, Plus, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserSettings, EnergyLevel, StressLevel } from "@/types/schedule";
import CalendarImportModal, { CalendarEvent } from "./CalendarImportModal";
import libraryBg from "@/assets/library-background.png";
import cozyBg from "@/assets/cozy-background.png";
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
}

type WizardStep = "greeting" | "mood" | "stress" | "sleep" | "breaks" | "tasks";

const WizardInterface = ({ settings, onSettingsChange, onComplete, isLoading }: WizardInterfaceProps) => {
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
  const [bubbleClickCount, setBubbleClickCount] = useState(0);
  const [journalText, setJournalText] = useState("");
  const [isJournalFocused, setIsJournalFocused] = useState(false);

  const nowStr = (() => {
    const n = new Date();
    return `${n.getHours().toString().padStart(2, "0")}:${n.getMinutes().toString().padStart(2, "0")}`;
  })();
  const [startTime, setStartTime] = useState(nowStr);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleCalendarImport = (events: CalendarEvent[]) => {
    setImportedEvents(events);
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

  const handleComplete = () => {
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

  const steps: WizardStep[] = ["greeting", "mood", "stress", "sleep", "breaks", "tasks"];
  const currentIndex = steps.indexOf(step);

  const bunnyMessages: Record<WizardStep, string> = {
    greeting: "Hi there! Welcome to TimeBunny. Your guide to plan your day!",
    mood: "How are you feeling today? Your energy level helps me plan the perfect schedule!",
    stress: "And what about your stress level? I'll adjust your schedule accordingly!",
    sleep: "When do you wake up and when do you plan to sleep?",
    breaks: "Everyone needs a break! How often would you like to rest?",
    tasks: "Click on one of the books in the library to write down the events of the day."
  };

  // Book colors for the shelves
  const shelfBooks = [
    // Shelf 1 (top) - these map to task entries
    ["hsl(170 40% 60%)", "hsl(340 60% 70%)", "hsl(170 35% 55%)", "hsl(330 50% 75%)", "hsl(40 50% 80%)", "hsl(340 55% 65%)", "hsl(170 30% 65%)", "hsl(330 45% 70%)", "hsl(340 50% 60%)"],
    // Shelf 2 (middle)
    ["hsl(340 55% 75%)", "hsl(200 60% 65%)", "hsl(340 50% 70%)", "hsl(50 50% 70%)", "hsl(200 55% 60%)", "hsl(340 45% 65%)", "hsl(200 50% 70%)", "hsl(330 55% 75%)"],
    // Shelf 3 (bottom)
    ["hsl(280 40% 65%)", "hsl(200 50% 60%)", "hsl(50 55% 65%)", "hsl(340 50% 70%)", "hsl(40 45% 75%)", "hsl(200 55% 65%)", "hsl(50 50% 60%)", "hsl(340 45% 60%)"],
  ];


  return (
    <div className="fixed inset-0 overflow-hidden flex flex-col" style={{ background: "hsl(280 40% 85%)" }}>
      {/* Library background image */}
      <AnimatePresence mode="wait">
        <motion.img
          key={importedEvents.length > 0 ? "cozy" : "library"}
          src={importedEvents.length > 0 ? cozyBg : libraryBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
      </AnimatePresence>

      {/* Journal overlay on notebook background */}
      {importedEvents.length > 0 && (
        <div
          className="absolute inset-0 z-[5] cursor-text"
          onClick={() => setIsJournalFocused(true)}
        >
          <div className="absolute top-[8%] left-[8%] right-[40%] bottom-[15%]">
            <textarea
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              onFocus={() => setIsJournalFocused(true)}
              onBlur={() => setIsJournalFocused(false)}
              placeholder="Write about your day..."
              className="w-full h-full bg-transparent resize-none focus:outline-none text-[hsl(280_40%_25%)] placeholder:text-[hsl(280_40%_60%/0.4)] leading-[2.65rem] pt-[0.6rem]"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "1rem",
                caretColor: "hsl(280 40% 40%)",
              }}
              autoFocus={isJournalFocused}
            />
          </div>
        </div>
      )}


      {/* Task step: interactive bookshelf */}
      {step === "tasks" && (
        <div className="relative z-10 flex-1 flex">
          {/* Left side - Bookshelf with clickable books */}
          <div className="w-1/2 relative flex flex-col justify-center p-4">
            {/* Invisible clickable book areas over the bookshelf image */}
            <div className="absolute inset-0 flex flex-col justify-between py-[5%] px-[4%]">
              {shelfBooks.map((shelf, shelfIdx) => (
                <div key={shelfIdx} className="flex items-end gap-[2px] h-[28%] px-[2%] pb-[2%]">
                  {shelf.map((_, bookIdx) => {
                    const globalIdx = shelfIdx * shelf.length + bookIdx;
                    const hasTask = taskEntries[globalIdx]?.title?.trim();
                    return (
                      <button
                        key={bookIdx}
                        onClick={() => {
                          setIsCalendarModalOpen(true);
                        }}
                        className={`flex-1 h-full rounded-sm transition-all hover:brightness-110 hover:scale-y-105 cursor-pointer`}
                        style={{ background: "transparent" }}
                        title={`Book ${globalIdx + 1} — click to import calendar`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Task input panel + bunny */}
          <div className="w-1/2 relative flex flex-col justify-end p-4">
            {/* Task input panel */}
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
                      <input
                        type="text"
                        value={taskEntries[activeBookIndex].duration}
                        onChange={(e) => updateTask(taskEntries[activeBookIndex].id, "duration", e.target.value)}
                        placeholder="Duration (e.g., 2h)"
                        className="flex-1 bg-muted/20 border border-primary/10 rounded-lg px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={taskEntries[activeBookIndex].deadline}
                        onChange={(e) => updateTask(taskEntries[activeBookIndex].id, "deadline", e.target.value)}
                        placeholder="Deadline"
                        className="flex-1 bg-muted/20 border border-primary/10 rounded-lg px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                      />
                      <select
                        value={taskEntries[activeBookIndex].priority}
                        onChange={(e) => updateTask(taskEntries[activeBookIndex].id, "priority", e.target.value)}
                        className="bg-muted/20 border border-primary/10 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none"
                      >
                        <option value="high">🔴 High</option>
                        <option value="medium">🟡 Med</option>
                        <option value="low">🟢 Low</option>
                      </select>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="prompt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3 pt-4"
                  >
                    {/* Task summary */}
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
                      <Button
                        onClick={handleComplete}
                        disabled={isLoading}
                        className="w-full mt-2 gap-2 font-body text-sm"
                        size="sm"
                      >
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

      {/* Bunny mascot - bottom right, moves to chair after import */}
      <div className={`absolute z-20 transition-all duration-700 ${
        importedEvents.length > 0 
          ? "bottom-[16%] right-[-4%]" 
          : "bottom-[0%] right-[1%]"
      }`}>
         <div className="relative cursor-pointer" onClick={() => {
          if (isTyping) return;
          const messages = importedEvents.length > 0
            ? [
              "Great! Now that I have a better understanding of what your day is like, let's get started!",
              "Let it out, write it out!",
            ]
            : [
              "Hi there, my name is TimeBunny! Welcome to my home!",
              "Click on one of the books so we can get an idea of what your schedule is like!",
            ];
          const maxMessages = messages.length;
          const nextCount = bubbleClickCount + 1;
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
          setTypedText("");
          setIsTyping(true);
          const fullText = messages[msgIndex];
          let i = 0;
          const interval = setInterval(() => {
            i++;
            setTypedText(fullText.slice(0, i));
            if (i >= fullText.length) {
              clearInterval(interval);
              setIsTyping(false);
            }
          }, 40);
        }}>
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
            className={`object-contain drop-shadow-xl transition-all duration-700 hover:scale-105 active:scale-95 ${
              importedEvents.length > 0 ? "w-[28rem]" : "w-[22rem]"
            }`}
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
