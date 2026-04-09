---
name: incident
description: "Emergency incident response protocol for P0/P1/P2 production issues (data breach, service down, degraded). Assess severity, generate immediate mitigation steps (first 15 min), communication templates in conversational Filipino (warm tone), root cause investigation checklist, NPC 72-hour breach notification checklist (RA 10173), post-incident review template. Solo founder: handles 2AM BIR deadline day outages, escalation paths when Anton is at day job, automated vs manual response decisions. Trigger keywords: incident, production issue, outage, down, broken, error spike, data breach, payment failure, emergency, urgent, P0, P1, P2, something's wrong, app is broken, users are complaining."
---

# /incident — Emergency Response Protocol

**Skills:** devops-engineer + ops-lead
**Command:** `/incident`
**Purpose:** Rapid incident assessment, mitigation, user communication, and compliance response (NPC 72-hour breach notification).

You are Anton's 24/7 incident commander. When AKBai breaks at 2AM on a BIR deadline day, when Xendit payments go down, when user data is exposed — this workflow gets executed immediately. Anton may be asleep, offline, or stuck in Globe meetings. The protocol is designed to:

1. **Stabilize production** (first 15 minutes)
2. **Notify affected users** in warm conversational Filipino
3. **Investigate root cause** (forensics + logs)
4. **Notify authorities if data breach** (NPC 72-hour window)
5. **Document and recover** (post-incident review)

---

## Before Starting

**Read the shared context files** (takes 2 minutes):
- `/AKBai/akbai-delivery/shared/project-context.md` § 1, 8–9 (product, KA voice, compliance)
- `/AKBai/akbai-delivery/shared/brand-context.md` (conversational Filipino tone, voice pillars, examples)
- `/AKBai/akbai-delivery/shared/gap-registry.md` § Category D (operational gaps, D7 incident runbook)

**Reference files in this skill:**
- `references/incident-runbook.md` — Detailed P0/P1/P2 protocols, communication templates, escalation paths, NPC notification procedures
- `references/deployment-guide.md` — Rollback procedures, Vercel promotion

---

## Step 1: Severity Assessment (First 1 Minute)

Ask yourself / gather info:

### P0 — Data Breach (USER DATA EXPOSED)
- [ ] User PII exposed (names, emails, phone numbers)
- [ ] Financial data exposed (transaction amounts, receipt images)
- [ ] Payment data exposed (Xendit subscription state, GCash details)
- [ ] BIR information exposed (business registration, tax data)

**Indicators:**
- Sentry shows auth bypass errors
- Users report seeing other users' data
- Supabase RLS logs show failures
- Unauthorized file access in Supabase Storage

**NPC Notification Required:** YES (72-hour window)

### P1 — Service Down (CORE APP BROKEN)
- [ ] App completely unusable for all users
- [ ] Authentication broken (cannot log in)
- [ ] Claude API down (cannot process queries)
- [ ] Xendit down (cannot process payments)
- [ ] Dashboard won't load / crashes on startup
- [ ] On a BIR deadline day (immediate user impact)

**Indicators:**
- Vercel returns 5xx errors
- UptimeRobot shows service DOWN
- PostHog shows zero active users
- Sentry shows error spike (>100 errors/min)

**Business Impact:** Revenue stopped (no subscriptions), user trust damaged

**NPC Notification Required:** NO (unless data loss is involved)

### P2 — Degraded (FEATURE BROKEN, APP FUNCTIONAL)
- [ ] Specific feature broken (receipt scanner, reply drafter, etc.)
- [ ] Performance degradation (> 5s response time)
- [ ] Partial user impact (affects only Pro/Business tier, etc.)
- [ ] Workarounds exist (users can use app but with friction)

**Indicators:**
- Sentry shows errors in one feature only
- PostHog shows feature usage at 0% but overall traffic normal
- Stripe/Xendit webhooks delayed but not failed
- Cloud provider degradation alert from AWS/Supabase status page

**Business Impact:** Reduced engagement, churn risk, revenue pressure but not immediate loss

**NPC Notification Required:** NO

---

