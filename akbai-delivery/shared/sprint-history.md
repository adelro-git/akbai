# AKBai — Sprint & Retro History

> Living document. Updated automatically by `/sprint` and `/retro` commands.
> New sessions: read this file first for project velocity context.
> Last updated: 2026-04-26 (Frontend Redesign Phase 4 complete + Phase 5 handoff written for next session)

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

**Actual Anton hours:** TBD — updated during retro
**Sprint outcome:** IN PROGRESS

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
