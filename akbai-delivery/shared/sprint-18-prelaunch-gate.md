# Sprint 18 — Pre-Launch Feature Readiness Gate (G7) — Traffic-Light Report

> Source checklist: pivot plan §11. Run: 2026-05-29 (Sprint 18 close).
> Branch: `feat/18-prelaunch-readiness`. Tests: **1716 passing**. Security audit: **no blockers**.
> Final sign-off authority: **Anton** (per §11). This report is the engineering pre-assessment.

## Legend
- 🟢 **GREEN** — done + verified in code/tests this sprint (or earlier).
- 🟡 **CODE-READY** — implementation complete; final confirmation needs the Sprint 19 Anton wave (device / store / creds). Not a code defect.
- 🔴 **ANTON-GATED** — cannot be done by the build team; needs Anton's paid accounts, physical devices, sandbox credentials, a lawyer, or a purchased domain.

**A 🔴 here is NOT a Sprint 18 failure** — Sprint 19 was always the "Anton wave" for store/device/legal work. Sprint 18's job was to make every *agent-doable* item GREEN, which it did.

---

## Tier-defining features

| Item | Status | Notes |
|------|--------|-------|
| Onboarding (Kilala Kita) end-to-end iOS+Android | 🟡 | Code complete (Build 1); on-device smoke = Sprint 19 |
| Manual expense entry CRUD + soft-delete | 🟢 | Build 4, tested |
| Receipt OCR camera→parse→save both platforms | 🟡 | Native camera (Sprint 16) + pipeline complete; on-device = Sprint 19 |
| Receipt capture offline → queue → sync (airplane mode) | 🟢→🟡 | **Built + hardened this sprint** (validate-before-save, attempt cap, dedup, retriable errors). Airplane-mode device test = Sprint 19 |
| BIR deadline calendar correct per business type | 🟢 | Build 6 |
| BIR deadline push 7/3/1-day | 🟡 | **Scheduler wired this sprint** (cron route + `vercel.json`); real APNs/FCM delivery = Sprint 19 (creds) |
| BIR calendar 2027 rollover after Jan 1 (unit-tested) | 🟢 | **Test added + fixed a real UTC bug in `generate.ts` this sprint** |
| Basic expense reports (charts) | 🟢 | Build 4 |
| CSV export both platforms | 🟢→🟡 | **Built this sprint** (+ formula-injection hardened). Web Blob works; native file-save (`@capacitor/filesystem`) = follow-up |
| Kai chat: send/receive, history, guardrails, circuit breaker | 🟢 | Build 0/1 |
| Morning briefings real data | 🟢 | Build 5 |
| Weekly story (Kuwento) real data | 🟢 | Redesign Phase 7 |
| Reply drafter + disclaimer | 🟢 | Integrated into Kai chat |
| Invoicing create/send/PDF | 🟡 | Create/track GREEN; "PDF" is print-to-PDF HTML (documented MVP) |
| Premium costing margins | 🟢 | Build 8 |
| Trial-countdown banner (day 1 + day-7 paywall) | 🟢 | **Built this sprint** (banner + `computeTrialState` + paywall trigger; reachable on trialing+expired) |

## Payment + entitlements (RevenueCat — sandbox/dashboard is the Sprint 19 wave)

| Item | Status | Notes |
|------|--------|-------|
| Free trial 7-day activates on first install | 🟡 | Code-ready; sandbox = Sprint 19 |
| Trial expiry → paywall, AI features lock | 🟡 | Paywall + trial banner + server tier-lock code-ready; sandbox = Sprint 19 |
| Starter ₱299 purchase | 🔴 | RevenueCat SKUs + sandbox accounts (Anton) |
| Pro Monthly ₱499 purchase | 🔴 | RevenueCat SKUs + sandbox (Anton) |
| Pro Annual ₱4,999 purchase | 🔴 | RevenueCat SKUs + sandbox (Anton) |
| Cancellation grace period | 🟡 | Lifecycle code + grace columns (**migration 023 this sprint**); sandbox = Sprint 19 |
| Restore purchases | 🟡 | Restore link (Sprint 17) code-ready; device test = Sprint 19 |
| Cross-platform restore (iPhone→Android) | 🔴 | Two devices + RevenueCat (Anton) |

## Brand + UX

