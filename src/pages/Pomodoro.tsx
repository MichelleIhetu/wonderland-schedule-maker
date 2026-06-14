import { useEffect, useState } from "react";
import SEO from "@/components/SEO";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ScheduleItem } from "@/types/schedule";
import PomodoroTimer from "@/components/PomodoroTimer";
import { useAuth } from "@/hooks/useAuth";
import { useSchedulePersistence } from "@/hooks/useSchedulePersistence";
import type { VibeCheckResult } from "./VibeCheck";

const FIXED_MARK = "[FIXED]";

// Shift upcoming (non-fixed) tasks so the next one starts now,
// preserving each task's original duration and order.
const rescheduleFromNow = (items: ScheduleItem[]): ScheduleItem[] => {
  if (!items || items.length === 0) return items;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));

  // Determine which items are upcoming (start time >= now or currently active)
  const upcomingIdx = sorted.findIndex((it) => {
    const [h, m] = it.time.split(":").map(Number);
    return h * 60 + m >= nowMin;
  });
  const splitAt = upcomingIdx === -1 ? sorted.length : upcomingIdx;
  const past = sorted.slice(0, splitAt);
  const upcoming = sorted.slice(splitAt);

  let cursor = nowMin;
  const durationOf = (it: ScheduleItem): number => {
    if (it.endTime) {
      const [sh, sm] = it.time.split(":").map(Number);
      const [eh, em] = it.endTime.split(":").map(Number);
      const d = (eh * 60 + em) - (sh * 60 + sm);
      return d > 0 ? d : 30;
    }
    return 30;
  };
  const shifted = upcoming.map((it) => {
    const isFixed = it.title?.includes(FIXED_MARK);
    const dur = durationOf(it);
    if (isFixed) {
      const [h, m] = it.time.split(":").map(Number);
      cursor = Math.max(cursor, h * 60 + dur);
      return it;
    }
    const start = cursor;
    cursor = start + dur;
    const hh = String(Math.floor(start / 60) % 24).padStart(2, "0");
    const mm = String(start % 60).padStart(2, "0");
    const eh = String(Math.floor(cursor / 60) % 24).padStart(2, "0");
    const em = String(cursor % 60).padStart(2, "0");
    return { ...it, time: `${hh}:${mm}`, endTime: `${eh}:${em}` };
  });

  return [...past, ...shifted];
};

const lightenSchedule = (items: ScheduleItem[]): ScheduleItem[] => {
  // Keep fixed events; drop low-priority / non-fixed extras after the next 2 tasks.
  if (!items || items.length === 0) return items;
  const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  let kept = 0;
  return sorted.filter((it) => {
    const [h, m] = it.time.split(":").map(Number);
    const isUpcoming = h * 60 + m >= nowMin;
    const isFixed = it.title?.includes(FIXED_MARK);
    if (!isUpcoming || isFixed) return true;
    kept += 1;
    return kept <= 2;
  });
};

const Pomodoro = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loadTodaySchedule, saveSchedule } = useSchedulePersistence(user?.id);

  const [schedule, setSchedule] = useState<ScheduleItem[] | null>(
    ((location.state as any)?.schedule as ScheduleItem[] | undefined) ?? null
  );
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(!schedule);

  // Hydrate from persistence if no router state (e.g. direct visit / refresh)
  useEffect(() => {
    if (schedule && schedule.length > 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const data = await loadTodaySchedule();
      if (cancelled) return;
      if (data?.schedule?.length) {
        setSchedule(data.schedule);
        setSettings(data.settings);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [loadTodaySchedule]);

  // Handle vibe-check result returning to this page
  useEffect(() => {
    const state = location.state as any;
    const result = state?.vibeCheckResult as VibeCheckResult | undefined;
    if (!result || !schedule) return;
    let next = schedule;
    if (result.adjustSchedule === "reschedule") {
      next = rescheduleFromNow(schedule);
      toast("Schedule rebuilt from now", { icon: "🔄" });
    } else if (result.adjustSchedule === "lighten") {
      next = lightenSchedule(schedule);
      toast("Lightened your load", { icon: "📋" });
    }
    if (next !== schedule) {
      setSchedule(next);
      if (settings) saveSchedule(next, settings);
    }
    // Clear state so refresh doesn't reapply
    window.history.replaceState({}, document.title);
  }, [location.state, schedule, settings, saveSchedule]);

  // If after loading we still have no schedule, send back to landing
  useEffect(() => {
    if (!loading && (!schedule || schedule.length === 0)) {
      navigate("/", { replace: true });
    }
  }, [loading, schedule, navigate]);

  if (loading || !schedule || schedule.length === 0) return null;

  return (
    <div className="min-h-screen bg-background p-4">
      <SEO title="Focus Timer — TimeBunny Pomodoro" description="Run the current task on a full-screen Pomodoro focus timer with an Up Next queue from your TimeBunny schedule." path="/pomodoro" />

      <PomodoroTimer
        key={schedule.map((i) => `${i.id}-${i.time}`).join("|")}
        schedule={schedule}
        onBack={() => navigate("/")}
      />
    </div>
  );
};

export default Pomodoro;
