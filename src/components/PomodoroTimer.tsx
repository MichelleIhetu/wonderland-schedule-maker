import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, Brain, ChevronLeft, Music, VolumeX, Image, ImageOff, Clock, ChevronRight, List, Frame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CartoonBunny from "./KawaiiBunny";
import { ScheduleItem } from "@/types/schedule";
import FloatingMoodboardBackground from "./FloatingMoodboardBackground";
import WallGallery from "./WallGallery";
import PomodoroScheduleSidebar from "./PomodoroScheduleSidebar";

interface PomodoroTimerProps {
  schedule: ScheduleItem[];
  onBack: () => void;
}

const LOFI_STREAM_URL = "https://streams.ilovemusic.de/iloveradio17.mp3";

type TimerMode = "work" | "shortBreak" | "longBreak";

const TIMER_DURATIONS = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const motivationalMessages = {
  work: [
    "You're doing amazing! ♡", "Focus time! You got this~", "Every minute counts! ★",
    "Stay strong, friend!", "You're a superstar! ✧", "Keep going, I believe in you!",
    "One step at a time~", "You've got the magic! ✨", "Brilliant work! Keep at it~",
    "Making progress! ♡", "Your effort inspires me! ★", "Almost there, keep pushing!",
    "Deep breaths, you're doing great!", "I'm cheering for you! ✧",
    "Stay curious, stay focused~", "You make hard work look easy!",
  ],
  shortBreak: [
    "Great work! Take a breather~", "You deserve this rest! ♡", "Stretch those legs! ★",
    "Grab some water! 💧", "Deep breaths, friend~", "Rest your eyes a moment~",
    "You earned this break! ✧",
  ],
  longBreak: [
    "Amazing session! Rest well~", "You've earned this! ♡", "Recharge your energy! ★",
    "Come back refreshed!", "So proud of you! ✧", "Take your time, friend~",
    "Wonderful progress today!",
  ],
  completed: [
    "Session complete! ★", "You did it! So proud! ♡", "Amazing work today! ✧",
    "Champion energy! 🏆",
  ],
};

const getCurrentTaskIndexByTime = (items: ScheduleItem[]): number => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));
  let best = 0;
  for (let i = 0; i < sorted.length; i++) {
    const [h, m] = sorted[i].time.split(":").map(Number);
    if (h * 60 + m <= currentMinutes) best = i;
    else break;
  }
  const bestItem = sorted[best];
  const originalIndex = items.findIndex((it) => it.id === bestItem.id);
  return originalIndex >= 0 ? originalIndex : 0;
};

