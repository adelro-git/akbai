# AKBai — Data Flows Reference
> Documents how data moves through the AKBai system for each core feature.
> Last updated: March 2026 | Source: Roadmap v13, Operations Roadmap v6, Tech Stack v1

---

## Table of Contents

1. [Receipt Scanning Flow (Resibo Scanner)](#1-receipt-scanning-flow)
2. [Expense Aggregation Flow (Saan Napunta)](#2-expense-aggregation-flow)
3. [BIR Deadline Calculation Flow](#3-bir-deadline-calculation-flow)
4. [Invoice Generation Flow](#4-invoice-generation-flow)
5. [Payment / Subscription Flow](#5-payment--subscription-flow)
6. [Morning Briefing Flow (Ang Umaga Mo)](#6-morning-briefing-flow)
7. [Daily Check-In Flow](#7-daily-check-in-flow)
8. [KA Conversation Flow](#8-ka-conversation-flow)
9. [Data Deletion Flow (NPC Right to Erasure)](#9-data-deletion-flow)

---

## 1. Receipt Scanning Flow

**Feature:** Resibo Scanner (Build 3)
**Tier:** Pro / Business only
**Cost target:** < ₱0.20 per scan | **Latency target:** < 8s end-to-end

```
User captures photo (client, 'use client' component)
  │
  ├─ Client-side: compress image to < 1MB
  │
  ├─ Upload to Supabase Storage
  │    Bucket: receipts
  │    Path: receipts/{user_id}/{uuid}.{ext}
  │    RLS: user can only write to their own prefix
  │
  ├─ Insert receipt row (status: 'pending')
  │    Table: receipts
  │    Fields: user_id, business_id, storage_path, status='pending'
  │
  ├─ Call POST /api/resibo/scan
  │    │
  │    ├─ Auth check (Supabase session)
  │    ├─ Tier check (must be Pro or Business)
  │    ├─ Scan limit check (subscriptions.scans_used_this_period < scan_limit)
  │    ├─ Circuit breaker check (daily_api_spend)
  │    │
  │    ├─ Fetch image from Supabase Storage (service role)
  │    ├─ Send to Claude Haiku Vision
  │    │    System prompt: structured extraction, JSON output
  │    │    Expected output: { merchant, date, items[], subtotal, tax, total, category }
  │    │
  │    ├─ Zod validate response
  │    │
  │    ├─ Deduplication check
  │    │    Compute dedup_hash: SHA-256(total + date + merchant)
  │    │    Query: SELECT id FROM receipts
  │    │           WHERE user_id = $1 AND dedup_hash = $2
  │    │           AND created_at > (now() - interval '30 minutes')
  │    │    If match found → set status='flagged', flagged_reason='duplicate'
  │    │                    → return to client with duplicate warning
  │    │    If no match → continue
  │    │
  │    ├─ Update receipt row (status: 'completed')
  │    │    Fill: merchant, receipt_date, items, subtotal, tax_amount,
  │    │          total_amount, extracted_category, ocr_confidence, dedup_hash
  │    │
  │    ├─ Create transaction row
  │    │    Table: transactions
  │    │    type='expense', amount=total_amount, category=extracted_category,
  │    │    source='receipt_scan', receipt_id=receipt.id,
  │    │    transaction_date=receipt_date
  │    │
  │    ├─ Increment subscriptions.scans_used_this_period
  │    ├─ Update daily_api_spend (add Haiku cost)
  │    ├─ Log to audit_log (action='create', resource_type='receipts')
  │    │
  │    └─ Return structured receipt card to client
  │
  └─ Client renders receipt card with "Flag as Wrong" button
```

**Data written:**
- `receipts` — 1 row (full OCR result)
- `transactions` — 1 row (expense record)
- `subscriptions` — increment `scans_used_this_period`
- `daily_api_spend` — increment Haiku cost
- `audit_log` — 1 row

**Error paths:**
- Image too large → client-side compression retry, then error message
- OCR fails → `receipts.status = 'failed'`, warm conversational Filipino error to user
- Duplicate detected → `receipts.status = 'flagged'`, user confirms or discards
- Circuit breaker tripped → graceful degradation, receipt saved but not processed (queue for later)
- Scan limit reached → warm conversational Filipino upgrade prompt

---

## 2. Expense Aggregation Flow

**Feature:** Saan Napunta (Build 4) + Dashboard (Build 2)
**Tier:** All (limited for Free)

```
User opens Saan Napunta or Dashboard
  │
  ├─ Client requests GET /api/expenses/summary?period={month|week|custom}
  │
  ├─ Server-side query (RLS enforced):
  │    SELECT
  │      category,
  │      type,
  │      SUM(amount) as total,
  │      COUNT(*) as count
  │    FROM transactions
  │    WHERE user_id = auth.uid()
  │      AND deleted_at IS NULL
  │      AND transaction_date BETWEEN $start AND $end
  │    GROUP BY category, type
  │    ORDER BY total DESC
  │
  ├─ Additional queries:
  │    - Cash position: SUM(income) - SUM(expenses) for the period
  │    - Trend comparison: same query for previous period
  │    - Top categories: top 5 expense categories by total
  │
  ├─ Server assembles response:
  │    {
  │      period: { start, end },
  │      income_total, expense_total, net,
  │      categories: [{ name, total, count, percentage }],
  │      trend: { previous_net, change_percentage },
  │      cash_position: current_net
  │    }
  │
  └─ Client renders dashboard cards / expense breakdown
```

**Data read:** `transactions` (aggregated, never raw rows to the dashboard)
**No data written** (read-only flow)

**Notes:**
- All monetary calculations happen server-side, never in the client. Floating-point in JavaScript is a footgun for financial data.
- Aggregation queries use the `idx_transactions_user_type_date` and `idx_transactions_user_category` indexes.
- Free tier sees a limited view (current month only, no trend comparison).

---

## 3. BIR Deadline Calculation Flow

**Feature:** Deadline Watcher (Build 5) + Morning Briefing
**Tier:** All (Free: 1 reminder per filing. Pro/Business: 7/3/1-day sequence)

### Deadline Generation (on onboarding completion or business profile update)

```
Kilala Kita onboarding complete OR business profile updated
  │
  ├─ Server-side: determine applicable BIR forms based on:
  │    - businesses.bir_tax_type ('8_percent_flat', 'graduated', 'vat_registered')
  │    - businesses.registration_type
  │    - Calendar year
  │
  ├─ BIR form schedule (simplified):
  │    8% flat tax:
  │      - 1701Q (quarterly) — Apr 15, Aug 15, Nov 15
  │      - 1701A (annual) — Apr 15 of following year
  │      - 2551Q (percentage tax quarterly) — Apr 25, Jul 25, Oct 25, Jan 25
  │    Graduated rates:
  │      - 1701Q (quarterly) — same dates
  │      - 1701A (annual) — same date
  │      - 0619E (expanded withholding monthly)
  │    VAT registered (adds):
  │      - 2550M (monthly VAT) — 20th of following month
  │      - 2550Q (quarterly VAT) — 25th of following quarter month
  │
  ├─ Generate bir_deadlines rows for next 12 months
  │    For each deadline:
  │      form_type, form_description, deadline_date, filing_period
  │      status='upcoming'
  │
  └─ Insert into bir_deadlines (bulk insert)
```

### Notification Trigger (daily cron job)

```
Daily cron (Supabase pg_cron or Edge Function, runs 6AM PHT)
  │
  ├─ Query upcoming deadlines:
  │    SELECT * FROM bir_deadlines
  │    WHERE deleted_at IS NULL
  │      AND status IN ('upcoming', 'notified')
  │      AND deadline_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
  │
  ├─ For each deadline, check notification rules:
  │    7 days out AND notified_7day = false → send notification, set notified_7day = true
  │    3 days out AND notified_3day = false → send notification, set notified_3day = true
  │    1 day out AND notified_1day = false  → send notification, set notified_1day = true
  │    Past due AND status != 'overdue'     → set status = 'overdue'
  │
  ├─ Tier gating:
  │    Free tier → only 1 notification per filing (3-day only)
  │    Pro/Business → full 7/3/1-day sequence
  │
  ├─ Notification delivery:
  │    Phase 1: In-app notification (store in a notifications table or ka_conversations)
  │    Phase 2: Push notification via PWA service worker
  │
  └─ All times in Asia/Manila (UTC+8) — CRITICAL gap A3
```

**Data written:** `bir_deadlines` (status + notification flags updated)
**Data read:** `bir_deadlines`, `subscriptions` (tier check), `businesses` (tax type)

---

## 4. Invoice Generation Flow

**Feature:** Invoice Cards (Build 7)
**Tier:** Pro / Business

```
User creates invoice via KA chat or Invoice Cards UI
  │
  ├─ Client sends POST /api/invoices/create
  │    Body: { client_name, client_email, items[], due_date, notes }
  │
  ├─ Server-side:
  │    ├─ Auth + tier check
  │    ├─ Generate invoice_number
  │    │    Format: INV-{YYYYMM}-{seq}
  │    │    Query: SELECT MAX(invoice_number) FROM invoices
  │    │           WHERE business_id = $1 AND deleted_at IS NULL
  │    │    Increment sequence
  │    │
  │    ├─ Calculate totals:
  │    │    subtotal = SUM(items[].quantity * items[].unit_price)
  │    │    tax_amount = subtotal * (tax_rate / 100)  -- if VAT registered
  │    │    total_amount = subtotal + tax_amount
  │    │
  │    ├─ Insert into invoices table (status='draft')
  │    │
  │    ├─ Generate PDF (if requested):
  │    │    Server-side PDF generation → upload to Supabase Storage
  │    │    Path: invoices/{user_id}/{invoice_id}.pdf
  │    │    Update invoices.pdf_storage_path
  │    │
  │    └─ Return invoice object to client
  │
  ├─ User reviews and sends (status: 'draft' → 'sent')
  │    Phase 1: user manually sends PDF via Messenger/email
  │    Phase 2: auto-send via WhatsApp Business API
  │
  └─ Payment recording:
       User marks invoice as paid → status='paid', paid_at=now()
       Create income transaction:
         Table: transactions
         type='income', amount=total_amount,
         source='manual', category='invoice_payment'
       Link: invoices.payment_transaction_id = transaction.id
```

**Data written:** `invoices` (1 row), `transactions` (1 row on payment)
**Data read:** `invoices` (for sequential numbering), `businesses` (for VAT rate), `subscriptions` (tier check)

**Notes:**
- Invoice numbering is NOT BIR Official Receipt numbering. OR generation requires BIR legal sign-off (gap D3).
- Invoice PDF generation uses a server-side template — no client-side PDF libraries (too heavy for mobile).

---

## 5. Payment / Subscription Flow

**Feature:** Subscription management (Build 6)
**Tier:** Transition from Free → Pro/Business

### New Subscription

```
User selects tier on pricing screen
  │
  ├─ Client sends POST /api/payments/subscribe
  │    Body: { tier: 'pro', payment_method: 'gcash' }
  │
  ├─ Server-side:
  │    ├─ Create Xendit subscription via API
  │    │    Set callback URL to Edge Function endpoint
  │    │
  │    ├─ Insert/update subscriptions row
  │    │    tier=selected, status='trialing' or 'active'
  │    │    xendit_subscription_id, xendit_customer_id
  │    │
  │    └─ Return Xendit payment URL → redirect user to GCash/payment
  │
  ├─ User completes payment on Xendit-hosted page
  │
  └─ Xendit fires webhook → Edge Function (see below)
```

### Webhook Processing (Edge Function)

```
Xendit webhook → POST /functions/v1/xendit-webhook
  │
  ├─ Verify Xendit signature (XENDIT_WEBHOOK_TOKEN)
  │    If invalid → return 401, log to Sentry
  │
  ├─ Idempotency check:
  │    INSERT INTO webhook_events (payment_id, event_type, payload)
  │    ON CONFLICT (payment_id, event_type) DO NOTHING
  │    If no rows inserted → duplicate, return 200 OK
  │
  ├─ Process event:
  │    payment.success:
  │      UPDATE subscriptions SET
  │        status='active',
  │        current_period_start=webhook.period_start,
  │        current_period_end=webhook.period_end,
  │        scans_used_this_period=0,  -- reset on new period
  │        grace_period_end=NULL
  │      UPDATE users.feature_flags → enable tier features
  │
  │    payment.failed:
  │      UPDATE subscriptions SET
  │        status='past_due',
  │        grace_period_end=now() + interval '3 days',
  │        grace_notifications_sent=0
  │      Queue KA notification (warm conversational Filipino, not threatening)
  │
  │    subscription.cancelled:
  │      UPDATE subscriptions SET
  │        status='cancelled',
  │        cancelled_at=now()
  │      Schedule tier downgrade at current_period_end
  │      (don't immediately remove access — user paid through the period)
  │
  ├─ Log to audit_log (action='payment', resource_type='subscriptions')
  │
  └─ Return 200 OK
```

### Grace Period Enforcement (daily cron)

```
Daily cron (runs 9AM PHT)
  │
  ├─ Query past_due subscriptions:
  │    SELECT * FROM subscriptions
  │    WHERE status = 'past_due' AND grace_period_end IS NOT NULL
  │
  ├─ For each:
  │    If grace_period_end < now():
  │      → Downgrade to Free tier
  │      → Update subscriptions: tier='free', status='expired', scan_limit=0
  │      → Send KA notification: "Nag-expire na ang Pro mo. Upgrade anytime!"
  │    Else if grace_notifications_sent < 3:
  │      → Send daily KA reminder (warm, not threatening)
  │      → Increment grace_notifications_sent
  │
  └─ Log all downgrades to audit_log
```

**Data written:** `subscriptions`, `webhook_events`, `audit_log`
**Data read:** `subscriptions`, `webhook_events` (idempotency)

---

## 6. Morning Briefing Flow

**Feature:** Ang Umaga Mo (Build 4)
**Tier:** Pro/Business (full), Free (teaser)
**Time:** Generated early morning (5-6AM PHT), displayed when user opens app

```
Daily cron (5:30AM PHT) — generates briefings for all active Pro/Business users
  │
  ├─ Query active subscribers:
  │    SELECT u.id, u.first_name, b.id as business_id, b.business_type
  │    FROM users u
  │    JOIN businesses b ON b.user_id = u.id
  │    JOIN subscriptions s ON s.user_id = u.id
  │    WHERE s.tier IN ('pro', 'business') AND s.status = 'active'
  │      AND u.deleted_at IS NULL
  │
  ├─ For each user, gather data:
  │    1. Yesterday's transactions:
  │       SELECT type, SUM(amount) FROM transactions
  │       WHERE user_id=$1 AND transaction_date = CURRENT_DATE - 1
  │       GROUP BY type
  │
  │    2. Upcoming BIR deadlines (next 7 days):
  │       SELECT form_type, deadline_date FROM bir_deadlines
  │       WHERE user_id=$1 AND deadline_date BETWEEN today AND today+7
  │         AND status IN ('upcoming','notified')
  │
  │    3. Cash position (current month):
  │       SELECT SUM(CASE WHEN type='income' THEN amount ELSE -amount END)
  │       FROM transactions WHERE user_id=$1
  │         AND transaction_date >= date_trunc('month', CURRENT_DATE)
  │
  │    4. Unpaid invoices:
  │       SELECT COUNT(*), SUM(total_amount) FROM invoices
  │       WHERE user_id=$1 AND status IN ('sent','overdue')
  │
  ├─ Send to Claude Sonnet for briefing generation:
  │    System prompt: KA persona, user context, briefing template
  │    Input: structured data from above
  │    Output: conversational Filipino briefing card (2-3 short paragraphs)
  │
  ├─ Store briefing:
  │    Insert into ka_conversations
  │    role='assistant', domain='financial',
  │    conversation_session_id = new UUID (morning briefing session)
  │
  ├─ Cache for offline access (PWA):
  │    Store briefing in a cache-friendly format
  │    Service worker caches the latest briefing
  │
  └─ Update daily_api_spend (Sonnet cost per briefing)
```

**Data read:** `transactions`, `bir_deadlines`, `invoices`, `users`, `businesses`, `subscriptions`
**Data written:** `ka_conversations` (briefing), `daily_api_spend`

**Notes:**
- Free tier gets a "teaser" — a simplified version generated with Haiku (just cash position, no analysis).
- Briefings are cached by the PWA for offline access — users packing orders at 6AM with spotty LTE can still see yesterday's briefing.
- The briefing generation is the most expensive daily operation. At 100 Pro users, that's ~100 Sonnet calls at 5:30AM. Budget accordingly.

---

## 7. Daily Check-In Flow

**Feature:** Daily Check-In (Ops Roadmap v6)
**Tier:** All
**Time:** Default 8PM PHT, user-configurable

```
8PM PHT → trigger in-app check-in modal
  │
  ├─ Client shows quick-entry form:
  │    "Magkano ang benta mo ngayon?" → total_sales input
  │    "Magkano ang gastos?" → total_expenses input
  │    Optional: notes text field
  │
  ├─ User submits (60-second target)
  │
  ├─ Client sends POST /api/daily-entry
  │    Body: { total_sales, total_expenses, notes, entry_date }
  │
  ├─ Server-side:
  │    ├─ Auth check
  │    ├─ Insert into daily_entries
  │    │    ON CONFLICT (user_id, business_id, entry_date) DO UPDATE
  │    │    (allows correction of same-day entry)
  │    │
  │    ├─ Create/update corresponding transactions:
  │    │    If total_sales > 0 →
  │    │      INSERT transactions (type='income', amount=total_sales,
  │    │        source='daily_checkin', transaction_date=entry_date)
  │    │    If total_expenses > 0 →
  │    │      INSERT transactions (type='expense', amount=total_expenses,
  │    │        source='daily_checkin', transaction_date=entry_date)
  │    │
  │    └─ Return confirmation to client
  │
  └─ Client shows KA confirmation:
       "Na-save na! ₱{sales} ang benta, ₱{expenses} ang gastos mo ngayon."
```

**Data written:** `daily_entries` (1 row), `transactions` (up to 2 rows)
**Data read:** `daily_entries` (conflict check), `businesses` (default business)

---

## 8. KA Conversation Flow

**Feature:** Core chat interface
**Tier:** All (Free: Haiku only, 10/day. Pro/Business: Sonnet + unlimited)

```
User sends message in chat UI
  │
  ├─ Client sends POST /api/ka/chat
  │    Body: { message, conversation_session_id }
  │
  ├─ Server-side:
  │    ├─ Auth check
  │    ├─ Rate limit check (Free: 10/day)
  │    │    SELECT COUNT(*) FROM ka_conversations
  │    │    WHERE user_id=$1 AND role='user'
  │    │      AND created_at > CURRENT_DATE
  │    │    If >= 10 AND tier='free' → return limit message
  │    │
  │    ├─ Circuit breaker check (daily_api_spend)
  │    │
  │    ├─ Insert user message into ka_conversations
  │    │    role='user', content=message, domain=detected_domain
  │    │
  │    ├─ Assemble system prompt (5 layers):
  │    │    1. Core KA Persona (conversational Filipino, disclaimers, never-do rules)
  │    │    2. Active Domain Scopes ([TAX_SCOPE], etc.)
  │    │    3. User Context:
  │    │       SELECT * FROM users WHERE id = auth.uid()
  │    │       SELECT * FROM businesses WHERE user_id = auth.uid()
  │    │       SELECT tier FROM subscriptions WHERE user_id = auth.uid()
  │    │    4. Conversation History:
  │    │       SELECT role, content FROM ka_conversations
  │    │       WHERE user_id=$1 AND conversation_session_id=$2
  │    │       ORDER BY created_at ASC LIMIT 20
  │    │    5. Current Message
  │    │
  │    ├─ Determine model:
  │    │    Free tier → claude-haiku-4-5
  │    │    Pro/Business → claude-sonnet-4-6
  │    │
  │    ├─ Call Claude API
  │    │
  │    ├─ Zod validate response
  │    │
  │    ├─ Check for out-of-scope redirect:
  │    │    If response indicates out-of-scope →
  │    │      INSERT redirect_logs (query_text, detected_domain)
  │    │
  │    ├─ Insert assistant message into ka_conversations
  │    │    role='assistant', content=response,
  │    │    model_used, input_tokens, output_tokens, response_time_ms
  │    │
  │    ├─ Update daily_api_spend
  │    │
  │    └─ Return response to client (streaming preferred for Sonnet)
  │
  └─ Client renders response with "Flag as Wrong" button
```

**Data written:** `ka_conversations` (2 rows: user + assistant), `daily_api_spend`, optionally `redirect_logs`
**Data read:** `users`, `businesses`, `subscriptions`, `ka_conversations` (history)

---

## 9. Data Deletion Flow (NPC Right to Erasure)

**Feature:** NPC compliance (RA 10173, Phase 0A)
**Tier:** All users have the right to request data deletion

```
User requests account deletion (Settings → Delete Account)
  │
  ├─ Client shows confirmation dialog:
  │    "Sigurado ka bang gusto mong i-delete ang account mo?
  │     Mababalik pa ang data mo within 7 days."
  │
  ├─ User confirms → POST /api/account/delete
  │
  ├─ Server-side (immediate):
  │    ├─ Soft-delete user profile:
  │    │    UPDATE users SET deleted_at = now() WHERE id = auth.uid()
  │    │
  │    ├─ Soft-delete all user data (cascade via application logic):
  │    │    UPDATE businesses SET deleted_at = now() WHERE user_id = $1
  │    │    UPDATE transactions SET deleted_at = now() WHERE user_id = $1
  │    │    UPDATE receipts SET deleted_at = now() WHERE user_id = $1
  │    │    UPDATE invoices SET deleted_at = now() WHERE user_id = $1
  │    │    UPDATE bir_deadlines SET deleted_at = now() WHERE user_id = $1
  │    │    UPDATE ka_conversations SET deleted_at = now() WHERE user_id = $1
  │    │    UPDATE subscriptions SET deleted_at = now() WHERE user_id = $1
  │    │    UPDATE daily_entries SET deleted_at = now() WHERE user_id = $1
  │    │
  │    ├─ Disable Supabase Auth account (not delete yet)
  │    │
  │    ├─ Cancel Xendit subscription (if active)
  │    │
  │    ├─ Log to audit_log:
  │    │    action='deletion_request', resource_type='users', actor_type='user'
  │    │
  │    └─ Return confirmation: "Account mo ay naka-schedule na for deletion."
  │
  ├─ 7-day purge window:
  │    User can recover by logging in during this window
  │    On login: UNDO all soft-deletes (SET deleted_at = NULL)
  │
  └─ After 7 days (purge cron job):
       ├─ Hard-delete all user data (service role):
       │    DELETE FROM receipts WHERE user_id = $1
       │    DELETE FROM transactions WHERE user_id = $1
       │    ... (all user-owned tables)
       │
       ├─ Delete files from Supabase Storage:
       │    Remove receipts/{user_id}/ directory
       │    Remove invoices/{user_id}/ directory
       │
       ├─ Delete Supabase Auth user
       │
       ├─ Anonymize audit_log entries:
       │    UPDATE audit_log SET actor_id = NULL, ip_address = NULL
       │    WHERE actor_id = $1
       │    (Audit log rows are retained but de-identified)
       │
       └─ Log final purge to audit_log:
            action='data_purge_complete', metadata={user_id_hash}
```

**Data written:** All user tables (soft-delete), then hard-delete after 7 days
**Critical note:** Audit log entries are anonymized, not deleted. This maintains the audit trail for NPC compliance while removing PII.

---

## Data Flow Security Invariants

These are true for every flow above:

1. **All Claude API calls are server-side.** No API key exposure to the client. Ever.
2. **RLS is always active.** Even server-side queries using the anon key respect RLS. Service role is only for system operations (webhooks, cron, purge).
3. **All monetary calculations happen server-side.** JavaScript floating-point is not used for financial math. Postgres `NUMERIC(12,2)` is the source of truth.
4. **Timestamps are UTC in the database, PHT in the UI.** Conversion happens in the application layer. BIR deadline logic must be PHT-aware.
5. **Every write to user data is auditable.** Either through the audit_log table or through the `created_at`/`updated_at` columns.
