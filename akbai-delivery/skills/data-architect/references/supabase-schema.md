# AKBai — Supabase Schema Reference
> Living document. Update this file whenever a table is created, modified, or deprecated.
> Last updated: 2026-04-10 | Source: Tech Stack v1, Roadmap v14, Operations Roadmap v6

---

## Table of Contents

1. [Bootstrap (Shared Functions & Triggers)](#1-bootstrap)
2. [users](#2-users)
3. [businesses](#3-businesses)
4. [receipts](#4-receipts)
5. [transactions](#5-transactions)
6. [invoices](#6-invoices)
7. [bir_deadlines](#7-bir_deadlines)
8. [ka_conversations](#8-ka_conversations)
9. [subscriptions](#9-subscriptions)
10. [daily_entries](#10-daily_entries)
11. [webhook_events](#11-webhook_events)
12. [daily_api_spend](#12-daily_api_spend)
13. [audit_log](#13-audit_log)
14. [redirect_logs](#14-redirect_logs)
15. [business_benchmarks](#15-business_benchmarks)
16. [daily_check_in](#16-daily_check_in)
17. [flag_as_wrong_reports](#17-flag_as_wrong_reports)
18. [transactions (Sprint 7 rebuild)](#18-transactions-sprint-7-rebuild)
19. [Migration Log — Sprint 7 (010_reconciliation_prep)](#19-migration-log--sprint-7-010_reconciliation_prep)
20. [Relationship Diagram](#20-relationship-diagram)
21. [Index Strategy Summary](#21-index-strategy-summary)
22. [Timezone Handling (Gap A3)](#22-timezone-handling-gap-a3)
23. [Build 8 (DRAFT)](#23-build-8-draft--awaiting-review)

> **Migration order matters.** Tables are listed in FK dependency order — receipts before transactions (because transactions.receipt_id references receipts.id). Run migrations sequentially by number.

---

## 1. Bootstrap

Shared function used by all tables for `updated_at` auto-management.

```sql
-- Migration: 00000000000000_bootstrap.sql
-- Rollback: DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 2. users

**Purpose:** Extends `auth.users` with AKBai-specific profile data. Created during Kilala Kita onboarding.
**Persona interaction:** All personas. This is the identity table.
**Data classification:** PII (first_name, email, phone) + Preferences (business_type, primary_pain)

```sql
-- Migration: 00000000000001_create_users.sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Note: id IS the user_id here (1:1 with auth.users)

  -- PII
  first_name TEXT,
  email TEXT,
  phone TEXT,

  -- Onboarding (Kilala Kita)
  business_type TEXT,          -- e.g., 'food_seller', 'online_seller', 'freelancer', 'sari_sari'
  income_range TEXT,           -- e.g., 'below_80k', '80k_250k', '250k_500k', 'above_500k'
  primary_pain TEXT,           -- e.g., 'bir_compliance', 'expense_tracking', 'cash_flow', 'customer_comms'
  bir_consent BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,

  -- Profile versioning (triggers re-personalization)
  profile_version INTEGER DEFAULT 1,

  -- Feature flags (Build 0 requirement)
  feature_flags JSONB DEFAULT '{}'::jsonb,

  -- Settings
  timezone TEXT DEFAULT 'Asia/Manila',
  preferred_language TEXT DEFAULT 'tl-en',  -- conversational Filipino

  -- Standard columns
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only access their own profile
CREATE POLICY "select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX idx_users_business_type ON public.users(business_type) WHERE deleted_at IS NULL;
```

**Notes:**
- `id` references `auth.users(id)` directly (1:1 relationship) — no separate `user_id` column needed.
- RLS uses `auth.uid() = id` instead of the standard `user_id` pattern.
- `feature_flags` is JSONB for flexibility. Phase 1 keys: `{ "resibo_scanner": true, "morning_briefing": true }`.
- `profile_version` increments on significant profile changes (see tech-stack.md).

---

## 3. businesses

**Purpose:** Business entity details. A user may have one business (Phase 1) or multiple (future).
**Persona interaction:** All — each persona has one business. Maria's bakery, Jose's Shopee store, etc.
**Data classification:** PII (business_name, bir_tin) + Business (registration details)

```sql
-- Migration: 00000000000002_create_businesses.sql
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Business identity
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,       -- mirrors users.business_type but per-business
  registration_type TEXT,            -- 'dti_sole_prop', 'sec_partnership', 'sec_corporation'

  -- BIR info
  bir_tin TEXT,                      -- PII: Tax Identification Number
  bir_registration_date DATE,
  bir_tax_type TEXT,                 -- '8_percent_flat', 'graduated', 'vat_registered'
  vat_registered BOOLEAN DEFAULT false,

  -- Contact / location
  address TEXT,
  city TEXT,
  province TEXT,

  -- Standard columns
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON public.businesses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON public.businesses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own" ON public.businesses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX idx_businesses_user_id ON public.businesses(user_id) WHERE deleted_at IS NULL;
```

**Notes:**
- Phase 1: one user = one business. But the schema supports multiple businesses per user for future flexibility.
- `bir_tin` is PII — must be encrypted at rest (Supabase default) and never exposed in analytics.
- `bir_tax_type` determines which BIR deadlines apply (see `bir_deadlines` table).

---

## 4. receipts

**Purpose:** Scanned receipt metadata. The actual image is in Supabase Storage; this table stores the structured extraction result.
**Persona interaction:** Maria (bakery receipts), Jose (supplier receipts), Andoy (daily supplier buys)
**Data classification:** Financial (amounts) + PII-adjacent (merchant names from receipts)

> **FK dependency:** This table must be created before `transactions` (which references `receipts.id`).

```sql
-- Migration: 00000000000003_create_receipts.sql
CREATE TABLE public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id),

  -- Storage reference
  storage_path TEXT NOT NULL,          -- Supabase Storage path: receipts/{user_id}/{filename}
  original_filename TEXT,

  -- OCR extraction (from Claude Haiku Vision)
  merchant TEXT,
  receipt_date DATE,
  items JSONB,                         -- [{name, quantity, unit_price, total}]
  subtotal NUMERIC(12,2),
  tax_amount NUMERIC(12,2),
  total_amount NUMERIC(12,2),
  extracted_category TEXT,             -- AI-suggested category

  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'flagged')),
  ocr_confidence NUMERIC(3,2),        -- 0.00 to 1.00
  flagged_reason TEXT,                 -- 'duplicate', 'low_confidence', 'user_flagged'

  -- Deduplication
  dedup_hash TEXT,                     -- SHA-256 of (total_amount + receipt_date + merchant)

  -- Standard columns
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON public.receipts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON public.receipts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own" ON public.receipts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX idx_receipts_user_id ON public.receipts(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_receipts_user_date
  ON public.receipts(user_id, receipt_date DESC)
  WHERE deleted_at IS NULL;

-- Deduplication lookup
CREATE INDEX idx_receipts_dedup_hash
  ON public.receipts(user_id, dedup_hash)
  WHERE deleted_at IS NULL AND dedup_hash IS NOT NULL;
```

**Notes:**
- `dedup_hash` is computed server-side before insert. If a match is found within +-30 minutes of `created_at`, flag as potential duplicate (gap C1 in registry).
- `items` is JSONB because receipt line items vary wildly — forcing a separate table for line items adds complexity with minimal benefit at this scale.
- `storage_path` follows the pattern `receipts/{user_id}/{uuid}.{ext}`. Supabase Storage bucket `receipts` has RLS matching user_id prefix.

---

## 5. transactions

**Purpose:** All income and expense records. Fed by receipt scanning, manual entry, daily check-ins, and future GCash integration.
**Persona interaction:** All. This is the core financial data table — powers Dashboard, Saan Napunta, Morning Briefing.
**Data classification:** Financial

```sql
-- Migration: 00000000000004_create_transactions.sql
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id),

  -- Transaction data
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12,2) NOT NULL,      -- Philippine Peso, max ₱9,999,999,999.99
  currency TEXT DEFAULT 'PHP',
  category TEXT DEFAULT 'uncategorized',
  description TEXT,
  merchant TEXT,                        -- For expense transactions (from receipt or manual)

  -- Source tracking
  source TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'receipt_scan', 'daily_checkin', 'gcash_import'
  receipt_id UUID REFERENCES public.receipts(id),

  -- Date of transaction (may differ from created_at)
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Standard columns
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id) WHERE deleted_at IS NULL;

-- Dashboard + Saan Napunta: user's transactions by date
CREATE INDEX idx_transactions_user_date
  ON public.transactions(user_id, transaction_date DESC)
  WHERE deleted_at IS NULL;

-- Category breakdown for Saan Napunta
CREATE INDEX idx_transactions_user_category
  ON public.transactions(user_id, category, transaction_date DESC)
  WHERE deleted_at IS NULL;

-- Monthly aggregation (Morning Briefing, reports)
CREATE INDEX idx_transactions_user_type_date
  ON public.transactions(user_id, type, transaction_date DESC)
  WHERE deleted_at IS NULL;
```

**Notes:**
- `amount` is always positive. `type` ('income' or 'expense') determines the sign in calculations.
- `transaction_date` is separate from `created_at` — a user might scan a receipt from last week today.
- `receipt_id` is nullable — manual entries and daily check-ins don't have receipts.
- Categories are extensible text values. Phase 1 set: 'food_ingredients', 'packaging', 'utilities', 'rent', 'transportation', 'supplies', 'sales', 'gcash_payment', 'cash_payment', 'uncategorized'.

---

## 6. invoices

**Purpose:** Invoice creation, tracking, and payment status. Linked to transactions when payment is received.
**Persona interaction:** Ana (freelance invoices), Maria (catering orders), Jose (wholesale)
**Data classification:** Financial + PII (client_name, client_email)

```sql
-- Migration: 00000000000005_create_invoices.sql
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id),

  -- Invoice identity
  invoice_number TEXT NOT NULL,        -- User-visible sequential number (per business)
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,

  -- Client info (PII)
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT,

  -- Line items
  items JSONB NOT NULL,                -- [{description, quantity, unit_price, total}]
  subtotal NUMERIC(12,2) NOT NULL,
  tax_rate NUMERIC(5,2) DEFAULT 0,     -- e.g., 12.00 for VAT
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')),
  paid_at TIMESTAMPTZ,
  payment_transaction_id UUID REFERENCES public.transactions(id),

  -- PDF export
  pdf_storage_path TEXT,               -- Supabase Storage path for generated PDF

  -- Notes
  notes TEXT,                          -- User-facing notes on invoice

  -- Standard columns
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own" ON public.invoices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_user_status
  ON public.invoices(user_id, status)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_user_date
  ON public.invoices(user_id, invoice_date DESC)
  WHERE deleted_at IS NULL;

-- Unique invoice number per business
CREATE UNIQUE INDEX idx_invoices_business_number
  ON public.invoices(business_id, invoice_number)
  WHERE deleted_at IS NULL;
```

**Notes:**
- `invoice_number` is sequential per business, not globally. Format: `INV-{YYYYMM}-{seq}`. Generated server-side.
- This is NOT an Official Receipt (OR). BIR-registered OR generation requires legal sign-off (gap D3).
- `client_name` and `client_email` are PII — classify accordingly in NPC records.

---

## 7. bir_deadlines

**Purpose:** BIR filing schedule generated per user/business type. Powers Deadline Watcher notifications.
**Persona interaction:** All — BIR compliance is the #1 anxiety driver.
**Data classification:** Business (non-PII, derived from business type)

```sql
-- Migration: 00000000000006_create_bir_deadlines.sql
CREATE TABLE public.bir_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id),

  -- Deadline details
  form_type TEXT NOT NULL,             -- e.g., '1701Q', '2550M', '2550Q', '1701A', '0619E'
  form_description TEXT,               -- Human-readable: "Quarterly Income Tax Return"
  deadline_date DATE NOT NULL,
  filing_period TEXT,                  -- e.g., 'Q1 2026', 'January 2026', 'Annual 2025'

  -- Status
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'notified', 'filed', 'overdue', 'not_applicable')),
  filed_at TIMESTAMPTZ,
  filed_notes TEXT,                    -- User's notes about filing

  -- Notification tracking
  notified_7day BOOLEAN DEFAULT false,
  notified_3day BOOLEAN DEFAULT false,
  notified_1day BOOLEAN DEFAULT false,

  -- Standard columns
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bir_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON public.bir_deadlines
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON public.bir_deadlines
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own" ON public.bir_deadlines
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.bir_deadlines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX idx_bir_deadlines_user_id ON public.bir_deadlines(user_id) WHERE deleted_at IS NULL;

-- Upcoming deadlines query (Deadline Watcher, Morning Briefing)
CREATE INDEX idx_bir_deadlines_user_upcoming
  ON public.bir_deadlines(user_id, deadline_date ASC)
  WHERE deleted_at IS NULL AND status IN ('upcoming', 'notified');
```

**Notes:**
- Deadlines are pre-generated based on `businesses.bir_tax_type` after onboarding. A background job or Edge Function generates the next 12 months of deadlines.
- `notified_*` booleans track the 7/3/1-day notification sequence. Only Pro/Business tier gets the full sequence; Free tier gets 1 reminder per filing.
- All deadline dates must be in Asia/Manila timezone context (gap A3). Store as DATE (no time component), compute notification triggers in PHT.

---

## 8. ka_conversations

**Purpose:** KA chat history. Every message exchanged between the user and KA.
**Persona interaction:** All — this is the primary interaction surface.
**Data classification:** Mixed — message content may contain PII or financial data depending on what the user says.

```sql
-- Migration: 00000000000007_create_ka_conversations.sql
CREATE TABLE public.ka_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- Domain tagging (for domain-expandable architecture, Build 0)
  domain TEXT NOT NULL DEFAULT 'financial',  -- 'financial', 'tax', 'communication', 'operations'

  -- Metadata
  model_used TEXT,                     -- 'claude-haiku-4-5', 'claude-sonnet-4-6'
  input_tokens INTEGER,
  output_tokens INTEGER,
  response_time_ms INTEGER,

  -- Conversation threading
  conversation_session_id UUID,        -- Groups messages into a single conversation session

  -- Flag as Wrong (hard pre-launch gate)
  flagged BOOLEAN DEFAULT false,
  flagged_at TIMESTAMPTZ,
  flagged_reason TEXT,

  -- Standard columns
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ka_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON public.ka_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON public.ka_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own" ON public.ka_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.ka_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX idx_ka_conversations_user_id ON public.ka_conversations(user_id) WHERE deleted_at IS NULL;

-- Conversation history (loading recent messages for context window)
CREATE INDEX idx_ka_conversations_user_session
  ON public.ka_conversations(user_id, conversation_session_id, created_at ASC)
  WHERE deleted_at IS NULL;

-- Domain analytics
CREATE INDEX idx_ka_conversations_domain
  ON public.ka_conversations(domain, created_at DESC)
  WHERE deleted_at IS NULL;

-- Flagged messages queue (admin review)
CREATE INDEX idx_ka_conversations_flagged
  ON public.ka_conversations(flagged, created_at DESC)
  WHERE flagged = true AND deleted_at IS NULL;
```

**Notes:**
- `domain` column enables the domain-expandable architecture from Build 0. Phase 1 domains: 'financial', 'tax', 'communication', 'operations'. Phase 4+ adds 'marketing', 'strategy', 'hr', 'inventory'.
- `conversation_session_id` groups messages into a session. A new session starts when the user hasn't interacted for >30 minutes or explicitly starts a new conversation.
- Token and timing metadata (`input_tokens`, `output_tokens`, `response_time_ms`) feeds into the circuit breaker and cost monitoring.
- The `flagged` system is a hard pre-launch gate — every AI output card in the UI must have a "Flag as Wrong" action.

---

## 9. subscriptions

**Purpose:** Xendit subscription state. Determines user tier and feature access.
**Persona interaction:** All paying users.
**Data classification:** Financial (payment references) + Business

```sql
-- Migration: 00000000000008_create_subscriptions.sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tier
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'business', 'scale')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'expired', 'trialing')),

  -- Xendit references
  xendit_subscription_id TEXT,
  xendit_customer_id TEXT,
  payment_method TEXT,                 -- 'gcash', 'credit_card', 'debit_card', 'otc', 'concierge_gcash'

  -- Billing cycle
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  -- Grace period (gap C2)
  grace_period_end TIMESTAMPTZ,        -- Set when payment fails. 3 days from failure.
  grace_notifications_sent INTEGER DEFAULT 0,

  -- Usage tracking
  scans_used_this_period INTEGER DEFAULT 0,
  scan_limit INTEGER DEFAULT 0,        -- 0 = free (no scans), 50 = pro, 80 = business

  -- Standard columns
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY "select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Insert only via service role (webhook handler) — no client insert policy
-- Update only via service role (webhook handler) — no client update policy

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_subscriptions_xendit_id
  ON public.subscriptions(xendit_subscription_id)
  WHERE xendit_subscription_id IS NOT NULL AND deleted_at IS NULL;
```

**Notes:**
- No client INSERT or UPDATE policies. Subscription state is managed exclusively by the Xendit webhook handler (Edge Function) using the service role key. This prevents users from self-upgrading.
- `payment_method: 'concierge_gcash'` is the manual fallback for the first 20-50 users if Xendit KYC is pending.
- `scans_used_this_period` resets when `current_period_start` advances. The scan count enforcement happens in the Resibo Scanner API route.

---

## 10. daily_entries

**Purpose:** Daily check-in records from the 8PM evening modal. Quick capture of daily sales and expenses.
**Persona interaction:** All — the 60-second daily habit.
**Data classification:** Financial

```sql
-- Migration: 00000000000009_create_daily_entries.sql
CREATE TABLE public.daily_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id),

  -- Entry data
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_sales NUMERIC(12,2) DEFAULT 0,
  total_expenses NUMERIC(12,2) DEFAULT 0,
  notes TEXT,

  -- Reconciliation status
  reconciled BOOLEAN DEFAULT false,    -- Marked true during weekly reconciliation

  -- Standard columns
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON public.daily_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON public.daily_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own" ON public.daily_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.daily_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX idx_daily_entries_user_id ON public.daily_entries(user_id) WHERE deleted_at IS NULL;

-- One entry per day per business
CREATE UNIQUE INDEX idx_daily_entries_unique_day
  ON public.daily_entries(user_id, business_id, entry_date)
  WHERE deleted_at IS NULL;

-- Weekly reconciliation query
CREATE INDEX idx_daily_entries_user_date
  ON public.daily_entries(user_id, entry_date DESC)
  WHERE deleted_at IS NULL;
```

**Notes:**
- `entry_date` enforces one entry per business per day (unique index).
- Daily entries also create corresponding `transactions` rows (one income, one expense) when submitted.
- The weekly reconciliation flow (Friday 9AM) queries for missing days: `WHERE entry_date BETWEEN (now() - interval '7 days') AND now()`.

---

## 11. webhook_events

**Purpose:** Idempotency table for Xendit webhooks. Prevents double-processing of payment events (gap D2).
**Data classification:** Business (payment references, no PII)

```sql
-- Migration: 00000000000010_create_webhook_events.sql
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event identity
  payment_id TEXT NOT NULL,
  event_type TEXT NOT NULL,            -- 'payment.success', 'payment.failed', 'subscription.cancelled'
  source TEXT NOT NULL DEFAULT 'xendit',

  -- Payload (for debugging)
  payload JSONB,

  -- Processing
  processed_at TIMESTAMPTZ DEFAULT now(),
  processing_result TEXT,              -- 'success', 'error', 'skipped_duplicate'

  -- Standard columns (no user_id — this is a system table)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Accessed only by Edge Function via service role.
-- Enable RLS with explicit deny-all policies for defense in depth.
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_all_select" ON public.webhook_events FOR SELECT USING (false);
CREATE POLICY "deny_all_insert" ON public.webhook_events FOR INSERT WITH CHECK (false);
CREATE POLICY "deny_all_update" ON public.webhook_events FOR UPDATE USING (false);
CREATE POLICY "deny_all_delete" ON public.webhook_events FOR DELETE USING (false);

-- Idempotency: one event type per payment
CREATE UNIQUE INDEX idx_webhook_events_idempotency
  ON public.webhook_events(payment_id, event_type);
```

**Notes:**
- No `user_id`, `updated_at`, `deleted_at` — this is a system/audit table, not user-facing.
- The UNIQUE index on `(payment_id, event_type)` is the idempotency mechanism. Insert with `ON CONFLICT DO NOTHING`.
- RLS is enabled with no policies (deny-all for anon key). Only service role can read/write.

---

## 12. daily_api_spend

**Purpose:** Tracks Claude API spend per day for circuit breaker enforcement.
**Data classification:** Analytics (no PII)

```sql
-- Migration: 00000000000011_create_daily_api_spend.sql
CREATE TABLE public.daily_api_spend (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Spend tracking
  spend_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_input_tokens BIGINT DEFAULT 0,
  total_output_tokens BIGINT DEFAULT 0,
  total_cost_usd NUMERIC(10,6) DEFAULT 0,
  total_calls INTEGER DEFAULT 0,

  -- Per-model breakdown
  haiku_calls INTEGER DEFAULT 0,
  haiku_cost_usd NUMERIC(10,6) DEFAULT 0,
  sonnet_calls INTEGER DEFAULT 0,
  sonnet_cost_usd NUMERIC(10,6) DEFAULT 0,

  -- Cap
  daily_cap_usd NUMERIC(10,6) DEFAULT 5.00,
  cap_reached_at TIMESTAMPTZ,

  -- Standard columns (system table)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_api_spend ENABLE ROW LEVEL SECURITY;

-- Explicit deny-all for anon key — service role only
CREATE POLICY "deny_all_select" ON public.daily_api_spend FOR SELECT USING (false);
CREATE POLICY "deny_all_insert" ON public.daily_api_spend FOR INSERT WITH CHECK (false);
CREATE POLICY "deny_all_update" ON public.daily_api_spend FOR UPDATE USING (false);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.daily_api_spend
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- One row per day
CREATE UNIQUE INDEX idx_daily_api_spend_date ON public.daily_api_spend(spend_date);
```

**Notes:**
- One row per day. **Upsert is handled in application code** (Next.js API routes, service role):
  ```sql
  INSERT INTO daily_api_spend (spend_date, total_cost_usd, total_calls, haiku_calls, haiku_cost_usd)
  VALUES (CURRENT_DATE, $cost, 1, 1, $cost)
  ON CONFLICT (spend_date) DO UPDATE SET
    total_cost_usd = daily_api_spend.total_cost_usd + EXCLUDED.total_cost_usd,
    total_calls = daily_api_spend.total_calls + 1,
    haiku_calls = daily_api_spend.haiku_calls + EXCLUDED.haiku_calls,
    haiku_cost_usd = daily_api_spend.haiku_cost_usd + EXCLUDED.haiku_cost_usd;
  ```
- Circuit breaker check (called before every Claude API call):
  ```sql
  SELECT total_cost_usd >= daily_cap_usd AS cap_reached
  FROM daily_api_spend WHERE spend_date = CURRENT_DATE;
  ```
- `daily_cap_usd` starts at $5.00. Increase manually as revenue grows. Eventually make this dynamic.

---

## 13. audit_log

**Purpose:** NPC compliance — logs access to PII data. Required by RA 10173.
**Data classification:** Analytics/Compliance

```sql
-- Migration: 00000000000012_create_audit_log.sql
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who
  actor_id UUID REFERENCES auth.users(id),  -- NULL for system actions
  actor_type TEXT NOT NULL DEFAULT 'user',   -- 'user', 'system', 'admin', 'webhook'

  -- What
  action TEXT NOT NULL,                      -- 'read', 'create', 'update', 'delete', 'export', 'login'
  resource_type TEXT NOT NULL,               -- Table name: 'users', 'transactions', etc.
  resource_id UUID,

  -- Context
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,                            -- Additional context (e.g., which fields were accessed)

  -- Standard columns (append-only — no updates or deletes)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Explicit deny-all — audit logs are append-only via service role
CREATE POLICY "deny_all_select" ON public.audit_log FOR SELECT USING (false);
CREATE POLICY "deny_all_insert" ON public.audit_log FOR INSERT WITH CHECK (false);
CREATE POLICY "deny_all_update" ON public.audit_log FOR UPDATE USING (false);
CREATE POLICY "deny_all_delete" ON public.audit_log FOR DELETE USING (false);

-- Indexes for compliance queries
CREATE INDEX idx_audit_log_actor ON public.audit_log(actor_id, created_at DESC);
CREATE INDEX idx_audit_log_resource ON public.audit_log(resource_type, resource_id, created_at DESC);
CREATE INDEX idx_audit_log_action ON public.audit_log(action, created_at DESC);
```

**Notes:**
- Append-only. No `updated_at`, no `deleted_at`. Audit logs are immutable.
- Not every read is logged — that would be prohibitively expensive. Log: PII access, data exports, login events, deletion requests, admin actions.
- `metadata` JSONB captures what specific fields were accessed (for NPC breach impact assessment).
- Retention: audit logs are retained for the lifetime of the application. They are never purged, even when user data is deleted.

---

## 14. redirect_logs

**Purpose:** Tracks out-of-scope KA queries for demand signal analysis (Build 0, domain-expandable architecture).
**Data classification:** Analytics (anonymized)

```sql
-- Migration: 00000000000013_create_redirect_logs.sql
CREATE TABLE public.redirect_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),   -- Nullable for anonymization

  -- Redirect data
  query_text TEXT NOT NULL,                  -- What the user asked
  detected_domain TEXT,                      -- What domain KA thinks this belongs to
  redirect_category TEXT,                    -- 'marketing', 'strategy', 'hr', 'inventory', 'unknown'

  -- Standard columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.redirect_logs ENABLE ROW LEVEL SECURITY;

-- Explicit deny-all — analytics table, service role only
CREATE POLICY "deny_all_select" ON public.redirect_logs FOR SELECT USING (false);
CREATE POLICY "deny_all_insert" ON public.redirect_logs FOR INSERT WITH CHECK (false);

-- Index for demand analysis
CREATE INDEX idx_redirect_logs_category
  ON public.redirect_logs(redirect_category, created_at DESC);
```

**Notes:**
- Powers Phase 4+ domain expansion prioritization. If 60% of redirects are marketing-related, that's the next domain to build.
- `user_id` is nullable — can be anonymized for aggregate analysis.
- Lightweight table — no audit columns or soft-delete needed.

---

## 15. business_benchmarks

**Purpose:** Anonymized, aggregated business intelligence per business type. Computed from real user data (transactions, receipts, daily_entries). KA uses this to give data-backed insights at prompt assembly time.
**Persona interaction:** All — read-only. Data is anonymized aggregates, not individual user data.
**Data classification:** Analytics (anonymized, no PII)

```sql
-- Migration: 004_business_benchmarks.sql
CREATE TABLE public.business_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dimension keys
  business_type TEXT NOT NULL,                -- e.g., 'food_baking', 'service_salon'
  period_type TEXT NOT NULL
    CHECK (period_type IN ('monthly', 'quarterly')),
  period_start DATE NOT NULL,                 -- first day of the period

  -- Sample metadata (for statistical validity + privacy)
  sample_size INTEGER NOT NULL DEFAULT 0,     -- number of businesses contributing
  min_sample_threshold INTEGER NOT NULL DEFAULT 5, -- don't surface to users if below this

  -- Aggregated metrics (JSONB for flexible shapes per business type)
  cost_structure JSONB DEFAULT '{}'::jsonb,   -- category → {pct_of_revenue, median, p25, p75}
  revenue_stats JSONB DEFAULT '{}'::jsonb,    -- {median, p25, p75, income_sources}
  seasonal_patterns JSONB DEFAULT '{}'::jsonb,-- {peak_months, slow_months, revenue_vs_avg}
  common_merchants JSONB DEFAULT '[]'::jsonb, -- top 10 anonymized merchant names by frequency
  common_categories JSONB DEFAULT '[]'::jsonb,-- expense categories ranked by transaction count

  -- Computation tracking
  computation_version INTEGER NOT NULL DEFAULT 1,
  -- 0 = editorial seed from msme-business-knowledge.md
  -- 1+ = computed from real user data

  -- Standard columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL
);

ALTER TABLE public.business_benchmarks ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (anonymized data, no PII)
CREATE POLICY "benchmarks_select_authenticated"
  ON public.business_benchmarks
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can write (aggregation job / seed script)
CREATE POLICY "benchmarks_insert_service"
  ON public.business_benchmarks
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "benchmarks_update_service"
  ON public.business_benchmarks
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.business_benchmarks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- One benchmark row per business_type + period (prevents duplicates)
CREATE UNIQUE INDEX idx_benchmarks_type_period
  ON public.business_benchmarks(business_type, period_type, period_start)
  WHERE deleted_at IS NULL;

-- Fast lookup: latest monthly benchmark for a business type (prompt assembly)
CREATE INDEX idx_benchmarks_latest
  ON public.business_benchmarks(business_type, period_start DESC)
  WHERE deleted_at IS NULL AND period_type = 'monthly';
```

**Notes:**
- JSONB columns because cost structure shapes differ by business type (salon has "supplies" + "rent" + "labor"; freelancer has "software" + "internet"). Avoids rigid columns that don't apply to all types.
- `computation_version: 0` = editorial seed from `msme-business-knowledge.md`. KA says "typically for this business type." `computation_version: 1+` = computed from real user data. KA says "based on similar businesses."
- `min_sample_threshold = 5` prevents surfacing insights based on too few users (privacy + statistical validity).
- Aggregation runs monthly via a Supabase Edge Function (pg_cron, 1st of month, 3am Manila time). Queries `transactions` joined with `business_profiles` using service role.
- Prompt assembly queries: `SELECT * FROM business_benchmarks WHERE business_type = $1 AND period_type = 'monthly' ORDER BY period_start DESC LIMIT 1`.

---

## Migration Log — Sprint 3 (005_onboarding_fields)

**Migration file:** `005_onboarding_fields.sql`
**Sprint:** 3 (2026-03-22)
**Purpose:** Add Kilala Kita onboarding tracking columns to `users` table and CHECK constraints to `business_profiles`.

**Changes to `users` table:**
```sql
ALTER TABLE public.users
  ADD COLUMN primary_pain TEXT,
  ADD COLUMN bir_consent BOOLEAN DEFAULT false,
  ADD COLUMN onboarding_step INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Constraint: primary_pain must be a known value or NULL
ALTER TABLE public.users
  ADD CONSTRAINT users_primary_pain_check
  CHECK (primary_pain IS NULL OR primary_pain IN (
    'receipt_tracking', 'bir_compliance', 'customer_messages', 'knowing_earnings'
  ));

-- Constraint: onboarding_step must be 0-5
ALTER TABLE public.users
  ADD CONSTRAINT users_onboarding_step_check
  CHECK (onboarding_step >= 0 AND onboarding_step <= 5);

-- Index for onboarding status lookups (redirect checks)
CREATE INDEX idx_users_onboarding_step ON public.users (id, onboarding_step)
  WHERE deleted_at IS NULL;
```

**Changes to `business_profiles` table:**
```sql
ALTER TABLE public.business_profiles
  ADD CONSTRAINT business_profiles_type_check
  CHECK (business_type IS NULL OR business_type IN (
    'food_baking', 'online_selling', 'freelance_creative',
    'sari_sari_retail', 'food_carinderia', 'service_salon', 'other'
  ));

ALTER TABLE public.business_profiles
  ADD CONSTRAINT business_profiles_income_range_check
  CHECK (income_range IS NULL OR income_range IN (
    'below_50k', '50k_150k', '150k_500k', 'above_500k'
  ));
```

**Notes:**
- `onboarding_step` tracks resumability: if a user drops off at step 3, they resume at step 3 on return.
- `onboarding_completed` is used by the circuit breaker to exempt onboarding users from the 10-query/day free tier limit (ADR-008).
- `primary_pain` drives KA personalization — determines which feature KA highlights first in Morning Briefing.

---

## 16. daily_check_in

**Purpose:** Stores daily mood check-in and KA's personalized greeting per user per day. Part of the Build 2 Dashboard Shell (Sprint 4, Task 4).
**Persona interaction:** All — the morning greeting surface.
**Data classification:** Preferences (mood) + AI-generated content (kai_greeting)

```sql
-- Migration: 006_daily_check_in.sql + 007_check_in_financials.sql
--          + 012_morning_briefing_cache.sql + 019_morning_briefing_tone.sql
CREATE TABLE public.daily_check_in (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood TEXT,                    -- optional: user's business mood for the day
  kai_greeting TEXT NOT NULL,   -- the personalized greeting KA generated
  sales_amount INTEGER,         -- optional: daily sales in centavos (added Sprint 5, migration 007)
  expenses_amount INTEGER,      -- optional: daily expenses in centavos (added Sprint 5, migration 007)
  briefing_content TEXT NULL,   -- cached morning briefing text (Build 5, migration 012)
  briefing_generated_at TIMESTAMPTZ NULL,  -- cache freshness (migration 012)
  briefing_tagline TEXT NULL,   -- cached one-liner ≤80 chars for Kumustahan hero (Phase 7/8, migration 019)
  briefing_tone TEXT NULL CHECK (briefing_tone IS NULL OR briefing_tone IN ('energetic','observant','celebratory')),  -- tone register, migration 019
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL,  -- soft delete (non-negotiable)
  UNIQUE(user_id, check_in_date)
);

ALTER TABLE public.daily_check_in ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_check_in_select_own"
  ON public.daily_check_in
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "daily_check_in_insert_own"
  ON public.daily_check_in
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_check_in_update_own"
  ON public.daily_check_in
  FOR UPDATE
  USING (auth.uid() = user_id);
```

**Notes:**
- `UNIQUE(user_id, check_in_date)` enforces one check-in per user per day.
- No `updated_at` column — check-ins are essentially immutable once created (mood can be updated via the UPDATE policy, but this is rare).
- No `business_id` FK — check-ins are per-user, not per-business. This simplifies the dashboard where KA greets the user regardless of which business is active.
- `kai_greeting` is generated server-side by Claude (Haiku for cost efficiency) during the morning check-in flow.
- `check_in_date` is a DATE (timezone-agnostic), representing the calendar date in PHT context. See §22 Timezone Handling.
- `briefing_content` + `briefing_generated_at` (migration 012) cache the once-per-day Claude morning briefing for `/api/morning-briefing` (Build 5).
- `briefing_tagline` + `briefing_tone` (migration 019) cache the Phase 7 D6 tonal one-liner served on the home Kumustahan hero. Tone enum (`energetic`|`observant`|`celebratory`) is enforced via CHECK constraint. NULL values are valid — the route falls back to `pickFallback()` deterministic templates when Claude is unavailable (no_credits path).

---

## 17. flag_as_wrong_reports

**Purpose:** Stores user reports when KA gives a wrong or unhelpful answer. Design Gate 2 requirement — users must be able to flag any AI response.
**Persona interaction:** All — available on every KA response card.
**Data classification:** Feedback (message_id references ka_conversations)

```sql
-- Migration: 008_flag_as_wrong.sql
CREATE TABLE IF NOT EXISTS public.flag_as_wrong_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  reason TEXT,
  user_comment TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.flag_as_wrong_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own flags"
  ON public.flag_as_wrong_reports FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can create flags"
  ON public.flag_as_wrong_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX idx_flag_reports_user_status
  ON public.flag_as_wrong_reports(user_id, status)
  WHERE deleted_at IS NULL;
```

**Notes:**
- `message_id` is TEXT (not UUID FK) because it references the client-side message identifier, not necessarily a `ka_conversations.id`.
- `status` tracks review workflow: 'open' → reviewed by Anton manually. No formal admin UI yet.
- No UPDATE policy — once submitted, flags are immutable from the client side. Admin updates via service role.
- Satisfies Design Gate 2 (gap B1): "Flag as Wrong on every AI output."

---

## 18. transactions (Sprint 7 rebuild)

**Purpose:** Rebuilt transactions table for the Saan Napunta expenses dashboard (Build 4). Replaces the original §5 schema with centavos-based amounts and MSME-specific categories.
**Persona interaction:** All. Core financial data — powers Dashboard, Saan Napunta, Morning Briefing.
**Data classification:** Financial

> **Note:** This migration (009) creates a new `transactions` table. The original §5 transactions schema was the planned design; this is the actual shipped implementation. Key differences: `amount` is INTEGER centavos (not NUMERIC), no `business_id`/`currency`/`merchant` columns, `source` values differ, adds `source_ref_id` for cross-table linking.

```sql
-- Migration: 009_transactions.sql
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Transaction details
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount INTEGER NOT NULL CHECK (amount > 0),  -- centavos, always positive
  category TEXT NOT NULL DEFAULT 'other',
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Source tracking
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'check_in', 'ocr', 'import')),
  source_ref_id UUID,  -- nullable FK to daily_check_in.id or future receipt.id

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL  -- soft delete (non-negotiable)
);

-- Indexes
CREATE INDEX idx_transactions_user_date
  ON public.transactions (user_id, transaction_date DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_transactions_user_type_category
  ON public.transactions (user_id, type, category)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_transactions_source_ref
  ON public.transactions (source_ref_id)
  WHERE source_ref_id IS NOT NULL AND deleted_at IS NULL;

-- Updated_at auto-trigger
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

-- RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_own"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert_own"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_update_own"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

-- Note: No DELETE policy — soft-delete via UPDATE (set deleted_at)
```

**Notes:**
- `amount` is INTEGER in centavos (non-negotiable convention). Display conversion at UI layer only.
- `source` values: 'manual' (user entry), 'check_in' (from daily check-in flow), 'ocr' (receipt scan), 'import' (future bulk import).
- `source_ref_id` links back to the originating record (e.g., `daily_check_in.id`). Not a formal FK constraint to allow flexible cross-table linking.
- Uses its own `trg_update_updated_at()` trigger function (separate from the bootstrap `update_updated_at()`).
- Categories: 12 MSME-specific categories from business knowledge research. Default is 'other'.

---

## 19. Migration Log — Sprint 7 (010_reconciliation_prep)

**Migration file:** `010_reconciliation_prep.sql`
**Sprint:** 7 (2026-03-26)
**Purpose:** Add reconciliation columns to `transactions` for future receipt-to-transaction matching (Build 5+ prep). No UI surfaces this yet.

**Changes to `transactions` table:**
```sql
-- Migration: 010_reconciliation_prep.sql
ALTER TABLE public.transactions
  ADD COLUMN reconciliation_status TEXT NOT NULL DEFAULT 'unmatched'
    CHECK (reconciliation_status IN ('unmatched', 'matched', 'disputed')),
  ADD COLUMN reconciled_with_id UUID REFERENCES public.transactions(id);

-- Index for finding unmatched transactions
CREATE INDEX idx_transactions_reconciliation
  ON public.transactions (user_id, reconciliation_status)
  WHERE deleted_at IS NULL AND reconciliation_status != 'matched';
```

**Notes:**
- `reconciliation_status` tracks whether a transaction has been matched against a receipt or another transaction entry.
- `reconciled_with_id` is a self-referencing FK — links two transactions that represent the same real-world event (e.g., manual entry matched with OCR scan).
- This is prep work only. The reconciliation UI and matching logic will be built in Build 5+.

---

## 20. Relationship Diagram

```
auth.users (Supabase Auth)
    |
    ├── 1:1 ── users (profile, onboarding, feature flags)
    |            |
    |            └── 1:N ── businesses
    |                         |
    |                         ├── 1:N ── transactions ←── receipts (1:1 optional)
    |                         |              |
    |                         |              └── invoices.payment_transaction_id (1:1 on payment)
    |                         |
    |                         ├── 1:N ── invoices
    |                         ├── 1:N ── bir_deadlines
    |                         └── 1:N ── daily_entries
    |
    ├── 1:N ── ka_conversations
    ├── 1:1 ── subscriptions
    ├── 1:N ── daily_check_in (one per day)
    ├── 1:N ── flag_as_wrong_reports
    └── 1:N ── audit_log (as actor)

System tables (no user ownership):
    ├── webhook_events
    ├── daily_api_spend
    ├── redirect_logs
    └── business_benchmarks (anonymized aggregates, auth-readable)
```

---

## 21. Index Strategy Summary

| Table | Key Indexes | Purpose |
|-------|------------|---------|
| users | business_type | Filter by persona type |
| businesses | user_id | Standard user lookup |
| transactions | user_id+date, user_id+category, user_id+type+date | Dashboard, Saan Napunta, Morning Briefing |
| receipts | user_id+date, user_id+dedup_hash | Timeline, deduplication |
| invoices | user_id+status, user_id+date, business_id+number (unique) | Status filtering, sequential numbering |
| bir_deadlines | user_id+deadline_date (upcoming only) | Deadline Watcher, Morning Briefing |
| ka_conversations | user_id+session+created_at, domain, flagged | Context loading, analytics, review queue |
| subscriptions | user_id, xendit_subscription_id (unique) | Tier check, webhook lookup |
| daily_entries | user_id+business_id+date (unique), user_id+date | One-per-day enforcement, reconciliation |
| webhook_events | payment_id+event_type (unique) | Idempotency |
| daily_api_spend | spend_date (unique) | Circuit breaker |
| audit_log | actor_id, resource_type+id, action | Compliance queries |
| redirect_logs | category+date | Demand analysis |
| business_benchmarks | type+period_type+period_start (unique), type+period_start DESC | Dedup, prompt assembly lookup |
| daily_check_in | user_id+check_in_date (unique, inline) | One check-in per user per day |
| flag_as_wrong_reports | user_id+status | Review queue by user |
| transactions (rebuilt) | user_id+date, user_id+type+category, source_ref_id, user_id+reconciliation_status | Dashboard, Saan Napunta, source lookup, reconciliation |

All user-facing table indexes include `WHERE deleted_at IS NULL` as a partial index condition to skip soft-deleted rows.

---

## 22. Timezone Handling (Gap A3)

All timestamps in the database are stored as `TIMESTAMPTZ` (UTC). Conversion to Philippine Standard Time (PST/PHT, UTC+8) happens in the application layer only.

**Why this matters:** BIR deadlines, daily check-ins, morning briefings, and notification triggers all operate in PHT. A deadline of "April 15" means April 15 in Manila, not UTC.

**Rules:**
1. **TIMESTAMPTZ columns** store UTC. Never set the Postgres timezone config — keep it UTC.
2. **DATE columns** (like `bir_deadlines.deadline_date`, `transactions.transaction_date`) are timezone-agnostic — they represent calendar dates in the user's local context (PHT). No conversion needed.
3. **Application-layer conversion** for display: `new Date(utc_timestamp).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })`.
4. **Notification triggers** must compare in PHT: "7 days before April 15 PHT" is April 8 00:00 PHT = April 7 16:00 UTC.
5. **Daily cron jobs** (check-in, morning briefing, retention) run at PHT times but are scheduled in UTC on the server. E.g., "8PM PHT check-in" = 12:00 UTC cron.

```sql
-- Example: Find deadlines due in the next 7 days (PHT-aware)
SELECT * FROM bir_deadlines
WHERE deadline_date BETWEEN
  (now() AT TIME ZONE 'Asia/Manila')::date
  AND
  ((now() AT TIME ZONE 'Asia/Manila')::date + interval '7 days')
  AND status IN ('upcoming', 'notified')
  AND deleted_at IS NULL;
```

---

## 23. Build 8 (DRAFT — Awaiting Review)

> Status: Schema design drafted 2026-04-10. Awaiting Anton's review before migration creation.
> Full design: `references/build8-schema-draft.md`

### Planned Tables

| Table | Migration | Purpose | Money Convention |
|-------|-----------|---------|-----------------|
| `costing_cards` | 015 | Product cost breakdown header (margin calculator) | INTEGER centavos |
| `costing_card_items` | 015 | Line items within a costing card (ingredients, labor, overhead) | INTEGER centavos |
| `invoices` | 016 | Invoice header with client info, status lifecycle, PDF export | INTEGER centavos |
| `invoice_items` | 016 | Line items within an invoice (optional FK to costing_cards) | INTEGER centavos |
| `payments` | 017 | Payment records with Xendit idempotency key (resolves Gap D2 CRITICAL) | INTEGER centavos |

### Key Design Decisions
- **Centavos integers** for all money columns (consistent with Sprint 7 transactions)
- **Separate line items tables** instead of JSONB (queryable, type-safe, CHECK constraints)
- **No `business_id`** on new tables (Phase 1 simplicity, add via migration for Phase 2)
- **`payments` table** with `xendit_payment_id` UNIQUE index for webhook dedup (D2 gate)
- **`invoices` supersedes section 6** — the original invoices schema was never migrated
- **`invoice_items.costing_card_id`** optional FK links invoices to costing cards for margin visibility

### RLS Summary
All 5 tables: standard 3-policy pattern (SELECT/INSERT/UPDATE own). `payments` has SELECT-only for clients (INSERT/UPDATE via service role webhook handler).

### Index Summary
| Table | Key Indexes |
|-------|------------|
| costing_cards | user_id, user_id+category |
| costing_card_items | costing_card_id, user_id |
| invoices | user_id, user_id+status, user_id+date, user_id+number (unique), due_date+status (overdue detection) |
| invoice_items | invoice_id, user_id |
| payments | user_id, xendit_payment_id (unique, D2), invoice_id, subscription_id, user_id+paid_at |

### Relationship Additions
```
auth.users
    +-- 1:N -- costing_cards -- 1:N -- costing_card_items
    +-- 1:N -- invoices -- 1:N -- invoice_items (optional FK to costing_cards)
    +-- 1:N -- payments (links to invoices and/or subscriptions)
```
