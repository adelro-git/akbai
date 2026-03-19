-- ============================================================
-- Migration: 002_add_bir_deadlines.sql
-- Feature: BIR Deadline Watcher (Build 6)
-- Purpose: Create BIR deadline tracking table with RLS and auto-update triggers
-- ============================================================

-- --- Table: bir_deadlines ---
-- Tracks BIR filing deadlines for each user with filing status and notification state
CREATE TABLE IF NOT EXISTS bir_deadlines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL,                -- e.g., '1701Q', '2550M', '2551Q', '1702'
  due_date DATE NOT NULL,                 -- BIR deadline date (Asia/Manila timezone)
  filed BOOLEAN DEFAULT FALSE,            -- Whether this form has been filed
  filed_at TIMESTAMPTZ,                   -- Timestamp when marked as filed
  notification_sent_7d BOOLEAN DEFAULT FALSE,   -- Sent 7-day advance notification
  notification_sent_3d BOOLEAN DEFAULT FALSE,   -- Sent 3-day advance notification
  notification_sent_1d BOOLEAN DEFAULT FALSE,   -- Sent 1-day advance notification
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- --- Indexes: Optimize deadline lookups by user and date ---
-- Primary query: get upcoming deadlines for a user, ordered by due_date
CREATE INDEX idx_bir_deadlines_user_date
  ON bir_deadlines(user_id, due_date)
  WHERE deleted_at IS NULL;

-- Secondary query: check if specific deadline exists for user
CREATE INDEX idx_bir_deadlines_user_form_date
  ON bir_deadlines(user_id, form_type, due_date)
  WHERE deleted_at IS NULL;

-- --- RLS Policies: Users can only access their own deadlines ---
ALTER TABLE bir_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own deadlines"
  ON bir_deadlines FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users insert own deadlines"
  ON bir_deadlines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own deadlines"
  ON bir_deadlines FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- --- Triggers: Auto-update updated_at timestamp on every UPDATE ---
-- Assumes update_updated_at() function exists from initial schema migration
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON bir_deadlines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
