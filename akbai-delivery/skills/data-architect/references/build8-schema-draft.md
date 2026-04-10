# Build 8 Schema Design — Costing Cards + Invoice Cards + Payments
> DRAFT — For Anton's review before migration creation.
> Author: Data Architect | Date: 2026-04-10
> Status: AWAITING REVIEW

---

## Design Decisions

### Money Convention
All monetary columns use **INTEGER in centavos** (consistent with Sprint 7 `transactions` table and CLAUDE.md rule). Display conversion at UI layer only.

Note: The original schema reference sections 4-6 (receipts, transactions, invoices) used `NUMERIC(12,2)`. The shipped Sprint 7 transactions table corrected this to INTEGER centavos. Build 8 follows the centavos convention. The pre-existing `invoices` schema in supabase-schema.md section 6 was never migrated — this draft supersedes it entirely.

### Invoice Line Items: Separate Table vs JSONB
The original schema used JSONB for invoice items. This draft uses a separate `invoice_items` table because:
- Line items need to be queryable (e.g., "what are my most common invoice items?")
- Easier to validate individual line items with CHECK constraints
- Better type safety in TypeScript (typed rows vs JSONB parsing)
- Negligible complexity cost — Maria creates 2-10 invoices/month with 1-5 items each

### Costing Card Line Items: Separate Table
Same reasoning. A costing card has 3-15 ingredient/cost lines. Separate table allows aggregation queries and Kai insights ("Ang pinakamalaki mong gastos sa Chocolate Cake ay flour — 35% ng total cost").

### Payments Table Design
The `payments` table resolves Gap D2 (Xendit webhook idempotency - CRITICAL). Key design:
- `xendit_payment_id` with UNIQUE constraint for webhook dedup
- Links to both `invoices` (customer payments) and `subscriptions` (subscription billing)
- Only one of `invoice_id` or `subscription_id` should be set per payment (CHECK constraint)
- Service-role only writes (webhook handler), user SELECT only

### No `business_id` on Build 8 Tables
The shipped `transactions` table (Sprint 7) dropped `business_id` for Phase 1 simplicity (one user = one business). Build 8 follows the same pattern — `user_id` only. When Phase 2 multi-business lands, we add `business_id` via migration + backfill.

---

## Table 1: costing_cards

**Purpose:** Product cost breakdown card. Maria enters her Chocolate Cake recipe costs (ingredients, labor, overhead, packaging) to see her true margin and suggested selling price.
**Persona:** Maria (home baker), Andoy (sari-sari costing)
**Data classification:** Financial (amounts)
**Row volume estimate:** 5-50 cards per user. Low write frequency (created/edited monthly).
**Relationships:** 1:N with `costing_card_items`. Owned by `user_id`.

```sql
-- Migration: 015_costing_cards.sql
-- Rollback:
--   DROP TABLE IF EXISTS public.costing_card_items;
--   DROP TABLE IF EXISTS public.costing_cards;

CREATE TABLE public.costing_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Product identity
  product_name TEXT NOT NULL,             -- e.g., "Chocolate Cake (8-inch)"
  product_category TEXT,                  -- e.g., "cakes", "pastries", "ulam", "drinks"
  description TEXT,                       -- optional notes about this product

  -- Calculated totals (denormalized from line items for fast reads)
  total_cost_centavos INTEGER NOT NULL DEFAULT 0,     -- sum of all line item costs
  overhead_centavos INTEGER NOT NULL DEFAULT 0,        -- flat overhead (rent, utilities, etc.)
  labor_centavos INTEGER NOT NULL DEFAULT 0,           -- labor cost per unit
  packaging_centavos INTEGER NOT NULL DEFAULT 0,       -- packaging cost per unit

  -- Pricing
  selling_price_centavos INTEGER,                      -- user's actual selling price
  suggested_price_centavos INTEGER,                    -- calculated: total_cost * (1 + target_margin)
  target_margin_pct NUMERIC(5,2) DEFAULT 30.00,       -- target margin %, default 30%

  -- Derived (computed on save, stored for fast dashboard reads)
  actual_margin_pct NUMERIC(5,2),                      -- ((selling - total) / selling) * 100
  break_even_qty INTEGER,                              -- units needed to cover monthly fixed costs
  monthly_fixed_costs_centavos INTEGER DEFAULT 0,      -- user-entered monthly fixed costs for break-even calc

  -- Batch info
  yield_quantity INTEGER DEFAULT 1,                    -- how many units does this recipe make?
  yield_unit TEXT DEFAULT 'piece',                     -- "piece", "slice", "serving", "box", "dozen"

  -- Standard columns
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.costing_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "costing_cards_select_own" ON public.costing_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "costing_cards_insert_own" ON public.costing_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "costing_cards_update_own" ON public.costing_cards
  FOR UPDATE USING (auth.uid() = user_id);

-- No DELETE policy — soft-delete only

CREATE TRIGGER costing_cards_updated_at
  BEFORE UPDATE ON public.costing_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX idx_costing_cards_user_id
  ON public.costing_cards(user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_costing_cards_user_category
  ON public.costing_cards(user_id, product_category)
  WHERE deleted_at IS NULL;
```

