# AKBai — Sense Check Gate Framework
> Used by: product-owner, project-manager, ops-lead
> Last updated: March 2026 | Source: Roadmap v14, Financial Model v5, Market Research v1.1

---

## Purpose

The Sense Check Gate is the Month 6 Go/No-Go checkpoint that determines whether AKBai has found enough product-market fit to justify Phase 2 investment. Phase 2 means committing to the Business tier (₱899), WhatsApp Business API integration, a referral loop, churn recovery flows, and potentially hiring a freelancer. That's real money and time — the gate exists to make sure the foundation is solid before scaling.

The framework measures 8 signals across three categories: traction, engagement, and economics. Each signal has a GREEN threshold (clear go), a YELLOW threshold (borderline — investigate), and a RED threshold (stop and reassess).

---

## The 8 Signals

### Category 1: Traction (Are people showing up?)

#### Signal 1: Registered Users

| Status | Threshold | Interpretation |
|--------|-----------|----------------|
| GREEN | ≥ 50 | Sufficient user base to validate patterns. Enough data for meaningful engagement and conversion metrics. |
| YELLOW | 30–49 | Getting there but sample size is thin. Engagement metrics may not be reliable. Extend Phase 1 by 2 weeks and focus on acquisition. |
| RED | < 30 | Not enough users to learn from. Return to user interviews and demand validation. Revisit Phase 0B channels. |

**How to measure:** Count of rows in `users` table where `deleted_at IS NULL` and `onboarding_completed = true`.

**Why this number:** 50 users is the minimum for detecting meaningful patterns in a consumer product. Below 30, you're reading tea leaves.

---

#### Signal 2: Paying Users (Pro Subscribers)

| Status | Threshold | Interpretation |
|--------|-----------|----------------|
| GREEN | ≥ 20 | Strong proof of willingness to pay. 20 paying users at ₱399 is enough to validate the value proposition and test retention. |
| YELLOW | 10–19 | Some willingness to pay but the conversion funnel may have a leak. Interview the 10 who are paying — what convinced them? Interview 5 who didn't convert — what's missing? |
| RED | < 10 | Fundamental problem with either the product or the pricing. Free users aren't seeing enough value to upgrade. This is a product-market fit issue, not a marketing issue. |

**How to measure:** Count of rows in `subscriptions` table where `status = 'active'` and `tier = 'pro'`.

**Why this number:** 20 paying users × ₱399 = ₱7,980 MRR, which is above the ₱6K MRR threshold (Signal 3). The paying user count validates willingness to pay independently of MRR.

---

### Category 2: Engagement (Are they getting value?)

#### Signal 3: Monthly Recurring Revenue (MRR)

