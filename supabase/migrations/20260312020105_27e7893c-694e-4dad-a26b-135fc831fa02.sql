CREATE TABLE public.moodboard_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  board_name text NOT NULL DEFAULT 'My Board',
  image_url text NOT NULL,
  title text,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.moodboard_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own moodboard items" ON public.moodboard_items
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own moodboard items" ON public.moodboard_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own moodboard items" ON public.moodboard_items
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own moodboard items" ON public.moodboard_items
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);