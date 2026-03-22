# AKBai — Sprint & Retro History

> Living document. Updated automatically by `/sprint` and `/retro` commands.
> New sessions: read this file first for project velocity context.
> Last updated: 2026-03-22

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
**Sprint Goal:** Create the 4 KA domain knowledge files so Build 1 (Kilala Kita) can deliver the "Maria Moment."
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
| 1 | UTC+8 timezone enforcement (Gap A3) | S | 2 | PLANNED | |
| 2 | Kilala Kita onboarding schema + API | M | 3 | PLANNED | Depends: A1 auth scaffold |
| 3 | Kilala Kita onboarding UI (5-step flow) | L | 4 | PLANNED | Depends: Task 2 |
| 4 | Onboarding rate-limit exemption (Gap E3) | S | 1.5 | PLANNED | Depends: Task 2 |
| 5 | Sentry error monitoring setup (Gap A4) | S | 1.5 | PLANNED | |

**Actual hours used:** TBD — updated during retro
**Sprint outcome:** IN PROGRESS

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
Why: Build 1 frontend — user's first experience with KA. Must deliver the "Maria Moment."
- [ ] Create `/app/(features)/onboarding/` route with step-based state machine
- [ ] Build Step 1: Business type selector (16-type taxonomy from `msme-business-knowledge.md`)
- [ ] Build Step 2: Income range selector
- [ ] Build Step 3: Primary pain selector
- [ ] Build Step 4: BIR consent + data privacy acknowledgment
- [ ] Build Step 5: KA first response — personalized greeting from `kilala-kita-context.md` templates
- [ ] Wire to Task 2 API — save progress on each step, resume on return (Gap B3)
Done when: User completes all 5 steps, sees personalized KA greeting, can resume mid-flow.
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
- Domain knowledge for KA is missing — scopes have boundaries but no actual BIR/business data
- Taglish manual is 100% placeholder (all 10 sections say "Awaiting entries")
- Sprint plan wasn't saved anywhere persistent — had to reconstruct context from git history

**What We Learned:**
- Build 0 scope was right-sized for a sprint — the "ship one hard gate" pattern works
- KA has rules but no knowledge — boundary rules without domain data means Build 1 will produce an empty-feeling AI
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
- TAX_SCOPE enrichment wired domain knowledge directly into the runtime — KA now has real BIR data, not just boundaries

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

---

## Velocity & Patterns

> Updated after each retro. Helps calibrate future sprint sizing.

| Sprint | Goal | Hours Plan | Hours Actual | Tasks Plan | Tasks Done | Hit Goal? |
|--------|------|-----------|-------------|-----------|-----------|-----------|
| 1 | Ship Build 0 | 10–15 | ~14 | 5 | 5 | YES |
| 2 | KA domain knowledge files | 12 | ~11 | 6 | 6 | YES |
| 3 | Build 1 + infra gaps | 12 | TBD | 5 | TBD | TBD |

**Emerging patterns:**
- L-sized tasks (3–4 hrs) fit well in Saturday blocks
- M-sized tasks (2–3 hrs) fit well in evening blocks
- "Ship one hard gate per sprint" is a good cadence for Phase 0A
- Itemized checklists are essential for multi-session work
- Context/knowledge file sprints can be highly productive — 6/6 tasks in ~11 hrs
- Task expansion (Task 2: 4→16 types) is fine when it adds clear value and stays within capacity

---

## Unresolved Action Items

> Carried forward from retros until resolved. Check these during `/sprint` planning.

| Source | # | Action | Status |
|--------|---|--------|--------|
| Sprint 1 Retro | 1 | Create `.env.local.example` + dev setup docs | DONE — Sprint 2 Task #6 (2026-03-22) |
| Sprint 1 Retro | 2 | Create BIR knowledge base | DONE — Sprint 2 Task #1 (2026-03-21) |
| Sprint 1 Retro | 3 | Create MSME business knowledge | DONE — Sprint 2 Task #2 (2026-03-22, expanded to 16 types + benchmarks table) |
| Sprint 1 Retro | 4 | Populate Taglish manual | DONE — Sprint 2 Task #4 (2026-03-22, Anton reviewed and approved) |
