import { supabase } from "@/integrations/supabase/client";

const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events.readonly",
].join(" ");

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type TokenClient = {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            prompt?: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (error: unknown) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

let googleScriptPromise: Promise<void> | null = null;

const loadGoogleIdentityScript = () => {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Calendar sign-in script could not load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Calendar sign-in script could not load."));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
};

const requestToken = (clientId: string, prompt: "" | "consent") => new Promise<{ accessToken: string | null; error?: string }>((resolve) => {
  const client = window.google!.accounts!.oauth2!.initTokenClient({
    client_id: clientId,
    scope: GOOGLE_CALENDAR_SCOPES,
    prompt,
    callback: async (response) => {
      if (response.error) {
        const description = response.error_description || response.error;
        resolve({
          accessToken: null,
          error: `Google Calendar permission was not granted: ${description}`,
        });
        return;
      }

      if (response.access_token) {
        await supabase.functions.invoke("google-token-save", {
          body: {
            access_token: response.access_token,
            expires_in: 3600,
            scope: GOOGLE_CALENDAR_SCOPES,
          },
        });
      }

      resolve({ accessToken: response.access_token || null });
    },
    error_callback: () => {
      resolve({
        accessToken: null,
        error: "Google Calendar permission popup was blocked or closed.",
      });
    },
  });

  client.requestAccessToken({ prompt });
});

export const requestGoogleCalendarAccessToken = async (options: { forceConsent?: boolean } = {}): Promise<{ accessToken: string | null; error?: string; configurationError?: boolean }> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { accessToken: null, error: "Please sign in before connecting Calendar." };
  }

  const { data, error } = await supabase.functions.invoke("google-calendar-config");
  if (error || data?.error || !data?.clientId) {
    return {
      accessToken: null,
      error: data?.error || error?.message || "Google Calendar setup could not be checked.",
      configurationError: !!data?.configurationError,
    };
  }

  try {
    await loadGoogleIdentityScript();
  } catch (scriptError) {
    return {
      accessToken: null,
      error: scriptError instanceof Error ? scriptError.message : "Google Calendar sign-in script could not load.",
    };
  }

  if (!window.google?.accounts?.oauth2) {
    return { accessToken: null, error: "Google Calendar sign-in is unavailable in this browser." };
  }

  if (options.forceConsent) return requestToken(data.clientId, "consent");

  const silent = await requestToken(data.clientId, "");
  if (silent.accessToken) return silent;
  return requestToken(data.clientId, "consent");
};