---

## Table 2: costing_card_items

**Purpose:** Individual cost line items within a costing card. Each row = one ingredient or cost component.
**Data classification:** Financial
**Row volume estimate:** 3-15 items per card. ~50-500 rows per user total.
**Relationships:** N:1 with `costing_cards`. Owned by `user_id` (required for RLS).

```sql
CREATE TABLE public.costing_card_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  costing_card_id UUID NOT NULL REFERENCES public.costing_cards(id) ON DELETE CASCADE,

  -- Item details
  item_name TEXT NOT NULL,                -- e.g., "All-purpose flour", "Cocoa powder"
  item_type TEXT NOT NULL DEFAULT 'ingredient'
    CHECK (item_type IN ('ingredient', 'labor', 'overhead', 'packaging', 'other')),

  -- Cost calculation
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,    -- e.g., 2.5 (cups), 500 (grams)
  unit TEXT DEFAULT 'piece',                     -- "gram", "kg", "cup", "tbsp", "piece", "hour", "lot"
  unit_cost_centavos INTEGER NOT NULL DEFAULT 0, -- cost per unit in centavos
  total_cost_centavos INTEGER NOT NULL DEFAULT 0,-- quantity * unit_cost (stored for fast reads)

  -- Ordering
  sort_order INTEGER DEFAULT 0,

  -- Standard columns
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.costing_card_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "costing_card_items_select_own" ON public.costing_card_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "costing_card_items_insert_own" ON public.costing_card_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "costing_card_items_update_own" ON public.costing_card_items
  FOR UPDATE USING (auth.uid() = user_id);

-- No DELETE policy — soft-delete only

CREATE TRIGGER costing_card_items_updated_at
  BEFORE UPDATE ON public.costing_card_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX idx_costing_card_items_card_id
  ON public.costing_card_items(costing_card_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_costing_card_items_user_id
  ON public.costing_card_items(user_id)
  WHERE deleted_at IS NULL;
```

---

## Table 3: invoices

**Purpose:** Invoice header. Maria creates invoices for catering orders or bulk cake orders. Tracks status from draft through payment.
**Persona:** Maria (catering), Ana (freelance), Jose (wholesale orders)
**Data classification:** Financial + PII (client_name, client_email, client_phone)
**Row volume estimate:** 2-20 invoices/month per user.
**Relationships:** 1:N with `invoice_items`. Optionally linked to `payments` and `transactions`.

NOTE: This supersedes the original invoices schema in supabase-schema.md section 6 (which was never migrated). Key changes: centavos integers, separate line items table, no `business_id`.

