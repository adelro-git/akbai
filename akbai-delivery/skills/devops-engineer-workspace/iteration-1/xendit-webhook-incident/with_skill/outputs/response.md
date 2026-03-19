# DevOps Incident Response: Xendit Webhook 500 Errors

**Severity:** P0 (Payment failure — immediate action required)
**Time Received:** During Globe work hours
**Context:** Anton in a meeting; Slack alerts incoming about webhook endpoint returning 500

---

## Immediate Action (You're in a meeting at Globe — phone-based response)

### STEP 1: Confirm the Issue (First 2 minutes)
- **What you'll see:** UptimeRobot alert in Slack #akbai-alerts: "Xendit webhook endpoint DOWN" (HTTP 500)
- **Why this is critical:** Users are paying ₱399–₱899 via GCash, but AKBai never receives the webhook, so their subscriptions don't activate. They see "Free tier" after paying.
- **This is P0** — you must respond immediately, even from a meeting.

### STEP 2: Assess via Phone (2–5 minutes)
**Open on your phone:**

1. **Vercel Dashboard** (mobile app or mobile web)
   - Go to your AKBai project → Deployments
   - Is the latest deployment showing as live?
   - Check: Were there any recent deployments in the last 30 minutes?
   - **If yes, recent deploy:** This is likely deploy-related → prepare to rollback
   - **If no recent deploy:** This is likely a code issue or infrastructure problem → investigate further

2. **UptimeRobot Alert Details** (via Slack)
   - Check the UptimeRobot notification
   - What is the exact error? (e.g., "HTTP 500", "Timeout", "Connection refused")
   - When did it start?
   - Is it still happening or intermittent?

3. **Sentry Quick Check** (mobile web or Slack integration)
   - Are there any recent errors tagged with `transaction.type:payment` or `webhooks`?
   - Look for stack traces in the latest errors
   - **Error to look for:** "Unhandled exception in POST /api/webhooks/xendit" or "XENDIT_SECRET_KEY not defined"

### STEP 3: Initial Stabilization (5–10 minutes)

**Three possible causes, in order of likelihood:**

#### CASE A: Recent Deploy Broke It (Most Likely)
- **Signal:** Latest Vercel deployment is less than 30 min old
- **Action:** Rollback immediately via Vercel mobile
  ```
  1. Open Vercel mobile app
  2. Go to AKBai project → Deployments
  3. Find the previous deployment (2nd most recent)
  4. Click "Promote to Production"
  5. Wait ~30 seconds for promotion to complete
  ```
- **Verify:** UptimeRobot should show green within 1–2 minutes
- **Post to Slack:** "Rolled back Vercel deployment. Investigating cause tonight. Users can now pay."
- **Time to fix:** ~2 minutes (you can do this from a meeting break)

#### CASE B: Environment Variable Missing or Corrupted
- **Signal:** Sentry shows "XENDIT_SECRET_KEY is undefined" or similar
- **Action:** Check Vercel environment variables
  ```
  1. Vercel Dashboard → AKBai project → Settings → Environment Variables
  2. Confirm these are set in Production:
     - XENDIT_SECRET_KEY
     - XENDIT_WEBHOOK_TOKEN
     - SUPABASE_SERVICE_ROLE_KEY (if webhook calls Supabase)
  3. If missing: Add from your password manager, redeploy
  ```
- **Verify:** Wait for automatic redeploy, then confirm UptimeRobot shows green
- **Post to Slack:** "Fixed missing env var. Redeploying. Users can now pay."
- **Time to fix:** ~3–5 minutes (requires adding env var in Vercel UI)

#### CASE C: Xendit Service Outage
- **Signal:** UptimeRobot shows webhook endpoint is up, but Sentry shows "Xendit API connection refused" or similar
- **Action:** Check Xendit status page
  ```
  1. Open browser on phone → https://xendit.com/status (or check Slack for Xendit alerts)
  2. Is Xendit reporting an outage?
  ```
