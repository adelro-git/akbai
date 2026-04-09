---
name: gap-check
description: "Review gap registry status and prioritize upcoming work. Reads gap-registry.md (29 gaps: 10 CRITICAL, 16 IMPORTANT, 3 PLAN), assesses each gap for current phase, generates status table (RED/YELLOW/GREEN), identifies overdue items blocking next phase gate, recommends top 3 sprint priorities based on CRITICAL gap dependencies and effort vs. impact. Delivers: gap status dashboard, phase gate blockers, sprint recommendations, suggested sprint tasks. For project-manager and product-owner to plan sprints and unblock Phase 1 launch. Trigger keywords: gap check, gap status, what's blocking launch, priority review, sprint planning, gate blockers, roadmap review, what should we do next, gap dashboard, are we ready for Phase 1."
---

# /gap-check — Gap Registry Status & Prioritization

**Skills:** project-manager + product-owner
**Command:** `/gap-check`
**Purpose:** Assess gap registry status, identify blockers for phase gates, recommend sprint priorities.

You are Anton's strategic planner. The gap registry is your source of truth — 29 gaps across 5 categories, 10 of which are CRITICAL hard gates that MUST be resolved before Phase 1 ships. This skill answers: **Are we ready for the next phase? What's blocking us? What should we work on this sprint?**

---

## Before Starting

**Read the shared context files** (takes 5 minutes):
- `/AKBai/akbai-delivery/shared/project-context.md` § 5–6 (phase structure, current phase, targets, gates)
- `/AKBai/akbai-delivery/shared/gap-registry.md` (full registry with all 29 gaps, categories A–E, summary table)
- `/AKBai/akbai-delivery/shared/tech-stack.md` (deployment targets, architecture principles, RLS rules)

**Reference files in this skill:**
- `references/roadmap-details.md` — Full build order (Build 0–8), build descriptions, effort estimates, dependencies
- `references/gap-ownership.md` — Which skills own which gaps (devops-engineer, ai-engineer, fullstack-engineer, etc.)

---

## Step 1: Read the Current Phase

From `project-context.md` § 6, identify:

**Current Phase:** [UPDATE THIS FIELD]
- **Phase 0A — Legal Foundation** (Weeks 1–4): DTI, SEC, BIR, NPC, IP/trademark ✓ or 🔄
- **Phase 0B — Demand Validation** (Weeks 4–10): 100 waitlist, brand, SEO, founder interviews ✓ or 🔄
- **Phase 0C — Paid Pilot** (Optional, Weeks 8–12): 5-user paid pilot, pricing validation ✓ or 🔄
- **Phase 1 — MVP Build** (Months 1–6): Builds 0–8, 50 users, 20 Pro subscribers, ₱6K–₱10K MRR ✓ or 🔄

**Phase Gate:** What must be true before moving to the next phase?
- Phase 0A → 0B gate: 5 legal items complete
- Phase 0B → Phase 1 gate: 100 waitlist signups
- Phase 0C → Phase 1 gate: 3+ users willing to continue paying
- Phase 1 → Phase 2 gate: Sense Check Gate (8 signals met)

---

## Step 2: Assess Each Gap

For each of the 29 gaps in gap-registry.md, determine:

### A. Status
Choose one:
- **RESOLVED** — Gap is closed, feature/item complete, deployed to prod (if relevant)
- **IN PROGRESS** — Work started, on track to close by target date
- **BLOCKED** — Work started but stuck waiting for (dependency, decision, resources)
- **NOT STARTED** — High-priority gap, work not yet begun
- **DEFERRED** — Intentionally pushed to later phase (Phase 2+)

### B. Phase Target
When must this gap be closed?
- **Phase 0A** (Weeks 1–4): Legal gates, compliance setup, IP
- **Phase 0B** (Weeks 4–10): Demand validation, brand, GTM
- **Phase 0C** (Optional): Paid pilot validation
- **Phase 1 — Build 0** (Hard gate before any engineering): AI Scope, system prompt, design gates
- **Phase 1 — Build 1–5** (MVP features): Core features, UX, business logic
- **Phase 1 — Build 6–8** (Payments, polish): Payments, mobile PWA, final QA
- **Phase 2+** (Growth): Nice-to-haves, scaling features

