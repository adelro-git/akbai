-- ============================================================
-- Migration 016: Invoices + Line Items
-- Feature: Invoice Cards (Build 8)
-- Purpose: Maria creates invoices for catering/bulk orders.
--          Tracks status lifecycle: draft -> sent -> viewed -> paid -> overdue -> cancelled.
--          All amounts stored as INTEGER centavos (non-negotiable).
--          Supersedes the original invoices schema in supabase-schema.md section 6
--          (which was never migrated).
-- ============================================================
-- Rollback:
--   DROP TABLE IF EXISTS public.invoice_items;
--   DROP TABLE IF EXISTS public.invoices;

-- ============================================================
-- Table: invoices — invoice header
-- ============================================================

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Invoice identity
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,

  -- Client info (PII)
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT,

  -- Totals (denormalized from line items)
  subtotal_centavos INTEGER NOT NULL DEFAULT 0,
  discount_centavos INTEGER NOT NULL DEFAULT 0,
  tax_rate_pct NUMERIC(5,2) DEFAULT 0,
  tax_amount_centavos INTEGER NOT NULL DEFAULT 0,
  total_centavos INTEGER NOT NULL DEFAULT 0,

  -- Status lifecycle: draft -> sent -> viewed -> paid -> overdue -> cancelled
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')),
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  -- Payment link (when paid)
  payment_transaction_id UUID,

  -- PDF export
  pdf_storage_path TEXT,

  -- Notes
  notes TEXT,
  internal_notes TEXT,

  -- Standard columns
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS: auth.uid() = user_id (NON-NEGOTIABLE)
-- ============================================================

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_select_own" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "invoices_insert_own" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "invoices_update_own" ON public.invoices
  FOR UPDATE USING (auth.uid() = user_id);

-- No DELETE policy — soft-delete only

-- ============================================================
-- Updated_at auto-trigger
-- ============================================================

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Indexes
-- ============================================================

-- User lookup (active records)
CREATE INDEX idx_invoices_user_id
  ON public.invoices(user_id)
  WHERE deleted_at IS NULL;

-- Status filter (e.g., "show me all unpaid invoices")
CREATE INDEX idx_invoices_user_status
  ON public.invoices(user_id, status)
  WHERE deleted_at IS NULL;

-- Date-sorted list
CREATE INDEX idx_invoices_user_date
  ON public.invoices(user_id, invoice_date DESC)
  WHERE deleted_at IS NULL;

-- Unique invoice number per user (Phase 1: per-user, Phase 2: per-business)
CREATE UNIQUE INDEX idx_invoices_user_number
  ON public.invoices(user_id, invoice_number)
  WHERE deleted_at IS NULL;

-- Overdue invoice detection (cron job query)
CREATE INDEX idx_invoices_overdue
  ON public.invoices(due_date, status)
  WHERE deleted_at IS NULL AND status = 'sent';

-- ============================================================
-- Table: invoice_items — line items within an invoice
-- ============================================================

CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,

  -- Item details
  description TEXT NOT NULL,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'piece',
  unit_price_centavos INTEGER NOT NULL,
  total_centavos INTEGER NOT NULL,

  -- Optional: link to costing card (for margin visibility on invoices)
  costing_card_id UUID REFERENCES public.costing_cards(id),

  -- Ordering
  sort_order INTEGER DEFAULT 0,

  -- Standard columns
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS: auth.uid() = user_id (NON-NEGOTIABLE)
-- ============================================================

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice_items_select_own" ON public.invoice_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "invoice_items_insert_own" ON public.invoice_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "invoice_items_update_own" ON public.invoice_items
  FOR UPDATE USING (auth.uid() = user_id);

-- No DELETE policy — soft-delete only

-- ============================================================
-- Updated_at auto-trigger
-- ============================================================

CREATE TRIGGER invoice_items_updated_at
  BEFORE UPDATE ON public.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_invoice_items_invoice_id
  ON public.invoice_items(invoice_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_invoice_items_user_id
  ON public.invoice_items(user_id)
  WHERE deleted_at IS NULL;
