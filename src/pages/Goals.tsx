import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Flame, Target, TrendingUp, Calendar, Archive, Clock, Sparkles, Wand2, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import SpiderWebBackground from "@/components/SpiderWebBackground";

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

function StreakDisplay({ streak }: { streak: number }) {
  if (streak === 0) return null;
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium">
      <Flame className="w-3.5 h-3.5" />
      {streak} day{streak !== 1 ? "s" : ""} streak
    </div>
  );
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

  const handleLog = () => {
    onLog(goal.id, parseFloat(logHours) || 0, logNotes || undefined);
    setLogHours("0.5");
    setLogNotes("");
    setShowLog(false);
  };

  // Get last 7 days activity
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const log = goal.logs.find((l) => l.log_date === dateStr);
    return { date: dateStr, logged: log ? Number(log.hours_logged) : 0, day: d.toLocaleDateString("en", { weekday: "narrow" }) };
  });

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{categoryInfo?.label.split(" ")[0]}</span>
              <CardTitle className="text-base font-display">{goal.title}</CardTitle>
            </div>
            {goal.description && (
              <CardDescription className="text-xs font-body">{goal.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            <StreakDisplay streak={goal.streak} />
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wider">
              {goal.goal_type}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5 font-body">
            <span>{goal.totalLogged.toFixed(1)}h logged</span>
            <span>{goal.target_hours}h target</span>
          </div>
          <Progress value={progress} className="h-2.5" />
          <p className="text-[11px] text-muted-foreground/70 mt-1.5 italic font-body">
            💡 {getAtomicTip(goal.category)}
          </p>
        </div>

        {/* 7-day activity heatmap */}
        <div>
          <p className="text-[11px] text-muted-foreground mb-1.5 uppercase tracking-wider">Last 7 days</p>
          <div className="flex gap-1">
            {last7.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className={`w-full aspect-square rounded-sm transition-colors ${
                    d.logged > 0
                      ? d.logged >= 1
                        ? "bg-primary"
                        : "bg-primary/50"
                      : "bg-muted/50"
                  }`}
                  title={`${d.date}: ${d.logged}h`}
                />
                <span className="text-[9px] text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Log progress */}
        {showLog ? (
          <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs">Hours</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  value={logHours}
                  onChange={(e) => setLogHours(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <Textarea
              placeholder="What did you work on? (optional)"
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              className="min-h-[60px] text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleLog} className="flex-1">
                Log Progress
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowLog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowLog(true)} className="flex-1 gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Log Time
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onArchive(goal.id)} title="Archive goal">
              <Archive className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AddGoalDialog({ onAdd }: { onAdd: (g: any) => void }) {
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
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Create a Long-term Goal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>What do you want to achieve?</Label>
            <Input placeholder="e.g. Work out regularly, Build side project" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Why? (Atomic Habits: make it attractive)</Label>
            <Textarea placeholder="Your motivation — connecting to identity helps stick" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[60px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={goalType} onValueChange={(v) => setGoalType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Target hours {goalType === "monthly" ? "this month" : "total"}</Label>
            <Input type="number" min="1" value={targetHours} onChange={(e) => setTargetHours(e.target.value)} />
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs font-body text-foreground">
              <strong className="text-primary">Atomic Habits tip:</strong> Start small. If your goal is 20h/month of exercise, that's ~40 min/day. Begin with just 10 mins and scale up. The habit matters more than the amount.
            </p>
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!title.trim()}>
            Create Goal
          </Button>
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
    <Card className="border-primary/30 bg-primary/5 backdrop-blur-sm mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle className="text-base font-display">AI Schedule Suggestions</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription className="text-xs font-body">
          Found gaps in your schedule — here's where you can squeeze in goal time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((s, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg bg-card/80 border border-border/40"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                  {s.startTime} – {s.endTime}
                </span>
                <span className="text-xs text-muted-foreground">{s.durationMinutes}min</span>
              </div>
              <p className="text-sm font-medium text-foreground">{s.activity}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="font-medium">For:</span> {s.goalTitle}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1 italic">💡 {s.reason}</p>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                onClick={() => onAccept(s)}
                title="Add to schedule"
              >
                <CheckCircle2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-muted-foreground"
                onClick={() => onDismiss(i)}
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
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
    <div className="min-h-screen relative overflow-hidden">
      <SpiderWebBackground />
      <div className="container max-w-4xl mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {goals.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleFindGaps}
                disabled={loadingSuggestions}
              >
                <Wand2 className={`w-4 h-4 ${loadingSuggestions ? "animate-spin" : ""}`} />
                {loadingSuggestions ? "Finding gaps..." : "Find Schedule Gaps"}
              </Button>
            )}
            <AddGoalDialog onAdd={addGoal} />
          </div>
        </div>

        <header className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">Long-term Goals</h1>
          <p className="text-sm text-muted-foreground font-body max-w-md mx-auto">
            "You do not rise to the level of your goals. You fall to the level of your systems." — James Clear
          </p>
        </header>

        {/* AI Suggestions */}
        <SuggestionsPanel
          suggestions={suggestions}
          onDismiss={handleDismissSuggestion}
          onAccept={handleAcceptSuggestion}
          onClose={() => setSuggestions([])}
        />

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <Card className="bg-card/60 backdrop-blur-sm border-border/40">
            <CardContent className="p-4 text-center">
              <Target className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold font-display text-foreground">{goals.length}</p>
              <p className="text-[11px] text-muted-foreground">Active Goals</p>
            </CardContent>
          </Card>
          <Card className="bg-card/60 backdrop-blur-sm border-border/40">
            <CardContent className="p-4 text-center">
              <Flame className="w-5 h-5 mx-auto mb-1 text-accent" />
              <p className="text-2xl font-bold font-display text-foreground">{totalStreak}</p>
              <p className="text-[11px] text-muted-foreground">Best Streak</p>
            </CardContent>
          </Card>
          <Card className="bg-card/60 backdrop-blur-sm border-border/40">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold font-display text-foreground">{totalHoursThisMonth.toFixed(1)}</p>
              <p className="text-[11px] text-muted-foreground">Hours This Month</p>
            </CardContent>
          </Card>
        </div>

        {/* Atomic Habits principles */}
        {goals.length === 0 && !loading && (
          <Card className="mb-8 bg-card/60 backdrop-blur-sm border-primary/20">
            <CardContent className="p-6 text-center space-y-4">
              <h2 className="font-display text-xl text-foreground">Build Systems, Not Just Goals</h2>
              <div className="grid grid-cols-2 gap-3 text-left max-w-lg mx-auto">
                {[
                  { icon: "👁️", title: "Make it Obvious", desc: "Set clear cues — time & place" },
                  { icon: "💎", title: "Make it Attractive", desc: "Pair with something you enjoy" },
                  { icon: "🎯", title: "Make it Easy", desc: "Start with 2-minute version" },
                  { icon: "🏆", title: "Make it Satisfying", desc: "Track & celebrate progress" },
                ].map((p) => (
                  <div key={p.title} className="p-3 rounded-lg bg-muted/30 border border-border/30">
                    <span className="text-lg">{p.icon}</span>
                    <p className="text-sm font-medium text-foreground mt-1">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground font-body">
                Create your first goal and we'll help you squeeze it into your daily schedule ✨
              </p>
            </CardContent>
          </Card>
        )}

        {/* Goals list */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground font-body">Loading your goals...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onLog={logProgress} onArchive={archiveGoal} />
            ))}
          </div>
        )}

        <footer className="mt-8 text-center">
          <p className="text-xs text-muted-foreground/60 font-body italic">
            "Every action you take is a vote for the type of person you wish to become." — Atomic Habits
          </p>
        </footer>
      </div>
    </div>
  );
}
