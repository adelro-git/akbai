-- ============================================================
-- Migration 015: Costing Cards + Line Items
-- Feature: Product Costing Cards (Build 8)
-- Purpose: Maria enters her recipe costs (ingredients, labor, overhead,
--          packaging) to see true margin and suggested selling price.
--          All amounts stored as INTEGER centavos (non-negotiable).
-- ============================================================
-- Rollback:
--   DROP TABLE IF EXISTS public.costing_card_items;
--   DROP TABLE IF EXISTS public.costing_cards;

-- ============================================================
-- Table: costing_cards — product cost breakdown header
-- ============================================================

CREATE TABLE public.costing_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Product identity
  product_name TEXT NOT NULL,
  product_category TEXT,
  description TEXT,

  -- Calculated totals (denormalized from line items for fast reads)
  total_cost_centavos INTEGER NOT NULL DEFAULT 0,
  overhead_centavos INTEGER NOT NULL DEFAULT 0,
  labor_centavos INTEGER NOT NULL DEFAULT 0,
  packaging_centavos INTEGER NOT NULL DEFAULT 0,

  -- Pricing
  selling_price_centavos INTEGER,
  suggested_price_centavos INTEGER,
  target_margin_pct NUMERIC(5,2) DEFAULT 30.00,

  -- Derived (computed on save, stored for fast dashboard reads)
  actual_margin_pct NUMERIC(5,2),
  break_even_qty INTEGER,
  monthly_fixed_costs_centavos INTEGER DEFAULT 0,

  -- Batch info
  yield_quantity INTEGER DEFAULT 1,
  yield_unit TEXT DEFAULT 'piece',

  -- Standard columns
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS: auth.uid() = user_id (NON-NEGOTIABLE)
-- ============================================================

ALTER TABLE public.costing_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "costing_cards_select_own" ON public.costing_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "costing_cards_insert_own" ON public.costing_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "costing_cards_update_own" ON public.costing_cards
  FOR UPDATE USING (auth.uid() = user_id);

-- No DELETE policy — soft-delete only

-- ============================================================
-- Updated_at auto-trigger
-- ============================================================

CREATE TRIGGER costing_cards_updated_at
  BEFORE UPDATE ON public.costing_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_costing_cards_user_id
  ON public.costing_cards(user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_costing_cards_user_category
  ON public.costing_cards(user_id, product_category)
  WHERE deleted_at IS NULL;

-- ============================================================
-- Table: costing_card_items — individual cost line items
-- ============================================================

CREATE TABLE public.costing_card_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  costing_card_id UUID NOT NULL REFERENCES public.costing_cards(id) ON DELETE CASCADE,

  -- Item details
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'ingredient'
    CHECK (item_type IN ('ingredient', 'labor', 'overhead', 'packaging', 'other')),

  -- Cost calculation
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'piece',
  unit_cost_centavos INTEGER NOT NULL DEFAULT 0,
  total_cost_centavos INTEGER NOT NULL DEFAULT 0,

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

ALTER TABLE public.costing_card_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "costing_card_items_select_own" ON public.costing_card_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "costing_card_items_insert_own" ON public.costing_card_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "costing_card_items_update_own" ON public.costing_card_items
  FOR UPDATE USING (auth.uid() = user_id);

-- No DELETE policy — soft-delete only

-- ============================================================
-- Updated_at auto-trigger
-- ============================================================

CREATE TRIGGER costing_card_items_updated_at
  BEFORE UPDATE ON public.costing_card_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_costing_card_items_card_id
  ON public.costing_card_items(costing_card_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_costing_card_items_user_id
  ON public.costing_card_items(user_id)
  WHERE deleted_at IS NULL;
