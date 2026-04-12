-- ============================================================
-- Migration 017: Payments
-- Feature: Payment Records (Build 8) — Resolves Gap D2 (Xendit webhook idempotency)
-- Purpose: Payment records for both invoice payments (customer pays Maria)
--          and subscription billing (Maria pays AKBai).
--          xendit_payment_id UNIQUE constraint is THE mechanism that prevents
--          double-crediting on webhook retries.
--          All amounts stored as INTEGER centavos (non-negotiable).
-- ============================================================
-- Rollback:
--   DROP TABLE IF EXISTS public.payments;

-- ============================================================
-- Table: payments — all payment records
-- ============================================================

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Payment identity
  payment_type TEXT NOT NULL
    CHECK (payment_type IN ('invoice_payment', 'subscription_payment')),

  -- Xendit integration (D2 idempotency)
  xendit_payment_id TEXT,
  xendit_invoice_id TEXT,
  payment_method TEXT,

  -- Amount
  amount_centavos INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PHP',

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled')),

  -- Links (at most one should be set)
  invoice_id UUID REFERENCES public.invoices(id),
  subscription_id UUID REFERENCES public.subscriptions(id),
  transaction_id UUID,

  -- Metadata
  paid_at TIMESTAMPTZ,
  failure_reason TEXT,
  notes TEXT,

  -- Standard columns
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS: SELECT-only for users. INSERT/UPDATE via service role (webhook handler).
-- ============================================================

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can read their own payments
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- No client INSERT or UPDATE policies.
-- Payments are created/updated by the webhook handler using service role.
-- Manual/cash payments go through an API route that uses service role.

-- ============================================================
-- Updated_at auto-trigger
-- ============================================================

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Indexes
-- ============================================================

-- User lookup (active records)
CREATE INDEX idx_payments_user_id
  ON public.payments(user_id)
  WHERE deleted_at IS NULL;

-- D2 CRITICAL: Xendit webhook idempotency
-- Webhook handler: INSERT ... ON CONFLICT (xendit_payment_id) DO NOTHING
-- If no rows returned, this is a duplicate — log and skip.
CREATE UNIQUE INDEX idx_payments_xendit_id
  ON public.payments(xendit_payment_id)
  WHERE xendit_payment_id IS NOT NULL AND deleted_at IS NULL;

-- Invoice payment lookup
CREATE INDEX idx_payments_invoice_id
  ON public.payments(invoice_id)
  WHERE invoice_id IS NOT NULL AND deleted_at IS NULL;

-- Subscription payment lookup
CREATE INDEX idx_payments_subscription_id
  ON public.payments(subscription_id)
  WHERE subscription_id IS NOT NULL AND deleted_at IS NULL;

-- Recent payments by user
CREATE INDEX idx_payments_user_date
  ON public.payments(user_id, paid_at DESC)
  WHERE deleted_at IS NULL;
