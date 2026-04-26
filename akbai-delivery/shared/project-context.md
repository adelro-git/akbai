# AKBai — Project Context
> Shared reference for all akbai-delivery skills. Read this first. ~200 lines.
> Last updated: 2026-03-25 | Source: Roadmap v14, Financial Model v5, Market Research v1.1, Ops Playbook v7, Ops Roadmap v6, Competitive Brief v2, Brand Guide v1.0, Post-Implementation Vision v1

---

## 1. Product Overview

**Name:** AKBai ("Katuwang ng Negosyo Mo")
**Type:** Mobile-first PWA — AI business partner for Filipino MSMEs
**Tagline:** "Katuwang ng Negosyo Mo" (Your Business Partner)
**Stage:** Pre-launch / Phase 0 (as of March 2026)
**Founder:** Anton del Rosario (solo founder, day job at Globe Telecom)

AKBai is NOT a chatbot. It is a proactive AI business partner — "Kai" (from Katuwang — partner) — that surfaces insights, tracks finances, monitors BIR deadlines, and drafts customer communications for Filipino micro and small business owners. Kai speaks first. Kai acts like a brilliant kababayan colleague, not a corporate tool.

---

## 2. Target Market

**Market:** 1.1 million digitally-active Filipino MSMEs
**Primary pain points:**
- Receipt and expense tracking is manual, error-prone, done in notebooks or scattered photos
- BIR compliance is anxiety-inducing — deadlines are missed, penalties are feared
- Cash flow visibility is near-zero — owners don't know if they're profitable
- Customer communications (DMs, follow-ups) consume hours daily

**Market validation (March 2026):** All four pain points confirmed by real-world sentiment research:
- **BCG "Heart of Hustle" (July 2025, n=3,098 MSMEs with DTI):** 77% want digital tools, only 16% use any. 74% say "business not big enough" for tools. MSMEs represent 99.5% of PH businesses, 60%+ of workforce.
- **Reddit/Facebook sentiment:** BIR anxiety is visceral — users describe "anxiety disorder," fear of "incarceration," ₱1K/year penalties for missed filings. Real Filipino expressions: "nakakatakot," "nahihirapan," "nalilito."
- **CPA Australia (May 2025):** Filipino SMEs lag regional peers in digital adoption. 69% of those who invested in tech saw improved profitability (vs 56% regional avg).
- **Competitor signal:** A CPA on r/BusinessPH is actively researching "a software/digital product to make filing easier" — confirms the gap.
- Full research: `shared/market-sentiment-research.md`

**Primary persona: Maria** — home-based food seller, 35–45 years old, earns ₱80K–₱250K/month, active on Facebook and Shopee, comfortable with GCash, afraid of BIR, manages everything on her phone. The "Maria Moment" is when she opens AKBai and sees "Kumikita ka. ₱18,400 ang net mo this month" — something true about her business she didn't know, in her language, before it's too late to act on it.

**Full persona set:**
| Persona | Type | Age | Primary Pain |
|---------|------|-----|--------------|
| Maria | Home baker / food seller | 35–45 | BIR compliance, expense tracking |
| Jose | Online seller (Shopee/Lazada) | 28–35 | GCash income reconciliation, VAT |
| Ana | Freelance creative | 25–30 | 8% flat tax, invoice tracking |
| Andoy | Sari-sari / micro-retail | 40–55 | Daily cash flow, inventory costing |

---

## 3. Tech Stack

**Frontend:** Next.js 16 App Router, TypeScript (strict), Tailwind CSS + Shadcn/UI, TanStack Query + Persister (offline-first caching), mobile-first PWA
**Database:** Supabase — Postgres, Auth, Storage, Realtime, Edge Functions
**AI:** Claude API — Haiku (OCR, classification, free tier), Sonnet (Kai reasoning, Pro/Business tier)
**Payments:** Xendit — subscription billing, GCash as primary payment method
**Deploy:** Vercel (Phase 1 primary, free tier) → Cloudflare Pages (Month 7+ cost optimization, $5/mo)
**Email:** Resend (transactional — winback sequences, BIR deadline reminders, payment notifications)
**Monitoring:** Sentry (errors), PostHog (analytics), UptimeRobot (uptime)
**Comms:** WhatsApp Business API (Phase 2), Meta Messenger (Phase 1 manual)

