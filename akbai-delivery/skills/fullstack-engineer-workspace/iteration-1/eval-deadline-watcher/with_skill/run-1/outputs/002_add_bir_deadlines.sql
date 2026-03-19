-- Migration: 002_add_bir_deadlines.sql
-- Purpose: Create BIR deadline tracking table with RLS
-- Build: Build 6 (BIR Deadline Watcher)

-- Create table
CREATE TABLE IF NOT EXISTS bir_deadlines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL,           -- '1701Q', '2550M', '2551Q', etc.
  due_date DATE NOT NULL,
  filed BOOLEAN DEFAULT FALSE,
  filed_at TIMESTAMPTZ,
  notification_sent_7d BOOLEAN DEFAULT FALSE,
  notification_sent_3d BOOLEAN DEFAULT FALSE,
  notification_sent_1d BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for fast lookups on user_id and due_date
CREATE INDEX IF NOT EXISTS idx_bir_deadlines_user_date
  ON bir_deadlines(user_id, due_date)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bir_deadlines_user_filed
  ON bir_deadlines(user_id, filed)
  WHERE deleted_at IS NULL;

-- Enable Row Level Security
ALTER TABLE bir_deadlines ENABLE ROW LEVEL SECURITY;

-- Policy: Users read their own deadlines (non-deleted)
CREATE POLICY "Users read own bir deadlines"
  ON bir_deadlines FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Policy: Users insert their own deadlines
CREATE POLICY "Users insert own bir deadlines"
  ON bir_deadlines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users update their own deadlines (non-deleted)
CREATE POLICY "Users update own bir deadlines"
  ON bir_deadlines FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at on every UPDATE (requires update_updated_at function to exist)
CREATE TRIGGER IF NOT EXISTS set_updated_at_bir_deadlines
  BEFORE UPDATE ON bir_deadlines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
