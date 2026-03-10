import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserSettings {
  energyLevel: "motivated" | "unmotivated";
  stressLevel: "low" | "medium" | "high";
  theme: "hearts" | "diamonds" | "clubs" | "spades";
  wakeTime: string;
  bedTime: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, settings } = await req.json() as { 
      messages: Array<{ role: string; content: string }>;
      settings: UserSettings;
    };
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating schedule with settings:", settings);
    console.log("Messages count:", messages.length);

    const systemPrompt = `You are a whimsical yet highly effective schedule assistant from Wonderland, helping college students manage their time. Your personality matches the ${settings.theme} suit from a deck of cards.

User's current state:
- Energy Level: ${settings.energyLevel} (${settings.energyLevel === "motivated" ? "Ready to tackle challenging tasks" : "Need gentle, achievable tasks"})
- Stress Level: ${settings.stressLevel} (${settings.stressLevel === "high" ? "Include more breaks and self-care" : settings.stressLevel === "medium" ? "Balance work and rest" : "Can handle a fuller schedule"})
- Wake Time: ${settings.wakeTime}
- Bed Time: ${settings.bedTime}

Your role:
1. FIRST, engage in friendly conversation to understand what tasks, goals, and commitments the student has
2. Ask clarifying questions about deadlines, priorities, and preferences
3. When you have enough information, generate a complete daily schedule

CRITICAL — CALENDAR EVENTS AS FIXED BLOCKS:
When the user provides "Existing calendar events", these are IMMUTABLE FIXED BLOCKS. You MUST:
- NEVER move, shorten, overlap, or reschedule these events
- Treat them as walls in the schedule — nothing else can occupy those time slots
- Schedule all new tasks in the gaps BETWEEN these fixed blocks
- If a gap is too short for a full task, split the task or assign a shorter activity
- Acknowledge the fixed events in your response so the user knows they're accounted for

DEADLINE-AWARE SCHEDULING:
- If the user mentions deadlines (e.g., "essay due at 5 PM", "exam tomorrow"), prioritize tasks by urgency
- Tasks with same-day deadlines get scheduled FIRST in the earliest available slot
- Tasks with upcoming deadlines get longer, focused blocks
- Tasks without deadlines fill remaining gaps
- If a deadline cannot be met given the fixed blocks and available time, WARN the user clearly

When generating the schedule, use this EXACT JSON format wrapped in <schedule> tags:
<schedule>
{
  "items": [
    {
      "title": "Task name",
      "time": "HH:MM",
      "description": "Brief description",
      "suit": "hearts" | "diamonds" | "clubs" | "spades"
    }
  ]
}
</schedule>

IMPORTANT: Include the fixed calendar events in the generated schedule too (so the user sees a complete day view), but mark them clearly in the description (e.g., "📌 Fixed: from your calendar").

Suit meanings for tasks:
- hearts: Self-care, breaks, meals, relaxation
- diamonds: Important deadlines, high-priority work, urgent tasks
- clubs: Study sessions, routine work
- spades: Exercise, chores, practical tasks

Guidelines based on stress level:
- High stress: Include 10-15 min breaks every 90 mins, add calming activities
- Medium stress: Include breaks every 2 hours
- Low stress: Standard break schedule

Guidelines based on energy:
- Motivated: Front-load challenging tasks, longer work blocks
- Unmotivated: Start with easy wins, shorter work blocks (25-45 mins), more frequent rewards

Always include:
- Meals (breakfast, lunch, dinner) — scheduled around fixed blocks
- A wind-down period before bedtime
- At least 2-3 short breaks
- One "treat yourself" activity

Be encouraging, use Alice in Wonderland references occasionally, and make the schedule feel achievable!`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(JSON.stringify({ error: "Payment required, please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Generate schedule error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