**Architecture principles:**
- RLS on every Supabase table (user_id scoped) — no exceptions
- All Claude API calls server-side only — never expose API key to client
- Soft-delete everywhere (deleted_at timestamp) — never hard-delete user data
- Circuit breaker on daily Claude API spend — hard cap to prevent cost overrun
- Feature folders: /app/(features)/[feature-name]/ pattern
- **Domain-expandable architecture:** System prompt uses modular scope sections ([TAX_SCOPE], [COMMUNICATION_SCOPE], etc.) so Phase 4+ domains can be added as configuration changes, not rewrites. Conversation history is domain-tagged. Out-of-scope redirects are logged for demand signal.

---

## 4. Tier Structure

| Tier | Price | Scans/mo | AI Model | Key Features |
|------|-------|----------|----------|--------------|
| Free | ₱0 | 0 | Haiku only | Text queries (10/day), basic BIR deadlines |
| Pro | ₱399/mo | 50 | Sonnet + Haiku | Full feature set, receipt scanning, morning briefing |
| Business | ₱899/mo | 80 | Sonnet + Haiku | GSheets OAuth, multi-seat (up to 5 team members: Owner, Accountant, Viewer), priority support |
| Scale (Phase 3) | ₱1,499/mo | Unlimited | Sonnet + Haiku | All Business + unlimited custom behaviors, API integrations, cross-channel outbound, priority support |

**Pricing roadmap:** Pro ₱449 (Y2), ₱499 (Y3). Business ₱999 (Y2), ₱1,099 (Y3). Scale tier launches Phase 3.

---

## 5. Core MVP Features (Phase 1)

Build order (Build 0 → Build 8):

0. **Build 0: AI Scope Definition & System Prompt Architecture** — HARD GATE before Build 1. Defines in-scope/out-of-scope boundaries, financial disclaimer, conversational Filipino tone, domain-expandable prompt structure with modular scope sections. See Post-Implementation Vision v1 for Phase 4+ expansion.
1. **Kilala Kita** — 5-step hybrid onboarding. Sets business type, income range, primary pain, BIR consent, data bootstrap. Powers all Kai personalization.
2. **Dashboard** — Business health at a glance. Cash position, sales trends, BIR deadlines, task list. Home tab of PWA.
3. **Resibo Scanner** — Camera → Claude Haiku Vision → structured expense card. Cost: ₱0.16/scan.
4. **Saan Napunta** — Expense dashboard. Categorized spend, monthly trends, cash flow visibility.
5. **Ang Umaga Mo** — Morning Briefing card. Kai proactively summarizes yesterday's income, today's BIR deadlines, cash position.
6. **Deadline Watcher** — BIR compliance calendar. Deadlines by business type. Push notifications (7/3/1-day sequence for Pro).
7. **Reply Drafter** — Kai drafts customer DM replies. Phase 1: manual copy-paste. Phase 2: Meta Messenger API.
8. **Costing Cards + Invoice Cards** — Margin calculator + invoice creation/tracking/PDF export.

**Also included in builds (not separate builds):**
- **Daily Check-In** (Build 2 scope) — Evening in-app modal (default 8PM), 60-second habit for daily sales + expenses entry.
- **Weekly Reconciliation** (Build 5 scope) — Friday 9AM prompt, surfaces missing days from past 7.
- **Monthly Reconciliation** (Build 5 scope) — End-of-month summary card, shareable to WhatsApp/PDF.

---

## 6. Phase Structure & Targets

### Phase 0A — Legal Foundation (Weeks 1–4)
- DTI/SEC registration
- BIR Certificate of Registration
- NPC (National Privacy Commission) pre-compliance setup
- IP/trademark filing
- Gate: 5 legal items complete

### Phase 0B — Demand Validation (Weeks 4–10)
- 100+ waitlist signups (zero paid ads)
- Brand identity complete (Kai visual system)
- 5–6 SEO articles published (Taglish search queries, conversational Filipino prose)
- 10 founder interviews completed
- Gate: 100 waitlist signups

