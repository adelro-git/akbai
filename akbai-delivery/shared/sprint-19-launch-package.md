# Sprint 19 — Launch Package & Anton Prerequisite Checklist

> The "Anton wave." Everything the build team **cannot** do (paid accounts, physical devices, sandbox creds, lawyer, domain) — consolidated into an ordered runbook so Sprint 19 is execution, not discovery.
> Companion: `sprint-18-prelaunch-gate.md` (the §11 gate this package closes). Plan source: pivot plan §11 + Sprint 19 phases.
> Created 2026-05-29 at Sprint 18 close. Sprint 18 left **every agent-doable item GREEN** (1716 tests, security clean); this is the human-gated remainder.

---

## 0. Build-team handoff — what's already done (no action needed)

- Migration **023** (subscriptions lifecycle columns) written — apply it (see §3).
- RevenueCat webhook + IAP client + paywall (Sprint 17) and trial countdown, reconciliation, offline scan queue, CSV export, push scheduler, demo/reviewer mode, legal DRAFT pages, store-copy DRAFT, Kai usage doc, enye fixes (Sprint 18) — all merged and tested.
- Demo/reviewer access: seeded account SQL + gated `/api/demo-login` + login button — code-ready, off by default.

---

## 1. Install the deferred native dependencies (do FIRST — others depend on it)

The build team flagged 2 native plugins it could not add (package.json is install-gated):

```bash
cd frontend
npm install @capacitor/splash-screen     # SplashScreen config in capacitor.config.ts is INERT until installed
npm install @capacitor/filesystem        # (optional) native "Save to Files" for CSV export; web Blob works without it
npx cap sync
```
Then re-measure the bundle (see §9). `@capacitor/share` is optional (CSV share-sheet).

## 2. Paid account enrollment (start Day 1 — Apple verification lags 1-2 days)  — Gap G3

- [ ] Apple Developer Program — **$99/yr**, 1-2 day verification.
- [ ] Google Play Console — **$25 one-time**, same-day.
- [ ] Buy/confirm the **akbai.com** domain (needed to host Privacy Policy + ToS).

## 3. Database: apply migrations + seed demo  — (build team prepared all SQL)

- [ ] Apply `frontend/supabase/migrations/023_subscriptions_lifecycle_columns.sql` to staging + prod.
- [ ] **Confirm Drift #2** (flagged by build-data): run `\d subscriptions` against staging and verify the `protect_feature_flags()` trigger / any `lib/subscriptions/lifecycle.ts` columns not covered by 003+023. Add a migration if anything is still missing.
- [ ] Seed the reviewer demo account on the **review** Supabase project:
  ```bash
  psql "$DATABASE_URL" -v demo_password="'<strong-password>'" -f frontend/supabase/seed-demo-account.sql
  ```

## 4. Environment variables

**Production (web/Vercel + native build):**
- [ ] `CRON_SECRET` — `openssl rand -hex 32`; set in Vercel → Settings → Env Vars. Vercel Cron auto-sends it as `Authorization: Bearer` to `/api/cron/deadline-notifications` (daily 01:00 UTC = 09:00 PHT).
- [ ] `REVENUECAT_WEBHOOK_AUTH` + RevenueCat API keys (see §5).
- [ ] Confirm existing: `ANTHROPIC_API_KEY`, Supabase URL/anon/service-role, `SENTRY_AUTH_TOKEN`, PostHog keys.
- [ ] **Security follow-up:** migrate `NEXT_PUBLIC_SKIP_AUTH` → a server-only var (no `NEXT_PUBLIC_`) so the dev bypass branch isn't shipped in the client bundle.

**Review build ONLY (unset everywhere else — demo mode is fail-closed):**
- [ ] `DEMO_MODE_ENABLED=true` (server master switch)
- [ ] `NEXT_PUBLIC_DEMO_MODE=true` (shows the login demo button)
- [ ] `DEMO_ACCOUNT_PASSWORD=<same as the seed's demo_password>`

## 5. RevenueCat + store IAP  — Gap G2 close-out

- [ ] RevenueCat dashboard: sign up, create project, set webhook URL → your `/api/webhooks/revenuecat` with the shared secret = `REVENUECAT_WEBHOOK_AUTH`.
- [ ] App Store Connect SKUs: Starter (₱299 **non-consumable**), Pro Monthly (₱499 **auto-renew**), Pro Annual (₱4,999 **auto-renew**).
- [ ] Play Console SKUs: Starter (one-time product), Pro Monthly + Pro Annual (subscriptions).
- [ ] `curl` smoke the staging webhook with a real signed payload (verify dedup `{deduped:true}` on replay).
- [ ] Sandbox test all 3 purchases + cancel + restore + **cross-platform restore** (iPhone purchase recognized on Android via same RevenueCat user id).

