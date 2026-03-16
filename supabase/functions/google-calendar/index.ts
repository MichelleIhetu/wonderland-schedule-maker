import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-provider-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create client and explicitly validate the JWT token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching calendar for user:', user.id);

    // Try to get provider token from custom header (passed by client)
    const providerToken = req.headers.get('x-provider-token');
    
    if (!providerToken) {
      console.error('No Google provider token found');
      return new Response(
        JSON.stringify({ error: 'No Google provider token. Please sign out and sign in again with Google to grant calendar access.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse body for timezone and day range from client
    let timezone = 'UTC';
    let timeMin = '';
    let timeMax = '';
    try {
      const body = await req.json();
      if (body?.timezone) timezone = body.timezone;
      if (body?.timeMin) timeMin = body.timeMin;
      if (body?.timeMax) timeMax = body.timeMax;
    } catch {}

    // Fallback range if client did not provide one
    if (!timeMin || !timeMax) {
      const todayUtc = new Date();
      todayUtc.setUTCHours(0, 0, 0, 0);
      const tomorrowUtc = new Date(todayUtc);
      tomorrowUtc.setUTCDate(tomorrowUtc.getUTCDate() + 1);
      timeMin = todayUtc.toISOString();
      timeMax = tomorrowUtc.toISOString();
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

    const events = mergedItems.map((item: any) => {
      const startDateTime = item.start?.dateTime || item.start?.date;
      const endDateTime = item.end?.dateTime || item.end?.date;
      const isAllDay = !item.start?.dateTime;

      let startTime = '';
      let endTime = '';

      if (!isAllDay && startDateTime) {
        const startDate = new Date(startDateTime);
        startTime = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      }
      if (!isAllDay && endDateTime) {
        const endDate = new Date(endDateTime);
        endTime = endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      }

      return {
        id: `${item.id}-${item.organizer?.email || item._calendarName || 'calendar'}`,
        title: item.summary || 'Untitled Event',
        startTime,
        endTime,
        description: item.description || '',
        isAllDay,
      };
    });

    return new Response(
      JSON.stringify({ events }),
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
