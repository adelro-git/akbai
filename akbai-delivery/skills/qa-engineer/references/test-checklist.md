# AKBai — Test Checklist
> Used by: qa-engineer, fullstack-engineer, project-manager
> Last updated: March 2026 | Source: SKILL.md priorities, gap registry, all engineering skill specs
> Track: scenario count per area, pass/fail per PR, last tested date

---

## How to Use This Checklist

Each feature section lists the specific test scenarios required. The scenario counts are minimums — add more when edge cases are discovered during development. After writing or running tests, update the "Status" column and "Last Tested" date.

**Status codes:**
- `✅` — Test written, passing
- `⚠️` — Test written, currently failing (needs fix)
- `📝` — Scenario identified, test not yet written
- `🚫` — Explicitly skipped (with reason)

---

## Priority 1: BIR Deadline Calculations

**Module:** `lib/bir/`
**Test file:** `tests/unit/bir-deadlines.test.ts`
**Minimum scenarios:** 17
**Coverage target:** 95% branch

| # | Scenario | Type | Status | Last Tested |
|---|----------|------|--------|-------------|
| 1.1 | Standard quarterly filing — deadline on weekday | Unit | 📝 | — |
| 1.2 | Quarterly deadline on Saturday → rolls to Monday | Unit | 📝 | — |
| 1.3 | Quarterly deadline on Sunday → rolls to Monday | Unit | 📝 | — |
| 1.4 | Quarterly deadline on regular PH holiday → next business day | Unit | 📝 | — |
| 1.5 | Friday deadline + Monday holiday → rolls to Tuesday | Unit | 📝 | — |
| 1.6 | Annual deadline during Holy Week (multi-day holiday span) | Unit | 📝 | — |
| 1.7 | Mid-year registration (July) — Q1/Q2 deadlines excluded | Unit | 📝 | — |
| 1.8 | Mid-year registration (October) — only Q4 + annual | Unit | 📝 | — |
| 1.9 | Registration on deadline day — that deadline still applies | Unit | 📝 | — |
| 1.10 | VAT threshold crossed mid-year → VAT return added next quarter | Unit | 📝 | — |
| 1.11 | Gross receipts at exactly ₱3,000,000 → VAT triggers | Unit | 📝 | — |
| 1.12 | Gross receipts at ₱2,999,999 → VAT does NOT trigger | Unit | 📝 | — |
| 1.13 | 8% flat tax filer (Ana persona) — simplified calendar | Unit | 📝 | — |
| 1.14 | Graduated rate filer — standard deadline calendar | Unit | 📝 | — |
| 1.15 | All deadline dates output in Asia/Manila timezone | Unit | ✅ | 2026-03-22 — `timezone.test.ts` (12 tests: boundary, year-cross, SQL, format) |
| 1.16 | Dec 31 deadline + Jan 1 holiday → Jan 2 | Unit | 📝 | — |
| 1.17 | Notification sequence: 7d, 3d, 1d before each deadline | Unit | 📝 | — |

**2026 Deadline Rollover Test Fixtures (from bir-knowledge-base.md §2):**
Use these verified dates for scenarios 1.2–1.5:
- April 25 (Saturday) → **April 27 (Monday)** — 2551Q, 2550Q (Q1)
- July 25 (Saturday) → **July 27 (Monday)** — 2551Q, 2550Q (Q2)
- August 15 (Saturday) → **August 17 (Monday)** — 1701Q (Q2)
- October 25 (Sunday) → **October 26 (Monday)** — 2551Q, 2550Q (Q3)
- November 15 (Sunday) → **November 16 (Monday)** — 1701Q (Q3)

Full 2026 holiday list (Proclamation No. 1006) is in `akbai-delivery/skills/ai-engineer/references/bir-knowledge-base.md` §2.

**Cross-skill dependency:** Data architect provides `bir_deadlines` table schema. AI engineer provides deadline-related system prompt scope. Solutions architect's ADR on timezone handling must be followed.

