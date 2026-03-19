# Xendit Webhook 500 Error — Incident Response Guide
**For: Anton del Rosario | Situation: Slack alerts during work meeting**
**Stack:** Next.js 14 → Cloudflare Pages → Supabase Edge Function (webhook handler)
**Severity:** HIGH (payment processing blocked)

---

## Immediate Actions (While in Meeting)

### 1. Assess Impact Scope
**What to check on mobile (quick 2-min):**
- [ ] Is the webhook endpoint *receiving* requests from Xendit? Or are requests not arriving at all?
  - Go to Cloudflare Pages > Analytics > Requests. Filter for your webhook path (e.g., `/api/webhooks/xendit`). Does the request count match when you expect payments?
  - If zero requests: Xendit may not have your correct endpoint URL, or it's cached an old domain.
  - If requests exist but all 500s: Your Edge Function code is crashing.

- [ ] Check Supabase realtime: Are subscriptions table rows being updated?
  - Open Supabase Dashboard > `subscriptions` table. Check `updated_at` timestamps. If they're stale (older than last payment attempt), the webhook isn't processing.

- [ ] Quick Sentry check: Any error spike for the webhook route?
  - Open Sentry > AKBai Project > filter for releases in the last 2 hours. Look for errors matching "xendit" or your webhook path.

### 2. Status Page (First 15 Minutes)
Even if you can't fix immediately, reduce user confusion:
- [ ] Post status in your #akbai-users Slack channel (if you have one) or in-app banner:
  > "🔧 Payment Processing: We're experiencing issues with payment verification. Your payment may have gone through — we're investigating. You'll get a confirmation email or SMS shortly. Questions? Reply here."
- [ ] This prevents support panic and shows you're aware.

---

## Root Cause Diagnosis (While at Globe or After Meeting)

### Scenario A: Requests NOT Arriving at Your Endpoint
**Symptoms:** Cloudflare shows zero requests during payment window.

**Check:**
1. Xendit webhook settings — Go to your Xendit Dashboard:
   - Settings > Webhooks > Payment/Subscription events
   - Verify the endpoint URL is correct. Example: `https://yourdomain.com/api/webhooks/xendit`
   - If you recently redeployed or changed domains, the old URL may still be configured.
   - Xendit doesn't auto-update — you must do it manually.

2. Webhook signature verification: Is your code rejecting legitimate requests?
   - In your Edge Function (`/supabase/functions/xendit-webhook/index.ts`), check the signature verification step:
   ```typescript
   const isValid = verifyXenditSignature(
     request,
     process.env.XENDIT_WEBHOOK_TOKEN
   );
   ```
   - If `XENDIT_WEBHOOK_TOKEN` is wrong or missing, every request fails auth and returns 401 before the 500 error occurs.
   - Check your Cloudflare env vars: does `XENDIT_WEBHOOK_TOKEN` match the token in Xendit Dashboard?

3. Idempotency key mismatch: Are you double-processing?
   - Xendit retries webhooks on 500. Your code must check the `webhook_events` table for `(payment_id, event_type)` UNIQUE constraint.
   - If that constraint is missing or broken, duplicate payments could cause cascading errors.

