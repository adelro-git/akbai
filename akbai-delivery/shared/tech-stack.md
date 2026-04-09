# AKBai — Canonical Tech Stack Reference
> Used by: solutions-architect, fullstack-engineer, data-architect, devops-engineer, ai-engineer
> Last updated: March 2026 | Source: Roadmap v14, Operations Playbook v7

---

## Frontend

| Item | Choice | Why |
|------|--------|-----|
| Framework | Next.js 16 App Router | Server components reduce client bundle; App Router enables layouts and streaming |
| Language | TypeScript (strict mode) | Type safety critical for financial data |
| Styling | Tailwind CSS only | No CSS modules, no styled-components |
| UI Components | Shadcn/UI | Composable, accessible, ships zero unused CSS. No MUI or Bootstrap. |
| PWA | next-pwa | Offline support for Morning Briefing cache |
| Data Fetching | TanStack Query + Persister | Offline-first caching; queued mutations sync when connectivity returns. Critical for intermittent 4G users. |
| State | React state + Supabase Realtime | No Redux; keep it simple |

**Architecture:** All API routes in Next.js (`/app/api/`). No separate backend. No Python. No FastAPI.

**Next.js 16 gotchas:**
- Middleware uses `proxy.ts` with `export async function proxy()` (NOT `middleware.ts`)
- React 19 controlled inputs bug: use `useRef` + `onClick` for forms, not `onChange`/`onSubmit`
- App code lives in `/frontend/src/`

**File/folder conventions:**
```
/app/
  (auth)/          # Auth routes (login, signup, onboarding)
  (app)/           # Authenticated app shell
    dashboard/     # Ang Umaga Mo morning briefing
    (features)/
      resibo/      # Resibo Scanner
      saan-napunta/# Expense dashboard
      deadlines/   # Deadline Watcher
      invoices/    # Invoice Cards
      costing/     # Costing Cards
      reply/       # Reply Drafter
  api/             # API routes (server-side Claude calls, webhooks)
/components/
  ui/              # Atomic components (Button, Card, Badge)
  features/        # Feature-specific components
/lib/
  supabase/        # Supabase client (browser + server)
  claude/          # Claude API wrapper + circuit breaker
  xendit/          # Xendit webhook handlers
```

---

## Database — Supabase

**Instance:** Single Supabase project (dev + prod via branch or env vars)
**Postgres version:** Latest stable via Supabase

**Non-negotiable rules:**
1. **RLS on every table.** No table exists without a row-level security policy.
2. **Soft-delete only.** Every table has `deleted_at TIMESTAMPTZ NULL`. Hard deletes prohibited.
3. **Audit columns.** Every table has `created_at` and `updated_at` (auto-updated via trigger).
4. **user_id foreign key.** Every user-owned table references `auth.users(id)`.
5. **Service role key never in client code.** Only in server-side API routes and Edge Functions.

**Core tables (14):**
```
users             — mirrors auth.users, stores business profile
businesses        — business details per user (name, type, BIR registration)
transactions      — all income/expense records
receipts          — scanned receipt metadata + Supabase Storage path
invoices          — invoice records (linked to transactions on payment)
bir_deadlines     — generated BIR filing schedule per user/business type
ka_conversations  — KA chat history (user_id, message, role, timestamp, domain)
subscriptions     — Xendit subscription state (tier, status, renewal)
daily_entries     — daily check-in records (user_id, date, sales, expenses)
webhook_events    — idempotency table (payment_id, event_type UNIQUE)
daily_api_spend   — circuit breaker tracking (daily Claude API spend per user/global)
audit_log         — system-wide audit trail for compliance
redirect_logs     — out-of-scope query logging for demand signal (domain-expandable architecture)
cost_cards        — ingredient costing records (Build 8)
```

**RLS policy pattern (apply to every table):**
```sql
-- Read own rows
CREATE POLICY "Users can read own [table]"
  ON [table] FOR SELECT
  USING (auth.uid() = user_id);

-- Insert own rows
CREATE POLICY "Users can insert own [table]"
  ON [table] FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update own rows
CREATE POLICY "Users can update own [table]"
  ON [table] FOR UPDATE
  USING (auth.uid() = user_id);
```

