-- ============================================================
-- Migration 007: Add financial columns to daily_check_in
-- Feature: Daily Check-In (Build 2 — Sprint 5)
-- Purpose: Track daily sales and expenses alongside mood check-in.
--          All amounts stored as INTEGER centavos (non-negotiable).
-- ============================================================
-- Rollback:
--   ALTER TABLE public.daily_check_in DROP COLUMN IF EXISTS sales_amount;
--   ALTER TABLE public.daily_check_in DROP COLUMN IF EXISTS expenses_amount;

ALTER TABLE public.daily_check_in
  ADD COLUMN sales_amount INTEGER,       -- nullable, centavos (₱34.50 = 3450)
  ADD COLUMN expenses_amount INTEGER;    -- nullable, centavos
