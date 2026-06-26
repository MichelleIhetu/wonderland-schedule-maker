import { ScheduleItem, Suit, themeColors } from "@/types/schedule";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Heart, Diamond, Club, Spade, Calendar, X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import CartoonBunny from "./KawaiiBunny";

interface ScheduleDisplayProps {
  schedule: ScheduleItem[];
  onClear: () => void;
  onStartPomodoro: () => void;
  theme: Suit;
}

const suitIcons: Record<Suit, React.ReactNode> = {
  hearts: <Heart className="w-4 h-4" />,
  diamonds: <Diamond className="w-4 h-4" />,
  clubs: <Club className="w-4 h-4" />,
  spades: <Spade className="w-4 h-4" />,
};

export default function ScheduleDisplay({ schedule, onClear, onStartPomodoro, theme }: ScheduleDisplayProps) {
  if (schedule.length === 0) return null;

  const sortedSchedule = [...schedule].sort((a, b) => a.time.localeCompare(b.time));
  const themeColor = themeColors[theme];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full flex flex-col bg-card rounded-2xl border border-border shadow-card overflow-hidden"
    >
      {/* Header */}
      <div 
        className="p-4 border-b border-border flex items-center justify-between"
        style={{ backgroundColor: themeColor.secondary }}
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5" style={{ color: themeColor.primary }} />
          <h2 className="font-display text-lg" style={{ color: themeColor.primary }}>
            Your Schedule
          </h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClear}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Kawaii bunny encouragement */}
      <div className="p-4 flex justify-center border-b border-border/50">
        <CartoonBunny mood="celebrating" size="sm" message="Your schedule is ready!" />
      </div>

      {/* Schedule Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {sortedSchedule.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex gap-3 p-3 rounded-xl bg-background border border-border hover:shadow-card transition-shadow"
            >
              {/* Time */}
              <div className="flex flex-col items-center min-w-[50px]">
                <Clock className="w-4 h-4 text-muted-foreground mb-1" />
                <span className="font-display text-sm">{item.time}</span>
                {item.endTime && (
                  <span className="font-display text-[10px] text-muted-foreground">– {item.endTime}</span>
                )}
              </div>

              {/* Divider */}
              <div 
                className="w-0.5 rounded-full"
                style={{ backgroundColor: themeColors[item.suit].primary }}
              />

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ color: themeColors[item.suit].primary }}>
                    {suitIcons[item.suit]}
                  </span>
                  <h3 className="font-display text-sm">{item.title}</h3>
                </div>
                {item.description && (
                  <p className="text-xs text-muted-foreground font-body">
                    {item.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer with Start Pomodoro */}
      <div className="p-4 border-t border-border space-y-3">
        <Button 
          onClick={onStartPomodoro}
          className="w-full gap-2 bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90"
        >
          <Play className="w-4 h-4" />
          Pomodoro Timer
        </Button>
        <p className="text-xs text-muted-foreground font-body italic text-center">
          "Begin at the beginning... and go on till you come to the end."
        </p>
      </div>
    </motion.div>
  );
}
