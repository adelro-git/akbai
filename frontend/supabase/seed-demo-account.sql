-- ============================================================
-- Seed: Demo / App Store + Play reviewer account
-- Feature: Reviewer demo access (Sprint 18, Gap §11 P0)
--
-- WHY THIS EXISTS:
--   AKBai's normal login is email OTP / magic-link. App Store and Play
--   reviewers cannot receive that email, so they cannot evaluate the app.
--   This seeds a SINGLE real demo account (demo@akbai.app) with realistic
--   sample data so a reviewer lands on a POPULATED dashboard, scanner, and
--   deadlines screen immediately. The demo account signs in via the normal
--   Supabase PASSWORD grant through /api/demo-login (gated by DEMO_MODE_ENABLED),
--   so this is a real auth.users row with a real bcrypt password — NOT a fake
--   session and NOT the dev SKIP_AUTH bypass.
--
-- SECURITY:
--   - This is a normal authenticated user. RLS still applies to it exactly
--     like any other user (auth.uid() = user_id). It can ONLY see its own
--     rows. It has no elevated privileges.
--   - Soft-delete aware: every row sets deleted_at NULL.
--   - The password is supplied at run time via the :demo_password psql var so
--     the plaintext is NEVER committed to git.
--
-- HOW TO RUN (run ONCE against the target Supabase project):
--   Set the password to the same value you put in DEMO_ACCOUNT_PASSWORD env:
--
--     psql "$DATABASE_URL" \
--       -v demo_password="'CHANGE-ME-strong-demo-password'" \
--       -f frontend/supabase/seed-demo-account.sql
--
--   (Note the password value is wrapped in single quotes inside the -v value,
--    because psql substitutes it literally into the SQL.)
--
--   Re-running is safe (idempotent): ON CONFLICT clauses upsert.
-- ============================================================

-- pgcrypto provides crypt()/gen_salt() for the bcrypt password hash that
-- Supabase Auth expects in auth.users.encrypted_password.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fixed UUID for the demo account so all sample rows can reference it without
-- a lookup. This is a constant — do NOT reuse the dev SKIP_AUTH UUID
-- (00000000-0000-0000-0000-000000000000); the demo account is distinct.
\set demo_uid '''11111111-1111-1111-1111-111111111111'''

