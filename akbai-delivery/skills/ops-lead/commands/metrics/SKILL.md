---
name: /metrics
description: >
  Review business metrics and provide analysis. Inputs: MRR by tier, registered users, paying users,
  churn, weekly active rate, receipt scan volume, support load, NPS. Outputs: MRR dashboard summary +
  trend analysis + LTV/CAC ratio + churn analysis + feature adoption + single highest-leverage
  recommendation backed by data. Triggers: "metrics", "business review", "revenue check", "MRR",
  "churn analysis", "financial review", "unit economics", "performance review".
---

# /metrics — Review Business Metrics & Analysis

Analyze AKBai's business metrics and provide data-driven recommendations.

## Before Starting

Read these shared context files:
- `/AKBai/akbai-delivery/shared/project-context.md` — §4 Tier Structure, §7 Unit Economics (LTV, CAC, break-even), §2 Target Market (personas), Founder constraints (§10)
- `/AKBai/akbai-delivery/shared/glossary.md` — Tier definitions (Free, Pro, Business, Scale), Pricing terms, Phase terms
- `/AKBai/akbai-delivery/shared/gap-registry.md` — 8 CRITICAL gates for launch. Unit economics must validate before Phase 2 gate.

Also read:
- `../references/ops-playbook.md` (if exists) — Support triage, ops cadence, data ingestion flows
- `../references/onboarding-sop.md` (if exists) — Onboarding steps, expectations, benchmarks

Key data points (from project-context.md §7):
- **Receipt scan cost:** ₱0.16/scan
- **Pro LTV:** ₱9,975 (25-month avg lifetime)
- **Blended CAC:** ₱110
- **LTV/CAC ratio:** 91x (target: maintain >10x)
- **Break-even month:** Month 7
- **Pro gross margin:** ~85%
- **Phase 1 target:** 50 registered users, 20 paying Pro, ₱6K–₱10K MRR
- **Phase 2 target:** 200 registered users, 80 paying (Pro + Business), ₱30K–₱50K MRR

## Workflow

### 1. Gather Current Metrics Data

Ask Anton or the user to provide the following data (or check Supabase dashboard + Xendit API):

**Essential metrics (must-haves):**
- **MRR (Monthly Recurring Revenue)**
  - Total current MRR (all tiers combined)
  - MRR by tier: Free (N/A), Pro (₱399/user), Business (₱899/user)
  - MRR trend: last 3 months (growing/flat/declining)
- **User counts**
  - Total registered users (all time)
  - Paying users breakdown: Pro, Business, annual
  - Free users
