import { supabase } from "@/integrations/supabase/client";

export const connectGoogleCalendar = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      scopes:
        "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly",
      queryParams: {
        access_type: "offline", // Gets refresh token
        prompt: "consent", // Forces Google to re-issue it
      },
      redirectTo: window.location.origin, // Return to your app after auth
    },
  });

  if (error) return { error: error.message };
  return {};
};
