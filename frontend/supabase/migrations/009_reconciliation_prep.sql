-- ============================================================
-- Migration 009: Reconciliation schema prep (stretch — Sprint 7)
-- Feature: Future receipt-to-transaction matching for Build 5+
-- Purpose: Add reconciliation_status to transactions so scanned receipts
--          can be matched against manual entries or check-in data.
--          This is prep work — no UI surfaces this yet.
-- ============================================================
-- Rollback:
--   ALTER TABLE public.transactions DROP COLUMN IF EXISTS reconciliation_status;
--   ALTER TABLE public.transactions DROP COLUMN IF EXISTS reconciled_with_id;

-- Reconciliation status: tracks whether a transaction has been matched
ALTER TABLE public.transactions
  ADD COLUMN reconciliation_status TEXT NOT NULL DEFAULT 'unmatched'
    CHECK (reconciliation_status IN ('unmatched', 'matched', 'disputed')),
  ADD COLUMN reconciled_with_id UUID REFERENCES public.transactions(id);

-- Index for finding unmatched transactions
CREATE INDEX idx_transactions_reconciliation
  ON public.transactions (user_id, reconciliation_status)
  WHERE deleted_at IS NULL AND reconciliation_status != 'matched';
