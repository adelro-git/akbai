-- ============================================================
-- Migration 012: Morning Briefing cache columns on daily_check_in
-- Feature: Ang Umaga Mo (Build 5)
-- Purpose: Cache one Claude-generated briefing per user per day
--          to avoid redundant API calls. briefing_content stores
--          the rendered text, briefing_generated_at tracks freshness.
-- ============================================================

-- --- Add briefing cache columns to daily_check_in ---
ALTER TABLE public.daily_check_in
  ADD COLUMN IF NOT EXISTS briefing_content TEXT NULL;

ALTER TABLE public.daily_check_in
  ADD COLUMN IF NOT EXISTS briefing_generated_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.daily_check_in.briefing_content
  IS 'Cached morning briefing text (one Claude call per user per day)';

COMMENT ON COLUMN public.daily_check_in.briefing_generated_at
  IS 'When the briefing was generated (for cache staleness checks)';
