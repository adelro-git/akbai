# AKBai Weekly Metrics Review
**Week of:** March 18, 2026 (Sunday)

---

## Executive Summary
You're **70% of the way to Phase 1 user target** with solid Pro subscriber traction, but churn and error spikes need immediate attention. Revenue is tracking well, but product stability and subscriber retention are the critical levers this week.

---

## Key Metrics at a Glance

| Metric | This Week | Phase 1 Target | Progress | Status |
|--------|-----------|----------------|----------|--------|
| **Registered Users** | 35 | 50 | 70% | ✅ On track |
| **Pro Subscribers** | 12 | 20 | 60% | ⚠️ Below pace |
| **Business Subscribers** | 0 | — | — | 🔴 Zero adoption |
| **MRR** | ₱4,788 | ₱6,000–₱10,000 | 48–80% | ⚠️ Early stage |
| **Uptime** | 99.8% | Industry standard | Excellent | ✅ Solid |
| **Product Errors** | 2 new | Trending | — | 🔴 Watch |
| **Churn** | 1 user (payment) | — | — | 🟡 Minor but concerning |

---

## Detailed Analysis

### 1. User Growth (35 registered)
- **Velocity:** Steady progress toward 50-user Phase 1 gate
- **Insight:** You're building early adopter base. Conversion to Pro is the next lever.
- **Action needed:** Track user activation metrics (receipt scans, feature usage) to identify which users are path-to-conversion

### 2. Pro Tier Subscription (12 of 20 target)
- **Revenue per subscriber:** ₱399/month × 12 = **₱4,788 MRR**
- **Gap:** 8 more subscribers needed to hit Phase 1 minimum
- **Concern:** Business tier (₱899/mo) has 0 uptake—verify pricing strategy and messaging fit market
- **Action needed:**
  - Identify why Pro convert but Business doesn't (feature gap? pricing? positioning?)
  - Analyze which users are closest to upsell

### 3. Churn (1 payment failure)
- **Impact:** Single user, but payment-failure churn is **preventable**
- **Root cause:** Payment processing, insufficient funds, or expired card
- **Action needed:**
  - Implement automated payment retry logic (3-5 days later)
  - Add in-app notification/grace period before cancellation
  - This alone could prevent 15–20% of churn

### 4. Sentry Errors (2 new)
- **Severity:** Unclear without error context, but 2 new errors in a young product need triage
- **Action needed:**
  - **Immediate:** Read Sentry to classify by severity (critical/major/minor)
  - **This week:** Fix any critical errors blocking user flows
  - **Monitor:** Set up Sentry alerts for error spike thresholds (e.g., 5+ errors/day)

### 5. Uptime (99.8%)
- **Status:** Excellent. Exceeds industry standard and user expectations at this stage
- **Action:** Keep monitoring but no action needed this week

---

## Financial Health

| Line Item | Amount | Notes |
|-----------|--------|-------|
| MRR (12 Pro @ ₱399) | ₱4,788 | 48–80% of Phase 1 target |
| ARR (projected) | ₱57,456 | Growing, but Phase 1 gate requires ₱6k–₱10k MRR by Month 6 |
| Churn (weekly) | 1 user | ₱399 impact; prevent via retry logic |

**Runway:** At current growth, you'll hit ₱6k MRR by Month 4–5 if you add 1–2 Pro subscribers per week.

---

## Priorities for This Week

### 🔴 Critical (Do This Week)
1. **Triage Sentry errors** — Identify severity and impact. Fix critical blockers.
2. **Implement payment retry logic** — Prevent preventable churn from payment failures.
3. **Analyze Business tier gap** — Why 0 Business subscribers? Is it positioning, pricing, or missing features?

### 🟡 Important (Next 2 Weeks)
4. **Activation audit** — Which of your 35 users are actively using receipt scan? Scan-to-conversion is your growth lever.
5. **Upsell readiness** — Identify your 8 closest users to Pro conversion. Are they in-app behavior triggers or needs-based?

### 🟢 Nice-to-Have (Month)
6. **Uptime monitoring dashboard** — Formalize 99.8% tracking with alerts
7. **Cohort retention analysis** — Segment users by signup week to track lifetime

---

## Week-over-Week Outlook

- **If churn continues at 1/week:** You lose ₱399/month. At 35 users, that's 2.9% weekly churn—not yet alarming, but trend to monitor.
- **If you add 2 Pro subscribers this week:** You hit ₱5,586 MRR (93% closer to Phase 1 minimum).
- **If you fix the 2 Sentry errors and prevent payment churn:** User experience improves, reducing involuntary churn.

---

## Recommended Actions (Ranked by Impact)

| Action | Impact | Effort | Owner | Deadline |
|--------|--------|--------|-------|----------|
| Fix critical Sentry errors | High | Medium | You | This week |
| Add payment retry logic | High | Medium | You | This week |
| Audit why Business tier has 0 adoption | Medium | Low | You | This week |
| Activation funnel analysis | Medium | Medium | You | Next 3 days |
| Upsell outreach to 8 near-converts | Medium | Low | You | This week |

---

## Bottom Line

**You're building momentum.** 70% to Phase 1 user gate, revenue tracking at 48–80% of target. The two levers to accelerate:

1. **Reduce churn** (prevent payment failures, add retry logic)
2. **Activate your existing users** (scan behavior → Pro conversion)

Focus on these two this week, and you'll be at ₱6k MRR by end of next week.

---

*Next Sunday metrics review target: 40 registered users, 14 Pro subscribers, ₱5,600+ MRR, 0 new Sentry errors.*
