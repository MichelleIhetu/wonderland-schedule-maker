ALTER TABLE public.user_schedules
  ADD COLUMN IF NOT EXISTS journal_text TEXT,
  ADD COLUMN IF NOT EXISTS vibe_checks JSONB NOT NULL DEFAULT '[]'::jsonb;