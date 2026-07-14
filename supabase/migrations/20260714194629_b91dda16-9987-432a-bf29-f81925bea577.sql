
-- user_schedules
CREATE TABLE public.user_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  schedule_date date NOT NULL,
  schedule_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings jsonb,
  journal_text text,
  vibe_checks jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, schedule_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_schedules TO authenticated;
GRANT ALL ON public.user_schedules TO service_role;
ALTER TABLE public.user_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own schedules" ON public.user_schedules
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- goals
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  goal_type text NOT NULL DEFAULT 'ongoing',
  target_hours numeric NOT NULL DEFAULT 0,
  target_unit text NOT NULL DEFAULT 'hours',
  category text NOT NULL DEFAULT 'general',
  start_date date NOT NULL DEFAULT (now()::date),
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own goals" ON public.goals
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- goal_logs
CREATE TABLE public.goal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  log_date date NOT NULL DEFAULT (now()::date),
  hours_logged numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (goal_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goal_logs TO authenticated;
GRANT ALL ON public.goal_logs TO service_role;
ALTER TABLE public.goal_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own goal logs" ON public.goal_logs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- moodboard_items
CREATE TABLE public.moodboard_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  image_url text NOT NULL,
  title text,
  source_url text,
  board_name text NOT NULL DEFAULT 'default',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.moodboard_items TO authenticated;
GRANT ALL ON public.moodboard_items TO service_role;
ALTER TABLE public.moodboard_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own moodboard items" ON public.moodboard_items
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
