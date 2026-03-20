# AKBai — API Design Conventions
> REST conventions, error format, pagination, and auth patterns for all Next.js API routes.
> Last updated: March 2026

---

## Base URL & Versioning

All API routes live under `/app/api/` in the Next.js App Router. No explicit version prefix for Phase 1 — the API is internal (consumed only by the AKBai PWA client). If AKBai ever exposes a public API (Phase 3 Scale tier), introduce `/api/v1/` versioning at that point.

```
/api/ka/chat          POST   — KA conversation
/api/ka/briefing      GET    — Morning briefing
/api/resibo/scan      POST   — Receipt OCR
/api/payments/subscribe POST  — Create subscription
/api/deadlines        GET    — BIR deadline list
/api/transactions     GET    — Transaction list (paginated)
/api/transactions     POST   — Create transaction
/api/invoices         GET    — Invoice list
/api/invoices         POST   — Create invoice
/api/invoices/[id]/pdf GET   — Download invoice PDF
/api/user/profile     GET    — User profile
/api/user/profile     PATCH  — Update profile
/api/user/onboarding  POST   — Submit onboarding step
```

---

## HTTP Methods

| Method | Usage |
|--------|-------|
| GET | Retrieve resource(s). No side effects. Cacheable. |
| POST | Create a resource or trigger an action (OCR scan, AI chat). |
| PATCH | Partial update of a resource. Send only changed fields. |
| DELETE | Soft-delete only. Sets `deleted_at` timestamp. Never hard-deletes. |

PUT is intentionally omitted — PATCH for partial updates is simpler and less error-prone for a solo founder. There's no use case where full resource replacement is needed.

---

## Request Format

All request bodies use `Content-Type: application/json`. File uploads (receipt images) go directly to Supabase Storage; the API route receives the storage path, not the file itself.

```typescript
// Example: POST /api/transactions
{
  "amount": 3450,        // Always in centavos (₱34.50 = 3450)
  "type": "expense",     // "income" | "expense"
  "category": "ingredients",
  "description": "Flour and sugar for ube cake batch",
  "date": "2026-03-14",  // ISO 8601 date (no time — daily granularity)
  "receipt_id": "uuid"   // Optional: link to scanned receipt
}
```

### Money Convention

Store all monetary amounts as **integers in centavos** (Philippine centavos). This avoids floating-point precision issues with financial data.

```
₱34.50 → store as 3450
₱399.00 → store as 39900
₱0.16  → store as 16
```

Convert to display format (`₱34.50`) at the UI layer only. Never store formatted strings. Never use floats for money.

---

## Response Format

Every API route returns a consistent envelope. The client should only need to check `success` to determine the happy path.

### Success Response

```typescript
// 200 OK or 201 Created
{
  "success": true,
  "data": {
    // The actual payload — varies by endpoint
  }
}
```

### Error Response

```typescript
// 4xx or 5xx
{
  "success": false,
  "error": {
    "code": "TIER_LIMIT_REACHED",    // Machine-readable, SCREAMING_SNAKE_CASE
    "message": "Receipt scan limit reached for this month",  // English, for logs
    "message_tl": "Na-reach mo na ang scan limit mo ngayong buwan. Upgrade sa Pro para sa 50 scans/month.",  // Taglish, for display to user
    "details": {}                     // Optional: additional context
  }
}
```

### Error Code Catalog

Maintain a consistent set of error codes across all endpoints. These are the standard codes — add feature-specific codes as needed.

```
# Auth
AUTH_REQUIRED           — No valid session. Redirect to login.
AUTH_SESSION_EXPIRED    — Session expired. Show re-auth prompt (Gap D6).
AUTH_FORBIDDEN          — Valid session but not authorized for this resource.

# Tier & Limits
TIER_REQUIRED           — Feature requires Pro or Business tier.
TIER_LIMIT_REACHED      — Scan/query limit reached for current billing period.
TIER_UPGRADE_NEEDED     — Specific feature needs a higher tier.

# Validation
VALIDATION_ERROR        — Request body failed Zod validation. `details` contains field errors.
DUPLICATE_DETECTED      — Receipt deduplication caught a match (Gap C1). `details` contains the existing receipt.

# AI / Claude
AI_CIRCUIT_OPEN         — Daily Claude API spend cap reached. Graceful degradation.
AI_TIMEOUT              — Claude API didn't respond within 30s.
AI_PARSE_ERROR          — Claude response didn't match expected Zod schema.

# Payments
PAYMENT_FAILED          — Xendit payment processing failed.
SUBSCRIPTION_PAST_DUE   — Payment failed, in grace period.
SUBSCRIPTION_CANCELLED  — Subscription cancelled, tier downgraded.

# General
NOT_FOUND               — Resource doesn't exist or is soft-deleted.
RATE_LIMITED             — Too many requests. Include Retry-After header.
INTERNAL_ERROR          — Unexpected error. Logged to Sentry. Never expose internals.
```

### TypeScript Types

