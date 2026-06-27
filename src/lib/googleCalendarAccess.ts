import { supabase } from "@/integrations/supabase/client";

export const connectGoogleCalendar = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      scopes:
        "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly",
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
      redirectTo: window.location.origin,
    },
  });
  if (error) return { error: error.message };
  return {};
};

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === "SIGNED_IN" && session?.provider_refresh_token) {
    await supabase.functions.invoke("google-token-save", {
      body: {
        refresh_token: session.provider_refresh_token,
        access_token: session.provider_token,
        expires_in: 3600,
        scope: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly",
      },
    });
  }
});

export const fetchCalendarEvents = async (timezone: string) => {
  const { data } = await supabase.functions.invoke("google-calendar", {
    body: { timezone },
  });

  if (data?.needsAuth) {
    await connectGoogleCalendar();
    return [];
  }

  return data?.events ?? [];
};