### Phase 0C — Paid Pilot (Optional, Weeks 8–12)
- 5-user paid pilot at ₱99–₱199 to validate willingness to pay
- Validates: payment flow, support load, conversational Filipino AI accuracy
- Gate: 3+ users willing to continue paying at Phase 1 pricing
- Transition plan: loyalty rate or grandfathering for pilot users (see Gap D8)
- **Note:** Phase 0C may run concurrently with late Phase 0B or early Phase 1. Skip if Phase 0B demand signals are strong enough.

### Phase 1 — MVP Build (Months 1–6)
- Build order: Build 0 (AI Scope) → Build 1 (Kilala Kita) → Build 2 (Dashboard) → Builds 3–5 (Core features) → Build 6–8 (Payments, Polish)
- **Phase 1 targets:** 50 registered users, 20 paying Pro subscribers, ₱6K–₱10K MRR
- Ends with Sense Check Gate (8-signal framework)

### Sense Check Gate (Month 6)
Go/No-Go for Phase 2 based on 8 signals — see product-owner skill.

### Phase 2 — Growth (Months 6–12)
- Business tier launch (₱899/mo, multi-seat up to 5), WhatsApp Business API, referral loop, churn recovery/dunning flow, micro-influencer program
- **Phase 2 targets:** 200 registered users, 80 paying subscribers (Pro + Business), ₱30K–₱50K MRR

### Phase 3 — Agent Builder Platform (Month 12+)
- Custom AI behaviors via conversational Filipino chat ("Every time I receive payment over ₱5,000, remind me to issue an OR")
- Scale tier launch (₱1,499/mo), unlimited behaviors + API integrations
- **Phase 3 targets:** 500+ users, 200 paying, ₱100K–₱200K MRR

### Phase 4+ — Domain Expansion (Month 19+)
- See Post-Implementation Vision v1. Expansion sequence: Marketing Advisory → Business Strategy → HR → Inventory/Supplier
- Architecture prep done in Build 0 (modular prompts, domain tags, redirect logging)

