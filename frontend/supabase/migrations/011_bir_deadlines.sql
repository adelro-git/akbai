-- ============================================================
-- Migration 011: BIR Deadlines table + bir_tax_type on business_profiles
-- Feature: Build 6 — BIR Deadline Watcher (Sprint 9)
-- Purpose: Track BIR filing deadlines per user, with notification flags
-- ============================================================

-- ─── bir_deadlines table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bir_deadlines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  form_name   TEXT NOT NULL,            -- e.g. '1701Q', '2551Q'
  due_date    DATE NOT NULL,
  description TEXT,                     -- human-readable description
  status      TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'filed', 'overdue', 'na')),
  notified_7d BOOLEAN DEFAULT FALSE,
  notified_3d BOOLEAN DEFAULT FALSE,
  notified_1d BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  deleted_at  TIMESTAMPTZ NULL          -- soft-delete only
);

-- ─── Index for efficient queries ────────────────────────────────────
CREATE INDEX idx_bir_deadlines_user_due ON bir_deadlines (user_id, due_date);

-- ─── Unique constraint to prevent duplicate deadlines ───────────────
CREATE UNIQUE INDEX idx_bir_deadlines_unique_form_date
  ON bir_deadlines (user_id, form_name, due_date)
  WHERE deleted_at IS NULL;

-- ─── RLS policies (auth.uid() = user_id on every operation) ────────
ALTER TABLE bir_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deadlines"
  ON bir_deadlines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deadlines"
  ON bir_deadlines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deadlines"
  ON bir_deadlines FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own deadlines"
  ON bir_deadlines FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Add bir_tax_type to business_profiles ──────────────────────────
ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS bir_tax_type TEXT NULL;
