import { supabase } from "@/integrations/supabase/client";

// Step 1 — Trigger Google OAuth (gets refresh token)
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

// Step 2 — Save refresh token after OAuth redirect completes
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === "SIGNED_IN" && session?.provider_refresh_token) {
    await supabase.functions.invoke("google-token-save", {
      body: {
        refresh_token: session.provider_refresh_token,
        access_token: session.provider_token,
        expires_in: 3600,
        scope:
          "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly",
      },
    });
  }
});

// Step 3 — Fetch events (edge function handles token refresh silently)
export const fetchCalendarEvents = async (timezone: string) => {
  const { data, error } = await supabase.functions.invoke("google-calendar", {
    body: { timezone },
  });

  if (data?.needsAuth) {
    await connectGoogleCalendar();
    return [];
  }

  return data?.events ?? [];
};
