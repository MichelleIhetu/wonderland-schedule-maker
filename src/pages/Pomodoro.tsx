import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ScheduleItem } from "@/types/schedule";
import PomodoroTimer from "@/components/PomodoroTimer";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const Pomodoro = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const schedule = (location.state as any)?.schedule as ScheduleItem[] | undefined;
  const backgroundTheme = (location.state as any)?.backgroundTheme;

  useEffect(() => {
    if (!schedule || schedule.length === 0) {
      navigate("/", { replace: true });
    }
  }, [schedule, navigate]);

  if (!schedule || schedule.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 relative">
      <PomodoroTimer schedule={schedule} onBack={() => navigate("/")} />

      {/* Manual Vibe Check-In button — fixed to right side */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40">
        <Button
          onClick={() =>
            navigate("/vibe-check", {
              state: { backgroundTheme, fromPomodoro: true, schedule },
            })
          }
          className="flex flex-col items-center gap-1 h-auto py-3 px-3 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl"
          title="Need a break? Feeling distracted or overwhelmed?"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] leading-tight font-bold uppercase tracking-wide">
            Vibe<br />Check
          </span>
        </Button>
      </div>
    </div>
  );
};

export default Pomodoro;