---

## Priority 2: Xendit Payment Flows

**Module:** `lib/payments/`, Supabase Edge Function (webhook handler)
**Test files:** `tests/integration/xendit-webhooks.test.ts`
**Minimum scenarios:** 12
**Coverage target:** 90% branch

| # | Scenario | Type | Status | Last Tested |
|---|----------|------|--------|-------------|
| 2.1 | Valid payment.success → subscription active, tier granted | Integration | 📝 | — |
| 2.2 | Duplicate payment.success (same payment_id) → no double processing | Integration | 📝 | — |
| 2.3 | payment.failed → status = past_due, grace period starts | Integration | 📝 | — |
| 2.4 | payment.failed during grace → grace period NOT reset | Integration | 📝 | — |
| 2.5 | Grace period expires (3 days) → auto-downgrade to Free | Integration | 📝 | — |
| 2.6 | Payment succeeds during grace → active, grace cleared | Integration | 📝 | — |
| 2.7 | subscription.cancelled → status cancelled, downgrade scheduled | Integration | 📝 | — |
| 2.8 | Invalid webhook signature → 200 OK, NOT processed | Integration | 📝 | — |
| 2.9 | Missing payment_id → 200 OK, logged as malformed | Integration | 📝 | — |
| 2.10 | Concurrent webhook delivery (race condition) → one processes | Integration | 📝 | — |
| 2.11 | Upgrade Pro → Business mid-cycle → immediate tier change | Integration | 📝 | — |
| 2.12 | Downgrade Business → Pro → features restricted next billing | Integration | 📝 | — |

**Cross-skill dependency:** Data architect defines `subscriptions` and `webhook_events` tables + RLS policies. Solutions architect defines Edge Function vs API Route decision (webhooks → Edge Function). Fullstack engineer implements the handler code.

**Gap Registry references:** D2 (webhook idempotency — CRITICAL), C2 (subscription lapse grace period).

---

## Priority 3: Receipt OCR (Resibo Scanner)

**Module:** `lib/ocr/`, `app/api/resibo/`
**Test files:** `tests/unit/ocr-schema-validation.test.ts`, `tests/unit/receipt-dedup.test.ts`, `tests/unit/confidence-scoring.test.ts`, `tests/e2e/receipt-scan.spec.ts`
**Minimum scenarios:** 12 (unit) + 2 (e2e)
**Coverage target:** 80% branch (non-AI code only)

### Unit Tests (Pipeline Logic)

| # | Scenario | Type | Status | Last Tested |
|---|----------|------|--------|-------------|
| 3.1 | Standard receipt JSON → all fields extracted, Zod valid | Unit | 📝 | — |
| 3.2 | GCash screenshot JSON → amount + date + counterparty | Unit | 📝 | — |
| 3.3 | ₱ amounts parsed as centavos (₱345.50 → 34550) | Unit | 📝 | — |
| 3.4 | Handwritten total → confidence < 80% → flag | Unit | 📝 | — |
| 3.5 | Missing merchant field → null, other fields valid | Unit | 📝 | — |
| 3.6 | Missing date field → null, flagged for manual entry | Unit | 📝 | — |
| 3.7 | Duplicate receipt (hash match within 30min) → dedup flag | Unit | 📝 | — |
| 3.8 | Non-duplicate (same merchant, different amount) → no flag | Unit | 📝 | — |
| 3.9 | Non-duplicate (same amount, outside 30min window) → no flag | Unit | 📝 | — |
| 3.10 | Malformed OCR JSON → Zod rejects → fallback to manual | Unit | 📝 | — |
| 3.11 | Confidence < 80% on amount → amount field flagged | Unit | 📝 | — |
| 3.12 | All fields confidence > 80% → no flags | Unit | 📝 | — |

### E2E Tests (Full User Journey)

