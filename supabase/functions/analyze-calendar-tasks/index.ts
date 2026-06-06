// Neurosymbolic task analyzer.
// Symbolic layer: rule-based heuristics on keywords/categories/duration → seed importance + minimum lead time.
// Neural layer: LLM refines, picks recommended_start_offset_days, generates rationale + prep milestones.
// Final result fuses both: max(symbolicLeadDays, neuralLeadDays) and weighted importance.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type RawEvent = {
  id: string;
  title: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  isAllDay?: boolean;
  // Absolute date in ISO (YYYY-MM-DD) when available — improves lead-time planning.
  date?: string;
};

type Importance = "critical" | "major" | "moderate" | "minor";

interface SymbolicTag {
  category: string;
  importance: Importance;
  minLeadDays: number;
  matchedKeyword: string;
}

// Symbolic rules — ordered most-specific first. The first match wins as the seed.
const RULES: Array<{
  category: string;
  importance: Importance;
  minLeadDays: number;
  patterns: RegExp[];
}> = [
  {
    category: "graduate/job application",
    importance: "critical",
    minLeadDays: 21,
    patterns: [/\b(grad(uate)?|phd|masters?)\s+app/i, /application\s+deadline/i, /\bSOP\b/i, /personal statement/i, /\b(job|internship)\s+app/i],
  },
  {
    category: "semester project / thesis",
    importance: "critical",
    minLeadDays: 14,
    patterns: [/\b(thesis|dissertation|capstone)\b/i, /semester\s+project/i, /final\s+project/i, /research\s+paper/i],
  },
  {
    category: "exam",
    importance: "critical",
    minLeadDays: 10,
    patterns: [/\b(midterm|final|exam|test)\b/i, /\bquiz\b/i],
  },
  {
    category: "major presentation",
    importance: "major",
    minLeadDays: 7,
    patterns: [/\bpresentation\b/i, /\bdefen[cs]e\b/i, /\bpitch\b/i, /\bdemo day\b/i],
  },
  {
    category: "essay / report",
    importance: "major",
    minLeadDays: 5,
    patterns: [/\bessay\b/i, /\breport\b/i, /\bpaper due\b/i, /\bproposal\b/i],
  },
  {
    category: "weekly assignment",
    importance: "moderate",
    minLeadDays: 2,
    patterns: [/\bassignment\b/i, /\bhomework\b/i, /\bhw\b/i, /\bproblem set\b/i, /\bps\d/i],
  },
  {
    category: "meeting",
    importance: "moderate",
    minLeadDays: 1,
    patterns: [/\bmeeting\b/i, /\b1:1\b/i, /\boffice hours?\b/i, /\bsync\b/i, /\bstand[- ]?up\b/i],
  },
  {
    category: "appointment",
    importance: "moderate",
    minLeadDays: 1,
    patterns: [/\bappointment\b/i, /\bdoctor\b/i, /\bdentist\b/i, /\binterview\b/i],
  },
  {
    category: "errand / chore",
    importance: "minor",
    minLeadDays: 0,
    patterns: [/\blaundry\b/i, /\bgrocery|groceries\b/i, /\bclean(ing)?\b/i, /\bdishes\b/i, /\berrand\b/i],
  },
  {
    category: "social / leisure",
    importance: "minor",
    minLeadDays: 0,
    patterns: [/\b(dinner|lunch|brunch|coffee|drinks)\b/i, /\bbirthday\b/i, /\bparty\b/i, /\bhang(out)?\b/i],
  },
  {
    category: "fitness",
    importance: "minor",
    minLeadDays: 0,
    patterns: [/\bgym\b/i, /\byoga\b/i, /\brun(ning)?\b/i, /\bworkout\b/i],
  },
];

function symbolicTag(event: RawEvent): SymbolicTag {
  const text = `${event.title} ${event.description ?? ""}`;
  for (const rule of RULES) {
    for (const p of rule.patterns) {
      const m = text.match(p);
      if (m) {
        return {
          category: rule.category,
          importance: rule.importance,
          minLeadDays: rule.minLeadDays,
          matchedKeyword: m[0],
        };
      }
    }
  }
  return {
    category: "uncategorized",
    importance: "minor",
    minLeadDays: 0,
    matchedKeyword: "",
  };
}