**Quick fix (if it's a config issue):**
- Verify and update the Xendit webhook URL in Xendit Dashboard.
- Verify `XENDIT_WEBHOOK_TOKEN` is live in Cloudflare > Environment variables.
- Redeploy if you touched env vars.

---

### Scenario B: Requests Arriving but Edge Function Crashes (500 Error)
**Symptoms:** Cloudflare logs show HTTP 500 responses.

**Check:**
1. Supabase function logs:
   - Open Supabase Dashboard > Edge Functions > `xendit-webhook` > Logs
   - Look for runtime errors from the last 30 minutes. Common culprits:
     - `Error: Unexpected token 'u' in JSON at position ...` — malformed JSON parsing
     - `ReferenceError: XENDIT_WEBHOOK_TOKEN is not defined` — missing env var
     - `Error: Cannot read property 'insert' of undefined` — Supabase client initialization failed
     - SQL constraint violation (e.g., `UNIQUE constraint failed on webhook_events(payment_id)`)

2. Is `webhook_events` table set up correctly?
   - Supabase Dashboard > SQL Editor > run:
   ```sql
   SELECT * FROM webhook_events
   ORDER BY created_at DESC
   LIMIT 10;
   ```
   - This should show recent rows. If the table doesn't exist or has no rows, the idempotency logic is broken.

3. Supabase connection from Edge Function:
   - Edge Functions need explicit service role auth. Check:
   ```typescript
   const supabase = createClient(
     process.env.SUPABASE_URL,
     process.env.SUPABASE_SERVICE_ROLE_KEY
   );
   ```
   - If `SUPABASE_SERVICE_ROLE_KEY` is missing from Edge Function env vars, this will fail.

**Quick fix (if it's a code issue):**
- Check the Supabase function logs for the exact error message.
- If it's a missing env var: add it to Supabase > Settings > Edge Functions > Environment variables.
- If it's a SQL error: re-run migrations to ensure `webhook_events` table exists with correct schema.
- Redeploy the function.

---

### Scenario C: Payments Processing but User Not Seeing Tier Access
**Symptoms:** Webhook 500 → user's subscription tier not updating → they can't use Pro features.

**Check:**
1. Subscription status flow:
   - Xendit webhook fires → `webhook_events` row inserted (idempotency)
   - `subscriptions` table updated with `status='active'` and `tier='pro'`
   - Supabase RLS policy on `subscriptions` table allows user to read their own row
   - Next.js client fetches tier on page load and stores in TanStack Query cache

   Trace each step:
   - [ ] Is the payment in Xendit Dashboard? (Status: success?)
   - [ ] Does `subscriptions` table have an updated row for this user? (Run query on Supabase)
   - [ ] Does `users` table have `tier='pro'` set? (Or is it still 'free'?)
   - [ ] Is the client cache stale? (Hard refresh the app: Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

2. Grace period logic:
   - Per gap registry (C2), failed payments should have a 3-day grace period, not immediate demotion.
   - Check if the user was demoted to Free when they shouldn't have been.

**Quick fix:**
- If it's a cache issue: tell the user to hard refresh the app.
- If the row exists in Supabase but the client doesn't see it: check for an RLS policy that's blocking their own read.

---

## Step-by-Step Triage (Post-Meeting, ~30 Minutes)

### Phase 1: Confirm the Scope
1. Open Cloudflare Analytics:
   - Dashboard > Workers/Pages > akbai-delivery > Requests
   - Filter: Path contains "xendit" or "/api/webhooks"
   - Note: How many requests in last 2 hours? All 500? Mixed?

2. Open Supabase Edge Function Logs:
   - Dashboard > Edge Functions > xendit-webhook > Logs
   - Copy any error message.

3. Check the `subscriptions` table:
   ```sql
   SELECT id, user_id, tier, status, updated_at
   FROM subscriptions
   WHERE updated_at > NOW() - INTERVAL '2 hours'
   ORDER BY updated_at DESC
   LIMIT 20;
   ```
   - Are there recent updates? Or is it stale?

### Phase 2: Identify the Root Cause
Based on your findings from Phase 1:

| Finding | Likely Cause | Fix |
|---------|--------------|-----|
| Cloudflare shows 0 requests for xendit path | Xendit not sending to your endpoint OR old URL cached | Check Xendit Dashboard webhook URL; update if needed |
| Cloudflare shows requests but all 500s | Edge Function crash | Check Supabase function logs; look for env var or SQL errors |
| Subscriptions table has no recent updates | Idempotency failure or webhook handler silent failure | Check `webhook_events` table; verify UNIQUE constraint |
| Subscriptions updated but users don't see tier change | Client cache stale OR RLS policy blocking read | User hard refresh; check RLS on subscriptions table |

### Phase 3: Apply the Fix
Depending on your diagnosis:

**If it's a Xendit URL issue:**
1. Go to Xendit Dashboard > Settings > Webhooks
2. Update the payment success webhook URL to match your live domain
3. Save

**If it's an env var issue:**
1. Supabase Dashboard > Settings > Edge Functions > Environment variables
2. Verify:
   - `SUPABASE_URL` is present
   - `SUPABASE_SERVICE_ROLE_KEY` is present
   - `XENDIT_WEBHOOK_TOKEN` is present
3. If you added or fixed any, redeploy the function:
   ```bash
   supabase functions deploy xendit-webhook
   ```

**If it's a code issue:**
1. Check recent commits to the webhook handler.
2. If you recently changed the schema (e.g., renamed a column in `subscriptions`), the insert may be failing.
3. Review the migration:
   ```bash
   supabase db list
   ```
4. If the migration didn't apply, run it manually:
   ```bash
   supabase db execute --file ./migrations/latest.sql
   ```

**If it's a database schema issue:**
1. Verify the `webhook_events` table exists:
   ```sql
   SELECT * FROM information_schema.tables
   WHERE table_name = 'webhook_events';
   ```
2. If it doesn't exist, create it:
   ```sql
   CREATE TABLE webhook_events (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     payment_id TEXT NOT NULL,
     event_type TEXT NOT NULL,
     received_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE(payment_id, event_type)
   );
   ```

### Phase 4: Verify the Fix
1. Trigger a test payment:
   - Go to your Next.js app > Subscribe > Pro
   - Complete a test GCash payment (or use Xendit test mode)
   - Check Cloudflare logs: does the request arrive?
   - Check Supabase logs: does the function return 200?
   - Check `subscriptions` table: is the tier updated?

2. Monitor for 10 minutes:
   - Watch Sentry for new webhook errors
   - Check Slack alerts — do they stop?

---

## Rollback Plan (If Fix Breaks Something)

If you deploy a fix and it makes things worse (e.g., payment success is now silently ignored):

1. **Revert the code change:**
   ```bash
   git revert <commit-hash>
   git push origin main
   # Cloudflare Pages auto-redeploys on push
   ```

2. **Rollback env vars:**
   - Supabase > Settings > Edge Functions > Environment variables
   - Revert to known-good values from your notes

3. **Check function version:**
   - Supabase > Edge Functions > xendit-webhook > Deployments
   - You can promote a previous working version if the latest is broken

4. **Post status:**
   > "Payment issue resolved. Payments are processing normally now. If you had trouble earlier, your payment may have already succeeded — check your email for confirmation."

---

## Post-Incident: Prevent Future Occurrences

Once the incident is closed, add these checks to your **Incident Response Runbook** (gap registry D7):

1. **Weekly webhook health check** (set as recurring task on Monday):
   - Trigger a test payment through your payment flow
   - Verify the subscription tier updates
   - Log result in a Slack channel

2. **Sentry release tagging:**
   - Every Cloudflare Pages deploy should tag a Sentry release
   - This lets you correlate errors with code changes

3. **UptimeRobot monitoring for webhooks:**
   - Add a monitor: `POST https://yourdomain.com/api/webhooks/xendit` with a test payload
   - Alert if response is not 200
   - Catch issues in staging before they hit production

4. **Webhook event logging:**
   - Log every webhook event to a `webhook_logs` table (distinct from `webhook_events`)
   - Include: timestamp, payload, response status, error message
   - This gives you a searchable audit trail

5. **On-call rotation (even solo):**
   - Define your response SLA: "Critical payment issues get 30-minute response time"
   - Set up Slack/email alerts to your phone
   - Have this guide open in a browser tab during launch window

---

## Right Now: Action Items for Your Meeting

**You can handle this in 5 minutes from your phone:**

1. **Check Cloudflare Analytics** (1 min):
   - Are requests arriving at the webhook? Yes/No?

2. **Check Supabase Logs** (2 min):
   - Paste the error message into a Slack thread or note

3. **Post status to users** (1 min):
   - If many people are affected, give them a status update

4. **Set reminder for after meeting** (1 min):
   - "Fix Xendit webhook 500s — 30 min deep dive"
   - Estimated time to fix: 15–45 min depending on root cause

**Once you can focus (after meeting):**
- Run Phase 1 & 2 triage (30 min total)
- Apply fix (5–15 min)
- Verify fix (10 min)
- Post all-clear (2 min)

---

## Key Xendit Webhook Fields (Cheat Sheet)

When debugging webhook payloads, look for these in the Xendit JSON:

```json
{
  "id": "invoice-id-from-xendit",
  "event": "payment.succeeded" | "payment.failed",
  "created": 1234567890,
  "data": {
    "id": "payment-id",
    "reference_id": "your-user-id-or-order-id",
    "status": "PAID" | "FAILED",
    "currency": "PHP",
    "amount": 39900,
    "business_id": "your-xendit-merchant-id"
  }
}
```

**Critical:**
- `data.status` determines if the payment is successful
- `data.reference_id` is how you map back to your user
- `event` tells you the event type (payment.succeeded vs. payment.failed)
- Always verify the webhook signature before trusting the payload

---

## Need Help? (When to Escalate)

| Scenario | Action |
|----------|--------|
| Can't access Cloudflare or Supabase | Check your login credentials; use password manager. If 2FA broken, use backup codes. |
| Webhook signature validation keeps failing | Verify the `XENDIT_WEBHOOK_TOKEN` in Cloudflare env vars matches exactly what's in Xendit Dashboard. No typos. |
| Users reporting duplicate charges | Check `webhook_events` table for duplicate `payment_id` rows. If yes, the idempotency logic failed. This is a data integrity issue — might need manual refunds via Xendit Dashboard. |
| Edge Function logs are empty | The function may not be deployed. Redeploy: `supabase functions deploy xendit-webhook` |
| Still 500 after all these checks | Slack message to Xendit support (they have 24/7 support for critical integrations). Include: error message, webhook ID, user email, timestamp. |

---

**Last Updated:** March 17, 2026
**Scope:** AKBai Phase 1 (Cloudflare Pages → Supabase Edge Function → Xendit)
**Author Note:** This guide assumes a solo founder working business hours. Aim for <1 hour diagnosis + fix. Post-incident, add monitoring to catch this before Slack alerts.
