# AKBai — Sprint & Retro History

> Living document. Updated automatically by `/sprint` and `/retro` commands.
> New sessions: read this file first for project velocity context.
> Last updated: 2026-03-28 (Sprint 8+9 plans)

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

**Actual Anton hours:** TBD — updated during retro
**Sprint outcome:** IN PROGRESS

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

**Actual Anton hours:** TBD — live testing in progress
**Sprint outcome:** IN PROGRESS — awaiting Anton live testing

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
| 8 | Build 5 (Morning Briefing + Recon) | 3.5 hrs (Anton) | TBD | 8 | TBD | TBD |
| 9 | Build 6 (Deadlines) + Build 7 (Reply Drafter) | 4 hrs (Anton) | TBD | 12 | TBD | TBD |

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
