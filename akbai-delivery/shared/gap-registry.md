# AKBai — Pre-Launch Gap Registry
> Used by: project-manager, solutions-architect, fullstack-engineer, devops-engineer, security-compliance
> Last updated: 2026-03-20 | Source: Roadmap v14, Operations Playbook v7
> 29 total gaps across 5 categories. 10 CRITICAL items are hard gates — must resolve before any user-facing launch.

---

## Category A — Hard Pre-Launch Gates
> CRITICAL: Must fix before any user accesses the app

| # | Gap | Severity | When to Fix | Action |
|---|-----|----------|-------------|--------|
| A1 | Authentication (email OTP via Supabase Auth) | **CRITICAL** | Phase 0A — Build 0 | Must ship before any user data is stored. Supabase Auth + magic link. No auth = no data isolation = PDPA violation. |
| A2 | Privacy Policy & Terms of Service | **CRITICAL** | Phase 0A — Legal | NPC requires explicit consent checkbox before any data collection. Engage a PH tech lawyer. Do not self-draft. |
| A3 | Timezone enforcement (UTC+8) | **CRITICAL** | Phase 1 — Day 1 | All timestamps, BIR deadlines, and push notifications must use UTC+8 (Asia/Manila). Supabase default is UTC — must be overridden in every query and display. |
| A4 | Error monitoring (Sentry) | **CRITICAL** | Phase 1 — Pre-launch | Zero visibility into production crashes without this. Set up Sentry with source maps before first beta user. |
| A5 | Analytics baseline (PostHog) | **CRITICAL** | Phase 1 — Pre-launch | Required to measure the 8 Sense Check Gate signals. Cannot validate MVP without it. Must be live from Day 1. |

**Note:** Source doc Table 19 summary shows Category A has 5 CRITICAL gaps. The total 8 CRITICAL count includes 3 from Category D below.

---

## Category B — UX Gaps
> IMPORTANT: Address in Phase 1 build

| # | Gap | Severity | When to Fix | Action |
|---|-----|----------|-------------|--------|
| B1 | AI loading states | IMPORTANT | Build 3 | Show animated thinking indicator + estimated wait time in Taglish. Claude API calls take 3–10s. Blank screen = user thinks app is broken. |
| B2 | Free tier limit UX & enforcement | IMPORTANT | Build 3 | Soft limit warning at 80% usage. Hard block at 100% with upgrade CTA. Must be clear BEFORE the limit is hit, not after. |
| B3 | Onboarding recovery / resumable Kilala Kita | IMPORTANT | Build 1 | If user drops out mid-onboarding and returns, app must resume from last completed step — not restart from scratch. |
| B4 | Profile update flow | IMPORTANT | Build 3 | Users need a way to update business profile after onboarding. BIR status can change. Settings screen required. |
| B5 | Empty states | IMPORTANT | Build 2 | Every Dashboard card and Chat history must have a Taglish empty state (e.g., "Wala pang data. Mag-upload ka ng receipt para makapagsimula."). |
| B6 | Push notification timing (UTC+8) | IMPORTANT | Build 4 | BIR deadline alerts must fire in PHT, not UTC. All notification schedules must be stored and triggered in Asia/Manila timezone. |
| B7 | iOS PWA home screen install prompt | IMPORTANT | Phase 1 launch | iOS Safari does not support native PWA install banners. App must include explicit "Add to Home Screen" guide — shown in onboarding and Settings. |

---

## Category C — Business Logic Gaps
> IMPORTANT: Must be correct before financial data is live

| # | Gap | Severity | When to Fix | Action |
|---|-----|----------|-------------|--------|
| C1 | Receipt deduplication | IMPORTANT | Build 3 | Same receipt can be scanned twice. Deduplicate by hash of amount + date + merchant ±30 min. Flag duplicates before saving, not silently reject. |
| C2 | Subscription lapse grace period | IMPORTANT | Build 4 | When Pro user's payment fails, do not immediately drop to Free. 3-day grace period with daily push notification. Supabase cron + Xendit webhook required. |
| C3 | Referral tracking | PLAN | Phase 2 | Referral code system for beta invites. Track conversion from code → signup → paid. Required for word-of-mouth growth strategy in Phase 0C. |

---

## Category D — Operational Gaps
> Source: Operations Playbook Review

