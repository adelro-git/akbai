# AKBai — Incident Response Runbook
> Reference for: devops-engineer skill
> Last updated: March 2026
> Source: Gap Registry D7, Operations Playbook v7

## Table of Contents
1. [Solo Founder Context](#1-solo-founder-context)
2. [Severity Levels](#2-severity-levels)
3. [Detection & Alerting](#3-detection--alerting)
4. [Response Protocols](#4-response-protocols)
5. [Communication Templates](#5-communication-templates)
6. [Rollback Decision Guide](#6-rollback-decision-guide)
7. [Postmortem Format](#7-postmortem-format)
8. [Incident Log Template](#8-incident-log-template)
9. [Common Scenarios](#9-common-scenarios)

---

## 1. Solo Founder Context

This runbook is designed for one person running a production financial app while holding a full-time day job. Key constraints:

- **Availability gaps:** Mon–Fri, ~8AM–6PM PHT, Anton is at Globe Telecom. Response may be delayed for P1/P2.
- **No escalation path:** There is no second engineer. If Anton can't fix it, the fix waits or the service stays degraded.
- **Phone is the lifeline:** Every critical alert must reach Anton's phone via SMS, Slack push, or email push notification.
- **Bias toward rollback:** With one person, debugging in production is risky. When in doubt, roll back to the last known good state, then investigate at leisure.
- **Communication is minimal but honest:** Users get a short status update. No need for a full status page in Phase 1 — a pinned message in the community group (Facebook/Viber) or a banner in the app is sufficient.

---

## 2. Severity Levels

| Level | Definition | Response Window | Alert Path |
|-------|-----------|----------------|------------|
| **P0** | Data breach, payment failure, NPC violation, RLS bypass | **Immediate** — drop everything, including during Globe work hours | SMS + Slack + Email |
| **P1** | Core feature down for all users (app won't load, auth broken, Claude API total failure) | **Within 1 hour** | Slack + Email |
| **P2** | Degraded performance, non-critical feature broken (slow scans, briefing delayed, PostHog down) | **Next available evening** | Email only |

### Escalation Rules

**P0 during Globe work hours:**
- Anton excuses himself from meeting or takes a break
- If in a critical meeting that cannot be interrupted, the P0 response is delayed — accept the risk, but this should be rare
- Rollback is always the first action for P0. Investigate after stabilizing.

**P1 during Globe work hours:**
- Check Slack on next break (within 1 hour)
- If the fix is a simple rollback (Vercel promote), do it from phone
- If it requires code changes, acknowledge the issue and schedule fix for evening

**P2 any time:**
- Note it, fix during next planned AKBai work session
- If it's cosmetic or affects <5% of users, it can wait for the next deploy

---

## 3. Detection & Alerting

### How Incidents Get Detected

```
External monitoring (UptimeRobot)
  → Ping fails → SMS + Email + Slack
  → Catches: total outage, DNS failure, SSL expiry, webhook endpoint down

Error tracking (Sentry)
  → Error spike → Email + Slack
  → Catches: unhandled exceptions, API errors, payment failures, auth issues

User reports
  → Facebook group, Viber, email, in-app feedback
  → Catches: UX bugs, slow performance, data inconsistencies

Self-detected
  → Anton notices during routine daily check
  → Catches: slow degradation, metric anomalies, cost spikes
```

### First 5 Minutes After Alert

```
1. READ the alert — what broke, when, how many users affected
2. CLASSIFY severity (P0/P1/P2)
3. If P0: ROLL BACK immediately (Vercel promote or feature flag kill)
4. If P1: assess if rollback helps — if yes, roll back; if no, note and schedule
5. If P2: note and schedule for evening
6. ACKNOWLEDGE in Slack #akbai-alerts: "Investigating — [severity]"
```

---

## 4. Response Protocols

### P0 Protocol — Data Breach / Payment Failure / NPC Violation

**Goal:** Stop the bleeding within minutes. Full fix can wait.

```
MINUTE 0-5: Stabilize
├── Roll back Vercel deployment to last known good
├── OR toggle feature flag to disable affected feature
├── OR if Supabase issue: check Supabase status page
└── Confirm users can no longer trigger the broken path

MINUTE 5-15: Assess Scope
├── Sentry: how many users hit the error?
├── Supabase: query affected records
│   (e.g., SELECT count(*) FROM transactions WHERE created_at > '<incident_start>')
├── Xendit: check dashboard for failed/duplicate payments
└── Determine: is user data exposed? Is money affected?

MINUTE 15-30: Communicate
├── Post status update (see templates below)
├── If data breach: start NPC 72-hour notification clock
├── If payment issue: identify affected users for manual remediation
└── Update Slack #akbai-alerts with scope assessment

AFTER STABILIZATION: Investigate
├── Read Sentry error details + stack trace
├── Check deployment diff (what changed?)
├── Check Supabase migration log (did a migration cause this?)
├── Write timeline in incident log
└── Schedule postmortem within 48 hours
```

**NPC Data Breach Protocol:**
If user data was exposed (PII, financial data, receipts):
1. Document exactly what data was exposed and for whom
2. Close the exposure immediately
3. NPC must be notified within 72 hours (RA 10173 requirement)
4. Affected users must be notified
5. Document all actions taken — this is legally required

### P1 Protocol — Core Feature Down

**Goal:** Restore service within 1 hour.

```
MINUTE 0-5: Assess
├── Is this a deploy-related issue? → Roll back
├── Is this a third-party outage? → Check status pages
│   ├── Supabase: https://status.supabase.com
│   ├── Vercel: https://www.vercel-status.com
│   ├── Anthropic: https://status.anthropic.com
│   └── Xendit: Check Xendit dashboard
└── Is this a Supabase migration issue? → DO NOT roll back app yet

MINUTE 5-30: Fix or Work Around
├── If deploy-related: roll back Vercel, confirm fix
├── If third-party: enable maintenance mode flag, post status update
├── If migration: apply rollback migration, then roll back app
└── If unclear: toggle relevant feature flag off, investigate from logs

MINUTE 30-60: Verify Recovery
├── UptimeRobot showing UP
├── Sentry error rate returned to baseline
├── Test key flows manually (auth, scan, payment)
└── Post "resolved" status update
```

### P2 Protocol — Degraded Performance

**Goal:** Document and fix at next available session.

```
WHEN NOTICED:
├── Add to incident log with P2 tag
├── Check if it's getting worse (trending in Sentry/PostHog)
├── If worsening → re-classify as P1
└── If stable → schedule for evening fix

DURING FIX SESSION:
├── Reproduce the issue
├── Identify root cause
├── Fix, test on preview, deploy
├── Verify fix in production
└── Close incident log entry
```

---

## 5. Communication Templates

### In-App Maintenance Banner

Toggle `maintenance-mode` feature flag in PostHog to show:

```
🔧 May kaunting issue ang AKBai ngayon. Inaayos na namin.
Ang data mo ay safe. Babalik kami agad.
```

### Facebook/Viber Community Update — Incident Active

```
🟡 AKBai Update

May nae-experience kaming [brief description] ngayon.
Inaayos na po namin. Ang lahat ng data ninyo ay safe.

Mag-uupdate kami dito within [timeframe].
Pasensya na po sa abala. 🙏
```

### Facebook/Viber Community Update — Resolved

```
🟢 AKBai Update — Resolved

Naayos na po ang [brief description].
Lahat ng features ay gumagana na ulit.

Kung may napansin kayong issue, i-message niyo lang kami.
Salamat sa pasensya! 🙏
```

### User-Specific Apology (for payment issues)

```
Hi [Name],

Napansin po namin na na-affect ang payment mo noong [date].
Na-resolve na po ito at na-confirm na ang subscription mo.

Kung may tanong ka pa, i-message mo lang kami.
Pasensya na po sa abala. 🙏

— KA, AKBai Team
```

### NPC Breach Notification (if needed — engage lawyer first)

```
Subject: Data Incident Notification — AKBai

Dear National Privacy Commission,

We are writing to report a personal data breach pursuant to the
Data Privacy Act of 2012 (RA 10173).

Date of Discovery: [date]
Nature of Breach: [description]
Data Affected: [types of data]
Number of Affected Users: [count]
Remedial Actions Taken: [actions]
Measures to Prevent Recurrence: [measures]

[Contact details]
```

**Important:** Do NOT send the NPC notification without legal review. Engage PH tech lawyer first if time permits within the 72-hour window.

---

## 6. Rollback Decision Guide

```
Is production broken?
  │
  ├── Yes, after a deploy → ROLL BACK (Vercel promote)
  │     Was there a migration? → Roll back migration FIRST, then app
  │
  ├── Yes, no recent deploy → Check third-party status pages
  │     Third-party down? → Feature flag off, wait, status update
  │     Our code? → Investigate, then deploy hotfix or roll back
  │
  ├── Partially broken (one feature) → Feature flag kill switch
  │     Feature flag exists? → Toggle off immediately
  │     No flag? → Assess if full rollback is better than degraded state
  │
  └── Slow but working → P2, fix at next session
```

### Rollback Commands

```bash
# List recent Vercel deployments
vercel ls

# Instant rollback to previous deployment
vercel promote <previous-deployment-url>

# Kill a feature via PostHog (alternative to rollback)
# Go to PostHog → Feature Flags → toggle off the relevant flag

# Supabase migration rollback (have rollback SQL ready)
supabase db push --db-url <production_url> < rollback_migration.sql
```

---

## 7. Postmortem Format

Write a postmortem within 48 hours of any P0 or P1 incident. P2 incidents get a brief entry in the incident log but don't need a full postmortem unless they reveal a systemic issue.

### Template

```markdown
# Postmortem: [Incident Title]

**Date:** [YYYY-MM-DD]
**Severity:** P0 / P1
**Duration:** [start time] – [end time] PHT ([X] minutes total)
**Author:** Anton del Rosario
**Status:** Resolved / Monitoring

## Summary
[2-3 sentences: what happened, who was affected, what was the impact]

## Timeline (all times PHT / UTC+8)
| Time | Event |
|------|-------|
| HH:MM | [First detection — how was it caught?] |
| HH:MM | [Investigation started] |
| HH:MM | [Root cause identified] |
| HH:MM | [Mitigation applied (rollback/flag/fix)] |
| HH:MM | [Service restored] |
| HH:MM | [Confirmed stable] |

## Root Cause
[What specifically broke and why. Be precise — "the Xendit webhook handler
threw an unhandled exception when payment_id was null" not "the payments were broken"]

## Impact
- **Users affected:** [count or percentage]
- **Data impact:** [any data corruption, loss, or exposure?]
- **Financial impact:** [any payments affected?]
- **Duration of impact:** [how long users experienced the issue]

## What Went Well
- [Things that worked during incident response]

## What Went Wrong
- [Things that didn't work or were missing]

## Action Items
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| [Specific preventive action] | Anton | [date] | Pending |
| [e.g., "Add null check to webhook handler"] | Anton | [date] | Pending |
| [e.g., "Add integration test for Xendit webhook edge cases"] | Anton | [date] | Pending |

## Lessons Learned
[What did this teach us about the system, the monitoring, or the process?]
```

### Where to Store Postmortems

Store in the repo: `/docs/postmortems/YYYY-MM-DD-[slug].md`

This keeps postmortems version-controlled and searchable. Over time, patterns in postmortems reveal systemic issues worth investing in.

---

## 8. Incident Log Template

Keep a running log of all incidents (all severities) in `/docs/incidents.md`:

```markdown
# AKBai Incident Log

| Date | Severity | Summary | Duration | Root Cause | Postmortem |
|------|----------|---------|----------|------------|------------|
| 2026-MM-DD | P1 | Auth flow broken after deploy | 45 min | Missing env var in Vercel | [Link] |
| 2026-MM-DD | P2 | Slow receipt scans | Ongoing (3 hrs) | Claude API latency | N/A |
```

---

## 9. Common Scenarios

### Scenario: Xendit Webhook Stops Working

**Detection:** UptimeRobot alert — webhook endpoint returns non-200
**Impact:** Users pay via GCash but subscription doesn't activate (P0)
**Response:**
1. Check if it's AKBai or Xendit: visit Xendit dashboard, check their status page
2. If AKBai endpoint is down: roll back Vercel deployment
3. If Xendit is down: enable maintenance mode, post status update, wait
4. After recovery: query Xendit API for any missed webhook events and replay them manually
5. Verify all users who paid during outage have active subscriptions

### Scenario: Supabase Outage

**Detection:** UptimeRobot alert — Supabase API monitor DOWN; or Sentry flood of "connection refused" errors
**Impact:** Entire app non-functional (P1)
**Response:**
1. Check Supabase status page
2. Enable maintenance mode feature flag (PostHog)
3. Post status update: "Third-party service issue, data is safe"
4. Wait for Supabase to recover
5. After recovery: verify data integrity, check for any interrupted transactions

### Scenario: Claude API Key Exposed

**Detection:** GitHub secret scanning alert, Sentry alert from unauthorized usage, or cost spike
**Impact:** API cost abuse, potential data exposure if key is used to read conversations (P0)
**Response:**
1. Immediately revoke the key in Anthropic Console
2. Generate a new key
3. Update Vercel environment variables
4. Redeploy all environments
5. Review API usage logs for unauthorized calls
6. Check git history for how the key was exposed
7. If committed to git: rotate ALL secrets (assume all may be compromised)

### Scenario: RLS Policy Accidentally Dropped

**Detection:** Sentry alert showing cross-user data access, or spotted during migration review
**Impact:** Users can see each other's financial data (P0 — NPC violation)
**Response:**
1. Immediately take app offline (maintenance mode)
2. Re-apply RLS policies via emergency migration
3. Verify RLS is enforced (test with multiple user tokens)
4. Audit access logs: did any user actually access another user's data?
5. If yes: begin NPC 72-hour notification process
6. Postmortem required within 24 hours

### Scenario: Deploy Broke Something But You're at Globe

**Detection:** Slack alert on phone during workday
**Impact:** Depends on what broke — classify severity
**Response (from phone):**
1. Open Vercel app on phone (or Vercel web on mobile browser)
2. Identify the latest deployment
3. If simple rollback: promote previous deployment from Vercel dashboard
4. If feature flag kill: toggle in PostHog mobile/web
5. Post acknowledgment in Slack: "Rolled back, will investigate tonight"
6. Full investigation during evening session

### Scenario: Cost Spike on Anthropic API

**Detection:** Anthropic Console shows unexpected spend; or circuit breaker triggered
**Impact:** Financial (P2 unless circuit breaker is bypassed, then P1)
**Response:**
1. Check if circuit breaker caught it (daily_api_spend table in Supabase)
2. If breaker fired: good, system is working. Investigate why spend spiked.
3. If breaker didn't fire: immediately reduce API caps or pause Claude API calls
4. Check for: infinite loops, retry storms, unexpected traffic spike, model upgrade cost difference
5. Adjust circuit breaker threshold if needed
