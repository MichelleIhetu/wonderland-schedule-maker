import { useState } from "react";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Flame, Target, TrendingUp, Archive, Clock, Sparkles, Wand2, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGoals, GoalWithProgress } from "@/hooks/useGoals";
import { useSchedulePersistence } from "@/hooks/useSchedulePersistence";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PIXEL: React.CSSProperties = { fontFamily: "'Press Start 2P', cursive" };
const VT: React.CSSProperties = { fontFamily: "'VT323', monospace" };

const CATEGORIES = [
  { value: "fitness", label: "🏋️ Fitness", tip: "Start with just 2 mins — make it obvious & easy" },
  { value: "learning", label: "📚 Learning", tip: "Attach it to an existing habit (habit stacking)" },
  { value: "creative", label: "🎨 Creative Projects", tip: "Never miss twice — get back on track fast" },
  { value: "career", label: "💼 Career Growth", tip: "Track it visibly — don't break the chain" },
  { value: "wellness", label: "🧘 Wellness", tip: "Environment > motivation — design your space" },
  { value: "general", label: "⭐ General", tip: "Make it satisfying — reward yourself after" },
];

function getAtomicTip(category: string): string {
  return CATEGORIES.find((c) => c.value === category)?.tip || "Small steps compound into remarkable results";
}

