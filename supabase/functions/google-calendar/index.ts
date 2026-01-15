import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the user's session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching calendar for user:', user.id);

    // Get the user's Google OAuth provider token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('No session found:', sessionError);
      return new Response(
        JSON.stringify({ error: 'No session found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const providerToken = session.provider_token;
    
    if (!providerToken) {
      console.error('No Google provider token found');
      return new Response(
        JSON.stringify({ error: 'No Google provider token. Please sign in with Google.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const timeMin = today.toISOString();
    const timeMax = tomorrow.toISOString();

    console.log('Fetching events from', timeMin, 'to', timeMax);

    // Fetch events from Google Calendar API
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

    // Transform events to our format
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