- **If Xendit is down:** Enable maintenance mode
  ```
  1. PostHog dashboard → Feature Flags → find "maintenance-mode"
  2. Toggle ON
  3. Users will see: "🔧 May kaunting issue ang AKBai ngayon. Inaayos na namin. Ang data mo ay safe."
  4. Post in Slack: "Xendit service issue detected. Enabled maintenance mode."
  5. Wait for Xendit to recover
  ```
- **If Xendit is up:** Investigate webhook handler code (see Step 4)
- **Time to stabilize:** ~1–2 minutes

---

## STEP 4: From the Meeting — What to Tell Your Team

**Send to Slack #akbai-alerts:**

```
🚨 P0 — Xendit Webhook Down

UptimeRobot detected the webhook endpoint returning 500 errors.
Status: Investigating from phone.

Initial assessment:
- [Did you rollback?] Rolled back Vercel to previous deployment
- [Or env var?] Checked env vars, no issues detected
- [Or waiting?] Waiting for Xendit status confirmation

Actions taken so far: [describe what you did above]

Next: Full investigation tonight. Will post postmortem within 24 hours.

Users cannot currently activate paid subscriptions.
Recovery ETA: 10 minutes.
```

---

## STEP 5: After Stabilization — Evening Diagnosis (When You Leave Globe)

Once the webhook is responding 200 again, do the following in the evening:

### Root Cause Analysis (30 minutes)

1. **Check the deploy diff** (if you rolled back)
   ```bash
   # In your local repo
   git log --oneline -5  # See recent commits
   git show <rollback-commit> # Review what changed
   ```
   Look for:
   - Changes to `/app/api/webhooks/xendit/route.ts`
   - Environment variable references
   - Import statements (did a package get corrupted?)

2. **Examine Sentry for the error detail**
   - Go to Sentry dashboard → Issues
   - Find "500 error in POST /api/webhooks/xendit"
   - Click into it, view the full stack trace
   - Look for: null pointer exceptions, missing imports, logic errors

3. **Check the webhook handler code**
   ```typescript
   // /app/api/webhooks/xendit/route.ts

   // Common mistakes that cause 500:
   // ❌ Missing null check on payment_id
   // ❌ XENDIT_SECRET_KEY undefined
   // ❌ Supabase client not initialized
   // ❌ RLS policy blocking the update
   // ❌ Webhook signature verification failing silently
   ```

4. **Verify idempotency logic** (gap D2 — critical for payments)
   - The webhook handler must deduplicate by `payment_id` before processing
   - Check `webhook_events` table for duplicate prevention
   - If missing: **This is why the error happened. Add it.**

### Fix and Test (15–30 minutes)

1. **If it was a code issue:**
   - Fix the bug locally
   - Test manually: create a Xendit webhook event in the Xendit dashboard test mode
   - Deploy to preview branch, test on preview URL
   - Merge to main and deploy to production

2. **If it was an env var issue:**
   - Rotate the secret (assuming it may have been exposed)
   - Update in Vercel
   - Redeploy

3. **Verify the fix:**
   - Check UptimeRobot: webhook endpoint returns 200
   - Create a test GCash payment in Xendit sandbox
   - Confirm the webhook fires and subscription activates
   - Check Sentry: no new 500 errors in the webhook handler

### Check for Affected Users (10 minutes)

```sql
-- Supabase SQL query to find users who may have paid during the outage
SELECT
  user_id,
  COUNT(*) as payment_attempts,
  MAX(created_at) as last_attempt
FROM webhook_events
WHERE event_type = 'payment'
  AND status = 'failed'  -- or status = 'unknown'
  AND created_at > NOW() - INTERVAL '2 hours'
GROUP BY user_id;
```

- If you find affected users:
  - Check Xendit dashboard for successful payments
  - Manually update their subscriptions in Supabase
  - Send them a DM: "Hi [Name], na-process na ang payment mo. Confirmed na ang subscription mo na. Salamat po!"

---

## STEP 6: Postmortem (Write Within 24 Hours)

Store at: `/docs/postmortems/2026-03-17-xendit-webhook-500.md`