| Status | Threshold | Interpretation |
|--------|-----------|----------------|
| GREEN | ≥ ₱6,000 | Enough revenue to cover Claude API costs (~₱2,000/mo at 20 active Pro users) with margin. Proves the unit economics are directionally correct. |
| YELLOW | ₱3,000–₱5,999 | Revenue is coming in but not covering costs comfortably. Check: are users churning fast (MRR isn't growing) or is the paying user count just low (acquisition problem)? |
| RED | < ₱3,000 | Revenue doesn't cover costs. Either pricing is wrong, too few conversions, or high churn is eating gains. Pause and diagnose. |

**How to measure:** Sum of active subscription amounts from Xendit. Cross-reference with `subscriptions` table.

**Why this number:** ₱6K MRR is the minimum viable revenue from Financial Model v5 — it covers Claude API costs, Supabase Pro, and Cloudflare with ~₱2K buffer.

---

#### Signal 4: Free-to-Paid Conversion Rate

| Status | Threshold | Interpretation |
|--------|-----------|----------------|
| GREEN | ≥ 20% | Excellent for a B2C SaaS with a freemium model. Indicates the Free tier is successfully creating Maria Moments that drive upgrades. |
| YELLOW | 10–19% | Acceptable but investigate. Are Free users engaged but not converting (value gap between Free and Pro)? Or are they dropping off before experiencing a Maria Moment (onboarding issue)? |
| RED | < 10% | The Free-to-Pro bridge is broken. Either the Free tier gives too much value (no reason to upgrade) or too little (users churn before seeing the potential). Review tier boundaries. |

**How to measure:** (Paying users / Total registered users) × 100. Exclude users registered < 14 days (too early to convert).

**Why this number:** 20% conversion in a freemium MSME product is strong. Industry benchmarks for B2C SaaS are 2–5%, but AKBai targets a narrow, high-pain niche where 20% is achievable if the Maria Moment lands.

---

#### Signal 5: 7-Day Retention Rate

| Status | Threshold | Interpretation |
|--------|-----------|----------------|
| GREEN | ≥ 40% | Strong habit formation. Users who come back after a week are forming a pattern — likely around Daily Check-In or Morning Briefing. |
| YELLOW | 25–39% | Some stickiness but not enough habit formation. Check: are users completing onboarding? Are they receiving Morning Briefing? Is the Daily Check-In prompt working? |
| RED | < 25% | Users try it and leave. The first-session experience isn't creating enough value to bring them back. This is the most dangerous signal — no retention means no business. |

**How to measure:** Cohort analysis via PostHog. Of users who registered in Week N, what percentage had at least one session in Week N+1?

**Why this number:** 40% Day-7 retention is the benchmark for "promising" in mobile consumer apps. Below 25% typically means the core loop isn't working.

---

#### Signal 6: Net Promoter Score (NPS)

| Status | Threshold | Interpretation |
|--------|-----------|----------------|
| GREEN | ≥ 30 | Users are actively recommending AKBai. This is the engine for organic word-of-mouth growth in Phase 2. |
| YELLOW | 15–29 | Users are satisfied but not enthusiastic. They're not going out of their way to tell friends. Identify the "would recommend" users and understand what they love. |
| RED | < 15 | Users are indifferent or detractors outnumber promoters. Something fundamental is off — either the product isn't delivering on the promise, or the wrong users are signing up. |

**How to measure:** In-app NPS survey triggered after 14 days of use. Single question: "Gaano ka ka-likely mag-recommend ng AKBai sa kaibigan mong may negosyo?" (0–10 scale). Calculate: %Promoters (9–10) minus %Detractors (0–6).

**Survey timing:** Trigger once per user at Day 14. Do not re-trigger unless the user upgrades tiers (one more survey at Day 7 after upgrade).

**Why this number:** NPS 30+ in a niche B2C product is strong. Below 15 means the viral coefficient will be too low to sustain Phase 2 growth targets without heavy paid acquisition.

---

### Category 3: Economics (Is this a business?)

#### Signal 7: Support Resolution Time

| Status | Threshold | Interpretation |
|--------|-----------|----------------|
| GREEN | < 24 hours | As a solo founder, this means Anton can handle the support volume and resolve issues within a day. The product isn't generating so many issues that support becomes a full-time job. |
| YELLOW | 24–48 hours | Support is starting to strain. Check: are the same issues recurring (product bug vs. user education)? Is the Flag-as-Wrong queue backed up? May need to prioritize a FAQ or automated triage. |
| RED | > 48 hours | Support is unsustainable. Either the product has serious quality issues generating too many tickets, or the user base is growing faster than a solo founder can support. This is a blocker for Phase 2 growth. |

**How to measure:** Track support requests (Messenger DMs, email, in-app Flag-as-Wrong) with timestamps. Measure time from first contact to resolution. Use a simple spreadsheet or Supabase table.

**Why this number:** 24-hour resolution is the standard for a solo-founder operation with 50 users. Beyond 48 hours, user trust erodes — especially in a financial product where mistakes have real consequences.

---

#### Signal 8: Unit Economics — Positive

| Status | Threshold | Interpretation |
|--------|-----------|----------------|
| GREEN | Positive | Revenue per user exceeds cost per user on a monthly basis. The business model works at the individual level. Scaling will amplify, not destroy, the economics. |
| YELLOW | Break-even ± 10% | Close but not conclusive. Check: are heavy users (50 scans/month) subsidized by light users? Is the circuit breaker firing too often? May need to adjust scan limits or pricing. |
| RED | Negative | Each user costs more to serve than they pay. This is fatal at scale. Diagnose: is it API costs (model routing issue), infrastructure costs (architecture issue), or support costs (product quality issue)? |

**How to measure:**
- **Revenue per Pro user:** ₱399/month
- **Cost per Pro user:** Claude API (Sonnet calls × cost + Haiku calls × cost) + Supabase pro-rated + Resend pro-rated
- **Target:** Revenue per user > Cost per user with at least 40% gross margin

**Per Financial Model v5:** Pro gross margin target is ~85%. Receipt scan cost is ₱0.16/scan. At 50 scans/month = ₱8 in scan costs. Sonnet reasoning calls add ~₱30–50/month for an active user. Total AI cost per Pro user: ~₱40–60/month. Revenue: ₱399. Margin: ~85%. This should be GREEN unless something goes wrong with model routing or users find ways to generate excessive API calls.

---

## Running the Sense Check

### Step-by-Step Process

1. **Gather data** for all 8 signals. Use PostHog, Supabase queries, Xendit dashboard, and the NPS survey results.

2. **Score each signal** as GREEN, YELLOW, or RED using the thresholds above.

3. **Compute the verdict:**

| Verdict | Criteria |
|---------|----------|
| **GREEN — Go to Phase 2** | All 8 signals are GREEN |
| **YELLOW — Conditional Go** | 6–7 signals are GREEN, remaining are YELLOW (not RED) |
| **RED — No-Go** | Any signal is RED, or 3+ signals are YELLOW |

4. **Document the assessment** using the template below.

5. **Decide next steps** based on the verdict.

### Output Template

```markdown
## Sense Check Gate Assessment — [Date]

### Signal Scores

| # | Signal | Category | Threshold | Actual | Status | Notes |
|---|--------|----------|-----------|--------|--------|-------|
| 1 | Registered Users | Traction | ≥ 50 | [X] | [G/Y/R] | |
| 2 | Paying Users | Traction | ≥ 20 | [X] | [G/Y/R] | |
| 3 | MRR | Engagement | ≥ ₱6,000 | [₱X] | [G/Y/R] | |
| 4 | Free-to-Paid Conversion | Engagement | ≥ 20% | [X%] | [G/Y/R] | |
| 5 | 7-Day Retention | Engagement | ≥ 40% | [X%] | [G/Y/R] | |
| 6 | NPS | Engagement | ≥ 30 | [X] | [G/Y/R] | |
| 7 | Support Resolution | Economics | < 24 hrs | [X hrs] | [G/Y/R] | |
| 8 | Unit Economics | Economics | Positive | [+/-] | [G/Y/R] | |

### Verdict: [GREEN / YELLOW / RED]

**GREEN signals:** [X]/8
**YELLOW signals:** [X]/8
**RED signals:** [X]/8

### Analysis
[What's working, what's not, what needs attention]

### Recommended Action
[Specific next steps based on the verdict]

### If YELLOW — Focus Areas
[Which signals need improvement and proposed sprint tasks to address them]

### If RED — Diagnostic Questions
[What needs to be investigated before deciding next steps]
```

---

## Monthly Check-In (Months 3–5)

Starting from Month 3 of Phase 1, run an informal version of the Sense Check monthly. The purpose isn't to gate anything — it's to detect problems early enough to course-correct.

For the monthly check-in, you don't need all 8 signals (NPS requires 14 days of user data, unit economics need more volume). Focus on the leading indicators:

| Month | Signals to Check | Why |
|-------|-----------------|-----|
| Month 3 | Registered users, 7-day retention, Daily Check-In completion rate | Are people showing up and coming back? |
| Month 4 | Add: Paying users, free-to-paid conversion, MRR | Is the conversion engine working? |
| Month 5 | Add: NPS, support resolution, unit economics | Full picture — are we on track for the Month 6 gate? |
| Month 6 | All 8 signals — formal Sense Check Gate | Go/No-Go decision |

---

## Common Failure Patterns

These are the most likely ways the Sense Check fails, based on comparable MSME SaaS products:

**Pattern 1: High registration, low retention (Signal 1 GREEN, Signal 5 RED)**
Users sign up out of curiosity but don't come back. The onboarding isn't creating a Maria Moment fast enough. Fix: shorten time-to-first-insight — can KA surface something valuable during Kilala Kita itself?

**Pattern 2: Good retention, low conversion (Signal 5 GREEN, Signal 4 RED)**
Users love the Free tier but don't upgrade. The Free tier is giving too much value or the Pro upgrade path isn't compelling enough. Fix: review tier boundaries — is the Free-to-Pro value gap clear?

**Pattern 3: Good conversion, high churn (Signal 4 GREEN, Signal 3 YELLOW)**
Users convert to Pro but cancel quickly. The product doesn't deliver sustained value month over month. Fix: check if Morning Briefing and Daily Check-In are creating daily habits.

**Pattern 4: Everything looks good except unit economics (Signals 1–7 GREEN, Signal 8 RED)**
Users love it and pay for it but it costs more to serve them than they pay. Usually a model routing issue — too many Sonnet calls where Haiku would suffice. Fix: audit Claude API usage per feature and optimize routing.