const PomodoroTimer = ({ schedule, onBack }: PomodoroTimerProps) => {
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATIONS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessions] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(() =>
    schedule.length > 0 ? getCurrentTaskIndexByTime(schedule) : 0
  );
  const [bunnyMessage, setBunnyMessage] = useState(motivationalMessages.work[0]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showMoodboard, setShowMoodboard] = useState(false);
  const [moodboardOpacity, setMoodboardOpacity] = useState(0.15);
  const [use12Hour, setUse12Hour] = useState(false);
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  useEffect(() => {
    const tick = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    audioRef.current = new Audio(LOFI_STREAM_URL);
    audioRef.current.loop = true;
    audioRef.current.volume = volume;
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } };
  }, []);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isMusicPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(console.error);
    setIsMusicPlaying(!isMusicPlaying);
  };

  const currentTask = schedule[currentTaskIndex];
  const nextTask = currentTaskIndex < schedule.length - 1 ? schedule[currentTaskIndex + 1] : null;

  const getRandomMessage = useCallback((type: keyof typeof motivationalMessages) => {
    const messages = motivationalMessages[type];
    return messages[Math.floor(Math.random() * messages.length)];
  }, []);

  const formatClockTime = useCallback((date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: use12Hour,
    });
  }, [use12Hour]);

  const formatScheduleTime = useCallback((time: string) => {
    if (!use12Hour) return time;
    const [h, m] = time.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
  }, [use12Hour]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      if (mode === "work") {
        setSessions((prev) => prev + 1);
        const newMode = sessionsCompleted > 0 && (sessionsCompleted + 1) % 4 === 0 ? "longBreak" : "shortBreak";
        setMode(newMode);
        setTimeLeft(TIMER_DURATIONS[newMode]);
        setBunnyMessage(getRandomMessage(newMode));
      } else {
        setMode("work");
        setTimeLeft(TIMER_DURATIONS.work);
        setBunnyMessage(getRandomMessage("work"));
        if (currentTaskIndex < schedule.length - 1) setCurrentTaskIndex((prev) => prev + 1);
      }
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, sessionsCompleted, currentTaskIndex, schedule.length, getRandomMessage]);

  useEffect(() => {
    if (!isRunning || mode !== "work") return;
    const messageInterval = setInterval(() => setBunnyMessage(getRandomMessage("work")), 15000);
    return () => clearInterval(messageInterval);
  }, [isRunning, mode, getRandomMessage]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    if (!isRunning) setBunnyMessage(getRandomMessage(mode));
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(TIMER_DURATIONS[mode]);
    setBunnyMessage(getRandomMessage(mode));
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(TIMER_DURATIONS[newMode]);
    setIsRunning(false);
    setBunnyMessage(getRandomMessage(newMode));
  };

  const progress = ((TIMER_DURATIONS[mode] - timeLeft) / TIMER_DURATIONS[mode]) * 100;
  const bunnyMood = isRunning
    ? (mode === "work" ? "focused" : "happy")
    : (timeLeft === 0 ? "celebrating" : "encouraging");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex flex-col lg:flex-row gap-4 z-10"
    >
      {/* Main Timer Panel */}
      <div className="relative flex-1 flex flex-col items-center gap-5 p-6 bg-card/80 backdrop-blur-sm rounded-2xl border border-primary/20 shadow-card overflow-hidden">
        <FloatingMoodboardBackground enabled={showMoodboard} opacity={moodboardOpacity} />

        {/* Header */}
        <div className="w-full flex justify-between items-center z-10">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            {/* 12h toggle */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">12h</span>
              <Switch checked={use12Hour} onCheckedChange={setUse12Hour} className="scale-75" />
            </div>
            {/* Lofi */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={toggleMusic}
                className={`gap-1 ${isMusicPlaying ? 'text-primary' : 'text-muted-foreground'}`}>
                {isMusicPlaying ? <Music className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="text-xs hidden sm:inline">{isMusicPlaying ? 'Lofi' : 'Lofi'}</span>
              </Button>
              {isMusicPlaying && (
                <div className="w-16">
                  <Slider value={[volume * 100]} onValueChange={(v) => setVolume(v[0] / 100)} max={100} step={1} className="cursor-pointer" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Current Task */}
        <AnimatePresence mode="wait">
          {currentTask && (
            <motion.div key={currentTask.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center z-10">
              <div className="flex items-center justify-center gap-2 mb-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Task</p>
                <span className="text-xs font-display text-primary/80 tabular-nums">{formatClockTime(currentTime)}</span>
              </div>
              <h2 className="font-display text-xl text-foreground">{currentTask.title}</h2>
              <p className="text-xs text-muted-foreground/60 mt-0.5">Scheduled at {formatScheduleTime(currentTask.time)}</p>
              {currentTask.description && <p className="text-sm text-muted-foreground mt-1">{currentTask.description}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bunny */}
        <CartoonBunny mood={bunnyMood} size="lg" message={bunnyMessage} />

        {/* Mode selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 z-10">
          <Button variant={mode === "work" ? "default" : "outline"} size="sm" onClick={() => switchMode("work")} className="gap-1">
            <Brain className="w-4 h-4" /> Work
          </Button>
          <Button variant={showMoodboard ? "default" : "outline"} size="sm" onClick={() => setShowMoodboard(!showMoodboard)} className="gap-1">
            {showMoodboard ? <Image className="w-4 h-4" /> : <ImageOff className="w-4 h-4" />} Ambient
          </Button>
          {showMoodboard && (
            <div className="w-16">
              <Slider value={[moodboardOpacity * 100]} onValueChange={(v) => setMoodboardOpacity(v[0] / 100)} max={40} min={5} step={5} className="cursor-pointer" />
            </div>
          )}
          <Button variant={mode === "shortBreak" ? "default" : "outline"} size="sm" onClick={() => switchMode("shortBreak")} className="gap-1">
            <Coffee className="w-4 h-4" /> Short Break
          </Button>
          <Button variant={mode === "longBreak" ? "default" : "outline"} size="sm" onClick={() => switchMode("longBreak")} className="gap-1">
            <Coffee className="w-4 h-4" /> Long Break
          </Button>
        </div>

        {/* Timer display */}
        <div className="relative">
          <svg className="w-48 h-48 -rotate-90">
            <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted/20" />
            <motion.circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round"
              className={mode === "work" ? "text-primary" : "text-green-400"}
              strokeDasharray={553} strokeDashoffset={553 - (553 * progress) / 100}
              initial={false} animate={{ strokeDashoffset: 553 - (553 * progress) / 100 }} transition={{ duration: 0.5 }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span className="font-display text-5xl text-foreground" key={timeLeft} initial={{ scale: 1.1 }} animate={{ scale: 1 }}>
              {formatTime(timeLeft)}
            </motion.span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              {mode === "work" ? "Focus Time" : mode === "shortBreak" ? "Short Break" : "Long Break"}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4">
          <Button variant="outline" size="icon" onClick={resetTimer} className="w-12 h-12 rounded-full">
            <RotateCcw className="w-5 h-5" />
          </Button>
          <Button onClick={toggleTimer} size="icon" className="w-16 h-16 rounded-full shadow-lg">
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </Button>
        </div>

        {/* Sessions counter */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Sessions:</span>
          <div className="flex gap-1">
            {[...Array(4)].map((_, i) => (
              <motion.div key={i} className={`w-3 h-3 rounded-full ${i < (sessionsCompleted % 4) ? "bg-primary" : "bg-muted/30"}`}
                initial={false} animate={{ scale: i < (sessionsCompleted % 4) ? [1, 1.3, 1] : 1 }} />
            ))}
          </div>
          <span className="font-display text-primary">{sessionsCompleted}</span>
        </div>

        {/* Task progress */}
        <div className="w-full z-10">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Task Progress</span>
            <span>{currentTaskIndex + 1} / {schedule.length}</span>
          </div>
          <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              initial={{ width: 0 }} animate={{ width: `${((currentTaskIndex + 1) / schedule.length) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Sidebar: Next Up / Full Schedule */}
      <PomodoroScheduleSidebar
        schedule={schedule}
        currentTaskIndex={currentTaskIndex}
        nextTask={nextTask}
        showFullSchedule={showFullSchedule}
        onToggleFullSchedule={() => setShowFullSchedule(!showFullSchedule)}
        formatScheduleTime={formatScheduleTime}
      />
    </motion.div>
  );
};

export default PomodoroTimer;