### Template

```markdown
# Postmortem: Xendit Webhook 500 Errors

**Date:** 2026-03-17
**Severity:** P0
**Duration:** [HH:MM] – [HH:MM] PHT ([X] minutes)
**Author:** Anton del Rosario

## Summary
Xendit webhook endpoint returned 500 errors for [X] minutes.
Users who attempted payment during this window saw their subscriptions fail to activate.
Status: Resolved via [rollback / env var fix / code fix].

## Timeline
| Time | Event |
|------|-------|
| HH:MM | UptimeRobot detected webhook endpoint returning 500 |
| HH:MM | Slack alert received at Globe meeting |
| HH:MM | Phone-based investigation started |
| HH:MM | [Rollback / fix] applied |
| HH:MM | UptimeRobot confirmed 200 response |
| HH:MM | Full investigation completed |

## Root Cause
[Be specific. Example: "Missing null check in webhook handler caused unhandled exception when payment_id was null. Introduced in commit abc123."]

## Impact
- **Users affected:** [count] (X users attempted payment, Y succeeded)
- **Data impact:** None (payments recorded by Xendit, just not processed by AKBai)
- **Financial impact:** Potential ₱X lost if users refunded in frustration
- **Duration:** [X] minutes of payment failures

## What Went Well
- UptimeRobot caught it immediately
- Rollback (if used) was instant via Vercel
- Phone-based response prevented extended outage

## What Went Wrong
- [e.g., "No integration test for webhook idempotency logic"]
- [e.g., "Webhook handler should have null checks before processing"]
- [e.g., "Should have staged this code on preview environment first"]

## Action Items
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Add null check to webhook payment_id handler | Anton | 2026-03-18 | Pending |
| Add integration test for Xendit webhook edge cases | Anton | 2026-03-20 | Pending |
| Verify all affected users received their subscriptions | Anton | 2026-03-17 | Pending |

## Lessons Learned
- [What did this teach us about the system / process?]
```

---

## Checklist: Did You Do Everything?

- [ ] **Immediate stabilization:** Rolled back OR toggled maintenance mode OR confirmed Xendit up
- [ ] **Slack acknowledgment:** Posted status to #akbai-alerts within 5 minutes
- [ ] **Sentry diagnosis:** Read error details and identified likely cause
- [ ] **Evening deep-dive:** Analyzed the root cause, fixed code or env vars
- [ ] **User remediation:** Checked for affected users, manually updated subscriptions if needed
- [ ] **Postmortem:** Wrote postmortem within 24 hours (stored in `/docs/postmortems/`)
- [ ] **Prevention:** Added action items to prevent recurrence

---

## Reference: Xendit-Specific Notes

**Why Xendit webhooks are P0:**
- Users pay ₱399–₱899 via GCash
- If the webhook doesn't fire, the subscription doesn't activate
- User sees "Free tier" after paying — trust destroyed immediately
- This is the #1 reason users will churn or dispute payments

**Critical webhook requirements:**
- Webhook handler MUST verify Xendit signature (prevent spoofing)
- MUST deduplicate by `payment_id` (Xendit retries webhooks)
- MUST return 200 within 5 seconds (Xendit will retry if timeout)
- MUST handle all payment states: `PAID`, `FAILED`, `PENDING`
- MUST update subscriptions table atomically (RLS enforced)

**Monitoring:** UptimeRobot pings GET `/api/webhooks/xendit` every 5 minutes. If it returns anything other than 200, Anton gets SMS + Slack + Email.

---

## Key Contacts (for outside help if needed)

- **Xendit support:** developer.support@xendit.com (for API issues)
- **Vercel support:** support@vercel.com (for deployment issues)
- **Supabase support:** support@supabase.com (if DB is the bottleneck)

---

**This incident is resolved when:**
1. UptimeRobot shows green for 10 consecutive minutes
2. Sentry shows zero new 500 errors in the webhook handler
3. All affected users have active subscriptions
4. Postmortem is written and filed

**Good luck. You've got this.** — DevOps Engineer skill
