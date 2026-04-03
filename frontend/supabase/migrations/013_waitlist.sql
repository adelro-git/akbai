-- Migration: 013_waitlist.sql
-- Creates the waitlist table for landing page email capture

CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'landing_page',
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL  -- soft delete per project rules
);

-- RLS: public insert (anyone can sign up), no read access for anon
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert waitlist" ON public.waitlist
  FOR INSERT WITH CHECK (true);

-- Service role can read (for analytics)
CREATE POLICY "Service role can read waitlist" ON public.waitlist
  FOR SELECT USING (auth.role() = 'service_role');