| # | Scenario | Type | Status | Last Tested |
|---|----------|------|--------|-------------|
| 3.13 | Full flow: capture → upload → OCR → review → confirm → saved | E2E | 📝 | — |
| 3.14 | User edits OCR result → edited values saved, not OCR values | E2E | 📝 | — |

**Cross-skill dependency:** AI engineer defines OCR system prompt, Zod extraction schema, confidence thresholds. Data architect defines `receipts` and `transactions` tables. Fullstack engineer implements the API route and client components. Solutions architect defines the pipeline flow and performance budget (< 8s e2e).

**Gap Registry references:** C1 (receipt deduplication), E1 (OCR technical spike — must hit 85%+ field accuracy).

---

## Priority 4: RLS Policy Isolation

**Module:** Supabase RLS policies (all tables)
**Test files:** `tests/integration/rls-isolation.test.ts`, `tests/integration/rls-multiseat.test.ts`
**Minimum scenarios:** 11
**Coverage target:** Every user-owned table tested for cross-user isolation

### Core Isolation Tests

| # | Scenario | Type | Status | Last Tested |
|---|----------|------|--------|-------------|
| 4.1 | User A cannot SELECT user B's transactions | Integration | 📝 | — |
| 4.2 | User A cannot SELECT user B's receipts | Integration | 📝 | — |
| 4.3 | User A cannot SELECT user B's ka_conversations | Integration | 📝 | — |
| 4.4 | User A cannot UPDATE user B's business profile | Integration | 📝 | — |
| 4.5 | User A cannot INSERT transaction with user B's user_id | Integration | 📝 | — |
| 4.6 | Soft-deleted rows excluded from all SELECT queries | Integration | 📝 | — |
| 4.7 | Service role CAN read across users (admin access) | Integration | 📝 | — |
| 4.8 | Anon key with no auth session → zero rows on all tables | Integration | 📝 | — |

### Multi-Seat Tests (Phase 2 Prep)

| # | Scenario | Type | Status | Last Tested |
|---|----------|------|--------|-------------|
| 4.9 | Accountant role → can read owner's transactions | Integration | 📝 | — |
| 4.10 | Viewer role → cannot update owner's transactions | Integration | 📝 | — |
| 4.11 | Non-team user → cannot access business data even with business_id | Integration | 📝 | — |

