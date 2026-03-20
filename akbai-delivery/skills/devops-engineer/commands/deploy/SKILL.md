---
name: deploy
description: "Pre-deployment checklist and Go/No-Go decision for production pushes to Vercel. Workflow: read shared context + tech stack, verify all tests pass, check environment variables (Supabase, Claude API, Xendit, Sentry, PostHog), validate database migrations, confirm RLS policies, tag Sentry release, run pre-deployment checklist, generate rollback plan, output Go/No-Go verdict with blockers or deployment command sequence. Trigger keywords: deploy, ship it, push to prod, ready to ship, launch, release, production push, go-live, deploy to Vercel, pre-flight, deployment checklist."
---

# /deploy — Pre-Deployment Checklist

**Skill:** devops-engineer
**Command:** `/deploy`
**Purpose:** Pre-deployment Go/No-Go decision + rollback plan generation for AKBai production deployments to Vercel.

You are Anton's automated pre-flight checklist. Before ANY code hits production, run this workflow. Anton is a solo founder working evenings — he needs confidence that nothing will break during the next 18 hours while he's at his Globe day job. This skill exists to give him that confidence.

---

## Before Starting

**Read the shared context files** (takes 3 minutes):
- `/AKBai/akbai-delivery/shared/project-context.md` § 1–3 (product, market, tech stack overview)
- `/AKBai/akbai-delivery/shared/tech-stack.md` (canonical stack, deployment targets, env vars)
- `/AKBai/akbai-delivery/shared/gap-registry.md` § Category A + D (pre-launch gates + operational gaps)

**Reference files in this skill** (read as needed):
- `references/deployment-guide.md` — Full env var list, Vercel config, preview vs production isolation, rollback procedures
- `references/monitoring-setup.md` — Sentry release tagging, PostHog flags, UptimeRobot health checks

---

## Pre-Deployment Checklist

Ask Anton (or check directly if you have access):

### 1. Code Quality Gate
- [ ] **All unit tests pass** (Vitest) — `npm run test` returns no failures
- [ ] **All integration tests pass** (if any exist) — no skipped tests blocking deployment
- [ ] **E2E tests pass** (Playwright) on Vercel preview — critical user flows (signup → onboarding → dashboard → scan receipt) work end-to-end
- [ ] **TypeScript strict mode — zero errors** — `npm run type-check` returns clean
- [ ] **Linting clean** — `npm run lint` with no critical violations

### 2. Gap Registry Verification
- [ ] **No new CRITICAL gaps introduced** — code does not violate any of the 10 CRITICAL gaps (A1–A5, D1–D3, E1, E3). Ask: "Does this PR touch authentication, privacy policy, timezone handling, error monitoring, analytics, OTP delivery, webhook idempotency, or OR number generation?" If yes to any, verify the gap is addressed.
- [ ] **Soft-delete pattern maintained** — if any schema changes, confirm no hard deletes and `deleted_at TIMESTAMP` is used
- [ ] **RLS policies on new tables** — if adding a table, RLS is configured and tested. No table without RLS.

### 3. Environment & Secrets
- [ ] **All required env vars present in Vercel** (both preview and production)
  - `ANTHROPIC_API_KEY` — Claude API access (NOT exposed to client)
  - `SUPABASE_SERVICE_ROLE_KEY` — server-side only (NOT NEXT_PUBLIC_)
  - `SUPABASE_URL` + `SUPABASE_ANON_KEY` — public (NEXT_PUBLIC_ prefix OK)
  - `XENDIT_SECRET_KEY` + `XENDIT_WEBHOOK_TOKEN` — payment webhooks
  - `SENTRY_DSN` — error monitoring (public OK)
  - `NEXT_PUBLIC_POSTHOG_KEY` — analytics (public OK)
  - `RESEND_API_KEY` — transactional email
- [ ] **Secrets rotated recently** — if any keys are older than 90 days, flag for rotation after deployment
- [ ] **Preview environment isolated** — Vercel preview uses a separate Supabase branch/project, never touches production data

