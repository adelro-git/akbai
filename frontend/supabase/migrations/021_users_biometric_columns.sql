-- ============================================================
-- Migration 021: users biometric columns
-- Feature: Biometric Second Factor (Sprint 16, Gap G4 mitigation)
-- Purpose: Persist user opt-in for Face ID / fingerprint as an OPTIONAL
--          second factor on app open. Biometric never creates a session
--          and never replaces OTP login — it re-verifies an EXISTING
--          valid Supabase session. Default off; the user enables it
--          via OnboardingWizard step 6.25 or the /profile toggle.
--
-- Owning table: public.users (created in migration 001).
--
-- Schema changes:
--   ADD biometric_enabled  BOOLEAN     NOT NULL DEFAULT false
--   ADD biometric_setup_at TIMESTAMPTZ NULL
--
-- RLS: unchanged. Existing policies on public.users (users_select_own /
--      users_insert_own / users_update_own, all gating by auth.uid() = id)
--      cover the new columns by row scope. No new policies required —
--      RLS is row-scoped, not column-scoped. No DELETE policy by design
--      (soft-delete only).
--
-- Soft-delete: deleted_at TIMESTAMPTZ NULL already present on public.users
--              from migration 001. No change.
--
-- Architect reference: sprint-16-native-plugin-pattern.md §8 Migration B
--                      (locked 2026-05-27).
--
-- Rollback notes (do NOT execute as part of this migration; record only):
--   ALTER TABLE public.users DROP COLUMN IF EXISTS biometric_setup_at;
--   ALTER TABLE public.users DROP COLUMN IF EXISTS biometric_enabled;
-- ============================================================

-- --- Add biometric opt-in flag (default off) ---
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN NOT NULL DEFAULT false;

-- --- Add audit-trail timestamp for when biometric was first enabled ---
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS biometric_setup_at TIMESTAMPTZ NULL;

-- --- Column comments (dev-facing English; conversational Filipino N/A in SQL) ---
COMMENT ON COLUMN public.users.biometric_enabled IS
  'User opted into biometric second factor on app open';

COMMENT ON COLUMN public.users.biometric_setup_at IS
  'Audit trail for when user enabled biometric (UTC). Null = never enabled.';
