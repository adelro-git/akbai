# KA Chat Route — File Manifest

**Location:** `/sessions/brave-wizardly-sagan/mnt/AKBai/akbai-delivery/skills/fullstack-engineer-workspace/iteration-1/eval-ka-chat-route/without_skill/outputs/`

## Core Files

### 1. `route.ts` — Main API Endpoint
- **Purpose:** Implements `POST /api/ka/chat` handler
- **Size:** ~350 lines
- **Key Functions:**
  - `POST(request)` — Main handler
  - `buildSystemPrompt(context)` — Constructs KA system prompt with modular domain scopes
- **Responsibilities:**
  - Auth check (Supabase)
  - Request validation (Zod)
  - Tier & quota checking (Free: 10/day)
  - Business profile loading
  - Conversation history fetching (domain-scoped)
  - System prompt building
  - Claude API call orchestration
  - Response validation
  - Conversation storage (user + assistant messages)
  - Error handling with {success, data, error} envelope

**Integration:** Copy to `/app/api/ka/chat/route.ts`

---

### 2. `chat-schema.ts` — Request/Response Validation
- **Purpose:** Zod schemas for type-safe API contract
- **Size:** ~100 lines
- **Exports:**
  - `ChatRequestSchema` — User message + domain (validates incoming request)
  - `ChatRequest` — TypeScript type
  - `ChatResponseSchema` — Success response (message_id, response, model, cost, etc.)
  - `ChatResponse` — TypeScript type
  - `ChatErrorResponseSchema` — Error response (error code, message, user_message)
  - `ConversationMessageSchema` — Conversation history row
  - Error codes: AUTH_REQUIRED, VALIDATION_ERROR, TIER_LIMIT_REACHED, AI_CIRCUIT_OPEN, etc.

**Integration:** Copy to `/lib/utils/zod-schemas/chat.ts`

---

### 3. `claude-client.ts` — Anthropic SDK Wrapper
- **Purpose:** Centralized Claude API interface with safeguards
- **Size:** ~250 lines
- **Key Functions:**
  - `callClaude(options)` — Main API call with all safety checks
  - `calculateCost(model, inputTokens, outputTokens)` — Cost in Philippine centavos
- **Features:**
  - Circuit breaker integration (checks before calling)
  - Retry logic with exponential backoff
  - Cost tracking (inputs/outputs/total in centavos)
  - Model-specific pricing (Haiku vs Sonnet)
  - Spend recording to database
- **Exports:**
  - `MODELS` constant (Haiku, Sonnet model IDs)
  - `ClaudeResponse` interface
  - `ClaudeCircuitOpenError` exception
  - `COST_REFERENCE` documentation

**Integration:** Copy to `/lib/claude/client.ts`

---

### 4. `circuit-breaker.ts` — Daily Spend Cap Tracking
- **Purpose:** Prevent cost overruns with hard daily limit
- **Size:** ~200 lines
- **Key Functions:**
  - `checkCircuitBreaker(userId)` — Check if user has budget remaining
  - `recordSpend(userId, costCentavos, model)` — Log spend to ai_spend_log table
  - `estimateRemainingBudget(userId)` — Get remaining budget estimate
- **Features:**
  - Daily cap: ₱500 = 50,000 centavos (configurable)
  - Timezone: Asia/Manila (resets at midnight)
  - Fail-closed: if database check fails, deny the request
  - Custom error: `ClaudeCircuitOpenError` with spend details
- **Database:** Stores in `ai_spend_log` table (admin-only, no RLS)

**Integration:** Copy to `/lib/claude/circuit-breaker.ts`

---

### 5. `retry.ts` — Exponential Backoff Retry Logic
- **Purpose:** Handle transient Claude API failures gracefully
- **Size:** ~200 lines
- **Key Function:**
  - `retryWithBackoff<T>(fn, options)` — Retry with exponential backoff + jitter
- **Features:**
  - **Retryable** status codes: 429, 500, 502, 503, 529
  - **Non-retryable** status codes: 400, 401, 403, 404 (fail immediately)
  - **Backoff schedule:** 1s → 2s → 4s (capped at 30s)
  - **Jitter:** ±0-1s random (prevents thundering herd)
  - Max 3 retries (4 total attempts)
- **Exports:**
  - `retryWithBackoff()` function
  - `createTestError()` helper for testing

**Integration:** Copy to `/lib/claude/retry.ts`

---

### 6. `model-router.ts` — Tier & Task-Based Model Selection
- **Purpose:** Choose Haiku or Sonnet based on user tier and task complexity
- **Size:** ~200 lines
- **Key Function:**
  - `selectModel(taskType, userTier)` — Returns ModelId (Haiku or Sonnet)
  - `estimateCostCentavos(taskType, tier, inputTokens, outputTokens)` — Cost estimate
- **Logic:**
  - Free tier: **always Haiku** (cost control)
  - Pro/Business + Haiku tasks (OCR, classification, QA): **Haiku**
  - Pro/Business + Reasoning tasks (KA chat, briefing, drafting): **Sonnet**
- **Task Types:**
  - Haiku: receipt_ocr, classification, quick_qa
  - Sonnet: ka_reasoning, morning_briefing, reply_draft, financial_analysis, costing_analysis
