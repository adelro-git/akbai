-- ============================================================
-- Migration 014: Receipt dedup hash column on transactions
-- Feature: Receipt Deduplication (Gap C1 — Sprint 12)
-- Purpose: Add receipt_hash column to detect duplicate receipt scans.
--          Hash is computed from amount + date + merchant_name.
--          Combined with a ±30 min time window check at application layer.
-- ============================================================
-- Rollback:
--   DROP INDEX IF EXISTS idx_transactions_receipt_hash;
--   ALTER TABLE public.transactions DROP COLUMN IF EXISTS receipt_hash;
--   ALTER TABLE public.transactions DROP COLUMN IF EXISTS merchant_name;

-- --- receipt_hash: deterministic hash of amount + date + merchant ---
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS receipt_hash TEXT;

-- --- merchant_name: store merchant name for dedup display and reference ---
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS merchant_name TEXT;

-- --- Index: fast duplicate lookup by user + hash (active records only) ---
CREATE INDEX IF NOT EXISTS idx_transactions_receipt_hash
  ON public.transactions (user_id, receipt_hash)
  WHERE receipt_hash IS NOT NULL AND deleted_at IS NULL;
