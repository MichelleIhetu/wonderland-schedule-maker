import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Sparkles, AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AnalyzedTask {
  id: string;
  title: string;
  date: string | null;
  startTime?: string | null;
  endTime?: string | null;
  final_category: string;
  final_importance: "critical" | "major" | "moderate" | "minor";
  lead_days: number;
  recommended_start_date: string | null;
  prep_milestones: string[];
  rationale: string;
  symbolic: { category: string; matchedKeyword: string };
}

const importanceStyles: Record<AnalyzedTask["final_importance"], string> = {
  critical: "bg-red-500/15 text-red-600 border-red-500/40",
  major: "bg-orange-500/15 text-orange-600 border-orange-500/40",
  moderate: "bg-blue-500/15 text-blue-600 border-blue-500/40",
  minor: "bg-emerald-500/15 text-emerald-600 border-emerald-500/40",
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  tasks: AnalyzedTask[];
  monthLabel: string;
}

const CalendarAnalysisModal = ({ isOpen, onClose, onNext, tasks, monthLabel }: Props) => {
  const critical = tasks.filter((t) => t.final_importance === "critical").length;
  const major = tasks.filter((t) => t.final_importance === "major").length;

  // Count events happening within the next 7 days (immediate/urgent)
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const immediateCount = tasks.filter((t) => {
    if (!t.date) return false;
    const ts = new Date(t.date).getTime();
    return ts >= now - 24 * 60 * 60 * 1000 && ts <= now + sevenDaysMs;
  }).length;

  const isBusy = immediateCount >= 3;
  const titleText = isBusy
    ? "Some Bunny's Been Busy!"
    : `Monthly Debrief · Hop to It — ${monthLabel} Debrief`;

  const handleNext = () => { onClose(); onNext?.(); };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl bg-card border-primary/20 [&>button]:hidden">
        <button
          onClick={handleNext}
          aria-label="Next"
          className="absolute right-4 top-4 z-10 flex items-center justify-center w-8 h-8 rounded-full text-white shadow-md hover:scale-110 active:scale-95 transition-all"
          style={{ background: "hsl(280 70% 50%)" }}
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground flex items-center gap-2 flex-wrap pr-10">
            <Sparkles className="w-5 h-5 text-primary" />
            {titleText}
          </DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-3 flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-red-500" /> {critical} critical</span>
          <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-orange-500" /> {major} major</span>
          <span>· {tasks.length} events scanned</span>
          {isBusy && (
            <span className="text-primary font-semibold">· {immediateCount} in the next 7 days</span>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No upcoming events found in the next 31 days.</p>
            <p className="text-sm mt-1 opacity-80">Your calendar is clear — let's build a fresh schedule!</p>
            {onNext && (
              <Button
                onClick={() => { onClose(); onNext(); }}
                className="mt-6 gap-2 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
                style={{ background: "hsl(280 70% 50%)" }}
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-2">
            {tasks.map((t) => (
              <div
                key={t.id}
                className={`p-3 rounded-lg border ${importanceStyles[t.final_importance]}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">{t.title}</p>
                    <p className="text-xs opacity-80">
                      {t.final_category} · {t.date ?? "no date"}
                      {t.startTime ? ` · ${t.startTime}${t.endTime ? `–${t.endTime}` : ""}` : ""}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full border border-current">
                    {t.final_importance}
                  </span>
                </div>

                <div className="mt-2 text-xs text-foreground/90">
                  <span className="font-semibold">Start prepping:</span>{" "}
                  {t.recommended_start_date ?? "—"}{" "}
                  <span className="opacity-70">
                    ({t.lead_days} day{t.lead_days === 1 ? "" : "s"} lead)
                  </span>
                </div>

                {t.prep_milestones.length > 0 && (
                  <ul className="mt-1 text-xs list-disc list-inside text-foreground/80">
                    {t.prep_milestones.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                )}

                <p className="mt-1 text-xs italic opacity-75">{t.rationale}</p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CalendarAnalysisModal;