## Step 2: Declare Severity & Alert Team

Based on assessment, declare the severity level **immediately**:

### P0 Declaration
```
🚨 P0 INCIDENT — DATA BREACH

Declared at: [TIMESTAMP in UTC+8]
Duration: UNKNOWN
Affected users: [estimate]
Data exposed: [types — PII, financial, payment]

IMMEDIATE ACTIONS REQUIRED:
1. Disable user API access (pause all queries)
2. Isolate affected data from backups
3. Contact NPC (72-hour notification window starts NOW)
4. Notify affected users with incident communication below
```

### P1 Declaration
```
🔴 P1 INCIDENT — SERVICE DOWN

Declared at: [TIMESTAMP in UTC+8]
Duration: [minutes since outage began]
Affected users: ALL
Root cause: UNKNOWN (investigating)

IMMEDIATE ACTIONS REQUIRED:
1. Page Anton (phone call + SMS)
2. Begin rollback investigation
3. Notify users with status page message
4. Start public status communication
```

### P2 Declaration
```
⚠️  P2 INCIDENT — DEGRADED SERVICE

Declared at: [TIMESTAMP in UTC+8]
Duration: [minutes since degradation began]
Affected feature: [feature name]
Affected users: [subset or percentage]

ACTIONS REQUIRED:
1. Monitor Sentry for escalation to P1
2. Notify users of workaround (if available)
3. Begin root cause investigation
```

---

## Step 3: Immediate Mitigation (First 15 Minutes)

### For P0 Data Breach

**First 5 minutes:**
1. [ ] **KILL all user-facing API calls**
   - Set environment variable `INCIDENT_MODE=true` in Vercel
   - Causes all API routes to return: `{ "error": "Maintenance. Bumalik ka sa ilang minuto po." }`
   - Users see graceful offline message, not exposed data

2. [ ] **Isolate compromised data**
   - Identify which tables/rows are exposed
   - Document in a private Slack thread (never public)
   - Example: "User ID 1–50 financial records visible to all auth users due to RLS bypass in GET /api/transactions"

3. [ ] **Preserve logs for forensics**
   - Export Supabase audit logs for past 24 hours
   - Export Sentry error timeline
   - DO NOT delete audit logs (compliance requirement)

4. [ ] **Page Anton immediately**
   - Phone call (not Slack)
   - Text message with incident link
   - Subject line: "DATA BREACH — AKBai. Call now."

**Next 10 minutes:**
5. [ ] **Initiate rollback evaluation**
   - Check last clean Vercel deployment timestamp
   - If breach happened after latest deploy, rollback may not help — focus on data isolation instead
   - If breach is code-based, rollback to previous version

6. [ ] **Notify NPC (National Privacy Commission)**
   - Use NPC notification template below (§ NPC Notification Checklist)
   - File incident report within 72 hours
   - Documentation: affected user count, data types, breach timeline, remediation steps

### For P1 Service Down

**First 5 minutes:**
1. [ ] **Verify the outage is real** (not a local issue)
   - Try accessing akbai.vercel.app from multiple locations
   - Check Vercel deployment status page
   - Check Supabase status page
   - Check Anthropic API status page

2. [ ] **Initiate rollback immediately**
   - Log into Vercel dashboard
   - Go to Deployments
   - Find the second-most-recent deployment (last stable)
   - Click "Promote to Production"
   - Downtime: ~30 seconds while DNS propagates
   - Verify: UptimeRobot should flip to UP within 2 minutes

3. [ ] **Notify affected users on status page**
   - Post to public status.akbai.com (or use Vercel status embed):
     ```
     Status: INVESTIGATING
     We're aware of service issues. Our team is responding.
     ```

4. [ ] **Page Anton immediately**
   - Phone call
   - Message: "P1 down — rollback initiated, investigating root cause"

**Next 10 minutes:**
5. [ ] **Investigate root cause from logs**
   - Sentry: look for error spike, pattern, recent code changes
   - Supabase: check migration logs, query performance, connection limits
   - Anthropic API: check quota, rate limit, cost spike
   - Xendit webhooks: check if stuck in retry loop

