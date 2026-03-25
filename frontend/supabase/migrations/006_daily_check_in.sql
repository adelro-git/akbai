-- AKBai Migration 006: Daily Check-In table
-- Stores daily mood check-in + KA's personalized greeting per user per day.
-- Part of Build 2 Dashboard Shell (Sprint 4, Task 4).

CREATE TABLE public.daily_check_in (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood TEXT,                    -- optional: user's business mood for the day
  kai_greeting TEXT NOT NULL,   -- the personalized greeting KA generated
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL,  -- soft delete (non-negotiable)
  UNIQUE(user_id, check_in_date)
);

-- RLS: auth.uid() = user_id (NON-NEGOTIABLE)
ALTER TABLE public.daily_check_in ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_check_in_select_own"
  ON public.daily_check_in
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "daily_check_in_insert_own"
  ON public.daily_check_in
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_check_in_update_own"
  ON public.daily_check_in
  FOR UPDATE
  USING (auth.uid() = user_id);
