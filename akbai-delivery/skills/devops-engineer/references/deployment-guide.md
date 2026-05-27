# AKBai — Deployment Guide
> Reference for: devops-engineer skill
> Last updated: 2026-03-25
> Source: Tech Stack v1, Roadmap v14, Operations Playbook v7

## Table of Contents
1. [CI/CD Pipeline Architecture](#1-cicd-pipeline-architecture)
2. [GitHub Actions Workflow](#2-github-actions-workflow)
3. [Vercel Configuration](#3-vercel-configuration)
4. [Cloudflare Pages Fallback](#4-cloudflare-pages-fallback)
5. [Environment Variables](#5-environment-variables)
6. [Supabase Migration Protocol](#6-supabase-migration-protocol)
7. [Domain Configuration](#7-domain-configuration)
8. [Rollback Procedures](#8-rollback-procedures)
9. [Pre-Deploy Checklist](#9-pre-deploy-checklist)
10. [Post-Deploy Verification](#10-post-deploy-verification)

---

## 1. CI/CD Pipeline Architecture

AKBai uses a GitHub-centric pipeline with Vercel as the deployment platform.

**Flow:**
```
feature branch → push → GitHub Actions (CI) → Vercel preview deploy
                                                      ↓
                                               manual smoke test
                                                      ↓
                                              PR merge to main
                                                      ↓
                                    Supabase migration verification
                                                      ↓
                                       Vercel production deploy
                                                      ↓
                                  Sentry release + post-deploy checks
```

**Branch strategy:**
- `main` — production. Always deployable. Protected branch (require PR, require CI pass).
- `feature/*` — development work. Auto-creates Vercel preview.
- `hotfix/*` — emergency production fixes. Same pipeline but expedited review.

**Why Vercel over Cloudflare Pages (for now):**
The tech-stack.md specifies Cloudflare Pages as the original deploy target (free M1–M6, $5/mo M7+). However, for a Next.js 14 App Router project with server components and API routes, Vercel provides better DX — zero-config deploys, instant rollback, native Next.js support, and preview environments per PR. Cloudflare Pages requires `@cloudflare/next-on-pages` adapter and has limitations with some Next.js features. Use Vercel through Phase 1–2; evaluate Cloudflare Pages as a cost optimization at Month 7+ if Vercel costs exceed $20/mo.

---

## 2. GitHub Actions Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: TypeScript type check
        run: npx tsc --noEmit

      - name: Lint
        run: npm run lint

      - name: Unit tests
        run: npm run test
        env:
          # Test env vars — NOT production values
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}

  migration-check:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Check for pending migrations
        run: |
          # List migration files changed in this push
          MIGRATIONS=$(git diff --name-only HEAD~1 HEAD -- 'supabase/migrations/')
          if [ -n "$MIGRATIONS" ]; then
            echo "::warning::Supabase migrations detected. Verify they've been applied to production before this deploy completes."
            echo "$MIGRATIONS"
            echo "PENDING_MIGRATIONS=true" >> $GITHUB_ENV
          fi
```

**What this catches:**
- TypeScript errors (strict mode — no `any` allowed)
- ESLint violations
- Unit test failures (Vitest — focused on BIR logic, OCR parsing, RLS, payment flows)
- Pending Supabase migrations that need manual verification

---

## 3. Vercel Configuration

### Project Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Link to project (run once)
vercel link

# Deploy to preview (automatic on PR — rarely needed manually)
vercel

# Deploy to production (automatic on main merge — manual only for hotfixes)
vercel --prod
```

### vercel.json

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm ci",
  "regions": ["sin1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(self), microphone=()" }
      ]
    }
  ]
}
```

**Region:** `sin1` (Singapore) — closest Vercel edge to Philippines. Reduces latency for Manila-based users.

### Preview Environments

Every PR auto-creates a preview deployment at `https://<project>-<hash>-<team>.vercel.app`. Preview environments use:
- Separate Supabase project or branch (never production data)
- Test Xendit API keys (sandbox mode)
- Test Anthropic API key (with low spend cap)
- Same Sentry DSN but tagged with `environment: preview`

---

## 4. Cloudflare Pages Fallback

If Vercel costs exceed budget at Month 7+, migrate to Cloudflare Pages:

**Prerequisites:**
- Install `@cloudflare/next-on-pages` adapter
- Test all API routes work under Cloudflare Workers runtime
- Verify Supabase Edge Functions still receive webhooks correctly
- Set up Cloudflare DNS for the domain

**Migration steps:**
1. Add Cloudflare adapter to project
2. Test build locally with `npx @cloudflare/next-on-pages`
3. Deploy to Cloudflare Pages staging
4. Run full E2E test suite (Playwright) against Cloudflare deployment
5. Switch DNS records
6. Monitor for 48 hours
7. Decommission Vercel project

**Cost comparison:**
- Vercel Free: 100GB bandwidth, serverless functions limits
- Vercel Pro: $20/mo — unlimited bandwidth, more function invocations
- Cloudflare Pages: Free (100K function invocations/day), $5/mo Workers Paid for more

---

## 5. Environment Variables

### Required Variables (Vercel Project Settings)

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL          — Supabase project URL (public, safe for client)
NEXT_PUBLIC_SUPABASE_ANON_KEY     — Supabase anonymous key (public, safe for client)
SUPABASE_SERVICE_ROLE_KEY         — Server-side only. NEVER prefix with NEXT_PUBLIC_

# AI
ANTHROPIC_API_KEY                 — Claude API key. Server-side only.

# Payments
XENDIT_SECRET_KEY                 — Xendit API secret. Server-side only.
XENDIT_WEBHOOK_TOKEN              — Webhook verification token. Server-side only.

# Monitoring
NEXT_PUBLIC_SENTRY_DSN            — Sentry Data Source Name (safe for client, per ADR-007)
SENTRY_ORG                        — Sentry organization slug. For source map uploads.
SENTRY_PROJECT                    — Sentry project slug. For source map uploads.
SENTRY_AUTH_TOKEN                 — For source map uploads during build. Server-side only.
NEXT_PUBLIC_POSTHOG_KEY           — PostHog project API key (client-side, public)
NEXT_PUBLIC_POSTHOG_HOST          — PostHog ingestion host (default: https://us.i.posthog.com, public)
POSTHOG_PERSONAL_API_KEY          — PostHog personal API key. Server-side only. NEVER prefix with NEXT_PUBLIC_

# Email
RESEND_API_KEY                    — Resend transactional email. Server-side only.

# App
NEXT_PUBLIC_APP_URL               — Canonical app URL (for OG tags, emails)
```

### Build-time-only Variables (post-Sprint 15)

These are NOT runtime env vars — they switch the build target at `npm run build` time. Do NOT add them to Vercel project settings (Vercel always wants the web build).

```
CAPACITOR_BUILD                   — Set to "1" to produce a Capacitor-targeted static export.
                                    When set: next.config.js enables `output: 'export'`,
                                    `images.unoptimized: true`, and `pageExtensions: ['tsx']`
                                    (excludes all 30 app/api/**/route.ts + src/proxy.ts by extension).
                                    When unset/empty: byte-identical to the prior Vercel web build.
                                    Used only for the Android/iOS native build pipeline (run locally
                                    or on a future native-build CI; never in the Vercel deployment).

NODE_OPTIONS=--use-system-ca      — Windows + corporate-TLS workaround for local builds on Anton's
                                    machine. Required for npm install + next build to trust the
                                    Windows root CA store. Not needed on Vercel.
```

### Capacitor Build Pipeline (Android, Sprint 15+)

The native build runs locally (no CI yet — Sprint 19 may add one). Documented recipe:

```bash
cd frontend

# 1. Produce static export
CAPACITOR_BUILD=1 NODE_OPTIONS=--use-system-ca npm run build

# 2. Copy static bundle into Android scaffold
npx cap sync android

# 3. Build Android binaries (toolchain env vars per SPIKE_FINDINGS.md §Toolchain)
cd android
export ANDROID_HOME="C:\Users\Anton del Rosario\android-sdk"
export JAVA_HOME="C:\Program Files\Microsoft\jdk-21.x-hotspot"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
export JAVA_TOOL_OPTIONS="-Djavax.net.ssl.trustStore=C:/tmp/cacerts21 -Djavax.net.ssl.trustStorePassword=changeit"
./gradlew bundleDebug    # produces app-debug.aab
./gradlew assembleDebug  # produces app-debug.apk
```

Outputs:
- `frontend/android/app/build/outputs/bundle/debug/app-debug.aab` — Play Console upload format
- `frontend/android/app/build/outputs/apk/debug/app-debug.apk` — Sideload to Pixel 5 via `adb install`

Verified Sprint 15: `.aab` = 14.62 MB, `.apk` = 15.35 MB (both well under <30 MB Pre-Launch Gate). **Updated Sprint 16:** `.aab` = 20.75 MB, `.apk` = 24.39 MB (after 5 plugin integrations + Sentry native; still 31% under 30 MB ceiling). Bundle-size guard test at `frontend/src/lib/__tests__/bundle-size-guard.test.ts` runs on every CI pass (gracefully skips when binaries absent).

For full toolchain install instructions (JDK 21 + Android SDK 36 + corporate-TLS keystore patch), see `C:\Users\Anton del Rosario\akbai-spike\SPIKE_FINDINGS.md` §Toolchain install — preserved as forensic reference until Sprint 19 close.

### Sentry Native Crash Symbolication Pipeline (Sprint 16+, executes Sprint 19)

Sprint 16 wired `@sentry/capacitor@4.0.0` alongside the existing `@sentry/nextjs` (downgraded to exact `10.43.0` per Sentry capacitor peer-dep). Same DSN, same Sentry project — events disambiguated via the `sdk.name` field on the envelope. Saved-search `sdk.name:sentry.javascript.nextjs` separates JS errors; `sdk.name:sentry.capacitor` separates native Java/Swift crashes.

**Build-time ProGuard configuration** (`frontend/android/app/build.gradle`, Sprint 16):
```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```
This generates `frontend/android/app/build/outputs/mapping/release/mapping.txt` on every release build. **Debug builds skip ProGuard** — no symbolication artifacts in `bundleDebug` / `assembleDebug`.

**Upload script** (Sprint 16 scaffolding, Sprint 19 execution): `frontend/scripts/upload-symbols.sh` (cross-platform) + `frontend/scripts/upload-symbols.ps1` (Windows). Both:
- Read `SENTRY_AUTH_TOKEN` env var — exit gracefully (logged "skipping upload") if absent
- Invoke `sentry-cli upload-dif --include-sources <mapping.txt | dSYM dir>` for Android (ProGuard) + iOS (dSYM)
- Need `SENTRY_ORG` + `SENTRY_PROJECT` env vars (already set per §5 above)

**Sprint 19 execution checklist:**
1. Generate a Sentry auth token (`Sentry → Settings → Auth Tokens → Create`); add to local env or release CI
2. Run a release-signed build (requires keystore — Sprint 19 work):
   ```bash
   ./gradlew bundleRelease  # produces app-release.aab + mapping/release/mapping.txt
   ```
3. Run the upload script:
   ```bash
   SENTRY_AUTH_TOKEN=<token> bash scripts/upload-symbols.sh
   # OR on Windows:
   $env:SENTRY_AUTH_TOKEN = "<token>"; pwsh scripts/upload-symbols.ps1
   ```
4. **iOS dSYM extraction** requires a Mac with Xcode + an `archive` build (Sprint 19). Same `sentry-cli upload-dif` invocation against the `.dSYM` directory.

**Corporate-TLS note:** if `sentry-cli` hits a TLS handshake failure on Anton's network (same root cause as the Gradle mirror patch in Sprint 14 + the `NODE_OPTIONS=--use-system-ca` npm workaround in Sprint 16), set `SENTRY_HTTPS_PROXY` or invoke `sentry-cli` via PowerShell where the system trust store is honored. Document in CONTRIBUTING.md when Sprint 17 housekeeping lands.

**`.gitignore` entries** (Sprint 16):
- `frontend/android/app/build/outputs/mapping/**` — generated per-build
- `frontend/ios/**/*.dSYM` — generated per-build on Mac
- Anything else under `frontend/android/app/build/` already excluded by Sprint 15's Capacitor-generated `.gitignore`

### Security Rules

- Variables prefixed `NEXT_PUBLIC_` are bundled into the client — only use for genuinely public values
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — extreme care required. Only used in:
  - Xendit webhook handler (needs to update `subscriptions` table for any user)
  - Admin observability queries (Phase 1 post-launch)
- Rotate all non-public secrets every 90 days
- After rotation: redeploy to pick up new values, then revoke old keys
- Never store secrets in `.env` files committed to git. `.env.local` is gitignored for local dev.

### Rotation Schedule

| Secret | Rotation Frequency | How to Rotate |
|--------|-------------------|---------------|
| ANTHROPIC_API_KEY | 90 days | Anthropic Console → API Keys → Create new → Update Vercel → Revoke old |
| SUPABASE_SERVICE_ROLE_KEY | 90 days | Supabase Dashboard → Settings → API → Rotate → Update Vercel |
| XENDIT_SECRET_KEY | 90 days | Xendit Dashboard → Settings → API Keys → Generate → Update Vercel |
| RESEND_API_KEY | 90 days | Resend Dashboard → API Keys → Create → Update Vercel → Delete old |
| SENTRY_AUTH_TOKEN | 180 days | Sentry → Settings → Auth Tokens → Create → Update Vercel |
| POSTHOG_PERSONAL_API_KEY | Annually | PostHog → Settings → Personal API Keys → Create → Update Vercel → Delete old. Low-risk (analytics only, read-only data) but rotate annually as hygiene. |
| NEXT_PUBLIC_POSTHOG_KEY | Annually | PostHog → Project Settings → Project API Key → Regenerate → Update Vercel → Redeploy. Low-risk (analytics write-only, no PII access). |

---

## 6. Supabase Migration Protocol

Supabase migrations are the highest-risk operation in the AKBai deployment pipeline. A bad migration on `transactions`, `subscriptions`, or `receipts` can corrupt financial data.

### Migration Workflow

```
1. Create migration locally
   → supabase migration new <descriptive_name>
   → Write SQL in supabase/migrations/<timestamp>_<name>.sql

2. Test against local Supabase
   → supabase db reset (applies all migrations from scratch)
   → Run unit tests against local DB

3. Test against staging/branch
   → supabase db push --db-url <staging_connection_string>
   → Smoke test the preview deployment against staging DB

4. Apply to production
   → supabase db push --db-url <production_connection_string>
   → Immediately verify:
     - RLS policies intact (test with anon key)
     - Soft-delete columns preserved
     - Triggers firing (created_at, updated_at)
     - No orphaned foreign keys

5. Deploy application code
   → Only after migration is confirmed stable
```

### Migration Safety Rules

- **Never deploy app code that depends on a migration before the migration is applied.** The pipeline is: migration first, then app deploy.
- **Never use `CASCADE DELETE` in migrations.** AKBai uses soft-delete everywhere.
- **Always include a rollback migration.** For every `ALTER TABLE ADD COLUMN`, have a corresponding `ALTER TABLE DROP COLUMN` ready. For data migrations, back up affected rows first.
- **Test RLS after every migration.** A migration that accidentally drops or modifies an RLS policy is a data breach waiting to happen (NPC violation → P0 incident).
- **Lock migrations during incidents.** If there's an active incident, do not apply migrations. Stabilize first.

### Backup Before Migration

```bash
# Export affected tables before risky migration
supabase db dump --data-only --schema public \
  --table transactions,subscriptions,receipts \
  > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 7. Domain Configuration

AKBai does not have an official website or domain yet (Phase 0A). When the domain is acquired:

### DNS Setup (Cloudflare DNS recommended)

```
Type    Name    Value                      Proxy
A       @       76.76.21.21 (Vercel)       Yes (if using CF DNS)
CNAME   www     cname.vercel-dns.com       Yes
```

### SSL

- Vercel provides automatic SSL via Let's Encrypt
- If using Cloudflare DNS proxy: set SSL mode to "Full (Strict)"
- Verify SSL cert covers both apex domain and www subdomain

### When Domain is Ready

1. Add domain in Vercel project settings
2. Configure DNS records
3. Wait for SSL provisioning (usually <5 min)
4. Update `NEXT_PUBLIC_APP_URL` env var
5. Update Supabase Auth redirect URLs
6. Update Xendit webhook URLs
7. Update UptimeRobot monitoring URLs
8. Redeploy

---

## 8. Rollback Procedures

### Instant Rollback (Vercel)

Vercel keeps every deployment as an immutable artifact. Rollback is instant:

```bash
# List recent deployments
vercel ls

# Promote a previous deployment to production
vercel promote <deployment-url>
```

This takes effect in seconds. No rebuild, no downtime.

### When to Roll Back

- New errors spiking in Sentry after deploy
- UptimeRobot reports DOWN within 5 minutes of deploy
- Users reporting broken functionality (if caught quickly)
- PostHog shows sudden drop in key metrics (page loads, receipt scans)

### Rollback Decision Tree

```
New deploy goes out
       ↓
Is Sentry showing new errors? ──Yes──→ Roll back immediately
       ↓ No
Is UptimeRobot showing DOWN? ──Yes──→ Roll back immediately
       ↓ No
Is the deploy preview-tested?  ──No──→ Roll back and investigate
       ↓ Yes
Monitor for 30 minutes ──Problems?──→ Roll back
       ↓ No problems
Deploy is stable ✓
```

### Migration Rollback

If a database migration causes issues:

1. **Do NOT roll back the Vercel deployment first** — the app code may depend on the migration
2. Apply the prepared rollback migration to Supabase
3. Verify data integrity
4. Then roll back the Vercel deployment if needed
5. Investigate root cause before re-attempting

---

## 9. Pre-Deploy Checklist

Run through this before every production deployment:

```
□ All CI checks passing (TypeScript, lint, tests)
□ Preview deployment tested manually
□ Supabase migrations applied and verified (if any)
□ RLS policies verified after migration (if any)
□ No new CRITICAL Sentry errors in current production
□ UptimeRobot shows all monitors UP
□ Environment variables updated (if needed for new features)
□ Sentry release tag prepared (git commit SHA)
□ Rollback plan identified (previous deployment URL noted)
```

---

## 10. Post-Deploy Verification

Within 5 minutes of production deploy:

```
□ App loads at production URL
□ Auth flow works (magic link / OTP)
□ Sentry release tag visible in Sentry dashboard
□ No new error spike in Sentry
□ UptimeRobot confirms UP
□ Xendit webhook endpoint responding (check UptimeRobot monitor)
□ PostHog receiving events
□ Test one receipt scan (if Resibo Scanner is live)
□ Test one KA conversation (if chat is live)
```

If any check fails → initiate rollback per Section 8.