6. [ ] **Begin root cause investigation checklist (see § below)**

### For P2 Degraded

**First 5 minutes:**
1. [ ] **Isolate the affected feature**
   - Which endpoint is slow? Which table is bogged down?
   - Sentry: filter errors to the specific feature
   - PostHog: check feature usage vs. overall traffic

2. [ ] **Notify affected users (not all users)**
   - If receipt scanner is slow: post to #akbai-support chat
   - Message in conversational Filipino: "Receipt scanner ay nagslow down — working on it!"
   - Offer workaround if available

3. [ ] **Monitor for escalation to P1**
   - Set up a 5-minute re-check alarm
   - If P2 stays P2 for > 30 min, escalate to P1 protocol
   - If P2 is resolving, continue with root cause investigation

---

## Step 4: User Communication (P0 & P1 Only)

Use these conversational Filipino templates. Follow brand-context.md voice pillars: warm, competent, proactive.

### P0 Data Breach — Initial User Notification

**Delivery method:** In-app banner (top of dashboard) + email (all affected users)

**Template:**

```
Subject: Mahalaga — AKBai Incident Update

Magandang umaga,

Nag-encounter kami ng isang technical issue na may potential data exposure.
Nagseguro kami na ang inyong account ay secured na ngayon.

AKBai takes your privacy seriously. We:
✅ Identified the issue within [X minutes]
✅ Secured all user data immediately
✅ Preserved detailed logs for investigation
✅ Are notifying authorities as required by law

Ano ang exposed: [specific data types — financial records, etc.]
Sino ang affected: [estimated user count]
Ano ang nangyari next: NPC notification (within 72 hours), detailed postmortem in your email

Hindi kailangan kayong gumawa ng anything. Password reset is optional pero recommended.

We're sorry. We're fixing this properly.

— The AKBai Team
```

### P1 Service Down — Status Page Update

**Delivery method:** Status page (status.akbai.com) + in-app banner

**Timeline templates:**

```
[10:15 AM] ⚠️  INVESTIGATING
We're aware users are having trouble logging in. Our team is responding now.

[10:25 AM] 🔄 IDENTIFIED & MITIGATING
Root cause: database connection pool exhaustion. Rolling back to previous version.

[10:30 AM] ✅ RESOLVED
Service is back online. Sorry for the disruption.
```

### P1 Service Down — Direct User Communication (Email)

**Delivery method:** Transactional email to all users (use Resend)

**Template:**

```
Subject: AKBai Service Restored — [Time duration] Outage

Hi Maria,

Bumalik na ang AKBai. We had a service outage from [Time A] to [Time B] (PHT).

What we did:
✅ Identified the issue (database overload due to unexpectedly high traffic)
✅ Rolled back to previous version
✅ Service restored in [X minutes]

Your data is safe. No transactions were lost.

We're investigating to prevent this from happening again.

Thank you for your patience.

— Anton & the AKBai Team
```

---

## Step 5: Root Cause Investigation

Use this checklist to diagnose what actually happened:

### For Code-Related Failures

- [ ] What code changed in the latest deploy?
  - `git log -1 --oneline` on production branch
  - Review recent PRs merged to main

- [ ] Does the issue match any CRITICAL gap violations?
  - A1 (Auth) — user session loss?
  - A3 (Timezone) — wrong deadlines shown?
  - D2 (Webhook idempotency) — double-charges?
  - D3 (OR numbering) — BIR compliance violation?

- [ ] Sentry error pattern analysis
  - When did errors spike? (matches deploy time?)
  - Which endpoint is failing? (api/chat, api/scan, api/pay?)
  - Error message — what's the actual failure?
  - Stack trace — which line of code?

- [ ] Was a feature flag involved?
  - Check PostHog: was a new flag enabled?
  - Was a flag value changed? (e.g., `claudeModelLimit` lowered?)

### For Database Failures

- [ ] Supabase migration logs
  - Did a migration run? When?
  - Did it succeed or rollback?
  - Are RLS policies still active? `SELECT COUNT(*) FROM pg_policies;`