- **Churn rate (monthly)**
  - % of Pro users who churned last month
  - % of Business users who churned last month
  - Reason for churn (if tracked: price, doesn't work, found alternative, life change, etc.)
- **Weekly active rate**
  - % of registered users active at least once per week
- **Receipt scan volume**
  - Total scans this month
  - Scans per paying user (average)
  - Scan accuracy rate (% successfully categorized)
- **Support load**
  - Support tickets this month
  - Average resolution time
  - Most common issues (feature requests vs bugs vs confusion)
- **Feature adoption**
  - % of Pro users who've used: Resibo Scanner, Saan Napunta, Ang Umaga Mo, Deadline Watcher, Reply Drafter, Costing Cards, Invoice Cards
  - Usage frequency (daily, weekly, monthly, once)
- **NPS (Net Promoter Score)** (if available)
  - From feedback or in-app surveys

**Optional but valuable:**
- **Activation rate:** % of new signups who complete Kilala Kita (onboarding)
- **First-value moment:** % who see the "Maria Moment" (first actionable insight)
- **Trial-to-paid conversion:** % of Free tier users who convert to Pro
- **Retention by cohort:** % of users from Month N who are still active in Month N+1
- **CAC spent:** How much was spent on customer acquisition (ad spend, affiliate payouts, etc.)
- **Customer feedback themes:** Qualitative feedback from 10–15 recent users (verbatim quotes)

### 2. Generate MRR Dashboard Summary

Create a simple dashboard view:

```markdown
## AKBai — MRR Dashboard Summary

**Current Month:** [Month] 2026
**Report Date:** [Date]

### Revenue Overview

| Metric | Current | Target (Phase 1) | Status | Notes |
|--------|---------|------------------|--------|-------|
| **Total MRR** | ₱[X] | ₱6K–₱10K | 🟢 / 🟡 / 🔴 | [On track / Behind / Exceeding] |
| **Pro MRR** | ₱[X] | ₱5K–₱8K | — | [Y paying users × ₱399] |
| **Business MRR** | ₱[X] | ₱1K–₱3K | — | [Z paying users × ₱899] |
| **Registered Users** | [A] | 50 | — | [A users signed up] |
| **Paying Users (Pro)** | [B] | 20 | — | [B Pro subscribers] |
| **Paying Users (Business)** | [C] | 0 | — | [C Business tier (Phase 2)] |
| **Free Users** | [A–B–C] | 30 | — | [Not paying] |

### MRR Trend (Last 3 Months)

| Month | MRR | Users (Pro) | Churn | Notes |
|-------|-----|-----------|-------|-------|
| [Month–2] | ₱[X–2] | [N–2] | — | |
| [Month–1] | ₱[X–1] | [N–1] | [%] | |
| [Current] | ₱[X] | [N] | [%] | |

**Trend:** [Growing ↗ / Flat → / Declining ↘]
**Monthly growth rate:** [+X% / 0% / –X%]

### Unit Economics Snapshot

| Metric | Value | Health |
|--------|-------|--------|
| **Pro LTV** | ₱[X] (actual) vs ₱9,975 (target) | ✅ / ⚠️ |
| **Blended CAC** | ₱[Y] (actual) vs ₱110 (target) | ✅ / ⚠️ |
| **LTV/CAC ratio** | [Z]x vs 91x (target) | ✅ / ⚠️ |
| **Pro gross margin** | [M%] vs ~85% (target) | ✅ / ⚠️ |
| **Monthly churn** | [C%] | ⚠️ (target: <5%) |
| **Receipt scan volume** | [S] scans/month | — |
| **Receipt scan revenue** | ₱[S × 0.16] revenue from scans | — |
| **Receipt scan margin** | ~85% (minimal cost after API) | ✅ |

### Key Indicators at a Glance

- **Activation rate (Kilala Kita completion):** [%] users (target: >80%)
- **First-value rate (Maria Moment):** [%] users see actionable insight (target: >70%)
- **Weekly active rate:** [%] of users (target: >60%)
- **Trial-to-paid:** [%] of Free users convert to Pro (target: >8%)
- **NPS Score:** [X] (target: >30 for early-stage)
- **Support tickets:** [T] this month, avg [R] hours to resolve

---

## 3. Trend Analysis

Write a 2–3 sentence summary of what the numbers tell us:

**Example 1 (Growing):**
"MRR grew from ₱2,500 (Month 1) to ₱7,200 (Month 3) — a 188% increase driven by steady user growth (8 → 18 Pro users) and low churn (2%). At this growth rate, you'll hit Phase 1 targets (₱6K–₱10K MRR, 20 Pro users) by end of Month 4. No red flags."

**Example 2 (Declining):**
"MRR dropped from ₱5,500 (Month 1) to ₱3,800 (Month 3) due to 28% monthly churn on Pro tier. While 5 new users signed up, 4 existing users left. Primary churn reason: 'feature not working as advertised' (3/4 users). This requires immediate product fix, not growth hacks."

**Example 3 (Flat):**
"MRR has been flat at ₱4,200 for 2 months despite 3 new user signups. Why? Weak activation (only 40% of new users complete Kilala Kita). They're signing up but not seeing the Maria Moment. Focus should be onboarding, not acquisition."

### 4. Churn Analysis

If churn > 5% per month, dig deeper:

```markdown
## Churn Deep Dive

**Monthly churn rate:** [X%]
**Users churned this month:** [N] out of [M] Pro subscribers

### Why are users leaving?

| Reason | Count | % | Action |
|--------|-------|---|--------|
| Feature doesn't work as expected | [A] | [A/N%] | Product fix required (sprint priority) |
| Too expensive for current use | [B] | [B/N%] | Pricing strategy review or feature alignment |
| Found alternative / competitor | [C] | [C/N%] | Competitive review (what are they using?) |
| Life change (closed business, switched jobs) | [D] | [D/N%] | Natural attrition (expected, not fixable) |
| Not using the app regularly | [E] | [E/N%] | Engagement problem (feature adoption or onboarding?) |
| Other / unclear | [F] | [F/N%] | Follow up for qualitative feedback |

**Key insight:** [If product issues dominate, fix product. If pricing dominates, review plan. If not using, it's engagement.]

### Cohort retention example:

| Cohort | Month 1 | Month 2 | Month 3 | Month 4 | Month 5 |
|--------|---------|---------|---------|---------|---------|
| Month 1 users (30) | 30 | 28 | 25 | 24 | 22 |
| Month 2 users (25) | — | 25 | 22 | 20 | 19 |
| Month 3 users (20) | — | — | 20 | 18 | 16 |

**Retention trend:** [Improving / Stable / Declining]

**Interpretation:**
- If stable or improving: Users stick around once they start paying. Good sign.
- If declining: Something breaks after first month. UX issue, or feature doesn't deliver promised value?
```

### 5. Feature Adoption Analysis

Which features drive engagement and retention?

```markdown
## Feature Adoption

**Hypothesis:** Users who use receipts scanner (Resibo Scanner) are more engaged and less likely to churn.

### Adoption by feature:

| Feature | % Users | Engagement | Churn Impact |
|---------|---------|------------|--------------|
| Resibo Scanner | [%] | [Daily/Weekly/Monthly/One-time] | [Low churn / High churn] |
| Saan Napunta (expense dashboard) | [%] | [Daily/Weekly/Monthly/One-time] | [Low churn / High churn] |
| Ang Umaga Mo (morning briefing) | [%] | [Daily/Weekly/Monthly/One-time] | [Low churn / High churn] |
| Deadline Watcher (BIR reminders) | [%] | [Daily/Weekly/Monthly/One-time] | [Low churn / High churn] |
| Reply Drafter | [%] | [Daily/Weekly/Monthly/One-time] | [Low churn / High churn] |
| Costing Cards | [%] | [Daily/Weekly/Monthly/One-time] | [Low churn / High churn] |
| Invoice Cards | [%] | [Daily/Weekly/Monthly/One-time] | [Low churn / High churn] |

**Key finding:** [Feature X has highest adoption and lowest churn among users who use it. Feature Y has <20% adoption — reason: unclear UX? Not discovering feature? Not relevant?]
```

### 6. LTV/CAC Analysis

Are you growing sustainably?

```markdown
## Unit Economics Health Check

**LTV (Lifetime Value):**
- Pro tier: ₱[X] (calculated: avg monthly revenue × avg lifetime months)
- Target from model: ₱9,975 (based on 25-month avg lifetime at ₱399/month)
- Status: [On track / Below target / Exceeding]

**CAC (Customer Acquisition Cost):**
- Current: ₱[Y] (total spend / users acquired)
- Target from model: ₱110
- Status: [On track / Below target / Exceeding]

**LTV/CAC Ratio:**
- Current: [Z]x
- Target: 91x (minimum acceptable: 3x to 5x break-even; stretch goal: 10x+)
- Status: [Healthy / Warning / Critical]

**Interpretation:**
- If LTV/CAC > 10x: You can afford to spend more on acquisition. Growth is profitable.
- If LTV/CAC 3x–10x: Sustainable but margins are tight. Growth must be organic (word-of-mouth).
- If LTV/CAC < 3x: You're spending more to acquire than you'll ever make back. Pause acquisition; focus on retention or unit economics fix.

**Action if below target:**
- Option A: Improve retention (reduce churn) to increase LTV
- Option B: Increase pricing to increase revenue per user
- Option C: Find cheaper acquisition channels (organic, referral, partnerships)
- Option D: Reduce CAC by optimizing onboarding (faster to value = lower support cost)
```

### 7. Single Highest-Leverage Recommendation

Based on data, identify ONE thing Anton should focus on in the next 2-week sprint (10–15 hours).

**Decision tree:**

```
IF [MRR] < ₱4,000 AND [Activation] < 50%
  → RECOMMENDATION: Fix onboarding (Kilala Kita → Maria Moment)
  → Effort: 5–10 hours
  → Impact: 30% more users see value, 20% churn reduction expected
  → Why? Users signing up but not activating = acquisition waste

IF [Churn] > 10% AND [Product issues] > 50% of feedback
  → RECOMMENDATION: Fix top product issue (e.g., Receipt scanner failing on certain receipt types)
  → Effort: 5–15 hours (depends on issue)
  → Impact: 50%+ churn reduction expected
  → Why? Retention beats acquisition 5:1 in ROI

IF [Weekly active] < 40%
  → RECOMMENDATION: Add proactive re-engagement (Deadline Watcher alerts + Morning Briefing)
  → Effort: 3–8 hours
  → Impact: 25% increase in weekly active rate expected
  → Why? Users aren't coming back. Push them back in (but respectfully)

IF [Feature adoption] < 20% AND [Receipt scanner adoption] > 60%
  → RECOMMENDATION: Promote underused features (e.g., Costing Cards for Maria, Invoice Cards for Jose)
  → Effort: 2–5 hours (copy, tutorial, in-app prompts)
  → Impact: 10% MRR uplift from feature upsell
  → Why? Users are using ONE feature; they don't know about others

IF [LTV/CAC] > 10x AND [MRR growth] > 20%/month
  → RECOMMENDATION: Invest in acquisition (content, paid ads, partnerships)
  → Effort: varies (but delegation-friendly)
  → Impact: 2x user growth at same profitability
  → Why? You've found product-market fit; scale it

IF [NPS] < 30
  → RECOMMENDATION: Run 5 user interviews to find the core problem
  → Effort: 3–5 hours
  → Impact: 1–2 major product improvements identified
  → Why? Low NPS means you're not delivering core promise; can't scale unhappy product
```

### 8. Present Recommendation Backed by Data

Format:

```markdown
## 🎯 Highest-Leverage Recommendation for Next Sprint

**Focus Area:** [What to do]

**Current State (Data):**
- Metric A: [X] (target: Y, gap: Z)
- Metric B: [X] (target: Y, gap: Z)
- [Why this is a problem]

**Recommended Action:**
1. [Step 1: Specific, measurable task]
2. [Step 2]
3. [Step 3]

**Expected Impact:**
- [Specific metric] → [Direction] by [amount] (e.g., "Churn → ↓ from 15% to 8%")
- [Another metric] → [Direction] by [amount]
- [Time horizon: by end of sprint / within 2 weeks]

**Effort Estimate:** [5–10 hours] (fits Anton's sprint capacity)

**Why This Over Alternatives:**
- [Reason: ROI is highest / fixes critical blocker / unblocks other work]

**How to Measure Success:**
- [Metric 1] will be [target]
- [Metric 2] will be [target]
- [By when?]

**Fallback If Stuck:**
- [If this approach doesn't work, try: ...]

---

### Example 1: Onboarding Fix

**Focus Area:** Increase Kilala Kita (onboarding) completion rate

**Current State (Data):**
- Activation rate: 42% (target: >80%)
- MRR: ₱3,200 (target: ₱6K–₱10K for Phase 1)
- Users signing up but not seeing Maria Moment: 58% drop-off after signup

**Recommended Action:**
1. Audit Kilala Kita flow: (1) Which step has highest drop-off? (2) Why?
2. Hypothesis: Step 3 (BIR consent screen) is confusing — users don't understand why we're asking
3. Redesign Step 3: (1) Add 1-sentence explanation in Taglish, (2) Include example ("So we know you're self-employed + can give you the right BIR reminders"), (3) Make checkbox easier to read
4. Launch A/B test: 50% see old flow, 50% see new flow
5. Measure: Drop-off at Step 3 should decrease by 30%+

**Expected Impact:**
- Activation rate → ↑ from 42% to 60%+ (18pp improvement)
- MRR → ↑ from ₱3,200 to ₱4,200+ (new paying users from higher activation)
- Time horizon: 2 weeks (1 week to design/test, 1 week to measure)

**Effort Estimate:** 8 hours
- 2 hours: audit + hypothesis
- 3 hours: design + implement A/B test
- 2 hours: launch + monitor
- 1 hour: write follow-up

**Why This Over Alternatives:**
- Highest ROI: 18 new activated users (if current cohort is 30) × ₱399 = ₱7,182 new MRR potential
- Fixes root problem (not enough people seeing value), not a symptom
- Unblocks Phase 1 target (20 Pro users)

**How to Measure Success:**
- Kilala Kita completion rate: >60% (from 42%)
- Step 3 drop-off: <10% (from current ~35%)
- New Pro signups: +5–10 in next 2 weeks

**Fallback If Stuck:**
- If drop-off doesn't move, try reducing total steps (Kilala Kita → 3 steps instead of 5)
- Or: survey recent drop-outs directly ("Why didn't you finish onboarding?")
```

### Example 2: Churn Fix

**Focus Area:** Reduce Pro churn from 18% → <8%

**Current State (Data):**
- Monthly churn: 18% (4 of 22 Pro users left last month)
- Main reason: "Receipt scanner doesn't work reliably" (3 of 4 users cited this)
- Impact: MRR down ₱1,600 last month due to churn

**Recommended Action:**
1. Get 3 specific examples of receipt scanner failures (from churned users or support queue)
2. Replicate locally (test these specific receipts with Claude Haiku Vision)
3. Identify pattern (e.g., "thermal print fades → Haiku can't read")
4. Fix: Improve preprocessing (image contrast enhancement) OR fallback to manual entry with pre-filled guide
5. Test on 10 diverse receipts (SM, Shopee waybill, faded thermal, handwritten notes)
6. Notify churned users: "Hey, we fixed the scanner! Come back for a free month?"

**Expected Impact:**
- Receipt scan success rate → ↑ from [current] to >90%
- Churn → ↓ from 18% to <8% (win back 2–3 users)
- MRR → +₱800–₱1,200 (from churn reduction + win-back)
- Time horizon: 2 weeks

**Effort Estimate:** 12 hours
- 2 hours: bug investigation
- 5 hours: fix + test (image preprocessing is straightforward)
- 3 hours: QA + edge cases
- 2 hours: notify users + monitor

**Why This Over Alternatives:**
- Highest impact: Prevents ₱1,600+/month churn recurring
- Fixes core product promise (receipts scanner)
- Unblocks Phase 2 growth (can't scale with broken core feature)

**How to Measure Success:**
- Receipt scan accuracy: >90%
- Churn rate: <8% (trend over next 4 weeks)
- Win-back: 2+ churned users re-subscribe

**Fallback If Stuck:**
- If image processing too complex: Add manual entry fallback with pre-filled categories (still solves user problem)
- Or: Add "Flag as Wrong" feature so users can correct bad scans (improves trust even if scan isn't perfect)
```

### Example 3: Growth Investment

**Focus Area:** Invest in acquisition to hit Phase 1 targets

**Current State (Data):**
- MRR: ₱8,800 (Phase 1 target: ₱6K–₱10K ✅ On track)
- Pro users: 22 (Phase 1 target: 20 ✅ Met)
- LTV/CAC: 90x (well above 10x threshold)
- Unit economics: Healthy

**Recommended Action:**
1. Allocate ₱2,000 for 2-week paid acquisition test (Google Search Ads targeting "freelance business accounting Philippines")
2. Expected CAC: ₱200–₱300 per user (still well below ₱9,975 LTV)
3. Target: 5–7 new Pro users in 2 weeks = ₱1,995–₱2,793 MRR uplift
4. Measure: CAC, activation rate, 30-day retention

**Expected Impact:**
- MRR → ↑ from ₱8,800 to ₱10,795+ (overshoot Phase 1 target)
- Phase 2 readiness: 27 Pro users (closer to Phase 2 target of 80)
- Time horizon: 2 weeks (experiment), then 4 weeks (measure retention)

**Effort Estimate:** 6 hours
- 2 hours: set up Google Ads campaign
- 1 hour: landing page prep (link to Kilala Kita)
- 1 hour: daily monitoring
- 2 hours: measure + analysis

**Why This Over Alternatives:**
- Unit economics support it: 90x LTV/CAC = can afford to spend more
- Phase 1 targets within reach; acquisition accelerates Phase 2 readiness
- Low-risk experiment (₱2K is small bet)

**How to Measure Success:**
- CAC: ₱200–₱300
- Activation rate: >70% (from paid channel, expect lower than organic)
- 30-day retention: >90%
- MRR: +₱2,000 from 5–7 new users

**Fallback If Stuck:**
- If CAC too high: Pause ads, focus on organic (referral, content, partnerships)
- Or: Try different targeting (Facebook/Shopee audience instead of Google Search)
```
```

### 9. Output Format — Complete Metrics Report

Present the full report in this structure:

```markdown
# AKBai Metrics Report

**Report Date:** [Date]
**Reporting Period:** [Month] 2026
**Prepared by:** Anton del Rosario

---

## 1. MRR Dashboard

[Table from §2 above]

---

## 2. Trend Analysis

[Narrative from §3 above]

---

## 3. Churn Deep Dive

[If applicable, from §4 above]

---

## 4. Feature Adoption

[From §5 above]

---

## 5. Unit Economics

[From §6 above]

---

## 6. 🎯 Highest-Leverage Recommendation

[From §8 above — the single most important thing to do next]

---

## 7. Phase Gate Status

**Current phase:** Phase [X] — [Phase Name]
**Phase targets:**
- [Target 1]: [Current status] [On track / Behind / Exceeding]
- [Target 2]: [Current status]
- [Target 3]: [Current status]

**Go/No-Go for next phase:** [GREEN / YELLOW / RED + reason]

---

## 8. Next Steps (This Sprint)

1. [Recommendation item]
2. [Measurement plan]
3. [Follow-up metrics to track]

---

## 9. Metrics to Watch (Ongoing)

- [Key metric 1]: Current [X], target [Y], by [date]
- [Key metric 2]: Current [X], target [Y], by [date]
- [Key metric 3]: Current [X], target [Y], by [date]

---

**Report ends**
```

## Tips for Success

1. **Data source:** Get metrics from Supabase (user count, churn), Xendit (MRR, subscription status), PostHog (feature adoption), Sentry (support load). Don't guess.

2. **Monthly cadence:** Run /metrics every 4 weeks at minimum. Weekly if you're optimizing hard.

3. **Ask the user first:** If data isn't available, ask Anton for numbers. Don't make up metrics.

4. **Focus on one lever at a time:** Too many priorities = none get done. Pick THE highest-leverage item per sprint.

5. **Data > gut feeling:** "I think users want X feature" is weaker than "Y% of users requested X feature in support queue."

6. **LTV/CAC is your northstar:** If this ratio is >10x, you can grow. If <3x, you have a unit economics problem that acquisition won't fix.

7. **Churn is king:** 10% monthly churn erases 2+ months of growth. Focus on retention before acquisition.

8. **Celebrate progress:** If MRR is growing and churn is <5%, you're tracking Phase 1 targets. Say so.

## Cross-Skill Handoffs

If you need:
- **Product roadmap prioritization?** Delegate to product-owner or project-manager.
- **Financial projections for funding?** Delegate to solutions-architect (has financial model).
- **Persona deep-dive for feature?** Delegate to marketing-lead.
- **Tech architecture for growth?** Delegate to fullstack-engineer or solutions-architect.

Otherwise, own the metrics analysis end-to-end.

## Example: Real Scenario

**User asks:** "We're at ₱6,200 MRR with 15 Pro users. Should we start paid ads?"

**Response:**

```markdown
Let me pull the data first. You have:
- MRR: ₱6,200 ✅ (Phase 1 lower target: ₱6K)
- Pro users: 15 (Phase 1 target: 20, need 5 more)
- LTV/CAC: [Need to know CAC so far — how much have you spent on acquisition?]

Let me calculate:
- If CAC = ₱150 (blended from referrals + own effort):
  - LTV/CAC = ₱9,975 / ₱150 = 66x ✅ Healthy
  - You can afford to spend up to ₱1,500 to acquire one user (still hit 3x LTV breakeven)

**So: YES, you can afford paid ads.**

But before you do, I need 3 more data points:
1. What's your activation rate? (% completing Kilala Kita)
   - If <60%: Fix onboarding first. Don't throw money at broken funnel.
2. What's your churn?
   - If >10%: Fix retention first. Acquisition will bleed out.
3. How many are weekly active?
   - If <50%: Add re-engagement (Deadline Watcher alerts). Then ads.

Gut feel: If activation and retention are healthy (>60% and <5% churn), you're ready. If not, spend the sprint fixing those, THEN do paid ads in 2–3 weeks.

Want me to run a full audit?
```
