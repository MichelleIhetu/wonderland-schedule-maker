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

    // Parse body for timezone
    let timezone = 'UTC';
    try {
      const body = await req.json();
      if (body?.timezone) timezone = body.timezone;
    } catch {}

    console.log('Using timezone:', timezone);

    // Get today's date range in user's timezone
    const nowInTz = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
    const todayStart = new Date(nowInTz);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(nowInTz);
    todayEnd.setHours(23, 59, 59, 999);

    // Convert back to ISO for the API using timezone offset
    const timeMin = todayStart.toISOString();
    const timeMax = todayEnd.toISOString();

    console.log('Fetching events from', timeMin, 'to', timeMax);

    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${encodeURIComponent(timeMin)}&` +
      `timeMax=${encodeURIComponent(timeMax)}&` +
      `singleEvents=true&` +
      `orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${providerToken}`,
        },
      }
    );

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      console.error('Google Calendar API error:', calendarResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch calendar events', details: errorText }),
        { status: calendarResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const calendarData = await calendarResponse.json();
    console.log('Fetched', calendarData.items?.length || 0, 'events');

    const events = (calendarData.items || []).map((item: any) => {
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
        id: item.id,
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
