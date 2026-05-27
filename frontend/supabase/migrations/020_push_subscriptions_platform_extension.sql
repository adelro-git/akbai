-- ============================================================
-- Migration 020: push_subscriptions platform extension
-- Feature: Native Push Notifications (Sprint 16, Gap G4 mitigation)
-- Purpose: Extend push_subscriptions to support both Web Push (VAPID
--          endpoint + p256dh_key + auth_key) AND native push (FCM token
--          for Android / APNs token for iOS) in a single table.
--          One discriminator column (`platform`) routes the send-side
--          fanout in lib/push/send.ts; web rows retain VAPID columns,
--          native rows store the OS-issued token in `native_token`.
--
-- Owning table: public.push_subscriptions (created in migration 018).
--
-- Schema changes:
--   ADD platform     TEXT NOT NULL DEFAULT 'web' (CHECK in {web, android, ios})
--   ADD native_token TEXT NULL                   (FCM/APNs token; NULL for web)
--   ADD device_id    TEXT NULL                   (Capacitor device UUID; NULL for web)
--   ALTER p256dh_key DROP NOT NULL               (web-only column going forward)
--   ALTER auth_key   DROP NOT NULL               (web-only column going forward)
--   DROP INDEX  idx_push_subs_user_endpoint
--   CREATE INDEX idx_push_subs_user_endpoint_web      (partial, platform='web')
--   CREATE INDEX idx_push_subs_user_native_token      (partial, native_token NOT NULL)
--
-- RLS: unchanged. Existing 3 policies on push_subscriptions
--      (SELECT/INSERT/UPDATE with auth.uid() = user_id) cover the new columns
--      by row scope. No DELETE policy by design — soft-delete only via UPDATE.
--
-- Soft-delete: deleted_at TIMESTAMPTZ NULL already present from migration 018.
--              No change.
--
-- Backfill: all existing rows are Web Push subscriptions. DEFAULT 'web' on
--           the new `platform` column handles them automatically. No data
--           migration step required.
--
-- Architect reference: sprint-16-native-plugin-pattern.md §8 Migration A
--                      (locked 2026-05-27).
--
-- Rollback notes (do NOT execute as part of this migration; record only):
--   1. Soft-delete every row where platform != 'web':
--        UPDATE push_subscriptions SET deleted_at = now()
--          WHERE platform != 'web' AND deleted_at IS NULL;
--   2. Drop the new partial indexes:
--        DROP INDEX IF EXISTS idx_push_subs_user_endpoint_web;
--        DROP INDEX IF EXISTS idx_push_subs_user_native_token;
--   3. Restore the original unique index:
--        CREATE UNIQUE INDEX idx_push_subs_user_endpoint
--          ON push_subscriptions(user_id, endpoint)
--          WHERE deleted_at IS NULL;
--   4. Drop new columns:
--        ALTER TABLE push_subscriptions DROP COLUMN IF EXISTS device_id;
--        ALTER TABLE push_subscriptions DROP COLUMN IF EXISTS native_token;
--        ALTER TABLE push_subscriptions DROP COLUMN IF EXISTS platform;
--   5. Re-NOT-NULL the VAPID columns (only safe once all non-web rows are soft-deleted):
--        ALTER TABLE push_subscriptions ALTER COLUMN p256dh_key SET NOT NULL;
--        ALTER TABLE push_subscriptions ALTER COLUMN auth_key   SET NOT NULL;
-- ============================================================

-- --- Add platform discriminator (web | android | ios) ---
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'web'
    CHECK (platform IN ('web', 'android', 'ios'));

-- --- Add native push token (FCM / APNs) ---
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS native_token TEXT NULL;

-- --- Add device identifier for multi-device disambiguation ---
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS device_id TEXT NULL;

-- --- Relax VAPID-specific columns to NULL-able (required only for web rows) ---
ALTER TABLE public.push_subscriptions
  ALTER COLUMN p256dh_key DROP NOT NULL;

ALTER TABLE public.push_subscriptions
  ALTER COLUMN auth_key DROP NOT NULL;

-- --- Replace the existing unique index with two platform-scoped partial indexes ---
DROP INDEX IF EXISTS idx_push_subs_user_endpoint;

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subs_user_endpoint_web
  ON public.push_subscriptions(user_id, endpoint)
  WHERE deleted_at IS NULL AND platform = 'web';

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subs_user_native_token
  ON public.push_subscriptions(user_id, native_token)
  WHERE deleted_at IS NULL AND native_token IS NOT NULL;

-- --- Column comments (dev-facing English; conversational Filipino N/A in SQL) ---
COMMENT ON COLUMN public.push_subscriptions.platform IS
  'Source of subscription. Web Push (VAPID, p256dh_key + auth_key + endpoint) vs native (FCM/APNs token in native_token). Sprint 16 / Gap G4 mitigation.';

COMMENT ON COLUMN public.push_subscriptions.native_token IS
  'FCM token (Android) or APNs token (iOS). NULL for platform=web rows. Sprint 16.';

COMMENT ON COLUMN public.push_subscriptions.device_id IS
  'Optional Capacitor-emitted device UUID for multi-device disambiguation. NULL for web. Sprint 16.';
