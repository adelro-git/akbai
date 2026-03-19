# AKBai — Revenue Tracking & Flag-as-Wrong Reference
> Used by: ops-lead
> Last updated: March 2026 | Source: Financial Model v5, Operations Playbook v7, Roadmap v14

---

## Table of Contents

1. Monthly MRR Tracking Framework
2. Unit Economics Benchmarks
3. Churn Analysis
4. Flag-as-Wrong Review Process
5. Sunday Metrics Template

---

## 1. Monthly MRR Tracking Framework

MRR (Monthly Recurring Revenue) is the single most important number for AKBai. Track it on the 1st of every month, with a quick pulse check every Sunday.

### MRR Calculation

```
MRR = (Pro subscribers × ₱399) + (Business subscribers × ₱899) + (Scale subscribers × ₱1,499)

Net New MRR = New MRR + Expansion MRR - Churned MRR

Where:
  New MRR       = MRR from brand-new subscribers this month
  Expansion MRR = MRR from upgrades (Free→Pro, Pro→Business, etc.)
  Churned MRR   = MRR lost from cancellations or downgrades
```

### MRR Tracking Table (update monthly)

| Month | Pro Subs | Biz Subs | MRR (₱) | New MRR | Churned MRR | Net New MRR | Growth % |
|-------|----------|----------|---------|---------|-------------|-------------|----------|
| M1    |          |          |         |         |             |             |          |
| M2    |          |          |         |         |             |             |          |
| ...   |          |          |         |         |             |             |          |

### Phase Targets (from Financial Model v5)

| Phase | Target MRR | Target Paying Users | Timeline |
|-------|-----------|--------------------:|----------|
| Phase 1 end (M6) | ₱6,000–₱10,000 | 20 Pro | Month 6 |
| Phase 2 end (M12) | ₱30,000–₱50,000 | 80 (Pro + Business) | Month 12 |
| Phase 3 end (M18+) | ₱100,000–₱200,000 | 200 (all tiers) | Month 18+ |

### Revenue Data Sources

- **Xendit dashboard:** Actual payment collections, failed payments, refunds
- **Supabase `subscriptions` table:** Current tier status per user, renewal dates
- **Supabase `webhook_events` table:** Payment event log (idempotent)

Always reconcile Xendit with Supabase. Discrepancies = a bug or a webhook that didn't process correctly.

---

## 2. Unit Economics Benchmarks

These are the numbers from Financial Model v5 that ops-lead should know cold. When any metric drifts from these targets, surface it as a yellow or red flag.

| Metric | Target | Red Flag Threshold | Source |
|--------|--------|-------------------|--------|
| Receipt scan cost | ₱0.16/scan | >₱0.25/scan (model cost increase) | Claude API billing |
| Pro LTV | ₱9,975 | <₱4,000 (churn too high) | Retention data |
| Blended CAC | ₱110 | >₱500 (acquisition too expensive) | Marketing spend / new users |
| LTV/CAC ratio | 91x | <3x (unsustainable) | Calculated |
| Pro gross margin | ~85% | <70% (cost structure broken) | Revenue - COGS |
| Break-even month | Month 7 | If not profitable by M9, reassess | P&L |
| Free-to-paid conversion | Target 15%+ | <10% (funnel broken) | User data |
| Monthly churn | Target <3% | >5% (retention crisis) | Subscription data |

### Cost Tracking

Key costs to monitor monthly:

| Cost Item | Expected (Phase 1) | Where to Check |
|-----------|-------------------|---------------|
| Claude API | ₱2,000–₱5,000/mo | Anthropic dashboard |
| Supabase | Free tier → ₱1,430/mo (Pro) | Supabase billing |
| Cloudflare Pages | Free (M1–M6) → ₱286/mo | Cloudflare billing |
| Xendit fees | ~2.5% of revenue | Xendit dashboard |
| Resend | Free tier (100/day) | Resend dashboard |
| Sentry | Free tier | Sentry billing |
| Domain | ~₱600/year | Registrar |