-- ============================================================
-- 1. auth.users — real account with a real bcrypt password.
--    email_confirmed_at is set so the password grant works without the
--    confirmation email step. instance_id / aud / role match Supabase defaults.
-- ============================================================
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data
)
VALUES (
  :demo_uid::uuid,
  '00000000-0000-0000-0000-000000000000',
  'demo@akbai.app',
  crypt(:demo_password, gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"demo_account":true}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  -- Re-running re-sets the password to the current :demo_password so the env
  -- and the DB never drift.
  encrypted_password = crypt(:demo_password, gen_salt('bf')),
  email_confirmed_at = now(),
  updated_at = now();

-- ============================================================
-- 2. public.users — the app-side profile (onboarding complete so the reviewer
--    lands straight on the dashboard, not the onboarding flow).
-- ============================================================
INSERT INTO public.users (
  id, display_name, primary_pain, bir_consent,
  onboarding_step, onboarding_completed, created_at
)
VALUES (
  :demo_uid::uuid,
  'Demo (Reviewer)',
  'bir_compliance',
  true,
  5,
  true,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  onboarding_completed = true,
  onboarding_step = 5,
  deleted_at = NULL;

-- ============================================================
-- 3. public.business_profiles — a believable sari-sari / carinderia profile.
-- ============================================================
INSERT INTO public.business_profiles (
  user_id, business_name, business_type, income_range,
  bir_registered, bir_tax_type
)
VALUES (
  :demo_uid::uuid,
  'Aling Nena Sari-Sari Store',
  'sari_sari_retail',
  '50k_150k',
  true,
  'sole_prop_8pct'
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. daily_check_in — a few recent days so the dashboard streak + numbers
--    look populated. Amounts are INTEGER centavos (₱X.YZ * 100).
--    UNIQUE(user_id, check_in_date) → ON CONFLICT upsert.
-- ============================================================
INSERT INTO public.daily_check_in
  (user_id, check_in_date, mood, kai_greeting, sales_amount, expenses_amount)
VALUES
  (:demo_uid::uuid, CURRENT_DATE,            'good',    'Magandang umaga, Boss! Tara, tignan natin ang benta ngayong araw.', 185000, 62000),
  (:demo_uid::uuid, CURRENT_DATE - 1,        'okay',    'Kumusta ang tindahan kahapon? Mukhang steady ang benta.',            142000, 48000),
  (:demo_uid::uuid, CURRENT_DATE - 2,        'good',    'Ang ganda ng numbers mo, Boss! Tuloy-tuloy lang.',                   210000, 71000)
ON CONFLICT (user_id, check_in_date) DO UPDATE SET
  sales_amount = EXCLUDED.sales_amount,
  expenses_amount = EXCLUDED.expenses_amount,
  deleted_at = NULL;

-- ============================================================
-- 5. transactions — income + expenses across categories so the "Saan Napunta"
--    expenses dashboard renders real bars. Amounts in centavos.
--    No natural unique key → guard with NOT EXISTS so re-runs don't duplicate.
-- ============================================================
INSERT INTO public.transactions
  (user_id, type, amount, category, description, transaction_date, source)
SELECT v.user_id, v.type, v.amount, v.category, v.description, v.transaction_date, v.source
FROM (VALUES
  (:demo_uid::uuid, 'income',  185000, 'sales',     'Benta ngayong araw',          CURRENT_DATE,     'manual'),
  (:demo_uid::uuid, 'expense',  45000, 'inventory', 'Restock ng softdrinks',       CURRENT_DATE,     'manual'),
  (:demo_uid::uuid, 'expense',  17000, 'utilities', 'Kuryente (partial)',          CURRENT_DATE - 1, 'manual'),
  (:demo_uid::uuid, 'income',  142000, 'sales',     'Benta kahapon',               CURRENT_DATE - 1, 'check_in'),
  (:demo_uid::uuid, 'expense',  31000, 'inventory', 'Bigas at de-lata',            CURRENT_DATE - 2, 'ocr'),
  (:demo_uid::uuid, 'expense',  12500, 'transport', 'Pamasahe sa palengke',        CURRENT_DATE - 2, 'manual')
) AS v(user_id, type, amount, category, description, transaction_date, source)
WHERE NOT EXISTS (
  SELECT 1 FROM public.transactions t
  WHERE t.user_id = v.user_id
    AND t.transaction_date = v.transaction_date
    AND t.description = v.description
    AND t.deleted_at IS NULL
);

-- ============================================================
-- 6. bir_deadlines — one upcoming filing so the deadlines screen is populated.
--    UNIQUE(user_id, form_name, due_date) WHERE deleted_at IS NULL.
-- ============================================================
INSERT INTO public.bir_deadlines
  (user_id, form_name, due_date, description, status)
VALUES
  (:demo_uid::uuid, '2551Q', date_trunc('quarter', CURRENT_DATE)::date + INTERVAL '4 months 25 days',
   'Quarterly Percentage Tax — para sa nakaraang quarter', 'upcoming'),
  (:demo_uid::uuid, '1701Q', date_trunc('quarter', CURRENT_DATE)::date + INTERVAL '2 months',
   'Quarterly Income Tax Return', 'upcoming')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. ka_conversations — a short Kai chat exchange so the chat screen is not
--    empty on first open. role is the message_role enum ('user'|'assistant').
-- ============================================================
INSERT INTO public.ka_conversations (user_id, role, content, domain)
SELECT v.user_id, v.role::public.message_role, v.content, v.domain
FROM (VALUES
  (:demo_uid::uuid, 'assistant', 'Kumusta, Boss! Ako si Kai, ang business partner mo. Ano’ng maitutulong ko ngayon?', 'general'),
  (:demo_uid::uuid, 'user',      'Magkano na benta ko ngayong linggo?',                                              'general'),
  (:demo_uid::uuid, 'assistant', 'Ayon sa records mo, ₱5,370 ang kabuuang benta ngayong linggo — maganda ’yan, Boss! Steady ang takbo.', 'finance')
) AS v(user_id, role, content, domain)
WHERE NOT EXISTS (
  SELECT 1 FROM public.ka_conversations c
  WHERE c.user_id = v.user_id
    AND c.content = v.content
    AND c.deleted_at IS NULL
);

-- ============================================================
-- DONE. The demo account now has: profile, business profile, 3 check-ins,
-- 6 transactions, 2 BIR deadlines, and a 3-message Kai chat. A reviewer who
-- signs in via /api/demo-login lands on a fully populated app.
-- ============================================================