```sql
-- Migration: 016_invoices.sql
-- Rollback:
--   DROP TABLE IF EXISTS public.invoice_items;
--   DROP TABLE IF EXISTS public.invoices;

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Invoice identity
  invoice_number TEXT NOT NULL,             -- Sequential per user: "INV-202604-001"
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,                            -- NULL = due on receipt

  -- Client info (PII)
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT,

  -- Totals (denormalized from line items)
  subtotal_centavos INTEGER NOT NULL DEFAULT 0,
  discount_centavos INTEGER NOT NULL DEFAULT 0,      -- flat discount amount
  tax_rate_pct NUMERIC(5,2) DEFAULT 0,               -- e.g., 12.00 for VAT
  tax_amount_centavos INTEGER NOT NULL DEFAULT 0,
  total_centavos INTEGER NOT NULL DEFAULT 0,          -- subtotal - discount + tax

  -- Status lifecycle: draft -> sent -> paid -> overdue -> cancelled
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')),
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  -- Payment link (when paid)
  payment_transaction_id UUID,              -- FK to transactions (income record created on payment)

  -- PDF export
  pdf_storage_path TEXT,                    -- Supabase Storage: invoices/{user_id}/{invoice_id}.pdf

  -- Notes
  notes TEXT,                               -- Printed on invoice footer
  internal_notes TEXT,                      -- Not printed, for Maria's eyes only

  -- Standard columns
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_select_own" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "invoices_insert_own" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "invoices_update_own" ON public.invoices
  FOR UPDATE USING (auth.uid() = user_id);

-- No DELETE policy — soft-delete only

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX idx_invoices_user_id
  ON public.invoices(user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_invoices_user_status
  ON public.invoices(user_id, status)
  WHERE deleted_at IS NULL;

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
```

---

## Table 4: invoice_items

**Purpose:** Line items within an invoice. Each row = one product/service being billed.
**Data classification:** Financial
**Row volume estimate:** 1-10 items per invoice. ~20-200 rows per user total.
**Relationships:** N:1 with `invoices`. Owned by `user_id` (required for RLS).

```sql
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,

  -- Item details
  description TEXT NOT NULL,                -- e.g., "Chocolate Cake (8-inch)", "Web design - homepage"
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'piece',                -- "piece", "hour", "lot", "box", "dozen"
  unit_price_centavos INTEGER NOT NULL,     -- price per unit
  total_centavos INTEGER NOT NULL,          -- quantity * unit_price

  -- Optional: link to costing card (for margin visibility on invoices)
  costing_card_id UUID REFERENCES public.costing_cards(id),

  -- Ordering
  sort_order INTEGER DEFAULT 0,

  -- Standard columns
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice_items_select_own" ON public.invoice_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "invoice_items_insert_own" ON public.invoice_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "invoice_items_update_own" ON public.invoice_items
  FOR UPDATE USING (auth.uid() = user_id);

-- No DELETE policy — soft-delete only

CREATE TRIGGER invoice_items_updated_at
  BEFORE UPDATE ON public.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX idx_invoice_items_invoice_id
  ON public.invoice_items(invoice_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_invoice_items_user_id
  ON public.invoice_items(user_id)
  WHERE deleted_at IS NULL;
```

---

## Table 5: payments

**Purpose:** Payment records for both invoice payments (customer pays Maria) and subscription billing (Maria pays AKBai). Resolves Gap D2 (Xendit webhook idempotency - CRITICAL).
**Data classification:** Financial (amounts, payment references)
**Row volume estimate:** Low — 1-5 payments/month per user.
**Relationships:** Optional FK to `invoices` and `subscriptions`. Links to `transactions` when income is recorded.

```sql
-- Migration: 017_payments.sql
-- Rollback:
--   DROP TABLE IF EXISTS public.payments;

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Payment identity
  payment_type TEXT NOT NULL
    CHECK (payment_type IN ('invoice_payment', 'subscription_payment')),

  -- Xendit integration (D2 idempotency)
  xendit_payment_id TEXT,                  -- Xendit's payment ID — UNIQUE for dedup
  xendit_invoice_id TEXT,                  -- Xendit invoice ID (their billing object, not ours)
  payment_method TEXT,                     -- 'gcash', 'credit_card', 'bank_transfer', 'cash', 'other'

  -- Amount
  amount_centavos INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PHP',

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled')),

  -- Links (at most one should be set)
  invoice_id UUID REFERENCES public.invoices(id),
  subscription_id UUID REFERENCES public.subscriptions(id),
  transaction_id UUID,                     -- FK to transactions (income record, set after success)

  -- Metadata
  paid_at TIMESTAMPTZ,                     -- when payment was confirmed
  failure_reason TEXT,                     -- if status = 'failed'
  notes TEXT,

  -- Standard columns
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can read their own payments
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT and UPDATE via service role only (webhook handler creates/updates payments)
-- No client INSERT or UPDATE policies.
-- Manual/cash payments are recorded via an API route that uses service role.

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Indexes

-- User lookup
CREATE INDEX idx_payments_user_id
  ON public.payments(user_id)
  WHERE deleted_at IS NULL;

-- D2 CRITICAL: Xendit webhook idempotency
-- This is THE mechanism that prevents double-crediting.
-- Webhook handler: INSERT ... ON CONFLICT (xendit_payment_id) DO NOTHING
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
```

