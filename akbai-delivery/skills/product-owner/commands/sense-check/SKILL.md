---
name: Sense Check Gate Assessment
description: Run 8-signal Month 6 Go/No-Go framework for Phase 1→2 advancement. Trigger keywords — sense check, phase gate, month 6, metrics, readiness
trigger: /sense-check
skills: product-owner, ops-lead
---

# Sense Check Gate Assessment

Before Starting
- Read `/AKBai/akbai-delivery/shared/project-context.md` — focus on §6 Phase Structure & Targets (Phase 1 targets, Sense Check Gate framework)
- Read `/AKBai/akbai-delivery/shared/gap-registry.md` — context on pre-launch gates and dependencies
- Read `/AKBai/akbai-delivery/shared/glossary.md` — definitions for Sense Check Gate, Phase 2, MRR, NPS, churn rate

---

## Purpose

The Sense Check Gate is the critical Go/No-Go assessment at **Month 6** (end of Phase 1 MVP build). It measures 8 signals across user adoption, revenue, health, and support load to decide whether AKBai is ready to advance to Phase 2 (Growth). Three possible outcomes:
- **GREEN (Proceed):** All signals are on target or exceeded
- **YELLOW/CONDITIONAL (Proceed with conditions):** 2–3 signals are trending close; provide 2–4 week remediation plan
- **RED (No-Go):** Any critical signal is far off target; return to user interviews and rebuild strategy

This assessment is **not** about perfection — it's about validating the MVP model works with real users before investing in Phase 2 growth infrastructure.

---

## Workflow

### Step 1: Gather Phase 1 Context
1. Extract Phase 1 targets from `/AKBai/akbai-delivery/shared/project-context.md` §6:
   - **Registered Users:** Target 50+
   - **Paying Pro Subscribers:** Target 20+
   - **Monthly Recurring Revenue (MRR):** Target ₱6,000–₱10,000
   - **Net Promoter Score (NPS):** Target ≥40
   - **Weekly Active Rate (WAR):** Target ≥60% of registered users
   - **Monthly Churn Rate:** Target <10%
   - **Receipt Scan Adoption:** Target ≥50% of Pro users scanning weekly
   - **Support Load:** Target <2 hours/week for solo founder

2. Note the Phase 2 targets from §6 (200 users, 80 paying, ₱30K–₱50K MRR) — these inform the trajectory assessment.

### Step 2: Request Current Metrics from Anton
Present this table to Anton and ask for current values for each signal as of Month 6:

| Signal | Month 6 Target | Current Value | Status (RED/YELLOW/GREEN) | Notes |
|--------|---|---|---|---|
| Registered Users | 50+ | ? | | |
| Paying Pro Subscribers | 20+ | ? | | |
| MRR (₱) | 6,000–10,000 | ? | | |
| NPS Score | ≥40 | ? | How measured (survey sample, timing)? |
| Weekly Active Rate | ≥60% | ? | % of registered users opening app/taking action weekly |
| Monthly Churn Rate | <10% | ? | % of paying users who cancelled last month |
| Receipt Scan Adoption | ≥50% of Pro users | ? | % of Pro users scanning ≥1 receipt/week |
| Support Load | <2 hrs/week | ? | Time spent on manual support (email, WhatsApp, DMs) |

If exact metrics are unavailable, ask for closest estimate + date measured.

### Step 3: Rate Each Signal

**GREEN (On Target):**
- Metric meets or exceeds target
- Trend is stable or improving

**YELLOW (Close/Trending):**
- Metric is 75–95% of target
- Trend is positive (improving week-over-week or month-over-month)
- Signal has clear path to GREEN within 2–4 weeks

**RED (Far/Declining):**
- Metric is <75% of target
- Trend is flat or declining
- No clear path to target without major intervention

### Step 4: Calculate Go/No-Go Verdict

**GREEN → PROCEED (Go)**
- All 8 signals are GREEN, OR
- Up to 1 signal is YELLOW with strong trend

**YELLOW → CONDITIONAL GO (Proceed with conditions)**
- 2–3 signals are YELLOW
- No RED signals
- Provide explicit 2–4 week remediation plan for each YELLOW signal
- Specify success metrics to re-assess before Phase 2 launch

**RED → NO-GO (Return to user interviews)**
- Any 1+ signals are RED
- Recommend pause on Phase 2 build
- Provide diagnosis: Is problem user acquisition? Retention? Feature adoption? Support model?
- Return to founder interviews (5–10 users) to understand blockers

### Step 5: Output Assessment Table

Generate a clean summary table:

