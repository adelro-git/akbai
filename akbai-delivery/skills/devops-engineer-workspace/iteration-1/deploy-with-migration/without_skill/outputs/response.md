# Deploying Resibo Scanner to Production: Complete Guide

**Context:** You've merged a PR adding the Resibo Scanner feature with a new Supabase migration for the receipts table. AKBai uses Next.js 14, Supabase, and deploys to Cloudflare Pages.

---

## Pre-Deployment Checklist

Before you proceed, verify:

- [ ] PR has been reviewed and merged to `main`
- [ ] All tests pass locally: `npm run test`
- [ ] No console errors in build output: `npm run build`
- [ ] Migration file is committed to version control
- [ ] Environment variables are set in Cloudflare Pages (if any new secrets added)
- [ ] You have Supabase CLI installed: `brew install supabase/tap/supabase` or `npm install -g supabase`

---

## Step 1: Run the Supabase Migration Locally (Validation)

Before pushing to production, validate the migration works locally.

### 1a. Connect to your local Supabase instance

```bash
# Start Docker-based Supabase stack locally (if not running)
supabase start

# This outputs connection details — save the DB URL
```

### 1b. Apply the migration locally

```bash
# From project root
supabase migration list  # See all migrations

# Apply latest migrations
supabase db push

# Verify the receipts table was created
supabase db diff --dry-run  # Shows what would change in prod
```

### 1c. Validate the schema

```sql
-- Connect to local Supabase and run:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'receipts';

-- Verify RLS is enabled
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'receipts';
```

Expected schema for `receipts` table (based on AKBai architecture):
```sql
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  file_path TEXT NOT NULL,           -- Supabase Storage path
  original_filename TEXT,
  amount_php NUMERIC(10, 2),          -- Parsed amount from Claude OCR
  vendor_name TEXT,                   -- Store/vendor name
  category TEXT,                      -- Expense category
  receipt_date DATE,                  -- Date on receipt
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL,        -- Soft-delete support
  raw_claude_output JSONB             -- Full Claude response for audit
);

-- RLS Policies (required)
CREATE POLICY "Users can read own receipts"
  ON receipts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receipts"
  ON receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own receipts"
  ON receipts FOR UPDATE
  USING (auth.uid() = user_id);
```

---

## Step 2: Deploy to Cloudflare Pages

AKBai is hosted on Cloudflare Pages (free tier M1–M6, $5/mo M7+). Here's the deployment flow:

### 2a. Trigger the build

```bash
# Push to main (or PR already merged)
git push origin main

# Cloudflare Pages auto-triggers build via webhook
# Monitor progress: https://dash.cloudflare.com
# → Pages → AKBai → Deployments
```

### 2b. Check build status in Cloudflare dashboard

**Link:** https://dash.cloudflare.com → Pages → Your project → Deployments

Expected flow:
1. **Build logs** — Next.js compilation, dependency install
2. **Preview deployment** — Temporary URL (e.g., `[hash].akbai.pages.dev`)
3. **Production deployment** — Live at your custom domain (once build succeeds)

**If build fails:**
- Click the deployment → **View build logs**
- Look for TypeScript errors, missing environment variables, or dependency issues
- Common causes: Supabase client imports, Claude API key missing, type errors
- Fix locally, re-test with `npm run build`, commit, and re-push

### 2c. Verify environment variables in Cloudflare Pages

```bash
# Ensure these are set in Cloudflare Pages settings:
# Settings → Environment Variables

ANTHROPIC_API_KEY                  # Claude API key
NEXT_PUBLIC_SUPABASE_URL          # Public Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Public anon key
SUPABASE_SERVICE_ROLE_KEY          # Private — server-side only
XENDIT_SECRET_KEY                  # Xendit API key
XENDIT_WEBHOOK_TOKEN              # Webhook validation
SENTRY_DSN                         # Error tracking (optional)
NEXT_PUBLIC_POSTHOG_KEY            # Analytics (optional)
RESEND_API_KEY                     # Email service
```

**Note:** Prefix `NEXT_PUBLIC_` means the value is exposed in the browser. Never add `NEXT_PUBLIC_` to sensitive keys (API keys, service role keys).