| # | Gap | Severity | When to Fix | Action |
|---|-----|----------|-------------|--------|
| D1 | OTP deliverability to Yahoo Mail PH | **CRITICAL** | Phase 0A | Yahoo Mail is common among target users. Supabase default SendGrid has delivery issues for PH. Requires a custom SMTP domain warmed up before launch. |
| D2 | Webhook idempotency — Xendit | **CRITICAL** | Build 4 | Xendit webhook can fire twice on retry. Payment handler must deduplicate by payment_id before processing to prevent double-crediting subscriptions. |
| D3 | OR number generation legality | **CRITICAL** | Phase 1 — Legal review | BIR requires sequentially numbered Official Receipts from a registered OR series. Auto-generating receipt numbers needs BIR legal sign-off before Automated Self-Invoicing ships. |
| D4 | Dependency monitoring | IMPORTANT | Phase 1 — Pre-launch | Anthropic API, Supabase, Xendit each need health checks + graceful in-app fallback messages. Set up UptimeRobot or Better Uptime. |
| D5 | Data backup strategy | IMPORTANT | Phase 0A | Supabase point-in-time recovery must be explicitly enabled on the paid plan. A tested restore procedure is required before any production financial data is stored. |
| D6 | Session expiry UX | IMPORTANT | Build 3 | When session expires mid-use, show graceful Taglish re-authentication prompt — not a raw error state or blank screen. |
| D7 | Incident response runbook | IMPORTANT | Phase 1 — Pre-launch | What happens at 2AM on a BIR deadline day when the app goes down? Solo founder needs a written protocol: detect → post status → rollback → fix. See Ops Playbook OPS Flow 2. |
| D8 | Beta-to-paid transition | IMPORTANT | Phase 0C / Phase 1 | Phase 0C pilot users paying ₱99–₱199 need a defined migration path when Phase 1 launches at ₱399. Define: loyalty rate, auto-upgrade path, grandfathering period. |
| D9 | PWA installation UX | IMPORTANT | Phase 1 — Launch | No App Store listing means 'Add to Home Screen' is non-obvious. Landing page and onboarding must include explicit install guide step with screenshots. |
| D10 | Admin observability | PLAN | Phase 1 — Post-launch | Anton needs visibility into: active users, MRR, feature usage, Flag-as-Wrong queue. A Supabase dashboard + simple Retool view is sufficient for MVP. |
| D11 | Data retention policy | PLAN | Phase 0A — Legal | NPC requires a defined retention period for churned users. State in Privacy Policy and enforce in system (e.g., delete transactions after 1 year of inactivity). |

---

## Category E — Pre-Build Checklist (Roadmap v14)
> Source: Build 0 Pre-Build Checklist, added v14

| # | Gap | Severity | When to Fix | Action |
|---|-----|----------|-------------|--------|
| E1 | Resibo OCR technical spike | **CRITICAL** | Phase 0A — Build 0 | Test Claude Haiku Vision on 10–15 real Filipino receipts (Shopee waybills, SM, faded thermal prints) via Anthropic Console. Must hit 85%+ field accuracy. If Haiku fails, evaluate Sonnet (higher API cost) or adjust marketing promises. This is a hard gate before Build 1. Effort: 1 afternoon. |
| E2 | Meta API dummy webhook submission | IMPORTANT | Phase 0A — This week | Meta App Review takes 1–3+ months. Submit a simple Next.js endpoint returning 200 OK as the webhook now. Decouples Phase 2 DM Connect from bureaucratic wait. Ping endpoint monthly to keep approval active. Effort: 1 hour. |
| E3 | Onboarding rate-limit exemption | **CRITICAL** | Build 1 — Architecture | Free tier 10-query/day limit must NOT apply during Kilala Kita onboarding. Users who hit the paywall before the "Maria Moment" (first actionable insight) will churn. API middleware must start the query counter only after onboarding completes and user reaches Dashboard. |

---

## Gap Registry Summary

| Category | CRITICAL | IMPORTANT | PLAN | Total |
|----------|----------|-----------|------|-------|
| A — Hard Pre-Launch Gates | 5 | 0 | 0 | 5 |
| B — UX Gaps | 0 | 7 | 0 | 7 |
| C — Business Logic | 0 | 2 | 1 | 3 |
| D — Operational (Playbook) | 3 | 6 | 2 | 11 |
| E — Pre-Build Checklist (v14) | 2 | 1 | 0 | 3 |
| **TOTAL** | **10** | **16** | **3** | **29** |

**Rule:** All 10 CRITICAL gaps are hard gates. No Phase 1 build proceeds until these are resolved.

---

## Design Gates (Non-Negotiable Pre-Launch)

These items are called out explicitly as design gates in Roadmap v14:

1. **Build 0: AI Scope Definition & System Prompt Architecture** — ✅ RESOLVED 2026-03-20. Implemented `/lib/claude/` module: 6-layer prompt assembler, model routing (Haiku/Sonnet), guardrails (BIR disclaimer, input sanitizer, output filter), circuit breaker, cost estimator. 31 regression tests passing. Chat API refactored to use modular architecture.
2. **Trust Recovery Pattern + Flag as Wrong** — Must be designed and built before Phase 1 launch. Includes persistent in-app disclaimer visible in chat UI. A product positioning itself as a financial tool must include a persistent in-app disclaimer. A business partner with no graceful error recovery will lose users permanently on first mistake.
3. **Taglish Style Guide + Prompt Regression Tests** — Write formal Taglish style guide before Phase 1 build begins. Build a 20–30 case test library and run it every time the system prompt or Claude model is updated.
4. **KA Error Acknowledgement Pattern** — Pre-drafted Taglish response for when KA surfaces incorrect data. Pattern: acknowledge clearly → take responsibility → explain what happened → offer concrete next step.
5. **Offline UX Minimum** — Graceful Taglish offline message + cached Ang Umaga Mo briefing + queued offline actions for sync. Users are packing orders with intermittent LTE.
6. **Feature Flag System** — Boolean column in Supabase users table. Enables 10% rollouts, instant kill switches. Build this before shipping any Phase 1 feature to production.
7. **4-Layer Data Isolation Architecture** — All four layers (RLS, user-scoped system prompt, conversation isolation, profile versioning) must be in place before any user data is stored in production.
8. **Domain-Expandable Architecture Prep** — Modular system prompt scope sections, domain-tagged conversations, out-of-scope redirect logging, modular knowledge base architecture. Required for Phase 4+ expansion (see Post-Implementation Vision v1).