**Edge Functions** (Supabase Deno runtime): Use for webhooks only (Xendit payment events, future WhatsApp webhooks). All other server logic in Next.js API routes.

---

## AI Layer — Claude API

**Models in use:**
| Model | Use Case | Tier |
|-------|----------|------|
| claude-haiku-4-5 | Receipt OCR, classification, quick Q&A, free tier queries | Free + Pro + Business |
| claude-sonnet-4-6 | KA reasoning, morning briefing, reply drafting, complex analysis | Pro + Business only |

**API call pattern (always server-side):**
```typescript
// /app/api/[feature]/route.ts
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

// Always use structured output with Zod validation
const ResponseSchema = z.object({ ... });

export async function POST(req: Request) {
  // 1. Auth check
  // 2. Tier check (Haiku vs Sonnet)
  // 3. Daily spend cap check (circuit breaker)
  // 4. Claude API call
  // 5. Zod parse response
  // 6. Store result in Supabase
  // 7. Return to client
}
```

**Circuit breaker:** Daily spend cap tracked in Supabase (daily_api_spend table). If cap reached → return graceful degradation response, not error. Cap: ~$5/day initially, increase with revenue.

**Receipt scan cost:** ₱0.16/scan ($0.0028 USD × 57.2 PHP/USD exchange rate).

---

## Payments — Xendit

**Primary:** Xendit subscription API (recurring billing)
**Payment methods:** GCash (primary), credit/debit cards, OTC (Over-the-counter)
**Fallback for first 20–50 users:** Concierge GCash (manual) if Xendit KYC pending

**Webhook handler (Supabase Edge Function):**
- Verify Xendit signature on every webhook
- Idempotency key to prevent duplicate processing
- On payment success → update subscriptions table → grant tier access
- On payment failure → send KA notification → 3-day grace period

---

## Deployment

**Phase 1 Primary:** Vercel (free tier sufficient for MVP; simpler DX for solo founder)
**Month 7+ Migration Target:** Cloudflare Pages ($5/mo = ₱286; cost optimization when traffic justifies)
**CDN:** Vercel Edge Network (Phase 1) → Cloudflare Edge Network (post-migration)
**Domains:** Managed via Cloudflare DNS (regardless of hosting platform)

**Environment variables (Vercel / Cloudflare Pages):**
```
ANTHROPIC_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY    # Server-side only, never NEXT_PUBLIC_
XENDIT_SECRET_KEY
XENDIT_WEBHOOK_TOKEN
SENTRY_DSN
NEXT_PUBLIC_POSTHOG_KEY
RESEND_API_KEY
```

---

## Transactional Email — Resend

**Provider:** Resend (free tier: 100 emails/day, 3,000/month)
**Use cases:** 7-day winback sequence, BIR deadline reminders, payment failure notifications, welcome email
**Why Resend:** Developer-friendly API, generous free tier covers 500+ users, lightweight integration via `resend` npm package.

```typescript
// /lib/resend/client.ts
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
```

---

## Monitoring

| Tool | Purpose | Alert Channel |
|------|---------|---------------|
| Sentry | Error tracking, release tags | Email + mobile |
| PostHog | User analytics, feature flags | Dashboard |
| UptimeRobot | Endpoint uptime, Xendit webhook health | SMS + email |

**Sentry release tagging:** Every production deploy gets a Sentry release tag (`git rev-parse --short HEAD`). Required for incident postmortems.

---

## Development Conventions

**TypeScript:** Strict mode. No `any`. All API responses typed via Zod schemas.
**Components:** Server Components default. `'use client'` only when needed (interactivity, hooks).
**Error handling:** Every API route returns `{ success: boolean, data?: T, error?: { code: string, message: string, message_tl?: string } }`.
**User-facing errors:** Conversational Filipino, warm, actionable. Console errors: English.
**Money handling:** All monetary amounts stored as integers in centavos (₱34.50 = 3450). Display conversion to peso format happens at the UI layer only. Never use floating-point for money.
**Testing:** Vitest (unit), Playwright (e2e). No tests for simple CRUD — focus on BIR logic, OCR, RLS, payment flows.
**Git:** Feature branches, PR to main, Vercel preview per PR. No direct pushes to main.