```
SENSE CHECK GATE ASSESSMENT — Month 6
═══════════════════════════════════════════════════════════════════

SIGNAL BREAKDOWN:
─────────────────
Signal                          | Target       | Current  | Status
────────────────────────────────┼──────────────┼──────────┼─────────
1. Registered Users             | 50+          | [value]  | GREEN/YELLOW/RED
2. Paying Pro Subscribers       | 20+          | [value]  | GREEN/YELLOW/RED
3. Monthly Recurring Revenue    | ₱6K–₱10K     | [value]  | GREEN/YELLOW/RED
4. Net Promoter Score (NPS)     | ≥40          | [value]  | GREEN/YELLOW/RED
5. Weekly Active Rate           | ≥60%         | [value]  | GREEN/YELLOW/RED
6. Monthly Churn Rate           | <10%         | [value]  | GREEN/YELLOW/RED
7. Receipt Scan Adoption        | ≥50% of Pro  | [value]  | GREEN/YELLOW/RED
8. Support Load (solo founder)  | <2 hrs/week  | [value]  | GREEN/YELLOW/RED

VERDICT: [GREEN / CONDITIONAL GO / RED]
═════════════════════════════════════════════════════════════════════
```

### Step 6: Provide Signal-by-Signal Analysis + Next Steps

For each YELLOW or RED signal, provide:
- **Current state:** What is the metric, when was it measured?
- **Gap:** How far from target?
- **Root cause hypothesis:** Why is it lagging? (e.g., feature not visible, onboarding friction, pricing too high, support load bottleneck)
- **Recommended action:** Specific 1–2 week action to move needle (e.g., "Run push notification test for Resibo Scanner adoption," "Survey 5 churned users on why they cancelled")
- **Re-assess date:** When to measure again to confirm improvement

### Step 7: Phase 2 Go-Forward Plan (if GREEN or CONDITIONAL)

If verdict is PROCEED or CONDITIONAL GO:
1. **Phase 2 Scope:** Confirm which Phase 2 features are ready (Business tier, WhatsApp, referral loop, churn recovery)
2. **Build timeline:** 6-month phase (Month 6–12) to hit 200 users, 80 paying, ₱30K–₱50K MRR
3. **Growth channel priority:** Based on acquisition data from Phase 1, which channel (organic, referral, paid) is highest-ROI?
4. **Resource plan:** Can Anton solo this, or is freelancer hire needed (design, DevOps)?
5. **Next gate:** Set Phase 2 Sense Check equivalent (Month 12 milestone)

If verdict is NO-GO:
1. **Return to validation:** Run 5–10 founder interviews with churned/inactive users and Phase 1 users. Key questions:
   - What is the #1 unmet need?
   - Which feature did you use most?
   - Why did you pause/cancel?
2. **Hypothesis revision:** Update product positioning, feature priority, or pricing based on feedback
3. **Phase 1B sprint:** 2–3 week focused sprint to address top blocker, then re-measure signals
4. **Escalation:** If fundamentals are broken (e.g., BIR compliance concern, pricing too high), escalate to co-founder or advisor discussion

---

## Cross-Skill Delegation

- **Hand off to `/project-manager` skill** if verdict requires sprint planning or timeline adjustments
- **Hand off to `/marketing-lead` skill** if acquisition or churn analysis is needed
- **Hand off to `/ops-lead` skill** if support load is blocking growth

---

## Key Outputs

1. **Signal-by-signal assessment table** (markdown) — shareable with advisors and team
2. **Go/No-Go verdict** with 1–2 sentence summary
3. **Specific next steps** for Month 6–7 (remediation plan or Phase 2 kickoff plan)
4. **Risk flags** (e.g., "Support load trending upward; may need to hire EA before Phase 2")

---

## Notes

- The 8 signals are interdependent. E.g., high churn can mask good acquisition, or low WAR can mask poor feature design. **Triangulate** — don't rely on single metric.
- NPS data quality matters. Ensure sample size is ≥10 respondents, measured via in-app survey at key moments (post-first-paid-month, post-feature-launch).
- Support load = **solo founder time only**. If using a chatbot or minimal automation, measure the time spent on blocks that can't be automated.
- Receipt Scan Adoption is a proxy for feature stickiness. If <50%, investigate: Is the UX confusing? Is Haiku OCR accuracy low? Is pricing too high? See `/data-architect` skill for OCR accuracy spike.
- **Monthly Churn Rate:** Track both paying churn (subscription cancellations) and free churn (users who stop logging in). Free churn is less critical but signals weak activation.