**Cross-skill dependency:** Data architect defines all RLS policies. Solutions architect defines the 4-layer data isolation architecture (Design Gate #7). Fullstack engineer ensures application-level auth check on every API route.

---

## Priority 5: Tier Gating

**Module:** `lib/utils/tier-permissions.ts`, API route middleware
**Test files:** `tests/unit/tier-permissions.test.ts`, `tests/integration/api-auth-tier.test.ts`
**Minimum scenarios:** 10
**Coverage target:** 90% branch

| # | Scenario | Type | Status | Last Tested |
|---|----------|------|--------|-------------|
| 5.1 | Free: 10th query succeeds, 11th blocked + warm Taglish | Unit | 📝 | — |
| 5.2 | Free: receipt scan → upgrade CTA (not error) | Unit | 📝 | — |
| 5.3 | Free: Ang Umaga Mo teaser only, not full | Unit | 📝 | — |
| 5.4 | Free: all Claude calls → Haiku, never Sonnet | Integration | 📝 | — |
| 5.5 | Pro: 50th scan succeeds, 51st blocked + upgrade CTA | Unit | 📝 | — |
| 5.6 | Pro: Sonnet for morning briefing, Haiku for OCR | Integration | 📝 | — |
| 5.7 | Business: 80th scan succeeds, 81st blocked | Unit | 📝 | — |
| 5.8 | Business: multi-seat access (Accountant role) | Integration | 📝 | — |
| 5.9 | Onboarding queries exempt from Free daily limit (3 cases: false/true/undefined) | Unit | ✅ | 2026-03-22 |
| 5.10 | Scan counter resets at midnight Manila time, not UTC | Unit | ✅ | 2026-03-22 — `timezone.test.ts` boundary tests + `circuit-breaker.test.ts` uses `getManilaToday()` |

**Cross-skill dependency:** Solutions architect defines tier structure and model routing decision tree. AI engineer implements Haiku/Sonnet routing logic. Fullstack engineer implements middleware and counter logic. Data architect defines `subscriptions` table tier column.

**Gap Registry references:** E3 (onboarding rate-limit exemption — CRITICAL), B2 (free tier limit UX).

---

## Cross-Cutting: Solutions Architect Verification

These checks verify that builds comply with architecture decisions. Run after each Build completion.

| # | Check | How to Verify | Status |
|---|-------|---------------|--------|
| SA.1 | Performance: FCP < 2s on throttled 4G | Lighthouse CI or manual Lighthouse mobile | 📝 |
| SA.2 | Performance: TTI < 3.5s on throttled 4G | Lighthouse CI | 📝 |
| SA.3 | Performance: JS bundle < 200KB gzipped | `next build` output check | 📝 |
| SA.4 | Performance: Claude chat response < 5s p95 | API route timing log | 📝 |
| SA.5 | Performance: OCR response < 8s p95 | API route timing log | 📝 |
| SA.6 | ADR compliance: webhooks use Edge Functions, not API routes | Code review / grep | 📝 |
| SA.7 | ADR compliance: all Claude calls through `callClaude()` wrapper | Code review / grep | 📝 |
| SA.8 | ADR compliance: `retryWithBackoff()` paired with circuit breaker | Code review / grep | 📝 |
| SA.9 | No direct Supabase service role key usage in client code | grep for SUPABASE_SERVICE_ROLE in /app/, /components/ | 📝 |
| SA.10 | Sentry captures errors in production (Gap A4) | Deploy → trigger deliberate error → verify in Sentry dashboard | ✅ | Setup complete 2026-03-22 (ADR-007). Manual verification pending first deploy. |
| SA.11 | All user-facing timestamps in UTC+8 via `@/lib/timezone` (Gap A3) | `timezone.test.ts` (12 unit tests) + code review | ✅ | 2026-03-22 (ADR-006) |

---

## Cross-Cutting: Data Architect Verification

These checks verify that every schema change follows the non-negotiable database rules.

| # | Check | How to Verify | Status |
|---|-------|---------------|--------|
| DA.1 | Every new table has RLS enabled + 4 standard policies | Migration SQL review | 📝 |
| DA.2 | Every new table has `deleted_at`, `created_at`, `updated_at` | Migration SQL review | 📝 |
| DA.3 | Every new table has `user_id` FK to `auth.users(id)` | Migration SQL review | 📝 |
| DA.4 | `updated_at` trigger attached to every new table | Migration SQL review | 📝 |
| DA.5 | All migrations have rollback SQL in comment header | Migration file review | 📝 |
| DA.6 | `supabase db reset` applies all migrations cleanly | `tests/integration/migration-integrity.test.ts` | 📝 |
| DA.7 | No physical DELETE operations in application code | grep for `.delete()` without `deleted_at` | 📝 |
| DA.8 | PII columns classified in schema reference | Schema doc review | 📝 |
| DA.9 | All `TIMESTAMPTZ` columns — no bare `TIMESTAMP` | Migration SQL review | 📝 |

---

## Cross-Cutting: Fullstack Engineer Verification

| # | Check | How to Verify | Status |
|---|-------|---------------|--------|
| FE.1 | Every API route returns standard `{ success, data/error }` envelope | Integration test or code review | 📝 |
| FE.2 | Every API route starts with `getUser()` auth check | Code review / grep | 📝 |
| FE.3 | All money values in centavos integers (not floating point pesos) | Unit tests + code review | 📝 |
| FE.4 | All user-facing text is Taglish (not pure English corporate) | Manual review + regression library | 📝 |
| FE.5 | Every data-fetching component has loading, error, and empty states | Code review | 📝 |
| FE.6 | No `'use client'` on components that don't need interactivity | Code review | 📝 |
| FE.7 | Feature flag check before rendering gated features | Code review | 📝 |
| FE.8 | Section headers on major code sections (cross-agent readability) | Code review | 📝 |

---

## Cross-Cutting: AI Engineer Verification

| # | Check | How to Verify | Status |
|---|-------|---------------|--------|
| AI.1 | BIR disclaimer on every tax-related output | Regression library (automated check for disclaimer text) | 📝 |
| AI.2 | Circuit breaker blocks at daily cap, warm Taglish message | `tests/integration/circuit-breaker.test.ts` | 📝 |
| AI.3 | Prompt injection defense — user cannot extract system prompt | Regression library (injection test cases) | 📝 |
| AI.4 | Prompt injection defense — user cannot override KA persona | Regression library (persona override test cases) | 📝 |
| AI.5 | OCR confidence < 80% → field flagged in review card | `tests/unit/confidence-scoring.test.ts` | 📝 |
| AI.6 | Free tier → Haiku only (no Sonnet routing) | `tests/integration/api-auth-tier.test.ts` | 📝 |
| AI.7 | KA voice: no corporate filler ("Certainly!", "As an AI...") | Regression library (blocked phrases check) | 📝 |
| AI.8 | KA voice: numbers as digits with ₱ sign (₱18,400) | Regression library (format check) | 📝 |
| AI.9 | KA voice: uses first name when available | Regression library (name presence check) | 📝 |
| AI.10 | System prompt version logged in prompt-library.md after change | Prompt changelog review | 📝 |
| AI.11 | "Flag as Wrong" action present on every AI output card | E2E spot check + code review (grep for FlagAsWrong component) | 📝 |
| AI.12 | Trust Recovery Pattern follows 4-step sequence (acknowledge → responsibility → explain → next step) | Regression library (structure check on error responses) | 📝 |
| AI.13 | KA Error Acknowledgement uses Taglish "Pasensya na" pattern, not generic English | Regression library (error response tone check) | 📝 |
| AI.14 | Persistent in-app disclaimer visible in chat UI at all times | E2E spot check (disclaimer element present) | 📝 |

---

## Cross-Cutting: Offline & Resilience (Design Gate #5)

| # | Check | How to Verify | Status |
|---|-------|---------------|--------|
| OFF.1 | Graceful Taglish offline message when no connectivity | Manual test (airplane mode) or Playwright with network throttling | 📝 |
| OFF.2 | Cached Ang Umaga Mo briefing available offline | Service worker cache verification | 📝 |
| OFF.3 | Queued offline actions sync when connectivity returns | TanStack Query Persister verification | 📝 |

---

## Summary: Scenario Counts

| Priority | Area | Unit | Integration | E2E | Total |
|----------|------|------|-------------|-----|-------|
| P1 | BIR Deadlines | 17 | 0 | 0 | 17 |
| P2 | Xendit Payments | 0 | 12 | 0 | 12 |
| P3 | Receipt OCR | 12 | 0 | 2 | 14 |
| P4 | RLS Isolation | 0 | 11 | 0 | 11 |
| P5 | Tier Gating | 6 | 4 | 0 | 10 |
| — | SA Verification | 0 | 0 | 0 | 9 checks |
| — | DA Verification | 0 | 1 | 0 | 9 checks |
| — | FE Verification | 0 | 0 | 0 | 8 checks |
| — | AI Verification | 2 | 1 | 0 | 14 checks |
| — | Offline/Resilience | 0 | 0 | 0 | 3 checks |
| **Total** | | **37** | **29** | **2** | **68 tests + 43 checks** |

This is a focused test suite — 68 actual test scenarios + 43 verification checks. Every one targets a failure that would hurt users financially, leak their data, break compliance, or lose revenue. Nothing is tested "just because."
