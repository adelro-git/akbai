-- Seed the dev user for local development (SKIP_AUTH=true mode)
-- Run this once against your Supabase instance via the SQL Editor

-- 1. Insert into auth.users (required for foreign keys)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'dev@akbai.test',
  '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12', -- dummy hash
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert into public.users
INSERT INTO public.users (id, display_name, primary_pain, onboarding_step, onboarding_completed, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Boss',
  'bir_compliance',
  5,
  true,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  onboarding_completed = EXCLUDED.onboarding_completed;

-- 3. Insert into public.business_profiles
INSERT INTO public.business_profiles (user_id, business_name, business_type, income_range, bir_registered)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Dev Business',
  'food_baking',
  'below_50k',
  false
)
ON CONFLICT DO NOTHING;