---

## 3. Churn Analysis

Churn is the silent killer for a subscription SaaS. At AKBai's early stage, every churned user matters and deserves investigation.

### Churn Rate Calculation

```
Monthly Churn Rate = (Churned subscribers this month / Total subscribers at start of month) × 100

Example: 2 churns out of 40 subscribers = 5% monthly churn = 🔴 Red flag
```

### Churn Classification

When a user churns, classify the reason:

| Type | Signal | Action |
|------|--------|--------|
| **Payment failure** | Xendit webhook: payment_failed | Auto-retry via Xendit. 3-day grace period. Send KA push notification. If still failed → Resend winback email sequence (7-day). |
| **Voluntary cancel** | User explicitly cancels | Trigger exit survey. Log reason. If >3 users cite same reason → product issue. |
| **Ghosting** | No login for 14+ days, subscription lapses | Send "Miss na kita" re-engagement via Resend. If no response in 7 days → count as churned. |
| **Downgrade** | Business → Pro, or Pro → Free | Not technically churn but worth tracking. Exit survey: "What feature did you stop needing?" |

### Churn Red Flags

| Signal | Threshold | Action |
|--------|-----------|--------|
| Monthly churn >5% | 🔴 Immediate | Investigate top churn reasons. Are users completing onboarding? Is the Maria Moment happening? |
| 3+ users churn citing same reason | 🔴 Within 1 week | This is a product signal, not random noise. Escalate to product-owner. |
| Payment failure rate >10% | 🟡 Within 1 sprint | Check GCash integration, Xendit webhook reliability. May be infra, not user intent. |
| Free-to-paid <15% after 100+ free users | 🔴 Within 2 weeks | Onboarding funnel review. Is the free tier too generous? Is the upgrade CTA clear? |

### Churn Recovery Sequence

```
Day 0: Payment fails
  → Xendit auto-retries
  → KA sends in-app notification: "May issue sa payment mo — check mo lang yung GCash mo"

Day 1: Still failed
  → Resend email: "Hi [Name], parang hindi natuloy yung payment mo. No worries — naka-grace period ka pa. I-update mo lang yung payment method mo para tuloy-tuloy ang AKBai mo."

Day 3: Grace period ends
  → Downgrade to Free tier
  → Resend email: "Miss na namin ang data insights mo, [Name]. Naka-Free tier ka na ngayon — upgrade anytime para makabalik sa full features."

Day 7: Winback attempt
  → Resend email: "7 days na since nawala ang Pro mo, [Name]. In that time, [X] BIR deadlines ang na-miss ng reminders mo. Gusto mo bang bumalik?"

Day 30: Final winback
  → Resend email with special offer (if applicable): "Balik ka na, [Name] — first month back at 50% off."
```

---

## 4. Flag-as-Wrong Review Process

The Flag-as-Wrong button is on every KA output card. When a user taps it, the flagged interaction goes into a review queue. This is one of AKBai's most important feedback loops — it's how KA gets smarter.

### Flag Review Workflow