**D2 Resolution Pattern:**
```sql
-- Webhook handler pseudocode:
-- 1. Receive Xendit webhook with payment_id
-- 2. INSERT INTO payments (xendit_payment_id, ...) ON CONFLICT (xendit_payment_id) DO NOTHING
-- 3. Check RETURNING — if no rows returned, this is a duplicate. Log and skip.
-- 4. If inserted, process: update invoice status, create transaction, etc.
--
-- The webhook_events table (already exists) provides a second layer:
-- INSERT INTO webhook_events (payment_id, event_type) ON CONFLICT DO NOTHING
-- Both layers must pass for processing to occur.
```

---

## Migration Plan

Three migration files, in FK dependency order:

| # | File | Tables | Depends On |
|---|------|--------|------------|
| 015 | `015_costing_cards.sql` | `costing_cards`, `costing_card_items` | `auth.users` |
| 016 | `016_invoices.sql` | `invoices`, `invoice_items` | `auth.users`, `costing_cards` (optional FK) |
| 017 | `017_payments.sql` | `payments` | `auth.users`, `invoices`, `subscriptions` |

NOTE: The `invoices` table in the original schema reference (section 6) was a plan that was never migrated. Migration 016 is the actual implementation. If by any chance a previous migration already created an `invoices` table, 016 would need to be an ALTER instead.

---

## NPC / Data Classification

| Column | Classification | Notes |
|--------|---------------|-------|
| `invoices.client_name` | PII | Customer name, subject to deletion requests |
| `invoices.client_email` | PII | Customer email |
| `invoices.client_phone` | PII | Customer phone |
| `invoices.client_address` | PII | Customer address |
| All `*_centavos` columns | Financial | Encrypted at rest (Supabase default), RLS-scoped |
| `payments.xendit_payment_id` | Financial | Payment gateway reference |
| `costing_cards.product_name` | Business | Not PII, but business-sensitive |

---

## Open Questions for Anton

1. **Invoice number format:** The draft uses `INV-{YYYYMM}-{seq}` (e.g., `INV-202604-001`). Is this good, or does Maria want something simpler like just `001`? The server generates this — user never types it.

2. **Costing card -> Invoice link:** `invoice_items.costing_card_id` lets Kai show margin on invoices ("Ang margin mo sa Chocolate Cake na ito ay 42%"). Worth the complexity, or defer to Phase 2?

3. **Cash payments on invoices:** When Maria marks an invoice as paid with cash (not Xendit), should this go through the `payments` table (with `payment_method: 'cash'`, no `xendit_payment_id`)? Or just directly update `invoices.status = 'paid'`? The draft assumes payments table for all payment types (cleaner audit trail).

4. **Overdue detection:** Invoices past `due_date` need to move from 'sent' to 'overdue'. This requires a cron job (Supabase pg_cron or Edge Function). Should we design this now or defer?

5. **Money convention migration:** Existing tables (receipts, daily_entries original schema) use `NUMERIC(12,2)`. The shipped transactions table and Build 8 use INTEGER centavos. Do we need a migration to standardize older tables, or leave them as-is and handle at the app layer?

---

## Relationship Diagram Update

```
auth.users
    |
    +-- 1:N -- costing_cards
    |            |
    |            +-- 1:N -- costing_card_items
    |
    +-- 1:N -- invoices
    |            |
    |            +-- 1:N -- invoice_items (optional FK to costing_cards)
    |            |
    |            +-- 1:N -- payments
    |
    +-- 1:1 -- subscriptions
    |            |
    |            +-- 1:N -- payments
    |
    +-- 1:N -- payments (all payment records)
    |
    +-- (existing tables: transactions, receipts, etc.)
```
