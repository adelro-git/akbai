# AKBai — Pre-Launch Gap Registry
> Used by: project-manager, solutions-architect, fullstack-engineer, devops-engineer, security-compliance
> Last updated: 2026-03-25 | Source: Roadmap v14, Operations Playbook v7
> 33 total gaps across 6 categories. 10 CRITICAL items remain (A1, A5 resolved this sprint; D1 downgraded to IMPORTANT). E4 (EWT/2307) added 2026-03-31.

---

## Category A — Hard Pre-Launch Gates
> CRITICAL: Must fix before any user accesses the app

| # | Gap | Severity | When to Fix | Action |
|---|-----|----------|-------------|--------|
| A1 | Authentication (email OTP via Supabase Auth) | **CRITICAL** | Phase 0A — Build 0 | ✅ RESOLVED 2026-03-25. Supabase Auth OTP working (tested Gmail). Login form with conversational Filipino copy, rate-limit handling, email provider detection (Yahoo PH warning). Auth middleware redirects unauthenticated users. Dev-auth bypass for local development. |
| A2 | Privacy Policy & Terms of Service | **CRITICAL** | Phase 0A — Legal | NPC requires explicit consent checkbox before any data collection. Engage a PH tech lawyer. Do not self-draft. |
| A3 | Timezone enforcement (UTC+8) | **CRITICAL** | Phase 1 — Day 1 | ✅ RESOLVED 2026-03-22. Shared `@/lib/timezone` module: `getManilaToday()`, `formatManilaDate()`, `toManila()`, `getManilaTimestamp()`, `toManilaSQL()`. Circuit breaker refactored to use shared utility. 12 tests passing. ADR-006. Convention documented in tech-stack.md. |
| A4 | Error monitoring (Sentry) | **CRITICAL** | Phase 1 — Pre-launch | ✅ RESOLVED 2026-03-22. `@sentry/nextjs` installed with client+server configs, `instrumentation.ts`, `withSentryConfig` in next.config.js, `global-error.tsx` (conversational Filipino), env vars in `.env.local.example`. ADR-007. Production-only, low sample rates (0.1) for cost control. |
| A5 | Analytics baseline (PostHog) | **CRITICAL** | Phase 1 — Pre-launch | ✅ RESOLVED 2026-03-25. `posthog-js` + `posthog-node` installed. `PostHogProvider` in root layout with auto-identify via Supabase auth. 5 typed events: `onboarding_started`, `onboarding_completed`, `chat_message_sent`, `dashboard_viewed`, `receipt_scanned`. Server-side singleton client. ADR-009. Env vars configured. |

**Note:** Source doc Table 19 summary shows Category A has 5 CRITICAL gaps. The total 8 CRITICAL count includes 3 from Category D below.

---

## Category B — UX Gaps
> IMPORTANT: Address in Phase 1 build