```
Step 1: Log the flag
  → Captured automatically: user_id, conversation_id, message_id, timestamp
  → User can optionally add a note ("Mali yung amount" or "Wrong deadline")

Step 2: Pull full context
  → The specific KA output that was flagged
  → The user's input that triggered it
  → The system prompt state at the time (which scopes were active)
  → User's business profile (type, BIR registration, tier)
  → Recent conversation history (last 5 messages for context)

Step 3: Determine root cause
  → PROMPT ISSUE: The system prompt didn't give KA enough context or gave wrong guidance
     Example: KA cited a BIR deadline that's correct for sole proprietors but wrong for this user's corporation
     Fix: Update the relevant scope section in the system prompt
  → DATA ISSUE: The user's data was incorrect, incomplete, or stale
     Example: KA calculated expenses using a receipt that was already deleted
     Fix: Data pipeline fix (check soft-delete handling, cache invalidation)
  → MODEL LIMITATION: Claude produced a hallucination or reasoning error despite correct prompt and data
     Example: KA made up a BIR rule that doesn't exist
     Fix: Add guardrails, explicit disclaimers, or structured output constraints
  → USER MISUNDERSTANDING: KA was actually correct, but the user expected something different
     Example: User flagged a correct tax calculation because they didn't realize VAT was included
     Fix: Improve KA's explanation (show work, add context)

Step 4: Apply the fix
  → For prompt issues: Update system prompt, test with existing Taglish test library
  → For data issues: Fix the data pipeline, verify with affected user's data
  → For model limitations: Add regression test, consider structured output or guardrails
  → For user misunderstanding: Improve KA's output formatting or add explanatory context

Step 5: Regression test
  → Add a test case to the Taglish test library (20–30 cases, run on every prompt update)
  → The test should reproduce the original failure condition and verify the fix
  → Run the full test library to make sure the fix didn't break something else

Step 6: Close the loop with the user
  → If the fix changes the user's data or past output, notify them
  → "Salamat sa pag-flag, [Name]! Na-fix na namin yung [issue]. [What changed for them]."
```

### Flag Volume Signals

| Volume | Signal | Action |
|--------|--------|--------|
| 0 flags/week | 🟢 or 🟡 | Green if users are active. Yellow if users aren't flagging because they don't trust the button works. Check: is the button visible? Do users know about it? |
| 1–3 flags/week | 🟢 Normal | Healthy feedback loop. Review in evening build sessions. |
| 4–10 flags/week | 🟡 Attention | Review for patterns. Are multiple flags about the same category? |
| 10+ flags/week | 🔴 Systemic | Something is broadly wrong. Check: recent prompt changes, model updates, data pipeline issues. Escalate to ai-engineer. |

### Pattern Detection

When reviewing flags, look for patterns across multiple flags:

- **Same category** (e.g., all BIR-related): Likely a prompt scope issue
- **Same user profile type** (e.g., all online sellers): Likely a personalization gap
- **Same feature** (e.g., all receipt scan): Likely a model accuracy issue
- **Same time period** (e.g., all after last deploy): Likely a regression

If 3+ flags share a pattern → escalate to ai-engineer skill with the pattern documented.

---

## 5. Sunday Metrics Template

Use this template every Sunday. Should take ~15 minutes. Pull the numbers Saturday night (end of build session) so Sunday is just analysis.

```
📊 AKBai Weekly Metrics — Week of [date]

REVENUE
  MRR: ₱_____ (last week: ₱_____)  [🟢🟡🔴]
  New subscribers: _____
  Churned: _____
  Net growth: _____%
  Free-to-paid conversion: _____%  [🟢🟡🔴]

PRODUCT HEALTH
  Uptime: _____% [🟢🟡🔴]
  Sentry errors (new): _____ [🟢🟡🔴]
  Flag-as-wrong volume: _____ [🟢🟡🔴]
  Flag resolution rate: _____%

USERS
  Total registered: _____
  DAU (avg): _____
  WAU: _____
  Onboarding completion rate: _____%

SUPPORT
  Tier 2 tickets: _____ (resolved: _____, pending: _____)
  Avg response time: _____ hours
  Tier 3 incidents: _____

COMPETITOR PULSE (2–3 bullets max)
  •
  •

TOP PRIORITY THIS WEEK
  →

NOTES FOR MONDAY STANDUP
  →
```

### Traffic Light Rules for Sunday Metrics

| Metric | 🟢 Green | 🟡 Yellow | 🔴 Red |
|--------|---------|----------|--------|
| MRR growth | >10%/mo | 5–10%/mo | <5%/mo or negative |
| Free-to-paid | >15% | 10–15% | <10% |
| Uptime | >99.5% | 99.0–99.5% | <99.0% |
| New Sentry errors | 0–2 | 3–5 | 6+ |
| Flag volume | 0–3/week | 4–10/week | 10+/week |
| Tier 2 SLA compliance | 100% <24hr | 90–99% | <90% |
