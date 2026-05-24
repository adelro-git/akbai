# AKBai — Sprint & Retro History

> Living document. Updated automatically by `/sprint` and `/retro` commands.
> New sessions: read this file first for project velocity context.
> Last updated: 2026-05-24 (Sprint 13 — Frontend Redesign Phase 8-9 close-out IN PROGRESS; Sprint 14 onward = Native Mobile Pivot via Capacitor + Kai-via-Gemini-prompts)

---

## How to Use This Document

- **Starting a new session?** Read the latest sprint entry + retro to understand where we left off.
- **Running `/sprint`?** Check carryover tasks and unresolved action items from the last retro.
- **Running `/retro`?** Compare plan vs. actuals from the sprint entry above.
- **Entries are appended** — newest at the bottom of each section. Never delete old entries.

---

## Sprint Log

### Sprint 1 — 2026-03-14 to 2026-03-20

**Phase:** 0A — Scaffold → Build 0
**Sprint Goal:** Ship Build 0 (AI Scope Definition & System Prompt Architecture) — the hard gate before Build 1.
**Capacity:** 10–15 hours

**Tasks:**

| # | Task | Size | Est. Hrs | Status | Notes |
|---|------|------|----------|--------|-------|
| 1 | Build 0: System prompt architecture | L | 4 | DONE | 6-layer prompt assembler, model routing, guardrails |
| 2 | Build 0: Circuit breaker + cost controls | M | 3 | DONE | Daily spend caps, free tier limits |
| 3 | Build 0: Regression test suite | M | 2.5 | DONE | 31 tests passing (Vitest) |
| 4 | Security hardening (pre-Build 1 audit) | M | 3 | DONE | RLS on subscriptions, fail-closed circuit breaker, rate limiting |
| 5 | Plugin scaffold (akbai-delivery) | S | 1.5 | DONE | 12 skills, 15 commands, shared context files |

**Actual hours used:** ~14 hrs
**Sprint outcome:** Goal met. Build 0 shipped. Design Gate 1 resolved.

**What was built:**
- `/frontend/src/lib/claude/` — full module (assemble.ts, model-router.ts, guardrails.ts, circuit-breaker.ts, cost-estimator.ts, errors.ts)
- Supabase migration: `daily_api_spend` table + `increment_daily_spend` RPC
- `subscriptions` table with SELECT-only RLS + `protect_feature_flags()` trigger
- IP-based rate limiting in `proxy.ts`
- 103 tests across 9 files (all passing)
- akbai-delivery plugin: 12 skills, 15 slash commands, shared context

### Sprint 2 — 2026-03-21 to 2026-04-04

**Phase:** 0A — Build 0 Complete, Pre-Build 1 Knowledge Foundation
**Sprint Goal:** Create the 4 Kai domain knowledge files so Build 1 (Kilala Kita) can deliver the "Maria Moment."
**Capacity:** 12 hours

**Tasks:**

| # | Task | Size | Est. Hrs | Status | Notes |
|---|------|------|----------|--------|-------|
| 1 | BIR Knowledge Base | M | 3 | DONE | Shipped 2026-03-21. 282-line reference: forms, deadlines, rates, VAT rules, persona mistakes, glossary. |
| 2 | MSME Business Knowledge | M | 3 | DONE | Shipped 2026-03-22. Expanded to 735 lines: 6 full profiles + 9 stubs, 16-type taxonomy, fallback chain. Also created `004_business_benchmarks.sql` migration (compounding knowledge table). |
| 3 | Kilala Kita Onboarding Context | S | 2 | DONE | Shipped 2026-03-22. 28 first-response templates (5+2 types × 4 pains), knowledge map, personalization variable flow, CPA escalation rules. |
| 4 | Taglish Manual Population | S | 1.5 | DONE | Shipped 2026-03-22. All 10 sections populated + `filipino-text-vernacular.md`. Anton reviewed and approved 2026-03-22. |
| 5 | Scopes Enrichment + Gap Registry | XS | 1 | DONE | Shipped 2026-03-22. TAX_SCOPE enriched with BIR form decision tree + persona warnings. Gap registry Design Gate #3 updated. 6 integration tests passing (109 total). |
| 6 | `.env.local.example` + Dev Setup | XS | 0.5 | DONE | Shipped 2026-03-22. `.env.local.example` created, Dev Setup section added to HANDOVER.md, `.gitignore` updated. Resolves Sprint 1 Retro action #1. |

**Actual hours used:** ~11 hrs (Tasks 1-3: ~8 hrs, Task 4: ~1.5 hrs, Task 5: ~1 hr, Task 6: ~0.5 hrs)
**Sprint outcome:** COMPLETE — All 6 tasks done. All 4 Sprint 1 retro actions resolved.

**What was built beyond original scope (Task 2 expansion):**
- 16-type business taxonomy with `{category}_{subtype}` naming convention (was 4 types)
- 2 new full profiles: Food/Carinderia (§7), Service/Salon (§8)
- 9 Phase 3 stub profiles with overview tables
- `business_benchmarks` Supabase table (migration 004) with JSONB metrics, RLS, seed data for 6 types
- Updated `supabase-schema.md` with §15 business_benchmarks

### Sprint 3 — 2026-03-23 to 2026-04-05

**Phase:** 0A — Build 1 Start
**Sprint Goal:** Ship the Kilala Kita onboarding UI (Build 1 frontend) and wire UTC+8 timezone enforcement (A3) so the app foundation is ready for user data.
**Capacity:** 12 hours

**Tasks:**

| # | Task | Size | Est. Hrs | Status | Notes |
|---|------|------|----------|--------|-------|
| 1 | UTC+8 timezone enforcement (Gap A3) | S | 2 | DONE | Shipped 2026-03-22. Shared `@/lib/timezone` module, 12 tests, convention in tech-stack.md. |
| 2 | Kilala Kita onboarding schema + API | M | 3 | DONE | Shipped 2026-03-22. Migration 005, `/api/onboarding` route, Zod schemas, 28 first-response templates. Gap B3 resolved. |
| 3 | Kilala Kita onboarding UI (5-step flow) | L | 4 | DONE | Shipped 2026-03-22. 6 components, step wizard, mobile-first dark theme, Taglish copy, useRef+onClick. |
| 4 | Onboarding rate-limit exemption (Gap E3) | S | 1.5 | DONE | Shipped 2026-03-22. checkCircuitBreaker() onboardingCompleted param, 3 new tests. ADR-008. |
| 5 | Sentry error monitoring setup (Gap A4) | S | 1.5 | DONE | Shipped 2026-03-22. @sentry/nextjs client+server configs, global-error.tsx, DSN from env. ADR-007. |

**Actual hours used:** ~12 hrs (per commit 4f99d14)
**Sprint outcome:** COMPLETE — All 5 tasks done. 208 tests passing. Gaps A3, A4, B3, E3 resolved.

**Detailed task breakdowns:**

**Task 1: UTC+8 Timezone Enforcement (S — 2 hrs)**
Why: CRITICAL gap A3 — all BIR deadlines, timestamps, and push notifications must use Asia/Manila.
- [ ] Create shared `timezone.ts` utility in `/frontend/src/lib/` with `toManila()`, `formatManilaDate()`, `getManilaToday()`
- [ ] Add Supabase helper for `AT TIME ZONE 'Asia/Manila'` queries
- [ ] Update chat API route and existing date displays to use the utility
- [ ] Write 5+ unit tests covering timezone conversion edge cases
- [ ] Document convention in `shared/tech-stack.md`
Done when: All user-facing timestamps render in PHT (UTC+8), utility tested, convention documented.

**Task 2: Kilala Kita Onboarding Schema + API (M — 3 hrs)**
Why: Build 1 data layer — onboarding needs tables for business profiles and resumable step-by-step progress (Gap B3).
- [ ] Read `kilala-kita-context.md` and map 5 onboarding steps to data fields
- [ ] Create Supabase migration: `business_profiles` table with RLS, soft-delete
- [ ] Create `/api/onboarding/route.ts` — POST save/update, GET resume from last step
- [ ] Add Zod schemas for onboarding input validation per step
- [ ] Write 4+ API tests: save step, resume from step 3, complete flow, validation errors
Done when: Onboarding data saves step-by-step, resumes on return, all tests pass.

**Task 3: Kilala Kita Onboarding UI — 5-Step Flow (L — 4 hrs)**
Why: Build 1 frontend — user's first experience with Kai. Must deliver the "Maria Moment."
- [ ] Create `/app/(features)/onboarding/` route with step-based state machine
- [ ] Build Step 1: Business type selector (16-type taxonomy from `msme-business-knowledge.md`)
- [ ] Build Step 2: Income range selector
- [ ] Build Step 3: Primary pain selector
- [ ] Build Step 4: BIR consent + data privacy acknowledgment
- [ ] Build Step 5: Kai first response — personalized greeting from `kilala-kita-context.md` templates
- [ ] Wire to Task 2 API — save progress on each step, resume on return (Gap B3)
Done when: User completes all 5 steps, sees personalized Kai greeting, can resume mid-flow.
Depends on: Task 2

**Task 4: Onboarding Rate-Limit Exemption (S — 1.5 hrs)**
Why: CRITICAL gap E3 — free tier 10-query/day must NOT count during onboarding.
- [ ] Read `circuit-breaker.ts` and identify where query counting happens
- [ ] Add `isOnboarding` check — bypass counter if `onboarding_step < 5`
- [ ] Update circuit breaker tests: verify onboarding queries exempt
- [ ] Add integration test: onboarding flow → complete → counter starts at 0
Done when: Onboarding queries don't count toward daily limit, verified by tests.
Depends on: Task 2

**Task 5: Sentry Error Monitoring Setup (S — 1.5 hrs)**
Why: CRITICAL gap A4 — zero production visibility without error monitoring.
- [ ] Install `@sentry/nextjs` and run Sentry wizard for config files
- [ ] Configure DSN from env var, enable source maps
- [ ] Add Sentry to error boundary and API routes
- [ ] Add `NEXT_PUBLIC_SENTRY_DSN` to `.env.local.example`
- [ ] Test: trigger deliberate error, confirm it appears in Sentry
Done when: Errors from client and server captured in Sentry with source maps.

### Sprint 4 — 2026-03-24 to 2026-04-06

**Phase:** 0A — Clearing Phase 0B gate
**Sprint Goal:** Resolve 3 CRITICAL gaps (A5 PostHog, D1 OTP, E1 OCR spike), refresh stale reference files, align UI with UX design system, and ship Build 2 dashboard shell.
**Capacity:** 13.5 hours
**Context:** Sense check returned RED (4/8). A1 (Auth) discovered to be 95% complete — marking resolved. Hybrid sprint: gap resolution + visible product progress.

**Tasks:**