| # | Gap | Severity | When to Fix | Action |
|---|-----|----------|-------------|--------|
| B1 | AI loading states | IMPORTANT | Build 3 | ✅ RESOLVED 2026-03-26. `loading-estimator.ts` returns feature/tier-specific wait estimates. Message-list shows conversational Filipino text below bouncing dots ("Nag-iisip si Kai... ~3-5 seconds"), switches to long-wait message after 5s. |
| B2 | Free tier limit UX & enforcement | IMPORTANT | Build 3 | ✅ RESOLVED 2026-03-26. `free-tier-banner.tsx` shows amber warning at 8 queries ("2 na lang ang tanong mo for today") and red block at 10 with upgrade CTA. `queriesUsedToday` returned in chat API response. Hidden for pro/business tiers. |
| B3 | Onboarding recovery / resumable Kilala Kita | IMPORTANT | Build 1 | ✅ RESOLVED 2026-03-22. Onboarding saves progress per step via `/api/onboarding` POST. GET returns current step for resume-on-return. `onboarding_step` column on `business_profiles` tracks progress. UI wizard starts from last completed step. |
| B4 | Profile update flow | IMPORTANT | Build 3 | ✅ RESOLVED 2026-03-25. `/profile` page with ProfileView (read-only) + ProfileEditForm (inline edit). `/api/profile` GET+PATCH with Zod validation. Increments `profile_version` on business_profiles. Dark mode toggle, sign-out button. PostHog events: profile_updated, signed_out. |
| B5 | Empty states | IMPORTANT | Build 2 | IN PROGRESS (2026-03-25). Dashboard cards now show real data when available (Quick Chat count, BIR status) and conversational Filipino empty states when not. Resibo/Saan Napunta cards still show empty states (Build 3/4 scope). Chat welcome message exists. |
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
| D1 | OTP deliverability to Yahoo Mail PH | IMPORTANT | Phase 1 — Pre-launch | Downgraded 2026-03-25. Supabase built-in email works for dev/early users (tested Gmail OTP successfully). 4 emails/hour free tier is fine for now. Custom SMTP (Resend) deferred until domain purchased and real users onboarding. Code-side prep done: branded email templates (`lib/email/templates.ts`), Yahoo PH detection (`lib/email/verify.ts`), setup guide (`smtp-setup-guide.md`). Revisit when approaching launch. |
| D2 | Webhook idempotency — Xendit | **CRITICAL** | Build 4 | Xendit webhook can fire twice on retry. Payment handler must deduplicate by payment_id before processing to prevent double-crediting subscriptions. |
| D3 | OR number generation legality | **CRITICAL** | Phase 1 — Legal review | BIR requires sequentially numbered Official Receipts from a registered OR series. Auto-generating receipt numbers needs BIR legal sign-off before Automated Self-Invoicing ships. |
| D4 | Dependency monitoring | IMPORTANT | Phase 1 — Pre-launch | Anthropic API, Supabase, Xendit each need health checks + graceful in-app fallback messages. Set up UptimeRobot or Better Uptime. |
| D5 | Data backup strategy | IMPORTANT | Phase 0A | Supabase point-in-time recovery must be explicitly enabled on the paid plan. A tested restore procedure is required before any production financial data is stored. |
| D6 | Session expiry UX | IMPORTANT | Build 3 | ✅ RESOLVED 2026-03-26. `session-expiry-modal.tsx` with glassmorphism overlay and conversational Filipino copy ("Oops, nag-expire ang session mo"). `useSessionWatcher()` hook detects unexpected sign-out via `onAuthStateChange()`. `SessionGuard` integrated into app layout. Preserves chat draft in localStorage. |
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
| E1 | Resibo OCR technical spike | **CRITICAL** | Phase 0A — Build 0 | IN PROGRESS (2026-03-24). OCR pipeline code + test harness built: `frontend/src/lib/ocr/` (types, Zod schemas, Filipino receipt prompt, parse-receipt with Haiku-first + Sonnet fallback, cost helpers). API route at `/api/ocr`. 46 unit tests passing. Spike runner script ready at `__tests__/spike-runner.ts`. **AWAITING**: Anton to provide 10-15 real Filipino receipt images, then run spike with `ANTHROPIC_API_KEY=xxx npx tsx src/lib/ocr/__tests__/spike-runner.ts`. Must hit 85%+ field accuracy. |
| E2 | Meta API dummy webhook submission | IMPORTANT | Phase 0A — This week | Meta App Review takes 1–3+ months. Submit a simple Next.js endpoint returning 200 OK as the webhook now. Decouples Phase 2 DM Connect from bureaucratic wait. Ping endpoint monthly to keep approval active. Effort: 1 hour. |
| E3 | Onboarding rate-limit exemption | **CRITICAL** | Build 1 — Architecture | ✅ RESOLVED 2026-03-22. `checkCircuitBreaker()` accepts optional `onboardingCompleted` param. When `false`, free tier 10-query limit is bypassed. Chat route passes `users.onboarding_completed` to circuit breaker. Safe default: `undefined` still enforces limit. 3 tests. ADR-008. |
| E4 | EWT/2307 knowledge base & withholding tax coverage | MEDIUM | Build 5–6 | IN PROGRESS (2026-03-31). BIR knowledge base had no EWT rate table, no Form 2307 reference, no contractor-vs-professional classification. Real COR test (PSIC 82990 interior design) exposed the gap. §3E added to bir-knowledge-base.md with EWT rates (2%/5%/10%/1%), 2307 flow, PSIC classification. Still needed: PSIC code field on `business_profiles` schema (Phase 2+), COR Vision auto-extraction during onboarding (Phase 2+), EWT credit tracking in expense module. |

---

## Category F — Security Audit (March 2026)
> Source: External security audit mapping Supabase + AI app vulnerabilities to AKBai's architecture

