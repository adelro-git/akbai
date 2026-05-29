# AKBai — Deployment Guide
> Reference for: devops-engineer skill
> Last updated: 2026-05-29 (Sprint 18 doc sweep — added CRON_SECRET + Vercel deadline-notifications cron, demo-mode env vars, `@capacitor/splash-screen`/`@capacitor/filesystem` install note)
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

### RevenueCat IAP Variables (Sprint 17+, real values Sprint 19)

Sprint 17 wired `@revenuecat/purchases-capacitor@13.1.2` + `/api/webhooks/revenuecat` end-to-end with **placeholder** credentials. The Sprint 19 enrollment wave rotates each to real production values from the RevenueCat dashboard (after Apple Developer Program + Google Play Console enrollment + RevenueCat project setup land).

```
NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY    — Public Apple-side RevenueCat SDK API key. Identifies
                                          the iOS app to RevenueCat (NOT the developer account);
                                          intentionally public per RevenueCat docs — safe to
                                          ship in the native bundle. Read by
                                          `lib/iap/configure.ts → initRevenueCat()` at app
                                          boot when `Capacitor.getPlatform() === 'ios'`.

NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY   — Public Google-side equivalent. Same role for the
                                          Android target; read on `'android'` platform.

REVENUECAT_WEBHOOK_AUTH                 — Server-side shared secret. Used by
                                          `/api/webhooks/revenuecat/route.ts →
                                          verifyWebhookSignature()` for constant-time compare
                                          against `Authorization: Bearer <secret>` header.
                                          Fail-closed on missing env var. Sprint 17 placeholder:
                                          `placeholder_webhook_secret_sprint17_change_before_prod`.
                                          Sprint 19 rotates to real shared secret configured
                                          in the RevenueCat dashboard webhook settings.

REVENUECAT_REST_API_KEY                 — Server-side Bearer token for the RevenueCat REST API
                                          (`GET /v1/subscribers/{app_user_id}`). Used by
                                          `lib/iap/server-entitlements.ts →
                                          fetchEntitlementsFromRevenueCat()` for entitlement
                                          lookups (resolves Open Q 3a — lifetime + pro
                                          coexistence at the entitlement-list level).
                                          Sprint 17 path: missing key falls back to
                                          `{ tier: 'free' }` (pure default; no error).
                                          Sprint 19 wires the real key.
```

**Where set, per target:**

| Var | Vercel (web target) | `capacitor.config.ts` / native bundle | Notes |
|-----|---------------------|---------------------------------------|-------|
| `NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY` | Optional (web no-op via `Capacitor.isNativePlatform()` guard) | Required — baked into static export at `npm run build` with `CAPACITOR_BUILD=1` | Public; safe in native bundle |
| `NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY` | Optional (same web no-op) | Required — baked into static export at native build time | Public; safe in native bundle |
| `REVENUECAT_WEBHOOK_AUTH` | **Required** — webhook is a Vercel server route | N/A (server-only; never reaches native bundle) | Server-side secret; rotate on dashboard secret change |
| `REVENUECAT_REST_API_KEY` | **Required** — REST helper is server-only | N/A (server-only) | Server-side secret; Sprint 17 missing-key path is graceful |

`NEXT_PUBLIC_*` vars are bundled at build time (not runtime). For the native build, that means values must be present in the env at `CAPACITOR_BUILD=1 npm run build` time before `npx cap sync android` copies the static export into the Android scaffold. Sprint 19 update procedure: rotate dashboard → update Vercel env (web routes) AND rebuild native artifacts with new values → re-submit to App Store / Play.

Gradle layer: no RevenueCat keys go into `frontend/android/gradle.properties` or `frontend/android/app/build.gradle`. The SDK reads keys from JS at runtime via `Purchases.configure({ apiKey })`. The only Android-side build dependency from RevenueCat is the Maven artifact `com.revenuecat.purchases:purchases-hybrid-common:18.7.0`, fetched transitively by `npx cap sync android` (see "Capacitor Build Pipeline" below for the corporate-TLS gotcha Sprint 17 surfaced).

### Cron & Demo-Mode Variables (Sprint 18+)

Sprint 18 wired the push 7/3/1-day BIR deadline scheduler and a reviewer/guest demo mode. Both add server-side env vars.

