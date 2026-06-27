supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === "SIGNED_IN" && session?.provider_refresh_token) {
    // Save the refresh token — this is the critical step
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
