import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  // Get all users with a valid refresh token
  const { data: tokenRows } = await admin
    .from("google_oauth_tokens")
    .select("user_id, refresh_token")
    .not("refresh_token", "is", null);

  if (!tokenRows?.length) {
    return new Response(JSON.stringify({ synced: 0 }), { headers: corsHeaders });
  }

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

  let synced = 0;

  for (const row of tokenRows) {
    try {
      // 1. Get fresh access token
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: row.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      if (!tokenRes.ok) {
        console.error(`Token refresh failed for user ${row.user_id}`);
        continue;
      }

      const { access_token } = await tokenRes.json();

      // 2. Fetch their calendar events (next 31 days)
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setDate(end.getDate() + 31);

      const calRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
          `timeMin=${encodeURIComponent(now.toISOString())}&` +
          `timeMax=${encodeURIComponent(end.toISOString())}&` +
          `singleEvents=true&orderBy=startTime&maxResults=100`,
        { headers: { Authorization: `Bearer ${access_token}` } },
      );

      if (!calRes.ok) {
        console.error(`Calendar fetch failed for user ${row.user_id}`);
        continue;
      }

      const calData = await calRes.json();
      const events = (calData.items ?? []).map((item: any) => ({
        id: item.id,
        title: item.summary || "Untitled Event",
        date: (item.start?.dateTime || item.start?.date || "").slice(0, 10),
        startTime: item.start?.dateTime ? new Date(item.start.dateTime).toTimeString().slice(0, 5) : "",
        endTime: item.end?.dateTime ? new Date(item.end.dateTime).toTimeString().slice(0, 5) : "",
        description: item.description || "",
        isAllDay: !item.start?.dateTime,
      }));

      // 3. Update the cache
      await admin.from("cached_calendar_events").upsert(
        {
          user_id: row.user_id,
          events,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      // 4. Update stored access token
      await admin
        .from("google_oauth_tokens")
        .update({
          access_token,
          expires_at: new Date(Date.now() + 55 * 60 * 1000).toISOString(),
        })
        .eq("user_id", row.user_id);

      synced++;
    } catch (e) {
      console.error(`Sync error for user ${row.user_id}:`, e);
    }
  }

  return new Response(JSON.stringify({ synced }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