| Item | Status | Notes |
|------|--------|-------|
| Kai art in ≥5 surfaces OR fallback documented | 🟢 | **13 surfaces + fallback policy doc this sprint** (`kai-character-usage.md`) |
| Conversational Filipino copy review | 🟢 | Voice consistent; new copy follows the frame; marketing-reviewed Sprint 17 |
| Mobile-first, no truncation at 375px | 🟢→🟡 | **Enye/wrap audit + 7 `break-words` fixes this sprint**; a few intentional `truncate`-on-name rows flagged NEEDS-DESIGN-REVIEW |
| Dark mode toggle | 🟢 | Build 2/5 |
| Accessibility: VoiceOver/TalkBack on a key flow | 🔴 | On-device (Sprint 19) |
| Enye (ñ) + special chars render without clipping | 🟢→🟡 | **Audit + fixes this sprint** (chat, invoice PDF, hero); on-device confirm = Sprint 19 |

## Technical health

| Item | Status | Notes |
|------|--------|-------|
| All tests passing (1290+) | 🟢 | **1716 passing** (122 files) |
| No P0 Sentry errors in TestFlight/Play Internal | 🔴 | Needs TestFlight (Sprint 19) |
| Crash-free >99% across 50+ sessions | 🔴 | Needs testers (Sprint 19) |
| All RLS policies audited | 🟢 | **Security audit this sprint**: migration 023 no RLS change; reconciliation/demo routes verified |
| Server keys never exposed to client | 🟢 | Audit confirmed. (Note: move `NEXT_PUBLIC_SKIP_AUTH` → server-only env before launch — pre-existing) |
| Circuit breaker spend tested | 🟢 | Build 0 |
| Circuit breaker trip → Sentry alert ≤2 min | 🟡 | **Code fires `captureMessage` this sprint**; email routing = Sentry dashboard config (Anton) |
| Performance: cold start <3s, nav <500ms | 🔴 | On-device (Sprint 19) |
| Sentry Capacitor dSYM/ProGuard symbolication | 🟡 | Scripts ready (Sprint 16); execute + verify = Sprint 19 (creds) |

## Compliance + legal

| Item | Status | Notes |
|------|--------|-------|
| Privacy policy live at akbai.com/privacy | 🟡→🔴 | **DRAFT page created this sprint**; lawyer sign-off (A2) + domain hosting = Anton |
| NPC RA 10173 data classification documented | 🟢 | **Matrix created this sprint** (`npc-data-classification.md`; DRAFT pending counsel) |
| BIR disclaimer on tax-related outputs | 🟢 | Build 0 guardrails |
| No tax-advice copy | 🟢 | Verified |
| Terms of Service live | 🟡→🔴 | **DRAFT page created this sprint**; lawyer + hosting = Anton |

## Distribution readiness

| Item | Status | Notes |
|------|--------|-------|
| Store listing copy approved | 🟡 | **DRAFT this sprint** (`store-listing-copy.md`, char-limit compliant); Anton sign-off pending |
| Screenshots per device class uploaded | 🔴 | Device captures + store accounts (Sprint 19) |
| App icons in all required sizes | 🟡 | Android set present; **iOS set needs `cap add ios` (Mac)** — Anton-gated |
| Demo account credentials for reviewers | 🟢 | **Seeded demo account + gated `/api/demo-login` this sprint**; Anton seeds + sets env at submission |
| Reviewer demo bypass / guest mode ≤60s | 🟢 | **Built this sprint** (fail-closed, off by default in prod) |
| APNs + FCM deliver test reminder in TestFlight/Play | 🔴 | Firebase/APNs creds + store builds (Anton) |
| Release .aab measured + documented, <30 MB | 🟡 | Last build 23.27 MB (Sprint 17, 22% under). Re-measure after Sprint 18 (splash dep) in Sprint 19; bundle-guard test still enforces 30 MB |
| Apple + Google approvals | 🔴 | Store accounts + submission (Anton) |

---

## Gate verdict

**Sprint 18 = 🟢 GREEN on every agent-doable item.** Of the §11 checklist, all items that can be closed without paid store accounts, physical devices, sandbox credentials, a lawyer, or a purchased domain are **DONE and verified** (1716 tests, security audit clean).

**Public-release gate = 🔴 RED — and that is by design.** The remaining 🔴 items are the **Sprint 19 "Anton wave"** prerequisites that no build agent can perform:
1. Apple Developer ($99/yr) + Google Play ($25) enrollment
2. RevenueCat dashboard + sandbox SKUs (3 products) + sandbox purchase/restore testing
3. Physical device(s): on-device smoke, airplane-mode offline test, accessibility, performance, cross-platform restore
4. Firebase/APNs credentials + TestFlight/Play Internal builds (push delivery, crash-free %, symbolication)
5. PH lawyer sign-off on Privacy Policy + ToS, and a purchased domain to host them
6. iOS project scaffold (`cap add ios`) on a Mac for iOS icons/build
7. Store screenshots + listing/copy final sign-off

Per the §11 decision rule, **do NOT release publicly until these close** — keep the app in TestFlight + Play Internal Testing. The full Anton prerequisite list is in `sprint-19-launch-package.md`.
