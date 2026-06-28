import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

type GoogleCalendarConnectionResult = {
  accessToken: string | null;
  error?: string;
  redirected?: boolean;
};

const GOOGLE_CALENDAR_SCOPES =
  "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly";

const waitForAuthSession = async (timeoutMs = 6000) => {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) return session;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return null;
};

const persistGoogleTokens = async (session: any) => {
  if (!session?.provider_refresh_token) return;
  await supabase.functions.invoke("google-token-save", {
    body: {
      refresh_token: session.provider_refresh_token,
      access_token: session.provider_token || null,
      expires_in: 3600,
      scope: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly",
    },
  });
};

export const connectGoogleCalendar = async (): Promise<GoogleCalendarConnectionResult> => {
  const {
    data: { session: existingSession },
  } = await supabase.auth.getSession();
  if (existingSession?.provider_token) {
    await persistGoogleTokens(existingSession);
    return { accessToken: existingSession.provider_token };
  }

  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
    extraParams: {
      prompt: "consent",
      access_type: "offline",
      include_granted_scopes: "true",
      scope: GOOGLE_CALENDAR_SCOPES,
    },
  });

  if (result.error) return { accessToken: null, error: result.error.message };
  if (result.redirected) return { accessToken: null, redirected: true };

  const session = await waitForAuthSession();
  await persistGoogleTokens(session);
  return { accessToken: session?.provider_token ?? null };
};

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === "SIGNED_IN" && session?.provider_refresh_token) {
    await persistGoogleTokens(session);
  }
});

export const fetchCalendarEvents = async (timezone: string) => {
  const invoke = async () => {
    const { data } = await supabase.functions.invoke("google-calendar", {
      body: { timezone },
    });
    return data;
  };

  let data = await invoke();

  // If the server says the saved Google token can't be refreshed, prompt the
  // user to reconnect once and retry transparently.
  if (data?.needsAuth) {
    const reconnect = await connectGoogleCalendar();
    if (reconnect.redirected) return [];
    if (reconnect.accessToken) {
      data = await invoke();
    }
  }

  return data?.events ?? [];
};