## 6. iOS project (needs a Mac)

- [ ] On a Mac: `npx cap add ios`, generate the iOS icon set (20+ sizes) + splash, build the `.ipa`.
- [ ] TestFlight first upload (signing cert provisioned during enrollment).

## 7. Sentry (native crash + alerts)

- [ ] Run `frontend/scripts/upload-symbols.ps1` (Android ProGuard) / `.sh` (iOS dSYM) with `SENTRY_AUTH_TOKEN` set; verify a test crash shows a symbolicated stack.
- [ ] Configure the **circuit-breaker-trip alert** to email Anton within 2 min (the code already fires `captureMessage` with tag `alert: circuit_breaker_trip`).
- [ ] Enable Sentry **PII scrubbing** in project settings (defense-in-depth on top of code-level minimization).

## 8. Legal (engage a PH lawyer — Gap A2; do NOT self-publish)

- [ ] Send the DRAFT pages (`/privacy`, `/terms` in-app + `npc-data-classification.md`) to a licensed PH attorney.
- [ ] Resolve the open-questions list the draft surfaced: registered entity name (DTI/SEC), DPO/privacy + support emails, exact retention periods (BIR record-keeping may need >1yr), NPC registration number, Anthropic data-use terms, Supabase data region, liability cap, governing-law venue, cookie-consent need.
- [ ] After sign-off: host the finalized policy at **akbai.com/privacy** + ToS, and link from the login disclaimer.

## 9. Store assets + listing  — Gap G5

- [ ] Sign off the listing copy in `store-listing-copy.md` (resolve the flagged items: ₱0.16/scan re-verify, penalty wording, deadline count, Maria figure, solo-founder voice, final pricing).
- [ ] Capture screenshots per device class (iPhone 6.7"/6.1"/5.5", Android phone + tablet) — use the seeded demo account for realistic data.
- [ ] Add the **official** App Store + Google Play download badges (unmodified, from Apple Marketing Resources / Play brand guidelines) to replace the text-placeholder badges in the PWA fallback.
- [ ] Re-measure the release `.aab`/`.ipa` after §1's splash dep; confirm **<30 MB** (interim target 28 MB; last build 23.27 MB).

## 10. Reviewer access (for the App/Play review notes)  — Gap G4/G7 P0

- [ ] With the demo seed + demo env set (review build), provide reviewers: **email `demo@akbai.app`, password `<demo_password>`**, instruction: "On the login screen tap **Demo (para sa reviewer)** — no email code needed." Reviewer lands on a populated dashboard/scanner/deadlines in seconds.

## 11. On-device smoke (Pixel 5 + a borrowed/Test iPhone)  — deferred per testing-cadence

- [ ] Full smoke across all converted routes (SPIKE_FINDINGS QA notes).
- [ ] **Offline scan**: airplane mode → capture → reconnect → queue syncs (validate the Sprint 18 hardening: unreadable scans drop+notify, no duplicates, no infinite re-OCR).
- [ ] Push: APNs (iOS) + FCM (Android) deliver a test BIR reminder in TestFlight + Play Internal.
- [ ] Accessibility: VoiceOver/TalkBack on a key flow. Enye/long-caption rendering on real screens.
- [ ] Performance: cold start <3s, nav <500ms.

## 12. Final gate + release

- [ ] Re-run the §11 gate (`sprint-18-prelaunch-gate.md`) — all 🟡/🔴 now resolvable to 🟢. Anton signs off.
- [ ] App Store + Play submission (with reviewer notes from §10; plan for 1 rejection cycle).
- [ ] Public release once both approve. v1.1 bug-fix release within 7 days (Tarsi cadence).

---

## Residual engineering follow-ups (non-blocking, from Sprint 18 review)

- M1 completeness: add `clearScans()` + chat-queue `clear()` to the other two sign-out paths (`chat-interface.tsx`, `(app)/layout.tsx` expiry) — currently only wired in `profile-view`.
- Offline receipt images: evaluate `@capacitor/secure-storage` (or IndexedDB encryption) instead of plain localStorage (M1 hardening).
- Cleanup debt (code-review): consolidate the constant-time bearer compare (×3: cron, demo/config, revenuecat) into one `lib/security/` helper; extract a generic `createLocalQueue<T>` factory shared by chat + OCR queues; share Manila date helpers between `lib/reconciliation`, `lib/weekly-story`, `lib/timezone`; batch the `/api/dashboard` independent reads with `Promise.all`.
- Native CSV save via `@capacitor/filesystem`; iOS-specific share sheet.
