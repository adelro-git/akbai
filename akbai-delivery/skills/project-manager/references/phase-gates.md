# AKBai — Phase Gate Criteria
> Source: Roadmap v13, Project Context, Gap Registry
> For project-manager skill — use when evaluating phase transition readiness

---

## How Phase Gates Work

Each phase transition has a set of Go/No-Go criteria. ALL criteria must be met for a GO verdict. There are no partial passes — either you're ready or you're not. If even one criterion is unmet, the verdict is NO-GO with a remediation plan.

**Verdict outcomes:**
- **GO** — All criteria met. Transition to next phase.
- **CONDITIONAL GO** — All critical criteria met, 1–2 minor items in progress with clear completion date within 1 sprint. Transition allowed with carryover.
- **NO-GO** — One or more critical criteria unmet. Remain in current phase. Produce remediation sprint plan.

---

## Gate 1: Phase 0A → Phase 0B (Legal → Demand Validation)

**Gate question:** "Is the legal foundation secure enough to start public-facing activities?"

| # | Criterion | Evidence Required | Status Template |
|---|-----------|-------------------|-----------------|
| G1.1 | DTI or SEC business registration filed | Filing receipt or registration certificate | DONE / IN PROGRESS / NOT STARTED |
| G1.2 | BIR Certificate of Registration obtained | BIR COR document | DONE / IN PROGRESS / NOT STARTED |
| G1.3 | NPC pre-compliance setup | DPO designation letter + PIA draft | DONE / IN PROGRESS / NOT STARTED |
| G1.4 | IP/Trademark filing initiated | Filing receipt from IPOPHL | DONE / IN PROGRESS / NOT STARTED |
| G1.5 | Privacy Policy + Terms of Service drafted | Draft reviewed by PH tech lawyer (not self-drafted) | DONE / IN PROGRESS / NOT STARTED |

**External dependencies:** PH tech lawyer, DTI/SEC processing, BIR processing, IPOPHL filing
**Typical blockers:** Lawyer availability, government processing delays
**Escalation:** If government processing > 4 weeks, proceed to 0B with G1.1/G1.2 as CONDITIONAL (carryover)

---

## Gate 2: Phase 0B → Phase 1 (Demand Validation → MVP Build)

**Gate question:** "Is there enough validated demand and preparation to justify 6 months of build effort?"

| # | Criterion | Evidence Required | Status Template |
|---|-----------|-------------------|-----------------|
| G2.1 | 100+ waitlist signups | Waitlist database count (zero paid ads) | DONE / IN PROGRESS / NOT STARTED |
| G2.2 | Brand identity complete | Brand Kit delivered (logo, guide, templates) | DONE / IN PROGRESS / NOT STARTED |
| G2.3 | 5–6 SEO Taglish articles published | Published URLs + analytics baseline | DONE / IN PROGRESS / NOT STARTED |
| G2.4 | 10 founder interviews completed | Interview notes with persona coverage (Maria, Jose, Ana, Andoy) | DONE / IN PROGRESS / NOT STARTED |
| G2.5 | Build 0 design complete | AI Scope doc + system prompt architecture design | DONE / IN PROGRESS / NOT STARTED |
| G2.6 | Tech stack initialized | Next.js project + Supabase project + CI/CD pipeline | DONE / IN PROGRESS / NOT STARTED |
| G2.7 | All Phase 0A legal items resolved | Gate 1 all DONE (no carryover remaining) | DONE / IN PROGRESS / NOT STARTED |

**Key signal:** G2.1 (100 waitlist) is the primary demand signal. If other criteria are met but waitlist is at 60–80, consider extending Phase 0B by 2 weeks rather than lowering the bar.

**No-Go response:** If waitlist < 50 after 6 weeks of effort → reassess positioning, revisit founder interviews, consider pivoting the target persona.

---

## Gate 3: Phase 1 → Phase 2 (MVP → Growth) — Sense Check Gate