```
CRON_SECRET                       — Server-side shared secret. Used by
                                    /api/cron/deadline-notifications to authenticate the
                                    Vercel Cron invocation via constant-time Bearer compare
                                    (Authorization: Bearer <secret>), same pattern as the
                                    Xendit + RevenueCat webhook handlers. Fail-closed on
                                    missing env. Vercel Cron automatically sends this header
                                    when CRON_SECRET is set in project env — no manual wiring.

AKBAI_DEMO_MODE_ENABLED           — Server-side gate for /api/demo-login (reviewer/guest
                                    account). DEFAULT OFF: route is fail-closed and rejects
                                    unless this is explicitly "true". NOT NEXT_PUBLIC_*.
                                    Leave UNSET in production unless building a dedicated
                                    store-review artifact. Triple-gated (env flag + seeded
                                    account match + environment guard) — see
                                    security-architecture.md §10.5.
```

**Pre-submission hygiene (release-blocking):** before any App Store / Play Console submission, confirm BOTH `AKBAI_DEMO_MODE_ENABLED` and the dev-auth `SKIP_AUTH` / `NEXT_PUBLIC_SKIP_AUTH` flags are off/unset in the production native build. A reachable auth bypass in a shipped artifact is a release blocker. (Sprint 18 action item #6.)

### Vercel Cron — BIR Deadline Notifications (Sprint 18)

The push 7/3/1-day deadline scheduler (trigger logic existed since Build 6 but was never invoked) is now driven by a Vercel Cron entry in `frontend/vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/deadline-notifications", "schedule": "0 1 * * *" }
  ]
}
```

- **Schedule** is UTC (Vercel Cron is UTC-only). `0 1 * * *` = 01:00 UTC = **09:00 Asia/Manila** — the intended 9 AM PHT send window. When editing the schedule, always convert from PHT to UTC by subtracting 8 hours; the route itself still computes deadline windows in Manila time via `lib/timezone`.
- **Auth:** the route validates the `Authorization: Bearer <CRON_SECRET>` header Vercel injects; unauthenticated calls are rejected fail-closed.
- **Cron crons are a Vercel-server concern only** — the Capacitor native build excludes all `/api/*` routes (`pageExtensions: ['tsx']`), so the cron lives exclusively on the Vercel web deployment. Do not expect it to run inside the native bundle.

### Capacitor plugin installs deferred to Sprint 19

Sprint 18 landed config for two plugins but deferred their `npm install` + `cap sync` to Sprint 19 (so they are config-complete but inert until installed):

- **`@capacitor/splash-screen`** — the `SplashScreen` block in `capacitor.config.ts` is configured but the plugin must be installed before it takes effect on device.
- **`@capacitor/filesystem`** — required for full offline receipt-image persistence in the offline scan queue (`lib/ocr/offline-queue.ts`); current queue logic is in place but durable native image storage needs this plugin.

Install both via the Sprint 16 corporate-TLS recipe (`$env:NODE_OPTIONS = "--use-system-ca"` then `npm install`), then `npx cap sync android`, then re-run the bundle-size guard (each plugin adds to the `.aab`; budget against the 30 MB Pre-Launch Gate). Update the "Plugin count after `cap sync android`" list below when installed.

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

Verified Sprint 15: `.aab` = 14.62 MB, `.apk` = 15.35 MB (both well under <30 MB Pre-Launch Gate). **Updated Sprint 16:** `.aab` = 20.75 MB, `.apk` = 24.39 MB (after 5 plugin integrations + Sentry native; still 31% under 30 MB ceiling). **Updated Sprint 17:** `.aab` = 23.27 MB (+2.52 MB), `.apk` = 29.39 MB (+5.00 MB fat debug) after `@revenuecat/purchases-capacitor@13.1.2` + Google Play Billing + transitive Kotlin stdlib bumps. Architect's bundle-size-guard ceiling still 30 MB (Pre-Launch Gate) — Sprint 17 closed 🟡 YELLOW on bundle-size-only criterion (0.27 MB over architect <23 MB flexible target; 22% under 30 MB hard gate). **Sprint 18 architect re-review recommendation:** revise sensible ceiling to **28 MB** to retain meaningful headroom against the 30 MB Pre-Launch Gate (current 23.27 MB has ~6.7 MB slack; planned Sprint 18 G6 Kai character integration will consume part of that). Bundle-size guard test at `frontend/src/lib/__tests__/bundle-size-guard.test.ts` runs on every CI pass (gracefully skips when binaries absent).

**Plugin count after `cap sync android`:**
- Sprint 15 baseline: 1 plugin (`@capacitor/preferences`)
- Sprint 16 added 5: `@capacitor/camera`, `@capacitor/push-notifications`, `@aparajita/capacitor-biometric-auth`, `@capacitor/app` (deep linking), `@sentry/capacitor` → **6 total**
- Sprint 17 added 1: `@revenuecat/purchases-capacitor@13.1.2` → **7 total**

For full toolchain install instructions (JDK 21 + Android SDK 36 + corporate-TLS keystore patch), see `C:\Users\Anton del Rosario\akbai-spike\SPIKE_FINDINGS.md` §Toolchain install — preserved as forensic reference until Sprint 19 close.

### First-time gradle setup (Windows + corporate TLS) — Sprint 17 update

The Capacitor pipeline above assumes a configured local environment. Two-layer corporate-TLS recipe has now been documented across Sprint 16 (npm side) and Sprint 17 (JVM/gradle side). Anton's machine is the reference; document in CONTRIBUTING.md as Sprint 16 carry-over still tracks (see "Open carry-overs" below).

**Per-shell (or user env) — NOT covered by the gradle.properties fix:**
```powershell
$env:JAVA_HOME    = "C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot\"
$env:ANDROID_HOME = "C:\Users\Anton del Rosario\android-sdk\"
$env:PATH         = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
```

**npm side (Sprint 16 DRIFT-4 recipe):**
```powershell
$env:NODE_OPTIONS = "--use-system-ca"   # Node 22.10+; delegates TLS to Windows root CA store
```
Needed for `npm install` + `next build` (including `CAPACITOR_BUILD=1` static export) on the corporate network. Persists for the shell session; can be added to user env vars for permanence.

**JVM/Gradle side (Sprint 17 DRIFT, NEW):**
Persisted in repo at `frontend/android/gradle.properties` (commit `712c729`):
```properties
systemProp.javax.net.ssl.trustStoreType=Windows-ROOT
```
JVM-layer analog of the Sprint 16 npm recipe. Tells the JDK to delegate TLS trust to the Windows root CA store (which has the corporate root CA enrolled) instead of the bundled JDK `cacerts` (which does not). Required for the first fresh Maven fetch of the RevenueCat artifact `com.revenuecat.purchases:purchases-hybrid-common:18.7.0`. **Why Sprint 16's gradle build didn't surface this:** all Sprint 16 Capacitor plugins resolved entirely from `~/.gradle/caches/` (warmed during the Sprint 14 conversion spike). Sprint 17's RevenueCat Maven coordinate was the first uncached fetch under the corporate-TLS environment, exposing the gap.

This setting is now in-repo, so no per-shell action is required for the gradle side going forward. Only `JAVA_HOME` + `ANDROID_HOME` + `NODE_OPTIONS` remain as per-shell / user-env requirements.

**Open carry-overs (Sprint 16 → 17 → 18):**
- CONTRIBUTING.md note that consolidates both TLS recipes (npm + JVM) + `JAVA_HOME` / `ANDROID_HOME` setup. Sprint 16 retro flagged this; Sprint 17 retro re-flagged with the JVM half added. Still open — Sprint 18 housekeeping target.
- Architect doc Sprint 17 retro-correction: RevenueCat SDK error-code form (numeric-string `'10'` not name `'NETWORK_ERROR'`). Engineering carries both forms via `NUMERIC_TO_NAME` normaliser in `purchase.ts`; no deploy impact.

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

**Corporate-TLS note:** if `sentry-cli` hits a TLS handshake failure on Anton's network (same root cause as the Gradle mirror patch in Sprint 14 + the `NODE_OPTIONS=--use-system-ca` npm workaround in Sprint 16 + the `Windows-ROOT` JVM trust store in Sprint 17), set `SENTRY_HTTPS_PROXY` or invoke `sentry-cli` via PowerShell where the system trust store is honored. Document in CONTRIBUTING.md alongside the consolidated TLS recipe (Sprint 18 housekeeping target).

**Sprint 17 status:** symbolication pipeline unchanged. `scripts/upload-symbols.sh` + `scripts/upload-symbols.ps1` still present, still runnable, still gracefully no-op when `SENTRY_AUTH_TOKEN` is absent. Execution remains scheduled for Sprint 19 release-signed build wave.

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