| # | Task | Size | Est. Hrs | Status | Notes |
|---|------|------|----------|--------|-------|
| 1 | Housekeeping: commit Sprint 3 + ref file refresh + UX alignment | S | 2 | DONE | 8 ref files updated, 5 UX fixes (theme-color, touch targets, bubble width, font weight). Login page redesigned to match screen-mockups.html. |
| 2 | PostHog analytics setup (Gap A5) | S | 2.5 | DONE | posthog-js + posthog-node, PHProvider with auto-identify, 5 typed events, dashboard-tracker, ADR-009. Gap A5 resolved. |
| 3 | Custom SMTP + OTP fix (Gap D1) | S | 2 | DONE | Code side: branded email templates, Yahoo PH detection, smtp-setup-guide.md. D1 downgraded to IMPORTANT — Supabase built-in email sufficient for dev. External setup deferred until domain purchased. |
| 4 | Build 2 Dashboard shell + schema | M | 5 | DONE | Migration 006 (daily_check_in), /api/dashboard with UTC+8 greeting, KaiGreeting, DashboardCard, EmptyStateCard, BottomNav. 43 new tests. |
| 5 | OCR spike (Gap E1) | S | 2 | DONE | Full pipeline: types, Zod schemas, Filipino receipt prompt, Haiku-first + Sonnet fallback, /api/ocr route, spike runner. 46 tests. Awaiting receipt images from Anton. |
| 6 | Light-first design system pivot ("Sun-Drenched Atelier") | L | — | DONE | Pivoted from dark-first (#07101e) to light-first (#fdf9f2) with dark mode toggle. Updated 35 files: globals.css MD3 CSS variables, tailwind.config MD3 tokens, 21 component migrations, 9 doc/reference files, new design-system.md spec, email templates. PR #9 merged to main 2026-03-25. |
| — | Unplanned: Login UX bug fixes | S | — | DONE | OTP autofill fix, back-button email persistence, rate-limit error message, Next.js dev indicator removal. |
| — | Unplanned: Gap registry + repo cleanup | XS | — | DONE | A1, A5 resolved. D1 downgraded. Stale branches deleted (master, review-dev-progress). |

**Actual hours used:** ~3-4 hrs Anton time + multi-agent parallel execution (first sprint using this workflow)
**Sprint outcome:** COMPLETE — All 5 planned tasks code-complete. 6/6 tasks done + 2 unplanned items. 129 new tests. Gaps A1, A5 resolved. D1 downgraded.

**What was built:**
- PostHog analytics: `posthog-provider.tsx`, `lib/posthog/events.ts`, `lib/posthog/server.ts`, `dashboard-tracker.tsx`
- Email module: `lib/email/templates.ts`, `lib/email/verify.ts`, `smtp-setup-guide.md`
- Dashboard shell: `kai-greeting.tsx`, `dashboard-card.tsx`, `empty-state-card.tsx`, `bottom-nav.tsx`, migration 006
- OCR pipeline: `lib/ocr/` (types, schemas, prompts, parse-receipt), `/api/ocr`, spike runner + fixtures
- Login redesign: atmospheric glow, gradient CTA, input icons, mockup-aligned layout
- 8 reference files refreshed, UX alignment (touch targets, theme-color, bubble width)
- Design system pivot to light-first with MD3 color tokens (separate session)

---

## Retro Log

### Sprint 1 Retro — 2026-03-20

**What Went Well:**
- Build 0 shipped end-to-end in one sprint — prompt assembler, guardrails, circuit breaker, tests, security hardening
- The skill/command plugin system (akbai-delivery) gives structured workflows for every role
- Itemized checklists in sprint plan made it easy to pick up work across evening sessions
- Security audit caught real issues (fail-open circuit breaker, user-writable tiers) before they became production bugs

**What Didn't Go Well:**
- No `.env.local.example` — new sessions can't set up dev environment without asking
- Domain knowledge for Kai is missing — scopes have boundaries but no actual BIR/business data
- Taglish manual is 100% placeholder (all 10 sections say "Awaiting entries")
- Sprint plan wasn't saved anywhere persistent — had to reconstruct context from git history

**What We Learned:**
- Build 0 scope was right-sized for a sprint — the "ship one hard gate" pattern works
- Kai has rules but no knowledge — boundary rules without domain data means Build 1 will produce an empty-feeling AI
- Context persistence between sessions is a real gap — need a living document for sprint/retro history (this file!)

**Action Items:**

| # | Action | Owner | Due By | Status | Notes |
|---|--------|-------|--------|--------|-------|
| 1 | Create `.env.local.example` + dev setup docs | Anton | Sprint 2 | DONE | Sprint 2 Task #6 |
| 2 | Create BIR knowledge base (`bir-knowledge-base.md`) | Anton + Claude | Sprint 2 | DONE | Sprint 2 Task #1 |
| 3 | Create MSME business knowledge (`msme-business-knowledge.md`) | Anton + Claude | Sprint 2 | DONE | Sprint 2 Task #2 (expanded to 16 types) |
| 4 | Populate Taglish manual (10 sections) | Anton + Claude | Sprint 2 | DONE | Sprint 2 Task #4 |
| 5 | Create sprint-history.md living document | Anton + Claude | Sprint 2 | DONE | This file |

**Energy Check:**
- **Sustainability:** Felt good — productive sprint, clear goal, shipped something real
- **Saturday block:** Used (Build 0 integration + security hardening)
- **Evening consistency:** Strong — multiple evening sessions
- **Recommendation:** Keep pace. Sprint 2 can target same capacity (10–15 hrs)

### Sprint 2 Retro — 2026-03-22

**What Went Well:**
- Shipped all 6 tasks — 100% completion rate, all Sprint 1 retro actions resolved
- Context/knowledge files were highly productive: BIR KB (282 lines), MSME KB (735 lines, expanded from 4 to 16 business types), Kilala Kita (28 templates), Taglish manual (all 10 sections)
- Task 2 expansion (4→16 types + benchmarks migration) added clear value without blowing capacity
- TAX_SCOPE enrichment wired domain knowledge directly into the runtime — Kai now has real BIR data, not just boundaries

**What Didn't Go Well:**
- No significant blockers this sprint — clean execution throughout

**What We Learned:**
- Knowledge foundation sprints are high-leverage: one sprint of context files makes every future build smarter
- The amount of domain context achievable in a single sprint was surprising — 6 files, 1400+ lines of production-ready reference material
- Structured sprint plans with clear "Done when" criteria and checklist items keep sessions focused and measurable

**Action Items:**

| # | Action | Owner | Due By | Status | Notes |
|---|--------|-------|--------|--------|-------|
| — | No new action items | — | — | — | Clean sprint, no process changes needed |

**Energy Check:**
- **Sustainability:** Felt good — productive sprint, clean execution
- **Saturday block:** Used
- **Evening consistency:** Strong
- **Recommendation:** Keep pace. Sprint 3 can target same capacity (12 hrs). Ready for Build 1 (Kilala Kita) or next phase gate work.

### Sprint 4 Retro — 2026-03-25

**What Went Well:**
- Multi-agent parallel execution was a game-changer — 5 tasks built simultaneously by isolated agents, all code-complete in one session
- The skill/command plugin system gave each agent clear context (SKILL.md files, shared references) so they could work autonomously with high-quality output
- Sprint delivered 129 new tests, 4 new modules (PostHog, email, dashboard, OCR), and resolved 2 CRITICAL gaps — most productive sprint to date
- Login page UX iteration with Anton's live feedback caught real bugs (autofill, back button, rate limit) that wouldn't surface in tests

**What Didn't Go Well:**
- Hour estimates were calibrated for manual development (13.5 hrs), but multi-agent execution compressed agent work to ~20 minutes — the real constraint was Anton's time for testing, decisions, and external setup (~3-4 hrs)
- External dependencies weren't anticipated well: no domain for SMTP, no receipt images for OCR spike, Supabase CLI needed auth token for migration push
- Login page mockup alignment required multiple iterations — the gap between the screen-mockups.html reference and the implemented UI wasn't flagged until Anton raised it

**What We Learned:**
- The velocity model needs a fundamental rethink. "Hours" should split into **agent time** (parallel, fast, measured in minutes) and **Anton time** (testing, decisions, external setup — the actual bottleneck). Sprint capacity should be measured in Anton-hours, not total development hours.
- Multi-session parallel sprints are viable and desirable. Independent workstreams (e.g., OCR pipeline vs. dashboard UI vs. analytics) can be assigned to separate Claude Code sessions, each with a clear branch and scope. A master plan file could coordinate this.
- External dependencies (domain purchase, API keys, test data) should be identified as explicit "Anton prerequisites" in the sprint plan, separate from development tasks. This prevents mid-sprint surprises.

**Action Items:**

| # | Action | Owner | Due By | Status | Notes |
|---|--------|-------|--------|--------|-------|
| 1 | Recalibrate sprint estimation: replace "Est. Hrs" with "Agent Size" (S/M/L) + "Anton Time" (hrs for testing/decisions/setup) | Claude (PM skill) | Sprint 5 planning | OPEN | Current hour model is meaningless with multi-agent execution |
| 2 | Design parallel sprint framework: master plan file format that assigns independent workstreams to separate sessions with branch conventions | Claude (PM skill) | Sprint 5 planning | OPEN | Anton requested this — would multiply throughput further |
| 3 | Collect 10-15 real Filipino receipt images for OCR spike completion | Anton | Sprint 5 | OPEN | Carryover from Task 5 — pipeline + test harness ready, just needs test data |

**Energy Check:**
- **Sustainability:** Felt good — multi-agent workflow reduced Anton's active time significantly
- **Saturday block:** N/A — sprint executed primarily in one session
- **Evening consistency:** Sprint compressed into focused session + iterative feedback
- **Recommendation:** Increase scope for Sprint 5. Multi-agent execution unlocks significantly more throughput per sprint. The bottleneck is now Anton's review/testing time, not development hours. Consider parallel sessions for independent workstreams.

### Sprint 5 — 2026-03-25 to 2026-04-06

**Phase:** 0A — Build 2 Completion
**Sprint Goal:** Complete Build 2 — ship Daily Check-In UI, wire dashboard cards to real data, build Profile page, and add Feature Flag + PWA infrastructure.
**Capacity:** 5–6 hours (Anton review/testing/decisions)
**Context:** Second multi-agent sprint. 3 parallel streams (checkin, profile, infra) in worktree isolation. First sprint with live user testing by Anton.

**Tasks:**

| # | Task | Agent Size | Anton Time | Status | Notes |
|---|------|------------|------------|--------|-------|
| 1 | Daily Check-In Modal + Schema Extension | M | 1 hr | DONE | Migration 007 (sales/expenses centavos), CheckInModal bottom-sheet, mood emojis, peso inputs, CheckInSection CTA/summary. |
| 2 | Dashboard Card Data Wiring | S | 0.5 hr | DONE | Dynamic getDashboardCards(), Quick Chat shows message count, BIR card reflects registration. summary prop on DashboardCard. |
| 3 | Profile/Settings Page | M | 1.5 hr | DONE | /profile page, ProfileView, ProfileEditForm, /api/profile (GET+PATCH), ThemeToggle, sign-out, shared business-options.ts. Gap B4 resolved. |
| 4 | Feature Flag Utility | S | 0.5 hr | DONE | lib/feature-flags/ (index, flags, admin, middleware). getFeatureFlag() fail-closed, typed FLAGS const, withFeatureFlag API helper. Design Gate 6 IN PROGRESS. |
| 5 | PWA Manifest + Offline Fallback | S | 0.5 hr | DONE | manifest.json enhanced (start_url /dashboard, split icons, shortcuts), sw.js v2 with offline fallback, /offline page with Taglish copy. Design Gate 5 IN PROGRESS. |
| — | Branding alignment (unplanned) | M | 1 hr | DONE | 22 files: local logos, white CTA text, light-first default, dark mode contrast, Taglish copy, non-token colors → MD3 tokens. |
| — | Chat route bug fix (pre-existing) | S | — | DONE | userData scoping fix in route.ts, resolved 3 pre-existing test failures. |

**Actual Anton time:** ~4-5 hrs (review, live testing, UX feedback, branding decisions)
**Sprint outcome:** COMPLETE — All 5 planned tasks + 2 unplanned items done. 68 new tests + 3 fixed = 405 total, 0 failures. Build 2 functionally complete. Gaps B4, B5 (partial), B7/D9 (partial), Design Gates 5 & 6 (IN PROGRESS).

**What was built:**
- Daily Check-In: `check-in-modal.tsx`, `check-in-section.tsx`, `money.ts`, migration 007
- Dashboard wiring: dynamic `getDashboardCards()`, `DashboardCard` summary prop
- Profile: `profile/page.tsx`, `profile-view.tsx`, `profile-edit-form.tsx`, `theme-toggle.tsx`, `/api/profile/route.ts`, `business-options.ts`
- Feature Flags: `lib/feature-flags/` (index, flags, admin, middleware) — 4 files
- PWA: manifest.json enhanced, sw.js v2, `/offline` page + retry-button
- Branding: 4 local logo assets, 18 component files updated for design system compliance
- PostHog: 3 new events (daily_check_in_completed, profile_updated, signed_out)

---

## Retro Log

### Sprint 5 Retro — 2026-03-25

**What Went Well:**
- Multi-agent parallel delivery continues to be a game-changer — 3 streams (checkin, profile, infra) built simultaneously in worktree isolation, merged with only 1 minor conflict (posthog/events.ts)
- Live testing the running app surfaced real branding and UX issues that code review alone would never catch — 17+ design violations found and fixed, plus 5 actionable UX improvements captured for Sprint 6
- Sprint scope was right-sized for Anton's capacity — 5 planned tasks at ~4 hrs Anton time with buffer, leaving room for the unplanned branding work without feeling stretched

**What Didn't Go Well:**
- Parallel agents didn't follow the design system closely enough — new Sprint 5 components (offline page, profile) used hardcoded colors instead of tokens, and ALL existing CTA buttons across the app had wrong text color (`text-on-primary-container` instead of `text-on-primary`). Required a full manual branding pass to fix 22 files. This is the biggest process gap: agents read SKILL.md but not always design-system.md deeply enough.

**What We Learned:**
- Live user testing is non-negotiable — Anton's 15 minutes of clicking through the app produced more actionable feedback than all the automated tests combined. Should be a standard sprint step, not ad-hoc.
- Design system gaps compound across sprints — the CTA button text color was wrong since Sprint 3 (Build 1) but wasn't caught until Sprint 5 live testing. Older builds that predate the Sprint 4 "Sun-Drenched Atelier" pivot were never retroactively aligned. Future agent prompts must explicitly reference design-system.md for any UI work.
- The Agent Size + Anton Time estimation model (Sprint 4 retro action #1) works well — Sprint 5 was the first sprint planned with it, and the estimates were accurate (4 hrs planned, ~4-5 hrs actual).

**Action Items:**

| # | Action | Owner | Due By | Status | Notes |
|---|--------|-------|--------|--------|-------|
| 1 | Add design-system.md to mandatory reading list for all agent prompts doing UI work — agents must use MD3 tokens, never hardcoded colors, and white text on primary CTA buttons | Claude (PM skill) | Sprint 6 planning | OPEN | Prevents the 22-file branding fix from recurring |
| 2 | Add "Anton live testing" as a standard sprint step after merge — 15-30 min clicking through the running app before PR | Claude (PM skill) | Sprint 6 planning | OPEN | Surfaced 5+ UX issues and 17+ branding violations this sprint |
| 3 | Collect 10-15 receipt images for OCR spike | Anton | Sprint 6 | OPEN | Carryover from Sprint 4 retro action #3 — still needed for Gap E1 completion |

**Energy Check:**
- **Sustainability:** Felt good — could maintain this pace
- **Saturday block:** N/A — sprint executed in one focused session
- **Evening consistency:** Single session + iterative feedback
- **Recommendation:** Keep pace. Multi-agent + live testing is the right workflow. Add design system compliance to agent prompts to reduce unplanned branding work.

### Sprint 6 — 2026-03-26

**Phase:** 0A — Post-Build 2 Quality
**Sprint Goal:** Close Design Gates 2 and 3, fix UX gaps B1/B2/D6, and polish the first-run experience.
**Capacity:** 5 hours (Anton review/testing/decisions)
**Context:** First dual-sprint plan (Sprint 6+7 planned together). 3 parallel streams via worktree isolation. Sprint 7 expenses work also landed via parallel session.

**Tasks:**

| # | Task | Agent Size | Anton Time | Status | Notes |
|---|------|------------|------------|--------|-------|
| 1 | Flag-as-wrong + trust recovery (Design Gate 2) | M | S (0.5hr) | DONE | Stream A: migration 008, /api/flag-as-wrong, disclaimer-banner, flag-button. 30 tests |
| 2 | Prompt regression tests — 25 cases (Design Gate 3) | M | S (0.5hr) | DONE | Stream B: 25 deterministic prompt regression tests. Design Gate 3 closed |
| 3 | AI loading estimate (Gap B1) | S | XS | DONE | Stream B: loading-estimator.ts, Taglish wait text, 5s long-wait update. 7 tests |
| 4 | Free tier limit warning (Gap B2) | S | XS | DONE | Stream B: free-tier-banner.tsx, queriesUsedToday in chat API. 11 tests |
| 5 | Session expiry UX (Gap D6) | S | S (0.5hr) | DONE | Stream C: session-expiry-modal, session-watcher hook, SessionGuard in layout |
| 6 | First-run polish (Sprint 5 deferred) | M | S (0.5hr) | DONE | Stream C: login logo w-56 mark-honey, Iba pa text field, income labels cleaned, welcome tour on dashboard |
| 7 | Chat UX improvements | S | XS | DONE | Stream C: local avatar, timestamps (UTC+8), scroll-to-bottom FAB |
| 8 | Anton live testing | — | M (1hr) | DONE | Live testing completed. Fixes: logo drop-shadow, chat input useRef, welcome tour personalization, bottom nav on /chat |

**Parallel Streams:**
- **Stream A** (`claude/sprint6-trust`): Task 1 — Design Gate 2
- **Stream B** (`claude/sprint6-prompts`): Tasks 2, 3, 4 — Design Gate 3 + UX gaps
- **Stream C** (`claude/sprint6-ux`): Tasks 5, 6, 7 — Session expiry + polish + chat improvements
- **Merge order:** A → C → B. 2 merge conflicts resolved (chat-bubble.tsx, message-list.tsx, chat-interface.tsx)

**What was built:**
- Design Gate 2: `disclaimer-banner.tsx`, `flag-button.tsx`, `/api/flag-as-wrong/route.ts`, migration 008 (flag_as_wrong_reports)
- Design Gate 3: `prompt-regression.test.ts` (25 tests across 5 groups)
- Gap B1: `loading-estimator.ts`, Taglish wait estimate in message-list
- Gap B2: `free-tier-banner.tsx`, queriesUsedToday in chat API response
- Gap D6: `session-expiry-modal.tsx`, `session-watcher.ts`, `session-guard.tsx`
- First-run: welcome-tour.tsx, Iba pa text field, income label cleanup, login logo upgrade
- Chat: local avatar, formatTimestamp (UTC+8), scroll-to-bottom FAB
- **Bonus (from parallel Sprint 7 session):** Expenses backend + UI (Build 4), migrations 009-010

**Actual Anton hours:** ~4 hrs (review, live testing across parallel sessions, UX fixes)
**Sprint outcome:** COMPLETE — All 8 tasks done (7 code + 1 live testing). 559 tests passing (154 new). Design Gates 2 & 3 closed. Gaps B1, B2, D6 resolved. All 8 Design Gates now resolved.

### Sprint 7 — 2026-03-26

**Phase:** 0A — Build 4
**Sprint Goal:** Ship the Saan Napunta expenses dashboard with category breakdown, manual entry, and check-in integration.
**Capacity:** 5 hours (Anton review/testing/decisions)
**Context:** Ran in parallel with Sprint 6 via separate session. Build 4 proceeds without Build 3 — uses check-in + manual entry data.

**Tasks:** Completed via parallel session. Includes: transactions table (migration 009), reconciliation prep (migration 010), expenses API (CRUD + aggregation), expenses page UI, category chart, add-transaction modal, check-in integration.

**Sprint outcome:** COMPLETE — merged with Sprint 6. Live tested by Anton. Build 4 (Saan Napunta / Expenses) shipped.

### Sprint 8 — 2026-03-28

**Phase:** 0A — Build 5
**Sprint Goal:** Ship the Morning Briefing card, weekly reconciliation prompt, and monthly summary so Kai proactively surfaces yesterday's business health every morning.
**Capacity:** 3.5 hrs Anton Time (review/testing/decisions)

**Tasks:**

| # | Task | Agent Size | Anton Time | Status | Notes |
|---|------|-----------|------------|--------|-------|
| 1 | Morning Briefing data aggregation lib | M | XS | DONE | `lib/morning-briefing/aggregate.ts` + `types.ts` + `index.ts`. Queries yesterday's transactions, cash position, BIR deadlines, week trends. |
| 2 | Morning Briefing API route | M | S (0.5hr) | DONE | GET `/api/morning-briefing` — auth → flag → tier → cache → time gate (5AM-12PM) → Claude → cache write. ADR-011. |
| 3 | Morning Briefing Card + dashboard wiring | M | S (0.5hr) | DONE | `morning-briefing-card.tsx` — loading/available/upgrade/unavailable/error states. UX reviewed (7 fixes applied). |
| 4 | Weekly Reconciliation API + component | M | S (0.5hr) | PLANNED | `/api/reconciliation/weekly` — missing check-in days + dashboard card |
| 5 | Monthly Reconciliation API + component | M | S (0.5hr) | PLANNED | `/api/reconciliation/monthly` — month-end summary + dashboard card |
| 6 | Tests (40+ new) | M | XS | DONE (Stream A) | 38 new tests: aggregation (14), API route (11), component (13). 761/761 total passing. |
| 7 | Anton live testing | -- | M (1hr) | IN PROGRESS | Stream A ready for testing. |

**Parallel Streams:**
- **Stream A** (`claude/sprint8-briefing`): Tasks 1, 2, 3 — Morning Briefing (includes own dashboard wiring)
- **Stream B** (`claude/sprint8-recon`): Tasks 4, 5 — Reconciliation (includes own dashboard wiring)
- **Post-merge:** Task 6 (tests), Task 7 (live testing)

**No cross-sprint dependencies.** Sprint 8 only touches: `lib/morning-briefing/`, `api/morning-briefing/`, `api/reconciliation/`, `components/dashboard/morning-*`, `components/dashboard/weekly-*`, `components/dashboard/monthly-*`, and adds cards to `dashboard/page.tsx`. Sprint 9 touches completely different files.

**Key decisions:** Morning briefing cached 1x/day via `daily_check_in.briefing_content` (ADR-011). Prompt v1.1.0 with structured `[BRIEFING_DATA]` JSON injection. Migration 012 adds cache columns. No share button on monthly summary (deferred). Uses static BIR knowledge base for deadline alerts (Build 6 adds dynamic table).

**Actual Anton hours:** ~2 hrs (live testing carried into Sprint 10)
**Sprint outcome:** ✅ DONE (status backfilled 2026-05-24) — Morning Briefing shipped in Sprint 8; Weekly + Monthly Reconciliation completed in Sprint 10 per Sprint 8+9+10 retro. Build 5 fully closed. Original entry was left "IN PROGRESS" because reconciliation continued into Sprint 10.

### Sprint 9 — 2026-03-28

**Phase:** 0A — Builds 6 + 7
**Sprint Goal:** Ship the BIR Deadline Watcher with generated deadlines from profile data, and the Reply Drafter for customer message drafting.
**Capacity:** 4 hrs Anton Time (review/testing/decisions)

**Tasks:**

| # | Task | Agent Size | Anton Time | Status | Notes |
|---|------|-----------|------------|--------|-------|
| 1 | Migration 011: `bir_deadlines` + `bir_tax_type` | M | XS | DONE | Table with RLS, indexes, unique constraint; `bir_tax_type` on business_profiles |
| 2 | BIR deadline generation logic | M | S (0.5hr) | DONE | `lib/deadlines/` — types, constants (6 BIR forms), generate, schemas, notifications |
| 3 | Deadlines API (`/api/deadlines`) | M | XS | DONE | GET (list + urgency color), POST (generate + upsert), PATCH (mark filed) |
| 4 | Deadline Watcher page + dashboard card + flag | L | S (0.5hr) | DONE | `/deadlines` page, 3 components, enhanced dashboard card, `DEADLINE_WATCHER_ENABLED` |
| 5 | BIR tax type selector on Profile | S | XS | DONE | 5 tax types, triggers deadline generation on save |
| 6 | In-app deadline notification tracking | S | XS | DONE | 7/3/1-day window logic, `getUpcomingNotifications()` |
| 7 | Reply Drafter API (`/api/reply-draft`) | M | XS | DONE | Claude Haiku call, circuit breaker, spend tracking, guardrails |
| 8 | Reply Drafter page + dashboard card + flag | M | S (0.5hr) | DONE | `/reply-drafter` page, 3 components, useRef pattern, copy-to-clipboard |
| 9 | Reply Drafter guardrails | S | XS | DONE | Input validation + output safety (impersonation, commitments, financial advice) |
| 10 | Tests (50+ new) | M | XS | DONE | 202 new tests (73 deadlines + 104 reply drafter + 25 morning briefing). 761 total, 0 failures |
| 11 | Anton live testing | -- | L (1.5hr) | IN PROGRESS | Both features, mobile, Taglish, real messages |

**Parallel Streams:**
- **Stream A** (`claude/sprint9-deadlines`): Tasks 1-6 — Deadline Watcher (Build 6, includes own dashboard card + feature flag)
- **Stream B** (`claude/sprint9-replies`): Tasks 7-9 — Reply Drafter (Build 7, includes own dashboard card + feature flag)
- **Post-merge:** Task 10 (tests), Task 11 (live testing)

**No cross-sprint dependencies.** Sprint 9 only touches: `supabase/migrations/011_*`, `lib/deadlines/`, `api/deadlines/`, `app/(app)/deadlines/`, `components/deadlines/`, `api/reply-draft/`, `app/(app)/reply-drafter/`, `components/reply-drafter/`, `lib/reply-drafter/`, and adds cards to `dashboard/page.tsx`. Dashboard card additions are additive (different card slots) — merge conflicts between Sprint 8 and 9 are trivial to resolve.

**Key decisions:** BIR tax type collected via Profile page (not onboarding change). `bir_deadlines` references `auth.users(id)` not `businesses(id)` (table doesn't exist yet). Push notifications deferred — in-app only.

**What was built:**
- **Build 6 — BIR Deadline Watcher:** Migration 011 (`bir_deadlines` table + `bir_tax_type` column), `lib/deadlines/` (types, constants, generate, schemas, notifications — 6 files), `/api/deadlines` (GET/POST/PATCH), `/deadlines` page, 3 deadline components, profile tax type selector (5 BIR tax types), enhanced dashboard card with next deadline + overdue count, `DEADLINE_WATCHER_ENABLED` flag
- **Build 7 — Reply Drafter:** `lib/reply-drafter/` (types, schemas, prompt, guardrails — 5 files), `/api/reply-draft` (Claude Haiku with circuit breaker + spend tracking), `/reply-drafter` page, 3 reply components (input, card, results), copy-to-clipboard, output guardrails (no impersonation/commitments/financial advice), `REPLY_DRAFTER_ENABLED` flag
- **Sprint 8 partial (Morning Briefing):** Migration 012 (`morning_briefing_cache`), `lib/morning-briefing/`, `/api/morning-briefing`, morning briefing card component (also landed via parallel agent work)

**Actual Anton hours:** ~2 hrs (testing + review, parallel with Sprint 10)
**Sprint outcome:** DONE — All features shipped, live testing completed in Sprint 10

### Sprint 6+7 Retro — 2026-03-26

**What Went Well:**
- Parallel dual-sprint execution worked — Sprint 6 (Design Gates + UX) and Sprint 7 (Build 4 Expenses) ran simultaneously in separate sessions. Anton could test different functionalities side by side, helping prioritize and allocate testing time.
- All 8 Design Gates now closed — Design Gates 2 (Trust Recovery) and 3 (Prompt Regression) resolved. No remaining design gates blocking Phase 1.
- Significant gap resolution — B1, B2, D6 resolved this sprint. Combined with prior sprints, 15 of 32 gaps now resolved (A1, A3, A4, A5, B1, B2, B3, B4, D6, E3, F1, F2, F3, F4 + D1 downgraded).
- 7-sprint compound effect is visible — from zero to 559 tests, 10 migrations, 5 builds complete (0-2, 4), full plugin system, all design gates closed.

**What Didn't Go Well:**
- Agents still violated documented patterns — `chat-input.tsx` was built with `onChange` instead of `useRef+onClick`, despite React 19 fix being a non-negotiable rule in CLAUDE.md. Welcome tour shipped without pain-point personalization. Both required live testing fix cycles.
- Live testing still catches preventable bugs — logo visibility (drop-shadow), bottom nav overlapping chat input on `/chat`, generic welcome tour CTA all surfaced only when Anton clicked through the app.
- No automated build/test gate in sprint workflow — Anton has to manually remember to run `/test` after each sprint. Bugs slip through without an enforced step.

**What We Learned:**
- Agent "gotchas" need a dedicated section in skill files — the React 19 `useRef+onClick` rule is in CLAUDE.md but agents still miss it. Known pitfalls should be explicitly listed in fullstack-engineer and ux-designer SKILL.md files as a pre-submit checklist.
- Build + test should be mandatory sprint workflow steps — `/build` when plan is approved (catch compile errors early), `/test` before declaring done (catch regressions). Enforce in sprint SKILL.md, not left to memory.
- Dual-sprint parallel model is the new standard — running independent sprints (quality + feature) in parallel sessions is more efficient than sequential. Plan sprints in pairs when workstreams are independent.

**Action Items:**

| # | Action | Owner | Due By | Status | Notes |
|---|--------|-------|--------|--------|-------|
| 1 | Update sprint SKILL.md: add mandatory `/build` after plan approval and `/test` before declaring sprint done | Claude (PM skill) | Sprint 8 planning | DONE | Steps 7b + 7c added to sprint SKILL.md, checklist updated |
| 2 | Add "Known Pitfalls" section to fullstack-engineer and ux-designer SKILL.md (React 19 useRef, MD3 tokens, personalization depth) | Claude (PM skill) | Sprint 8 planning | DONE | 6 pitfalls (fullstack), 5 pitfalls (ux-designer) |
| 3 | Collect 10-15 receipt images for OCR spike (Gap E1) | Anton | Sprint 8 | OPEN | Carryover from Sprint 4/5 — pipeline ready, needs test data |

**Energy Check:**
- **Sustainability:** Felt good — could maintain this pace
- **Saturday block:** N/A — dual-sprint compressed into parallel sessions
- **Evening consistency:** Focused sessions + iterative feedback
- **Recommendation:** Keep pace. Dual-sprint parallel execution is validated and sustainable. Add build/test enforcement and agent pitfall checklists to reduce fix cycles.

### Sprint 8+9+10 Retro — 2026-04-05

**What Went Well:**
- Parallel agent streams + live testing is the ideal workflow — agents built illustrations and reconciliation while Anton live-tested Morning Briefing, Deadlines, and Reply Drafter simultaneously. Zero idle time.
- Live testing caught 6 critical bugs that 761 automated tests missed — every single dev bypass route was silently not persisting data. This would have been invisible without hands-on testing.
- Build 5 is now fully complete (Morning Briefing + Weekly/Monthly Reconciliation) — 3 sprints of work wrapped up cleanly.

**What Didn't Go Well:**
- Dev bypass / mock data was fundamentally broken — EVERY API route in dev mode (`SKIP_AUTH=true`) returned mock data or used in-memory arrays instead of persisting to the real database. Took 4+ fix rounds across profile, deadlines, and dashboard to fully resolve.
- Too many fix rounds — the profile save issue went: mock data fix → RLS blocking fix → `profile_version` column missing fix → finally working. Each layer hid the next problem. Should have diagnosed the full stack in one pass.
- DB schema mismatch between code and remote — `profile_version` column exists in migration SQL but not in the actual Supabase instance. `bir_deadlines` table didn't exist. Dev user didn't exist. The gap between "what migrations say" and "what's deployed" caused silent failures.

**What We Learned:**
- Dev bypass must persist to the real database — mock/in-memory dev bypasses create a class of bugs that only surface during live testing. Future dev bypasses should use `createServiceClient()` to bypass RLS while still writing to real tables. The "skip auth, not skip persistence" principle.
- DB migration state must be verified before testing — code assumes tables and columns exist, but the remote DB may be behind. Need a startup check or at least a documented "run migrations before testing" step.
- Reply Drafter as a separate page is wrong — Anton's instinct is that reply drafting should be part of Kai Chat, not a standalone feature. This is a Sprint 11 architecture change.

**Action Items:**

| # | Action | Owner | Due By | Status | Notes |
|---|--------|-------|--------|--------|-------|
| 1 | Audit all remaining API routes for dev bypass persistence — ensure every `SKIP_AUTH` block uses `createServiceClient()` and writes to real DB | Claude (fullstack-engineer) | Sprint 11 | OPEN | Prevent recurrence of the mock-data class of bugs |
| 2 | Integrate Reply Drafter into Kai Chat — remove standalone `/reply-drafter` page, add reply drafting as a chat capability | Claude (fullstack-engineer + ai-engineer) | Sprint 11 | OPEN | Anton's testing feedback: separate page doesn't make UX sense |
| 3 | Define query caps for Pro and Business tiers — find sweet spot between value and cost | Anton + ai-engineer | Sprint 12 | OPEN | Strategic decision needed before Xendit payment integration |

**Energy Check:**
- **Sustainability:** Felt good — pace was fine
- **Saturday block:** N/A — done in single session
- **Evening consistency:** Single focused session, high throughput
- **Recommendation:** Keep pace. The parallel agent + live testing model is validated and sustainable. Priority for Sprint 11: Reply Drafter → Chat integration + dev bypass audit.

---

## Velocity & Patterns

> Updated after each retro. Helps calibrate future sprint sizing.

| Sprint | Goal | Hours Plan | Hours Actual | Tasks Plan | Tasks Done | Hit Goal? |
|--------|------|-----------|-------------|-----------|-----------|-----------|
| 1 | Ship Build 0 | 10–15 | ~14 | 5 | 5 | YES |
| 2 | Kai domain knowledge files | 12 | ~11 | 6 | 6 | YES |
| 3 | Build 1 + infra gaps | 12 | ~12 | 5 | 5 | YES |

| 4 | Gap resolution + Build 2 shell | 13.5 (est.) | ~3-4 (Anton) | 5+2 | 7 | YES |
| 5 | Build 2 completion + infra | 4 hrs (Anton) | ~4-5 (Anton) | 5+2 | 7 | YES |
| 6 | Design Gates + UX quality | 4 hrs (Anton) | ~4 (Anton) | 7+1 | 8 | YES |
| 7 | Build 4 (Expenses) | 4 hrs (Anton) | (parallel w/6) | ~6 | ~6 | YES |
| 8 | Build 5 (Morning Briefing + Recon) | 3.5 hrs (Anton) | ~2 (Anton) | 8 | 6 | PARTIAL — Recon deferred to Sprint 10 |
| 9 | Build 6 (Deadlines) + Build 7 (Reply Drafter) | 4 hrs (Anton) | ~2 (Anton) | 12 | 10 | YES — Live testing in Sprint 10 |
| 10 | Builds 5-7 Hardening | 2.5 hrs (Anton) | ~2.5 (Anton) | 8 | 7 | YES — Build 5 complete, 6 bugs fixed |

**Emerging patterns:**
- L-sized tasks (3–4 hrs) fit well in Saturday blocks
- M-sized tasks (2–3 hrs) fit well in evening blocks
- "Ship one hard gate per sprint" is a good cadence for Phase 0A
- Itemized checklists are essential for multi-session work
- Context/knowledge file sprints can be highly productive — 6/6 tasks in ~11 hrs
- Task expansion (Task 2: 4→16 types) is fine when it adds clear value and stays within capacity
- **NEW: Multi-agent parallel execution compresses 13+ hrs of dev work into minutes of agent time. The bottleneck shifts from "development hours" to "Anton review/testing/decision time."**
- **NEW: Hour-based estimation is obsolete for agent sprints. Future sprints should estimate Agent Size (S/M/L) + Anton Time (hrs) separately.**
- **NEW: Independent workstreams can be parallelized across separate Claude Code sessions for even higher throughput.**
- **NEW: Live user testing after merge is essential — 15 min of clicking surfaces more issues than automated tests. Make it a standard sprint step.**
- **NEW: Agent prompts for UI work must explicitly reference design-system.md — agents that only read SKILL.md produce functional but visually non-compliant components. The CTA text color bug persisted 2 sprints before live testing caught it.**
- **NEW: The Agent Size + Anton Time estimation model is validated — Sprint 5 planned 4 hrs Anton time, actuals were ~4-5 hrs. Accurate enough for planning.**
- **NEW (Sprint 6+7): Dual-sprint parallel execution works — independent workstreams (quality + feature) can run as separate sprints in parallel sessions. Plan sprints in pairs when workstreams don't share files.**
- **NEW (Sprint 6+7): Agents still violate documented patterns (React 19 useRef, personalization depth). Need "Known Pitfalls" sections in skill files as pre-submit checklists.**
- **NEW (Sprint 6+7): Build + test must be mandatory sprint workflow steps — `/build` after plan approval, `/test` before declaring done. Prevents "forgot to test" regressions.**
- **NEW (Sprint 10): Dev bypass must persist to real DB — mock/in-memory dev bypasses create bugs invisible to automated tests. Use `createServiceClient()` to bypass RLS while writing to real tables. "Skip auth, not skip persistence."**
- **NEW (Sprint 10): Verify DB migration state before testing — code assumes tables/columns exist but remote DB may lag behind migration SQL. Silent query failures result.**

---

## Unresolved Action Items

> Carried forward from retros until resolved. Check these during `/sprint` planning.

| Source | # | Action | Status |
|--------|---|--------|--------|
| Sprint 1 Retro | 1 | Create `.env.local.example` + dev setup docs | DONE — Sprint 2 Task #6 (2026-03-22) |
| Sprint 1 Retro | 2 | Create BIR knowledge base | DONE — Sprint 2 Task #1 (2026-03-21) |
| Sprint 1 Retro | 3 | Create MSME business knowledge | DONE — Sprint 2 Task #2 (2026-03-22, expanded to 16 types + benchmarks table) |
| Sprint 1 Retro | 4 | Populate Taglish manual | DONE — Sprint 2 Task #4 (2026-03-22, Anton reviewed and approved) |
| Sprint 4 Retro | 1 | Recalibrate sprint estimation (Agent Size + Anton Time) | DONE — Sprint 5 used this model successfully (2026-03-25) |
| Sprint 4 Retro | 2 | Design parallel sprint framework for multi-session execution | DONE — Sprint 5 used 3-stream parallel with worktree isolation (2026-03-25) |
| Sprint 4 Retro | 3 | Collect 10-15 receipt images for OCR spike | OPEN — Anton, Build 3 deprioritized. Deferred until Anton has images |
| Sprint 5 Retro | 1 | Add design-system.md to mandatory agent reading for UI work | DONE — Sprint 6 (2026-03-26). All UI agent prompts include MUST READ design-system.md |
| Sprint 5 Retro | 2 | Add "Anton live testing" as standard sprint step after merge | DONE — Sprint 6 (2026-03-26). Tasks 8/15 are explicit live testing steps |
| Sprint 6+7 Retro | 1 | Update sprint SKILL.md: mandatory `/build` after plan approval, `/test` before declaring done | DONE — Updated 2026-03-26. Steps 7b, 7c added to sprint SKILL.md workflow + checklist |
| Sprint 6+7 Retro | 2 | Add "Known Pitfalls" section to fullstack-engineer + ux-designer SKILL.md | DONE — Updated 2026-03-26. 6 pitfalls in fullstack-engineer, 5 in ux-designer |
| Sprint 6+7 Retro | 3 | Collect 10-15 receipt images for OCR spike (Gap E1) | OPEN — Carryover from Sprint 4/5. Anton, deferred until images available |
| Illustration Sprint | 1 | Rename 37 PNGs from Gemini hashes to descriptive names, convert to WebP (80%), deploy to `frontend/public/illustrations/{category}/` | DONE — 2026-04-04. 37 WebPs across 7 categories (hero, onboarding, empty-states, status, celebrations, features, marketing). |
| Illustration Sprint | 2 | Wire illustrations into app components: empty states (#9-13), offline page (#14), error (#15), session expired (#16), onboarding (#5-8), celebrations (#17-19) | DONE — Sprint 10. 11 illustrations wired via `<IllustrationWrapper>` (7 empty/status + 4 onboarding). Celebrations deferred to future builds. |
| Illustration Sprint | 3 | Generate 8 future-build illustrations (#20-27): scan flow, paywall, payment success, PWA install, costing/invoice empty states, blog cashflow header | DONE — All 8 generated, renamed, converted 2026-04-04. |
| Sprint 10 Retro | 1 | Audit all remaining API routes for dev bypass persistence — use `createServiceClient()` | OPEN — Prevent recurrence of mock-data bugs |
| Sprint 10 Retro | 2 | Integrate Reply Drafter into Kai Chat — remove standalone page | OPEN — Sprint 11 architecture change |
| Sprint 10 Retro | 3 | Define query caps for Pro and Business tiers | OPEN — Strategic decision before Xendit integration (Sprint 12) |

---

### Sprint 10 — 2026-04-04 (Builds 5-7 Hardening + Build 5 Completion)

**Phase:** 0A — Builds 5-7 Hardening + Build 5 Completion
**Sprint Goal:** Live-test Sprint 8+9 deliverables (Morning Briefing, Deadline Watcher, Reply Drafter), wire illustrations into app components, complete Build 5 (Weekly + Monthly Reconciliation).
**Capacity:** 2.5 hrs Anton Time (LOW)

**Tasks:**

| # | Task | Agent Size | Anton Time | Status | Stream | Notes |
|---|------|-----------|------------|--------|--------|-------|
| 1 | Live Test: Morning Briefing | — | 0.25 hr | DONE | Anton | Time gate bug found + fixed |
| 2 | Live Test: Deadline Watcher | — | 0.5 hr | DONE | Anton | Dev bypass not persisting — multiple fix rounds |
| 3 | Live Test: Reply Drafter | — | 0.1 hr | DEFERRED | Anton | Deferred — will test as part of Kai Chat integration (Sprint 11) |
| 4 | Illustration Wiring: Empty States + Status Pages | M | 0.1 hr | DONE | A | 7 illustrations wired, 22 tests added |
| 5 | Illustration Wiring: Onboarding Steps | S | 0.05 hr | DONE | A | 4 onboarding illustrations wired |
| 6 | Weekly + Monthly Reconciliation | M | 0.1 hr | DONE | B | 33 tests, 2 API routes, 2 dashboard cards |
| 7 | Sprint 8+9+10 Retro | — | 0.25 hr | DONE | Sequential | This retro |
| 8 | Bug fixes from live testing | M | 1.0 hr | DONE | Main | 6 bugs fixed (see below) |

**Unplanned work (Task 8 — Bug fixes from live testing):**
- Morning Briefing time gate too restrictive (extended 5AM-12PM → 5AM-11PM)
- Profile PATCH dev bypass returned mock data, never persisted to DB
- Deadlines API dev bypass used in-memory array, not real DB
- Dashboard dev bypass returned hardcoded defaults, skipped DB queries
- All dev bypasses used anon client blocked by RLS — switched to service client
- `profile_version` column missing from remote DB — removed from all queries
- Onboarding: painpoint-aware redirect (BIR→/deadlines, receipts→/expenses)
- Onboarding: added tax type selection step after BIR consent
- Profile: BIR toggle moved above tax types, added descriptions, highlighted card
- Profile: deadline generation trigger fixed (fires on any BIR+tax save)
- Flaky `days_since_signup` test fixed (hardcoded date → dynamic)

**What was built:**
- 11 illustrations wired into app components via `IllustrationWrapper` (7 empty/status + 4 onboarding)
- Weekly + Monthly Reconciliation (Build 5 complete): `lib/reconciliation/`, 2 API routes, 2 dashboard cards
- `StepBirTaxType` onboarding component
- Dev user seed SQL (`supabase/seed-dev-user.sql`)
- 55 new tests (22 illustration + 33 reconciliation), 761 total passing

**Parallel Streams:**
- Stream Anton (Tasks 1-3): Live testing — ran in parallel with agent streams
- Stream A (Tasks 4-5): `claude/sprint10-illustrations` — illustration wiring (worktree)
- Stream B (Task 6): `claude/sprint10-recon` — reconciliation (worktree)

**Actual Anton Hours:** ~2.5 hrs (testing + review + bug triage + retro)
**Sprint Outcome:** DONE — Build 5 complete, Builds 5-7 hardened, 6 dev-mode bugs fixed

---

### Sprint 11 — 2026-04-09 (Conversational Filipino Voice Revision)

**Phase:** 0A — Brand Voice Recalibration (non-build sprint)
**Sprint Goal:** Shift AKBai's primary brand voice from "Taglish" to "conversational Filipino" across all documentation, skill files, agent definitions, live system prompts, and the public landing page. Triggered by user review flagging Taglish as mismatched for the MSME target demographic.
**Capacity:** 1 session, agent-team parallel execution

**Context:**
A user review suggested conversational Filipino would better serve the 30–50 y/o MSME target (sari-sari operators, home bakers, provincial sellers) than Taglish. Independent linguistic research confirmed the concern and uncovered a **deeper syntactic issue**: the distinction is not vocabulary but word order and enclitic placement. "bago i-save natin" is Taglish (English SVO thinking); "bago natin i-save" is conversational Filipino (Filipino second-position enclitic per Wackernagel's Law). This meant ~70% of existing Kai voice examples contained Taglish syntactic markers and needed real rewriting — not a relabel.

**The 8 Taglish markers now explicitly banned in Kai's output:**
1. Enclitic misplacement after conjunctions (`bago i-save natin` → `bago natin i-save`)
2. English conjunctions (`if/before/because/when` → `kung/bago/kasi/dahil/kapag`)
3. English prepositions (`based sa` → `ayon sa` / `batay sa`)
4. English time adverbs (`this week/last month/in 3 days` → `ngayong linggo/nakaraang buwan/sa loob ng 3 araw`)
5. Bare English verbs without Filipino affix (`save mo` → `i-save mo`)
6. English comparatives (`more Filipino` → `mas Filipino`)
7. `yung` for definite objects in written output (`yung resibo` → `ang resibo`)
8. English SVO word order (`Here's what I found` → `Ito ang nakita ko`)

**English is retained only for:** BIR/tax terms (1701Q, VAT, net income), Filipinized verbs with i-/mag-/na- affixes, brand names (GCash, Maya, Shopee), numbers/currency/dates, sparing casual interjections.

**Execution model — 9 parallel layers:**

| Layer | Scope | Executor |
|---|---|---|
| 1 | Core definitions — CLAUDE.md Rule 5, AKBAI_MASTER_BRIEF §1/§6/§7/§8, brand-context.md Pillar 1 + Voice Examples, glossary.md, project-context.md | main thread |
| 2 | Rewrote + renamed copy guides: `taglish-copy-guide.md` → `conversational-filipino-copy-guide.md` (489 lines) and `taglish-manual.md` → `conversational-filipino-manual.md` (234 lines). Added §13 Quick Reference Card with the 8-marker checklist. Dropped misleading "60/40 ratio" framing. | build-ux agent |
| 3 | Extended `filipino-text-vernacular.md` — 3 terminology fixes + new §10 (what Kai should NOT use), §11 (voice toolkit summary), §12 (regional awareness — Bisaya/Cebuano input handling) | build-ux agent |
| 4-6 | Terminology sweep across 40+ skill files, agent definitions, and reference docs. Gap registry G2/G3/G8 renamed. | build-engineer agent + main thread |
| 7 | **Runtime behavior change** — rewrote `core-persona.ts` voice rules with full Filipino syntactic frame. Added 9 new regression tests in `prompt-regression.test.ts` Group 6 (one per marker). Bumped `prompt-library.md` to v1.1.0 and synced §1 body to match live prompt. Updated `features.ts` feature prompts (general_chat, morning_briefing, reply_drafter) | build-ai agent + main thread |
| 8a | 10 landing-page fixes including critical `100% Taglish` → `100% Filipino` badge, removed "Your AI Business Partner" English supertitle, rewrote Meet Kai body, fixed "this week"/"every morning" time adverbs, "Join" → "Sumali" | build-engineer agent |
| 8b | ~60 edits across `brand/AKBai Brand Book.html`, `Archive/AKBai_Competitive_Brief_v2.html`, `Archive/AKBai_Operations_Playbook_v7.html`, `Archive/AKBai_Post_Implementation_Vision_v1.html`, `project/AKBai_Plugin_Strategy_v1.html`, `project/AKBai_Skills_Utilization_Guide_v1.html`, 5 marketing markdowns | build-marketing agent + main thread |
| 9 | 9 user-visible frontend fixes across 7 components (step-bir-consent, errors.ts, chat-interface, first-responses, notifications, welcome-tour, expenses-summary) + 26 test description renames across 20 test files | build-engineer agent |
| Audit | team-lead cross-layer consistency audit. Found critical drift: `prompt-library.md` §1 body was still v1.0.0 Taglish text despite v1.1.0 header. Also flagged 15 command-skill files that had been missed. All P0 items fixed. | team-lead agent + main thread |

**Files modified:** ~130+ across docs, skills, agents, frontend code, HTML artifacts
**Files renamed:** 2 (`taglish-copy-guide.md` → `conversational-filipino-copy-guide.md`, `taglish-manual.md` → `conversational-filipino-manual.md`)
**Files created:** 0 (vernacular reference file already existed, extended in place)

**Tests:** 770/770 passing (52 test files). Added 9 new regression tests for the 8 Taglish markers. Updated 26 test description strings to say "conversational Filipino" instead of "Taglish". No test assertions changed — the live runtime instruction `"Never speak Taglish"` is still asserted against in prompt-regression Group 2.

**Critical corrections caught during execution:**

1. **First-pass mistake (caught by user review):** Initial plan treated this as a terminology relabel — "most examples are already correct, just change the label." User correction `"bago i-save natin" is very Taglish. Conversational Filipino would be "bago natin i-save"` forced a full syntactic audit and rewrite. ~70% of existing Kai voice examples had at least one Taglish marker and needed real fixes, not relabeling.

2. **Enclitic rule over-correction (caught by Anton during plan review):** The first draft of the copy guide Rule 2 prescribed `"para mo ma-check"` and `"kung mo gustong i-edit"` — both grammatically unusual. Corrected to: strict second-position rule applies only after `bago`, `kapag/pag`, and `habang`. After `para + verb` → native speakers place enclitic after verb (`para ma-check mo`). With `kung gusto + verb` → native form is `kung gusto mong i-edit` or `kung gusto mo i-edit`. Rule of thumb documented: trust native ear.

3. **prompt-library.md §1 drift (caught by team-lead audit):** The header was bumped to v1.1.0 but the prompt code block was still the v1.0.0 Taglish version, including a `"Based sa trend..."` canonical example (line 72) that directly violated the new "based sa" ban. Most load-bearing drift in the entire revision — would have caused every future prompt-library reader to see conflicting guidance. Fixed by syncing the §1 body to match `frontend/src/lib/claude/prompts/core-persona.ts` verbatim.

4. **15 command-skill files missed by initial sweep (caught by team-lead audit):** The build-engineer Layers 4-6 agent swept `akbai-delivery/skills/*/SKILL.md` but missed `akbai-delivery/skills/*/commands/*/SKILL.md` (a subfolder layer down). Main thread finished the sweep during audit-fix pass covering ui-copy, prompt, test, review, incident, gap-check, standup command files + 4 cross-cutting reference files (data-flows, npc-compliance, claude-integration, nextjs-conventions).

**What was built:**
- New canonical reference: `conversational-filipino-copy-guide.md` (489 lines) with 8-marker Quick Reference Card
- Rewritten authoritative manual: `conversational-filipino-manual.md` (234 lines)
- Extended `filipino-text-vernacular.md` with 3 new sections (§10 banned patterns, §11 voice toolkit, §12 regional awareness)
- New regression test group: `prompt-regression.test.ts` Group 6 (9 tests, one per marker + user-input understanding)
- Live system prompt rewrite: `core-persona.ts` with full Filipino syntactic frame rules
- Landing page brand-consistency fix: badge now reads "100% Filipino" instead of "100% Taglish"
- Updated canonical external documents: Brand Book HTML, Competitive Brief v2 HTML, Operations Playbook v7 HTML, Post Implementation Vision v1 HTML

**Parallel Streams:**
- Main thread: Layers 1, 8b, 4-6 cleanup, team-lead audit P0 fixes
- Stream A (build-ux): Layer 2 — copy guide rename + rewrite
- Stream B (build-ux): Layer 3 — vernacular extension
- Stream C (build-engineer): Layers 4-6 — skill/agent sweep
- Stream D (build-ai): Layer 7 — core-persona.ts + tests
- Stream E (build-engineer): Layer 8a — landing page rewrite
- Stream F (build-marketing): Layer 8b — project docs audit (applied by main thread after)
- Stream G (build-engineer): Layer 9 — frontend component audit
- Stream H (team-lead): Final consistency audit across all layers

**Actual Anton Hours:** ~1 session (planning + correction + review + commit)
**Sprint Outcome:** DONE — 770/770 tests passing, ~130 files touched, zero runtime regressions, canonical voice definition consistent across CLAUDE.md / master brief / brand-context / copy-guide / manual / vernacular / core-persona.ts / prompt-library.md / landing-page.tsx

**Deferred / known limitations:**
- **PDF regeneration:** `brand/AKBai Brand Book.pdf`, `Archive/AKBai_Competitive_Brief_v2.pdf`, and `Archive/AKBai_Operations_Playbook_v7.pdf` still reference the old Taglish framing. HTML sources updated but PDFs need to be re-exported. Non-blocking — kept in view.
- **PDF-only docs:** `project/AKBai_Complete_Roadmap_v14.pdf`, `project/AKBai_Market_Research_v1.pdf`, `project/AKBai_Operations_Roadmap_v6.pdf`, and `project/AKBai_Post_Implementation_Vision_v1.pdf` were not edited because editable sources (docx/html) could not be located. Deferred for manual review.
- **Behavioral smoke test:** The new regression tests operate at the prompt-construction level (deterministic CI), not against real Claude output. A 7-scenario behavioral spot-check against the live chat endpoint is recommended as a pre-ship validation (~15 min manual test). Non-blocking.
- **`features.ts` reply_drafter customer-matching rule** deliberately kept nuanced: Kai understands Taglish input from customer DMs but replies in conversational Filipino to model the warmer voice. This is the only place "Taglish" survives as a descriptive input category.

**Retro — what went well:**
- **Parallel agent-team execution** — 7 concurrent specialized agents compressed what would have been a multi-day serial edit into a single session. Agent-teams guide pattern validated.
- **Team-lead audit caught critical drift** — without the cross-layer audit, the `prompt-library.md` §1 v1.1.0/v1.0.0 drift and 15 missed command-skill files would have shipped silently. The audit layer is load-bearing for large multi-agent revisions.
- **User correction feedback loop** — the `"bago i-save natin"` correction reshaped the entire scope early (before execution), preventing a terminology-only rewrite that would have shipped Taglish examples under a conversational Filipino label.

**Retro — what didn't:**
- **Agent permission blocks** — the Layers 4-6 build-engineer agent hit permission errors on `.claude/agents/*.md` files and had to be finished manually by the main thread. Need to pre-authorize the `.claude/` subtree for build-engineer agents or route those files through a differently-permissioned agent.
- **Initial scope miscalibration** — the first plan draft assumed this was a relabel. Took a user correction to force a linguistic audit. Lesson: for voice/tone changes, ALWAYS run a native-speaker review on example copy before assuming it's "already correct."
- **Layer 8b agent didn't apply edits** — build-marketing agent produced a thorough audit report but incorrectly concluded it couldn't edit HTML files. Main thread had to apply all ~60 HTML edits serially. Lesson: give agents explicit permission/capability confirmation for HTML editing.

**Action items (opened this sprint):**

| # | Owner | Action | Status |
|---|-------|--------|--------|
| 1 | Anton | Behavioral smoke test: run 7 Kai scenarios against live chat, validate against 8-marker checklist | OPEN — Pre-ship validation (~15 min) |
| 2 | Anton | Decide PDF regeneration strategy: regenerate from HTML sources OR accept PDF drift until next rev cycle | OPEN — Non-blocking |
| 3 | Anton | Locate `.docx` sources for `project/*.pdf` files OR decide to freeze them as historical | OPEN — Non-blocking |
| 4 | Anton | Pre-authorize `.claude/` subtree edits for build-engineer agent to prevent future permission blocks in multi-agent sweeps | OPEN — Sprint 12 |

### Sprint 12 — 2026-04-10 to 2026-04-12 (Tech Debt + Architecture Cleanup + Gap Closure)

**Phase:** 0A — Tech Debt + Architecture Cleanup
**Sprint Goal:** Close 2 outstanding retro action items (dev bypass audit + Reply Drafter chat integration), resolve 4 gaps (C1, B7, D9, D4, E2), and prep Build 8 schema — all autonomous agent execution with Anton review on April 12.
**Capacity:** ~2.3 hrs Anton Time (single review session on April 12)

**Tasks:**

| # | Task | Agent Size | Anton Time | Status | Stream | Notes |
|---|------|-----------|------------|--------|--------|-------|
| 1 | Dev bypass audit — fix all API routes | M | XS (0.25hr) | PLANNED | A | Retro action #1 — createServiceClient() |
| 2 | Reply Drafter → Kai Chat integration | L | S (0.5hr) | PLANNED | B | Retro action #2 — remove standalone page |
| 3 | Build 8 prep — Costing/Invoice schema design | S | S (0.5hr) | PLANNED | Sequential | Draft only, no migration executed |
| 4 | Anton review session | — | S (0.5hr) | PLANNED | Sequential | April 12 — review all PRs |
| 5 | Receipt deduplication (Gap C1) | M | XS (0.1hr) | PLANNED | C | Hash-based dedup ±30 min |
| 6 | PWA install guide — iOS + Android (Gaps B7+D9) | M | XS (0.25hr) | PLANNED | D | Platform-specific install instructions |
| 7 | Meta API dummy webhook (Gap E2) | S | XS (0.1hr) | PLANNED | D | Start Meta App Review clock |
| 8 | Dependency health checks (Gap D4) | S | XS (0.1hr) | PLANNED | E | /api/health + graceful fallbacks |

**Total Anton Time:** ~2.3 hrs / 6 hrs capacity

**Parallel Streams:**
- **Stream A** (`claude/sprint12-devbypass`): Task 1 — API route audit
- **Stream B** (`claude/sprint12-replychat`): Task 2 — Reply Drafter → Chat
- **Stream C** (`claude/sprint12-dedup`): Task 5 — Receipt deduplication
- **Stream D** (`claude/sprint12-pwa`): Tasks 6 + 7 — PWA install guide + Meta webhook
- **Stream E** (`claude/sprint12-health`): Task 8 — Health checks
- **Sequential:** Task 3 — Build 8 schema design (after merge)
- **Sequential:** Task 4 — Anton reviews (April 12)

**Actual Anton hours:** ~2.3 hrs (per planned capacity)
**Sprint outcome:** ✅ DONE (status backfilled 2026-05-24) — Tech debt + architecture cleanup wrapped before Frontend Redesign Initiative started 2026-04-25. Sprint 10 retro action items #1 (dev bypass audit) and #2 (Reply Drafter → Chat integration) were the explicit Sprint 12 goals. Action item #3 (query caps) carried forward as a strategic decision item resolved 2026-05-24 via the new tier matrix (Sprint 13 doc sweep). Original entry was left "IN PROGRESS" because no retro was written before Frontend Redesign Initiative took over.

---

## Frontend Redesign — Phase 1, 1.5, 2 (April 25–26, 2026)

**Initiative:** AKBai frontend redesign — 12-phase plan to convert the current MD3 utility dashboard into a warm Filipino-grounded experience that drives 7-day and 30-day retention. Anchored in a high-fidelity design handoff (`design_handoff_akbai_redesign/`) and Phase 1+1.5 NotebookLM research.

**Why now:** Frontend is the primary retention lever for Phase 0A. Product math, BIR logic, and Claude calls work; what determines whether MSME owners come back daily is whether the app feels like Kai (smart ate/kuya) or another accounting form.

**Plan:** 12 phases. Phases 1–2 = research + synthesis (no code). Phase 3 = foundations. Phases 4–10 = vertical UI slices. Phases 11–12 = polish + retention validation.

### Phase 1 — UI/UX + Filipino Context Research (research only) — DONE

**Deliverables:**
- `skills/ux-designer/references/ui-ux-principles-akbai.md` — 10 UX laws applied to AKBai (Hick / Fitts / Jakob / Tesler / Goal-Gradient / Peak-End / Aesthetic-Usability / Hooked / Design-for-Interruptions / LCP) + 3 highest-leverage retention investments + Don Norman summary.
- 5 surgical enhancements to existing canonical docs (design-system.md §6 motif vocabulary, mobile-first.md §1 Filipino baseline, conversational-filipino-manual.md §6 family-victory framing, brand-context.md "Why pillars work").
- Two NotebookLM notebooks live + RAW Q&A files for traceability.
- `skills/ux-designer/references/research-sources/RESEARCH-FINDINGS-MAP.md` — provenance index.

**Tooling lessons:** Firecrawl + NotebookLM CLI worked well for sourcing. NotebookLM `--import-all` is dangerous (pulls errored TikTok/YouTube URLs); always follow with cleanup script.

### Phase 1.5 — Expansion (April 26) — DONE

**Trigger:** Anton flagged research as "too limited" after reviewing Phase 1 deliverables. Streamlined approach: load all repo canonicals into both notebooks + add ~10 institutional/cultural sources via deep-research, then run targeted gap-filling questions.

**Notebook expansion:**
- UI/UX notebook: 14 → 79 sources (+5 repo canonicals, +cross-cutting docs, +deep-research ResearchGate / Medium / fintech retention studies).
- Filipino notebook: 11 → 105 sources (+13 repo canonicals, +cross-cutting docs, +deep-research institutional sources).
- Cleaned 850 errored + duplicate sources from `--import-all` overshoot.

**9 of 10 targeted gap-filling questions answered with rich citations.** Q6 (PH-specific retail thumb zones) timed out twice — corpus genuinely lacks this evidence; documented as a Phase 12 PostHog validation gap.

**5 surgical updates applied to canonical docs (all tagged `<!-- Phase 1.5 expansion, 2026-04-26 -->`):**
- `mobile-first.md` §1 — sachet economy + dual-SIM + NCR vs provincial connectivity stats + hand-me-down hardware + validated SW caching stack
- `ui-ux-principles-akbai.md` — Hooked variance rule (3-tonal rotation), family-share UX rules under Peak-End, hard retention metrics evidence-anchor
- `conversational-filipino-manual.md` §11 (new) — Regional Languages: Comprehend, Don't Translate
- `brand-context.md` — sari-sari quartet (64/71% family-independence + 38/53% children's education)
- `RESEARCH-FINDINGS-MAP.md` — Phase 1.5 additions + notebook hygiene warning

**Phase 1.5 RAW Q&A:** `skills/ux-designer/references/research-sources/phase-1.5/RAW.md`

### Phase 2 — Design Synthesis (April 26) — DONE

**Approach:** Foundation → review → multi-agent push. Side-by-side visual comparison drives verdicts; verdicts drive per-screen specs; per-screen specs drive reuse audit.

**Foundation deliverables:**
- `frontend/e2e/synthesis/compare.spec.ts` — Playwright harness, captured 8 routes × 2 viewports = 16 current-app screenshots
- `design_handoff_akbai_redesign/synthesis/build-report.mjs` + `index.html` — static side-by-side viewer pairing current vs handoff
- `design_handoff_akbai_redesign/synthesis/build-decisions-html.mjs` + `decisions.html` — visual decisions viewer with color-coded verdict badges

**Synthesis docs (5):**
- `synthesis/01-comparison.md` — dimension-by-dimension Current/Handoff/Strengths/Risks observation layer
- `synthesis/02-decisions.md` — 30+ verdicts (Section A per-screen LOCKED by Anton; Sections B-F foundation/chrome/voice/interaction/a11y proposed; B4/B5/B6 deferred to review repos)
- `synthesis/03-enrichments.md` — 18 named patterns from Phase 1+1.5 research (`pattern:endowed-progress-streaks`, `pattern:peak-end-weekly-close`, `pattern:family-economic-share`, etc.)
- `synthesis/screens/00-home.md` … `10-shared-chrome.md` — 11 per-screen specs (~600 words each, written by build-ux agent)
- `synthesis/04-reuse-audit.md` — component-level source map (Current re-skin / Handoff port / Library wrap / New build / Reject parallel)

**3 review repositories (deferred B4/B5/B6 verdicts):**
- `synthesis/repos/icons.html` — 14 handoff candidates + 10 expense + 6 financial + 4 business-type + 6 Kai expressions, all sizes/backgrounds, style annotations
- `synthesis/repos/motifs.html` — 9 candidates + dark-mode preview row + dedicated dark-mode consolidated section
- `synthesis/repos/animations.html` — 16 keyframes paired with actual Kai mark / paper-note / tile / chat-bubble elements they animate, playable

**Anton overrides applied during Phase 2:**
- A10 — Linggong Kuwento rejects dark inverted palette, stays on honey-cream
- B4/B5/B6 — DEFER to review repositories before adoption (rather than blanket-adopt from handoff)
- D5 — Hiya rule is persona-calibrated, not blanket-soft; platform sellers (Jose) get direct framing, sari-sari/baking get warm framing
- A9 — Daily Check-in stays as modal on `/dashboard`, NOT a separate `/checkin` route (overrides original plan §10.4)

**13 open questions surfaced for Anton** (data endpoints, perf gates, color tints, AI integration points, share format, breakpoint customization).

### What's next — Phase 3 onward

Phase 3 = foundations (palette context + Fraunces + animation library + i18n + primitives). **Blocked on Anton sign-off of:** (1) repo approvals (B4/B5/B6), (2) the 13 open-question resolutions, (3) Section B-F verdict confirmations.

After sign-off, Phase 3 spawns build-engineer as lead with build-architect (ADR for palette + i18n + breakpoint), build-qa (primitive tests), build-ux (design system review).

---

## Frontend Redesign — Phase 3 (Foundations)

**Date:** 2026-04-26
**Status:** **COMPLETE.** Typecheck (0 new errors — pre-existing 38 unchanged), Vitest (75 files / 1121 tests passing), `next build` (45 routes compiled, no warnings).

### Anton sign-offs that unblocked Phase 3

- All Section A–F verdicts in [`synthesis/02-decisions.md`](../../design_handoff_akbai_redesign/synthesis/02-decisions.md) signed off
- B4 icons, B5 motifs, B6 animations review repositories approved
- All 13 open questions resolved (see Q1–Q13 resolutions in 02-decisions.md)

### Cascading rename (post-Q12 pivot)

- `pattern:family-economic-share` → `pattern:privacy-safe-viral-share` in [`screens/09-kuwento.md`](../../design_handoff_akbai_redesign/synthesis/screens/09-kuwento.md). Linggong Kuwento share CTA removed (private screen); share surfaces moved to streak + BIR-completion cards (Phase 10 scope, no peso amounts).

### Foundation deliverables

**Tailwind config** ([`frontend/tailwind.config.js`](../../frontend/tailwind.config.js))
- Custom `tablet: '860px'` breakpoint (Q13)
- `fontFamily.serif` extended with Fraunces variable
- Honey scale (`honey`, `honey-bright`, `honey-pale`, `honey-deep`, `honey-cream`), sage scale, ink scale, `outline-soft` color tokens
- 13 new animation keyframes (`slide-up-soft`, `fade-in`, `pop-in`, `kai-bob`, `kai-breathe`, `pandesal-squish`, `petal-drift`, `typing-bounce`, `gentle-float`, `wobble`, `flame-flicker`, `check-pop`, `bounce-in`)

**Globals CSS** ([`frontend/src/app/globals.css`](../../frontend/src/app/globals.css))
- Light + dark scale entries for the new ink/honey/sage/outline tokens
- `:root[data-palette='honey'|'cream'|'dawn']` palette-context overrides — orthogonal to light/dark
- `paper-note` shape utility (asymmetric `4px 12px 4px 12px` radius + `rotate(-1.2deg)` tilt + amber ambient shadow), `paper-note--right` mirror variant
- `prefers-reduced-motion: reduce` block disables all 13 redesign animations + legacy landing-page animations (F2 verdict)

**Root layout** ([`frontend/src/app/layout.tsx`](../../frontend/src/app/layout.tsx))
- `Fraunces` from `next/font/google` (weights 400/500/600 + italic, swap display, `--font-fraunces` variable)
- Palette persistence init script (mirrors dark-mode pattern) — reads `localStorage.akbai-palette` and applies `data-palette` attribute pre-hydration
- `NextIntlClientProvider` (server-resolved locale + messages) wraps `PaletteProvider` wraps `PostHogProvider`
- `<html lang>` switches `tl` ⇄ `en` based on resolved locale

**Palette context** ([`frontend/src/lib/palette/palette-context.tsx`](../../frontend/src/lib/palette/palette-context.tsx))
- `<PaletteProvider>` (root) + `usePalette()` hook + `<PaletteScope palette="honey">` for per-route segment overrides
- Persists to `localStorage.akbai-palette`; SSR-safe initial read from `data-palette` attribute set by inline script
- Default palette: `cream` (current behavior unchanged for unredesigned screens)

**i18n** (next-intl 4.9.1)
- `lib/i18n/config.ts` — locales array, `isLocale` guard, `pickLocaleFromAcceptLanguage` helper
- `lib/i18n/request.ts` — cookie-first locale resolution with `Accept-Language` fallback
- `lib/i18n/set-locale.ts` — server action that writes `NEXT_LOCALE` cookie + revalidates layout
- `messages/fil.json` + `messages/en.json` — namespaced FIL + EN catalogs (common, nav, language, home keys)
- `next.config.js` wires `createNextIntlPlugin('./src/lib/i18n/request.ts')`
- 12 unit tests on the locale helper — all passing

**Primitive components** (additive, no parallel components)
- `components/ui/pill.tsx` — Pill primitive (variants: honey / sage / urgent / neutral; sizes: sm / md / lg; CVA-driven)
- `components/ui/paper-note.tsx` — PaperNote primitive (tilt: left/right/none, tone: default/honey/sage, padding: sm/md/lg, optional TapeStrip child)
- `components/ui/button.jsx` — extended with `honey` and `paper` variants (existing variants untouched)
- `components/ui/card.jsx` — extended with `paper` and `honey` variants via `variant` prop (default keeps existing className)
- `@radix-ui/react-slider` already present — wrapped slider primitive deferred until first consumer needs it (avoid speculative reskin)

### Verification

- `npx tsc --noEmit`: 38 errors — **identical count on main HEAD before Phase 3 changes** (confirmed via `git stash` round-trip). Zero new TS errors introduced.
- `npx vitest run`: 75 files / 1121 tests passing including new `lib/i18n/__tests__/config.test.ts`
- `npx next build`: 45 routes compiled successfully, "Compiled successfully in 4.4s", no warnings

### What's next

**Phase 4 — Brand Vocabulary.** Build the visual-language pieces: `<Kai>` avatar component (wraps existing `illustrations/svg/kai/`), decorative motif components (`CapizPattern`, `FloatingPetals`, `WovenDivider`, `Squiggle`, `TapeStrip`), and the 9-icon brand set ported from the approved icon repo. Phase 5 (Shared Chrome) follows.

Lead: build-engineer. Reviewers: build-ux (component-by-component review), build-qa (visual parity tests via Playwright).

---

## Frontend Redesign — Phase 4 (Brand Vocabulary)

**Date:** 2026-04-26
**Status:** **COMPLETE.** Typecheck (38 errors — same pre-existing count as before Phase 4), Vitest (78 files / 1167 tests passing — 46 new Phase 4 tests), `npx next build` (45 routes compiled, no warnings, "Compiled successfully in 4.4s").
**Team:** team-lead (PM), build-architect (ADR-013), build-engineer (bulk port — agent invocation), build-ux (PM-led review), build-qa (test scaffolding by build-engineer).

### Deliverables

**ADR-013** (component organization) — appended to [`skills/solutions-architect/references/architecture-decisions.md`](../skills/solutions-architect/references/architecture-decisions.md). Locks: brand icons in `frontend/src/components/illustrations/icons/` (separate from `svg/` for discoverability), decorative motifs in `frontend/src/components/illustrations/svg/decorative/` (extends existing tree), Kai composition in `frontend/src/components/illustrations/kai/`. No CSS-in-JS, all SVG inline (KaiSitting uses Next/Image for the PNG mark), `lucide-react` retained for utility roles only.

**Asset copy** — `design_handoff_akbai_redesign/prototype/assets/kai-mark.png` (2048×2048, 6.3MB master) → [`frontend/public/icons/kai-mark.png`](../../frontend/public/icons/kai-mark.png). Next/Image generates optimized variants on demand (no perf budget concern at delivery).

**Brand icon set** — 15 components in [`frontend/src/components/illustrations/icons/`](../../frontend/src/components/illustrations/icons/):
- 9 feature icons: `IconResibo`, `IconUsap`, `IconPera`, `IconKalendaryo`, `IconPrecio`, `IconInvoice`, `IconCheckin`, `IconSundayStory`, `IconDrafts`
- 5 nav icons: `IconHomeNav`, `IconChatNav`, `IconScanNav`, `IconMoneyNav`, `IconMoreNav` (each accepts `active?: boolean` for active/inactive state)
- 1 brand motif: `IconSampaguita`
- `useId()` for gradient ID safety on multi-instance pages
- `IconKalendaryo` exposes `day?: number` (default 25) — fixes the source repo's hard-coded "25"

**Decorative motifs** — 8 components extending [`frontend/src/components/illustrations/svg/decorative/`](../../frontend/src/components/illustrations/svg/decorative/):
- `CapizPattern` (full-bleed pattern, default opacity 0.18, `pointer-events-none`)
- `FloatingPetals` (deterministic SSR-safe stagger; perf-cap at 16 petals)
- `WovenDivider` (32-segment zigzag)
- `Squiggle` (default width 120 FIL / 130 EN by caller)
- `TapeStrip` (canonical washi-tape — `paper-note.tsx` now imports this instead of inlining)
- `SwayingLeaf` (uses Phase 3 `animate-gentle-float` — dedicated `leaf-sway` keyframe deferred)
- `Sunburst` (12 rays, default size 200, opacity 0.3)
- `DoodleArrow` (direction prop maps to rotation: right=0°, down=90°, left=180°, up=270°)

**Kai composition** — new directory [`frontend/src/components/illustrations/kai/`](../../frontend/src/components/illustrations/kai/):
- `kai.tsx` — `<Kai expression size animated />` with 6 expressions mapped to existing `Ka*` SVGs from `svg/ka-expressions/`. `animated` toggles `animate-kai-bob`.
- `kai-sitting.tsx` — 168×168 hero with circular border-radius, `shadow-ambient-lg`, Next/Image with `priority` for LCP. `animated` applies `animate-kai-breathe`.
- `index.ts` re-exports both + types.

**`paper-note.tsx` refactor** — internal `PositionedTape` wrapper now composes the canonical `TapeStrip` from `illustrations/svg/decorative/` instead of inlining its own span. Backward-compat re-export kept.

**`svg/index.ts`** — extended decorative section with 8 new motif exports (existing exports untouched).

**Tests** — 46 new Vitest tests across 3 consolidated files (one per directory) using `react-dom/server`'s `renderToStaticMarkup`. Coverage: viewBox assertions for all 15 icons, size-prop honored, day-prop on `IconKalendaryo`, active-state palette swap on nav icons, motif element counts (32 woven segments, 12 sunburst rays, configurable petal count, 16-petal perf cap).

### Verification

- `npx tsc --noEmit`: **38 errors — identical pre-existing baseline.** Zero new TS errors introduced by Phase 4.
- `npx vitest run`: **78 files / 1167 tests passing.** 46 new Phase 4 tests + Phase 3's 12 i18n tests + pre-existing 1109 = 1167.
- `npx next build`: 45 routes compiled clean, no warnings.

### Open follow-ups

- **Playwright visual-parity test** — not scaffolded in Phase 4. Defer to Phase 7 (home gate) where the Kai mark + petals + woven divider + paper-note all land in the same scroll container; visual parity tested holistically there.
- **Custom `leaf-sway` keyframe** — `SwayingLeaf` currently uses `animate-gentle-float`. Add dedicated keyframe (rotation-based, not translate-based) when first consumer ships if the float feel is wrong.
- **Kai mark optimization** — 6.3MB master PNG. **RESOLVED 2026-04-26 same day**: chroma-keyed + tight bbox cropped + circular masked + resized to 512×512 → 445KB final at [`frontend/public/icons/kai-mark.png`](../../frontend/public/icons/kai-mark.png). A faint cream rim remains because the source PNG had the soft-glow layer baked in; Anton tracking re-export with glow-layer-hidden as personal action item (see memory `project_kai_mark_master_reexport.md`).

### What's next

**Phase 5 — Shared Chrome.** Re-skin sidebar (`sidebar-nav.tsx`) and bottom nav (`bottom-nav.tsx`) per C1/C2/C3 verdicts: 5-tab structure preserved, honey-gradient active states, custom `tablet:860px` breakpoint, language toggle pills functional via the Phase 3 `setLocaleCookie` server action, "Higit pa…" Vaul drawer with the 6 long-tail routes.

Lead: build-engineer. Reviewers: build-ux (chrome is high-traffic — every screen inherits it), build-qa (Playwright tab-navigation E2E). Phase 5 is also the first end-to-end i18n proof — toggle the pill and the chrome re-renders in EN.

---

## Frontend Redesign — Phase 5 starting state (handoff for next session)

**Date:** 2026-04-26 (handoff written at end of Phase 3+4 session for cross-session continuity)
**Session boundary:** Phase 3 + Phase 4 shipped, committed to branch `claude/redesign-phase-3-4`. Next session starts a clean Phase 5 build from this branch tip.

### What's on disk and committed

- **Phase 1 + 1.5 research deliverables** — `akbai-delivery/skills/ux-designer/references/{ui-ux-principles-akbai.md,filipino-design-context.md,mobile-first.md,conversational-filipino-manual.md}` + raw NotebookLM corpus under `references/research-sources/`
- **Phase 2 synthesis** — `design_handoff_akbai_redesign/synthesis/{01-comparison.md,02-decisions.md,03-enrichments.md,04-reuse-audit.md,screens/00-home.md…10-shared-chrome.md}` — all sections A–F SIGNED OFF, B4/B5/B6 review repos APPROVED, all 13 open questions RESOLVED
- **Phase 3 foundations** — Tailwind config (Fraunces serif, `tablet:860px`, honey/sage/ink color scales, 13 animation keyframes), `globals.css` palette context overrides + `paper-note` shape utility + `prefers-reduced-motion` gating, `lib/palette/palette-context.tsx`, `lib/i18n/{config,request,set-locale}.ts`, `messages/{fil,en}.json`, `next.config.js` next-intl plugin, `components/ui/{pill,paper-note}.tsx` primitives, `button.jsx` + `card.jsx` extended with `honey`/`paper` variants
- **Phase 4 brand vocabulary** — 15 brand icons in `components/illustrations/icons/`, 8 motifs in `components/illustrations/svg/decorative/`, Kai composition in `components/illustrations/kai/`, Kai mark master at `frontend/public/icons/kai-mark.png` (512×512, 445KB, chroma-keyed)
- **ADR-013** at `akbai-delivery/skills/solutions-architect/references/architecture-decisions.md`

### What's NOT wired yet (Phase 5 scope)

- **`(app)/layout.tsx`** still imports the legacy `@/components/dashboard/sidebar-nav` and `@/components/dashboard/bottom-nav` — neither has been re-skinned. The legacy chrome works but does NOT yet use any Phase 4 nav icons (`IconHomeNav`/`IconChatNav`/`IconScanNav`/`IconMoneyNav`/`IconMoreNav`) or the language toggle. Phase 5 replaces these in place — preserve the current API so consumer pages don't break.
- **Language toggle pill** — `setLocaleCookie` server action exists but no UI invokes it yet. Phase 5 adds the pill in sidebar bottom + a compact mobile affordance in the "Higit pa…" drawer.
- **"Higit pa…" Vaul drawer** — vaul is installed (`vaul@1.1.2` in package.json) but the More-tab drawer doesn't exist. Phase 5 builds it with the 6 long-tail routes per C7 verdict (BIR Deadlines, Tamang Presyo, Mga Invoice, Mga Draft, Daily Check-in history, Linggong Kuwento).
- **Persona pill** — sidebar persona pill (C4 verdict) doesn't exist yet. Build to display business name + tagline, tap routes to `/profile`.
- **Bottom nav active-state glow** — switch to honey-gradient pill style per C2 verdict; preserve the 5-tab structure.

### Open follow-ups Phase 5 inherits

- **Kai mark soft-glow rim** — tracked in memory `project_kai_mark_master_reexport.md`. Don't re-attempt chroma-key in Phase 5; let Anton re-export.
- **Playwright visual-parity test** — deferred from Phase 4 to Phase 7 (home gate). Phase 5 should add Playwright E2E for nav navigation + locale toggle, NOT visual-parity yet.
- **Existing dashboard chrome consumers** — every (app) route currently inherits the legacy chrome. The Phase 5 swap is transparent to consumer pages by design (re-skin `sidebar-nav.tsx` + `bottom-nav.tsx` in place per Sprint 5 reuse rule), but Anton should confirm nothing visually regresses on `/dashboard` / `/chat` / `/expenses` immediately after.

### Verification baseline (next session re-runs to confirm clean start)

- `npx tsc --noEmit`: 38 errors expected (all pre-existing in `src/app/api/**/__tests__/` route tests + `src/lib/costing/__tests__/calculations.test.ts`). Anything > 38 is regression.
- `npx vitest run`: 78 files / 1167 tests expected.
- `npx next build`: 45 routes expected, "Compiled successfully", no warnings.
- `git status` from main branch tip: clean working tree (Phase 3+4 already committed to branch).

### First actions for next session

1. **Read this handoff entry first.** Then read `02-decisions.md` Section C (chrome verdicts C1–C7) and the per-screen spec at `screens/10-shared-chrome.md` for the canonical Phase 5 spec.
2. **Verify clean baseline** — run the three verification commands above. If anything is off, stop and reconcile before adding code.
3. **Spawn `/build` Phase 5 team** — team-lead PM + build-engineer (lead) + build-ux (mandatory — chrome inherits everywhere) + build-qa (Playwright nav + locale toggle E2E). Skip build-po (continuation), build-data (no schema), build-ai (no Claude), build-marketing (chrome strings already in i18n catalogs).
4. **Implementation order** — sidebar re-skin → bottom nav re-skin → language toggle pill → persona pill → "Higit pa" drawer. Each step ends with the route still functional; no half-shipped chrome.

### Multi-session plan for Phases 5–12 (forward-looking, locked 2026-04-26)

**Five sessions to ship, possibly six if Phase 11 surfaces regressions.** Each session ends with a commit + handoff note in this file. Phase 7 is an immutable single-phase session (24h feel-test gate). Phase 10 is alone (largest L-feature remaining).

| # | Session | Phases | Pair logic | Hard end-condition |
|---|---|---|---|---|
| 1 | DONE | Phase 1, 2, 3, 4 | Research + synthesis → foundations + brand vocab | Branch `claude/redesign-phase-3-4` shipped |
| 2 | **NEXT** | **Phase 5 + Phase 6** | Chrome enables onboarding (post-onboarding lands on new home). Both M-features, ~25 files combined, both touch i18n catalogs. | Chrome + auth/onboarding ship together |
| 3 | after | **Phase 7 ONLY** | Flagship home — the bet. `/api/morning-briefing` extension + weekly-story integration. **24h feel-test gate** — Anton uses on real phone for a day before Phase 8. Immutable session boundary. | Feel-test PAUSE (24h) |
| 4 | | **Phase 8 + Phase 9** | Screen-by-screen ports (Kausap + Saan, Scan + Deadlines). ~20 files. Phase 9 needs `review-security` for receipt PII. | Both ship |
| 5 | | **Phase 10 ONLY** | Largest L-feature: 5 screens (Costing, Invoices, **Drafts (new route)**, Check-in, **Kuwento (new route)**) + schema migration (`energy_level`, `note`) + new `/api/weekly-story` endpoint + Vercel Cron Sunday trigger. ~25-30 files. Don't pair this with anything. | All 5 screens ship |
| 6 | | **Phase 11 + Phase 12** | Cross-cutting quality (axe-core, Lighthouse, PWA, reduced-motion × dark × contrast × locale matrix) + retention validation (PostHog instrumentation, dashboards, retro). | **Redesign DECLARED SHIPPED** |

**Variable risk:** Phase 11 may surface regressions that need their own session. If `axe-core` reports 10+ critical/serious violations OR Lighthouse drops below 85, split — Phase 12 spills to a 7th session. The handoff note from session 5 to session 6 must record axe + Lighthouse numbers so session 6 can make the split call before starting work.

**Why these groupings:** session 2 pairs because chrome wraps the auth flow; sessions 4 + 6 pair similar-concern screen ports / cross-cutting passes; session 3 is alone because of the feel-test gate; session 5 is alone because Phase 10 is the only L-feature left.

**Each future session opens with the same pattern:** read this multi-session table to confirm "you are here" → read the most recent handoff entry → verify baseline (typecheck + tests + build) → spawn the relevant `/build` team → ship → write next handoff → commit → close.

---

## Frontend Redesign — Phase 5 (Shared Chrome) — DONE

**Date:** 2026-04-26
**Commit:** `d9de0f5` on branch `claude/redesign-phase-3-4`
**Team:** team-lead (PM, in-session) + build-engineer (lead, direct) + build-ux (review pass) + build-qa (test scaffold).

### Deliverables

- **`SidebarNav` re-skin** ([sidebar-nav.tsx](../../frontend/src/components/dashboard/sidebar-nav.tsx)) — preserves the default-export API per Sprint 5 reuse rule. New layout: `<KaiSitting size={40}>` brand lockup + AKBai wordmark with Fraunces italic "ai" tail, persona pill (taps to `/profile` per C4) sourced from a server-side fetch in `(app)/layout.tsx`, 4 primary nav items (`Home / Chat / Scan / Pera`) using Phase 4 brand nav icons (`IconHomeNav` / `IconChatNav` / `IconScanNav` / `IconMoneyNav`), 5th item is the `<MoreDrawer>` Vaul trigger with `IconMoreNav`. Active state: `bg-gradient-to-r from-honey to-honey-deep` pill + `shadow-ambient`. Language toggle pinned to the bottom (per C5).
- **`BottomNav` re-skin** ([bottom-nav.tsx](../../frontend/src/components/dashboard/bottom-nav.tsx)) — 5 tabs preserved (`Home / Chat / Scan / Pera / More`), Profile removed (now reachable via the sidebar persona pill). Honey-deep active state on icon + label, glass blur preserved (`glass-nav` utility per C6), the 5th tab opens `<MoreDrawer showLanguageToggle>` so locale switching reaches mobile users without leaving the chrome.
- **`MoreDrawer`** ([more-drawer.tsx](../../frontend/src/components/dashboard/more-drawer.tsx)) — Vaul-based bottom-sheet drawer with the 6 long-tail routes from C7 (BIR Deadlines, Tamang Presyo, Mga Invoice, Mga Draft\*, Daily Check-in history, Linggong Kuwento\*). Routes marked \* render as coming-soon stubs (`comingSoon: true`, `href: null`) until Phase 10 ships them. Items registry exported as `MORE_DRAWER_ITEMS` for tests + future reuse.
- **`LanguageToggle`** ([language-toggle.tsx](../../frontend/src/components/dashboard/language-toggle.tsx)) — FIL/EN pill pair wired via `useLocale()` + the Phase 3 `setLocaleCookie` server action. Compact variant (`compact` prop) lives inside the `MoreDrawer` for mobile parity. Uses `useTransition` to disable both pills during the action so taps can't double-fire.
- **`(app)/layout.tsx`** ([layout.tsx](../../frontend/src/app/(app)/layout.tsx)) — converted to async; fetches `users.display_name` + `business_profiles.{business_name, business_type}` server-side via `createClient()` (or `createServiceClient()` under `SKIP_AUTH`), derives the persona pill `name + tagline`, and pipes it into `<SidebarNav persona={...}>`. Outer container switched from `md:ml-64` (768px / 256px) to `tablet:ml-60` (860px / 240px) per C3. Tagline derivation handles the `other:{user-typed-string}` business_type prefix used in onboarding step 2.
- **i18n catalogs** ([fil.json](../../frontend/messages/fil.json), [en.json](../../frontend/messages/en.json)) — `nav.brandTagline`, `nav.personaFallbackTagline`, `nav.personaAria`, `nav.businessTypeLabel.*` (7 keys), `language.*` (5 keys), `more.title/subtitle/comingSoon`, `more.items.{deadlines,costing,invoices,drafts,checkin,kuwento}.{title,subtitle}`. Auth + onboarding namespaces pre-populated for Phase 6.
- **Tests** — 4 new vitest suites under `components/dashboard/__tests__/`: `sidebar-nav.test.ts` (4 cases), `bottom-nav.test.ts` (rewritten — old test ran against the legacy 5-tab Profile layout), `more-drawer.test.ts` (5 cases on the items registry), `language-toggle.test.ts` (4 cases on the locale guard).

### Verification (recorded at commit time)

- `npx tsc --noEmit`: **38 errors — identical pre-existing baseline.** Zero new TS errors introduced.
- `npx vitest run`: **81 files / 1180 tests passing.** +13 new chrome tests vs Phase 4 baseline of 1167.
- `npx next build`: 45 routes compiled clean, "Compiled successfully", no warnings.

### Open follow-ups Phase 5 leaves

- **`md:` → `tablet:` band on internal pages** — `expenses/page.tsx`, `costing/page.tsx`, `invoices/page.tsx` still use `md:hidden` for FAB visibility / `hidden md:flex` for the inline button. At 768–860px the FAB is hidden but the bottom nav is still showing — functional but slightly redundant. Not chrome scope; resolve in Phase 8/10 when those pages are otherwise touched.
- **Persona pill data freshness** — server-side fetched once per layout render. If the user updates business name in Profile, the pill won't refresh until the next navigation. Acceptable for Phase 5 (single-user app, low edit frequency); revisit if a real-time signal becomes necessary.
- **Playwright nav E2E** — deferred to Phase 7 home gate. The MoreDrawer test currently covers the items registry; full open/close/route navigation E2E is on the Phase 7 punch list with the visual-parity tests.

---

## Frontend Redesign — Phase 6 (Auth + Onboarding) — DONE

**Date:** 2026-04-26
**Commit:** `0efc271` on branch `claude/redesign-phase-3-4`
**Team:** team-lead (PM) + build-engineer (lead, direct) + build-ux (Kai expression mapping + paper-note tilt review) + build-qa (sampaguita-progress + welcome-tour test rewrites). build-marketing not separately spawned — onboarding copy passes brand-pillar review since all strings live in `messages/{fil,en}.json` Phase 6 keys with the existing voice manual.

### Deliverables

- **Login redesign** ([(auth)/login/page.tsx](../../frontend/src/app/(auth)/login/page.tsx)) — `<KaiSitting size={168} animated>` hero replaces the prior twin-mark image stack, Fraunces serif title pulled from `auth.login.title`, single `<CapizPattern opacity={0.1}>` background + `<FloatingPetals count={4}>` ambient layer (perf-light at day-1 budget). All copy strings localized via `getTranslations('auth.login')`. Form internals (`LoginForm`) untouched.
- **`OnboardingShell`** ([onboarding-shell.tsx](../../frontend/src/components/onboarding/onboarding-shell.tsx)) — kumustahan frame: `<SampaguitaProgress>` row at top, then a `<Kai>` expression at 72px next to a tilted `<PaperNote>` carrying the step prompt (`font-serif text-lg`), plus a `promptSubtitle` slot, then the step's form content as `children`. Tilt direction alternates `left/right/left/right/left` per step.
- **`SampaguitaProgress`** ([sampaguita-progress.tsx](../../frontend/src/components/onboarding/sampaguita-progress.tsx)) — 5-dot stepper. `done` dots render `<IconSampaguita size={20}>`, `current` is a `bg-honey-deep` filled circle with `shadow-ambient`, `future` is an outlined circle. Replaces the generic linear progress bar.
- **`OnboardingWizard` refactor** ([onboarding-wizard.tsx](../../frontend/src/components/onboarding/onboarding-wizard.tsx)) — wraps each step in `<OnboardingShell>` with the canonical Kai expression map: `1: waving → 2: thinking → 3: happy → 4: concerned → 5: working`. Step 5.5 (BIR tax type) reuses `working`. Celebration step 6 renders `<KaiSitting size={144} animated>` + a honey-toned `<PaperNote>` with the first Kai message. All prompt copy localized via `useTranslations('onboarding')`.
- **5 step component refactors** ([step-welcome.tsx](../../frontend/src/components/onboarding/step-welcome.tsx), [step-business-type.tsx](../../frontend/src/components/onboarding/step-business-type.tsx), [step-income-range.tsx](../../frontend/src/components/onboarding/step-income-range.tsx), [step-pain-point.tsx](../../frontend/src/components/onboarding/step-pain-point.tsx), [step-bir-consent.tsx](../../frontend/src/components/onboarding/step-bir-consent.tsx)) — keep their existing form + state machines (incl. `useRef` + `onClick` per the React 19 rule, plus the `other:{custom-text}` business-type schema). Each step strips the ad-hoc Kai bubble and `IllustrationWrapper` since the shell now provides them. CTAs adopt the Phase 5 honey-gradient pill (`bg-gradient-to-r from-honey to-honey-deep`). [step-bir-tax-type.tsx](../../frontend/src/components/onboarding/step-bir-tax-type.tsx) gets the same treatment.
- **`(app)/onboarding/page.tsx`** ([page.tsx](../../frontend/src/app/(app)/onboarding/page.tsx)) — wrapped in `<CapizPattern opacity={0.12}>` + `<FloatingPetals count={6}>` motif layers. Title swapped to "AKB**ai**" (Fraunces italic honey-deep on the "ai" tail) + Fraunces italic tagline "Kilala kita" pulled from `onboarding.tagline`.
- **Welcome tour rebuild** ([welcome-tour.tsx](../../frontend/src/components/onboarding/welcome-tour.tsx)) — replaces the prior modal layout with: a Kai-led header (`<Kai expression={pain-mapped} size={88} animated>` next to a tilted `<PaperNote tone="honey">` greeting), a primary `<PaperNote>` card driven by `primaryPain`, and 2 supporting paper-note cards in a 2-column grid. Pain-point dictionary maps to a Kai expression (`receipt_tracking → happy`, `bir_compliance → working`, `customer_messages → thinking`, `knowing_earnings → celebrating`).
- **Cross-device persistence** — completion now writes `user_metadata.welcome_tour_completed: true` via `supabase.auth.updateUser({ data: { ...user.user_metadata, welcome_tour_completed: true } })` on dismiss. Falls back to `localStorage.akbai_tour_seen` as a same-device backup for `SKIP_AUTH` / offline. The dashboard server-side reads `user.user_metadata.welcome_tour_completed` and passes `initiallyCompleted` to `<WelcomeTour>`, so returning users on a new device see the tour skip after the metadata write completes.
- **i18n catalogs (Phase 6)** — `auth.login.{title, subtitle, secureAccess, noAccount, autoSignup, disclaimer}`, `onboarding.{tagline, stepOf, step1-5.{kaiPrompt, cta, placeholder}, step5.{yes, no}, celebrate.{title, subtitle, cta}, tour.*}`, full `welcomeTour.{aria, greeting, subtitle, primaryCta, skipCta, cards.{expensesPrimary, birPrimary, messagesPrimary, earningsPrimary, saanNapunta, kausapKai, trackExpenses, birReminders}.{title, description}}`. Both FIL and EN.
- **Tests** — `sampaguita-progress.test.ts` (9 cases on step-state derivation + the canonical Kai expression map), `welcome-tour.test.ts` rewritten for the Phase 6 persistence-key contract + pain coverage (the legacy 4-card list test was tightly coupled to the old layout and would have fought every future iteration).

### Verification (recorded at commit time)

- `npx tsc --noEmit`: **38 errors — identical pre-existing baseline.** Zero new TS errors introduced.
- `npx vitest run`: **82 files / 1188 tests passing.** Net +8 vs Phase 5 baseline of 1180 (sampaguita-progress added; welcome-tour rewritten in place).
- `npx next build`: 45 routes compiled clean, "Compiled successfully in 4.3s", no warnings.

### Open follow-ups Phase 6 leaves

- **Locale flip live verification** — the i18n catalogs carry the keys for chrome + auth + onboarding + welcomeTour, and the LanguageToggle is wired to `setLocaleCookie`, but a manual browser-driven flip on `/dashboard` / `/profile` / `/chat` was not captured in this non-interactive session. Recommend Anton runs `npm run dev`, taps the FIL/EN pill in the sidebar, and confirms the chrome strings flip on at least 3 routes before declaring the redesign locale-complete.
- **Playwright before/after screenshots** — deferred to Phase 7 home gate (already on the Phase 7 punch list). The Phase 4 motif → Phase 5 chrome → Phase 6 onboarding flow is internally consistent on disk; visual parity vs the handoff prototype is the home-gate test, not a Phase 6 test.
- **`StepBirConsent` and `StepBirTaxType` `firstName` prop** — both still accept `firstName` in their interface but no longer use it (the shell renders the named greeting). Kept the prop signature stable so the wizard's existing `<StepBirConsent firstName={firstName}>` call site doesn't need a typecheck update; remove during a Phase 11 cleanup pass.
- **Kai mark soft-glow rim** — still tracked in memory `project_kai_mark_master_reexport.md`. The login hero renders the existing 512×512 mark; the faint cream rim remains until Anton re-exports the master with the soft-glow layer hidden.

---

## Frontend Redesign — Phase 7 starting state (handoff for next session)

**Date:** 2026-04-26 (handoff written at end of Phase 5+6 session for cross-session continuity)
**Session boundary:** Phase 5 + Phase 6 shipped, committed to branch `claude/redesign-phase-3-4` (commits `d9de0f5` + `0efc271`). Next session is **Phase 7 ONLY** — the flagship home — with a 24h feel-test gate as the immutable session boundary.

### What's on disk and committed (cumulative)

- **Phase 1 + 1.5 research**, **Phase 2 synthesis** (all sections SIGNED OFF, repos APPROVED, 13 questions RESOLVED), **Phase 3 foundations** (Tailwind tablet:860px + Fraunces + honey/sage/ink scales + 13 keyframes + palette context + i18n + primitives), **Phase 4 brand vocabulary** (15 brand icons + 8 motifs + Kai composition + 512×512 Kai mark) — see prior handoff for the full file map.
- **Phase 5 chrome** — re-skinned `sidebar-nav.tsx` + `bottom-nav.tsx` in place, `(app)/layout.tsx` async with persona fetch + `tablet:` breakpoint, `language-toggle.tsx` + `more-drawer.tsx` shipped, i18n catalogs hold all chrome keys.
- **Phase 6 auth + onboarding** — login redesign with KaiSitting hero, `OnboardingShell` + `SampaguitaProgress` + Kai expression mapping per step, paper-note welcome tour with `user_metadata.welcome_tour_completed` cross-device persistence.

### What's NOT wired yet (Phase 7 scope)

- **`/dashboard` (home) layout per spec** — current `dashboard/page.tsx` still renders the prior dashboard cards + greeting + check-in section + morning briefing in the legacy structure. Phase 7 replaces this with the synthesized layout from [`screens/00-home.md`](../../design_handoff_akbai_redesign/synthesis/screens/00-home.md): Kumustahan hero (KaiSitting 168px + Fraunces greeting + time-of-day pill + Squiggle underline), `<PaperNote>` check-in invite, "Anong gagawin natin?" 5-tile action grid (`grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))`), `<WovenDivider>` separator, Kuwento ng Linggo card (3-col KPI + banig chart + Kai takeaway paper-note + footer link), closing italic "— Kai", `<FloatingPetals>` ambient layer.
- **5-tile action grid** — the spec locks Hicks-law to exactly 5 tiles in the order: Scan resibo / Kausap si Kai / BIR paalala / Tamang presyo / Mga invoice. Each tile re-skins `dashboard-card.tsx` (or `feature-tile.tsx` per the reuse map) — preserve API. Tile background tints per Q3 resolution: re-derive for the cream `#fdf9f2` background, ≥ 3:1 contrast.
- **Kuwento ng Linggo card on home** — Q1 resolution: home pulls the same `/api/weekly-story` payload as `/kuwento` (renders KPI grid + chart + takeaway only; full narrative paragraphs land in `/kuwento` in Phase 10). The endpoint **does not exist yet** — Phase 7 needs to either add a stub that returns a typed empty payload from existing data (kita / gastos / tubo aggregations) or scaffold it with TODOs and the cron pipeline lands in Phase 10. Confirm with Anton.
- **`/api/morning-briefing` extension** — current returns a single Kai paragraph. Per the multi-session plan, Phase 7 extends it for the home Kumustahan hero context (greeting + tonal rotation per D6: Energetic / Observant / Celebratory). Cost discipline applies — circuit breaker + Sonnet routing per ADR-011.
- **Banig 7-day bar chart** — new `<BanigBarChart>` Recharts custom shape (per home spec §5 reuse map). Use the brand sage / honey HSL pair, sampaguita marker on the peak day. Phase 1.5 perf budget applies (image budget ≤ 200KB cold home load).
- **Streak counter** — D4 verdict "Pang-{n} araw na natin" framing already lives in `home.checkin.streak` i18n key (added in Phase 5). The check-in section needs to consume that key + a real `daily_check_in` query for the count (today vs yesterday continuity).
- **`pages/expenses` / `costing` / `invoices` `md:` → `tablet:` band** — these pages still use `md:hidden` for FAB visibility; the chrome breakpoint is `tablet:` (860px) so 768–860px shows both bottom nav and FAB. Not strictly Phase 7 scope but the home spec implicitly assumes the rest of the chrome sits in the `tablet:` system. Address opportunistically while you're in `(app)`.

### Open follow-ups Phase 7 inherits

- **Kai mark soft-glow rim** — tracked in memory `project_kai_mark_master_reexport.md`. Phase 7 renders KaiSitting at 168px (the hero) — the faint rim is more visible at this size than at the sidebar 40px. If Anton hasn't re-exported by Phase 7 start, **note in the feel-test report** so this is captured before the 24h gate locks in.
- **Playwright visual-parity test** — Phase 7 is the home gate; the spec calls for ≤ 0.5% pixel diff vs `screenshots/02-home-honey-fil-mobile.png` adapted to cream bg. Build the parity test as part of Phase 7's QA pass, not after.
- **Locale flip on home** — already wired in chrome via Phase 5 LanguageToggle. Phase 7 needs the home strings to pivot live (`home.greeting.{morning,afternoon,evening}`, `home.kumustaKa`, `home.checkin.*`, `home.actions.*`, `home.kuwento.*` already exist in both catalogs). Verify both locales render correctly on home.
- **PostHog instrumentation** — home is the highest-traffic route. Phase 12 retention validation will lean on PostHog events from this screen, so think about event hooks at the time of build (`tile_clicked`, `paper_note_check_in_opened`, `kuwento_card_opened`).

### Verification baseline (next session re-runs to confirm clean start)

- `npx tsc --noEmit`: **38 errors expected.** All pre-existing in `src/app/api/**/__tests__/` route tests + `src/lib/costing/__tests__/calculations.test.ts`. Anything > 38 is regression.
- `npx vitest run`: **82 files / 1188 tests expected.**
- `npx next build`: **45 routes expected**, "Compiled successfully", no warnings.
- `git status` from branch tip: clean working tree (Phase 5 + 6 already committed; only `.firecrawl-converted/` is the historic untracked directory).

### First actions for next session

1. **Read this handoff entry first.** Then read [`screens/00-home.md`](../../design_handoff_akbai_redesign/synthesis/screens/00-home.md) (canonical Phase 7 spec) and the relevant Q1/Q2/Q3 resolutions from [`02-decisions.md`](../../design_handoff_akbai_redesign/synthesis/02-decisions.md).
2. **Verify clean baseline** — run the three verification commands above. If anything is off, stop and reconcile before adding code.
3. **Spawn `/build` Phase 7 team** — team-lead PM + build-engineer (lead) + build-ux (mandatory — home is the bet) + build-qa (Playwright visual-parity test built in this phase, not deferred) + build-ai (Kai expression rotation + morning-briefing extension + tonal rotation) + build-data (only if Phase 7 adds the `weekly_stories` cache table; otherwise skip and let Phase 10 own it). Add `review-security` only if `/api/weekly-story` lands in Phase 7.
4. **Implementation order** (each step ends with the route still functional):
   1. Re-skin `feature-tile.tsx` / `dashboard-card.tsx` to the new tile chrome (in place).
   2. Build the Kumustahan hero (KaiSitting + Fraunces greeting block).
   3. Wire the `<PaperNote>` check-in invite to the existing modal + streak data.
   4. Lay out the 5-tile action grid in the locked Hicks-law order.
   5. Drop in the `<WovenDivider>`.
   6. Build the Kuwento ng Linggo card (KPI grid + BanigBarChart + Kai takeaway paper-note).
   7. Add the `<FloatingPetals>` ambient layer last (per Q2 deferral — first-visit users see static decorations; petals come on day-2+ once SW caches).
   8. Wire Playwright visual-parity test before commit.
5. **Manually verify locale flip on home** — toggle the chrome FIL/EN pill and confirm `home.*` strings flip. This is the first end-to-end home locale proof.
6. **Hand to Anton for the 24h feel-test gate.** Phase 7 doesn't ship to the next session until Anton reports back from real-phone use. The handoff note from Phase 7 to Phase 8 must record what surfaced during the feel-test — including any Kai mark soft-glow rim observation at hero size.

### Multi-session plan position (forward-looking, locked 2026-04-26)

You are entering **Session 3 of 6 — Phase 7 ONLY**. Per the plan:

| # | Session | Phases | Status |
|---|---|---|---|
| 1 | DONE | Phase 1, 2, 3, 4 | Branch `claude/redesign-phase-3-4` shipped |
| 2 | DONE (this session) | **Phase 5 + Phase 6** | Chrome + auth/onboarding committed (`d9de0f5` + `0efc271`) |
| 3 | **NEXT** | **Phase 7 ONLY** | Flagship home + 24h feel-test gate (immutable) |
| 4 | after | Phase 8 + Phase 9 | Kausap + Saan, Scan + Deadlines |
| 5 | | Phase 10 ONLY | Costing, Invoices, Drafts (new), Check-in, Kuwento (new) + cron |
| 6 | | Phase 11 + Phase 12 | A11y / perf matrix + retention validation. **DECLARED SHIPPED** at end. |

Phase 11 may still split into a 7th session if `axe-core` reports 10+ critical/serious violations or Lighthouse drops < 85 — that call gets made at the start of session 6 from session 5's handoff numbers.

---

## Frontend Redesign — Phase 7 (Flagship Home) — DONE

**Date:** 2026-04-26
**Branch:** `claude/redesign-phase-3-4` (cumulative since Phase 3 — Phase 7 commits sit on top of `0efc271`)
**Goal:** Replace the legacy 4-card dashboard with the canonical Phase 7 home — Kumustahan hero (KaiSitting 168px + Fraunces greeting + Squiggle), `<PaperNote>` check-in invite with streak framing, 5-tile Hicks-law action grid, `<WovenDivider>`, Kuwento ng Linggo card (3-col KPI + `<BanigBarChart>` + Kai takeaway paper-note + footer link), closing "— Kai" italic, and `<FloatingPetals>`-deferred ambient layer (Q2: static day 0, animated day 2+).

### Q1 resolution applied

**Path A (Anton call 2026-04-26):** Phase 7 owns a typed `/api/weekly-story` stub. The route returns a `WeeklyStory` payload (`week_start`, `week_end`, `kita_centavos`, `gastos_centavos`, `tubo_centavos`, `daily_breakdown[7]`, `peak_day_index`, `takeaway`, `tone`) computed on-request from `transactions` + `daily_check_in` aggregations. No LLM. No new table. Phase 10 will swap the static-template `takeaway` for an LLM call, add the `weekly_stories` cache table + Sunday Vercel cron, and serve `/kuwento` from the same endpoint. ADR-015 captures the contract; the route signature is stable across Phase 7 → Phase 10. Tonal rotation (D6 — Energetic / Observant / Celebratory) is already deterministic via `pickTone(today) = (dayOfYear − 1) % 3`.

### Operational decisions Anton locked at session start

- **Anthropic credits:** **Add graceful Claude fallback now**, top up later. The `/api/morning-briefing` extension returns `reason: 'no_credits'` + a deterministic Filipino fallback tagline + tone whenever the Anthropic SDK throws a credit-balance error or the `ANTHROPIC_API_KEY` is the placeholder. The Kumustahan hero degrades to a static greeting if no tagline is present. **Implication for the 24h feel-test:** Anton sees the layout + visuals at full fidelity but the Kai micro-tagline rotation is the deterministic fallback set, not LLM output. LLM tonal rotation re-tests once credits land.
- **Kai mark soft-glow rim:** Phase 7 ships with the existing `frontend/public/icons/kai-mark.png`. Hero size 168px will likely surface the chroma-keyed cream rim more visibly than the 40px sidebar. **Capture in the feel-test handoff** (placeholder section below). Anton may re-export during the 24h gate; if so, the asset swap is a one-file-replace before Session 4.

### What was built

**Backend (one new route + supporting libs):**
- [frontend/src/app/api/weekly-story/route.ts](../../frontend/src/app/api/weekly-story/route.ts) — GET handler. SKIP_AUTH service-client switch per ADR-014. All-tier (no tier check per ADR-015 §6). Returns `{ available: true, story, cached: false }` on happy path; `{ available: false, reason: 'no_data' | 'error', message_tl }` on empty week or DB error. Pure DB aggregation; no LLM.
- [frontend/src/lib/weekly-story/{types,week-bounds,aggregate,takeaway-templates}.ts](../../frontend/src/lib/weekly-story/) — Manila-Monday week bounds, transactions+daily_check_in aggregation, 9 tonal × week-shape static templates with deterministic per-day tone selection.
- [frontend/src/lib/streak/compute-streak.ts](../../frontend/src/lib/streak/compute-streak.ts) — pure function reading `daily_check_in.check_in_date` history, walks consecutive days from today backwards, returns `{ streak, status: 'fresh' | 'active' | 'reset' }` — drives the PaperNote invite copy variant per D4 + the `streak-resilience-no-shame` enrichment.
- [frontend/src/lib/timezone/time-of-day.ts](../../frontend/src/lib/timezone/time-of-day.ts) — pure function `(manilaHour) → 'morning' | 'afternoon' | 'evening'` (5–11 / 12–17 / else). Server-safe so both `dashboard/page.tsx` (Server Component) and `kumustahan-hero.tsx` (`'use client'`) can call it. **This module exists because of a P1 runtime bug QA caught:** the original implementation co-located `computeTimeOfDay` inside the `'use client'` hero, and the Server Component import returned 500. Hot-fix moved it to a server-safe module.

**Morning-briefing extension (D6 tonal rotation + graceful fallback):**
- [frontend/src/lib/morning-briefing/{tone,fallback-templates}.ts](../../frontend/src/lib/morning-briefing/) — `pickTone(date)` deterministic per Manila day; `pickFallback(tone, date, name)` returns a deterministic per-day variant from a 3-tone × 3-variant template registry. No fabricated peso amounts in the fallback set.
- [frontend/src/lib/morning-briefing/types.ts](../../frontend/src/lib/morning-briefing/types.ts) — extended `MorningBriefingResponse` with optional `tagline`, `tone`, and `reason: 'no_credits'`.
- [frontend/src/lib/claude/{types,assemble}.ts](../../frontend/src/lib/claude/) — added optional non-breaking `outputFormatHint?: string` to `PromptAssemblyInput` so the morning-briefing route can ask Claude for JSON output (`{ briefing, tagline }`) per the day's tone. All other features call sites unchanged.
- [frontend/src/app/api/morning-briefing/route.ts](../../frontend/src/app/api/morning-briefing/route.ts) — wires tone + format-hint, parses Claude's JSON response (markdown-fence stripping), credit-balance/5xx graceful fallback returns `reason: 'no_credits'` with deterministic tagline, server-log path now sanitised to log only `Error.constructor.name` (no Anthropic billing details).

**Home composition (re-skin in place + new presentational components):**
- [frontend/src/components/dashboard/dashboard-card.tsx](../../frontend/src/components/dashboard/dashboard-card.tsx) — re-skinned IN PLACE per Sprint 5 reuse rule. Phase 4 brand icons added to `ICON_MAP` (`resibo`/`usap`/`kalendaryo`/`precio`/`invoice`). Per-tile honey/sage tints re-derived for the cream `#fdf9f2` background per Q3. Existing prop API preserved.
- [frontend/src/components/dashboard/kumustahan-hero.tsx](../../frontend/src/components/dashboard/kumustahan-hero.tsx) — NEW. `<KaiSitting size={168} animated>` + time-of-day pill + Fraunces 30/500 name line + Fraunces italic 26/500 "kumusta ka?" + single `<Squiggle>` underline + optional `<CapizPattern>` at 0.18 opacity (motion-reduce gated). Optional `aiTagline` + `aiTone` props from the morning-briefing extension; degrades cleanly when null.
- [frontend/src/components/dashboard/check-in-section.tsx](../../frontend/src/components/dashboard/check-in-section.tsx) — invite block replaced with `<PaperNote tilt="left" tape="left">`. Existing modal-wiring + overwrite-confirm logic preserved. Streak count + status passed in from `dashboard/page.tsx` server-side. UX must-fix landed: `Sales:` → `Kita:`, `Cancel` → `tCommon('cancel')` (consumes `common.cancel`), all summary labels via i18n.
- [frontend/src/components/dashboard/kuwento-card.tsx](../../frontend/src/components/dashboard/kuwento-card.tsx) — NEW. Client component fetches `/api/weekly-story` on mount (`useEffect` + `fetch`). Renders `<IconPera>` + serif label + Fraunces H1 narrative + 3-col KPI grid + `<BanigBarChart>` + `<PaperNote tone="honey" tilt="right" tape="right">` takeaway + footer link to `/expenses`. Empty-state when `available: false` shows the `message_tl` + "Mag-scan ka ng resibo →" CTA.
- [frontend/src/components/ui/banig-bar-chart.tsx](../../frontend/src/components/ui/banig-bar-chart.tsx) — NEW. Recharts custom `<Bar shape>` with banig stripe `<pattern>`, sampaguita peak marker, motion-reduce-aware. 7 bars Mon..Sun, height 140px, full-width responsive container.
- [frontend/src/components/dashboard/floating-petals-layer.tsx](../../frontend/src/components/dashboard/floating-petals-layer.tsx) — NEW. Q2 deferral: 5 `<IconSampaguita>` static decorations on first visit (`localStorage.akbai_home_visit_count < 2`); animated `<FloatingPetals>` from visit ≥ 2; reduced-motion always shows static.
- [frontend/src/app/(app)/dashboard/page.tsx](../../frontend/src/app/(app)/dashboard/page.tsx) — full Phase 7 composition. Server-side: streak query, today's check-in fetch, BIR registered + business name + transaction count + costing card count + invoice counts (carried over from legacy for `summary` props on the 5 tiles). Resolves `aiTagline` + `aiTone` server-side with graceful fallback (the column-not-found path uses `pickFallback` until migration 013 lands). Fixed 5-tile Hicks-law order (Scan resibo / Kausap si Kai / BIR paalala / Tamang presyo / Mga invoice) — no feature-flag gates on the home grid (the flags continue to gate the routes themselves). Outer container: `max-w-[760px] mx-auto px-5 py-6 pb-24 flex flex-col gap-[18px]` per spec §2.
- **Removed from the home composition** (NOT deleted from disk): the legacy `<KaiGreeting>` + `<MorningBriefingCard>` imports. The components remain on disk per the brief; if they're truly orphaned, Phase 8 can remove them after confirming no other consumers.

**i18n catalogs ([fil.json](../../frontend/messages/fil.json) + [en.json](../../frontend/messages/en.json)):**
- `home.actions.{scanResibo,kausapKai,birPaalala,tamangPresyo,mgaInvoice}` restructured from `string` → `{ title, description }` to fix a UX must-fix (5 tile descriptions were inline English, including `'Tax calendar at reminders'` — now `'Calendar ng mga tax deadline mo'` in FIL).
- `home.checkin.summary.{mood,kita,gastos}` keys added so the post-check-in summary card consumes labels from i18n (was `Mood:` / `Sales:` / `Gastos:` inline; symmetric Filipino now).
- `common.cancel` confirmed present in both FIL (`I-cancel`) and EN (`Cancel`); `check-in-section.tsx` overwrite-confirm dialog now consumes it.

**New tests (vitest + Playwright):**
- 4 vitest suites: `compute-streak` (9 tests), `weekly-story/{week-bounds,aggregate,takeaway-templates}` (24 tests across 3 files), morning-briefing `{tone,fallback-templates}` (33 tests across 2 files), morning-briefing route extension (5 new tests for the credit-balance fallback path), weekly-story route (5 tests covering SKIP_AUTH happy path, no_data shape, aggregator-throw error shape, undefined userName, top-level catch).
- [frontend/e2e/synthesis/home.spec.ts](../../frontend/e2e/synthesis/home.spec.ts) — Playwright **visual-parity test** (the home gate test deferred from Phase 4). Captures `/dashboard` at mobile (390×844) + desktop (1280×800) × FIL + EN = 4 baselines, threshold `maxDiffPixelRatio: 0.005`. Plus 4 supplementary tests: petals deferral first-visit (static only) and day-2+ (animated), reduced-motion path, locale-flip end-to-end on home (the first end-to-end home-locale proof).

**ADR landed:**
- [ADR-015](../../akbai-delivery/skills/solutions-architect/references/architecture-decisions.md) — `/api/weekly-story` endpoint shape. Documents the contract Phase 7 ships and the Phase 10 swap (cache table + cron + LLM takeaway). The route signature is stable across phases.
- ADR-014 was authored in the prior Phase 6 session but the index in `architecture-decisions.md` was missing; this session rebuilt the index to include both ADR-014 and ADR-015 and bumped the "current highest" header.

### Verification (after the hot-fix pass)

- `npx tsc --noEmit`: **38 errors** (baseline preserved exactly — all pre-existing in `src/app/api/**/__tests__/route.test.ts` + `src/lib/costing/__tests__/calculations.test.ts`). Zero new Phase 7 errors.
- `npx vitest run`: **89 files / 1265 tests passing** (was 1188 at session start; +77 new tests across the 8 new vitest suites and the route-extension tests).
- `npx next build`: **Compiled successfully** in 5.1s. **46 routes** (was 45; +1 new `/api/weekly-story`). No warnings (the two pre-existing `@sentry/nextjs` deprecation warnings are unchanged Phase 4 inheritance, not Phase 7 regressions).
- `curl -i http://localhost:3000/dashboard`: **HTTP 200**. The page HTML contains `Kumustahan`, `Magandang [umaga|hapon|gabi]`, `kumusta`, confirming the Phase 7 layout renders. (The QA agent first ran into HTTP 500 because of the `'use client'` import-from-server bug — the hot-fix pass moved `computeTimeOfDay` to `lib/timezone/time-of-day.ts` and the page now renders.)
- Locale flip on home: confirmed wired (the chrome `<LanguageToggle>` from Phase 5 sets the cookie; `dashboard/page.tsx` resolves all visible strings via `useTranslations('home')` and `useTranslations('common')`). End-to-end Playwright test exercises the flip on `/dashboard`. **This is the first end-to-end home locale proof per the multi-session plan.**

### What this session intentionally punted (so Session 4 / Phase 8/9 sees them)

These are NOT bugs — they are decisions made in-session, listed so they don't get lost:

- **Migration 013 (`013_morning_briefing_tone.sql`)** — adds `briefing_tagline TEXT NULL` + `briefing_tone TEXT NULL` to `daily_check_in` so the morning-briefing route can persist tagline/tone alongside the existing `briefing_content`. Phase 7 ships WITHOUT this migration: the route serves tagline + tone live in the response without persistence (and `dashboard/page.tsx` falls back to `pickFallback()` when the column-not-found error fires). Once migration 013 lands, both the route's cache-write and the page's cache-read need to consume the new columns. **This work belongs to data-architect in a Phase 8 prep step.**
- **Tile tint pair duplication** — `resibo` + `precio` both use `bg-honey-pale`; `usap` + `invoice` both use `bg-sage-pale`. UX flagged this as a post-feel-test nice-to-have. The 24h feel-test will tell us whether the visual monotony reads on a real phone; if so, introduce a third tint for `kalendaryo` from the existing scales (no new tokens).
- **Kuwento takeaway duplication** — `story.takeaway` renders as both the serif H1 headline and the body inside the `<PaperNote>`. Lead engineer + UX both flagged. If the feel-test confirms it reads as repetitive, Phase 8/9 should split: headline becomes a shorter Kai-voice prompt while the paper-note carries the full takeaway. Coordinate with whoever extends `WeeklyStory` shape.
- **`md:` → `tablet:` band on internal pages** — `expenses/page.tsx`, `costing/page.tsx`, `invoices/page.tsx` still use `md:hidden` for FAB visibility. Outside Phase 7's scope; address opportunistically in Phase 8 (`expenses` will be touched there) and Phase 10 (`costing` + `invoices`).
- **Reduced-motion belt-and-suspenders on `KaiSitting`** — UX flagged that `animate-kai-breathe` should also have `motion-reduce:animate-none` on the `<KaiSitting>` span as defense in depth. The keyframe is correctly wrapped in `@media (prefers-reduced-motion: no-preference)` at the CSS level, so this is genuinely belt-and-suspenders, not a defect. Apply during Phase 8 polish.
- **Minor security defense-in-depth (post feel-test)** — `lib/claude/assemble.ts` USER_CONTEXT layer interpolates `firstName` and `businessType` directly into the system prompt without sanitisation. Threat is theoretical (Claude system prompt is not normally injectable from system text), but the rule is defense in depth. Apply `filterOutput`-equivalent sanitisation in Phase 11 polish. Also: add a runtime guard in `morning-briefing/route.ts` `buildOutputFormatHint` confirming `tone in toneGuidance` before template-literal interpolation.

---

## Frontend Redesign — Phase 8 + Phase 9 starting state (handoff for next session)

**Date:** 2026-04-26 (handoff written at end of Phase 7 session for cross-session continuity)
**Session boundary:** Phase 7 shipped, merged to `main` at end of Session 3. The branch `claude/redesign-phase-3-4` was deleted (local + remote) after the merge; `main` carries the cumulative redesign work since Session 1. **Anton deferred the 24h feel-test from a session-blocking gate to a Session-4-start gate** (2026-04-26): main may receive Phase 7 immediately so the work is durable + reviewable, but **no Phase 8 code work begins until Anton has spent 24h with the home on a real phone and the feel-test report block below is filled in.** Session 4 covers Phase 8 (Kausap + Saan = Chat + Expenses) and Phase 9 (Scan + Deadlines), per the plan, with the feel-test as its very first action.

### Anton's 24h feel-test report (capture HERE when Anton reports back)

> _Placeholder — fill in this block at the start of Session 4 with everything Anton surfaces after 24h of real-phone use. Suggested capture areas:_
>
> - **Visual parity:** does the home read as the spec promised? Cream bg + honey accents + Kai mark scale + Squiggle alignment + Banig bar chart legibility + paper-note tilt feeling.
> - **Kai mark soft-glow rim observation at hero 168px:** is the chroma-keyed cream rim noticeable? Does Anton want to re-export before Session 4 starts? (Memory `project_kai_mark_master_reexport.md` is the tracker.)
> - **Tile tint pair duplication:** with two pairs sharing the same bg, does the 5-tile grid feel monotone or balanced? If monotone, propose third tint.
> - **Kuwento takeaway duplication:** reading both the H1 headline and the paper-note body — does it feel redundant?
> - **Streak framing:** "Pang-{n} araw na natin" — does this land or feel forced? D4 verdict was a strong "yes" but the feel-test is the proof.
> - **Locale flip on home:** does FIL/EN swap feel snappy? Any string truncation or layout shift on the EN side?
> - **Morning-briefing graceful fallback:** the Kumustahan tagline is currently the deterministic per-day fallback (credits not topped up). Does it still feel like Kai or does the fallback read as templated?
> - **5-tile action grid order (Hicks's law):** Scan resibo first — does muscle memory reach for it where you expect?
> - **Reduced-motion path:** if Anton flips OS-level reduced-motion, does the home still feel right (no broken layout, just no animations)?
> - **PaperNote check-in invite tilt:** the asymmetric corners + 1.2deg tilt — magic, or fussy?
> - **First-visit petals deferral (Q2):** static sampaguita on day 0 read as warmth or as "missing decoration"? (Day 2+ is when animated petals come in.)
> - **Anything else.** Anton's literal notes belong here, verbatim.

### What's on disk and committed (cumulative from Session 1 → Session 3)

- **Phase 1 + 1.5** research, **Phase 2** synthesis (all sections SIGNED OFF, repos APPROVED, 13 questions RESOLVED), **Phase 3** foundations (Tailwind tablet:860px + Fraunces + honey/sage/ink scales + 13 keyframes + palette context + i18n + primitives), **Phase 4** brand vocabulary (15 brand icons + 8 motifs + Kai composition + 512×512 Kai mark) — see prior handoff entries.
- **Phase 5** chrome — re-skinned `sidebar-nav.tsx` + `bottom-nav.tsx` in place, `(app)/layout.tsx` async with persona fetch + `tablet:` breakpoint, `language-toggle.tsx` + `more-drawer.tsx` shipped, i18n catalogs hold all chrome keys.
- **Phase 6** auth + onboarding — login redesign with KaiSitting hero, `OnboardingShell` + `SampaguitaProgress` + Kai expression mapping per step, paper-note welcome tour with `user_metadata.welcome_tour_completed` cross-device persistence.
- **Phase 7** flagship home — full canonical layout per `screens/00-home.md`, including the new `/api/weekly-story` stub (ADR-015), the `/api/morning-briefing` D6 tonal extension with graceful Claude fallback, all UX must-fixes, all major security findings resolved, and the Playwright visual-parity home-gate test built.

### What's NOT wired yet (Phase 8 + 9 scope per the multi-session plan)

**Phase 8 — Kausap + Saan:**
- `/chat` (Kausap si Kai) — A2 verdict: HYBRIDIZE. Adopt handoff layout (top bar with Kai 32px avatar + "● Nandito ako para sa'yo" status, suggested-question chips above composer, paper-note CTA composer, restyled disclaimer banner). KEEP CURRENT branded "Chat with Kai" framing/header + the existing in-bubble Kai illustration treatment. Q4 resolution: chips data source is rule-based DB queries via `/api/chat/suggestions` (no LLM), cached 30 min.
- `/expenses` (Saan napunta) — A3 verdict: ADOPT HANDOFF. Total card + donut + delta line, category breakdown rows with color-coded progress bars (Q5 — add `color` field to `EXPENSE_CATEGORIES` registry), banig-textured 7-day daily bars (reuse `<BanigBarChart>` from Phase 7), Kai callout paper-note. Keep current's month picker logic.
- Both pages should adopt the `tablet:` breakpoint band (Phase 7 punted this — `md:hidden` → `tablet:hidden` for FAB visibility).

**Phase 9 — Scan + Deadlines:**
- `/scan` — A4 verdict: KEEP CURRENT. Camera UI, viewfinder, capture flow, post-scan card slide-in stay as-is. The dark-bleed handoff scan UI is rejected. Phase 9 is essentially a "polish pass" on the existing scan — confirm the chrome inheritance + persona pill from Phase 5 reads correctly above the camera viewfinder; otherwise no large-scale changes.
- `/deadlines` (BIR paalala) — A5 verdict: ADOPT HANDOFF. Serif H1 "Hindi ka mahuhuli kay Kai." + Kai pre-deadline `<PaperNote>` callout for urgent items (≤ 7 days). Each row: 56×56 date chip (English month abbreviations per Q6) + form-code pill (1701Q) + days-left counter + form name + description. Next-due card highlighted with 2px honey-deep border. BIR disclaimer banner restyled. Q7 resolution: tap on a deadline navigates to `/chat?topic={form_code}&context=deadline-{N}d` with system-prompt context injection.

### Open follow-ups Phase 8/9 inherits from Phase 7

- **Migration 013** (briefing_tagline + briefing_tone columns) — pre-Phase-8 prep work for data-architect.
- **Anthropic credits top-up** — by the time Session 4 starts, Anton may have topped up; if so, the morning-briefing extension switches from deterministic fallback to LLM tagline. The hero degrades cleanly either way.
- **Kai mark soft-glow rim** — if Anton re-exports during the 24h gate, swap `frontend/public/icons/kai-mark.png` before Phase 8 begins. Tracked in memory `project_kai_mark_master_reexport.md`.
- **Tile tint pair duplication** — gate on the feel-test verdict.
- **Kuwento takeaway duplication** — gate on the feel-test verdict; Phase 8 may extend the `WeeklyStory` shape with a separate `kai_note` field.
- **Reduced-motion belt-and-suspenders** on `KaiSitting` — apply during Phase 8 polish.
- **Visual-parity baselines** — the Phase 7 home gate test recorded its first baseline this session under `frontend/e2e/synthesis/__snapshots__/home/`. Phase 8 + 9 add similar specs for `/chat`, `/expenses`, `/deadlines` (the Phase 4 retro test deferred to "the home gate" was specifically the home — sibling pages get their own specs).

### Verification baseline (Session 4 re-runs to confirm clean start)

- `npx tsc --noEmit`: **38 errors expected.** All pre-existing. Anything > 38 is regression.
- `npx vitest run`: **89 files / 1265 tests expected.**
- `npx next build`: **46 routes expected**, "Compiled successfully", no warnings.
- `git status` from branch tip: clean working tree (Phase 7 already committed).
- `curl -i http://localhost:3000/dashboard`: **HTTP 200** with `Kumustahan` / `kumusta` / `Magandang` strings present in HTML.

### First actions for Session 4 (Phase 8 + 9 = Kausap + Saan + Scan + Deadlines)

0. **Feel-test gate fires here.** Before any Phase 8 code work, capture Anton's 24h feel-test notes into the report block above (he may have already done a fresh real-phone walkthrough by the time Session 4 opens, or you may need to ask him to spend 24h with `main` on a real phone first). Do not start step 2 onward until that block is filled in.
1. **Read the feel-test report block above** (filled in by Anton). Anything Anton flagged as broken supersedes the punted-decision lists.
2. **Read** [`screens/01-chat.md`](../../design_handoff_akbai_redesign/synthesis/screens/01-chat.md), [`02-expenses.md`](../../design_handoff_akbai_redesign/synthesis/screens/02-expenses.md), [`03-scan.md`](../../design_handoff_akbai_redesign/synthesis/screens/03-scan.md), [`04-deadlines.md`](../../design_handoff_akbai_redesign/synthesis/screens/04-deadlines.md) for the canonical Phase 8/9 specs.
3. **Verify clean baseline** — run the three commands above. If anything is off, stop and reconcile before adding code.
4. **Spawn `/build` Phase 8 team first** (chat + expenses are the two M-features). Suggested team: team-lead PM + build-architect (only if `/api/chat/suggestions` lands here per Q4) + build-engineer (lead) + build-ux (mandatory — chat + expenses both have heavy paper-note + chart density) + build-qa (Playwright visual-parity for chat + expenses) + build-data (Q5 — add `color` field to `EXPENSE_CATEGORIES`). Skip build-ai unless the chat suggestions extend the prompt assembler. Skip build-marketing (strings already in i18n). Skip review-security unless `/api/chat/suggestions` opens a new auth surface (it shouldn't — same RLS as `/api/chat`).
5. **Then Phase 9 in the same session** — Scan is "polish only", Deadlines is the larger work. Suggested team: team-lead PM + build-engineer + build-ux + build-qa. Add build-ai if the deadline-callout taps want to inject system-prompt context cleanly.
6. **Commit at end of session** — same branch `claude/redesign-phase-3-4` (or fork to `claude/redesign-phase-8-9` per Anton's call). Multi-session plan says Session 4 ends with handoff to Session 5 (Phase 10 alone — Costing/Invoices/Drafts/Check-in/Kuwento + cron).

---

### Sprint 13 — 2026-05-24 onward (Frontend Redesign Phase 8-9 Close-out)

**Phase:** 0A — Frontend Redesign Initiative close-out
**Sprint Goal:** Complete the in-flight Frontend Redesign Phase 8 (Kausap chat + Saan expenses) and Phase 9 (Scan + Deadlines) work on the `claude/redesign-phase-8-9` branch. Merge to main. Capture Anton's 24h feel-test notes deferred from Phase 7. **Sprint 13 does NOT touch the native mobile pivot** — that work begins Sprint 14 cleanly, on a fresh branch, without context-switching cost.
**Capacity:** ~12-15 hrs Anton Time

**Strategic context:** Anton confirmed sequencing decision 2026-05-24 — Phase 8-9 redesign work completes first as a discrete sprint, then the native mobile pivot starts in Sprint 14. Rationale: don't context-switch between two major initiatives; let the redesign land cleanly so Sprint 14's Capacitor spike works against a stable codebase.

**Tasks (in flight on `claude/redesign-phase-8-9`):**

| # | Task | Size | Anton Time | Status | Notes |
|---|------|------|------------|--------|-------|
| 1 | Phase 7 feel-test capture (deferred from Session 3) | S | XS (24h real-phone use + 0.5hr write-up) | PENDING | Capture into the placeholder block at line ~1248 of this file |
| 2 | Phase 8 — `/chat` (Kausap si Kai) HYBRIDIZE | M | S (1hr review) | DONE 2026-05-24 | A2 verdict — adopt handoff top-bar + status + chips + paper-note composer; keep current branded framing. Audit: top bar with 32px Kai avatar + Fraunces "Kai" + sage status dot + "Nandito ako para sa'yo" caption shipped; "Chat with Kai" preserved as `<h1 sr-only>`; SuggestedChips row (4 cold-start canon chips, hides on composer focus, `min-h-[44px]`) wired to `/api/chat/suggestions`; composer wrapped in paper-note `surface-container-lowest` + `shadow-ambient`; `motion-reduce:animate-none` on status dot. 76/76 chat vitest tests green; `e2e/synthesis/chat.spec.ts` locks FIL+EN visual parity + reduced-motion + locale flip. **Punt:** offline composer queue (spec §7) NOT implemented — current shows error bubble on fetch fail, no local queue. Worth a Sprint 14 Feature Continuation slot if push priority. |
| 3 | Phase 8 — `/expenses` (Saan napunta) ADOPT HANDOFF | M | S (1hr review) | DONE 2026-05-24 | A3 verdict — total card + donut + delta + breakdown rows + Banig 7-day bars. Audit: IconPera + "SAAN NAPUNTA" eyebrow + Fraunces H1 shipped; ExpensesDonut + Fraunces ₱ amount + sage/honey-deep delta line working; CategoryBreakdownRow (up to 5) with 6px progress bars; PaperNote + 32px Kai (concerned/happy by income-vs-expense ratio) + Fraunces italic 14px insight; BanigBarChart with peakKitaIndex marker; "Wala ka pang naka-log" empty state with scanner CTA; reduced-motion safe. 22/22 expenses vitest green; `e2e/synthesis/expenses.spec.ts` locks FIL+EN parity + reduced-motion + locale flip. **Known gap (flagged in code, lines 62-69):** `/api/expenses` only accepts `?month=YYYY-MM` — Linggo + Taon pills render but are disabled with `cursor-not-allowed opacity-60` until backend supports `?range=linggo|taon`. Buwan pill works correctly. Belongs in Sprint 14 Feature Continuation Track. |
| 4 | Phase 8 — `/api/chat/suggestions` rule-based chips (ADR-016) | S | XS (0.25hr review) | DONE 2026-05-24 | Per ADR-016 §3 (R1..R4 rule engine), §4 (30-min in-process Map cache), §6 (never 500 — always cold-start fallback). Route + lib/chat/suggestions/{types, cache, rules, index} shipped; 8/8 route + cache + rules vitest green; SuggestedChips wired and exercised in `e2e/synthesis/chat.spec.ts`. |
| 5 | Phase 9 — `/scan` polish pass | S | XS (0.25hr review) | DONE 2026-05-24 | A4 verdict — KEEP CURRENT. Audit confirmed all permitted changes already shipped: `bg-primary-container` token used throughout, `body[data-scanning="true"]` bottom-nav suppression in place, voice §4 OCR copy exact, voice §5 permission-denied copy in place. 34/34 scanner vitest tests green; `e2e/scanner-tokens.spec.ts` locks both invariants. |
| 6 | Phase 9 — `/deadlines` (BIR paalala) ADOPT HANDOFF | M | S (1hr review) | DONE 2026-05-24 | A5 verdict — serif H1 + Kai pre-deadline callout + 56×56 date chips + form-code pills + deeplink to chat (ADR-017). Audit: IconKalendaryo + "BIR DEADLINES" eyebrow + Fraunces H1 "Hindi ka mahuhuli kay Kai." + caption shipped; voice §3 BIR disclaimer exact wording; DeadlinePreCallout (`concerned` Kai, "po" register) appears when any deadline ≤ 7 days, taps through to `/chat?topic={code}&context=deadline-{N}d` with form-code allowlist guard + clamped N; DeadlineRow with 56×56 date chip, form-code pill, "Huling N araw" / "Lipas na ng N araw" / "Na-file na" copy, next-due row gets `ring-2 ring-honey-deep`; FIL month abbr (Ene/Peb/Mar/.../Dis) hardcoded for locale stability — answers spec §6 Q1; ADR-017 deeplink with PostHog tracking — answers spec §6 Q2; reduced-motion-safe loading skeletons. 33/33 deadlines vitest green; `e2e/synthesis/deadlines.spec.ts` for visual parity. |
| 7 | Tablet breakpoint migration (`md:` → `tablet:`) on /expenses, /costing, /invoices | S | XS (0.1hr review) | DONE 2026-05-24 | All 3 surfaces migrated. /expenses migrated earlier (`tablet:hidden` / `hidden tablet:flex` on FAB + inline add button). Same-day Stream B agent completed /costing + /invoices: 30 `md:` → `tablet:` swaps across 5 files (costing/page.tsx ×11, costing/[id]/page.tsx ×1, invoices/page.tsx ×11, invoices/new/page.tsx ×3, invoices/[id]/page.tsx ×4). All Tailwind utility prefixes only — no comments/ARIA/text content touched. No layouts load-bearing on the 768-860 band. 1290/1290 vitest still green; 0 type errors in edited files. |
| 8 | Migration 013 (`briefing_tagline` + `briefing_tone` columns on `daily_check_in`) | S | XS (0.1hr review) | DONE 2026-05-24 | Renumbered to `019_morning_briefing_tone.sql` (sequence had advanced past 013 during Phase 7). Adds `briefing_tagline TEXT NULL` + `briefing_tone TEXT NULL CHECK (...)` to daily_check_in. RLS inherited from migration 006; soft-delete inherited via `deleted_at`. Rollback script in comment block. Closes Phase 7 D6 cache gap so /api/morning-briefing no longer re-runs Claude per day on cache hit. |
| 9 | Reduced-motion belt-and-suspenders on KaiSitting + Phase 11 security defense-in-depth | XS | XS (0.1hr review) | DONE 2026-05-24 | KaiSitting now emits `animate-kai-breathe motion-reduce:animate-none` only when `animated` prop is true — belt-and-suspenders against forgetting the motion guard. Phase 11 security audit deferred separately to /review-security in Sprint 14 (no new auth surfaces opened in Sprint 13). |
| 10 | Merge `claude/redesign-phase-8-9` → main | S | S (0.5hr review + PR) | PLANNED | End-of-sprint integration |
| 11 | Sprint 13 retro + update sprint-history.md with outcomes | XS | S (0.5hr) | PLANNED | Append retro after merge |

**Total Anton Time:** ~12-15 hrs / 15 hrs capacity (feel-test 24h is wall-clock not session time)

**Parallel Streams (already in flight on branch):**
- **Stream A** (build-engineer + build-ux): Tasks 2-3 (Phase 8 Chat + Expenses)
- **Stream B** (build-engineer + build-ux): Tasks 5-6 (Phase 9 Scan + Deadlines)
- **Stream C** (build-data): Task 8 (migration 013)
- **Stream D** (build-qa): Playwright visual-parity tests for chat, expenses, deadlines

**Branch hygiene:** Sprint 13 work stays on `claude/redesign-phase-8-9`. Sprint 14 native pivot starts on a NEW branch (`feat/capacitor-spike` for the spike, then production branches per parallel session) off main after Sprint 13 merges. No interleaving.

**Decision Gate (end of sprint):**
- ✅ All Phase 8-9 work merged to main, 24h feel-test report captured, all tests green → Sprint 14 native pivot opens cleanly
- ⚠️ Some Phase 8-9 work slips → defer to Sprint 14 Feature Continuation Track, but start native pivot in parallel anyway

**Actual Anton hours:** ~4 hr (session-day audit + test runs; agent work delivered async pre-session)
**Sprint outcome:** SUBSTANTIALLY COMPLETE (2026-05-24) — Tasks 2, 3, 4, 5, 6, 8, 9 DONE; Task 7 PARTIAL; Tasks 1, 10, 11 in-flight or Anton-blocked.

#### Sprint 13 Retro — 2026-05-24

**What shipped (this session):**
- Audited all four Phase 8-9 surfaces (`/scan`, `/chat`, `/expenses`, `/deadlines`) against handoff specs and confirmed substantive completion of A2/A3/A4/A5 verdicts
- Full vitest run green: **1290/1290 tests across 92 files** (2.3× the 559-test baseline cited in CLAUDE.md and AKBAI_MASTER_BRIEF — those counts are stale, refresh them)
- Visual-parity Playwright suites authored for all three M-sized surfaces (chat, expenses, deadlines) at `frontend/e2e/synthesis/`; `scanner-tokens.spec.ts` covers /scan token + bottom-nav invariants
- Sign-off review on Tier Structure (project-context.md §4) and Pre-Launch Feature Readiness Gate (pivot plan §11) — 1 contradiction + 3 confirm-Qs surfaced for tier matrix; 10 missing items surfaced for Pre-Launch Gate (3 P0 Apple/Google rejection-risk, 4 P1 user-impact, 3 P2 polish)

**What's gated:**
- Task 1 (24h feel-test capture) — gated on Anton's real-phone use, not session-executable
- Task 7 (tablet breakpoint migration) — /expenses done, /costing + /invoices still on `md:`. Defer to Sprint 14 Feature Continuation
- Task 10 (merge to main) — ready for PR once Anton runs the live-testing pass (mandatory per multi-agent execution rule)
- Tier matrix decisions + Pre-Launch Gate additions — awaiting Anton sign-off

**What surprised us:**
- All four Phase 8-9 surfaces were already substantively built when the session opened. The "/standup" entry point + Sprint 13 task list framed this as in-flight execution work, but the actual remaining work was AUDIT + TEST + DOCUMENT, not implementation. This is a healthy sign — async agent work between sessions is producing shippable code.
- Migration numbering had advanced from 013 (sprint plan) to 019 (actual) because Phase 7 work landed additional migrations (015-018) in the interim. Worth a memory: sprint plans should reference migration *content* not *number* when written in advance.
- Chat composer offline queue (spec §7 acceptance) is the lone shipped-surface punt — current shows error bubble on fetch fail, no local queue. Single most user-visible gap remaining on /chat hybridize.

**Known gaps (carry into Sprint 14):**
1. `/api/expenses` `?range=linggo|taon` extension — unlocks the two disabled time-range pills on /expenses (already implemented as UI placeholders with `cursor-not-allowed`)
2. `/chat` offline composer queue with stale-while-revalidate (spec §7)
3. Tablet breakpoint migration completion on /costing + /invoices
4. Phase 11 security defense-in-depth review (no new auth surfaces in S13, but defer-flagged for /review-security)
5. Tier matrix contradiction fix — "AI Features" column on Starter says "❌ None" but row lists "receipt OCR (Haiku)" which IS an AI feature. Rename column to "Conversational AI" or restructure.
6. Pre-Launch Gate missing items (10 flagged in audit) — most critical: reviewer demo bypass for Apple/Google submission, native push stack validation (APNs+FCM via Capacitor Push), Sentry symbolication for native crashes

**Post-Sprint Update Checklist (CLAUDE.md governance):**
- [x] New convention: sprint plans reference migration *content* not *number* (added as project memory)
- [x] gap-registry.md: no gap status changes this sprint — Phase 8-9 surfaces are not gap-tracked items
- [x] project-context.md §What's Built: needs refresh — add Phase 8-9 redesigned surfaces; bump test count from 559 → 1290; tier matrix already updated 2026-05-24
- [ ] supabase-schema.md: needs update for migration 019 (`briefing_tagline` + `briefing_tone` on `daily_check_in`)
- [ ] test-strategy.md: visual-parity Playwright pattern (`maxDiffPixelRatio: 0.005` + mock route + locale cookie + reduced-motion variant) is a reusable test pattern — worth documenting
- [ ] deployment-guide.md: no env var changes this sprint
- [ ] prompt-library.md: no AI prompt changes this sprint (chat suggestions are rule-based, not LLM)
- [ ] conversational-filipino-copy-guide.md: pre-deadline callout copy patterns ("po" register on BIR forms, day-count fork on "Lipas na" / "Huling X araw" / "Due ngayong araw") worth adding
- [ ] architecture-decisions.md: ADR-016 (chip rules) and ADR-017 (deadline→chat deeplink) are already in place; sprint did not author new ADRs
- [ ] PM workflow: standup vs sprint command — when /standup is invoked but the actual ask is sprint execution, surface the mismatch and let Anton choose path (this session: B was chosen). Worth codifying.

**Carry-over follow-up (post-retro, pre-merge — same session, parallel agent streams on `claude/redesign-phase-8-9`):**
- **Stream A — `/api/expenses?range=linggo|buwan|taon` extension + page unlock** (DONE 2026-05-24): New `frontend/src/lib/expenses/range.ts` (timezone-safe `resolveRange` with UTC-anchored calendar math), Zod `ExpensesRangeEnum` added to query schema. `?range=` wins over `?month=` (warn-log on conflict). 17 new vitest tests (10 range resolver + 7 route — including taon Jan 1 / Dec 31 boundary). KNOWN-GAP comment removed from expenses/page.tsx; pills `Linggo` + `Buong Taon` unlocked, `cursor-not-allowed opacity-60` styling removed. Range-specific 400 error returns `message_tl: "Hindi tama ang saklaw ng panahon."` Total vitest now 1307/1307 green.
- **Stream B — Tablet breakpoint migration on `/costing` + `/invoices`** (DONE 2026-05-24): 30 `md:` → `tablet:` swaps across 5 files (costing/page.tsx ×11, costing/[id]/page.tsx ×1, invoices/page.tsx ×11, invoices/new/page.tsx ×3, invoices/[id]/page.tsx ×4). Only Tailwind utility prefixes touched — no comments/ARIA/text content. No layouts load-bearing on the 768-860 band. Completes Sprint 13 task 7 — now DONE rather than PARTIAL.
- **Stream C — `/chat` offline composer queue + Kai voice copy** (DONE 2026-05-24): Closes `/chat` spec §7 acceptance signal punted in Sprint 13. New `frontend/src/lib/chat/types.ts` (shared `ChatMessage` with optional `queued?: boolean`, re-exported from chat-interface.tsx and page.tsx for back-compat) + `frontend/src/lib/chat/offline-queue.ts` (localStorage-backed FIFO, 50-msg cap with oldest-eviction, SSR-safe via `typeof window` guards, corrupted-JSON recovery clears the key and returns empty, IDs via `crypto.randomUUID()` with `Date.now() + Math.random()` fallback). Updated chat-interface.tsx `handleSend` to branch on `navigator.onLine === false` (enqueue + append user bubble with `queued: true` + Kai bubble "Na-save ko muna — i-send ko pag may connection."); `useEffect` listens for `'online'` event + drains queue immediately on mount if already online with queued messages. Drain replays sends in order, clears queue, appends "Naipadala na ang mga mensahe mo, salamat sa pasensya." On partial failure: stops drain, leaves remainder queued, appends "May ilang mensahe na hindi pa naipadala. I-try ulit mamaya?" Voice rule #5 caught during validation: `messages` → `mensahe` (English retained only for technical/BIR/brand/numbers; `mensahe` is the native Filipino noun); `i-send` is fine (Filipinized verb under `i-/mag-/na-` affix rule). Queued-bubble indicator: 12px lucide `Clock` icon in chat-bubble.tsx metadata row at `text-ink-faint` with tooltip "Naka-queue — i-send pag may connection" — no badge background, no layout shift for non-queued bubbles. 22 new vitest tests (16 offline-queue + 6 behavior).

**Final integration verification (post-merge, all 3 streams):** Full vitest run **1329/1329 passing across 95 files** (5.45s). Sequential test counts: 1290 baseline → +17 Stream A → +22 Stream C = 1329. Stream B contributed 0 tests (pure Tailwind class swap, behavioral neutral).

**Doc sweep (same session, post-retro):**
- `project-context.md` — Current Phase block + What's Built §Phase 8-9 entry refreshed. Test count baseline bumped 559 → 1290 (now 1307 after Stream A). Tier matrix table updated with column rename + trial 5/day cap + Starter 100/mo OCR.
- `lets-review-our-approach-tidy-harp.md` §11 Pre-Launch Gate — 10 new items inserted across Tier-defining (3), Payment+entitlements (1), Brand+UX (1), Technical health (2), Distribution readiness (3) with `(Added 2026-05-24)` markers.
- `qa-engineer/references/test-strategy.md` — new "Visual-Parity Gate Pattern" section under §2 Layer 3 codifying the Sprint 13 Playwright pattern (mocking discipline, FIL+EN+reduced-motion+locale-flip variants, `maxDiffPixelRatio: 0.005` rationale, snapshot review discipline, counter-pattern guard).
- `ux-designer/references/conversational-filipino-copy-guide.md` — Example 3 BIR Deadline Reminder extended with day-count fork table (Lipas na / Due ngayong araw / Bukas / 2-7 days / >7 days) for both Kai callout copy (with "po" register) and days-left counter labels (without "po"). Filipino month abbreviations (Ene/Peb/.../Dis) documented for hardcoded use.
- `data-architect/references/supabase-schema.md` — Migration 019 already present (`briefing_tagline` + `briefing_tone` on `daily_check_in`); no edit needed.

**Memory entries added:** `feedback_migration_numbering.md` (sprint plans reference migration content not ordinal), `feedback_standup_vs_sprint_mismatch.md` (when /standup is invoked but ask is sprint execution, surface mismatch).

**Next sprint:** Sprint 14 (Native Mobile Pivot Foundations) opens on a fresh branch after this branch merges to main. The 3 carry-overs originally slated as Sprint 14 Feature Continuation track work are largely shipped pre-merge — Sprint 14 capacity now goes fully to pivot foundations (Capacitor spike + Gemini Kai prompt iteration + Starter/Pro feature matrix confirmation, which is already done in docs).

---

### Sprint 14 — TBD (Native Mobile Pivot — Foundations + Spike)

**Phase:** 0A → 0B transition (Native Mobile Pivot — begins)
**Sprint Goal:** Lock the 3 pivot decisions (Capacitor, Starter+Pro pricing, Kai character evolution via Gemini) into the repo, run a throwaway Capacitor spike on a feature branch, generate first round of Kai character images via Gemini prompts, decide whether to commit to the remaining 5 pivot sprints.
**Capacity:** ~12-15 hrs Anton Time

**Strategic context:** Pre-launch native pivot decision made 2026-05-24 after Tarsi review (Bryl Lim's ₱1M-in-30-days personal-finance app). Three decisions locked: (1) pivot to native via Capacitor, (2) hybrid pricing — ₱299 lifetime Starter + ₱499/mo or ₱4,999/yr Pro subscription via IAP, (3) evolve Kai from static mark into full illustrated character **via Gemini image generation** (NOT human illustrator — saves ₱30-80k and 2-3 weeks wall-clock). Full plan: `C:\Users\Anton del Rosario\.claude\plans\lets-review-our-approach-tidy-harp.md`.

**Tasks:**

| # | Task | Size | Anton Time | Stream | Notes |
|---|------|------|------------|--------|-------|
| 1 | Lock Starter/Pro feature matrix | S | S (0.5hr) | A | Already done in Sprint 13 doc updates — confirm during Sprint 14 review |
| 2 | Iterate Gemini Kai prompt library (8 poses minimum) | M | M (3-4hr Anton iterating prompts in Gemini) | B | Use `akbai-delivery/skills/ux-designer/references/kai-gemini-prompts.md` as starting prompt set; iterate until happy |
| 3 | Capacitor 1-day spike on `feat/capacitor-spike` | M | S (1hr review) | C (worktree) | Convert /dashboard, /chat, /scanner to client-only; ship to TestFlight + Play Internal |
| 4 | Pivot ADR (ADR-018) — already added in Sprint 13 | — | — | — | Done in Sprint 13 doc sweep |
| 5 | Sprint 14 retro + decision gate | XS | S (0.5hr) | A | Did Capacitor spike feel real? Are Kai prompts producing usable assets? |

**Total Anton Time:** ~10-12 hrs (lighter than Sprint 13 — most foundation docs already updated in Sprint 13 doc sweep)

**Parallel Streams:**
- **Stream A** (team-lead PM): Decision review + ADR confirmation (~1 hr)
- **Stream B** (Anton solo with Gemini): Kai prompt iteration (~3-4 hr asynchronous)
- **Stream C** (build-engineer + build-architect, worktree isolation): Capacitor spike (~5-6 hr)

**Decision Gate (end of sprint):**
- ✅ Spike feels real + Gemini Kai prompts producing usable assets → commit to Sprints 15-19 (Conversion → Native Polish → IAP → Store Assets+Gate → Soft Launch)
- ⚠️ Spike janky but fixable → spend Sprint 15 on extended spike before deciding
- ❌ Spike fundamentally broken → abort pivot, keep building features as PWA-first

**Risk Watch:**
- Gemini character consistency across 8 poses — if prompts drift, the character won't read as the same entity. Mitigation: lock "Character DNA preamble" first, then vary only pose/scenario per generation.
- Sprint 14 capacity assumes Sprint 13 closed cleanly. If Phase 8-9 work slipped, Sprint 14 also runs a Feature Continuation Track for the spillover.

**Sprints 15-19 outline** (per plan, condensed — full detail in `C:\Users\Anton del Rosario\.claude\plans\lets-review-our-approach-tidy-harp.md` Section 5):
- **Sprint 15:** Capacitor Conversion (server components → client, both binaries build clean)
- **Sprint 16:** Native Surface Polish (Capacitor Camera, Push, Biometric, deep linking, store account enrollment)
- **Sprint 17:** IAP Integration (RevenueCat, StoreKit 2, Play Billing, sandbox testing)
- **Sprint 18:** Store Assets + Pre-Launch Feature Readiness Gate (icons, screenshots, privacy policy, gate sign-off)
- **Sprint 19:** Soft Launch + Iteration (public release + Tarsi-style founder distribution motion)

**Sprint outcome:** PLANNED (starts after Sprint 13 closes)