- [ ] Query performance
  - Slow query logs in Supabase dashboard
  - Which table is slow? (transactions? receipts?)
  - Was a migration applied? (new index missing?)

- [ ] Connection pool exhaustion
  - UptimeRobot health check failing?
  - Too many concurrent users?
  - Supabase connection limit hit?

### For Third-Party Service Failures

- [ ] Anthropic API status
  - Check https://status.anthropic.com
  - Rate limit hit? (spike in requests)
  - Quota exceeded? (model usage too high)

- [ ] Xendit status
  - Check Xendit status page
  - Webhook health: are they delivering?
  - Did webhook secret rotate? (signature mismatch?)

- [ ] Supabase status
  - Check https://supabase.com/status
  - Regional outage? (unlikely if using global CDN)

### For User Data Issues

- [ ] Is data lost or just inaccessible?
  - Check Supabase backups: PITR (point-in-time recovery) available?
  - Can you restore to 30 min before incident?

- [ ] RLS violation occurred?
  - Run diagnostic: `SELECT * FROM transactions WHERE user_id != auth.uid();`
  - If results > 0, RLS is broken

---

## Step 6: NPC Notification (P0 Data Breach Only)

**Trigger:** Data breach confirmed. National Privacy Commission (NPC) must be notified within **72 hours** per RA 10173 (Data Privacy Act).

### NPC Notification Checklist

- [ ] **Prepare incident report** (PDF, saved locally + to secure storage)
  ```
  AKBai Data Breach Incident Report — [Date]

  1. INCIDENT SUMMARY
     - When: [Date/time incident occurred]
     - When discovered: [Date/time]
     - Duration of exposure: [hours/minutes]
     - Reporting date to NPC: [today]

  2. DATA AFFECTED
     - Number of users affected: [N]
     - Data types: [PII, financial records, payment data, etc.]
     - Sensitive categories per RA 10173: [gender, medical, financial, etc.]

  3. ROOT CAUSE
     - Technical summary: [RLS bypass, auth bug, misconfigured access, etc.]
     - Contributing factors: [lack of code review, insufficient testing, etc.]

  4. IMMEDIATE ACTIONS TAKEN
     - [ ] Isolated affected data
     - [ ] Revoked unauthorized access
     - [ ] Preserved forensic evidence
     - [ ] Notified affected users

  5. REMEDIATION STEPS
     - [ ] Patched vulnerability
     - [ ] Conducted security audit
     - [ ] Implemented additional safeguards
     - [ ] Retested RLS policies

  6. EVIDENCE PRESERVED
     - Sentry error logs (from [time] to [time])
     - Supabase audit logs (from [time] to [time])
     - Git commit hash of vulnerable code
     - User access logs (who accessed what when)
  ```

- [ ] **File NPC notification online**
  - Go to: https://www.privacy.gov.ph (NPC official site)
  - Form: "Data Breach Notification"
  - Attach: incident report PDF
  - Keep proof of filing (email receipt, screenshot)

- [ ] **Notify affected users in writing**
  - Email to every affected user with:
    - What data was exposed
    - How exposure happened (honest, non-technical summary)
    - What actions they should take (password reset recommended)
    - Contact: akbai-privacy@[domain] for questions
  - conversational Filipino tone: apologetic, transparent, action-oriented

- [ ] **Document timeline in Slack**
  - #akbai-ops channel (private)
  - Who: involved parties (Anton, security, NPC)
  - What: actions taken in chronological order
  - When: exact timestamps (UTC+8)

- [ ] **Schedule follow-up**
  - NPC may request additional information (keep team available)
  - Document all NPC communications
  - Prepare for potential regulatory review (1–2 months after filing)

---

## Step 7: Post-Incident Review

After the incident is resolved (service restored, root cause understood), write a postmortem.

### Postmortem Template

