-- ============================================================
-- Migration 022: revenuecat_events + set_user_tier_v2()
-- Feature: RevenueCat IAP webhook idempotency (Sprint 17, Gap G2 resolution)
-- Purpose: Persist every RevenueCat webhook event keyed by event UUID
--          for idempotent processing. The PRIMARY KEY enforces dedup;
--          ON CONFLICT DO NOTHING is the load-bearing invariant per
--          architect §3. Also adds set_user_tier_v2() RPC: tier writes
--          must route through this function (not direct UPDATEs).
--
-- Owning tables:
--   - public.revenuecat_events (NEW)
--   - public.subscriptions     (existing, no schema change; CHECK constraint added)
--
-- RLS: revenuecat_events is service-role-only — NO user SELECT policy.
--      This is an internal audit log; users never read their own events.
--
-- Soft-delete: deleted_at TIMESTAMPTZ NULL per CLAUDE.md rule 2.
--              No DELETE policy by design.
--
-- v1 preservation: set_user_tier() (migration 003) is NOT modified or dropped.
--                  Xendit legacy callsites continue to use v1. RevenueCat
--                  handler calls v2 only. Architect §5 + §6 invariant.
--
-- Architect reference: sprint-17-revenuecat-pattern.md §5 (locked 2026-05-27).
--
-- Rollback notes (do NOT execute as part of this migration; record only):
--   1. Soft-delete every event row:
--        UPDATE public.revenuecat_events SET deleted_at = now()
--          WHERE deleted_at IS NULL;
--   2. Drop the v2 RPC (v1 untouched):
--        DROP FUNCTION IF EXISTS public.set_user_tier_v2(UUID, TEXT, TIMESTAMPTZ, TEXT, BOOLEAN);
--   3. Drop the tier CHECK constraint:
--        ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_tier_check;
--   4. Drop the events table (only safe after step 1 is satisfied & audit retention is complete):
--        DROP TABLE IF EXISTS public.revenuecat_events;
-- ============================================================

-- ============================================================
-- revenuecat_events TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.revenuecat_events (
  event_id     TEXT        PRIMARY KEY,                                 -- RevenueCat event UUID (G2 idempotency invariant)
  event_type   TEXT        NOT NULL,                                    -- 'INITIAL_PURCHASE' | 'RENEWAL' | ...
  app_user_id  TEXT        NOT NULL,                                    -- users.id::text (RevenueCat treats as opaque)
  event_at     TIMESTAMPTZ NOT NULL,                                    -- from event.event_timestamp_ms
  payload      JSONB       NOT NULL,                                    -- full event envelope
  processed_at TIMESTAMPTZ NULL,                                        -- set after downstream tier write
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ NULL                                         -- soft-delete invariant (CLAUDE.md rule 2)
);

ALTER TABLE public.revenuecat_events ENABLE ROW LEVEL SECURITY;

-- NO user-side SELECT/INSERT/UPDATE/DELETE policy. Service role bypasses RLS.
-- If a future feature needs user-side reads, add a policy then; default deny.

CREATE INDEX IF NOT EXISTS idx_revenuecat_events_user_event_at
  ON public.revenuecat_events(app_user_id, event_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_revenuecat_events_unprocessed
  ON public.revenuecat_events(event_at DESC)
  WHERE processed_at IS NULL AND deleted_at IS NULL;

COMMENT ON TABLE  public.revenuecat_events IS
  'RevenueCat webhook event log. Primary key (event_id) provides idempotency. Sprint 17 / Gap G2 resolution.';
COMMENT ON COLUMN public.revenuecat_events.app_user_id IS
  'Equal to users.id::text. RevenueCat treats this as opaque; we cast for the FK lookup.';
COMMENT ON COLUMN public.revenuecat_events.processed_at IS
  'Null until downstream set_user_tier_v2() succeeds. Re-processable via the unprocessed-events index.';

-- ============================================================
-- set_user_tier_v2() RPC
-- Sprint 17 — RevenueCat tier write path. v1 (set_user_tier, migration 003)
-- is preserved for legacy Xendit callsites. RevenueCat handler calls v2 only.
--
-- p_reset_started_at semantics (architect §5 decision #2 — load-bearing):
--   - true  → only on INITIAL_PURCHASE / NON_RENEWING_PURCHASE (first-time tier entry).
--   - false → renewals / product changes / billing-issue resolution; started_at preserved.
-- v1 unconditionally resets started_at on every call — that is the bug v2 fixes.
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_user_tier_v2(
  p_user_id                   UUID,
  p_tier                      TEXT,
  p_expires_at                TIMESTAMPTZ DEFAULT NULL,
  p_revenuecat_app_user_id    TEXT        DEFAULT NULL,
  p_reset_started_at          BOOLEAN     DEFAULT false
) RETURNS void AS $$
BEGIN
  UPDATE public.subscriptions
  SET tier                      = p_tier,
      expires_at                = p_expires_at,
      status                    = CASE
                                    WHEN p_tier = 'free' THEN 'cancelled'
                                    ELSE 'active'
                                  END,
      started_at                = CASE
                                    WHEN p_reset_started_at THEN NOW()
                                    ELSE started_at
                                  END,
      xendit_subscription_id    = CASE
                                    WHEN p_revenuecat_app_user_id IS NOT NULL
                                    THEN COALESCE(xendit_subscription_id, p_revenuecat_app_user_id)
                                    ELSE xendit_subscription_id
                                  END,
      updated_at                = NOW()
  WHERE user_id = p_user_id
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.set_user_tier_v2(UUID, TEXT, TIMESTAMPTZ, TEXT, BOOLEAN) IS
  'Sprint 17 — RevenueCat tier write. p_reset_started_at=true only on INITIAL_PURCHASE / NON_RENEWING_PURCHASE. v1 (set_user_tier) preserved for legacy Xendit callsites.';

-- ============================================================
-- subscriptions_tier_check CONSTRAINT (forward-compat enum lock)
-- Architect §5 "Optional hardening (recommend INCLUDE)".
--
-- Postgres does not support `ADD CONSTRAINT IF NOT EXISTS` for CHECK
-- constraints prior to PG 16, so we wrap in a DO block that probes
-- pg_constraint by name and skips if already present. Idempotent &
-- portable across PG 14+ (Supabase managed versions).
--
-- Enum scope: Sprint 13 lock model is 'free' | 'starter' | 'pro'.
-- 'business' | 'scale' are retained as forward-compat per architect §5.
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'subscriptions_tier_check'
      AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_tier_check
      CHECK (tier IN ('free', 'starter', 'pro', 'business', 'scale'));
  END IF;
END
$$;

-- ============================================================
-- VERIFY (paste into Supabase Studio SQL editor AFTER applying):
--   -- 1. Table + RLS:
--   SELECT tablename, rowsecurity
--   FROM pg_tables WHERE schemaname = 'public' AND tablename = 'revenuecat_events';
--   -- expect: rowsecurity = true
--
--   -- 2. Both tier RPCs co-exist (v1 untouched, v2 added):
--   SELECT proname FROM pg_proc
--   WHERE proname IN ('set_user_tier', 'set_user_tier_v2');
--   -- expect: 2 rows
--
--   -- 3. CHECK constraint locked in:
--   SELECT conname FROM pg_constraint WHERE conname = 'subscriptions_tier_check';
--   -- expect: 1 row
--
--   -- 4. Indexes present:
--   SELECT indexname FROM pg_indexes WHERE tablename = 'revenuecat_events';
--   -- expect: revenuecat_events_pkey + idx_revenuecat_events_user_event_at
--   --       + idx_revenuecat_events_unprocessed
-- ============================================================
