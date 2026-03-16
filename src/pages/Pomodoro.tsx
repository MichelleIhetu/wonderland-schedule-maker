import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ScheduleItem } from "@/types/schedule";
import PomodoroTimer from "@/components/PomodoroTimer";

const Pomodoro = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const schedule = (location.state as any)?.schedule as ScheduleItem[] | undefined;

  useEffect(() => {
    if (!schedule || schedule.length === 0) {
      navigate("/", { replace: true });
    }
  }, [schedule, navigate]);

  if (!schedule || schedule.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <PomodoroTimer schedule={schedule} onBack={() => navigate("/")} />
    </div>
  );
};

export default Pomodoro;