```markdown
# Incident Postmortem — [Feature/Date]

## Executive Summary
[1-2 sentences: what happened, duration, impact]

Example: RLS policy misconfiguration allowed User A to view User B's
transactions for 45 minutes (10:15–11:00 AM PHT on March 19).
Affected 3 users, 12 transaction records exposed.

## Timeline
10:00 AM — Code deployed to Vercel (commit abc123)
10:15 AM — First user reports seeing other user's data (via Slack)
10:20 AM — Sentry alerts spike in auth errors
10:22 AM — Incident declared P0
10:25 AM — Rollback initiated
10:30 AM — Service restored to previous version
10:45 AM — Root cause identified: RLS policy WHERE clause was incomplete

## Root Cause
[Technical explanation of what went wrong]

Example: In the PR that deployed commit abc123, the RLS policy
for the `transactions` table was changed from:
  `WHERE auth.uid() = user_id`
to:
  `WHERE auth.uid() = user_id OR is_public = true`

The `is_public` column doesn't exist on transactions, so the policy
defaulted to "allow all" due to Postgres casting rules.

## Contributing Factors (Why Did This Slip Through?)
1. The RLS change was not reviewed by a second person (solo founder)
2. Pre-deployment checklist (Item 4: RLS verification) was not run
3. No automated test for RLS policies (gap E3 not resolved)
4. Preview build succeeded even though RLS was broken

## Immediate Actions (Already Taken)
- [x] Reverted to previous deployment
- [x] Fixed RLS policy and deployed v2
- [x] Notified affected users
- [x] Filed NPC report
- [x] Preserved Supabase audit logs

## Longer-Term Actions (Prevent Recurrence)
1. [ ] Implement automated RLS policy testing (new Playwright test)
2. [ ] Add RLS checklist item to pre-deployment verification script
3. [ ] Require second-person code review for all RLS changes
   (escalate to ops-lead or solutions-architect)
4. [ ] Document all RLS policy changes in a `RLS_CHANGELOG.md`

## Lessons Learned
1. Solo founder needs guardrails (checklists, tests) to catch human errors
2. RLS changes are CRITICAL and need automated testing
3. Communication was good — users appreciated transparency

## Metric Impact
- Downtime: 15 minutes
- Users affected: 3
- Revenue impact: ₱0 (no payment processing broken)
- Trust impact: Medium (users are reassured by quick response)

---

**Postmortem written by:** [name]
**Date:** [date]
**Severity:** P0
**Status:** CLOSED
```

---

## Escalation & Responsibilities

### If Anton is Unavailable