### Timezone Convention

All user-facing timestamps use **UTC+8 (Asia/Manila)**. Use the shared `@/lib/timezone` utilities — never raw `new Date()` for display.

| Use Case | Utility | Example |
|----------|---------|---------|
| Daily boundaries (circuit breaker, query limits) | `getManilaToday()` | `'2026-03-22'` |
| Display timestamps | `formatManilaDate(date, format)` | `'Mar 22, 2026'` |
| ISO timestamp with offset | `getManilaTimestamp()` | `'2026-03-22T18:30:45+08:00'` |
| Supabase raw queries | `toManilaSQL(column)` | `created_at AT TIME ZONE 'Asia/Manila'` |
| Convert Date for date-fns | `toManila(date)` | Manila time in UTC fields |
| Timezone constant | `MANILA_TZ` | `'Asia/Manila'` |

**Rules:**
- All user-facing timestamps: UTC+8 (Asia/Manila)
- Use `@/lib/timezone` utilities — never raw `new Date()` for display
- Supabase queries: use `AT TIME ZONE 'Asia/Manila'` via `toManilaSQL()` helper
- Daily boundaries (circuit breaker, query limits): use `getManilaToday()`

---

## System Prompt Architecture (Build 0 — Roadmap v14)

**Domain-expandable design** — implemented from Phase 1:
- System prompt structured with labeled modular scope sections: `[TAX_SCOPE]`, `[COMMUNICATION_SCOPE]`, `[FINANCIAL_SCOPE]`, etc.
- New Phase 4+ domains (Marketing, Strategy, HR, Inventory) added by appending scope sections — no rewrite
- Conversations table has `domain` column (default: "financial") for analytics
- Out-of-scope redirects logged in `redirect_logs` table (query, category, timestamp) for demand signal
- Knowledge base designed as tagged collection, not flat file — new domains plug into same retrieval architecture

**System prompt assembly (server-side only, 6 layers):**
1. Core KA Persona — shared identity, conversational Filipino style, disclaimer rules
2. Active Domain Scopes — modular sections loaded per conversation context ([TAX_SCOPE], [FINANCIAL_SCOPE], etc.)
3. Feature Context — feature-specific instructions injected per active screen/flow
4. User Context — business profile fetched by auth.uid()
5. Conversation History — last N messages for this user only (domain-tagged)
6. Current Message — unique per session

**Financial disclaimer (non-negotiable, in system prompt):**
"Paalala: Ang guidance na ito ay informational lang. I-verify mo sa iyong accountant o CPA bago mag-file."

**Persistent in-app disclaimer (visible in chat UI):**
"AKBai provides informational guidance only — hindi ito professional financial or tax advice."

---

## Performance Budgets (Hard Targets)

| Metric | Target | Notes |
|--------|--------|-------|
| First Contentful Paint (FCP) | < 2.0s | On Philippine 4G (median ~15 Mbps) |
| Time to Interactive (TTI) | < 3.5s | Critical for users on mid-range Android |
| Lighthouse Performance Score | > 85 | Measured on mobile profile |
| JavaScript bundle size | < 200KB | Gzipped; Shadcn/UI tree-shaking helps |
| Claude chat response (p95) | < 5s | Server-side, includes API round-trip |
| Receipt OCR response (p95) | < 8s | Haiku Vision, includes image upload |
| Supabase query (p95) | < 100ms | With RLS policies active |

---

## PWA Caching Strategy (next-pwa)

| Resource | Strategy | Rationale |
|----------|----------|-----------|
| Static assets (JS, CSS, fonts) | Cache-first | Immutable after build; aggressive caching |
| API responses (/api/chat, /api/scan) | Network-first | Financial data must be fresh; fall back to cached only for offline |
| Morning Briefing (Ang Umaga Mo) | Stale-while-revalidate | Show cached briefing immediately, refresh in background |
| Images (receipts, logos) | Cache-first | Receipt images don't change after upload |
| HTML pages | Network-first | Ensure latest UI; fall back to app shell offline |

**Offline minimum:** Cached Morning Briefing + conversational Filipino "Offline ka ngayon" message + queued mutations via TanStack Persister.
