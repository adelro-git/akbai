-- AKBai Migration 003 — Subscriptions Table (Security Hardening)
-- Separates tier/subscription data from user-writable users table.
-- Users can SELECT their own subscription. Only service role can write.
-- Run this in your Supabase SQL Editor: https://naxjmwjrhzenjqburejl.supabase.co

-- ============================================================
-- SUBSCRIPTIONS table
-- ============================================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NULL,
  xendit_subscription_id TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

-- ============================================================
-- RLS: SELECT only for users. No INSERT/UPDATE/DELETE.
-- ============================================================
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- AUTO-UPDATE updated_at (reuse existing function)
-- ============================================================
CREATE TRIGGER on_subscriptions_updated
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- EXTEND handle_new_user() to auto-create free subscription
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.subscriptions (user_id, tier)
  VALUES (NEW.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC: set_user_tier (for Anton's manual upgrades + Xendit webhook)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_user_tier(
  p_user_id UUID,
  p_tier TEXT,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
) RETURNS void AS $$
BEGIN
  UPDATE public.subscriptions
  SET tier = p_tier,
      expires_at = p_expires_at,
      status = 'active',
      started_at = NOW(),
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PROTECT feature_flags from user-side manipulation
-- Silently reverts any change to feature_flags on user-initiated updates.
-- Service role bypasses RLS entirely, so admin writes still work.
-- ============================================================
CREATE OR REPLACE FUNCTION public.protect_feature_flags()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.feature_flags IS DISTINCT FROM OLD.feature_flags THEN
    NEW.feature_flags = OLD.feature_flags;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_feature_flags_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.protect_feature_flags();

-- ============================================================
-- BACKFILL: Create subscription rows for existing users
-- ============================================================
INSERT INTO public.subscriptions (user_id, tier)
SELECT id, COALESCE((feature_flags->>'tier')::TEXT, 'free')
FROM public.users
WHERE deleted_at IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- VERIFY
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- subscriptions should show rowsecurity = true
-- SELECT * FROM subscriptions; -- should show backfilled rows
-- ============================================================