- **Cost Reference:**
  - Haiku: $1/1M input, $5/1M output
  - Sonnet: $3/1M input, $15/1M output
  - PHP/USD: 56 (update periodically)

**Integration:** Copy to `/lib/claude/model-router.ts`

---

### 7. `ka-persona.ts` — System Prompt Generator
- **Purpose:** Build KA's personality and knowledge boundaries
- **Size:** ~400 lines
- **Key Function:**
  - `kaPersonaPrompt(context)` — Build complete system prompt
  - `buildTierLimitations(tier)` — Tier-specific behavior section
- **Prompt Structure:**
  1. Core Identity (who KA is, Taglish voice)
  2. User Context (name, business, tier, date)
  3. Voice & Tone Rules (DO/NEVER lists)
  4. Domain Scopes (modular, expandable)
     - [FINANCIAL_SCOPE] for Phase 1
     - Placeholder structure for Phase 4+ domains
  5. Interaction Rules (trust recovery, privacy, daily check-in)
  6. Tier Limitations (Free/Pro/Business specific features)
- **Domain-Expandable:** New Phase 4+ domains added as additional scope sections without rewriting
- **Includes:**
  - BIR disclaimer (non-negotiable)
  - Financial boundaries (what KA can/cannot advise on)
  - Out-of-scope redirect handling
  - Trust recovery pattern (when KA gets something wrong)

**Integration:** Copy to `/lib/claude/prompts/ka-persona.ts`

---

## Supporting Files

### 8. `IMPLEMENTATION_NOTES.md` — Complete Documentation
- **Purpose:** Reference guide for the entire implementation
- **Size:** ~600 lines
- **Sections:**
  - Request flow (9-step diagram)
  - Error handling (HTTP status codes, circuit breaker, retry logic)
  - Tier-based model routing rules
  - Conversation history storage and querying
  - KA persona architecture (domain-expandable design)
  - Cost tracking & monitoring
  - Database migrations (ai_spend_log, ka_conversations)
  - Testing checklist
  - Deployment notes
  - Future work (Phase 2+)

**Use as:** Reference guide during integration and future maintenance

---

### 9. `FILE_MANIFEST.md` — This File
- **Purpose:** Index and overview of all deliverables
- **Includes:** File locations, sizes, key functions, integration points

---

## Database Schema Required

Before deploying, create these tables:

### `ai_spend_log` (Circuit Breaker)
```sql
CREATE TABLE ai_spend_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  cost_centavos INTEGER NOT NULL,
  model TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `ka_conversations` (Conversation History)
```sql
CREATE TABLE ka_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
```

See `IMPLEMENTATION_NOTES.md` for full SQL with indexes, triggers, and RLS policies.

---

## Integration Checklist

- [ ] Copy 7 TypeScript files to appropriate `/lib/` directories
- [ ] Create `ai_spend_log` and `ka_conversations` tables + indexes
- [ ] Ensure `subscriptions` table exists with `tier` column
- [ ] Set environment variables: ANTHROPIC_API_KEY, SUPABASE_SERVICE_ROLE_KEY
- [ ] Run type generation: `supabase gen types typescript`
- [ ] Test with 5 internal users (staging)
- [ ] Monitor Sentry/PostHog for errors
- [ ] Deploy to production with feature flag (10% → 100%)

---

## Key Features Implemented

✓ **Authentication:** Supabase auth check
✓ **Request Validation:** Zod schemas for type safety
✓ **Tier System:** Free (10/day) vs Pro/Business (unlimited)
✓ **Model Routing:** Haiku (free, fast) vs Sonnet (pro, smart)
✓ **Circuit Breaker:** Daily ₱500 spend cap (graceful degradation)
✓ **Retry Logic:** Exponential backoff (3 retries max)
✓ **Cost Tracking:** All calls logged in Philippine centavos
✓ **Conversation History:** Domain-scoped, with role/model/tokens/cost
✓ **KA Persona:** Taglish tone, BIR disclaimers, trust recovery pattern
✓ **Domain-Expandable:** Phase 4+ domains can be added without rewrites
✓ **Error Handling:** {success, data, error} envelope, HTTP status codes
✓ **Monitoring:** Cost, tokens, model selection tracked for analytics

---

## Estimated Token Costs (Phase 1 Reference)

| Task | Model | Typical Cost | Daily Impact (100 users) |
|------|-------|-------------|------------------------|
| Receipt OCR | Haiku | ₱0.16 | ₱16 (at 100 scans/day) |
| KA Chat | Sonnet | ₱3 | ₱300 (at 100 chats/day) |
| Morning Briefing | Sonnet | ₱8 | ₱200 (at 25 briefings/day) |

**Daily cap:** ₱500 = sufficient for 100 Pro users with 1 chat + 1 briefing each.

---

## Support Notes

- **Taglish voice:** All user-facing messages are in Taglish (warm, natural Filipino-English mix)
- **BIR compliance:** System prompt includes mandatory disclaimer on all tax topics
- **Soft delete only:** No hard deletes. All conversation history is recoverable.
- **Domain-expandable:** System prompt designed for Phase 4+ expansion without rewriting core logic
- **Single owner (Phase 1):** Multi-seat support is Phase 2+ feature (skeleton in RLS policies)
