-- ============================================================
-- Migration 008: Transactions table + expense categories
-- Feature: Saan Napunta expenses dashboard (Build 4 — Sprint 7)
-- Purpose: Store individual income/expense transactions with categories.
--          All amounts stored as INTEGER centavos (non-negotiable).
--          Source tracks origin: manual entry, daily check-in, or OCR scan.
--          Categories: 12 MSME-specific categories from business knowledge research.
-- ============================================================
-- Rollback:
--   DROP TRIGGER IF EXISTS transactions_updated_at ON public.transactions;
--   DROP FUNCTION IF EXISTS public.trg_update_updated_at();
--   DROP TABLE IF EXISTS public.transactions;

CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Transaction details
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount INTEGER NOT NULL CHECK (amount > 0),  -- centavos, always positive
  category TEXT NOT NULL DEFAULT 'other',
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Source tracking: where did this transaction come from?
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'check_in', 'ocr', 'import')),
  source_ref_id UUID,  -- nullable FK to daily_check_in.id or future receipt.id

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL  -- soft delete (non-negotiable)
);

-- ============================================================
-- Indexes for common query patterns
-- ============================================================

-- Monthly breakdown: WHERE user_id = ? AND transaction_date BETWEEN ? AND ?
CREATE INDEX idx_transactions_user_date
  ON public.transactions (user_id, transaction_date DESC)
  WHERE deleted_at IS NULL;

-- Category aggregation: GROUP BY category WHERE type = 'expense'
CREATE INDEX idx_transactions_user_type_category
  ON public.transactions (user_id, type, category)
  WHERE deleted_at IS NULL;

-- Source lookup: find transactions from a specific check-in or receipt
CREATE INDEX idx_transactions_source_ref
  ON public.transactions (source_ref_id)
  WHERE source_ref_id IS NOT NULL AND deleted_at IS NULL;

-- ============================================================
-- Updated_at auto-trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_update_updated_at();

-- ============================================================
-- RLS: auth.uid() = user_id (NON-NEGOTIABLE)
-- ============================================================

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_own"
  ON public.transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert_own"
  ON public.transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_update_own"
  ON public.transactions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Note: No DELETE policy — we use soft-delete via UPDATE (set deleted_at)