---

## Step 3: Run the Supabase Migration in Production

Once the Cloudflare Pages deployment is live, migrate the production database.

### 3a. Connect to production Supabase

```bash
# Authenticate with Supabase CLI
supabase projects list

# You should see your prod project. Note the project ID.
```

### 3b. Apply the migration to production

```bash
# Replace PROJECT_ID with your actual Supabase project ID
supabase db push --project-id <PROJECT_ID>

# The CLI will:
# 1. Compare local migrations against prod
# 2. Display what will change
# 3. Ask for confirmation
# 4. Execute the migration
```

### 3c. Verify the migration succeeded

```bash
# Check migration status
supabase migration list --project-id <PROJECT_ID>

# Verify the receipts table exists in prod
supabase db remote-ls --project-id <PROJECT_ID>
```

**Expected output:** The receipts table appears in the table list.

---

## Step 4: Validate the Live Deployment

Now that code and schema are live, test the feature end-to-end.

### 4a. Test the Resibo Scanner flow

1. Go to your live AKBai app: `https://your-domain.com`
2. Log in as a test user
3. Navigate to **Resibo Scanner** feature
4. Upload a receipt image (or take a photo if on mobile PWA)
5. Verify the Claude OCR processes the image
6. Check the parsed data appears in the UI
7. Click **Save receipt**
8. Verify the receipt shows in **Saan Napunta** (expense dashboard)

### 4b. Check Supabase for the stored record

```bash
# Via Supabase dashboard:
# https://app.supabase.com → Select project → SQL Editor → Run:

SELECT * FROM receipts
WHERE user_id = 'test-user-id'
ORDER BY created_at DESC;
```

You should see:
- Receipt metadata (vendor, amount, date, category)
- File path pointing to Supabase Storage
- RLS enforced (you can't see other users' receipts)
- Raw Claude output logged in `raw_claude_output` column

### 4c. Monitor errors in Sentry

1. Go to **https://sentry.io** → Select AKBai project
2. Filter for recent errors in the last 30 minutes
3. Look for:
   - `Claude API errors` (OCR failures)
   - `Supabase RLS violations` (permissions issues)
   - `Storage upload failures` (file save errors)
4. If errors exist, note the error type and stack trace

### 4d. Check database health

```bash
# Via Supabase dashboard, go to Reports or Logs:
# Monitor: Database CPU, connection count, query performance
```

---

## Step 5: Post-Deployment Monitoring (First 24 Hours)

### 5a. Set up alerts

Ensure these monitoring alerts are active in your stack:

**Sentry:**
- Alert on new errors (Slack or email)
- Release tag: `git rev-parse --short HEAD` (should match this deployment)

**UptimeRobot (if configured):**
- Monitor the Cloudflare Pages URL
- Alert if site returns non-200 status

**Supabase:**
- Monitor connection count (spike = problem)
- Monitor slow queries (filter for `receipts` table)

### 5b. Check logs for warnings

```bash
# Supabase logs (SQL queries, Edge Functions):
# https://app.supabase.com → project → Logs

# Look for:
# - RLS policy violations (ERROR level)
# - Claude API timeouts (WARN level)
# - Storage upload failures (ERROR level)
```

### 5c. Spot-check user data

Load a few real test transactions and verify:
- Receipts are scanned successfully
- Amounts are parsed correctly
- Categories are auto-assigned
- Data is encrypted at rest (Supabase handles this)

---

## Step 6: Rollback Plan (If Critical Issues Arise)

If the deployment breaks critical functionality:

### 6a. Rollback the code (Cloudflare Pages)

1. Go to **https://dash.cloudflare.com** → Pages → Deployments
2. Click the **previous working deployment**
3. Click **Rollback to this deployment**
4. Cloudflare instantly serves the previous version

### 6b. Rollback the migration (if schema broke things)

```bash
# This is destructive — only if truly necessary:
supabase migration repair --status reverted

# Or, manually run a rollback script:
# (You should have created a down/rollback migration)
supabase db reset

# Then re-apply migrations up to the previous version
```

**⚠️ Warning:** Rolling back a migration will:
- Drop the receipts table (and all data!)
- Lose any receipts users scanned during the window
- Require a manual data recovery from backups

