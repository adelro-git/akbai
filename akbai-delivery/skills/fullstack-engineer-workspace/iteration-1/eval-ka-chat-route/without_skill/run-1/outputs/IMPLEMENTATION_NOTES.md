# KA Chat Route Implementation

## Overview

Complete implementation of `POST /api/ka/chat` endpoint for AKBai's KA (Katuwang) AI business partner. This route handles user messages, manages conversation history, and routes requests to Claude with full safeguards.

**Files Created:**
1. `route.ts` — Main API endpoint
2. `chat-schema.ts` — Zod schemas for request/response validation
3. `model-router.ts` — Tier-based and task-based model selection (Haiku vs Sonnet)
4. `ka-persona.ts` — KA personality system prompt generator
5. `circuit-breaker.ts` — Daily spend cap tracking to prevent cost overruns
6. `retry.ts` — Exponential backoff retry logic
7. `claude-client.ts` — Anthropic SDK wrapper

---

## Request Flow

```
1. User sends message in KA chat UI
   ↓
2. Frontend POST /api/ka/chat { message, domain }
   ↓
3. Route handler:
   a. Authenticate user (Supabase)
   b. Validate request (Zod schema)
   c. Check tier + daily limits (Free: 10 queries/day)
   d. Load business profile from Supabase
   e. Fetch conversation history (domain-scoped)
   ↓
4. Build system prompt:
   a. Core KA persona (identity, voice, values)
   b. User context (name, business, tier, date)
   c. Domain scopes (Financial for Phase 1, expandable for Phase 4+)
   d. Interaction rules (Taglish, disclaimers, trust recovery)
   e. Tier limitations (Free: limited features, 10 queries/day)
   ↓
5. Select model:
   a. Free tier → HAIKU only
   b. Pro/Business + task complexity → HAIKU or SONNET
   ↓
6. Call Claude API:
   a. Check circuit breaker (daily spend cap ₱500)
   b. Retry with exponential backoff (3 attempts)
   c. Handle: 429 (rate limit), 500/502/503 (server), 529 (overloaded)
   ↓
7. Process response:
   a. Extract text content from Claude response
   b. Calculate cost (in Philippine centavos)
   c. Record spend in ai_spend_log table
   ↓
8. Store conversation:
   a. Insert user message in ka_conversations table
   b. Insert assistant response in ka_conversations table
   c. Include: domain, model_used, token counts, cost
   ↓
9. Return success response:
   { success: true, data: { response, model, cost, ... } }
```

---

## Error Handling

All errors follow the standard envelope: `{ success, data, error }`.

### HTTP Status Codes

| Status | Error Code | User-Facing Message | Cause |
|--------|-----------|-------------------|-------|
| 401 | AUTH_REQUIRED | "Authentication required" | User not logged in |
| 400 | VALIDATION_ERROR | Invalid request body | Missing/malformed `message` |
| 429 | TIER_LIMIT_REACHED | "Naabot mo na ang 10 queries..." | Free tier daily limit (10) reached |
| 404 | PROFILE_NOT_FOUND | User profile not found | Onboarding not complete |
| 503 | AI_CIRCUIT_OPEN | "Nag-rest muna si KA para bukas..." | Daily spend cap exceeded |
| 422 | AI_PARSE_ERROR | Could not parse response | Claude returned invalid response |
| 500 | INTERNAL_ERROR | Server error (generic) | Unhandled exception |

### Circuit Breaker (`AI_CIRCUIT_OPEN`)

When daily spend cap (₱500 = 50,000 centavos) is reached:
- ✓ Returns HTTP 503 with graceful error message
- ✓ All non-AI features continue working (expense entry, deadlines, etc.)
- ✓ KA chat is disabled for the day
- ✓ Automatically resets at midnight Asia/Manila timezone

User sees: "Nag-rest muna si KA para bukas — marami nang na-process ngayon. Tuloy lang ang ibang features mo!"

### Retry Logic