const IMPORTANCE_RANK: Record<Importance, number> = {
  minor: 0,
  moderate: 1,
  major: 2,
  critical: 3,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const events: RawEvent[] = Array.isArray(body?.events) ? body.events : [];
    const today: string =
      typeof body?.today === "string" ? body.today : new Date().toISOString().slice(0, 10);

    if (events.length === 0) {
      return new Response(JSON.stringify({ analyzed: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Symbolic pass
    const symbolic = events.map((e) => ({ event: e, tag: symbolicTag(e) }));

    // 2. Neural pass — ask LLM to refine, but with the symbolic seeds in context.
    const seeds = symbolic.map(({ event, tag }) => ({
      id: event.id,
      title: event.title,
      date: event.date ?? "",
      startTime: event.startTime ?? "",
      endTime: event.endTime ?? "",
      description: (event.description ?? "").slice(0, 400),
      symbolic_category: tag.category,
      symbolic_importance: tag.importance,
      symbolic_min_lead_days: tag.minLeadDays,
    }));

    const systemPrompt = `You are a neurosymbolic planning assistant for TimeBunny.
You receive calendar events that already have a SYMBOLIC seed (rule-based category + minimum lead days). 
Refine each into a final plan. Your job:
- Decide final importance: critical | major | moderate | minor.
- Decide recommended_start_offset_days: how many days BEFORE the event the user should begin preparation. Must be >= symbolic_min_lead_days. Major academic/career artifacts (theses, grad apps, capstones) require 14-30 days. Minor chores require 0.
- Suggest 1-3 short prep_milestones (e.g. "outline draft", "submit recommendation requests").
- Write a one-sentence rationale.
Today is ${today}.
Return ONLY valid JSON of the form: {"analyzed":[{"id":"...","final_category":"...","final_importance":"...","recommended_start_offset_days":N,"recommended_start_date":"YYYY-MM-DD","prep_milestones":["..."],"rationale":"..."}]}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify({ events: seeds }) },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const content: string = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let neural: any = {};
    try {
      neural = JSON.parse(content);
    } catch {
      neural = {};
    }
    const neuralById = new Map<string, any>();
    for (const item of neural?.analyzed ?? []) {
      if (item?.id) neuralById.set(String(item.id), item);
    }

    // 3. Fusion: prefer the stricter (longer) lead and the higher importance.
    const analyzed = symbolic.map(({ event, tag }) => {
      const n = neuralById.get(event.id) ?? {};
      const finalImportance: Importance =
        IMPORTANCE_RANK[(n.final_importance as Importance) ?? tag.importance] >=
        IMPORTANCE_RANK[tag.importance]
          ? (n.final_importance as Importance) ?? tag.importance
          : tag.importance;

      const neuralLead = Number.isFinite(n.recommended_start_offset_days)
        ? Math.max(0, Math.round(n.recommended_start_offset_days))
        : tag.minLeadDays;
      const leadDays = Math.max(tag.minLeadDays, neuralLead);

      // Compute recommended_start_date relative to event.date when present.
      let recommendedStartDate: string | null = n.recommended_start_date ?? null;
      if (!recommendedStartDate && event.date) {
        const d = new Date(`${event.date}T00:00:00Z`);
        d.setUTCDate(d.getUTCDate() - leadDays);
        recommendedStartDate = d.toISOString().slice(0, 10);
      }

      return {
        id: event.id,
        title: event.title,
        date: event.date ?? null,
        startTime: event.startTime ?? null,
        endTime: event.endTime ?? null,
        symbolic: tag,
        final_category: n.final_category ?? tag.category,
        final_importance: finalImportance,
        lead_days: leadDays,
        recommended_start_date: recommendedStartDate,
        prep_milestones: Array.isArray(n.prep_milestones) ? n.prep_milestones.slice(0, 3) : [],
        rationale:
          typeof n.rationale === "string" && n.rationale.trim()
            ? n.rationale
            : `${tag.category} — symbolic rule (${tag.matchedKeyword || "default"}).`,
      };
    });

    // Sort: highest importance first, then soonest start.
    analyzed.sort((a, b) => {
      const r = IMPORTANCE_RANK[b.final_importance] - IMPORTANCE_RANK[a.final_importance];
      if (r !== 0) return r;
      return (a.recommended_start_date ?? "").localeCompare(b.recommended_start_date ?? "");
    });

    return new Response(JSON.stringify({ analyzed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-calendar-tasks error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