```typescript
// Shared between client and server via /lib/utils/zod-schemas/

import { z } from 'zod';

export const ApiSuccessSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    message_tl: z.string().optional(),
    details: z.record(z.unknown()).optional(),
  }),
});

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; message_tl?: string; details?: Record<string, unknown> } };
```

---

## Authentication

All API routes (except the Xendit webhook Edge Function) require a valid Supabase session. The pattern:

```typescript
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return Response.json(
      { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  // user.id is the authenticated user's UUID — use for all queries
  // ...
}
```

### Auth Rules

1. **Every query scopes to `user.id`.** Even with RLS as a safety net, application code should always include `WHERE user_id = ?` in queries. Defense in depth.
2. **Tier check before expensive operations.** Before a Claude API call or receipt scan, verify the user's subscription tier from the `subscriptions` table.
3. **Service role only in API routes.** The Supabase service role key bypasses RLS. It's used in API routes for cross-user admin operations (e.g., aggregating metrics for Anton's admin dashboard). Never in client code. Never in `NEXT_PUBLIC_` env vars.
4. **Xendit webhook auth.** The webhook Edge Function verifies the `x-callback-token` header against `XENDIT_WEBHOOK_TOKEN`. No Supabase user session — webhooks come from Xendit, not a logged-in user.

---

## Pagination

For list endpoints (transactions, invoices, deadlines), use cursor-based pagination. Offset-based pagination is simpler but degrades with large datasets and is vulnerable to shifting windows when new records are inserted.

### Cursor-Based Pagination

```typescript
// Request: GET /api/transactions?cursor=uuid&limit=20
// - cursor: the `id` of the last item from the previous page (omit for first page)
// - limit: items per page (default 20, max 50)

// Response:
{
  "success": true,
  "data": {
    "items": [...],          // The page of items
    "next_cursor": "uuid",   // ID of the last item in this page (null if no more pages)
    "has_more": true          // Whether more items exist
  }
}
```

### SQL Pattern

```sql
SELECT * FROM transactions
WHERE user_id = $1
  AND deleted_at IS NULL
  AND ($2::uuid IS NULL OR id < $2)  -- cursor condition
ORDER BY created_at DESC, id DESC     -- deterministic ordering
LIMIT $3 + 1;                         -- fetch one extra to determine has_more
```

Fetch `limit + 1` rows. If you get `limit + 1` results, there are more pages — return only `limit` items and set `has_more: true`, `next_cursor` to the last returned item's ID.

### Default page sizes

| Endpoint | Default | Max | Rationale |
|----------|---------|-----|-----------|
| transactions | 20 | 50 | Most users have < 100 transactions/month |
| invoices | 10 | 30 | Lower volume than transactions |
| ka_conversations | 30 | 50 | Chat history loads recent-first |
| deadlines | All | All | Never more than ~12 per year — no pagination needed |

---

## Rate Limiting

Phase 1: Implement at the application level in API route middleware. Use a simple in-memory counter per user per endpoint per minute. If AKBai outgrows this, add Cloudflare Rate Limiting rules.

```
Free tier:  10 AI queries/day (resets at midnight Asia/Manila)
Pro tier:   No per-minute limit, 50 receipt scans/month
Business:   No per-minute limit, 80 receipt scans/month

All tiers:  60 requests/minute per user across all endpoints (prevents abuse)
```

Return `429 Too Many Requests` with a `Retry-After` header (seconds) when rate limited.

---

## Date & Time Conventions

1. **Store in UTC.** All `TIMESTAMPTZ` columns in Postgres store UTC.
2. **Display in Asia/Manila.** All user-facing dates/times converted to `Asia/Manila` timezone.
3. **Date-only fields use `DATE` type.** Transactions, deadlines, and daily entries are date-granular. No timestamp needed.
4. **ISO 8601 in API.** All dates in request/response bodies use ISO 8601: `2026-03-14` for dates, `2026-03-14T08:30:00+08:00` for timestamps.
5. **BIR deadlines are date-critical.** A deadline of "March 15" means midnight Asia/Manila on March 15. Off-by-one timezone bugs here are compliance failures.

---

## File Upload Pattern (Receipts)

Receipt images don't go through the API route. They go directly to Supabase Storage, then the API route processes the stored image.

```
1. Client compresses image to < 1MB (browser-side)
2. Client uploads to Supabase Storage:
   Bucket: receipts
   Path: {user_id}/{year}/{month}/{uuid}.jpg
3. Client calls POST /api/resibo/scan with { storage_path: "..." }
4. API route fetches image from Storage → sends to Claude Haiku Vision
5. API route returns structured receipt data
```

This pattern keeps large binary uploads off the API route (which has request size limits) and uses Supabase Storage's built-in auth (RLS on storage buckets).

---

## CORS & Security Headers

Since the API is consumed only by the same-origin PWA, CORS is not needed in Phase 1. If a public API ships in Phase 3:

```
Access-Control-Allow-Origin: https://akbai.ph  (not *)
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

Security headers (set in `next.config.js` or Cloudflare):
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
```
