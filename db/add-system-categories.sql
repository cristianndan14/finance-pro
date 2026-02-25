-- =============================================
-- Add System (Default) Categories
-- Run this in the Supabase SQL Editor
-- =============================================

-- 1. Allow user_id to be NULL (system categories have no owner)
ALTER TABLE public.categories ALTER COLUMN user_id DROP NOT NULL;

-- 2. Replace the single ALL policy with per-operation policies
DROP POLICY IF EXISTS "Users can CRUD their own categories" ON public.categories;

-- SELECT: authenticated users see system categories (user_id IS NULL) + their own
CREATE POLICY "Users can view own and system categories" ON public.categories
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

-- INSERT / UPDATE / DELETE: only the owning user
CREATE POLICY "Users can insert own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Insert system categories (user_id = NULL means they belong to the system)
--    Use ON CONFLICT DO NOTHING to make this script idempotent.
INSERT INTO public.categories (name, icon, color, user_id) VALUES
  ('Vivienda',       'Home',            'blue',    NULL),
  ('Alimentación',   'Utensils',        'amber',   NULL),
  ('Transporte',     'Car',             'cyan',    NULL),
  ('Salud',          'HeartPulse',      'red',     NULL),
  ('Ocio',           'Ticket',          'violet',  NULL),
  ('Suscripciones',  'Zap',             'emerald', NULL),
  ('Otros',          'MoreHorizontal',  'rose',    NULL);