### Current Phase
> Current: Phase 0A — Frontend Redesign Phase 7 merged to main (2026-04-26) — feel-test gate moved to Session 4 start (no Phase 8 code work until Anton's 24h notes are captured)
> Build 0 shipped (2026-03-20). Build 1 frontend (Sprint 3, 2026-03-22). Build 2 complete (Sprint 5, 2026-03-25). Sprint 6: Design Gates 2 & 3 closed, UX gaps B1/B2/D6 resolved, first-run polish. Sprint 7: Build 4 (Saan Napunta/Expenses) shipped. Sprint 8+9: Build 5 (Ang Umaga Mo) + Build 6 (Deadline Watcher) + Build 7 (Reply Drafter) shipped. Sprint 10: Build 5 completed (reconciliation), illustrations wired, 6 dev-mode bugs fixed. Sprint 11 (2026-04-09): Conversational Filipino voice revision across ~130 files. **Frontend Redesign session 1 (2026-04-26)** shipped Phases 1+2 (research + synthesis), 3 (Tailwind tokens, Fraunces, palette context, i18n primitives), 4 (15 brand icons, 8 motifs, Kai composition, 512×512 mark). **Frontend Redesign session 2 (2026-04-26)** shipped Phase 5 (chrome — sidebar/bottom-nav re-skin, Vaul "Higit pa…" drawer, FIL/EN toggle, persona pill, `tablet:860px` breakpoint) and Phase 6 (auth+onboarding — KaiSitting login hero, OnboardingShell + SampaguitaProgress, Kai expression mapping per step, paper-note welcome tour with `user_metadata.welcome_tour_completed` cross-device persistence). **Frontend Redesign session 3 (2026-04-26)** shipped Phase 7 — the flagship home (Kumustahan hero with KaiSitting 168px + Fraunces greeting + Squiggle, PaperNote streak-aware check-in invite, 5-tile Hicks-law action grid with Phase 4 brand icons, WovenDivider, Kuwento ng Linggo card with KPI grid + BanigBarChart + Kai takeaway, FloatingPetals deferred per Q2). New `/api/weekly-story` stub (ADR-015) + `/api/morning-briefing` D6 tonal extension with graceful Claude fallback (Anton's call: credits intentionally not topped up before the 24h feel-test). Playwright visual-parity home-gate test built (8/8 passing). 1265 tests passing. **Next: 24h feel-test, then Phase 8 + 9** — Kausap, Saan, Scan, Deadlines.

### What's Built
- **Build 0 — AI Scope Definition** (2026-03-20): `/frontend/src/lib/claude/` module
  - 6-layer system prompt assembler (`assemble.ts`)
  - Model routing: Haiku for free/extraction, Sonnet for pro/reasoning (`model-router.ts`)
  - Guardrails: BIR disclaimer (17 triggers), input sanitizer (7 injection patterns), output filter (`guardrails.ts`)
  - Circuit breaker: daily spend caps ($5 global, $0.50/user), free tier 10-query limit (`circuit-breaker.ts`)
  - Cost estimator for pre-call budget checks (`cost-estimator.ts`)
  - Conversational Filipino error messages with trust recovery pattern (`errors.ts`)
  - Supabase migration: `daily_api_spend` table + `increment_daily_spend` RPC
  - Refactored `/api/chat/route.ts` with Zod validation + full guardrails pipeline
  - Vitest setup with 31 regression tests (all passing)

- **Security Hardening** (2026-03-20): Pre-Build 1 security audit response
  - `subscriptions` table with SELECT-only RLS — tier isolated from user-writable data
  - `protect_feature_flags()` trigger prevents user-side tier manipulation
  - `set_user_tier()` RPC for admin/webhook tier management
  - Fail-closed circuit breaker — 503 if spend tracking unavailable (was fail-open)
  - IP-based rate limiting in `proxy.ts` (20 req/min per IP for `/api/*`)
  - Security audit gaps tracked in gap-registry.md Category F (F1-F4, all resolved)
  - ADR-005 documenting security architecture decisions

- **Sprint 3 — Build 1 Frontend + Infrastructure** (2026-03-22):
  - UTC+8 timezone enforcement: shared `@/lib/timezone` module with `toManila()`, `getManilaToday()`, `formatManilaDate()` — Gap A3 resolved (ADR-006)
  - Kilala Kita onboarding UI: 5-step wizard (6 components), mobile-first light theme (dark mode available), conversational Filipino copy, `useRef`+`onClick` pattern — Gap B3 resolved
  - Onboarding schema: migration 005 (`onboarding_fields`), `/api/onboarding` route, Zod validation, 28 first-response templates
  - Onboarding rate-limit exemption: `checkCircuitBreaker()` `onboardingCompleted` param — Gap E3 resolved (ADR-008)
  - Sentry error monitoring: `@sentry/nextjs` client+server configs, `global-error.tsx`, source map uploads — Gap A4 resolved (ADR-007)
  - Dev-auth bypass for local development (`SKIP_AUTH` + `DEV_USER`)
  - PWA icons (icon-192.png, icon-512.png) added to `/public/icons/`
  - 208 tests passing across all modules

- **Sprint 4 — PostHog, Email, Dashboard Shell, OCR Pipeline** (2026-03-25):
  - PostHog analytics: `posthog-provider.tsx`, `lib/posthog/events.ts` (5 typed events), `lib/posthog/server.ts`, ADR-009 — Gap A5 resolved
  - Email module: `lib/email/templates.ts` (branded conversational Filipino magic link + confirmation), `lib/email/verify.ts` (Yahoo PH detection), `smtp-setup-guide.md` — Gap D1 downgraded to IMPORTANT
  - Build 2 Dashboard shell: `kai-greeting.tsx`, `dashboard-card.tsx`, `empty-state-card.tsx`, `bottom-nav.tsx`, migration 006 (`daily_check_in`), `/api/dashboard` with UTC+8 greeting
  - OCR pipeline: `lib/ocr/` (types, schemas, prompts, parse-receipt with Haiku-first + Sonnet fallback), `/api/ocr`, spike runner — Gap E1 pipeline built, awaiting test images
  - Login page redesigned to match `screen-mockups.html` — Gap A1 (Auth) resolved
  - 8 reference files refreshed, UX alignment (touch targets, theme-color, bubble width)

- **Sprint 5 — Build 2 Completion + Feature Flags + PWA + Branding** (2026-03-25):
  - Daily Check-In: `check-in-modal.tsx`, `check-in-section.tsx`, `money.ts`, migration 007
  - Dashboard data wiring: dynamic `getDashboardCards()`, `DashboardCard` summary prop
  - Profile/Settings: `/profile` page, `/api/profile` (GET+PATCH), dark mode toggle — Gap B4 resolved
  - Feature Flags: `lib/feature-flags/` (4 files) — Design Gate 6 IN PROGRESS
  - PWA: manifest.json enhanced, sw.js v2, `/offline` page — Design Gate 5 IN PROGRESS
  - Branding: local logos, white CTA text, light-first default, dark mode contrast, conversational Filipino copy (22 files)
  - 405 tests passing (68 new + 3 fixed, 0 failures)

- **Sprint 6 — Design Gate Closure + UX Quality** (2026-03-26):
  - Design Gate 2: `disclaimer-banner.tsx`, `flag-button.tsx`, `/api/flag-as-wrong`, migration 008 (flag_as_wrong_reports)
  - Design Gate 3: 25-case prompt regression test suite (`prompt-regression.test.ts`)
  - Gap B1: `loading-estimator.ts` + conversational Filipino wait estimate in chat loading
  - Gap B2: `free-tier-banner.tsx` + `queriesUsedToday` in chat API
  - Gap D6: `session-expiry-modal.tsx`, `session-watcher.ts`, `session-guard.tsx` in layout
  - First-run: welcome tour, Iba pa text field, income labels cleaned, login logo upgrade
  - Chat: local avatar, timestamps (UTC+8), scroll-to-bottom FAB
  - All 8 Design Gates now resolved

- **Sprint 7 — Build 4 (Saan Napunta / Expenses)** (2026-03-26):
  - Transactions table (migration 009), reconciliation prep (migration 010)
  - Expense categories with conversational Filipino labels (`lib/expenses/`)
  - `/api/expenses` CRUD + aggregation, `/expenses` page UI
  - Category chart, transaction list, add-transaction modal, month picker
  - Check-in → expenses integration
  - 559 tests passing (154 new)

- **Frontend Redesign Phases 1–4 — Research, Synthesis, Foundations, Brand Vocabulary** (2026-04-26):
  - Phase 1+1.5 research deliverables under `skills/ux-designer/references/research-sources/` (NotebookLM corpus + 5 surgical updates to canonical voice/UX docs).
  - Phase 2 synthesis at `design_handoff_akbai_redesign/synthesis/` — 30+ verdicts across A–F sections (all SIGNED OFF), 11 per-screen specs, B4/B5/B6 review repos APPROVED, 13 open questions RESOLVED.
  - Phase 3 foundations: Tailwind config (`tablet:860px` custom breakpoint, Fraunces serif, honey/sage/ink scales, 13 keyframes), palette context (`lib/palette/`), `next-intl` 4.9.1 i18n (`lib/i18n/{config,request,set-locale}.ts`, `messages/{fil,en}.json`, `revalidatePath('/', 'layout')` cookie write), `paper-note` shape utility, `pill` + `paper-note` primitives.
  - Phase 4 brand vocabulary: 15 brand icons (`components/illustrations/icons/`), 8 motifs (`CapizPattern`, `FloatingPetals`, `WovenDivider`, `Squiggle`, `TapeStrip`, `SwayingLeaf`, `Sunburst`, `DoodleArrow`), Kai composition (`Kai` + `KaiSitting` with 6 expressions: happy/concerned/thinking/celebrating/waving/working), 512×512 chroma-keyed Kai mark.
  - ADR-013: Phase 4 component organization — brand icons separate from `svg/`, decorative motifs extend the existing tree, no parallel components per Sprint 5 reuse rule.
  - 1167 tests passing (+46 Phase 4 + 12 Phase 3 i18n).

- **Frontend Redesign Phase 5 — Shared Chrome** (2026-04-26, commit `d9de0f5`):
  - Sidebar re-skin in place: KaiSitting brand lockup + Fraunces italic "ai" tail, persona pill (server-fetched in `(app)/layout.tsx`, taps to `/profile` per C4), 4 nav links + 5th `MoreDrawer` Vaul trigger, honey-gradient active pill, language toggle pinned bottom (C5).
  - Bottom nav re-skin in place: 5 tabs preserved (Home/Chat/Scan/Pera/More) — Profile dropped, More opens drawer with `showLanguageToggle` for mobile parity. Honey-deep active state, glass blur preserved (C6).
  - `MoreDrawer` (Vaul): 6 long-tail routes per C7 (Deadlines, Costing, Invoices, Drafts\*, Check-in, Kuwento\*) — Drafts + Kuwento as coming-soon stubs until Phase 10.
  - `LanguageToggle` (FIL/EN pill): wired to `useLocale()` + `setLocaleCookie` server action; `useTransition` to disable during the action.
  - `(app)/layout.tsx` async; fetches `users.display_name` + `business_profiles.{business_name, business_type}` server-side; `md:ml-64` → `tablet:ml-60` per C3 verdict.
  - i18n catalogs gain `nav.*`, `language.*`, `more.*` plus auth + onboarding namespaces.
  - 1180 tests passing (+13 chrome tests).

- **Frontend Redesign Phase 6 — Auth + Onboarding** (2026-04-26, commit `0efc271`):
  - Login redesign: KaiSitting 168px hero, Fraunces serif title, FloatingPetals (4) + single CapizPattern background, all copy via `auth.login.*` i18n keys.
  - `OnboardingShell`: kumustahan frame composing `SampaguitaProgress` + `<Kai expression>` + tilted `<PaperNote>` prompt + form slot. Tilt alternates per step.
  - `SampaguitaProgress`: 5-dot stepper (done = `IconSampaguita`, current = honey-deep filled circle, future = ring).
  - Wizard: maps Kai expression per step — `1: waving → 2: thinking → 3: happy → 4: concerned → 5: working`. Celebration step renders KaiSitting 144 + honey PaperNote with first Kai message.
  - 6 step components stripped of their ad-hoc Kai bubble + IllustrationWrapper; CTAs adopt the Phase 5 honey-gradient pill. State machines preserved (incl. `useRef`+`onClick` per the React 19 rule).
  - Welcome tour rebuilt: Kai-led header + 1 primary + 2 supporting paper-note cards. Pain → expression mapping. Completion persists to `supabase.auth.updateUser({ data: { welcome_tour_completed: true } })` with `localStorage.akbai_tour_seen` as same-device backup. Dashboard reads `user.user_metadata.welcome_tour_completed` and passes `initiallyCompleted` so returning users skip the overlay.
  - i18n catalogs gain `auth.login.*`, `onboarding.{tagline, stepN.*, celebrate.*, tour.*}`, full `welcomeTour.*` (FIL + EN).
  - Tagline updated to "Kamusta ka na?" / "How are you?" (commit `8fcad07`) — kumustahan opener replaces the placeholder.
  - 1188 tests passing (+8 sampaguita-progress + welcome-tour test rewritten).

- **Frontend Redesign Phase 5/6 follow-up fixes** (2026-04-26):
  - `(app)/onboarding/page.tsx` switched to service client under `SKIP_AUTH` (commit `a72cf0c`) — eliminates the page/API state-disagreement bug where the RLS-protected page rendered "fresh" while the service-client API rejected steps with `ALREADY_COMPLETED`. Pattern now matches `(app)/dashboard/page.tsx`.
  - `frontend/scripts/reset-dev-onboarding.mjs` (commit `a748cea`) — one-shot reset of `DEV_USER`'s `users` + `business_profiles` (soft-delete) + onboarding `ka_conversations` rows for fast re-walking the wizard in dev.
  - ADR-014 captures the SKIP_AUTH client consistency rule for future server pages.

- **Frontend Redesign Phase 7 — Flagship Home** (2026-04-26):
  - `(app)/dashboard/page.tsx` rebuilt as the canonical Phase 7 home per `screens/00-home.md`: outer `max-w-[760px] mx-auto px-5 py-6 pb-24 flex flex-col gap-[18px]` container, `<KumustahanHero>` (KaiSitting 168px + time-of-day pill + Fraunces 30/500 name line + Fraunces italic 26/500 "kumusta ka?" + single Squiggle underline + optional CapizPattern at 0.18), `<CheckInSection>` with `<PaperNote tilt="left" tape="left">` invite consuming streak data server-side, fixed 5-tile action grid in Hicks-law order (Scan resibo / Kausap si Kai / BIR paalala / Tamang presyo / Mga invoice) with re-skinned `dashboard-card.tsx` IN PLACE, `<WovenDivider>`, `<KuwentoCard>` (3-col KPI + `<BanigBarChart>` + Kai takeaway PaperNote + footer link), italic "— Kai" footer, `<FloatingPetalsLayer>` (Q2 deferral: static day 0, animated day 2+, reduced-motion always static).
  - `/api/weekly-story` (ADR-015) — new GET route. SKIP_AUTH service-client switch per ADR-014. All-tier (no tier check). Pure DB aggregation (no LLM, no cache table — Phase 10 introduces both). Returns `WeeklyStory` payload (`week_start`, `week_end`, `kita_centavos`, `gastos_centavos`, `tubo_centavos`, `daily_breakdown[7]`, `peak_day_index`, `takeaway`, `tone`). Tonal rotation (D6) deterministic via `pickTone(today) = (dayOfYear − 1) % 3`. 9 static templates × 3 week-shapes (positive / flat / negative tubo) in `lib/weekly-story/takeaway-templates.ts`.
  - `/api/morning-briefing` extended for D6 tonal hero tagline + graceful Claude fallback. New `tagline` + `tone` fields on `MorningBriefingResponse`. `outputFormatHint` added to the prompt assembler so Claude returns `{ briefing, tagline }` JSON. Credit-balance / 5xx / placeholder-key paths return `reason: 'no_credits'` with deterministic per-day fallback templates. Server-log paths sanitised (no Anthropic billing details, no Supabase error objects).
  - New components: `kumustahan-hero.tsx`, `kuwento-card.tsx`, `floating-petals-layer.tsx`, `banig-bar-chart.tsx` (Recharts custom Bar shape with banig stripe `<pattern>` + sampaguita peak marker, motion-reduce-aware).
  - New shared modules: `lib/streak/compute-streak.ts`, `lib/timezone/time-of-day.ts` (server-safe pure function — extracted from `kumustahan-hero.tsx` after a P1 runtime bug surfaced when a Server Component tried to import from a `'use client'` module).
  - i18n: `home.actions.{scanResibo,kausapKai,birPaalala,tamangPresyo,mgaInvoice}` restructured from string → `{ title, description }`; `home.checkin.summary.{mood,kita,gastos}` keys added; `common.cancel` consumed in the overwrite-confirm dialog. Both FIL + EN.
  - Tests: 89 vitest files / 1265 tests passing (+77 vs Phase 6 baseline) — `compute-streak` (9), `weekly-story/{aggregate,week-bounds,takeaway-templates}` (24), morning-briefing `{tone,fallback-templates}` (33), morning-briefing route extension (5), weekly-story route (5). Playwright `e2e/synthesis/home.spec.ts`: 8 tests (4 visual-parity captures at 390×844 + 1280×800 × FIL + EN with `maxDiffPixelRatio: 0.005`, petals deferral first-visit + day-2+, reduced-motion path, locale-flip end-to-end). All green; baselines recorded in `e2e/synthesis/home.spec.ts-snapshots/home/`.
  - ADR-015 landed; ADR-014 added to the index (was authored but unindexed in Phase 6).
  - **Next: Anton's 24h feel-test gate** (the immutable session boundary per the multi-session plan). Session 4 opens with the feel-test report captured in `sprint-history.md`; only after Anton reports back does Phase 8 + 9 (Kausap, Saan, Scan, Deadlines) start.

---

## 7. Unit Economics (Financial Model v5)

| Metric | Value |
|--------|-------|
| Receipt scan cost | ₱0.16/scan ($0.0028 × 57.2 PHP/USD) |
| Pro LTV | ₱9,975 (25-month avg lifetime) |
| Blended CAC | ₱110 (organic + paid mix) |
| LTV/CAC ratio | 91x |
| Break-even month | Month 7 |
| Y1 net profit target | ₱110,303 |
| Y1 end-of-year users | 399 |
| Pro gross margin | ~85% |

---

## 8. Kai Persona — Communication Rules

Kai is AKBai's AI personality — the smart ate/kuya who always has your back. Named after "Katuwang" (partner/collaborator).

Every user-facing output must follow these rules:

**Voice:** Warm, hyper-competent, conversational Filipino (Filipino syntactic frame with English retained for technical/BIR terms, Filipinized verbs, brand names, and numbers). Like a brilliant kababayan colleague who happens to know everything about business and taxes.

**Rules:**
- Uses "po" naturally — not every sentence, but when appropriate for warmth
- Speaks first (proactive) — e.g., "Magandang umaga po, Maria! Eto ang update mo ngayon..."
- Short sentences — max 2 lines per chat bubble
- Numbers always in digits (₱18,400 not "eighteen thousand four hundred pesos")
- Peso sign: ₱ always, never "PHP" or "Php"
- Calls users by first name when known

**Never:**
- Tax advice ("Konsultahin ang inyong CPA para sa opisyal na payo")
- Guaranteed financial outcomes
- Corporate-speak or jargon a Maria wouldn't understand
- Robotic filler phrases ("Certainly!", "As an AI...", "I'd be happy to...")
- Condescension or implying the user is doing something wrong

**BIR disclaimer (required on all tax-related outputs):**
"Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo."

---

## 9. Compliance Requirements

**NPC / RA 10173 (Data Privacy Act):**
- Registration with National Privacy Commission required before launch
- DPO (Data Protection Officer) designation required
- Privacy Policy and Terms of Service must be live at launch
- Data breach notification: 72-hour window to notify NPC
- User data deletion: 7-day purge window after request

**BIR Legal Boundaries:**
- AKBai provides tax reminders and calculations — NOT tax advice
- Disclaimer required on all BIR-related outputs
- No liability for incorrect deadline calculations
- Users responsible for their own filing

**Supabase Data Classification:**
- PII: name, email, phone number, business name → encrypted at rest
- Financial: transaction amounts, receipt data → encrypted at rest, RLS scoped
- Analytics: feature usage, session data → anonymized where possible

---

## 10. Solo Founder Constraints

- Anton works a day job at Globe Telecom (Mon–Fri, standard hours)
- Available for AKBai: evenings (2–3 hrs) and weekends (4–6 hrs Saturday)
- Max single uninterrupted work block: 4 hours
- Sprint capacity: 10–15 hours per 2-week sprint
- Claude Pro plan: token budget matters — keep sessions focused
- No team until Phase 2 (potential freelancer for Design or DevOps)

---

## 11. Source Documents (in /AKBai/Project Documents/)

| Document | Content | Skills That Use It |
|----------|---------|-------------------|
| AKBai_Complete_Roadmap_v14.docx | Full product roadmap, gap registry, feature specs, Build 0 AI Scope + Pre-Build Checklist | project-manager, product-owner, solutions-architect, ai-engineer |
| AKBai_Financial_Model_v5.xlsx | Unit economics, projections, cost model | ops-lead, product-owner |
| AKBai_Market_Research_v1.html (v1.1) | Personas, pain points, competitive landscape, First 100 Users GTM Playbook | marketing-lead, product-owner, ux-designer |
| AKBai_Operations_Playbook_v7.html | UX lifecycle, support triage, ops cadence, data ingestion flows, BIR Update Protocol, Offline UX Design | ops-lead, devops-engineer |
| AKBai_Operations_Roadmap_v6.docx | OPS Builds 0–5B, UAT environment, data ingestion pipeline | project-manager, devops-engineer |
| AKBai_Competitive_Brief_v2.html | 8 pain points, competitor matrix, knowledge base roadmap, competitive moat | marketing-lead, product-owner |
| AKBai_Post_Implementation_Vision_v1.html | Phase 4+ domain expansion (Marketing, Strategy, HR, Inventory) | solutions-architect, ai-engineer, product-owner |
| AKBai_Skills_Utilization_Guide_v1.html | Which skills to use per phase | All skills (meta-reference) |
