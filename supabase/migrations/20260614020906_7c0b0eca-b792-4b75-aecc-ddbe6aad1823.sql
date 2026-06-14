
-- Scope policies to authenticated role
DROP POLICY IF EXISTS "Users manage own cached events" ON public.cached_calendar_events;
CREATE POLICY "Users manage own cached events"
  ON public.cached_calendar_events
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own google tokens" ON public.google_oauth_tokens;
CREATE POLICY "Users manage own google tokens"
  ON public.google_oauth_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add missing INSERT policy on profiles
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Revoke EXECUTE from anon/authenticated on SECURITY DEFINER helper functions (trigger-only)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
