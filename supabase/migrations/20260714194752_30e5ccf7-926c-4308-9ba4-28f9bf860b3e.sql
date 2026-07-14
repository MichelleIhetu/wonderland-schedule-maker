
-- 1. Lock down SECURITY DEFINER event trigger function
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- 2. Revoke SELECT from anon on user-scoped tables (removes GraphQL/PostgREST anon exposure)
REVOKE SELECT ON public.cached_calendar_events FROM anon;
REVOKE SELECT ON public.google_oauth_tokens FROM anon;
REVOKE SELECT ON public.user_schedules FROM anon;
REVOKE SELECT ON public.goals FROM anon;
REVOKE SELECT ON public.goal_logs FROM anon;
REVOKE SELECT ON public.moodboard_items FROM anon;

-- 3. Rescope existing policies from role "public" to "authenticated"
DROP POLICY IF EXISTS "Users can manage own cache" ON public.cached_calendar_events;
CREATE POLICY "Users can manage own cache"
  ON public.cached_calendar_events
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own tokens" ON public.google_oauth_tokens;
CREATE POLICY "Users can manage own tokens"
  ON public.google_oauth_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