### 4. Database Migrations
- [ ] **All pending migrations applied** — Supabase migration pipeline is current
- [ ] **Migrations tested on staging** — run migrations against a Supabase branch first, verify they succeed
- [ ] **RLS still enforces user_id scoping** — after migration, spot-check a user-scoped table with RLS queries
- [ ] **Soft-delete preserved** — no new CASCADE DELETE rules added; all user-owned tables retain `deleted_at`
- [ ] **Rollback SQL prepared** — for critical migrations, write the reverse SQL (e.g., `DROP COLUMN` if you added a column)

### 5. Monitoring & Observability
- [ ] **Sentry release tagged with version** — `SENTRY_RELEASE=<git-short-hash>` (e.g., `a3f5d2e`) is set in Vercel before deploy
- [ ] **PostHog feature flags configured** — if deploying a new feature, flag is set to `false` for 100% of users (killswitch ready)
- [ ] **UptimeRobot monitors configured** — `/api/health` endpoint exists and returns `{ "status": "ok" }` to pass health checks

### 6. Vercel Preview Build
- [ ] **Vercel preview build succeeds** — PR has a passing Vercel deployment URL that's clickable and functional
- [ ] **No build errors in preview** — check Vercel build logs for warnings or TypeErrors
- [ ] **No new console errors** — open the preview URL in browser, check DevTools console for JS errors

### 7. Mobile PWA Testing
- [ ] **iOS Safari PWA test** — on iPhone, open preview URL, can add to home screen, app loads offline
- [ ] **Android Chrome PWA test** — on Android, open preview URL, can install, app loads offline
- [ ] **Morning Briefing cache works** — if Ang Umaga Mo (morning briefing) is cached, it loads instantly even if network is slow
- [ ] **Offline message displays** — if offline, Taglish "Offline ka ngayon" message appears, no blank screen

### 8. Financial Data Safeguards
- [ ] **Circuit breaker / daily spend cap verified** — Claude API spend is capped at ~$5/day (prevents runaway costs if a loop occurs). Current spend is tracked in Supabase `daily_api_spend` table.
- [ ] **Xendit webhook idempotency confirmed** — payment handler deduplicates by `payment_id` to prevent double-crediting subscriptions if webhook fires twice
- [ ] **Money handling uses centavos (integers)** — no floating-point arithmetic in financial calculations

---

## Severity Levels for Blockers

If any checklist item is **RED (blocker):**
- Code quality gate fails → **NO-GO**, fix tests first
- CRITICAL gap introduced → **NO-GO**, revert or fix
- Env vars missing → **NO-GO**, add to Vercel
- Migration untested → **NO-GO**, test on staging first
- RLS misconfigured → **NO-GO**, data leak risk
- Preview build failed → **NO-GO**, fix first

If items are **YELLOW (warning but deployable):**
- Secrets older than 90 days → Deploy OK, plan rotation post-deploy
- PostHog flag not yet tested → Deploy OK, set to `false` as killswitch
- UptimeRobot monitor not set up yet → Deploy OK, set up immediately after

---

## Output: Go/No-Go Verdict

### If GO:
Display a green checkmark summary:
```
✅ PRE-DEPLOYMENT CHECKLIST PASSED

All 8 gates cleared. Production is safe to ship.

Code Quality:     ✅ Tests pass
Gaps:            ✅ No CRITICAL regressions
Secrets:         ✅ All env vars present
Migrations:      ✅ Tested on staging
Monitoring:      ✅ Sentry + PostHog ready
PWA:             ✅ iOS + Android tested
Financial:       ✅ Circuit breaker live

VERDICT: 🟢 GO FOR DEPLOYMENT

Next step: Run the deployment command below.
```

Then provide the command sequence:
```bash
# Deploy to Vercel production
vercel deploy --prod

# Verify Sentry release tag
curl https://sentry.io/api/0/organizations/akbai/releases/<git-hash>/

# Smoke test: POST to /api/health (should return { "status": "ok" })
curl https://akbai.vercel.app/api/health

# Check UptimeRobot
# (Anton: log into UptimeRobot dashboard, verify all monitors show UP)
```

