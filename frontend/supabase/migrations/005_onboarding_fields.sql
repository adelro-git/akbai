-- AKBai Sprint 3 — Kilala Kita onboarding fields
-- Adds onboarding tracking to users table + CHECK constraints to business_profiles

-- ============================================================
-- USERS: Add onboarding columns
-- ============================================================
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

-- ============================================================
-- BUSINESS_PROFILES: Add CHECK constraints
-- ============================================================
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
