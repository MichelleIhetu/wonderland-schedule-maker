import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, Brain, ChevronLeft, Music, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import CartoonBunny from "./KawaiiBunny";
import { ScheduleItem } from "@/types/schedule";

interface PomodoroTimerProps {
  schedule: ScheduleItem[];
  onBack: () => void;
}

// Free lofi music streams - using a lofi YouTube embed or audio source
const LOFI_STREAM_URL = "https://streams.ilovemusic.de/iloveradio17.mp3";

type TimerMode = "work" | "shortBreak" | "longBreak";

const TIMER_DURATIONS = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const motivationalMessages = {
  work: [
    "You're doing amazing! ♡",
    "Focus time! You got this~",
    "Every minute counts! ★",
    "Stay strong, friend!",
    "You're a superstar! ✧",
    "Keep going, I believe in you!",
    "One step at a time~",
    "You've got the magic! ✨",
    "Brilliant work! Keep at it~",
    "Making progress! ♡",
    "Your effort inspires me! ★",
    "Almost there, keep pushing!",
    "Deep breaths, you're doing great!",
    "I'm cheering for you! ✧",
    "Stay curious, stay focused~",
    "You make hard work look easy!",
  ],
  shortBreak: [
    "Great work! Take a breather~",
    "You deserve this rest! ♡",
    "Stretch those legs! ★",
    "Grab some water! 💧",
    "Deep breaths, friend~",
    "Rest your eyes a moment~",
    "You earned this break! ✧",
  ],
  longBreak: [
    "Amazing session! Rest well~",
    "You've earned this! ♡",
    "Recharge your energy! ★",
    "Come back refreshed!",
    "So proud of you! ✧",
    "Take your time, friend~",
    "Wonderful progress today!",
  ],
  completed: [
    "Session complete! ★",
    "You did it! So proud! ♡",
    "Amazing work today! ✧",
    "Champion energy! 🏆",
  ],
};

const PomodoroTimer = ({ schedule, onBack }: PomodoroTimerProps) => {
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATIONS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessions] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [bunnyMessage, setBunnyMessage] = useState(motivationalMessages.work[0]);
  
  // Lofi music state
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(LOFI_STREAM_URL);
    audioRef.current.loop = true;
    audioRef.current.volume = volume;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    
    if (isMusicPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    setIsMusicPlaying(!isMusicPlaying);
  };

  const currentTask = schedule[currentTaskIndex];

  const getRandomMessage = useCallback((type: keyof typeof motivationalMessages) => {
    const messages = motivationalMessages[type];
    return messages[Math.floor(Math.random() * messages.length)];
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer completed
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
        // Move to next task
        if (currentTaskIndex < schedule.length - 1) {
          setCurrentTaskIndex((prev) => prev + 1);
        }
      }
      setIsRunning(false);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, sessionsCompleted, currentTaskIndex, schedule.length, getRandomMessage]);

  // Update bunny message periodically during work
  useEffect(() => {
    if (!isRunning || mode !== "work") return;

    const messageInterval = setInterval(() => {
      setBunnyMessage(getRandomMessage("work"));
    }, 15000); // Every 15 seconds for more encouragement

    return () => clearInterval(messageInterval);
  }, [isRunning, mode, getRandomMessage]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    if (!isRunning) {
      setBunnyMessage(getRandomMessage(mode));
    }
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
      className="flex flex-col items-center gap-6 p-6 bg-card/80 backdrop-blur-sm rounded-2xl border border-primary/20 shadow-card"
    >
      {/* Header with back button and music controls */}
      <div className="w-full flex justify-between items-center">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ChevronLeft className="w-4 h-4" />
          Back to Schedule
        </Button>
        
        {/* Lofi Music Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMusic}
            className={`gap-1 ${isMusicPlaying ? 'text-primary' : 'text-muted-foreground'}`}
          >
            {isMusicPlaying ? <Music className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="text-xs">{isMusicPlaying ? 'Lofi On' : 'Lofi Off'}</span>
          </Button>
          {isMusicPlaying && (
            <div className="w-20">
              <Slider
                value={[volume * 100]}
                onValueChange={(value) => setVolume(value[0] / 100)}
                max={100}
                step={1}
                className="cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {/* Current Task */}
      <AnimatePresence mode="wait">
        {currentTask && (
          <motion.div
            key={currentTask.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Current Task</p>
            <h2 className="font-display text-xl text-foreground">{currentTask.title}</h2>
            {currentTask.description && (
              <p className="text-sm text-muted-foreground mt-1">{currentTask.description}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cartoon Bunny */}
      <CartoonBunny mood={bunnyMood} size="lg" message={bunnyMessage} />

      {/* Mode selector */}
      <div className="flex gap-2">
        <Button
          variant={mode === "work" ? "default" : "outline"}
          size="sm"
          onClick={() => switchMode("work")}
          className="gap-1"
        >
          <Brain className="w-4 h-4" />
          Work
        </Button>
        <Button
          variant={mode === "shortBreak" ? "default" : "outline"}
          size="sm"
          onClick={() => switchMode("shortBreak")}
          className="gap-1"
        >
          <Coffee className="w-4 h-4" />
          Short Break
        </Button>
        <Button
          variant={mode === "longBreak" ? "default" : "outline"}
          size="sm"
          onClick={() => switchMode("longBreak")}
          className="gap-1"
        >
          <Coffee className="w-4 h-4" />
          Long Break
        </Button>
      </div>

      {/* Timer display */}
      <div className="relative">
        {/* Progress ring */}
        <svg className="w-48 h-48 -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted/20"
          />
          <motion.circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            className={mode === "work" ? "text-primary" : "text-green-400"}
            strokeDasharray={553}
            strokeDashoffset={553 - (553 * progress) / 100}
            initial={false}
            animate={{ strokeDashoffset: 553 - (553 * progress) / 100 }}
            transition={{ duration: 0.5 }}
          />
        </svg>
        
        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className="font-display text-5xl text-foreground"
            key={timeLeft}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
          >
            {formatTime(timeLeft)}
          </motion.span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
            {mode === "work" ? "Focus Time" : mode === "shortBreak" ? "Short Break" : "Long Break"}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={resetTimer}
          className="w-12 h-12 rounded-full"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
        <Button
          onClick={toggleTimer}
          size="icon"
          className="w-16 h-16 rounded-full shadow-lg"
        >
          {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
        </Button>
      </div>

      {/* Sessions counter */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Sessions completed:</span>
        <div className="flex gap-1">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className={`w-3 h-3 rounded-full ${i < (sessionsCompleted % 4) ? "bg-primary" : "bg-muted/30"}`}
              initial={false}
              animate={{ scale: i < (sessionsCompleted % 4) ? [1, 1.3, 1] : 1 }}
            />
          ))}
        </div>
        <span className="font-display text-primary">{sessionsCompleted}</span>
      </div>

      {/* Task progress */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Task Progress</span>
          <span>{currentTaskIndex + 1} / {schedule.length}</span>
        </div>
        <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-pink-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentTaskIndex + 1) / schedule.length) * 100}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default PomodoroTimer;