Claude API calls automatically retry on transient errors:

**Retryable** (will retry with exponential backoff):
- 429 (Rate Limited)
- 500 (Internal Server Error)
- 502 (Bad Gateway)
- 503 (Service Unavailable)
- 529 (Site Overloaded — Anthropic specific)

**Non-Retryable** (fail immediately):
- 400 (Bad Request) — our code has a bug
- 401 (Unauthorized) — API key issue
- 403 (Forbidden) — permission issue
- 404 (Not Found) — model doesn't exist

**Backoff timing:**
- Attempt 1: 1-2 seconds
- Attempt 2: 2-3 seconds
- Attempt 3: 4-5 seconds
- Max wait: ~13 seconds across 3 retries

---

## Tier-Based Model Routing

### Free Tier (`tier === 'free'`)
- **Model:** Haiku only, always
- **Task Type:** Not evaluated (Haiku is the only option)
- **Daily Limit:** 10 queries/day
- **Cost Control:** ~₱3-5 per query max

### Pro Tier (`tier === 'pro'`)
- **Model Selection:**
  - Haiku: receipt OCR, classification, quick Q&A
  - Sonnet: KA reasoning, morning briefing, reply drafting, analysis
- **Daily Limit:** Unlimited (circuit breaker at ₱500/day)
- **Cost:** Mixed (Haiku ~₱0.16/call, Sonnet ~₱3/call)

### Business Tier (`tier === 'business'`)
- **Same as Pro** (Phase 1)
- **Note:** Phase 2 adds multi-seat + GSheets OAuth

---

## Conversation History

### Storage: `ka_conversations` table

```sql
CREATE TABLE ka_conversations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  domain TEXT DEFAULT 'financial',     -- Scoped by domain
  message TEXT NOT NULL,               -- The message content
  role TEXT NOT NULL,                  -- 'user' or 'assistant'
  model_used TEXT,                     -- Null if role='user', 'claude-...' if assistant
  input_tokens INT,                    -- Token count (assistant only)
  output_tokens INT,
  cost_centavos INT,                   -- Cost in ₱ centavos (assistant only)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ               -- Soft delete
);

CREATE INDEX idx_ka_conversations_user_domain_date
  ON ka_conversations(user_id, domain, created_at DESC)
  WHERE deleted_at IS NULL;
```

### Query Pattern

```typescript
// Fetch last 20 messages in financial domain
const { data: history } = await supabase
  .from('ka_conversations')
  .select('id, message, role, domain, created_at')
  .eq('user_id', user.id)
  .eq('domain', 'financial')
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
  .limit(20);

// Reverse to chronological order for Claude
const messages = history.reverse();
```

### Domain Scoping

- **Phase 1:** Only `domain = 'financial'`
- **Phase 4+:** New domains added (marketing, strategy, HR, inventory)
- **Why:** Conversations are domain-scoped so KA can give focused, context-aware advice per domain
- **Analytics:** Out-of-scope redirects logged separately to understand demand signal

---

## KA Persona Architecture

### System Prompt Structure

```
[CORE IDENTITY]
  - Who KA is (companion, Taglish speaker)
  - User context (name, business, tier, date)
  - Core values (proactive, specific, honest)

[VOICE & TONE RULES]
  - DO: Show data, use "po" naturally, Taglish tone
  - NEVER: Make up data, use corporate jargon, provide tax advice

[DOMAIN SCOPES] — Modular, expandable
  [FINANCIAL_SCOPE] (Phase 1)
    - Income, expense, profitability, cash flow, BIR reminders
    - NOT: Tax advice, investment decisions, multi-user logic
  [MARKETING_SCOPE] (Phase 4+)
  [STRATEGY_SCOPE] (Phase 4+)
  [HR_SCOPE] (Phase 4+)
  [INVENTORY_SCOPE] (Phase 4+)

[INTERACTION RULES]
  - Trust recovery pattern (when KA gets something wrong)
  - Privacy boundaries (no cross-user data sharing)
  - Daily check-in behavior (if implemented)

[TIER LIMITATIONS]
  - Free: limited features, 10 queries/day
  - Pro: full features
  - Business: Pro + team (Phase 2+)
```

