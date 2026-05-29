# AKBai — Supabase Schema Reference
> Living document. Update this file whenever a table is created, modified, or deprecated.
> Last updated: 2026-05-27 | Source: Tech Stack v1, Roadmap v14, Operations Roadmap v6

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
24. [Migration Log — Sprint 16 (020 + 021)](#24-migration-log--sprint-16-020--021-native-surface-polish)
25. [Migration Log — Sprints 9-13 Catch-up (011-019)](#25-migration-log--sprints-9-13-catch-up-011-019)
26. [Migration Log — Sprint 17 (022_revenuecat_events)](#26-migration-log--sprint-17-022_revenuecat_events)
27. [Known Schema Drift](#27-known-schema-drift)

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

---

## 24. Migration Log — Sprint 16 (020 + 021, Native Surface Polish)

> **Doc-debt note:** This file is currently behind on migrations 011-019. Sprint 16 adds 020 + 021. A separate Sprint 17 housekeeping task should bring 011-019 into this doc (push_subscriptions from 018, costing_cards / invoices / payments from 015-017 — which §23 already drafted but never reconciled into the per-table sections — plus the earlier 011-014 work).

### 020_push_subscriptions_platform_extension.sql

Extends the `push_subscriptions` table (originally created in migration 018) to support BOTH Web Push (VAPID) AND native push (FCM / APNs) in a single table via a `platform` discriminator column.

**Schema changes:**
```sql
-- Add platform discriminator
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'web'
    CHECK (platform IN ('web', 'android', 'ios'));

-- Add native push token (FCM / APNs)
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS native_token TEXT NULL;

-- Add device identifier for multi-device disambiguation
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS device_id TEXT NULL;

-- Relax VAPID columns to NULL-able (web-only going forward)
ALTER TABLE public.push_subscriptions
  ALTER COLUMN p256dh_key DROP NOT NULL;
ALTER TABLE public.push_subscriptions
  ALTER COLUMN auth_key DROP NOT NULL;

-- Replace single unique index with platform-scoped partials
DROP INDEX IF EXISTS idx_push_subs_user_endpoint;

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subs_user_endpoint_web
  ON public.push_subscriptions(user_id, endpoint)
  WHERE deleted_at IS NULL AND platform = 'web';

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subs_user_native_token
  ON public.push_subscriptions(user_id, native_token)
  WHERE deleted_at IS NULL AND native_token IS NOT NULL;
```

**RLS:** unchanged — existing 3 row-scoped policies on `push_subscriptions` (SELECT/INSERT/UPDATE, all `auth.uid() = user_id`) cover the new columns automatically. Row-scope is column-agnostic.

**Soft-delete:** `deleted_at TIMESTAMPTZ NULL` already present from migration 018. No change.

**Backfill:** automatic via `DEFAULT 'web'` on `platform` — all existing rows get `platform='web'`. No data migration step required.

**Send-side fanout** (`lib/push/send.ts`): branches on `platform` — web rows → `webpush.sendNotification`; native rows → Firebase Admin SDK call (Sprint 19 work; Sprint 16 just persists the rows with a `TODO(sprint-19)` log + soft-skip on native sends).

### 021_users_biometric_columns.sql

Adds biometric opt-in to the canonical `users` table (created in migration 001 — see §2 of this doc). Biometric is an OPTIONAL second factor on app open; default off; user enables via OnboardingWizard step 6.25 or `/profile` toggle.

**Schema changes:**
```sql
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS biometric_setup_at TIMESTAMPTZ NULL;
```

**RLS:** unchanged — existing `users_select_own` / `users_insert_own` / `users_update_own` policies (all `auth.uid() = id` because `users.id` IS the auth UUID via `REFERENCES auth.users(id)`) cover the new columns. The `/api/profile` PATCH endpoint writes both columns via this existing UPDATE policy.

**Soft-delete:** `deleted_at` already on `users` from migration 001. No change.

**Server-side derivation:** `biometric_setup_at` is server-derived (`now()`) when `biometric_enabled` is toggled from `false → true` and the existing `biometric_setup_at` is null. The `/api/profile` Zod schema does NOT accept a client-supplied `biometric_setup_at` value (rejected by Zod refine) — audit-trail integrity is server-enforced.

### Updated Table Snapshots

| Table | New Columns (Sprint 16) | RLS Impact |
|-------|------------------------|------------|
| `push_subscriptions` | `platform TEXT NOT NULL DEFAULT 'web' CHECK in (web/android/ios)`, `native_token TEXT NULL`, `device_id TEXT NULL`. `p256dh_key` + `auth_key` now nullable. | None — row-scoped policies cover new columns. |
| `users` (§2) | `biometric_enabled BOOLEAN NOT NULL DEFAULT false`, `biometric_setup_at TIMESTAMPTZ NULL` | None — existing `users_update_own` covers. |

### Architect reference
`akbai-delivery/skills/solutions-architect/references/sprint-16-native-plugin-pattern.md` §8 (Migration A + B shapes locked 2026-05-27).

---

## 25. Migration Log — Sprints 9-13 Catch-up (011-019)

> **Doc-debt closure (Sprint 17):** This section back-fills the migrations that landed between Sprints 9 and 13 but never reached this reference. Each entry: file, sprint of origin, table(s) touched, key columns, RLS shape, soft-delete invariant. Entries stay concise — the .sql files are source of truth.

### 011_bir_deadlines.sql (Sprint 9, Build 6)
Creates `bir_deadlines` (one row per user per BIR form + due_date) and adds `bir_tax_type TEXT NULL` to `business_profiles`. Columns: `form_name`, `due_date`, `description`, `status` (CHECK: `upcoming|filed|overdue|na`), `notified_7d/3d/1d` BOOLEAN flags, plus the audit triple + `deleted_at`. RLS: standard 4-policy pattern (SELECT/INSERT/UPDATE/DELETE all `auth.uid() = user_id`) — note this migration is the lone exception that includes a client DELETE policy; new tables should not follow this precedent (soft-delete only per CLAUDE.md rule 2). Unique index `(user_id, form_name, due_date) WHERE deleted_at IS NULL` blocks dup deadlines. Index `(user_id, due_date)` powers Deadline Watcher reads. Supersedes the §7 `bir_deadlines` table shape (which planned `form_type`/`deadline_date`/`filing_period` columns that never shipped).

### 012_morning_briefing_cache.sql (Sprint 10, Build 5)
Extends `daily_check_in` (§16) with `briefing_content TEXT NULL` + `briefing_generated_at TIMESTAMPTZ NULL`. No new RLS — inherits existing row-scoped policies on `daily_check_in`. Powers the once-per-day Claude cache for `/api/morning-briefing`; cache key is `(user_id, check_in_date)` (already UNIQUE on `daily_check_in`).

### 013_waitlist.sql (Sprint 11, landing page)
Creates `waitlist` table — `id`, `email UNIQUE`, `source TEXT DEFAULT 'landing_page'`, `created_at`, `deleted_at`. RLS: public INSERT (`WITH CHECK (true)` so the landing page can write without auth) + service-role-only SELECT. No `user_id` (anonymous capture pre-signup). Soft-delete on per project rule, even though deletion path is unlikely.

### 014_receipt_dedup.sql (Sprint 12, Gap C1)
Extends `transactions` (§18) with `receipt_hash TEXT NULL` + `merchant_name TEXT NULL` for receipt-scan dedup. Hash = SHA-256 of `amount + date + merchant_name`, computed app-side. Partial index `idx_transactions_receipt_hash (user_id, receipt_hash) WHERE receipt_hash IS NOT NULL AND deleted_at IS NULL` powers the ±30-min duplicate-window lookup at scan time. No new RLS — inherits Sprint 7 `transactions` policies.

### 015_costing_cards.sql (Sprint 13, Build 8)
Creates `costing_cards` (header) + `costing_card_items` (line items). `costing_cards` columns: `product_name`, `product_category`, `total_cost_centavos`, `overhead_centavos`, `labor_centavos`, `packaging_centavos`, `selling_price_centavos`, `suggested_price_centavos`, `target_margin_pct`, `actual_margin_pct`, `break_even_qty`, `monthly_fixed_costs_centavos`, `yield_quantity`, `yield_unit`, plus audit triple + `deleted_at`. `costing_card_items` columns: `costing_card_id` FK (ON DELETE CASCADE), `item_name`, `item_type` CHECK (`ingredient|labor|overhead|packaging|other`), `quantity NUMERIC(10,3)`, `unit_cost_centavos`, `total_cost_centavos`, `sort_order`. Both tables: standard 3-policy RLS (SELECT/INSERT/UPDATE own; no DELETE — soft-delete only), `idx_*_user_id WHERE deleted_at IS NULL`, audit trigger via shared `handle_updated_at()`. Money is INTEGER centavos throughout (non-negotiable convention).

### 016_invoices.sql (Sprint 13, Build 8)
Creates `invoices` + `invoice_items` — **supersedes the §6 invoices schema** which was planned but never migrated. Header columns: `invoice_number`, `invoice_date`, `due_date`, `client_name`, `client_email`, `client_phone`, `client_address`, `subtotal_centavos`, `discount_centavos`, `tax_rate_pct`, `tax_amount_centavos`, `total_centavos`, `status` CHECK (`draft|sent|viewed|paid|overdue|cancelled`), `sent_at`, `paid_at`, `cancelled_at`, `payment_transaction_id UUID` (no FK constraint), `pdf_storage_path`, `notes`, `internal_notes`. Line items: `invoice_id` FK CASCADE, `description`, `quantity NUMERIC(10,3)`, `unit`, `unit_price_centavos`, `total_centavos`, optional `costing_card_id` FK (margin visibility on invoices), `sort_order`. RLS: standard 3-policy on both tables. Indexes: `(user_id)`, `(user_id, status)`, `(user_id, invoice_date DESC)`, UNIQUE `(user_id, invoice_number) WHERE deleted_at IS NULL` (Phase 1 scope: per-user numbering), partial `(due_date, status) WHERE status='sent'` for overdue-cron detection.

### 017_payments.sql (Sprint 13, Build 8, Gap D2)
Creates `payments` — the table that resolves Xendit webhook idempotency. Columns: `payment_type` CHECK (`invoice_payment|subscription_payment`), `xendit_payment_id TEXT`, `xendit_invoice_id TEXT`, `payment_method`, `amount_centavos INTEGER`, `currency DEFAULT 'PHP'`, `status` CHECK (`pending|processing|succeeded|failed|refunded|cancelled`), `invoice_id` FK (nullable), `subscription_id` FK (nullable), `transaction_id UUID` (no FK), `paid_at`, `failure_reason`, `notes`. RLS: **SELECT-only for users** (`auth.uid() = user_id`) — INSERT/UPDATE via service role only (webhook handler bypasses RLS). The load-bearing invariant for Gap D2: `CREATE UNIQUE INDEX idx_payments_xendit_id ON public.payments(xendit_payment_id) WHERE xendit_payment_id IS NOT NULL AND deleted_at IS NULL` — the webhook does `INSERT … ON CONFLICT (xendit_payment_id) DO NOTHING`; zero rows back = duplicate, skip downstream work.

### 018_push_notifications.sql (Sprint 14, Gap B6)
Creates three tables for Web Push infrastructure. (1) `push_subscriptions`: `user_id`, `endpoint`, `p256dh_key`, `auth_key`, `created_at`, `deleted_at`. Indexes: `(user_id) WHERE deleted_at IS NULL`, UNIQUE `(user_id, endpoint) WHERE deleted_at IS NULL` (later dropped + replaced in migration 020). (2) `notification_preferences`: `notification_type`, `enabled BOOLEAN DEFAULT true`, audit triple + `deleted_at`, UNIQUE `(user_id, notification_type) WHERE deleted_at IS NULL`. (3) `notifications` (in-app log): `notification_type`, `title`, `body`, `url`, `read_at`, `created_at`, `deleted_at` (no `updated_at`). All three tables: standard 3-policy RLS (`auth.uid() = user_id`). The `update_notification_prefs_updated_at()` trigger function is created here (separate from the bootstrap `update_updated_at()` and the Sprint 13 `handle_updated_at()`) — three update-timestamp functions now coexist in the schema; consolidation deferred.

### 019_morning_briefing_tone.sql (Sprint 14, Phase 7 D6)
Extends `daily_check_in` (§16) with `briefing_tagline TEXT NULL` (≤80 chars enforced at app layer) + `briefing_tone TEXT NULL CHECK (briefing_tone IS NULL OR briefing_tone IN ('energetic','observant','celebratory'))`. No new RLS or trigger — inherits existing daily_check_in policies. NULL values are valid (the route falls back to `pickFallback()` deterministic templates when Claude is unavailable on the no_credits path). Cache key remains `(user_id, check_in_date)`.

---

## 26. Migration Log — Sprint 17 (022_revenuecat_events)

**Migration file:** `022_revenuecat_events.sql`
**Sprint:** 17 (2026-05-27)
**Architect reference:** `akbai-delivery/skills/solutions-architect/references/sprint-17-revenuecat-pattern.md` §5 (locked 2026-05-27)
**Resolves:** Gap G2 (CRITICAL) — RevenueCat IAP webhook idempotency. Replaces the dormant Xendit handler as the authoritative billing pipeline for Phase 0B mobile launch.

### Why this migration is load-bearing

RevenueCat retries every webhook on any non-2xx response — up to 12 attempts over ~72 hours. Without per-event-UUID dedup, a transient network blip during downstream tier writes triggers retry storms that thrash `subscriptions.tier`. The `event_id TEXT PRIMARY KEY` + `ON CONFLICT (event_id) DO NOTHING RETURNING *` pattern (mirrors the Sprint 13 `payments.xendit_payment_id` UNIQUE invariant from migration 017) is the architectural mitigation. The `set_user_tier_v2()` RPC fixes the `started_at` bug in v1 (which unconditionally overwrites the original purchase date on every renewal, breaking tenure-based features later).

### Table: revenuecat_events (NEW)

Service-role-only audit log of every RevenueCat webhook event. Users never read their own events.

```sql
CREATE TABLE IF NOT EXISTS public.revenuecat_events (
  event_id     TEXT        PRIMARY KEY,    -- RevenueCat event UUID (G2 idempotency invariant)
  event_type   TEXT        NOT NULL,       -- 'INITIAL_PURCHASE' | 'RENEWAL' | 'CANCELLATION' | …
  app_user_id  TEXT        NOT NULL,       -- users.id::text (RevenueCat treats as opaque)
  event_at     TIMESTAMPTZ NOT NULL,       -- from event.event_timestamp_ms
  payload      JSONB       NOT NULL,       -- full event envelope
  processed_at TIMESTAMPTZ NULL,           -- set after downstream tier write
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ NULL            -- soft-delete invariant (CLAUDE.md rule 2)
);

ALTER TABLE public.revenuecat_events ENABLE ROW LEVEL SECURITY;
-- NO user-side SELECT/INSERT/UPDATE/DELETE policy. Service role bypasses RLS.
-- Default deny — if a future feature needs user-side reads, add a policy then.

CREATE INDEX IF NOT EXISTS idx_revenuecat_events_user_event_at
  ON public.revenuecat_events(app_user_id, event_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_revenuecat_events_unprocessed
  ON public.revenuecat_events(event_at DESC)
  WHERE processed_at IS NULL AND deleted_at IS NULL;
```

**RLS:** service-role-only by design. RLS is ENABLED with **no policies** (default deny for anon + authenticated). Same posture as `webhook_events` (§11), `daily_api_spend` (§12), `audit_log` (§13) — internal audit tables. The webhook handler at `/api/webhooks/revenuecat/route.ts` uses the service role key (server-only, never in client code per CLAUDE.md rule 4).

**Soft-delete:** `deleted_at TIMESTAMPTZ NULL` per CLAUDE.md rule 2. Both partial indexes scope on `WHERE deleted_at IS NULL`. No DELETE policy.

**Primary key choice — `TEXT` not `UUID`:** RevenueCat's `event_id` is delivered as a string per their docs and may contain non-UUID formats during sandbox testing or version migrations. TEXT is the conservative choice; the PK provides idempotency regardless of format.

**Index rationale:**
- `idx_revenuecat_events_user_event_at` — per-user event audit reads (admin debugging, dispute investigation).
- `idx_revenuecat_events_unprocessed` — re-processable backlog scan if downstream tier writes fail mid-event (failure mode: row inserted, `processed_at` left NULL, retry later).

### RPC: set_user_tier_v2() (NEW; v1 untouched)

5-arg SECURITY DEFINER function. The RevenueCat webhook handler routes ALL tier writes through this RPC — no direct `UPDATE subscriptions` from the handler. v1 (`set_user_tier`, migration 003 lines 73-88) is **not modified or dropped**; legacy Xendit callsites (`lib/subscriptions/lifecycle.ts`) continue to use v1 unchanged.

```sql
CREATE OR REPLACE FUNCTION public.set_user_tier_v2(
  p_user_id                   UUID,
  p_tier                      TEXT,
  p_expires_at                TIMESTAMPTZ DEFAULT NULL,
  p_revenuecat_app_user_id    TEXT        DEFAULT NULL,
  p_reset_started_at          BOOLEAN     DEFAULT false
) RETURNS void AS $$
BEGIN
  UPDATE public.subscriptions
  SET tier                   = p_tier,
      expires_at             = p_expires_at,
      status                 = CASE WHEN p_tier = 'free' THEN 'cancelled' ELSE 'active' END,
      started_at             = CASE WHEN p_reset_started_at THEN NOW() ELSE started_at END,
      xendit_subscription_id = CASE
                                 WHEN p_revenuecat_app_user_id IS NOT NULL
                                 THEN COALESCE(xendit_subscription_id, p_revenuecat_app_user_id)
                                 ELSE xendit_subscription_id
                               END,
      updated_at             = NOW()
  WHERE user_id = p_user_id
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**`p_reset_started_at` semantics (architect §5 decision #2 — load-bearing):**
- `true`  → only on `INITIAL_PURCHASE` / `NON_RENEWING_PURCHASE` (first-time tier entry, fresh tenure).
- `false` → renewals / product changes / billing-issue resolution. `started_at` is preserved via the `CASE … ELSE started_at` branch.
- v1 unconditionally resets `started_at = NOW()` on every call — that is the bug v2 fixes.

**`xendit_subscription_id` column reuse:** v2 opportunistically stores the RevenueCat `app_user_id` in the existing `xendit_subscription_id` column (only when currently NULL — `COALESCE` preserves existing Xendit IDs). Avoids a column rename / new column for Sprint 17; clean-up deferred (column rename to `external_subscription_id` is a future migration if Anton chooses).

**SECURITY DEFINER:** matches v1. Caller is the webhook route running under service role; SECURITY DEFINER makes the function run as the owner regardless. Safe because (a) the function only touches `public.subscriptions` (one table, well-scoped), (b) `p_user_id` is validated server-side by the webhook handler before invocation, (c) RLS on `subscriptions` is read-only for users anyway.

### Constraint: subscriptions_tier_check (NEW; idempotent)

Forward-compat enum lock for the `subscriptions.tier` column. Idempotent via `DO $$ … pg_constraint probe … END $$` because Postgres <16 has no `ADD CONSTRAINT IF NOT EXISTS` for CHECK.

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_tier_check'
      AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_tier_check
      CHECK (tier IN ('free', 'starter', 'pro', 'business', 'scale'));
  END IF;
END
$$;
```

**Enum scope (architect §5):** Sprint 13 tier lock is `'free' | 'starter' | 'pro'`. `'business'` and `'scale'` are retained as forward-compat (Phase 2/3 references in `frontend/src/lib/subscriptions/types.ts`) — RevenueCat never writes them in Sprint 17, but the CHECK accepts them so a future migration that introduces those tiers doesn't have to redo this constraint.

### Rollback notes (record only; do NOT execute as part of migration)

```sql
-- 1. Soft-delete every event row:
UPDATE public.revenuecat_events SET deleted_at = now() WHERE deleted_at IS NULL;

-- 2. Drop the v2 RPC (v1 untouched):
DROP FUNCTION IF EXISTS public.set_user_tier_v2(UUID, TEXT, TIMESTAMPTZ, TEXT, BOOLEAN);

-- 3. Drop the tier CHECK constraint:
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_tier_check;

-- 4. Drop the events table (only after step 1 + audit retention):
DROP TABLE IF EXISTS public.revenuecat_events;
```

### Verify queries (paste into Supabase Studio after applying)

```sql
-- 1. Table + RLS posture:
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'revenuecat_events';
-- expect: rowsecurity = true (with no policies — default deny)

-- 2. Both tier RPCs co-exist (v1 untouched, v2 added):
SELECT proname FROM pg_proc WHERE proname IN ('set_user_tier', 'set_user_tier_v2');
-- expect: 2 rows

-- 3. CHECK constraint locked in:
SELECT conname FROM pg_constraint WHERE conname = 'subscriptions_tier_check';
-- expect: 1 row

-- 4. Indexes present:
SELECT indexname FROM pg_indexes WHERE tablename = 'revenuecat_events';
-- expect: revenuecat_events_pkey + idx_revenuecat_events_user_event_at
--       + idx_revenuecat_events_unprocessed
```

### Architectural invariants for future migrations touching this surface

1. **All RevenueCat tier writes route through `set_user_tier_v2()`.** Never `UPDATE subscriptions SET tier = …` directly from the webhook handler. Audit surface for review-security per architect §10.
2. **`event_id` is the dedup key.** Any future webhook source (Stripe, Paddle, etc.) gets its own events table with a similar `event_id PRIMARY KEY` shape; do NOT shoehorn other providers into `revenuecat_events`.
3. **v1 `set_user_tier()` is preserved.** Do not drop it until the Xendit lifecycle code (`lib/subscriptions/lifecycle.ts`) is fully retired and the schema-drift items in §27 are resolved.

---

## 27. Known Schema Drift

> **Surfaced during Sprint 17 RevenueCat schema audit.** Two items where the application code references columns / functions that are not present in any committed migration. Both need staging-database verification before Phase 0B GA. Documented here so future migrations don't accidentally re-add or rename these objects without an audit trail.

### Drift #1 — `subscriptions` table: 9 columns written by `lib/subscriptions/lifecycle.ts` but not in migration 003

`frontend/src/lib/subscriptions/lifecycle.ts` (Sprint 8 Xendit lifecycle code) writes the following columns via `.upsert()` and `.update()` calls (lines 49-57, 105-112, 158-167):

| Column | Type implied by writes | Where written |
|---|---|---|
| `xendit_customer_id` | TEXT | `activateSubscription` upsert |
| `payment_method` | TEXT | `activateSubscription` upsert |
| `current_period_start` | TIMESTAMPTZ | activate + renew |
| `current_period_end` | TIMESTAMPTZ | activate + renew (also read at line 139) |
| `scan_limit` | INTEGER | activate + cancel + renew |
| `scans_used_this_period` | INTEGER | activate + renew |
| `grace_period_end` | TIMESTAMPTZ | activate + cancel + renew |
| `grace_notifications_sent` | INTEGER | activate + cancel + renew |
| `cancelled_at` | TIMESTAMPTZ | activate (NULL) + cancel (NOW) |

**Source-of-truth migration (003_subscriptions_table.sql) only declares:** `id, user_id, tier, status, started_at, expires_at, xendit_subscription_id, created_at, updated_at, deleted_at`.

The §9 schema reference (lines 576-628 of this doc) does list these columns — that documentation was the *planned* shape from Tech Stack v1 + ADR-005. **No migration ever shipped them.** The columns were likely added ad-hoc via Supabase Studio during Sprint 8, OR the writes have been silently failing in production (`.upsert` doesn't error on unknown columns when RLS rejects the write; service-role writes would error). Either way, the migration history is inconsistent with the application code.

**Action required (Anton, Sprint 18 pre-launch gate):**
1. Connect to staging Supabase, run `\d public.subscriptions` and snapshot the actual column list.
2. If columns exist in staging: write a **reconciliation migration** (`023_subscriptions_columns_reconciliation.sql`) that uses `ADD COLUMN IF NOT EXISTS` for each — idempotent, safe to run on prod that already has them.
3. If columns DO NOT exist in staging: the Xendit lifecycle has been silently no-oping. Decide before Phase 0B GA whether to (a) ship the reconciliation migration anyway to unblock the lifecycle code, or (b) accept that Xendit is fully deprecated post-Sprint 17 and these writes can be removed when `lib/subscriptions/lifecycle.ts` is retired.

**Why this matters for Sprint 17:** RevenueCat does NOT touch any of these columns. The new `set_user_tier_v2()` RPC writes only `tier, expires_at, status, started_at, xendit_subscription_id, updated_at` — all declared in migration 003. So Sprint 17's RevenueCat path is drift-free. But Sprint 17 also adds `subscriptions_tier_check` CHECK constraint, which assumes the `tier` column is the only enum-locked column on the table; if a later reconciliation migration redefines columns, the constraint name must be preserved.

### Drift #2 — `protect_feature_flags()` trigger referenced in docs but not in any migration

ADR-005 ("Subscription State Hardening", `architecture-decisions.md`) and Sprint 3 deployment notes reference a `protect_feature_flags()` trigger on `public.users` that prevents client-side mutation of `feature_flags` JSONB — only the service role may write that column. The trigger was supposedly deployed in Sprint 3.

**Source-of-truth check:** no `.sql` file in `frontend/supabase/migrations/` defines `protect_feature_flags()`. `Grep -r protect_feature_flags` returns hits only in documentation files (ADRs, sprint plans).

**Possible explanations:**
1. Deployed via Supabase Studio in Sprint 3 and never back-filled into a migration file.
2. Was planned but never deployed; `users.feature_flags` is currently writable by any authenticated user via the standard `users_update_own` RLS policy (which is permissive on column scope — RLS is row-level, not column-level).

**Action required (Anton, Sprint 18 pre-launch gate):**
1. `SELECT tgname FROM pg_trigger WHERE tgname LIKE '%protect_feature_flags%'` on staging — confirm presence/absence.
2. If absent: write `024_protect_feature_flags_trigger.sql` formalising the ADR-005 invariant. Critical because `feature_flags` gates IAP entry points; a client-side write could self-grant Pro entitlements.
3. If present: back-fill a no-op migration that documents the trigger shape (`CREATE OR REPLACE … IF NOT EXISTS`-pattern) so the schema history is reproducible from scratch.

**Sprint 17 scope note:** the build-data agent flagged this during the RevenueCat audit but did NOT attempt a fix — the trigger lives outside migration 022's scope, and a speculative trigger-write could conflict with whatever is actually deployed on prod. Anton verifies first; build-data ships the reconciliation migration in a follow-up sprint.

---
```