function GoalCard({
  goal,
  onLog,
  onArchive,
}: {
  goal: GoalWithProgress;
  onLog: (id: string, hours: number, notes?: string) => void;
  onArchive: (id: string) => void;
}) {
  const [logHours, setLogHours] = useState("0.5");
  const [logNotes, setLogNotes] = useState("");
  const [showLog, setShowLog] = useState(false);

  const progress = goal.target_hours > 0 ? Math.min((goal.totalLogged / goal.target_hours) * 100, 100) : 0;
  const categoryInfo = CATEGORIES.find((c) => c.value === goal.category);
  const emoji = categoryInfo?.label.split(" ")[0] ?? "⭐";

  const handleLog = () => {
    onLog(goal.id, parseFloat(logHours) || 0, logNotes || undefined);
    setLogHours("0.5");
    setLogNotes("");
    setShowLog(false);
  };

  return (
    <div className="group relative bg-white border-2 border-[#ddd6fe] p-4 hover:bg-purple-50 transition-colors">
      <div className="flex justify-between items-start mb-3 gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[#5b21b6] text-[11px] mb-2 leading-relaxed flex items-center gap-2" style={PIXEL}>
            <span className="text-base leading-none">{emoji}</span>
            <span className="truncate">{goal.title}</span>
          </h3>
          <p className="text-[#a78bfa] text-lg leading-none" style={VT}>
            {goal.totalLogged.toFixed(1)}h / {goal.target_hours}h · {goal.goal_type}
          </p>
        </div>
        <div className="text-[#2dd4bf] text-2xl leading-none flex-shrink-0" style={VT}>
          {Math.round(progress)}%
        </div>
      </div>

      <div className="w-full h-4 bg-purple-100 border border-purple-200 p-0.5">
        <div className="h-full bg-[#2dd4bf] transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {goal.streak > 0 && (
            <>
              <div className="w-2 h-2 bg-[#f472b6] animate-pulse flex-shrink-0" />
              <span className="text-[#f472b6] text-[10px] uppercase tracking-widest font-bold" style={PIXEL}>
                {goal.streak}D STREAK
              </span>
            </>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => setShowLog((v) => !v)}
            className="text-[9px] px-2 py-1.5 bg-[#5b21b6] text-white hover:bg-[#4c1d95] transition-colors flex items-center gap-1"
            style={PIXEL}
          >
            <Clock className="w-3 h-3" />
            LOG
          </button>
          <button
            onClick={() => onArchive(goal.id)}
            className="text-[#a78bfa] hover:text-[#5b21b6] p-1.5 border border-transparent hover:border-[#ddd6fe]"
            title="Archive"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-[10px] text-[#a78bfa]/80 mt-2 italic" style={VT}>
        💡 {getAtomicTip(goal.category)}
      </p>

      {showLog && (
        <div className="mt-3 pt-3 border-t border-dashed border-[#ddd6fe] space-y-2">
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.25"
              min="0"
              value={logHours}
              onChange={(e) => setLogHours(e.target.value)}
              className="h-8 text-sm border-[#ddd6fe] focus-visible:ring-[#5b21b6]"
              placeholder="hours"
            />
          </div>
          <Textarea
            placeholder="What did you work on? (optional)"
            value={logNotes}
            onChange={(e) => setLogNotes(e.target.value)}
            className="min-h-[60px] text-sm border-[#ddd6fe] focus-visible:ring-[#5b21b6]"
          />
          <div className="flex gap-2">
            <button
              onClick={handleLog}
              className="flex-1 py-2 bg-[#2dd4bf] text-white text-[10px] hover:bg-[#14b8a6] transition-colors"
              style={PIXEL}
            >
              LOG PROGRESS
            </button>
            <button
              onClick={() => setShowLog(false)}
              className="px-3 py-2 text-[10px] text-[#a78bfa] hover:text-[#5b21b6]"
              style={PIXEL}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddGoalDialog({ onAdd, trigger }: { onAdd: (g: any) => void; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalType, setGoalType] = useState<"monthly" | "ongoing">("monthly");
  const [targetHours, setTargetHours] = useState("10");
  const [category, setCategory] = useState("general");

  const handleSubmit = () => {
    if (!title.trim()) return;
    const endDate =
      goalType === "monthly"
        ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0]
        : undefined;
    onAdd({ title, description, goal_type: goalType, target_hours: parseFloat(targetHours) || 10, category, end_date: endDate });
    setTitle("");
    setDescription("");
    setTargetHours("10");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border-2 border-[#ddd6fe]">
        <DialogHeader>
          <DialogTitle className="text-[#5b21b6] text-sm" style={PIXEL}>PLANT A NEW GOAL</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-[#5b21b6] text-[10px]" style={PIXEL}>WHAT</Label>
            <Input placeholder="e.g. Work out regularly" value={title} onChange={(e) => setTitle(e.target.value)} className="border-[#ddd6fe]" />
          </div>
          <div>
            <Label className="text-[#5b21b6] text-[10px]" style={PIXEL}>WHY</Label>
            <Textarea placeholder="Your motivation" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[60px] border-[#ddd6fe]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[#5b21b6] text-[10px]" style={PIXEL}>CATEGORY</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="border-[#ddd6fe]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#5b21b6] text-[10px]" style={PIXEL}>TYPE</Label>
              <Select value={goalType} onValueChange={(v) => setGoalType(v as any)}>
                <SelectTrigger className="border-[#ddd6fe]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-[#5b21b6] text-[10px]" style={PIXEL}>
              TARGET HOURS {goalType === "monthly" ? "/MONTH" : "TOTAL"}
            </Label>
            <Input type="number" min="1" value={targetHours} onChange={(e) => setTargetHours(e.target.value)} className="border-[#ddd6fe]" />
          </div>
          <div className="p-3 bg-purple-50 border-2 border-[#ddd6fe]">
            <p className="text-xs text-[#5b21b6]" style={VT}>
              <span className="font-bold" style={PIXEL}>TIP: </span>
              Start small. The habit matters more than the amount.
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="w-full py-3 bg-[#5b21b6] text-white text-[10px] hover:bg-[#4c1d95] disabled:opacity-50 transition-colors"
            style={PIXEL}
          >
            CREATE GOAL
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface GoalSuggestion {
  goalTitle: string;
  goalId?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  activity: string;
  reason: string;
  category?: string;
}

function SuggestionsPanel({
  suggestions,
  onDismiss,
  onAccept,
  onClose,
}: {
  suggestions: GoalSuggestion[];
  onDismiss: (idx: number) => void;
  onAccept: (s: GoalSuggestion) => void;
  onClose: () => void;
}) {
  if (suggestions.length === 0) return null;

  return (
    <div className="bg-white border-2 border-[#2dd4bf] p-4 shadow-[4px_4px_0px_#2dd4bf] mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#2dd4bf]" />
          <h3 className="text-[#5b21b6] text-[11px]" style={PIXEL}>AI SUGGESTIONS</h3>
        </div>
        <button onClick={onClose} className="text-[#a78bfa] hover:text-[#5b21b6]">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[#a78bfa] text-base mb-3" style={VT}>
        Found gaps in your schedule — squeeze in goal time.
      </p>
      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <div key={i} className="flex items-start gap-3 p-3 border-2 border-[#ddd6fe]">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-2 py-0.5 bg-[#5b21b6] text-white" style={PIXEL}>
                  {s.startTime}–{s.endTime}
                </span>
                <span className="text-sm text-[#a78bfa]" style={VT}>{s.durationMinutes}min</span>
              </div>
              <p className="text-sm text-[#5b21b6] font-medium">{s.activity}</p>
              <p className="text-base text-[#a78bfa]" style={VT}>For: {s.goalTitle}</p>
              <p className="text-xs text-[#a78bfa]/80 italic mt-1">💡 {s.reason}</p>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                className="p-1.5 text-[#2dd4bf] hover:bg-[#2dd4bf] hover:text-white border border-[#2dd4bf]"
                onClick={() => onAccept(s)}
                title="Accept"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button
                className="p-1.5 text-[#a78bfa] hover:bg-[#ddd6fe] border border-[#ddd6fe]"
                onClick={() => onDismiss(i)}
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatTile({ label, value, color = "#5b21b6" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white border-2 border-[#ddd6fe] p-3 flex flex-col items-center justify-center shadow-[4px_4px_0px_#ddd6fe]">
      <span className="text-[9px] text-[#a78bfa] uppercase font-bold mb-1 text-center" style={PIXEL}>
        {label}
      </span>
      <span className="text-3xl font-bold leading-none" style={{ ...VT, color }}>
        {value}
      </span>
    </div>
  );
}

export default function Goals() {
  const { user } = useAuth();
  const { goals, loading, addGoal, logProgress, archiveGoal } = useGoals();
  const { loadTodaySchedule } = useSchedulePersistence(user?.id);
  const [suggestions, setSuggestions] = useState<GoalSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const totalStreak = goals.reduce((max, g) => Math.max(max, g.streak), 0);
  const totalHoursThisMonth = goals.reduce((sum, g) => {
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthLogs = g.logs.filter((l) => l.log_date.startsWith(thisMonth));
    return sum + monthLogs.reduce((s, l) => s + Number(l.hours_logged), 0);
  }, 0);

  const handleFindGaps = async () => {
    if (goals.length === 0) {
      toast.error("Create some goals first!");
      return;
    }
    setLoadingSuggestions(true);
    try {
      const result = await loadTodaySchedule();
      const schedule = result?.schedule || [];
      const settings = result?.settings;

      const { data, error } = await supabase.functions.invoke("suggest-goal-blocks", {
        body: {
          schedule,
          goals: goals.map((g) => ({
            id: g.id,
            title: g.title,
            category: g.category,
            target_hours: g.target_hours,
            totalLogged: g.totalLogged,
            goal_type: g.goal_type,
          })),
          wakeTime: settings?.wakeTime || "07:00",
          bedTime: settings?.bedTime || "23:00",
        },
      });

      if (error) throw error;
      if (data?.suggestions) {
        setSuggestions(data.suggestions);
        if (data.suggestions.length === 0) {
          toast("No free gaps found — your day is packed!", { icon: "📋" });
        } else {
          toast.success(`Found ${data.suggestions.length} time blocks for your goals!`);
        }
      }
    } catch (e: any) {
      console.error("Suggestion error:", e);
      toast.error(e?.message || "Failed to get suggestions");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAcceptSuggestion = (s: GoalSuggestion) => {
    toast.success(`"${s.activity}" at ${s.startTime} noted! Log time when done.`, { icon: "✅" });
    setSuggestions((prev) => prev.filter((x) => x !== s));
  };

  const handleDismissSuggestion = (idx: number) => {
    setSuggestions((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="min-h-screen w-full bg-[#fdfaff] p-4 md:p-8">
      <SEO title="Long-Term Goals — TimeBunny" description="Track Atomic-Habits-style long-term goals and let TimeBunny suggest tasks that fill the gaps in your day." path="/goals" />

      <div className="max-w-2xl w-full mx-auto space-y-8">
        {/* Top nav */}
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 text-[#5b21b6] hover:bg-purple-100 hover:text-[#5b21b6] text-[10px]" style={PIXEL}>
              <ArrowLeft className="w-3.5 h-3.5" />
              BACK
            </Button>
          </Link>
          {goals.length > 0 && (
            <button
              onClick={handleFindGaps}
              disabled={loadingSuggestions}
              className="flex items-center gap-2 text-[10px] px-3 py-2 bg-white border-2 border-[#ddd6fe] text-[#5b21b6] hover:bg-purple-50 disabled:opacity-50 shadow-[2px_2px_0px_#ddd6fe]"
              style={PIXEL}
            >
              <Wand2 className={`w-3.5 h-3.5 ${loadingSuggestions ? "animate-spin" : ""}`} />
              {loadingSuggestions ? "FINDING..." : "FIND GAPS"}
            </button>
          )}
        </div>

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-[#5b21b6] text-lg md:text-2xl tracking-tighter" style={PIXEL}>
            LONG-TERM GOALS
          </h1>
          <div className="h-1 w-24 bg-[#99f6e4] mx-auto shadow-[2px_2px_0px_#5b21b6]" />
          <p className="text-[#a78bfa] text-base md:text-lg max-w-md mx-auto px-4" style={VT}>
            "You do not rise to the level of your goals. You fall to the level of your systems."
            <br />— James Clear
          </p>
        </div>

        {/* Suggestions */}
        <SuggestionsPanel
          suggestions={suggestions}
          onDismiss={handleDismissSuggestion}
          onAccept={handleAcceptSuggestion}
          onClose={() => setSuggestions([])}
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Active" value={String(goals.length)} />
          <StatTile label="Streak" value={`${totalStreak}d`} color="#f472b6" />
          <StatTile label="Hours" value={totalHoursThisMonth.toFixed(1)} color="#2dd4bf" />
        </div>

        {/* Empty state — Atomic Habits */}
        {goals.length === 0 && !loading && (
          <div className="bg-white border-2 border-[#ddd6fe] p-6 shadow-[4px_4px_0px_#ddd6fe] space-y-4">
            <h2 className="text-[#5b21b6] text-[11px] text-center" style={PIXEL}>
              BUILD SYSTEMS, NOT JUST GOALS
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "👁️", title: "OBVIOUS", desc: "Clear cues — time & place" },
                { icon: "💎", title: "ATTRACTIVE", desc: "Pair with what you enjoy" },
                { icon: "🎯", title: "EASY", desc: "Start with 2-min version" },
                { icon: "🏆", title: "SATISFYING", desc: "Track & celebrate" },
              ].map((p) => (
                <div key={p.title} className="p-3 border-2 border-[#ddd6fe]">
                  <span className="text-lg">{p.icon}</span>
                  <p className="text-[9px] text-[#5b21b6] mt-1" style={PIXEL}>{p.title}</p>
                  <p className="text-sm text-[#a78bfa]" style={VT}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goals list */}
        {loading ? (
          <div className="text-center py-12 text-[#a78bfa] text-lg" style={VT}>
            Loading your goals...
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onLog={logProgress} onArchive={archiveGoal} />
            ))}
          </div>
        )}

        {/* Plant new goal */}
        <AddGoalDialog
          onAdd={addGoal}
          trigger={
            <button
              className="w-full py-4 border-2 border-dashed border-[#ddd6fe] text-[#a78bfa] hover:text-[#5b21b6] hover:border-[#5b21b6] transition-all flex items-center justify-center gap-3 text-[10px]"
              style={PIXEL}
            >
              <Plus className="w-4 h-4" />
              PLANT NEW GOAL
            </button>
          }
        />

        <footer className="text-center pt-4">
          <p className="text-sm text-[#a78bfa]/70 italic" style={VT}>
            "Every action you take is a vote for the type of person you wish to become." — Atomic Habits
          </p>
        </footer>
      </div>
    </div>
  );
}