### Domain Expansion (Phase 4+)

**Architecture is ready:**
- System prompt uses labeled scope sections (`[FINANCIAL_SCOPE]`, etc.)
- New domains added by appending scope sections — no rewrite
- Conversations table has `domain` column for analytics
- Out-of-scope redirects logged in `redirect_logs` table

**To add a new domain:**
1. Define new scope section in `ka-persona.ts`
2. Add domain to `ChatRequestSchema`
3. Add domain to `redirect_logs` analytics
4. Train KA on the new domain context

---

## Cost Tracking & Monitoring

### Daily Spend Cap (Circuit Breaker)

- **Hard cap:** ₱500/day (~$8.86 USD)
- **Table:** `ai_spend_log` (admin-only, no RLS)
- **Timezone:** Asia/Manila (resets at midnight)
- **Behavior:** Returns 503 when exceeded (graceful degradation, not error)

### Cost Per Task (Approximate)

| Task | Model | Input | Output | Total |
|------|-------|-------|--------|-------|
| Receipt OCR | Haiku | 500 | 200 | ₱0.16 |
| KA Chat | Sonnet | 2,000 | 400 | ₱3 |
| Morning Briefing | Sonnet | 3,000 | 800 | ₱8 |
| Reply Draft | Sonnet | 1,500 | 300 | ₱1.50 |

### Monitoring

Log warnings in Sentry:
- `percentageUsed >= 80%`: Approaching cap
- `percentageUsed >= 100%`: Circuit open (normal at scale, but log info)

---

## Dependencies

### Required Packages

```typescript
// Already in package.json (AKBai uses these)
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/ssr';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
```

### Environment Variables (Server-Side Only)

```bash
ANTHROPIC_API_KEY              # Anthropic API secret key
NEXT_PUBLIC_SUPABASE_URL       # Supabase instance URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase public key
SUPABASE_SERVICE_ROLE_KEY      # Supabase service role (never NEXT_PUBLIC_)
```

---

## Database Migrations

Create these tables before deploying the KA chat route:

### 1. `ai_spend_log` (Circuit Breaker Tracking)

```sql
CREATE TABLE IF NOT EXISTS ai_spend_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  cost_centavos INTEGER NOT NULL,
  model TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_spend_log_user_date
  ON ai_spend_log(user_id, created_at DESC);

ALTER TABLE ai_spend_log ENABLE ROW LEVEL SECURITY;
-- No RLS policies needed (admin-only table)
```

### 2. `ka_conversations` (Conversation History)

```sql
CREATE TABLE IF NOT EXISTS ka_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  domain TEXT DEFAULT 'financial',
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  model_used TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_centavos INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_ka_conversations_user_domain_date
  ON ka_conversations(user_id, domain, created_at DESC)
  WHERE deleted_at IS NULL;

-- Auto-update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON ka_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE ka_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own conversations"
  ON ka_conversations FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users insert own conversations"
  ON ka_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own conversations"
  ON ka_conversations FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);
```

### 3. `subscriptions` (Tier Tracking) — Already Exists

Assumes `subscriptions` table exists with columns:
- `user_id` (FK to auth.users)
- `tier` ('free' | 'pro' | 'business')
- `status` ('active' | 'past_due' | 'inactive')

---

## Testing Checklist

### Unit Tests

- [ ] `model-router`: Free tier always gets Haiku
- [ ] `model-router`: Pro/Business routing by task type
- [ ] `circuit-breaker`: Allows calls when under cap
- [ ] `circuit-breaker`: Blocks calls when at/over cap
- [ ] `retry`: Retries on 429, 500, 502, 503, 529
- [ ] `retry`: Fails immediately on 400, 401, 403, 404
- [ ] `retry`: Exponential backoff delays increase correctly
- [ ] `chat-schema`: Validates request and response