| # | Gap | Severity | Status | Action |
|---|-----|----------|--------|--------|
| F1 | Tier stored on user-writable table | **CRITICAL** | ✅ RESOLVED 2026-03-20 | Created `subscriptions` table with SELECT-only RLS. Tier read from subscriptions, not `users.feature_flags`. Added `protect_feature_flags()` trigger to prevent user-side manipulation. |
| F2 | No IP-based rate limiting | MEDIUM | ✅ RESOLVED 2026-03-20 | In-memory sliding window rate limiter in `proxy.ts` for `/api/*` routes (20 req/min per IP). Cloudflare WAF planned for Month 7+. |
| F3 | API keys exposed on frontend | INFO | ✅ CONFIRMED 2026-03-20 | Audit confirmed all API keys are server-side only. No action needed — maintain boundary. |
| F4 | No external hard budget cap on Anthropic | MEDIUM | ✅ RESOLVED 2026-03-20 | Circuit breaker changed to fail-closed (503 if spend tracking unavailable). Anton to set $150/month hard cap in Anthropic Console. |

---

## Gap Registry Summary

| Category | CRITICAL | IMPORTANT | PLAN | Total |
|----------|----------|-----------|------|-------|
| A — Hard Pre-Launch Gates | 5 | 0 | 0 | 5 |
| B — UX Gaps | 0 | 7 | 0 | 7 |
| C — Business Logic | 0 | 2 | 1 | 3 |
| D — Operational (Playbook) | 2 | 7 | 2 | 11 |
| E — Pre-Build Checklist (v14) | 2 | 1 | 0 | 4 |
| F — Security Audit (Mar 2026) | 1 | 2 | 0 | 3 |
| **TOTAL** | **10** | **19** | **3** | **33** |

**Rule:** All CRITICAL gaps are hard gates. No Phase 1 build proceeds until these are resolved.

---

## Design Gates (Non-Negotiable Pre-Launch)

These items are called out explicitly as design gates in Roadmap v14:

1. **Build 0: AI Scope Definition & System Prompt Architecture** — ✅ RESOLVED 2026-03-20. Implemented `/lib/claude/` module: 6-layer prompt assembler, model routing (Haiku/Sonnet), guardrails (BIR disclaimer, input sanitizer, output filter), circuit breaker, cost estimator. 31 regression tests passing. Chat API refactored to use modular architecture.
2. **Trust Recovery Pattern + Flag as Wrong** — ✅ RESOLVED 2026-03-26. `disclaimer-banner.tsx` — persistent, non-dismissible financial disclaimer at top of chat. `flag-button.tsx` — flag icon on Kai messages with bottom-sheet (4 reason options + comment). `/api/flag-as-wrong` POST endpoint with Zod validation. `flag_as_wrong_reports` table (migration 008) with RLS, soft-delete. 30 tests.
3. **Conversational Filipino Style Guide + Conversational Filipino Regression Test Suite** — ✅ RESOLVED 2026-03-26 (v1.0). 25-case prompt regression test suite in `prompt-regression.test.ts`: 5 groups (persona integrity, conversational Filipino compliance, feature prompts, guardrails, integration). All deterministic — no API calls. Style guide (357 lines, 12 sections) was already complete from Sprint 2. Sprint 11 (2026-04-09) extended to 34 cases adding Group 6 markers — the 8 conversational Filipino syntactic markers (enclitic placement, Filipino conjunctions, Filipino prepositions, Filipino time adverbs, affixed English verbs, Filipino comparatives, `ang` vs `yung` for definite objects, Filipino word order) — to enforce the conversational Filipino rewrite of the core Kai persona (prompt v1.1.0). Gate renamed from "Taglish Style Guide" in Sprint 11 terminology sweep.
4. **Kai Error Acknowledgement Pattern** — Pre-drafted conversational Filipino response for when Kai surfaces incorrect data. Pattern: acknowledge clearly → take responsibility → explain what happened → offer concrete next step.
5. **Offline UX Minimum** — Graceful conversational Filipino offline message + cached Ang Umaga Mo briefing + queued offline actions for sync. Users are packing orders with intermittent LTE.
6. **Feature Flag System** — Boolean column in Supabase users table. Enables 10% rollouts, instant kill switches. Build this before shipping any Phase 1 feature to production.
7. **4-Layer Data Isolation Architecture** — All four layers (RLS, user-scoped system prompt, conversation isolation, profile versioning) must be in place before any user data is stored in production.
8. **Domain-Expandable Architecture Prep** — Modular system prompt scope sections, domain-tagged conversations, out-of-scope redirect logging, modular knowledge base architecture. Required for Phase 4+ expansion (see Post-Implementation Vision v1).
