
CREATE TABLE public.google_oauth_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_oauth_tokens TO authenticated;
GRANT ALL ON public.google_oauth_tokens TO service_role;

ALTER TABLE public.google_oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own google tokens"
  ON public.google_oauth_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.cached_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  events JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cached_calendar_events TO authenticated;
GRANT ALL ON public.cached_calendar_events TO service_role;

ALTER TABLE public.cached_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cached events"
  ON public.cached_calendar_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_google_oauth_tokens_updated
  BEFORE UPDATE ON public.google_oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_cached_calendar_events_updated
  BEFORE UPDATE ON public.cached_calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
