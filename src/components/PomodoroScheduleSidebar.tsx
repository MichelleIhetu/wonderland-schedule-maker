import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, List, Clock } from "lucide-react";
import { ScheduleItem } from "@/types/schedule";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  schedule: ScheduleItem[];
  currentTaskIndex: number;
  nextTask: ScheduleItem | null;
  showFullSchedule: boolean;
  onToggleFullSchedule: () => void;
  formatScheduleTime: (time: string) => string;
}

export default function PomodoroScheduleSidebar({
  schedule, currentTaskIndex, nextTask, showFullSchedule, onToggleFullSchedule, formatScheduleTime,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 }}
      className="w-full lg:w-72 flex flex-col gap-3"
    >
      {/* Next Up Card */}
      <div
        className="bg-card/80 backdrop-blur-sm rounded-2xl border border-primary/20 shadow-card p-4 cursor-pointer select-none transition-all hover:border-primary/40"
        onDoubleClick={onToggleFullSchedule}
        title="Double-click to view full schedule"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-primary" />
            <span className="text-xs font-display text-primary uppercase tracking-wide">Next Up</span>
          </div>
          <button
            onClick={onToggleFullSchedule}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <List className="w-3.5 h-3.5" />
            {showFullSchedule ? "Hide" : "All"}
          </button>
        </div>

        {nextTask ? (
          <motion.div key={nextTask.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
            <h3 className="font-display text-sm text-foreground">{nextTask.title}</h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatScheduleTime(nextTask.time)}</span>
            </div>
            {nextTask.description && (
              <p className="text-xs text-muted-foreground/70 line-clamp-2">{nextTask.description}</p>
            )}
          </motion.div>
        ) : (
          <p className="text-xs text-muted-foreground italic">No more tasks — you're done! ✧</p>
        )}

        <p className="text-[10px] text-muted-foreground/40 mt-3 text-center">Double-click to see full schedule</p>
      </div>

      {/* Full Schedule (expandable) */}
      <AnimatePresence>
        {showFullSchedule && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card/80 backdrop-blur-sm rounded-2xl border border-primary/20 shadow-card overflow-hidden"
          >
            <div className="p-3 border-b border-border">
              <span className="text-xs font-display text-foreground uppercase tracking-wide">Full Schedule</span>
            </div>
            <ScrollArea className="max-h-[400px]">
              <div className="p-3 space-y-2">
                {schedule.map((item, i) => {
                  const isCurrent = i === currentTaskIndex;
                  const isPast = i < currentTaskIndex;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`flex items-start gap-2 p-2 rounded-lg text-xs transition-colors ${
                        isCurrent
                          ? "bg-primary/10 border border-primary/30"
                          : isPast
                          ? "opacity-50"
                          : "hover:bg-muted/20"
                      }`}
                    >
                      <span className={`font-display tabular-nums min-w-[52px] ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                        {formatScheduleTime(item.time)}
                      </span>
                      <div className="flex-1">
                        <span className={`block font-display ${isCurrent ? "text-primary" : "text-foreground"}`}>
                          {item.title}
                        </span>
                        {item.description && (
                          <span className="text-muted-foreground/60 line-clamp-1">{item.description}</span>
                        )}
                      </div>
                      {isCurrent && (
                        <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-display">NOW</span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