### C. Phase Gate Blocker?
Is this gap blocking the current phase gate?
- **YES** → Cannot move forward without this (example: Build 0 AI Scope blocks all Phase 1 engineering)
- **NO** → Nice to have, but not a blocker (example: D10 Admin observability is PLAN, doesn't block launch)

### D. Overdue?
Compare target date vs. today:
- **RED** → Due date passed, milestone at risk
- **YELLOW** → Due in next 2 weeks, should prioritize
- **GREEN** → On track or not yet due

---

## Step 3: Build Gap Status Table

Create a matrix showing all 29 gaps:

```
| Category | Gap | Severity | Status | Target Phase | Blocker? | Overdue? | Notes |
|----------|-----|----------|--------|--------------|----------|----------|-------|
| **A — Hard Pre-Launch Gates** |
| A1 | Auth (OTP) | CRITICAL | IN PROGRESS | Build 0 | YES | 🟡 YELLOW | On track, Supabase Auth setup started |
| A2 | Privacy Policy & ToS | CRITICAL | NOT STARTED | Phase 0A | YES | 🔴 RED | Overdue (due Feb 28), needs PH tech lawyer |
| A3 | Timezone (UTC+8) | CRITICAL | NOT STARTED | Phase 1 Build 0 | YES | 🟡 YELLOW | Architecture decision made, impl pending |
| A4 | Error monitoring (Sentry) | CRITICAL | NOT STARTED | Phase 1 Pre-launch | YES | 🟡 YELLOW | Depends on: devops-engineer skill |
| A5 | Analytics baseline (PostHog) | CRITICAL | NOT STARTED | Phase 1 Pre-launch | YES | 🟡 YELLOW | Depends on: devops-engineer skill |
| **B — UX Gaps** |
| B1 | AI loading states | IMPORTANT | NOT STARTED | Build 3 | NO | 🟢 GREEN | Future sprint, not critical for MVP |
| B2 | Free tier limit UX | IMPORTANT | NOT STARTED | Build 3 | NO | 🟢 GREEN | Can be quick polish task |
| ... | ... | ... | ... | ... | ... | ... | ... |
| **E — Pre-Build Checklist** |
| E1 | Resibo OCR spike | CRITICAL | NOT STARTED | Build 0 | YES | 🔴 RED | Overdue, 1 afternoon effort, should do TODAY |
| E3 | Onboarding rate-limit exemption | CRITICAL | NOT STARTED | Build 1 | YES | 🟡 YELLOW | Depends on API middleware design |
```

---

## Step 4: Identify Phase Gate Blockers

**Current Phase Gate Analysis:**

If Phase 0A (Legal Foundation):
```
GATE: 5 legal items complete

Blocker Gaps:
🔴 A2 — Privacy Policy & ToS (NOT STARTED, needs lawyer)
🟡 D11 — Data retention policy (PLAN, part of Privacy Policy scope)

Status: GATE AT RISK
Action: Priority 1 — Hire tech lawyer this week

Estimated blocker resolution: 2 weeks (if lawyer responds immediately)
```

If Phase 0B (Demand Validation):
```
GATE: 100 waitlist signups

Blocker Gaps:
🟢 Brand complete (IN PROGRESS, on track)
🟡 SEO articles (5-6 published, 3 pending)
🟢 Founder interviews (10/10 done)

Status: GATE ON TRACK
Action: Finish last 3 SEO articles this sprint
```

If Phase 1 (MVP Build):
```
GATE: Build 0 (AI Scope) complete before Build 1

Blocker Gaps:
🔴 E1 — Resibo OCR spike (NOT STARTED, critical technical risk)
🟡 Build 0 AI Scope design (IN PROGRESS, should be done this sprint)
🟢 Design gates (1–8) in progress, mostly on track

Status: GATE BLOCKED by E1 OCR spike
Action: Priority 1 — Complete OCR spike TODAY (1 afternoon)
        If Haiku fails, escalate to Sonnet (higher cost) or adjust marketing promises

Expected gate resolution: 2 weeks (Build 0 design + all design gates)
```

---

## Step 5: Prioritize for Next Sprint

Use this framework to choose top 3 priorities:

### Scoring Formula
```
Priority Score = (CriticalityWeight × SeverityLevel)
               + (PhaseGateWeight × BlockerScore)
               + (DependencyWeight × UnblockCount)
               - (EffortWeight × EstimatedDays)

Where:
- CriticalityWeight = 4 (CRITICAL > IMPORTANT > PLAN)
- PhaseGateWeight = 3 (blocks gate = +3, doesn't block = 0)
- DependencyWeight = 2 (unblocks N other gaps = N × 2)
- EffortWeight = 0.5 (prefer quick wins over long projects)
```

### Top 3 Selection Logic

1. **All CRITICAL gaps blocking phase gate** (priority 1)
   - Example: "E1 — Resibo OCR spike" (1 day effort, unblocks Build 0 + Build 3 + AI scope)
   - Example: "A2 — Privacy Policy" (blocks Phase 0A gate, hire lawyer this week)

2. **CRITICAL gaps not yet started** (priority 2)
   - Example: "A4 — Sentry setup" (CRITICAL, ~0.5 day devops-engineer effort)
   - Example: "A5 — PostHog setup" (CRITICAL, ~0.5 day devops-engineer effort)

3. **IMPORTANT gaps unblocking Phase 1** (priority 3)
   - Example: "B3 — Onboarding recovery" (required for MVP, effort: 2 days)
   - Example: "C1 — Receipt deduplication" (financial accuracy, effort: 1 day)

---

## Step 6: Generate Recommendations Output

### Recommended Sprint Priorities

```markdown
# Gap Check Report — [Date]

## Current Phase Status
Phase: Phase 0A — Legal Foundation (Weeks 1–4)
Gate Status: 🔴 AT RISK
Estimated days to gate: 14 days (vs. 4 weeks target = 2 weeks slack)

## Phase Gate Blockers (Must Fix This Sprint)

1. 🔴 CRITICAL — A2 Privacy Policy & Terms of Service
   - Status: NOT STARTED
   - Target: Phase 0A (DUE NOW)
   - Blocker: YES (gate requirement)
   - Effort: 3–5 days (requires PH tech lawyer)
   - Action: Hire Phillex or similar tech law firm this week
   - Unblocks: D11 (data retention), launches Phase 0B demand validation
   - Owner: ops-lead (legal coordination)

2. 🟡 CRITICAL — E1 Resibo OCR Technical Spike
   - Status: NOT STARTED
   - Target: Build 0 / Phase 0A (scope validation)
   - Blocker: YES (core feature viability risk)
   - Effort: 1 afternoon (~4 hours)
   - Action: Test Claude Haiku Vision on 10–15 real Filipino receipts TODAY
   - Success threshold: ≥85% field accuracy (Shopee waybills, SM thermal prints)
   - If FAIL: Must escalate to Sonnet (higher cost, ₱0.40/scan) or adjust marketing
   - Owner: ai-engineer
   - Unblocks: Build 1 (Kilala Kita onboarding), Build 3 (Resibo Scanner)

## Other CRITICAL Gaps (Priority 2)

3. 🟡 CRITICAL — A4 Error Monitoring (Sentry)
   - Status: NOT STARTED
   - Target: Phase 1 Pre-launch (must be live Day 1)
   - Blocker: YES (Phase 1 gate)
   - Effort: 0.5 days (devops-engineer)
   - Action: Set up Sentry account, integrate with Vercel, configure alerts
   - Owner: devops-engineer

4. 🟡 CRITICAL — A5 Analytics Baseline (PostHog)
   - Status: NOT STARTED
   - Target: Phase 1 Pre-launch (required for Sense Check signals)
   - Blocker: YES (Phase 1 gate)
   - Effort: 0.5 days (devops-engineer)
   - Action: Set up PostHog account, instrument core events, create dashboards
   - Owner: devops-engineer

## Top 3 Sprint Recommendations

### Sprint 1 (This Week) — Unblock Phase 0A → 0B
**Focus: Legal + Technical Validation**

1. ✅ A2 Privacy Policy & ToS (3–5 days)
   - Owner: ops-lead
   - Effort: 3–5 days
   - Blocker: YES (Phase 0A gate)
   - Task: Engage PH tech lawyer, draft Privacy Policy + ToS, NPC registration prep

2. ✅ E1 Resibo OCR Spike (1 day)
   - Owner: ai-engineer
   - Effort: 1 afternoon
   - Blocker: YES (core feature viability)
   - Task: Test Haiku Vision on real receipts, document findings, escalate if needed

3. ✅ D11 Data Retention Policy (0.5 days)
   - Owner: ops-lead
   - Effort: 0.5 days
   - Blocker: NO (but part of Privacy Policy scope)
   - Task: Define retention period (recommend: 1 year inactive = delete), add to Privacy Policy

**Sprint Capacity:** Anton has ~15 hours (10–15 hrs per 2-week sprint)
- A2 Privacy Policy: ~20 hours (awaiting lawyer response, so parallelizable)
- E1 OCR Spike: ~4 hours (ai-engineer)
- D11 Retention: ~2 hours (ops-lead)

**Total Critical Path:** 6 hours of Anton's direct work (1.5 days equivalent) + lawyer engagement

### Sprint 2 (Weeks 2–3) — Phase 0A → 0B Transition
**Focus: Phase 0B Demand Validation Launch**

1. ✅ Phase 0A Legal Gate Completion
   - NPC registration
   - BIR Certificate of Registration
   - IP/trademark filing
   - Ensure: Privacy Policy & ToS live

2. ✅ Phase 0B Gate Kickoff
   - 100 waitlist signups target
   - Brand identity complete
   - Launch 5–6 SEO conversational Filipino articles

3. ✅ Monitoring Setup (A4, A5)
   - Sentry integration
   - PostHog instrument core events

### Sprint 3 (Weeks 3–4) — Build 0 Design Gates
**Focus: Pre-Build Validation**

1. ✅ Build 0 AI Scope Definition & System Prompt
   - Modular scope sections ([TAX_SCOPE], [COMMUNICATION_SCOPE], etc.)
   - conversational Filipino style guide + prompt regression tests
   - KA error acknowledgement pattern
   - Domain-expandable architecture prep

2. ✅ Design Gates 1–8
   - Trust Recovery Pattern + Flag as Wrong
   - Offline UX minimum
   - Feature flag system
   - 4-Layer data isolation architecture

## Gap Status Dashboard — All 29 Gaps

### Category A — Hard Pre-Launch Gates (5 total)

| Gap | Status | Target | Blocker | Overdue | Score | Sprint |
|-----|--------|--------|---------|---------|-------|--------|
| A1 | IN PROGRESS | Build 0 | YES | 🟡 | 9.5 | S1 |
| A2 | NOT STARTED | Phase 0A | YES | 🔴 | 10.0 | S1 ⭐ PRIORITY |
| A3 | NOT STARTED | Build 0 | YES | 🟡 | 9.0 | S3 |
| A4 | NOT STARTED | Phase 1 Pre | YES | 🟡 | 9.0 | S2 |
| A5 | NOT STARTED | Phase 1 Pre | YES | 🟡 | 9.0 | S2 |

### Category B — UX Gaps (7 total)

| Gap | Status | Target | Blocker | Overdue | Score | Sprint |
|-----|--------|--------|---------|---------|-------|--------|
| B1 | NOT STARTED | Build 3 | NO | 🟢 | 4.5 | S4 |
| B2 | NOT STARTED | Build 3 | NO | 🟢 | 4.0 | S4 |
| B3 | NOT STARTED | Build 1 | NO | 🟢 | 5.5 | S3 |
| B4 | NOT STARTED | Build 3 | NO | 🟢 | 3.5 | S4 |
| B5 | NOT STARTED | Build 2 | NO | 🟢 | 4.0 | S3 |
| B6 | NOT STARTED | Build 4 | NO | 🟢 | 4.5 | S4 |
| B7 | NOT STARTED | Phase 1 Launch | NO | 🟡 | 5.0 | S3 |

### Category C — Business Logic (3 total)

| Gap | Status | Target | Blocker | Overdue | Score | Sprint |
|-----|--------|--------|---------|---------|-------|--------|
| C1 | NOT STARTED | Build 3 | NO | 🟢 | 5.5 | S3 |
| C2 | NOT STARTED | Build 4 | NO | 🟢 | 4.5 | S4 |
| C3 | NOT STARTED | Phase 2 | NO | 🟢 | 2.0 | DEFER |

### Category D — Operational (11 total)

| Gap | Status | Target | Blocker | Overdue | Score | Sprint |
|-----|--------|--------|---------|---------|-------|--------|
| D1 | NOT STARTED | Phase 0A | YES | 🔴 | 9.5 | S1 ⭐ PRIORITY |
| D2 | NOT STARTED | Build 4 | YES | 🟡 | 8.5 | S3 |
| D3 | NOT STARTED | Phase 1 Legal | YES | 🟡 | 8.5 | S2 |
| D4 | NOT STARTED | Phase 1 Pre | NO | 🟡 | 6.0 | S2 |
| D5 | NOT STARTED | Phase 0A | NO | 🔴 | 7.0 | S1 |
| D6 | NOT STARTED | Build 3 | NO | 🟢 | 5.5 | S3 |
| D7 | NOT STARTED | Phase 1 Pre | NO | 🟡 | 6.5 | S2 |
| D8 | NOT STARTED | Phase 0C/1 | NO | 🟡 | 4.5 | S2 |
| D9 | NOT STARTED | Phase 1 Launch | NO | 🟡 | 5.5 | S3 |
| D10 | PLAN | Phase 1 Post | NO | 🟢 | 2.0 | DEFER |
| D11 | NOT STARTED | Phase 0A | NO | 🟡 | 6.5 | S1 |

### Category E — Pre-Build Checklist (3 total)

| Gap | Status | Target | Blocker | Overdue | Score | Sprint |
|-----|--------|--------|---------|---------|-------|--------|
| E1 | NOT STARTED | Build 0 | YES | 🔴 | 10.0 | S1 ⭐ PRIORITY |
| E2 | NOT STARTED | Phase 0A | NO | 🟡 | 5.5 | S1 |
| E3 | NOT STARTED | Build 1 | YES | 🟡 | 9.0 | S3 |

## Effort Estimates by Owner

```
devops-engineer:  4.5 days (A4 Sentry, A5 PostHog, D4 monitoring, D7 runbook)
ai-engineer:      1.0 day  (E1 OCR spike, Build 0 scope prep)
fullstack-eng:    8.0 days (A1 Auth, B3 onboarding recovery, C1 dedup, E3 rate-limit)
ops-lead:         8.0 days (A2 Privacy/ToS, D1 OTP, D11 retention, D5 backup, Phase 0B)
solutions-arch:   3.0 days (Build 0 design gates, architecture review)
ux-designer:      2.0 days (B1–B7 UX gaps, design system, conversational Filipino style guide)
security-comp:    1.0 day  (D3 OR numbering legal, RLS audit)
```

## Summary: Next Actions

**By end of this week:**
1. ✅ Hire PH tech lawyer for A2 Privacy Policy (ops-lead)
2. ✅ Run E1 OCR spike test on real receipts (ai-engineer, 1 afternoon)
3. ✅ Report OCR findings to product-owner + decision on escalation

**By end of Sprint 1 (2 weeks):**
1. ✅ Privacy Policy & ToS live
2. ✅ Phase 0A legal gate complete
3. ✅ Phase 0B demand validation launch (waitlist, SEO)
4. ✅ A4 + A5 monitoring setup begin

**Target Phase Gate:** Phase 0A → 0B transition in 4 weeks (on track with 2 weeks slack)

---

**Report generated:** [today's date]
**Report owner:** project-manager
**Next review:** 1 week (sprint checkpoint)
```

---

## Step 7: Suggest Actionable Sprint Tasks

Convert recommendations into specific, assignable sprint tasks:

### Task Template

```
# Task: [Gap Title] — [Owner Skill]

**Acceptance Criteria:**
- [ ] [Specific, measurable outcome]
- [ ] [Evidence of completion]
- [ ] [Verification step]

**Effort:** [days] / [story points]
**Blocker:** [YES/NO] for [phase gate]
**Dependencies:** [Other gaps that must be done first]

**Definition of Done:**
- Code committed (if applicable)
- Tests passing (if applicable)
- Documentation updated
- Reviewed by [peer]
- Merged to main (if applicable)

**Notes:**
[Any context, risks, or assumptions]
```

### Example Sprint 1 Tasks

**Task 1: E1 Resibo OCR Technical Spike**
- Owner: ai-engineer
- Effort: 1 day
- Blocker: YES (Build 0 gate)
- Acceptance Criteria:
  - [ ] Tested Claude Haiku Vision on 10+ real Filipino receipts (Shopee, SM, thermal)
  - [ ] Measured field extraction accuracy per receipt type
  - [ ] Documented findings in `/AKBai/akbai-delivery/refs/e1-ocr-spike-results.md`
  - [ ] Accuracy ≥85% for "pass" or escalation plan documented if <85%
- Dependencies: None
- Notes: If Haiku fails, must escalate decision to product-owner on Sonnet cost trade-off

**Task 2: A2 Privacy Policy & Terms of Service**
- Owner: ops-lead
- Effort: 3–5 days
- Blocker: YES (Phase 0A gate)
- Acceptance Criteria:
  - [ ] PH tech lawyer engaged (contract signed, NDA if applicable)
  - [ ] Privacy Policy draft completed (RA 10173 + NPC compliance)
  - [ ] Terms of Service draft completed (payment terms, usage restrictions)
  - [ ] Documents reviewed by lawyer for PH legal compliance
  - [ ] Ready to publish by end of Sprint 2
- Dependencies: None (but legal response time may delay)
- Notes: This will likely take 2 weeks with back-and-forth with lawyer

**Task 3: D1 OTP Deliverability to Yahoo Mail PH**
- Owner: devops-engineer
- Effort: 0.5 days
- Blocker: YES (Phase 0A gate)
- Acceptance Criteria:
  - [ ] Custom SMTP domain warmed up (minimum 100 test emails sent)
  - [ ] Yahoo Mail PH delivery verified (✅ inbox, not spam)
  - [ ] Supabase Auth OTP provider updated to custom SMTP
  - [ ] Test: sign up new user, verify OTP received in Yahoo Mail PH account
- Dependencies: None
- Notes: SendGrid default has known issues with PH Yahoo Mail; use Amazon SES or Sendgrid with warmup

**Task 4: D5 Data Backup Strategy**
- Owner: devops-engineer
- Effort: 0.5 days
- Blocker: NO (Phase 0A prep)
- Acceptance Criteria:
  - [ ] Supabase PITR (point-in-time recovery) explicitly enabled on paid plan
  - [ ] Tested restore procedure: simulate data loss, restore from backup to point-in-time
  - [ ] Documented backup verification process in `/AKBai/akbai-delivery/references/backup-procedures.md`
  - [ ] Restore time SLA documented (e.g., "15 min RTO, 1 min RPO")
- Dependencies: None
- Notes: Must test before any production financial data is stored

---

## When to Run /gap-check

**Use /gap-check when:**
- Planning a new sprint (weekly or bi-weekly)
- Gate milestone approaching (2 weeks before target)
- Asking "what should we do next?" or "are we on track?"
- Product-owner/project-manager needs phase gate status
- Stakeholder asks "are we ready for Phase 1 launch?"
- A gap status changes (closure, blockers, delays)

**Do NOT use /gap-check when:**
- Working on a specific gap (use relevant skill instead)
- Investigating a production incident (use `/incident`)
- Technical deep-dive on one feature (use solutions-architect)

---

## Reference: Dependency Graph

Some gaps depend on others. Complete in this order:

```
PHASE 0A Legal Foundation
├── A2 Privacy Policy ← (blocks D11, D8)
├── D1 OTP Deliverability
├── D5 Backup Strategy
├── D11 Data Retention Policy ← (depends on A2)
└── IP/Trademark Filing

PHASE 0B Demand Validation
├── Brand Identity (from kit)
├── SEO conversational Filipino Articles
└── Founder Interviews (10 needed)

Phase 0C Paid Pilot (Optional)
└── D8 Beta-to-Paid Transition (pricing, tier migration)

PHASE 1 BUILD 0 — AI Scope (Hard Gate)
├── E1 OCR Spike ← (tech validation)
├── Build 0 AI Scope Design
├── Design Gates 1–8 (trust, offline, flags, data isolation, domain expansion)
└── conversational Filipino Style Guide + Regression Tests

PHASE 1 BUILD 1 — Kilala Kita
├── B3 Onboarding Recovery
├── E3 Rate-Limit Exemption
└── A1 Auth (OTP)

PHASE 1 BUILD 2 — Dashboard
├── B5 Empty States
└── A3 Timezone Enforcement

PHASE 1 BUILD 3 — Resibo Scanner + More
├── E1 OCR Spike ✓ (from Build 0)
├── B1 AI Loading States
├── B2 Free Tier Limit UX
├── B4 Profile Update Flow
├── B6 Push Notification Timing
├── C1 Receipt Deduplication
└── D6 Session Expiry UX

PHASE 1 BUILD 4 — Deadline Watcher + More
├── C2 Subscription Grace Period
├── D2 Webhook Idempotency (Xendit)
└── B6 Push Notification Timing

PHASE 1 BUILD 6–8 — Payments & Polish
├── D3 OR Number Generation (legal)
└── D9 PWA Installation UX

PHASE 1 PRE-LAUNCH GATES
├── A4 Sentry
├── A5 PostHog
├── D4 Dependency Monitoring
├── D7 Incident Response Runbook
└── B7 iOS PWA Home Screen Install

PHASE 1 LAUNCH
└── D10 Admin Observability (post-launch)
```

---

## Glossary

- **Gap:** A feature, process, or validation item that needs to be completed
- **CRITICAL:** Hard gate; blocks phase progression without it
- **IMPORTANT:** Needed for MVP quality, but less blocking
- **PLAN:** Nice-to-have; Phase 2+ priority
- **Phase Gate:** A binary go/no-go decision before moving to the next phase
- **Blocker:** A gap preventing phase progression or core feature viability
- **RLS:** Row-Level Security — data isolation policy in Supabase
- **PITR:** Point-in-Time Recovery — database restore capability
- **OTP:** One-Time Password (authentication)
- **OCR:** Optical Character Recognition (receipt scanning)
- **conversational Filipino:** Filipino-English mix (AKBai's voice)

---

## Appendix: Historical Gap Tracking

Keep a log of gap closures for trend analysis:

| Gap | Resolved Date | Resolution | Effort (actual) | Owner | Notes |
|-----|---------------|-----------|-----------------|-------|-------|
| A1 | TBD | TBD | TBD | TBD | TBD |
| E1 | TBD | TBD | TBD | TBD | TBD |

**Purpose:** Identify estimation accuracy, bottlenecks, and patterns over time.
