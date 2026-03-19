# AKBai — Support Triage Playbook
> Used by: ops-lead
> Last updated: March 2026 | Source: Operations Playbook v7, Gap Registry (D7 Incident Response)

---

## Table of Contents

1. Tier Overview
2. Tier 1 — KA Auto-Response
3. Tier 2 — Manual Response (<24hr SLA)
4. Tier 3 — Escalation (<4hr SLA)
5. Trust Recovery Patterns
6. NPC Data Breach Protocol
7. Support Channel Setup

---

## 1. Tier Overview

| Tier | Handler | SLA | Examples |
|------|---------|-----|----------|
| Tier 1 | KA (automated) | Instant | "How do I scan a receipt?", "When is my BIR deadline?", "How do I upgrade?" |
| Tier 2 | Anton (manual) | <24 hours | Account access issues, billing disputes, feature bugs, unclear KA responses |
| Tier 3 | Anton (drop everything) | <4 hours | Data breach / suspected breach, NPC complaint, legal threat, payment system compromise |

**Escalation triggers from Tier 1 → Tier 2:**
- KA responds but user replies with "that's wrong" or "Flag as Wrong"
- User explicitly asks to talk to a human
- KA cannot classify the query (out-of-scope redirect)
- Same user sends 3+ messages in <5 minutes (frustration signal)

**Escalation triggers from Tier 2 → Tier 3:**
- Any mention of: data leak, breach, stolen data, NPC, legal, lawyer, privacy violation
- Payment system showing unauthorized transactions
- Multiple users reporting the same critical issue simultaneously
- Any issue involving user financial data being exposed or corrupted

---

## 2. Tier 1 — KA Auto-Response

KA handles these categories automatically. The ops-lead role here is to monitor that KA's auto-responses are accurate and to update them when they drift.

### Common Tier 1 Categories

| Category | Example Query | KA Response Pattern |
|----------|--------------|-------------------|
| How-to | "Paano mag-scan ng receipt?" | Step-by-step guide, with screenshot links if available |
| BIR deadlines | "Kailan ang deadline ko?" | Pull from bir_deadlines table, personalized to user's business type |
| Pricing / upgrade | "Magkano ang Pro?" | Tier comparison, upgrade CTA |
| Feature discovery | "Ano ang kaya ng AKBai?" | Feature list relevant to user's tier |
| Status check | "Tama ba yung expenses ko?" | Pull from transactions table, summarize with confirmation prompt |

### KA Auto-Response Quality Checks

Every 2 weeks (during a Saturday build session), review a random sample of 10 Tier 1 conversations:
- Were KA's responses accurate?
- Did any conversations escalate to Tier 2 unnecessarily?
- Did any conversations fail to escalate when they should have?
- Update KA's system prompt or knowledge base if patterns emerge.

---

## 3. Tier 2 — Manual Response (<24hr SLA)

These require Anton's direct involvement. The goal is to batch-handle during evening build sessions, not reactively during the day.

### Tier 2 Response Workflow

```
1. Read the full conversation thread (KA history + user messages)
2. Classify the issue:
   a. Account / access issue → Check Supabase Auth, verify user state
   b. Billing dispute → Check Xendit transaction history, compare to subscriptions table
   c. Feature bug → Reproduce if possible, log in Sentry/GitHub Issues
   d. KA accuracy complaint → Route to flag-as-wrong pipeline
   e. Feature request → Log, acknowledge, don't promise a timeline

3. Respond in Taglish, warm tone (KA voice, not corporate):
   - Acknowledge the issue specifically
   - Explain what you found or did
   - Give a concrete next step or resolution
   - If unresolved: give an honest timeline ("Inaayos ko ito — update kita bukas")

4. Update ticket status
5. If this reveals a bug: create a GitHub Issue with reproduction steps
```

### Tier 2 Response Templates

**Account access issue:**
> "Hi [Name]! Na-check ko na yung account mo — mukhang [specific issue]. [What you did to fix it]. Puwede mo na ulitin yung [action]. Pa-message ka lang ulit kung may issue pa!"

