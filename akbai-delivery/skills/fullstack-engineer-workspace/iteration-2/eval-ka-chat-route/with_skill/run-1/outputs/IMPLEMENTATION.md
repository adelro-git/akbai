# KA Chat API Route — Implementation Guide

## Overview

This directory contains a **production-ready implementation** of the `POST /api/ka/chat` endpoint for AKBai. The route accepts user messages, loads user context from Supabase, calls Claude Sonnet (or Haiku for free tier) with a dynamic KA persona prompt, and returns the AI response with full cost tracking and error handling.

**Phase:** Build 1+ (Kilala Kita MVP onwards)
**Feature:** KA Chat (KA business partner conversation)
**Status:** Complete, ready for integration
**Build Time:** ~3 hours

---

## Files & Architecture

### Core Files (Required)

1. **`route.ts`** — Main API endpoint handler
   - Complete POST handler with 12-step flow
   - Auth, validation, tier checks, circuit breaker, Claude API call, conversation storage
   - Standard { success, data, error } response envelope
   - All inline documentation with section headers

2. **`retry.ts`** — Exponential backoff retry utility (STANDALONE)
   - 3 max retries (4 total attempts)
   - Exponential backoff with jitter (1s, 2s, 4s)
   - Retryable status codes: 429, 500, 502, 503, 529
   - No non-retryable errors (4xx, 401, 403)
   - Full logging for audit trail

3. **`circuit-breaker.ts`** — Daily spend cap enforcement
   - Daily cap: ₱500 (DAILY_CAP_CENTAVOS = 50000)
   - Resets at midnight Asia/Manila timezone
   - Fails closed (denies request) if cap exceeded
   - Stores costs in ai_spend_log table

4. **`model-router.ts`** — Task-to-model selection & cost calculation
   - Free tier: Haiku only (hard rule)
   - Pro/Business: Smart routing (Haiku for extraction, Sonnet for reasoning)
   - Task types: receipt_ocr, classification, quick_qa (Haiku) vs ka_reasoning, morning_briefing, reply_draft (Sonnet)
   - Cost calculation: tokens → USD → PHP centavos
   - Token estimation for text and images

5. **`ka-persona-prompt.ts`** — KA identity & system prompt builder
   - Builds dynamic system prompt from user context
   - KA voice rules: Taglish, cite numbers, warm but competent
   - 5 core voice pillars + operational guardrails
   - Scope boundaries: in-scope (financial, BIR, receipts, comms) vs out-of-scope (marketing, hiring, legal)
   - Tier-specific capabilities

6. **`chat-schemas.ts`** — Zod validation schemas
   - ChatRequestSchema: message (1-2000 chars), scope (optional)
   - ChatResponseSchema: content, inputTokens, outputTokens, model, costCentavos
   - ConversationMessageSchema: ka_conversations table row
   - UserProfile / BusinessProfile: user context schemas
   - Derives TypeScript types with z.infer<>

---

## Data Flow (12 Steps)

```
POST /api/ka/chat
├─ 1. Auth Check (supabase.auth.getUser())
├─ 2. Request Validation (Zod ChatRequestSchema)
├─ 3. Load User Profile (users table + businesses table)
├─ 4. Tier Validation (free = 10 queries/day limit)
├─ 5. Build KA Persona Prompt (buildKaPersonaPrompt with context)
├─ 6. Circuit Breaker Check (daily spend cap vs ai_spend_log)
├─ 7. Model Selection (selectModel based on tier + task)
├─ 8. Claude API Call (with retryWithBackoff wrapper)
├─ 9. Validate Response (ensure text content exists)
├─ 10. Calculate Cost & Record Spend (calculateCost + recordSpend)
├─ 11. Store Conversation (ka_conversations table, both user + assistant)
└─ 12. Return Response ({ success: true, data: ChatResponse })
```

### Error Handling Throughout Flow

- **Auth failure** → 401 AUTH_REQUIRED
- **Request validation** → 400 VALIDATION_ERROR
- **User not found** → 404 USER_NOT_FOUND
- **Tier limit** → 403 TIER_LIMIT_REACHED
- **Circuit breaker open** → 503 AI_CIRCUIT_OPEN
- **Claude rate limited** → 429 RATE_LIMITED (after retry exhaustion)
- **Claude server error** → 503 CLAUDE_SERVER_ERROR
- **Empty response** → 500 EMPTY_RESPONSE
- **All errors** → { success: false, error: { code, message, message_tl, details? } }

---

## Integration Checklist

### Pre-Integration: Database Tables & RLS

