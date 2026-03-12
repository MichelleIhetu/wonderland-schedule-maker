import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScheduleItem, UserSettings } from "@/types/schedule";

export function useSchedulePersistence(userId: string | undefined) {
  const saveSchedule = useCallback(async (schedule: ScheduleItem[], settings: UserSettings) => {
    if (!userId || schedule.length === 0) return;

    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase
      .from("user_schedules")
      .upsert(
        {
          user_id: userId,
          schedule_date: today,
          schedule_data: schedule as any,
          settings: settings as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,schedule_date" }
      );

    if (error) console.error("Failed to save schedule:", error);
  }, [userId]);

  const loadTodaySchedule = useCallback(async (): Promise<{
    schedule: ScheduleItem[];
    settings: UserSettings | null;
  } | null> => {
    if (!userId) return null;

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("user_schedules")
      .select("schedule_data, settings")
      .eq("user_id", userId)
      .eq("schedule_date", today)
      .maybeSingle();

    if (error || !data) return null;

    return {
      schedule: data.schedule_data as unknown as ScheduleItem[],
      settings: data.settings as unknown as UserSettings | null,
    };
  }, [userId]);

  return { saveSchedule, loadTodaySchedule };
}
