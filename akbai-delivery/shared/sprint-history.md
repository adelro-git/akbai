# AKBai — Sprint & Retro History

> Living document. Updated automatically by `/sprint` and `/retro` commands.
> New sessions: read this file first for project velocity context.
> Last updated: 2026-03-20

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
| 1 | Create `.env.local.example` + dev setup docs | Anton | Sprint 2 | PENDING | Retro action #1 |
| 2 | Create BIR knowledge base (`bir-knowledge-base.md`) | Anton + Claude | Sprint 2 | PENDING | CRITICAL — blocks Build 6, informs Build 1 |
| 3 | Create MSME business knowledge (`msme-business-knowledge.md`) | Anton + Claude | Sprint 2 | PENDING | HIGH — personalization depth |
| 4 | Populate Taglish manual (10 sections) | Anton + Claude | Sprint 2–3 | PENDING | MEDIUM — Design Gate #3 prereq |
| 5 | Create sprint-history.md living document | Anton + Claude | Sprint 2 | DONE | This file |

**Energy Check:**
- **Sustainability:** Felt good — productive sprint, clear goal, shipped something real
- **Saturday block:** Used (Build 0 integration + security hardening)
- **Evening consistency:** Strong — multiple evening sessions
- **Recommendation:** Keep pace. Sprint 2 can target same capacity (10–15 hrs)

---

## Velocity & Patterns

> Updated after each retro. Helps calibrate future sprint sizing.

| Sprint | Goal | Hours Plan | Hours Actual | Tasks Plan | Tasks Done | Hit Goal? |
|--------|------|-----------|-------------|-----------|-----------|-----------|
| 1 | Ship Build 0 | 10–15 | ~14 | 5 | 5 | YES |

**Emerging patterns:**
- L-sized tasks (3–4 hrs) fit well in Saturday blocks
- M-sized tasks (2–3 hrs) fit well in evening blocks
- "Ship one hard gate per sprint" is a good cadence for Phase 0A
- Itemized checklists are essential for multi-session work

---

## Unresolved Action Items

> Carried forward from retros until resolved. Check these during `/sprint` planning.

| Source | # | Action | Status |
|--------|---|--------|--------|
| Sprint 1 Retro | 1 | Create `.env.local.example` + dev setup docs | PENDING |
| Sprint 1 Retro | 2 | Create BIR knowledge base | PENDING |
| Sprint 1 Retro | 3 | Create MSME business knowledge | PENDING |
| Sprint 1 Retro | 4 | Populate Taglish manual | PENDING |