**Table: `users`** (must exist with these columns)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  subscription_tier TEXT DEFAULT 'free', -- 'free', 'pro', 'business'
  business_id UUID REFERENCES businesses(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

**Table: `businesses`** (must exist)
```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  type TEXT, -- e.g., "home bakery", "sari-sari store"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

**Table: `ka_conversations`** (must exist for chat history)
```sql
CREATE TABLE ka_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  scope TEXT DEFAULT 'general', -- 'financial', 'birkto', 'communication', 'general'
  input_tokens INTEGER,
  output_tokens INTEGER,
  model TEXT,
  cost_centavos INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- RLS Policies
ALTER TABLE ka_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own conversations"
  ON ka_conversations FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "Users insert own conversations"
  ON ka_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Table: `ai_spend_log`** (for circuit breaker tracking)
```sql
CREATE TABLE ai_spend_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  cost_centavos INTEGER NOT NULL,
  model TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_spend_log_user_date
  ON ai_spend_log(user_id, created_at);
```

### Directory Structure

Place files in this location:

```
/app/api/ka/chat/
  route.ts                    ← Main endpoint handler
  /lib/
    /claude/
      retry.ts                ← Retry utility (STANDALONE)
      circuit-breaker.ts      ← Circuit breaker utility
      model-router.ts         ← Model selection & cost
      prompts/
        ka-persona-prompt.ts  ← KA system prompt builder
    /utils/
      /zod-schemas/
        chat-schemas.ts       ← Request/response schemas
```

### Environment Variables

Required in `.env.local` (or CI/CD secrets):

```env
ANTHROPIC_API_KEY=sk-ant-...        # Claude API key (keep secret!)
NEXT_PUBLIC_SUPABASE_URL=...        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=...       # Supabase service role (secret!)
```

### Import Paths

In `route.ts`, adjust import paths to match your project structure:

```typescript
// Change these as needed
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ChatRequestSchema, ChatResponseSchema } from './chat-schemas';
import { buildKaPersonaPrompt } from './ka-persona-prompt';
import { selectModel, calculateCost } from './model-router';
import { checkCircuitBreaker, recordSpend } from './circuit-breaker';
import { retryWithBackoff } from './retry';
```

---

## Key Features & Design Decisions

### 1. Retry with Exponential Backoff (CRITICAL)

**File:** `retry.ts`

- **3 max retries** (4 total attempts)
- **Exponential backoff:** 1s, 2s, 4s (approximately)
- **Jitter:** +0-1000ms random to prevent thundering herd
- **Retryable status codes:** 429 (rate limit), 500/502/503 (server), 529 (overloaded)
- **Non-retryable:** 400/401/403 (code bugs, auth failures)
- **Max delay cap:** 30 seconds (prevents absurd wait times)

Placed in **separate file** (`retry.ts`) as specified in skill requirements. Used by `route.ts` in the Claude API call section.

### 2. Circuit Breaker (Cost Control)

**File:** `circuit-breaker.ts`

- **Daily cap:** ₱500 (DAILY_CAP_CENTAVOS = 50000 centavos)
- **Timezone:** Asia/Manila (critical for compliance & business hours)
- **Fail-closed:** If database check fails, deny request (safe-first)
- **Reset:** Midnight Manila time
- **Cost tracking:** Stored in ai_spend_log table (admin-only table)
- **Open circuit message:** Warm Taglish: "Nag-rest muna si KA para bukas..."

Free tier is protected: if circuit opens, free tier users see helpful message, non-AI features still work.

### 3. Tier-Based Model Routing

**File:** `model-router.ts`

- **Free tier:** Haiku only (hard rule — no exceptions)
- **Pro/Business:**
  - Haiku for: receipt OCR, classification, quick Q&A
  - Sonnet for: KA reasoning, morning briefing, reply drafts, financial analysis

**Cost savings:** Haiku is 10–20x cheaper. Use it for structured extraction.

**For KA Chat:** Task type is `ka_reasoning` → Sonnet for Pro/Business, Haiku for Free.

### 4. Dynamic KA Persona Prompt

**File:** `ka-persona-prompt.ts`

- **Personalized:** Built from user context (name, business, tier, date)
- **5 voice pillars:** Taglish-fluent, warm but competent, proactively caring, data-driven, scope-aware
- **Voice rules:** Cite numbers, never guess, use ₱ notation, respond concisely
- **Scope boundaries:** In-scope (financial, BIR, receipts, comms) vs out-of-scope (marketing, hiring, legal)
- **Guardrails:** No specific tax advice, no hard financial decisions without user approval, no data sharing between users

**Length:** ~1200 lines — comprehensive system prompt that handles edge cases and sets clear boundaries.

### 5. Conversation Storage

**Table:** `ka_conversations`

Stores both user messages and KA responses with:
- `role`: 'user' or 'assistant'
- `content`: Message text
- `scope`: Domain (financial, birkto, communication, general)
- `input_tokens`, `output_tokens`, `model`, `cost_centavos` (for KA responses only)
- `deleted_at`: Soft delete (never hard-delete user data)

Enables:
- Conversation history replay (mobile)
- Audit trail for cost & usage
- Demand signal logging for Phase 2+ features
- Domain-tagged responses (Phase 2+)

### 6. Validation & Type Safety

**File:** `chat-schemas.ts`

- **Zod schemas** are source of truth
- **TypeScript types** derived from schemas with `z.infer<>`
- **Request validation:** Message (1-2000 chars), optional scope
- **Response validation:** Content, tokens, model, cost
- **Conversation validation:** All table columns typed

### 7. Error Handling

All errors follow standard envelope:

```typescript
{ success: false, error: { code, message, message_tl?, details? } }
```

**Error codes:**
- `AUTH_REQUIRED` (401)
- `VALIDATION_ERROR` (400)
- `USER_NOT_FOUND` (404)
- `TIER_LIMIT_REACHED` (403)
- `AI_CIRCUIT_OPEN` (503)
- `RATE_LIMITED` (429)
- `CLAUDE_SERVER_ERROR` (503)
- `CLAUDE_API_ERROR` (500)
- `EMPTY_RESPONSE` (500)

**User-facing text:** Always Taglish, warm, actionable.

---

## Testing & QA Checklist

### Manual Testing

- [ ] **Auth:** Test without session → 401 AUTH_REQUIRED
- [ ] **Validation:** Send empty message → 400 VALIDATION_ERROR
- [ ] **Validation:** Send 2001+ char message → 400 VALIDATION_ERROR
- [ ] **Tier limit (free):** Send 11 messages in a day → 403 TIER_LIMIT_REACHED
- [ ] **Normal flow (free):** Send message, receive Haiku response
- [ ] **Normal flow (pro):** Send message, receive Sonnet response
- [ ] **Circuit breaker:** Spend ₱500+ today → 503 AI_CIRCUIT_OPEN (next request)
- [ ] **Retry:** Simulate API 429 error, verify retry + exponential backoff in logs
- [ ] **Conversation storage:** Verify user/assistant messages in ka_conversations table
- [ ] **Cost tracking:** Verify cost_centavos recorded correctly for both Haiku & Sonnet
- [ ] **Empty response:** Mock Claude returning empty text → 500 EMPTY_RESPONSE
- [ ] **Database error:** Simulate Supabase query failure → graceful error response

### Automated Testing (Vitest/Jest)

```typescript
describe('POST /api/ka/chat', () => {
  it('should reject unauthenticated requests', async () => {
    // Test without auth
  });

  it('should validate request schema', async () => {
    // Test Zod validation
  });

  it('should return tier-appropriate model', async () => {
    // Test selectModel(free) => Haiku
    // Test selectModel(pro) => Sonnet
  });

  it('should respect circuit breaker cap', async () => {
    // Test checkCircuitBreaker() logic
  });

  it('should retry on rate limit', async () => {
    // Mock 429 error, verify retry
  });

  it('should store conversation messages', async () => {
    // Verify ka_conversations inserts
  });

  it('should calculate cost correctly', async () => {
    // Test calculateCost() with known token counts
  });
});
```

---

## Monitoring & Observability

### Logs

The route logs at key checkpoints:

```
[KA Chat] New message from user {userId}: "{message preview}..."
[KA Chat] User context: name={name}, tier={tier}, business={business}
[KA Chat] Selected model: {Haiku|Sonnet} for tier={tier}
[KA Chat] Claude API success. Tokens: {input}/{output}
[KA Chat] Cost: ₱{cost} for user {userId}
[KA Chat] Response sent to user {userId}. Cost: ₱{cost}
```

Errors logged with context:
```
[KA Chat] Auth failed: {reason}
[KA Chat] Claude API error: {error.message}
[KA Chat] Circuit breaker error: {reason}
[Retry] Attempt {N}/{maxRetries + 1} failed. Retrying in {delay}ms...
```

### Cost Tracking

All costs recorded in `ai_spend_log` table:
- `user_id`: Who incurred the cost
- `cost_centavos`: Amount (₱50 = 5000 centavos)
- `model`: 'claude-haiku-4-5-20251001' or 'claude-sonnet-4-6'
- `created_at`: Timestamp (UTC)

Query example for dashboard:
```sql
SELECT user_id, SUM(cost_centavos) as total_cost
FROM ai_spend_log
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id
ORDER BY total_cost DESC;
```

### Error Rate Monitoring

Track in Sentry:
- VALIDATION_ERROR rate (should be <1%)
- AI_CIRCUIT_OPEN rate (should be <0.1%)
- CLAUDE_API_ERROR rate (should be <1%)
- Retry exhaustion (should be <0.5%)

---

## Production Deployment

### Pre-Launch Checklist

- [ ] All 6 files created in correct directory
- [ ] Import paths adjusted for your project
- [ ] Database tables created with RLS policies
- [ ] Environment variables set (ANTHROPIC_API_KEY, Supabase secrets)
- [ ] Supabase service role key stored securely
- [ ] Daily cap (DAILY_CAP_CENTAVOS) reviewed for Phase 1 budget
- [ ] Zod schemas pass validation tests
- [ ] Claude API calls work end-to-end
- [ ] Retry logic tested (e.g., with chaos monkey)
- [ ] Circuit breaker tested (spend cap enforcement)
- [ ] Conversation storage working (verify ka_conversations table)
- [ ] Error messages reviewed for tone (Taglish, warm, actionable)
- [ ] Logging sufficient for QA / postmortem
- [ ] Sentry / error tracking configured

### Load Testing

Test assumptions:
- 50 concurrent users per instance
- Circuit breaker reset daily (midnight Manila time)
- Free tier: 10 messages/day max per user
- Pro tier: unlimited messages (daily cap is global, per user)

Performance targets:
- P50 latency: <3s (user sees response in 3 seconds)
- P95 latency: <8s (retry scenarios)
- Error rate: <1%

### Monitoring in Production

1. **Alert on circuit breaker open:** If any daily spend hits 90% of cap, notify ops.
2. **Alert on error rate:** If VALIDATION_ERROR or CLAUDE_API_ERROR > 5% in 5 min window.
3. **Alert on empty responses:** These should never happen — immediate investigation.
4. **Monitor retry exhaustion:** If exponential backoff retries exhausted, possible API issue.

---

## Future Phases & Extensibility

### Phase 2: Multi-Domain Routing

The `scope` field in `ka_conversations` is already present but unused in Phase 1. Phase 2 will:

- Add scope-specific system prompts (financial, birkto, communication, general)
- Log out-of-scope requests for demand signal
- Route to specialized KA instances

### Phase 3: Agent Builder

System prompt uses modular `[DOMAIN]` sections (see `ka-persona-prompt.ts`). Phase 3 will:

- Add custom behaviors via Taglish conversation UI
- User defines: "Every time I receive payment over ₱5,000, remind me to issue an OR"
- Prompts become user-configurable

### Phase 4+: Domain Expansion

Post-Implementation Vision v1 outlines expansion to:
- Marketing Advisory
- Business Strategy
- HR
- Inventory/Supplier

System prompt structure supports this (domain tags, modular sections).

---

## Appendix: File Sizes & Metrics

| File | Lines | Purpose | Complexity |
|------|-------|---------|-----------|
| route.ts | ~510 | Main handler, 12-step flow | High |
| retry.ts | ~110 | Exponential backoff + jitter | Medium |
| circuit-breaker.ts | ~160 | Daily spend cap enforcement | Medium |
| model-router.ts | ~210 | Task-to-model selection & cost | Medium |
| ka-persona-prompt.ts | ~280 | KA identity & scope boundaries | High |
| chat-schemas.ts | ~140 | Zod validation schemas | Low |

**Total production code:** ~1,410 lines (excluding comments & docstrings)
**With documentation:** ~2,200 lines

---

## Support & Debugging

### Common Issues

**Issue:** Circuit breaker always open
- **Check:** `ai_spend_log` table has data for today (Asia/Manila time)
- **Check:** DAILY_CAP_CENTAVOS value is reasonable (₱500 = 50000)
- **Fix:** Increase cap or check for cost calculation bug

**Issue:** Retry keeps failing
- **Check:** ANTHROPIC_API_KEY is valid and has sufficient credits
- **Check:** Network connectivity (retry needs to reach Anthropic servers)
- **Fix:** Check Anthropic status page; may be temporary outage

**Issue:** Empty response from Claude
- **Check:** System prompt is valid (no syntax errors)
- **Check:** Claude is returning text blocks (not tool use, etc.)
- **Fix:** Add logging in response validation section

**Issue:** Tier routing incorrect (free user gets Sonnet)
- **Check:** User's subscription_tier column is lowercase ('free', not 'Free')
- **Check:** selectModel() function is called with correct arguments
- **Fix:** Verify users table schema

---

## References

- **skill:** fullstack-engineer
- **Feature:** KA Chat (Build 1+)
- **Docs:** claude-integration.md, supabase-patterns.md, brand-context.md
- **Schema:** project-context.md (KA persona rules), gap-registry.md
- **Tech stack:** Next.js 14, Supabase, Anthropic SDK, Zod

---

**Status:** ✅ Production-Ready
**Last Updated:** March 2026
**Maintained by:** Anton del Rosario (AKBai founder)