### If NO-GO:
Display a red X summary with blockers:
```
❌ DEPLOYMENT BLOCKED

[N] blockers prevent production deployment.

BLOCKERS:
1. ❌ Unit tests failing (3 failures in __tests__/costing.test.ts)
   → Action: Run `npm run test -- --watch` and fix failures

2. ❌ Env var missing: XENDIT_WEBHOOK_TOKEN
   → Action: Add to Vercel project settings (production)

3. ⚠️  RLS policy on receipts table NOT tested against production data
   → Action: Connect to prod Supabase, run SELECT * as auth.uid()='test' to verify

VERDICT: 🔴 NO-GO

Resolve blockers above, then re-run /deploy checklist.
```

---

## Rollback Plan

If deployment completes but subsequent monitoring shows issues (errors spike, uptime drops, users report data loss), execute the rollback procedure:

1. **Identify the failing Vercel deployment**
   - Go to vercel.com/akbai → Deployments
   - Find the latest deployment (e.g., `akbai@a3f5d2e`)
   - Note the timestamp and git hash

2. **Promote the previous stable deployment**
   - In Vercel: click the second-most-recent deployment
   - Click "Promote to Production"
   - Vercel will atomically redirect traffic to the previous version
   - Downtime: ~5 seconds during DNS propagation

3. **Verify rollback succeeded**
   - UptimeRobot should confirm `/api/health` is UP
   - Sentry should show errors trend downward
   - PostHog dashboard should show traffic returning to normal

4. **Investigate the failed deployment**
   - Check Sentry error details
   - Check Supabase migration logs (if migrations were involved)
   - Check PostHog feature flag state (was a flag accidentally enabled?)
   - Write findings in Slack #akbai-ops

---

## Solo Founder Considerations

**Anton's day job is 9–5 at Globe.** Pre-deployment runs in the evening. Key edge cases:

- **"Can I deploy from my phone?"** → Yes, but only if you can access this checklist on mobile and have verified preview build. Better to wait for desktop.
- **"What if production breaks at 10AM tomorrow while I'm in a meeting?"** → Sentry will alert your phone. UptimeRobot will SMS you. Rollback procedure above takes 2 minutes — you can do it from anywhere.
- **"Can I skip RLS verification?"** → No. RLS breach = user data visible to other users = NPC violation = app shutdown risk.
- **"What if a migration fails at 2AM?"** → That's why the rollback plan exists. Revert to previous deployment (2 min), then fix migration in the next day's build.

---

## When to Use This Skill

**Use /deploy when:**
- Anton says "ready to ship?" or "let's go live"
- You're preparing a production release to Vercel
- Code is merged to `main` and ready for final approval
- You need to generate a rollback plan for a risky deployment

**Do NOT use /deploy when:**
- Code is still on a feature branch (use PR preview instead)
- Asking for deployment help on a non-production environment
- Investigating a past deployment issue (use `/incident` instead)

---

## Reference: Common Deployment Scenarios

### Scenario A: Regular Feature Deploy (no migrations)
1. Run checklist items 1–3, 6–8 (skip migrations since none exist)
2. Output: GO ✅
3. Deploy to Vercel
4. Verify Sentry release tag appears within 1 minute

### Scenario B: Deploy with Database Migration
1. Run full checklist 1–8
2. **Highlight:** Item 4 (migrations) must be tested on staging first
3. Output: GO ✅
4. Deploy to Vercel (Vercel will run Edge Functions and apply migrations)
5. Monitor Sentry for RLS-related errors in first 5 minutes

### Scenario C: Deploy with New Critical Feature
1. Run checklist items 1–8
2. **Highlight:** PostHog feature flag must be set to `false` (killswitch active)
3. Output: GO ✅
4. Deploy with flag OFF
5. After stability confirmed (24 hours, zero errors), flag can be enabled to users

---

## Glossary

- **Go/No-Go:** A binary decision: is this safe to deploy to production?
- **Blockers:** Any checklist item that is RED and prevents deployment
- **Rollback:** Reverting to the previous Vercel deployment if the current one fails
- **Circuit Breaker:** Daily spending cap on Claude API to prevent cost overrun
- **RLS:** Row-Level Security policies in Supabase that enforce `user_id` scoping
- **Soft-delete:** Using `deleted_at` timestamp instead of hard deletion (preserves data for compliance)
