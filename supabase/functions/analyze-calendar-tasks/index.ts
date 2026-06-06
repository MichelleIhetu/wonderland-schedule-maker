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

    // 1. Symbolic pass — ONLY a fallback hint. The LLM is not shown these tags,
    //    so it cannot pattern-match on them. They're used only if the LLM omits
    //    a field for an event.
    const symbolic = events.map((e) => ({ event: e, tag: symbolicTag(e) }));

    // 2. Neural pass — model reasons from scratch about each event using
    //    semantic understanding of scope, stakes, deliverable size, and
    //    audience. No keyword list, no symbolic seeds in the prompt.
    const eventsForLLM = events.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date ?? "",
      startTime: e.startTime ?? "",
      endTime: e.endTime ?? "",
      description: (e.description ?? "").slice(0, 400),
      isAllDay: !!e.isAllDay,
    }));

    const systemPrompt = `You are a planning analyst. For each calendar event, reason from first principles about how much it matters and how much preparation it realistically needs. Do NOT rely on a fixed keyword list — judge each event by what it actually IS, in any language or phrasing.

For every event decide:
- final_category: a short noun phrase you invent that describes the event (e.g. "fellowship application", "weekly stand-up", "dentist visit", "house move", "code review").
- final_importance: one of "critical" | "major" | "moderate" | "minor". Reason about stakes (career/academic/health consequences), reversibility, audience, and deliverable size — not about whether specific words appear.
- recommended_start_offset_days: an integer >= 0. How many days BEFORE the event the user should realistically start preparing, based on the work involved.
  * If the event needs no preparation at all (showing up, routine chore, casual hangout), use 0.
  * If it requires substantial deliverables, external dependencies (recommenders, approvals), research, or compounding practice, use a larger number that reflects the actual workload — could be anywhere from 1 to 60+ days.
  * Do NOT default to round numbers; pick what fits the event.
- prep_milestones: 0-3 short, concrete steps. Leave empty for events that genuinely need no prep.
- rationale: one sentence explaining WHY you chose this importance and lead time, referencing the event's content — not keywords.

Be willing to assign "minor" + 0 days to anything that's truly routine, even if the title sounds formal, and "critical" + many days to anything with real stakes, even if the title is casual or uses unfamiliar wording.

Today is ${today}. Return ONLY valid JSON of the form:
{"analyzed":[{"id":"...","final_category":"...","final_importance":"...","recommended_start_offset_days":N,"recommended_start_date":"YYYY-MM-DD","prep_milestones":["..."],"rationale":"..."}]}`;

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
          { role: "user", content: JSON.stringify({ events: eventsForLLM }) },
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

    // 3. Fusion: neural reasoning is AUTHORITATIVE. Symbolic tag is only used
    //    as a fallback if the model returned nothing for that event.
    const analyzed = symbolic.map(({ event, tag }) => {
      const n = neuralById.get(event.id);
      const hasNeural = !!n;

      const finalImportance: Importance = hasNeural && typeof n.final_importance === "string"
        && ["critical", "major", "moderate", "minor"].includes(n.final_importance)
          ? n.final_importance as Importance
          : tag.importance; // fallback only when model omitted the event

      const leadDays = hasNeural && Number.isFinite(n.recommended_start_offset_days)
        ? Math.max(0, Math.round(n.recommended_start_offset_days))
        : (hasNeural ? 0 : tag.minLeadDays);

      // Compute recommended_start_date relative to event.date when present.
      let recommendedStartDate: string | null = (hasNeural && n.recommended_start_date) || null;
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
        symbolic: tag, // exposed for transparency only — not used to override neural
        final_category: (hasNeural && n.final_category) || tag.category,
        final_importance: finalImportance,
        lead_days: leadDays,
        recommended_start_date: recommendedStartDate,
        prep_milestones: hasNeural && Array.isArray(n.prep_milestones)
          ? n.prep_milestones.slice(0, 3)
          : [],
        rationale:
          hasNeural && typeof n.rationale === "string" && n.rationale.trim()
            ? n.rationale
            : "Model did not return a rationale; using fallback classification.",
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