**Better approach:** Deploy a **hotfix migration** that:
- Adds a `disabled` flag to the receipts table
- Disables the Resibo Scanner UI in code (feature flag)
- Keeps user data intact

---

## Common Deployment Issues & Fixes

| Issue | Symptom | Fix |
|-------|---------|-----|
| **Missing env var** | Build fails with "ReferenceError: process.env.X is undefined" | Check Cloudflare Pages Settings → Environment Variables. Add the missing key. Rebuild. |
| **RLS blocking inserts** | "new row violates row-level security policy" | Verify RLS policy allows `INSERT` and `auth.uid()` is set. Check user is authenticated. |
| **Storage path invalid** | "Storage object not found" error | Ensure the file_path in receipts table matches the actual Supabase Storage bucket path. Format: `bucket/user_id/filename` |
| **Claude API timeout** | Receipt upload hangs for 30+ seconds | Check ANTHROPIC_API_KEY is valid. Verify quota not exceeded. Add timeout handling (30s max). |
| **Type errors in build** | "Property 'amount' does not exist on type 'Receipt'" | Run `npm run build` locally. Fix TypeScript errors. Commit and re-push. |
| **Database connection refused** | Supabase down or connection string invalid | Check SUPABASE_SERVICE_ROLE_KEY is set. Verify Supabase project is running. |

---

## Post-Deployment Checklist

After the deployment is live and stable:

- [ ] Resibo Scanner captures receipts end-to-end
- [ ] Receipts appear in database with correct RLS scoping
- [ ] Claude OCR parses amounts, vendors, categories correctly
- [ ] Sentry shows no new error spikes
- [ ] Database query performance normal (< 100ms average)
- [ ] Storage bucket has receipt files (check Supabase Storage)
- [ ] No failed Xendit or Resend webhooks in logs
- [ ] Cloudflare Pages deployment shows green "Success" status
- [ ] Mobile PWA works on slow 4G connections (offline caching)
- [ ] User can view receipts in Saan Napunta dashboard

---

## Next Steps (After Validation)

1. **Announce to waitlist** — Let early testers know Resibo Scanner is live
2. **Monitor for 48 hours** — Watch Sentry and database metrics
3. **Collect feedback** — Email/Slack early users asking "How's the scan quality?"
4. **Iterate** — If OCR confidence is low, refine Claude prompt or add manual corrections UI
5. **Update docs** — Add Resibo Scanner to in-app onboarding and help articles

---

## Key Contacts & Resources

| Resource | Link | Use Case |
|----------|------|----------|
| Cloudflare Pages Docs | https://developers.cloudflare.com/pages/ | Build/deploy troubleshooting |
| Supabase CLI Docs | https://supabase.com/docs/guides/cli | Migration & DB management |
| Next.js Build Docs | https://nextjs.org/docs/app/api-reference/config/next-config-js | Config issues |
| Claude API Docs | https://docs.anthropic.com/claude/reference/getting-started-with-the-api | OCR/API issues |
| Sentry Dashboard | https://sentry.io | Error monitoring |
| Xendit Webhook Logs | https://dashboard.xendit.co | Payment webhook status |

---

## Deployment Timeline

**Typical flow (assume no errors):**
- Push to main → **3–5 minutes** (Cloudflare Pages build)
- Migration validation locally → **2 minutes**
- Production migration via Supabase CLI → **1–2 minutes**
- Full validation & testing → **10–15 minutes**
- **Total: 20–30 minutes end-to-end**

If you hit errors, add 15–30 minutes for debugging & fix/re-deploy cycles.

---

## Summary

You've deployed Resibo Scanner to production by:
1. ✅ Validating the migration locally
2. ✅ Deploying code via Cloudflare Pages auto-build
3. ✅ Running the Supabase migration in production
4. ✅ Testing the feature end-to-end
5. ✅ Monitoring for errors with Sentry
6. ✅ Having a rollback plan ready

The feature is now live. Keep an eye on error rates, database performance, and user feedback over the next 48 hours. If OCR quality issues emerge, consider refining the Claude prompt or adding a manual review step.

Good luck with the launch! 🚀
