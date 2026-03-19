# AKBai — Tech Stack Reference (Solutions Architect)
> Version-pinned stack with conventions and rationale.
> Last updated: March 2026

---

## Frontend

| Component | Choice | Version | Notes |
|-----------|--------|---------|-------|
| Framework | Next.js | 14.x (App Router) | Server Components default. Streaming for long AI responses. |
| Language | TypeScript | 5.x (strict mode) | `"strict": true` in tsconfig. No `any`. All API responses typed via Zod. |
| Styling | Tailwind CSS | 3.x | Only styling solution. No CSS modules, no styled-components, no CSS-in-JS. |
| PWA | next-pwa | Latest | Offline Morning Briefing cache. "Add to Home Screen" flow in onboarding. |
| State | React state + Supabase Realtime | — | No Redux, no Zustand. Component-level state or Supabase subscriptions. |
| Validation | Zod | 3.x | Client-side form validation + API response validation. Single schema, both sides. |
| Icons | Lucide React | Latest | Tree-shakeable. Don't import the whole library. |
| Date/Time | date-fns | Latest | Lightweight. Always use `Asia/Manila` timezone. Never `moment.js`. |

### File Structure Convention

```
/app/
  layout.tsx              # Root layout (Plus Jakarta Sans font, metadata)
  (auth)/                 # Public auth routes
    login/page.tsx
    signup/page.tsx
    onboarding/           # Kilala Kita 5-step flow
  (app)/                  # Authenticated shell (requires session)
    layout.tsx            # App shell with nav, auth guard
    dashboard/page.tsx    # Ang Umaga Mo morning briefing
    (features)/
      resibo/page.tsx     # Resibo Scanner
      saan-napunta/page.tsx
      deadlines/page.tsx  # Deadline Watcher
      invoices/page.tsx   # Invoice Cards
      costing/page.tsx    # Costing Cards
      reply/page.tsx      # Reply Drafter
    settings/page.tsx
  api/                    # Server-side API routes
    resibo/
      scan/route.ts       # POST: receipt OCR via Claude Haiku Vision
    ka/
      chat/route.ts       # POST: KA conversation (Haiku or Sonnet by tier)
      briefing/route.ts   # GET: generate morning briefing
    payments/
      subscribe/route.ts  # POST: create Xendit subscription
      webhook/route.ts    # POST: (backup — primary webhook is Edge Function)
/components/
  ui/                     # Atomic: Button, Card, Badge, Input, Modal
  features/               # Feature-specific: ReceiptCard, DeadlineRow, BriefingCard
/lib/
  supabase/
    client.ts             # Browser Supabase client (anon key)
    server.ts             # Server Supabase client (service role — API routes only)
    middleware.ts          # Auth session refresh
  claude/
    client.ts             # Anthropic SDK wrapper
    circuit-breaker.ts    # Daily spend tracking + graceful degradation
    prompts/              # System prompt templates (KA persona, domain scopes)
  xendit/
    client.ts             # Xendit API wrapper
    verify-webhook.ts     # Signature verification
  utils/
    timezone.ts           # Asia/Manila helpers — all dates go through here
    currency.ts           # ₱ formatting, never "PHP"
    zod-schemas/          # Shared Zod schemas (API requests + responses)
```

### Component Conventions

- **Server Components by default.** Only add `'use client'` when the component needs interactivity.
- **Data fetching in Server Components.** Use `async` server components that fetch data directly. Pass data to client components as props.
- **Loading states.** Use `loading.tsx` files (App Router convention) for page-level loading. For AI operations, show animated thinking indicator with Taglish estimated wait time.
- **Error boundaries.** Use `error.tsx` files. Errors display Taglish messages to user, English to Sentry.

---

## Database — Supabase

| Component | Usage |
|-----------|-------|
| Postgres | Primary database. All business data. |
| Auth | Email magic link (OTP). No passwords. |
| Storage | Receipt images, invoice PDFs. Bucket per type, path prefix per user. |
| Realtime | Phase 2: multi-seat Business tier live updates. Phase 1: minimal use. |
| Edge Functions | Webhooks only (Xendit, future WhatsApp). Deno runtime. |

### Database Rules (Non-Negotiable)

