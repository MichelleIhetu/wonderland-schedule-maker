import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-provider-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    console.error('Missing GOOGLE_CLIENT_ID/SECRET');
    return null;
  }
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!resp.ok) {
    console.error('Google refresh failed:', resp.status, await resp.text());
    return null;
  }
  return await resp.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('User not authenticated:', userError);
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching calendar for user:', user.id);

    const admin = createClient(supabaseUrl, serviceKey);

    // Parse body first (so we can also check for cacheOnly flag)
    let timezone = 'UTC';
    let timeMin = '';
    let timeMax = '';
    let cacheOnly = false;
    try {
      const body = await req.json();
      if (body?.timezone) timezone = body.timezone;
      if (body?.cacheOnly) cacheOnly = true;
      if (body?.timeMin) timeMin = body.timeMin;
      if (body?.timeMax) timeMax = body.timeMax;
    } catch {}

    // Fallback range: scan the next 31 days (full month horizon) so neurosymbolic
    // reasoning can plan lead time for important upcoming tasks.
    if (!timeMin || !timeMax) {
      const startUtc = new Date();
      startUtc.setUTCHours(0, 0, 0, 0);
      const endUtc = new Date(startUtc);
      endUtc.setUTCDate(endUtc.getUTCDate() + 31);
      timeMin = startUtc.toISOString();
      timeMax = endUtc.toISOString();
    }

    // Cache-only fast path: just return what we have, no Google call.
    if (cacheOnly) {
      const { data: cached } = await admin
        .from('cached_calendar_events')
        .select('events, fetched_at')
        .eq('user_id', user.id)
        .maybeSingle();
      return new Response(
        JSON.stringify({ events: cached?.events || [], fromCache: true, fetchedAt: cached?.fetched_at || null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Resolve a Google access token: prefer header from current session, else stored refresh token.
    let providerToken = req.headers.get('x-provider-token') || '';

    if (!providerToken) {
      const { data: stored } = await admin
        .from('google_oauth_tokens')
        .select('refresh_token, access_token, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!stored?.refresh_token) {
        const { data: cached } = await admin
          .from('cached_calendar_events')
          .select('events, fetched_at')
          .eq('user_id', user.id)
          .maybeSingle();
        return new Response(
          JSON.stringify({
            error: 'No Google credentials. Sign in with Google to refresh.',
            needsAuth: true,
            events: cached?.events || [],
            fromCache: !!cached,
            fetchedAt: cached?.fetched_at || null,
          }),
          { status: cached ? 200 : 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const stillValid = stored.access_token && stored.expires_at && new Date(stored.expires_at) > new Date();
      if (stillValid) {
        providerToken = stored.access_token!;
      } else {
        const refreshed = await refreshGoogleToken(stored.refresh_token);
        if (!refreshed?.access_token) {
          return new Response(
            JSON.stringify({ error: 'Failed to refresh Google access. Please sign in again.', needsAuth: true }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        providerToken = refreshed.access_token;
        await admin.from('google_oauth_tokens').update({
          access_token: refreshed.access_token,
          expires_at: new Date(Date.now() + (refreshed.expires_in - 60) * 1000).toISOString(),
        }).eq('user_id', user.id);
      }
    }

    console.log('Using timezone:', timezone);
    console.log('Fetching events from', timeMin, 'to', timeMax);

    // Fetch all visible calendars first (not only "primary")
    const calendarsResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: {
          Authorization: `Bearer ${providerToken}`,
        },
      }
    );

    if (!calendarsResponse.ok) {
      const errorText = await calendarsResponse.text();
      console.error('Google Calendar list API error:', calendarsResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch calendar list', details: errorText }),
        { status: calendarsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const calendarsData = await calendarsResponse.json();
    const calendars = (calendarsData.items || [])
      .filter((cal: any) => cal?.id && cal?.accessRole && cal.accessRole !== 'none')
      .map((cal: any) => ({ id: cal.id as string, summary: cal.summary as string }));

    // Fallback to primary if list is empty for any reason
    const calendarIds = calendars.length > 0
      ? calendars
      : [{ id: 'primary', summary: 'Primary Calendar' }];

    const eventResponses = await Promise.all(
      calendarIds.map(async (calendar) => {
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?` +
          `timeMin=${encodeURIComponent(timeMin)}&` +
          `timeMax=${encodeURIComponent(timeMax)}&` +
          `timeZone=${encodeURIComponent(timezone)}&` +
          `singleEvents=true&` +
          `orderBy=startTime`,
          {
            headers: {
              Authorization: `Bearer ${providerToken}`,
            },
          }
        );

        if (!response.ok) {
          const err = await response.text();
          console.error(`Google Calendar API error for ${calendar.id}:`, response.status, err);
          return [];
        }

        const data = await response.json();
        return (data.items || []).map((item: any) => ({ ...item, _calendarName: calendar.summary }));
      })
    );

    const mergedItems = eventResponses.flat();
    console.log('Fetched', mergedItems.length || 0, 'events across', calendarIds.length, 'calendars');

    // Helper: format a date-time string to HH:MM in the user's timezone
    const toLocalHHMM = (dateTimeStr: string, tz: string): string => {
      try {
        const d = new Date(dateTimeStr);
        const parts = new Intl.DateTimeFormat('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: tz,
        }).formatToParts(d);
        const hour = parts.find(p => p.type === 'hour')?.value || '00';
        const minute = parts.find(p => p.type === 'minute')?.value || '00';
        return `${hour}:${minute}`;
      } catch {
        // Fallback: extract from ISO string
        const d = new Date(dateTimeStr);
        return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
      }
    };

    // Get "now" in the user's timezone for filtering past events
    const nowISO = new Date().toISOString();

    const events = mergedItems
      .filter((item: any) => {
        // Keep all-day events
        if (!item.start?.dateTime) return true;
        // Filter out events whose end time has already passed
        const endDateTime = item.end?.dateTime || item.start?.dateTime;
        return new Date(endDateTime) > new Date(nowISO);
      })
      .map((item: any) => {
        const startDateTime = item.start?.dateTime || item.start?.date;
        const endDateTime = item.end?.dateTime || item.end?.date;
        const isAllDay = !item.start?.dateTime;

        let startTime = '';
        let endTime = '';

        if (!isAllDay && startDateTime) {
          startTime = toLocalHHMM(startDateTime, timezone);
        }
        if (!isAllDay && endDateTime) {
          endTime = toLocalHHMM(endDateTime, timezone);
        }

        // Local YYYY-MM-DD for lead-time planning
        let date = '';
        try {
          const d = new Date(startDateTime);
          const parts = new Intl.DateTimeFormat('en-CA', {
            year: 'numeric', month: '2-digit', day: '2-digit', timeZone: timezone,
          }).formatToParts(d);
          const y = parts.find(p => p.type === 'year')?.value;
          const mo = parts.find(p => p.type === 'month')?.value;
          const da = parts.find(p => p.type === 'day')?.value;
          if (y && mo && da) date = `${y}-${mo}-${da}`;
        } catch {
          date = (startDateTime || '').slice(0, 10);
        }

        return {
          id: `${item.id}-${item.organizer?.email || item._calendarName || 'calendar'}`,
          title: item.summary || 'Untitled Event',
          date,
          startTime,
          endTime,
          description: item.description || '',
          isAllDay,
        };
      });

    // Cache the fetched events for fast subsequent loads
    try {
      await admin.from('cached_calendar_events').upsert({
        user_id: user.id,
        events,
        fetched_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch (e) {
      console.error('Failed to cache events:', e);
    }

    return new Response(
      JSON.stringify({ events, fromCache: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in google-calendar function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