**During working hours (9 AM–5 PM, Mon–Fri):**
- Anton is at Globe Telecom but monitors Slack
- For P0: page him immediately (phone call)
- For P1: Slack notification + SMS alert
- For P2: Slack notification (he'll respond when available)

**After hours (5 PM–9 AM, Weekends):**
- For P0: escalate to NPC notification immediately, do NOT wait for Anton
- For P1: try Slack + SMS, if no response in 15 min, execute rollback without approval
- For P2: wait for morning, log details in Slack thread

**Automated Escalation (No Human Present):**
- P0 data breach: execute NPC notification procedures automatically
- P1 service down: execute rollback to previous Vercel deployment automatically
- P2 degraded: alert via Slack, UptimeRobot SMS, wait for human response

---

## Common Incident Scenarios

### Scenario 1: Receipt OCR Broken (P2)
```
Symptom: Users report "Scan failed" messages, Sentry shows Claude API errors
Root cause: Anthropic API rate limit hit OR Claude Haiku model outage
Mitigation: Check API quota, wait for service recovery (15–30 min)
Communication: "Receipt scanner is having issues — we're working on it"
No rollback needed.
```

### Scenario 2: Payment Webhook Not Processing (P1)
```
Symptom: Xendit webhooks not firing, subscriptions not updating, users can't upgrade
Root cause: Webhook signature verification failing OR Xendit IP whitelist issue
Mitigation:
  1. Check Xendit dashboard for webhook logs
  2. Verify webhook secret in Vercel env vars matches Xendit
  3. Check Supabase Edge Function logs for errors
  4. Reach out to Xendit support if third-party issue
Communication: "Payment processing is delayed — we're investigating"
Rollback: Not needed (unless code change broke webhook handler)
```

### Scenario 3: Database Connection Pool Exhausted (P1)
```
Symptom: All API calls hang, app doesn't load, UptimeRobot shows timeouts
Root cause: Too many concurrent connections OR long-running query blocking pool
Mitigation:
  1. Check Supabase dashboard: connection count vs. limit
  2. Identify slow queries: SELECT * FROM pg_stat_activity WHERE query != '<idle>'
  3. Kill blocking queries: SELECT pg_terminate_backend(pid)
  4. Upgrade Supabase plan if hitting connection limit
Communication: "Service is experiencing slow response times — refresh your app"
Rollback: Not needed (unless recent deploy changed query patterns)
```

### Scenario 4: User Sees Another User's Data (P0)
```
Symptom: User reports seeing another user's transactions in their dashboard
Root cause: RLS policy bypass OR query not filtering by auth.uid()
Mitigation:
  1. IMMEDIATELY stop all API access (set INCIDENT_MODE=true)
  2. Preserve Supabase audit logs (do not delete)
  3. Identify: which users affected? Which tables? Which rows?
  4. Rollback to previous deployment (likely code bug)
  5. File NPC notification (72-hour window)
Communication: "We experienced a security issue. Your data is now safe. Details below."
Mandatory: NPC notification, user communication, detailed postmortem
```

---

## conversational Filipino Communication Guidelines

**DO:**
- Use user's first name ("Maria, the issue is fixed")
- Say "sorry" and mean it (not "we regret any inconvenience")
- Explain what happened in simple terms
- Be transparent about impact
- Show concrete next steps

**DON'T:**
- Use corporate jargon ("service degradation", "RLS misconfiguration")
- Blame users ("the app crashed because you did X")
- Make excuses (focus on solution, not blame)
- Over-communicate P2 incidents (keep it brief)
- Use ALL CAPS or exclamation marks (seems panicked)

**Example of Good P1 Communication:**
```
Hi there,

Sorry! AKBai went down for about 15 minutes this morning (10:15–10:30 AM).

What happened: Our database ran out of connection slots due to unexpected traffic.

What we did: Rolled back to the previous version and everything's working now.

Your data is safe — nothing was lost.

Thanks for your patience.

— Anton
```

---

## When to Use This Skill

**Use /incident when:**
- Production outage or degradation is ongoing
- User data breach is suspected
- Third-party service failure is blocking AKBai
- You need severity assessment and immediate mitigation steps
- NPC notification is needed (72-hour window)

**Do NOT use /incident when:**
- Bug is on a feature branch (not production yet)
- Asking for deployment help (use `/deploy` instead)
- Investigating a historical incident (use postmortem + documentation)
- Routine monitoring or alerting (use `/deploy` health check instead)

---

## Reference: Monitoring Alerts

These alerts should trigger /incident response:

| Alert | Severity | Trigger Threshold |
|-------|----------|-------------------|
| App is DOWN | P1 | Vercel returns 5xx for >2 min |
| Error rate spike | P1/P2 | >50 errors/min in Sentry (vs. <1 baseline) |
| Auth broken | P1 | /api/auth returns 500+ for >2 min |
| Payment webhook failed | P1 | Xendit webhook not delivered for 10+ min |
| Database slow | P2 | Supabase queries >1000ms p95 for 5+ min |
| Cost spike | P2 | Claude API spend >$10 in 1 hour (3x normal) |
| Data privacy violation | P0 | User reports seeing another user's data |

---

## Glossary

- **P0:** Data breach, NPC notification required, existential threat to business
- **P1:** Service completely down, revenue stopped, users can't use app at all
- **P2:** Feature broken or slow, app works with friction, users can work around it
- **NPC:** National Privacy Commission — RA 10173 authority (72-hour breach notification window)
- **RLS:** Row-Level Security — Postgres policies that enforce `user_id` scoping
- **PITR:** Point-in-Time Recovery — Supabase backup restore capability
- **Rollback:** Reverting to the previous Vercel deployment (atomic, zero-downtime)
- **Postmortem:** Write-up of what happened, why, and how to prevent recurrence
