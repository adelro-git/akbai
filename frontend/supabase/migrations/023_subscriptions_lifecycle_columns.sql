-- ============================================================
-- Migration 023: subscriptions lifecycle columns (drift reconciliation)
-- Feature: Sprint 18 Pre-Launch Readiness — Known Schema Drift #1 fix
-- Purpose: Add the 9 columns that `frontend/src/lib/subscriptions/lifecycle.ts`
--          (Sprint 8 Xendit lifecycle code) writes via .upsert()/.update() but
--          which were never shipped in any migration. Migration 003
--          (003_subscriptions_table.sql) only declares:
--            id, user_id, tier, status, started_at, expires_at,
--            xendit_subscription_id, created_at, updated_at, deleted_at.
--          The lifecycle code additionally writes the columns added below.
--          Real service-role inserts/updates throw at runtime against the
--          undrifted table — this migration closes that latent production bug.
--
-- Owning tables:
--   - public.subscriptions (existing — ADD COLUMN only; no RLS change)
--
-- Drift provenance: documented in
--   `akbai-delivery/skills/data-architect/references/supabase-schema.md` §27
--   (surfaced during the Sprint 17 RevenueCat audit). These columns back the
--   Xendit grace-period lifecycle. Xendit is DEFERRED for Phase 0B (RevenueCat
--   is the authoritative billing pipeline per migration 022 / Gap G2), but the
--   columns are retained — (a) they unblock the still-present lifecycle.ts code
--   path so it cannot throw, and (b) the grace-period / period-tracking shape is
--   reused regardless of payment provider. The columns are documented in the §9
--   schema reference as the planned shape since Tech Stack v1; this migration
--   makes the live schema match the code + the docs.
--
-- RLS: UNCHANGED. subscriptions keeps its SELECT-only policy
--      (subscriptions_select_own, migration 003) — users read their own row,
--      writes are service-role only. Adding columns does NOT loosen RLS; we add
--      NO new policy. The set_user_tier_v2() RPC + subscriptions_tier_check
--      constraint from migration 022 are untouched.
--
-- Soft-delete: deleted_at TIMESTAMPTZ NULL already exists on subscriptions
--              (migration 003, line 23) — soft-delete invariant (CLAUDE.md rule 2)
--              is already satisfied. No change needed; asserted defensively below.
--
-- Idempotency: every statement uses ADD COLUMN IF NOT EXISTS, so this migration
--              is safe to run against a database that already has some or all of
--              these columns (e.g. if they were added ad-hoc via Supabase Studio
--              during Sprint 8). Re-running is a no-op.
--
-- Rollback notes (do NOT execute as part of this migration; record only):
--   ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS current_period_start;
--   ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS current_period_end;
--   ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS scan_limit;
--   ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS scans_used_this_period;
--   ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS grace_period_end;
--   ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS grace_notifications_sent;
--   ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS payment_method;
--   ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS xendit_customer_id;
--   ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS cancelled_at;
--   -- deleted_at is from migration 003; do NOT drop it on rollback.
-- ============================================================

-- ============================================================
-- Billing-period tracking (written by activate + renew)
-- ============================================================
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ NULL;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ NULL;

-- ============================================================
-- Usage tracking (written by activate + cancel + renew)
-- scan_limit is nullable: lifecycle.ts always supplies a value from
-- SCAN_LIMITS, but a NULL is treated as "no recorded limit" — keep nullable to
-- avoid forcing a default that would mask missing data. scans_used_this_period
-- is a counter the code always seeds to 0, so NOT NULL DEFAULT 0.
-- ============================================================
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS scan_limit INTEGER NULL;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS scans_used_this_period INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- Grace-period state (written by activate + cancel + renew)
-- grace_period_end: TIMESTAMPTZ NULL — set 3 days from payment failure, else
-- NULL. grace_notifications_sent: INTEGER counter (NOT boolean) — lifecycle.ts
-- assigns the integer literal 0 at every write (lines 56, 112, 167); matches
-- types.ts `grace_notifications_sent: number`. NOT NULL DEFAULT 0.
-- ============================================================
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMPTZ NULL;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS grace_notifications_sent INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- Payment metadata (written by activate)
-- ============================================================
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS payment_method TEXT NULL;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS xendit_customer_id TEXT NULL;

-- ============================================================
-- Cancellation timestamp (NULL on activate, NOW() on cancel)
-- ============================================================
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ NULL;

-- ============================================================
-- Soft-delete assertion (CLAUDE.md rule 2). Already shipped in migration 003;
-- ADD COLUMN IF NOT EXISTS is a no-op when present, and a safety net if this
-- migration is ever applied to a subscriptions table built from an older base.
-- ============================================================
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

-- ============================================================
-- COLUMN COMMENTS (documentation; safe to re-run)
-- ============================================================
COMMENT ON COLUMN public.subscriptions.current_period_start IS
  'Start of current billing period. Written by activateSubscription/renewSubscription (lib/subscriptions/lifecycle.ts).';
COMMENT ON COLUMN public.subscriptions.current_period_end IS
  'End of current billing period. Read back by renewSubscription to extend +30 days.';
COMMENT ON COLUMN public.subscriptions.scan_limit IS
  'Resibo scan cap for the tier (from SCAN_LIMITS). NULL = no recorded limit.';
COMMENT ON COLUMN public.subscriptions.scans_used_this_period IS
  'Scans consumed in the current period; reset to 0 on activate/renew. Counter, not boolean.';
COMMENT ON COLUMN public.subscriptions.grace_period_end IS
  'Grace-period expiry (3 days from payment failure). NULL when not in grace. Gap C2.';
COMMENT ON COLUMN public.subscriptions.grace_notifications_sent IS
  'Count of grace-period reminders sent. Integer counter; reset to 0 on activate/cancel/renew.';
COMMENT ON COLUMN public.subscriptions.payment_method IS
  'Payment method label (e.g. gcash, credit_card, concierge_gcash). Written by activateSubscription.';
COMMENT ON COLUMN public.subscriptions.xendit_customer_id IS
  'Xendit customer reference. Retained for the deferred Xendit lifecycle; RevenueCat does not write this.';
COMMENT ON COLUMN public.subscriptions.cancelled_at IS
  'Timestamp of cancellation. NULL on activate, NOW() on cancelSubscription.';

-- ============================================================
-- VERIFY (paste into Supabase Studio SQL editor AFTER applying):
--   -- 1. All 9 drift columns present:
--   SELECT column_name, data_type, is_nullable, column_default
--   FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'subscriptions'
--     AND column_name IN (
--       'current_period_start','current_period_end','scan_limit',
--       'scans_used_this_period','grace_period_end','grace_notifications_sent',
--       'payment_method','xendit_customer_id','cancelled_at'
--     )
--   ORDER BY column_name;
--   -- expect: 9 rows.
--
--   -- 2. Soft-delete column intact:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'subscriptions'
--     AND column_name = 'deleted_at';
--   -- expect: 1 row.
--
--   -- 3. RLS unchanged — still SELECT-only (one policy):
--   SELECT policyname, cmd FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'subscriptions';
--   -- expect: subscriptions_select_own / SELECT only.
-- ============================================================
