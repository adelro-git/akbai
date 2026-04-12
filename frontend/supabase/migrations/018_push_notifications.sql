-- ============================================================
-- Migration 018: Push Notification Infrastructure
-- Feature: Push Notifications (Gap B6)
-- Purpose: Tables for push subscriptions, notification preferences,
--          and in-app notification log. Enables BIR deadline push
--          reminders and user-configurable notification toggles.
-- ============================================================

-- ============================================================
-- Table: push_subscriptions
-- Stores Web Push API subscription data (VAPID endpoint + keys)
-- per user per device. Soft-delete when user unsubscribes or
-- subscription expires (410 Gone from push service).
-- ============================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL
);

-- --- Indexes: Fast lookup by user, unique active subscription per endpoint ---
CREATE INDEX idx_push_subs_user
  ON push_subscriptions(user_id)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX idx_push_subs_user_endpoint
  ON push_subscriptions(user_id, endpoint)
  WHERE deleted_at IS NULL;

-- --- RLS Policies: Users can only manage their own subscriptions ---
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- Table: notification_preferences
-- Per-user, per-notification-type toggle. Defaults to enabled.
-- Created on first push subscription, not on user signup.
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  enabled           BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ NULL
);

-- --- Indexes: One active preference per user per type ---
CREATE UNIQUE INDEX idx_notif_prefs_user_type
  ON notification_preferences(user_id, notification_type)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_notif_prefs_user
  ON notification_preferences(user_id)
  WHERE deleted_at IS NULL;

-- --- RLS Policies: Users can only manage their own preferences ---
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- --- Trigger: Auto-update updated_at on notification_preferences ---
CREATE OR REPLACE FUNCTION update_notification_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_notification_prefs_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_prefs_updated_at();

-- ============================================================
-- Table: notifications
-- In-app notification log. Push notifications are also logged here
-- so the notification bell can show recent activity. read_at is
-- set when the user clicks/taps the notification.
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title             TEXT NOT NULL,
  body              TEXT NOT NULL,
  url               TEXT NULL,
  read_at           TIMESTAMPTZ NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ NULL
);

-- --- Indexes: Unread-first listing, user lookup ---
CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, read_at)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_notifications_user_created
  ON notifications(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- --- RLS Policies: Users can only access their own notifications ---
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
