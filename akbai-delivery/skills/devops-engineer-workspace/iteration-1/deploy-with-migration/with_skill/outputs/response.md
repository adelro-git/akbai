# Deploying Resibo Scanner with Supabase Migration — Complete Walkthrough

Hey Anton! You've merged the Resibo Scanner PR with a new receipts table migration. Let me walk you through the safe deployment path — this is a financial feature, so we need to verify migrations before pushing any code to production.

---

## Pre-Deploy Checklist (Do This First)

Before we touch production, let's verify the foundation is solid:

### 1. Verify CI Pipeline Passed

```bash
# Check GitHub Actions status on the merged PR
# All of these must be green:
□ TypeScript type check
□ ESLint lint
□ Vitest unit tests
□ Migration detection warning (should be ACTIVE)
```

**Why this matters:** If the CI pipeline caught any TypeScript errors or test failures, we deploy those bugs. A type error in the receipt scanning API could cause the scanner to crash silently.

---

### 2. Test the Preview Deployment

The Vercel preview URL was already created when you opened the PR. Before merging, you should have tested it manually:

```bash
# What you did (or should have done):
□ Clicked the Vercel preview URL
□ Tested the receipt camera flow end-to-end
□ Scanned a real receipt
□ Verified the expense card appears in "Saan Napunta"
```

If you didn't do this yet: **do not proceed.** A solo founder can't afford QA bugs shipping to paying users. Go back, test the preview against your staging Supabase, then come back here.

---

### 3. Understand the Migration

You have a new Supabase migration that adds the `receipts` table. Let me verify it's safe:

```sql
-- Expected migration pattern (verify this in supabase/migrations/):
CREATE TABLE public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Receipt metadata
  merchant_name TEXT,
  amount_php NUMERIC(10, 2) NOT NULL,
  scan_date TIMESTAMPTZ NOT NULL,
  receipt_image_path TEXT NOT NULL,  -- Points to Supabase Storage

  -- Extracted data from Claude
  category TEXT,
  items JSONB,  -- Array of { description, price }

  -- Soft delete (required)
  deleted_at TIMESTAMPTZ,

  -- Audit columns (required)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (required)
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can only see their own receipts
CREATE POLICY "Users can read own receipts"
  ON public.receipts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receipts"
  ON public.receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own receipts"
  ON public.receipts FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger: auto-update updated_at
CREATE TRIGGER receipts_updated_at
  BEFORE UPDATE ON public.receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Check these three things:**

1. **RLS is enabled:** Without it, users can see each other's receipts = NPC violation = P0 incident
2. **Soft delete column exists:** We never hard-delete receipt data. If a user accidentally scans the wrong receipt, they delete it — but we need an audit trail
3. **Triggers are set up:** `created_at` and `updated_at` must auto-populate

If your migration is missing any of these → **STOP. Fix the migration first.**

---

## Migration Deployment Flow

This is the critical part. The deployment sequence is **migration first, then code**:

### Step 1: Apply Migration to Production Supabase

```bash
# First, backup the transactions, subscriptions, and receipts tables
supabase db dump --data-only --schema public \
  --table transactions,subscriptions,receipts \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# Then apply the migration to production
supabase db push --db-url "$PRODUCTION_DB_URL"

# What happens:
# - Supabase applies the migration SQL sequentially
# - The receipts table is created
# - RLS policies are applied
# - Triggers are initialized
```

**Expected output:**
```
✓ Migrations applied successfully
✓ receipts table created
✓ RLS policies enabled
```

### Step 2: Verify Migration in Production

This is **critical** — do not skip this:

```bash
# Login to Supabase Dashboard
# → Project Settings → Database

# Check the receipts table
□ Schema: id, user_id, merchant_name, amount_php, scan_date, receipt_image_path,
          category, items, deleted_at, created_at, updated_at
□ RLS enabled: Row Level Security should show "ON"
□ RLS policies: Three policies should exist
  - "Users can read own receipts"
  - "Users can insert own receipts"
  - "Users can update own receipts"

# Test RLS with a quick query (in Supabase SQL Editor):
SELECT * FROM public.receipts;
-- With anon key, this should return 0 rows (RLS working ✓)
```

**Why this verification step is essential:** A migration that silently drops an RLS policy will let every user see every other user's receipts. This is a data breach. AKBai handles financial data. You cannot deploy without confirming RLS is enforced.

---

### Step 3: Deploy Application Code to Production

Only after the migration is confirmed stable, deploy the Next.js code:

```bash
# Promote the main branch to production
vercel --prod

# Or use Vercel CLI:
vercel promote <deployment-url-from-preview>

# What happens:
# - Next.js 14 app rebuilds with production env vars
# - API routes load the SUPABASE_SERVICE_ROLE_KEY
# - Receipt scan endpoint is now live
```

**Expected output:**
```
✓ Deployment complete
✓ Production URL: https://<akbai-domain>
✓ Build time: ~2–3 min
```

---

## Post-Deploy Verification (Run Within 5 Minutes)

The deployment is live, but is it working? Check these:

### 1. Health Checks

```bash
# Is the app responding?
curl -I https://<akbai-domain>
# Expected: HTTP 200

# Is the auth page loading?
# Check: Can you see the login screen?

# Is Supabase connected?
# Check: Can you sign up and receive magic link?
```

### 2. Sentry Release Tag

```bash
# Tag this deploy in Sentry so we can track errors to this version
vercel ls  # Get the commit SHA from the production deployment

# Or manually:
# → Sentry Dashboard → Releases → Create Release
# Enter: git commit SHA of the merged PR
# This links any errors post-deploy back to "Resibo Scanner merged"
```

### 3. Smoke Test: Resibo Scanner

```bash
# Using a test account:
□ Navigate to Resibo Scanner
□ Take a photo of a real receipt (or use a test receipt image)
□ Verify the OCR processing starts
□ Wait for Claude Haiku to process the image (~3–5 sec)
□ Check that the expense card appears with:
  - Merchant name
  - Amount in ₱
  - Category assignment
  - Linked to the right business profile