**Billing dispute:**
> "Hi [Name], chineck ko yung payment history mo sa Xendit. [What you found — e.g., 'May duplicate charge na nangyari noong March 5']. [Resolution — e.g., 'Na-refund ko na — makikita mo sa GCash mo within 3–5 business days']. Pasensya na sa inconvenience!"

**Feature bug:**
> "Hi [Name], salamat sa pag-report! Na-reproduce ko na yung issue — [brief description of what's happening]. Fix namin ito sa next update. [Workaround if available]. Update kita pagka-fix!"

**KA got something wrong:**
> "Hi [Name], tama ka — mali yung sinabi ni KA doon. [Correct information]. Na-flag ko na ito para ma-improve yung accuracy ni KA. Salamat sa pag-report — nakakatulong ito nang malaki!"

**Feature request:**
> "Hi [Name], magandang idea! Na-note ko na yung request mo for [feature]. Hindi ko ma-promise kung kailan, pero nasa radar na namin. Salamat sa suggestion!"

### SLA Management

- **<18 hours:** Green. Will be handled in tonight's build session.
- **18–23 hours:** Yellow. Prioritize in current session or respond from phone with a quick acknowledgment.
- **>23 hours:** Red. Send an acknowledgment immediately, even if you can't resolve yet. "Na-receive ko na yung message mo — babalikan kita tonight."

The SLA is measured from when the user first reached out, not from when you first saw it. Set up Messenger notifications so you know when tickets come in.

---

## 4. Tier 3 — Escalation (<4hr SLA)

Tier 3 issues are the only reason to interrupt Globe work hours. These are existential — data breaches, legal threats, and payment system compromises.

### Tier 3 Triage

```
1. STOP whatever you're doing
2. Assess: Is user data at risk RIGHT NOW?
   → Yes: Go to §6 (NPC Data Breach Protocol) immediately
   → No but legal threat: Document everything, do not respond without thinking
   → Payment system issue: Check Xendit status page, disable affected endpoints if needed

3. Contain the damage:
   → If data exposure: Disable affected API routes or RLS policies
   → If payment issue: Pause Xendit webhooks if needed
   → If app is down: Cloudflare Pages instant rollback

4. Communicate with affected users (see Trust Recovery §5):
   → Within 1 hour of becoming aware
   → Taglish, transparent, no corporate-speak
   → Specific about what happened and what you're doing

5. Fix the root cause

6. Postmortem (within 48 hours):
   → What happened
   → Timeline of events
   → Root cause
   → What we'll do to prevent recurrence
   → Update gap-registry.md if this reveals a new gap
```

### Tier 3 Categories

| Category | SLA | First Action |
|----------|-----|-------------|
| Suspected data breach | <4hr response, 72hr NPC notification | Contain → Assess scope → NPC protocol |
| NPC complaint received | <4hr acknowledgment | Do NOT respond to NPC without legal review. Document everything. |
| Legal threat from user | <4hr acknowledgment | Screenshot/save everything. Do not admit fault. Consult lawyer. |
| Payment system compromise | <4hr containment | Disable affected Xendit endpoints. Check for unauthorized transactions. |
| Multiple users same critical bug | <4hr fix or workaround | Feature flag kill switch → rollback → hotfix |

---

## 5. Trust Recovery Patterns

When KA gets something wrong or the product has an issue, trust recovery follows the AKBai Trust Recovery Pattern (a design gate from the roadmap):

### The 4-Step Trust Recovery

1. **Acknowledge clearly** — Don't minimize. Name what went wrong specifically.
2. **Take responsibility** — "Mali yung calculation ni KA" not "There was an error."
3. **Explain what happened** — Brief, honest. Users don't need a technical deep-dive, but they deserve to know why.
4. **Offer a concrete next step** — What you're doing to fix it, what the user should do now.

### Trust Recovery Templates