**Gate question:** "Is the MVP validated enough to invest in growth?"

This is the most important gate. It uses the 8-signal Sense Check framework evaluated at Month 6.

| # | Signal | GREEN Threshold | YELLOW | RED |
|---|--------|----------------|--------|-----|
| G3.1 | Registered users | ≥ 50 | 30–49 | < 30 |
| G3.2 | Paying Pro subscribers | ≥ 20 | 10–19 | < 10 |
| G3.3 | MRR | ≥ ₱6,000 | ₱3,000–₱5,999 | < ₱3,000 |
| G3.4 | NPS score | ≥ 40 | 25–39 | < 25 |
| G3.5 | Weekly active rate | ≥ 60% of registered | 40–59% | < 40% |
| G3.6 | Receipt scan adoption | ≥ 50% of Pro users scan weekly | 30–49% | < 30% |
| G3.7 | Morning Briefing open rate | ≥ 40% of Pro users | 25–39% | < 25% |
| G3.8 | Churn rate (monthly) | ≤ 5% | 6–10% | > 10% |

**Verdict logic:**
- **GO (proceed to Phase 2):** ≥ 6 signals GREEN, 0 signals RED
- **YELLOW (extend Phase 1 by 2–4 weeks):** 4–5 signals GREEN, or any signal RED but fixable
- **RED (return to user interviews):** < 4 signals GREEN, or ≥ 2 signals RED

**Required for Sense Check:** PostHog analytics must be live from Day 1 of Phase 1 (Gap A5). Without analytics, you cannot measure signals G3.5–G3.8.

---

## Gate 4: Phase 2 → Phase 3 (Growth → Agent Builder Platform)

**Gate question:** "Is there enough scale and revenue to justify platform investment?"

| # | Criterion | Threshold | Status Template |
|---|-----------|-----------|-----------------|
| G4.1 | Total registered users | ≥ 300 | DONE / IN PROGRESS / NOT STARTED |
| G4.2 | Total paying subscribers | ≥ 80 (Pro + Business) | DONE / IN PROGRESS / NOT STARTED |
| G4.3 | MRR | ≥ ₱50,000 | DONE / IN PROGRESS / NOT STARTED |
| G4.4 | Business tier launched and active | ≥ 10 Business subscribers | DONE / IN PROGRESS / NOT STARTED |
| G4.5 | WhatsApp Business API integrated | Live in production | DONE / IN PROGRESS / NOT STARTED |
| G4.6 | Churn rate stable | ≤ 8% monthly for 3 consecutive months | DONE / IN PROGRESS / NOT STARTED |
| G4.7 | Referral program live | Tracking referral → signup → paid conversion | DONE / IN PROGRESS / NOT STARTED |

**Verdict:** All 7 criteria must be met. No CONDITIONAL GO for this gate — Phase 3 is a significant platform investment.

---

## CRITICAL Gaps as Gate Prerequisites

These 8 CRITICAL gaps from gap-registry.md are hard gates. They block Phase 1 build regardless of phase gate status:

| Gap | Description | Blocks |
|-----|-------------|--------|
| A1 | Authentication (email OTP) | All of Phase 1 — no auth = no data isolation |
| A2 | Privacy Policy & ToS | Any data collection — NPC requirement |
| A3 | Timezone enforcement (UTC+8) | BIR deadlines, push notifications |
| A4 | Error monitoring (Sentry) | Production launch |
| A5 | Analytics baseline (PostHog) | Sense Check Gate measurement |
| D1 | OTP deliverability to Yahoo Mail PH | User registration for target market |
| D2 | Webhook idempotency (Xendit) | Payment processing |
| D3 | OR number generation legality | Invoice/receipt features |

**Rule:** No Phase 1 feature build proceeds until the CRITICAL gaps relevant to that build are resolved. Check gap-registry.md for the "When to Fix" column to know which gaps block which builds.