□ Verify the receipt appears in "Saan Napunta" dashboard
□ Check Supabase: Receipt row should be inserted into `receipts` table with correct user_id
```

### 4. Monitor for Errors

```bash
# Sentry Dashboard
□ No spike in errors in the last 5 minutes
□ Specifically: no "receipts table not found" errors
□ No RLS policy violation errors

# UptimeRobot
□ All monitors showing UP
□ Xendit webhook endpoint responding

# PostHog
□ Events flowing in (receipt_scanned, expense_created, etc.)
□ No unusual traffic anomalies
```

### 5. Database Sanity Check

```bash
# In Supabase SQL Editor, as a verified test user:
SELECT COUNT(*) FROM public.receipts WHERE user_id = '<test-user-uuid>';
-- Should return 1 (the test receipt we just scanned)

# RLS verification:
-- With SERVICE_ROLE_KEY (backend):
SELECT COUNT(*) FROM public.receipts;
-- Should show all receipts (all users)

-- With ANON_KEY (frontend) as test-user:
SELECT COUNT(*) FROM public.receipts;
-- Should show 1 (only their own)
```

---

## What Can Go Wrong (Incident Protocols)

### Scenario 1: RLS Policy Not Applied

**Symptom:** All users can see all receipts after deploy.

**Response (P0 Incident):**
```bash
# IMMEDIATE: Roll back the Vercel deployment
vercel promote <previous-stable-deployment>

# Then: Fix the migration RLS policies in Supabase
# → Drop the broken table
# → Re-apply the corrected migration
# → Verify RLS again
# → Re-deploy the app code

# This prevents user data exposure
```

### Scenario 2: Migration Syntax Error

**Symptom:** Supabase deployment fails with SQL error. Receipts table doesn't exist.

**Response:**
```bash
# The migration FAILED to apply
# App code is now BROKEN (endpoints expect receipts table)

# Fix:
# 1. Write a new migration that fixes the SQL
# 2. Apply it to production
# 3. Re-deploy app code

# This is why we verify RLS before deploying code
```

### Scenario 3: App Code Depends on Migration Before Migration Applied

**Symptom:** App tries to INSERT into receipts table, but table doesn't exist. 500 error.

**Response:**
```bash
# This should never happen if we follow the flow:
# Migration FIRST → App Code SECOND

# If it does happen:
# 1. Roll back app code to previous deployment
# 2. Apply the migration
# 3. Deploy the app code again
```

---

## Cost Impact of This Deploy

Resibo Scanner uses Claude Haiku Vision for OCR:

- **Cost per receipt scan:** ₱0.16 ($0.0028 USD)
- **Cost in context:** Pro tier ($399/mo) includes 50 scans/month
  - At 50 scans: ₱8 API cost
  - LTV: ₱9,975
  - Gross margin: ~85%
  - Break-even: Month 7

**Monitor spending:** If a user scans 500 receipts in one sitting, API cost = ₱80. This is unsustainable at free tier. The circuit breaker should prevent this — verify it's active.

---

## Post-Deploy Monitoring (Next 24 Hours)

### Hour 1: Active Monitoring
```bash
# Check Sentry every 5–10 minutes for new errors
# Check UptimeRobot for downtime
# Check PostHog for traffic anomalies
# Be ready to roll back if something goes wrong
```

### Hour 2–24: Continued Observation
```bash
# Keep Sentry dashboard open
# Monitor receipts table growth:
SELECT COUNT(*) FROM public.receipts;
-- Should match number of users who tested the feature

# Check for slow queries:
-- RLS policies can add latency if poorly indexed
-- Monitor PostgreSQL query performance in Supabase
```

---

## Final Checklist Before You Consider This Deploy "Complete"

```
□ CI pipeline passed (TypeScript, lint, tests)
□ Preview deployment smoke tested
□ Migration applied to production Supabase
□ RLS policies verified (anon key isolation confirmed)
□ Soft-delete column present in receipts table
□ Triggers for created_at/updated_at initialized
□ App code deployed to production
□ Sentry release tag created
□ Health checks passing (app loads, auth works)
□ Receipt scanner smoke test successful
□ No error spike in Sentry
□ UptimeRobot showing all monitors UP
□ PostHog receiving events
□ Database sanity check: receipts table populated correctly
□ RLS working: test user can only see their own receipts
```

All green? **Deploy is done.** The Resibo Scanner is now live for production users.

---

## Rollback Decision Tree (If Something Goes Wrong)

```
Post-deploy, is Sentry showing NEW errors?
  → YES: Immediately roll back to previous deployment
  → NO: Continue

Is UptimeRobot showing app DOWN?
  → YES: Immediately roll back
  → NO: Continue

Can you scan a receipt and see it in the dashboard?
  → NO: Roll back and investigate
  → YES: Continue

Is there an RLS violation (users seeing other users' receipts)?
  → YES: Roll back IMMEDIATELY (P0 data breach)
  → NO: Monitor for 30 minutes

All checks pass → Deploy is stable ✓
```

---

## Questions? Contact Your DevOps Engineer

This deployment path is designed for a solo founder with a day job. If you hit any snags:

1. **Pre-deploy failure:** Stop. Fix the issue. Don't force it.
2. **Migration failure:** Restore from backup. Investigate. Fix migration SQL. Try again.
3. **Post-deploy incident:** Roll back. Assess. Fix the code or DB. Redeploy.

The goal: **Zero downtime, zero data loss, zero user friction.**

Safe sailing! 🚀