**KA gave wrong financial data:**
> "Pasensya na, [Name] — mali yung computation ni KA sa [specific item]. Ang tama ay [correct info]. Na-fix ko na sa records mo. Moving forward, double-check muna natin lagi ang financial data — KA is a tool, hindi accountant. Salamat sa pag-flag!"

**App downtime:**
> "May technical issue kami kanina — [duration] ang downtime. Naka-back up na ang lahat — walang data na nawala. Inaayos na namin para hindi maulit. Pasensya na sa abala!"

**Payment processing error:**
> "Pasensya na, [Name] — may issue sa payment processing namin na nag-cause ng [specific issue, e.g., double charge]. [Resolution, e.g., 'Na-refund ko na — balik sa GCash mo within 3–5 days']. Na-fix na rin namin yung root cause para hindi na maulit."

### Trust Recovery Don'ts

- Don't blame the user ("You should have checked...")
- Don't blame third parties publicly ("Xendit's API failed...")
- Don't use passive voice ("An error occurred...") — own it
- Don't over-apologize — one sincere "pasensya na" is enough
- Don't promise things you can't deliver ("This will never happen again")

---

## 6. NPC Data Breach Protocol

Under RA 10173 (Data Privacy Act), AKBai has a legal obligation to notify the National Privacy Commission within 72 hours of becoming aware of a personal data breach involving sensitive personal information or that is likely to give rise to a real risk of serious harm.

### The 72-Hour Clock

```
Hour 0: Breach detected or suspected
  → Document: What data, how many users, how it happened (if known)
  → Contain: Stop the leak (disable endpoint, revoke access, patch)

Hour 0–4: Assessment
  → Scope: Which users are affected? What data was exposed?
  → Severity: Was it PII? Financial data? Authentication credentials?
  → If severity is HIGH (financial data, credentials): proceed to notification

Hour 4–24: Prepare NPC notification
  → Use NPC Breach Notification Form (available on NPC website)
  → Required info: nature of breach, data involved, number of affected users,
    measures taken, contact person (Anton as DPO)
  → If you have legal counsel: have them review before submission

Hour 24–48: Notify affected users
  → Individual notification to each affected user
  → Taglish, plain language, not legalese
  → Include: what happened, what data was affected, what we did, what they should do
  → Template below

Hour 48–72: Submit NPC notification
  → File via NPC online portal or email
  → Keep confirmation receipt
  → Log everything in incident record
```

### User Breach Notification Template

> "Mahalaga po itong message:
>
> May security incident po kami na na-detect noong [date]. [Brief description of what happened]. Ang data na possibly affected ay [list specific data types — e.g., email address, business name].
>
> Agad naming ginawa: [what you did to contain it].
>
> Para sa safety mo: [specific advice — e.g., 'Palitan mo ang password mo' or 'Wala namang financial data na na-expose, pero mag-ingat ka sa suspicious emails'].
>
> Nag-file na kami ng notification sa National Privacy Commission. Kung may tanong ka, message mo lang ako directly.
>
> — Anton, AKBai Founder"

---

## 7. Support Channel Setup

### Phase 1 (Pre-launch → 50 users)

- **Primary channel:** Facebook Messenger (where target users already are)
- **Secondary:** Email (for formal/billing issues)
- **In-app:** Flag-as-Wrong button on every KA output card
- **No ticketing system yet.** At <50 users, a spreadsheet tracker is sufficient. Use Supabase table or Google Sheet.

### Phase 2 (50–200 users)

- Add WhatsApp Business API as a support channel
- Consider a simple ticketing system (Linear free tier, or Supabase-based)
- Hire a part-time VA for Tier 1 monitoring (escalation to Anton for Tier 2/3)

### Response Time Expectations (Set with Users)

Don't promise instant responses — set honest expectations:
- In-app KA: Instant
- Messenger/WhatsApp: "Sumasagot kami within 24 hours, mas mabilis usually"
- Email: "Within 48 hours for non-urgent items"
- Make it clear: if it's urgent (data concern), say so in the message and it gets priority
