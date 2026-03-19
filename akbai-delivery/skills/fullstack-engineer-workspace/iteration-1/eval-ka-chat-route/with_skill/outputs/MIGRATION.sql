-- Migration: ka_conversations table for KA chat history
-- Purpose: Store all KA messages (user + assistant) with metadata
-- Build: Build 5 (KA Chat integration)
-- Date: March 2026

-- Create ka_conversations table
CREATE TABLE IF NOT EXISTS ka_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  domain TEXT DEFAULT 'financial' CHECK (domain IN ('financial', 'tax', 'communication', 'general')),
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  model TEXT,
  cost_centavos INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for query performance
-- Fast retrieval of recent messages for a user (primary query pattern)
CREATE INDEX IF NOT EXISTS idx_ka_conversations_user_created
  ON ka_conversations(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Fast retrieval by domain (for domain-specific context)
CREATE INDEX IF NOT EXISTS idx_ka_conversations_user_domain
  ON ka_conversations(user_id, domain, created_at DESC)
  WHERE deleted_at IS NULL;

-- Fast lookup by message ID (for deletion)
CREATE INDEX IF NOT EXISTS idx_ka_conversations_user_id
  ON ka_conversations(user_id, id)
  WHERE deleted_at IS NULL;

-- RLS: Row-level security
ALTER TABLE ka_conversations ENABLE ROW LEVEL SECURITY;

-- Users can read their own conversation messages (exclude soft-deleted)
CREATE POLICY "Users read own conversations"
  ON ka_conversations FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Users can insert their own messages
CREATE POLICY "Users insert own conversations"
  ON ka_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own messages (for soft-delete)
CREATE POLICY "Users update own conversations"
  ON ka_conversations FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at on every UPDATE
-- (Assumes update_updated_at() trigger exists; if not, create it)
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON ka_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Comments for documentation
COMMENT ON TABLE ka_conversations IS 'KA chat message history. Stores both user and assistant messages with metadata (tokens, cost, model). Soft-deleted (deleted_at). Domain-tagged for analytics and Phase 4+ expansion.';
COMMENT ON COLUMN ka_conversations.role IS 'Message sender: "user" or "assistant"';
COMMENT ON COLUMN ka_conversations.domain IS 'Message scope: financial, tax, communication, general. Allows Phase 4+ expansion (marketing, strategy, hr, inventory).';
COMMENT ON COLUMN ka_conversations.tokens_input IS 'Input tokens used by Claude API (null for user messages)';
COMMENT ON COLUMN ka_conversations.tokens_output IS 'Output tokens used by Claude API (null for user messages)';
COMMENT ON COLUMN ka_conversations.model IS 'Claude model used (e.g., claude-haiku-4-5, claude-sonnet-4-6) — null for user messages';
COMMENT ON COLUMN ka_conversations.cost_centavos IS 'Cost of this message in Philippine centavos (null/0 for user messages, tracked for assistant messages)';
