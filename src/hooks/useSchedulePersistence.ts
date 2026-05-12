import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScheduleItem, UserSettings } from "@/types/schedule";

export interface VibeCheckEntry {
  at: string;
  mood: "great" | "okay" | "struggling";
  energy: "high" | "medium" | "low";
  needBreak: boolean;
  adjustSchedule: "keep" | "lighten" | "reschedule";
  notes: string;
}

export interface SessionExtras {
  journalText?: string;
  vibeCheck?: VibeCheckEntry;
}

const today = () => new Date().toISOString().split("T")[0];
const LS_KEY = (date: string) => `timebunny:session:${date}`;

interface LocalSession {
  schedule: ScheduleItem[];
  settings: UserSettings | null;
  journalText: string;
  vibeChecks: VibeCheckEntry[];
}

const readLocal = (): LocalSession => {
  try {
    const raw = localStorage.getItem(LS_KEY(today()));
    if (!raw) return { schedule: [], settings: null, journalText: "", vibeChecks: [] };
    return JSON.parse(raw);
  } catch {
    return { schedule: [], settings: null, journalText: "", vibeChecks: [] };
  }
};

const writeLocal = (patch: Partial<LocalSession>) => {
  try {
    const cur = readLocal();
    const next = { ...cur, ...patch };
    localStorage.setItem(LS_KEY(today()), JSON.stringify(next));
  } catch (e) {
    console.error("Failed to persist locally:", e);
  }
};

export function useSchedulePersistence(userId: string | undefined) {
  const saveSchedule = useCallback(async (schedule: ScheduleItem[], settings: UserSettings) => {
    if (schedule.length === 0) return;
    writeLocal({ schedule, settings });
    if (!userId) return;
    const { error } = await supabase
      .from("user_schedules")
      .upsert(
        {
          user_id: userId,
          schedule_date: today(),
          schedule_data: schedule as any,
          settings: settings as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,schedule_date" }
      );
    if (error) console.error("Failed to save schedule:", error);
  }, [userId]);

  const saveJournal = useCallback(async (journalText: string) => {
    writeLocal({ journalText });
    if (!userId) return;
    const { error } = await supabase
      .from("user_schedules")
      .upsert(
        {
          user_id: userId,
          schedule_date: today(),
          schedule_data: [] as any,
          journal_text: journalText,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,schedule_date" }
      );
    if (error) console.error("Failed to save journal:", error);
  }, [userId]);

  const appendVibeCheck = useCallback(async (entry: VibeCheckEntry) => {
    const cur = readLocal();
    writeLocal({ vibeChecks: [...cur.vibeChecks, entry] });
    if (!userId) return;
    const date = today();
    const { data } = await supabase
      .from("user_schedules")
      .select("vibe_checks")
      .eq("user_id", userId)
      .eq("schedule_date", date)
      .maybeSingle();
    const prev = (data?.vibe_checks as unknown as VibeCheckEntry[] | null) ?? [];
    const next = [...prev, entry];
    const { error } = await supabase
      .from("user_schedules")
      .upsert(
        {
          user_id: userId,
          schedule_date: date,
          schedule_data: [] as any,
          vibe_checks: next as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,schedule_date" }
      );
    if (error) console.error("Failed to save vibe check:", error);
  }, [userId]);

  const loadTodaySchedule = useCallback(async (): Promise<LocalSession | null> => {
    // Always check local first for instant restore
    const local = readLocal();
    if (!userId) {
      return local.schedule.length > 0 || local.journalText || local.vibeChecks.length > 0
        ? local
        : null;
    }
    const { data, error } = await supabase
      .from("user_schedules")
      .select("schedule_data, settings, journal_text, vibe_checks")
      .eq("user_id", userId)
      .eq("schedule_date", today())
      .maybeSingle();
    if (error || !data) {
      return local.schedule.length > 0 ? local : null;
    }
    const remote: LocalSession = {
      schedule: (data.schedule_data as unknown as ScheduleItem[]) ?? [],
      settings: data.settings as unknown as UserSettings | null,
      journalText: (data.journal_text as string | null) ?? "",
      vibeChecks: (data.vibe_checks as unknown as VibeCheckEntry[]) ?? [],
    };
    // Mirror remote to local
    writeLocal(remote);
    return remote;
  }, [userId]);

  return { saveSchedule, saveJournal, appendVibeCheck, loadTodaySchedule };
}