1. **RLS on every table.** Policy: `auth.uid() = user_id` for SELECT, INSERT, UPDATE.
2. **Soft-delete only.** `deleted_at TIMESTAMPTZ NULL` on every table. Hard deletes prohibited.
3. **Audit columns.** `created_at TIMESTAMPTZ DEFAULT now()` and `updated_at TIMESTAMPTZ` (auto-trigger) on every table.
4. **user_id FK.** Every user-owned table references `auth.users(id)`.
5. **Service role key server-side only.** Never in `NEXT_PUBLIC_` env vars. Never in client code.
6. **UTC+8 display, UTC storage.** Store all timestamps as UTC in Postgres. Convert to `Asia/Manila` at the application layer for display and BIR deadline logic. Every query touching dates must go through timezone helpers.

### Core Tables

```sql
-- User & business
users              -- mirrors auth.users, business profile, feature flags
businesses         -- business details (name, type, BIR registration)

-- Financial data
transactions       -- income/expense records (amount, category, date, receipt_id?)
receipts           -- scanned receipt metadata + storage_path
invoices           -- invoice records (linked to transactions on payment)
daily_entries      -- daily check-in (user_id, date, sales, expenses)

-- AI & conversations
ka_conversations   -- chat history (user_id, message, role, timestamp, domain)
redirect_logs      -- out-of-scope queries logged for demand signal

-- Compliance & operations
bir_deadlines      -- generated BIR schedule per user/business type
subscriptions      -- Xendit state (tier, status, renewal_date, grace_until)
webhook_events     -- idempotency (payment_id, event_type UNIQUE)
daily_api_spend    -- circuit breaker tracking (date, model, tokens, cost_usd)
```

---

## AI Layer — Claude API

| Model | ID | Use Case | Cost Tier |
|-------|-----|----------|-----------|
| Haiku | claude-haiku-4-5 | OCR, classification, free tier Q&A | Low (~$0.25/M input, ~$1.25/M output) |
| Sonnet | claude-sonnet-4-6 | KA reasoning, briefings, reply drafting | Medium (~$3/M input, ~$15/M output) |

### Cost Control

- **Circuit breaker:** `daily_api_spend` table. Sum cost per day. If exceeds cap → graceful degradation (cached response or warm Taglish "busy" message). Initial cap: ~$5/day.
- **Token efficiency:** Always request structured JSON output. Avoid open-ended "write whatever you want" prompts. Constrain output with Zod schemas.
- **Receipt scan budget:** Must stay under ₱0.20/scan. Currently ₱0.16. Monitor if Anthropic changes pricing.

---

## Payments — Xendit

| Feature | Detail |
|---------|--------|
| Subscription billing | Xendit Recurring Payments API |
| Primary method | GCash (dominant in PH MSME market) |
| Secondary | Credit/debit cards, OTC |
| Phase 0C fallback | Concierge GCash (manual collection for first 20–50 users) |
| Webhook endpoint | Supabase Edge Function (not Next.js API route) |
| Idempotency | `webhook_events` table: `(payment_id, event_type)` UNIQUE constraint |

---

## Deployment & Infrastructure

| Layer | Choice | Cost |
|-------|--------|------|
| Hosting | Cloudflare Pages | Free (M1–M6), $5/mo (M7+) |
| CDN | Cloudflare Edge | Included |
| DNS | Cloudflare | Included |
| Error tracking | Sentry | Free tier (sufficient for MVP) |
| Analytics | PostHog | Free tier (sufficient for MVP) |
| Uptime | UptimeRobot | Free tier |

### Environment Variables

```
# Public (safe for client)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_POSTHOG_KEY

# Secret (server-side only — NEVER NEXT_PUBLIC_)
ANTHROPIC_API_KEY
SUPABASE_SERVICE_ROLE_KEY
XENDIT_SECRET_KEY
XENDIT_WEBHOOK_TOKEN
SENTRY_DSN
```

---

## Development Workflow

| Practice | Convention |
|----------|-----------|
| Git | Feature branches → PR to main. No direct pushes. Cloudflare preview per PR. |
| Testing | Vitest (unit), Playwright (e2e). Focus on: BIR logic, OCR, RLS, payment flows. No tests for trivial CRUD. |
| Linting | ESLint + Prettier. Run on pre-commit hook. |
| Types | Strict TypeScript. Zod schemas shared between client and server. |
| Commits | Conventional commits (`feat:`, `fix:`, `chore:`). Sentry release tags on production deploy. |