### Integration Tests

- [ ] Authenticated user can send message
- [ ] Unauthenticated user gets 401
- [ ] Free tier user hits 10-query limit, gets 429
- [ ] User without profile gets 404
- [ ] Circuit breaker blocks when ₱500 cap reached
- [ ] Conversation history stores both user and assistant messages
- [ ] Domain-scoped queries return correct conversations

### End-to-End Tests

- [ ] User sends KA message → gets response in Taglish
- [ ] Response is cited (shows data, not hallucinated)
- [ ] Cost is calculated and recorded correctly
- [ ] Conversation appears in chat history
- [ ] Free tier user sees upgrade prompt after 10 queries
- [ ] Circuit breaker message appears, other features still work

---

## Deployment Notes

### Prerequisites

1. ✓ Supabase project initialized with auth
2. ✓ `users` table with business profile
3. ✓ `subscriptions` table with tier tracking
4. ✓ Migrations applied (ai_spend_log, ka_conversations)
5. ✓ ANTHROPIC_API_KEY set in environment
6. ✓ SUPABASE_SERVICE_ROLE_KEY set in environment

### Rollout Strategy

**Phase 1 Rollout:**
1. Deploy to staging environment
2. Test with 5 internal users (Anton + 4 testers)
3. Verify circuit breaker is working (spend logs populated)
4. Verify conversation history is stored correctly
5. Deploy to production with 10% traffic (feature flag)
6. Monitor error rates, response times, spend
7. Increase to 100% after 24 hours with no issues

**Monitoring:**
- Sentry: Error tracking, rate limits, circuit breaker triggers
- PostHog: User behavior, query types, tier distribution
- UptimeRobot: KA endpoint uptime

---

## Future Work (Phase 2+)

- [ ] Multi-seat support (Business tier team members)
- [ ] Conversation export to PDF/CSV
- [ ] Voice input (transcribe to text)
- [ ] Real-time streaming responses
- [ ] Custom behaviors (user-taught AI rules)
- [ ] Domain expansion (marketing, strategy, HR, inventory)
- [ ] Out-of-scope redirect logging (demand signal)
- [ ] Conversation search/filtering
- [ ] Trust recovery UI component ("Flag as Wrong" button)

---

## File Manifest

```
/sessions/brave-wizardly-sagan/mnt/AKBai/akbai-delivery/skills/fullstack-engineer-workspace/iteration-1/eval-ka-chat-route/without_skill/outputs/

├── route.ts                    # Main API endpoint (POST /api/ka/chat)
├── chat-schema.ts              # Zod schemas (request, response, conversation)
├── model-router.ts             # Tier & task-based model selection
├── ka-persona.ts               # System prompt generator (KA identity)
├── circuit-breaker.ts          # Daily spend cap tracking
├── retry.ts                    # Exponential backoff retry logic
├── claude-client.ts            # Anthropic SDK wrapper
└── IMPLEMENTATION_NOTES.md     # This file
```

**Integration points:**
- Copy `route.ts` → `/app/api/ka/chat/route.ts`
- Copy `chat-schema.ts` → `/lib/utils/zod-schemas/chat.ts`
- Copy `model-router.ts` → `/lib/claude/model-router.ts`
- Copy `ka-persona.ts` → `/lib/claude/prompts/ka-persona.ts`
- Copy `circuit-breaker.ts` → `/lib/claude/circuit-breaker.ts`
- Copy `retry.ts` → `/lib/claude/retry.ts`
- Copy `claude-client.ts` → `/lib/claude/client.ts`

---

## Support & Questions

This implementation is designed for Phase 1 (MVP) and is built to be domain-expandable for Phase 4+ without major rewrites. All Taglish tone, BIR disclaimers, and tier logic are baked in.

For questions on extending this to new domains or tiers, refer to the "Future Work" section and the Post-Implementation Vision v1 document.
