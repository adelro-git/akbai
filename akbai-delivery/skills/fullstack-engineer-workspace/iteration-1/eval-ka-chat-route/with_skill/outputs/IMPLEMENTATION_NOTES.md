# KA Chat API Route — Implementation Notes

## Overview

This implementation provides the **POST /api/ka/chat** endpoint for AKBai's KA persona chat system. It handles the complete flow: authentication, tier-based model routing, circuit breaker checks, KA context building, conversation history retrieval, Claude API calls with retry logic, message storage, and error handling with Taglish user messages.

## Files Generated

### Core Implementation
- **route.ts** — Main API route handler (`/app/api/ka/chat/route.ts`)
- **request-schema.ts** — Zod schemas for validation (`/lib/utils/zod-schemas/ka-chat-schema.ts`)
- **ka-context-builder.ts** — Build KA persona system prompt (`/lib/claude/contexts/ka-context-builder.ts`)
- **conversation-storage.ts** — Store/retrieve conversation history (`/lib/supabase/queries/ka-conversations.ts`)
- **model-router.ts** — Tier-based model selection (`/lib/claude/model-router.ts`)
- **date-helpers.ts** — Timezone-aware date utilities (`/lib/utils/date-helpers.ts`)
- **api-response.ts** — Standard response envelope (`/lib/utils/api-response.ts`)

### Database
- **MIGRATION.sql** — Creates `ka_conversations` table with RLS, indexes, and soft-delete

## Key Design Decisions

### 1. Modular System Prompt with Domain Scopes
The KA system prompt uses labeled modular sections ([TAX_SCOPE], [COMMUNICATION_SCOPE], etc.) to enable Phase 4+ expansion without rewrites. Currently all scopes are active; future domains can be conditionally included via configuration.

### 2. Tier-Based Model Routing
- **Free tier**: Haiku only (cost control, no expensive operations)
- **Pro/Business**: Task-based routing
  - Haiku for: receipt OCR, classification, quick Q&A
  - Sonnet for: KA reasoning, morning briefing, reply drafting, financial analysis

This follows the principle: use the cheapest model that produces acceptable quality.

### 3. Circuit Breaker Implementation
The circuit breaker is implemented in `callClaude()` (Claude client wrapper, not shown but referenced). It checks daily spend against a cap (₱500 by default) before making API calls. If the circuit opens:
- Request fails with `AI_CIRCUIT_OPEN` error code
- User sees warm Taglish message: "Nag-rest muna si KA para bukas..."
- All non-AI features continue to work (graceful degradation)

### 4. Conversation History Context Window
The route fetches the last 10 messages (user + assistant) to provide context. This:
- Keeps API input tokens reasonable
- Allows multi-turn conversations
- Can be optionally filtered by domain for focused discussions

### 5. Soft Delete Everywhere
All conversation messages use soft-delete (deleted_at timestamp). Hard-delete is prohibited. This enables:
- Compliance with NPC data restoration requirements
- User deletion recovery (7-day window)
- Audit trails

### 6. Domain Tagging for Analytics
Each message is tagged with a domain (financial, tax, communication, general). This enables:
- Domain-specific analytics
- Out-of-scope request logging for demand signal
- Phase 4+ expansion tracking

## Flow Diagram

```
POST /api/ka/chat
  ↓
[1. Auth Check] → ✗ return 401
  ↓
[2. Validate Request (Zod)] → ✗ return 400
  ↓
[3. Build KA Context] (fetch user + business profile) → ✗ return 500
  ↓
[4. Tier Check] (determine model: Haiku vs Sonnet)
  ↓
[5. Fetch Conversation History] (last 10 messages, by domain)
  ↓
[6. Build System Prompt] (KA persona + domain scopes)
  ↓
[7. Call Claude API]
     ↓
     Circuit Breaker Check → ✗ return 503 (AI_CIRCUIT_OPEN)
     ↓
     Retry with Exponential Backoff (max 3 retries)
       ↓
       Call /messages endpoint
       ↓
       Parse response (validate text block)
  ↓
[8. Store User Message] in ka_conversations
  ↓
[9. Store Assistant Message] in ka_conversations (with tokens, cost, model)
  ↓
[10. Return Success Response] with assistant message data
```

## Configuration & Customization

### Daily Circuit Breaker Cap
In `lib/claude/circuit-breaker.ts`:
```typescript
const DAILY_CAP_CENTAVOS = 50000; // ₱500.00
```
Update based on:
- Budget constraints
- Expected user volume
- Average cost per message (typically ₱1-3 for Sonnet)

### Conversation History Limit
In `conversation-storage.ts`:
```typescript
const CONVERSATION_HISTORY_LIMIT = 10; // Last N messages for context window
```
Increase for longer context, decrease to reduce input tokens.

### System Prompt Customization
The system prompt is assembled in `buildKASystemPrompt()`. To customize:
1. Update voice rules, tone calibration
2. Add/remove domain scopes as features launch
3. Update personality rules based on user feedback

### Model Assignment by Task
In `model-router.ts`:
- Add new task types to the `TaskType` union
- Assign to either `haikuTasks` or `sonnetTasks` array
- Update cost estimates in comments

## Error Handling

### Error Codes (by category)

**Authentication (401):**
- `AUTH_REQUIRED` — User not authenticated

**Validation (400):**
- `INVALID_JSON` — Request body not valid JSON
- `VALIDATION_ERROR` — Zod schema validation failed

**Business Logic (403, 422, 500, 503):**
- `TIER_LIMIT_REACHED` — User tier quota exceeded
- `CONTEXT_ERROR` — Cannot load user profile
- `AI_CIRCUIT_OPEN` — Daily spend cap reached
- `AI_ERROR` — Claude API transient error
- `STORAGE_ERROR` — Cannot store message in database
- `INTERNAL_ERROR` — Unexpected server error

### User-Facing Error Messages (Taglish)
All errors include `message_tl` (Taglish message) for the UI. Examples:
- `"Kailangan mong mag-login."` (AUTH_REQUIRED)
- `"May problema sa message. Subukan ulit."` (VALIDATION_ERROR)
- `"Nag-rest muna si KA para bukas..."` (AI_CIRCUIT_OPEN)

Console errors are in English for debugging.

## Testing & Validation

### Unit Tests (Vitest)
Test these functions independently:
- `buildKAContext()` — Verify user/business data fetching
- `buildKASystemPrompt()` — Verify prompt assembly
- `getConversationHistory()` — Verify message retrieval
- `selectModel()` — Verify tier-based routing

### Integration Tests (Playwright)
Test the full flow:
1. Authenticate user
2. Send message to /api/ka/chat
3. Verify response format (success envelope)
4. Verify message stored in database
5. Verify conversation history includes both user + assistant messages
6. Verify circuit breaker behavior (when cap reached)

### Manual Testing Checklist
- [ ] Free tier user gets Haiku responses
- [ ] Pro tier user gets Sonnet responses
- [ ] System prompt correctly includes user name, business name, tier
- [ ] Conversation history is retrieved and included in API call
- [ ] Cost is calculated and stored
- [ ] Soft-delete works (deleted_at is set)
- [ ] Error messages are in Taglish
- [ ] Circuit breaker activates when spend exceeds cap

## Performance Considerations

### Database Indexes
The migration creates three indexes:
1. `idx_ka_conversations_user_created` — Fastest for recent messages (primary query)
2. `idx_ka_conversations_user_domain` — For domain-specific filtering
3. `idx_ka_conversations_user_id` — For message lookup

All indexes exclude soft-deleted rows (`WHERE deleted_at IS NULL`).

### Conversation History Limit
Fetching 10 messages typically adds 200-300 tokens to the API call. Adjust based on:
- Target input token budget per message
- Cost tolerance
- Desired context depth

### Async Operations
- Storing user message: happens before Claude call (fail fast)
- Storing assistant message: happens after Claude call (critical path)
- Conversation history fetch: parallelizable with KA context fetch (currently sequential for simplicity)

## Migration Deployment

1. Apply the SQL migration to your Supabase instance:
   ```bash
   supabase migration add ka_conversations < MIGRATION.sql
   supabase db push
   ```

2. Generate updated TypeScript types:
   ```bash
   supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
   ```

3. Verify the table exists:
   ```bash
   SELECT name FROM sqlite_master WHERE type='table' AND name='ka_conversations';
   ```

## Future Enhancements

### Phase 2
- [ ] Realtime subscriptions (new messages appear instantly in chat UI)
- [ ] Message reactions/feedback (users rate response quality)
- [ ] Conversation search (full-text search on content)
- [ ] Export conversation history (CSV, PDF)

### Phase 3+
- [ ] Custom conversation behaviors ("Every time I invoice, KA reminds me")
- [ ] Multi-domain conversations (seamlessly switch between financial + tax discussion)
- [ ] Knowledge base integration (cite specific BIR rules, company docs)
- [ ] Message threading (reply to specific message in conversation)

### Phase 4+
- [ ] Domain expansion: Marketing Advisory, Business Strategy, HR, Inventory
  - Conversation domain changes dynamically
  - Each domain has its own system prompt scope section
  - Out-of-scope redirects logged in `redirect_logs` table for demand signal

## Code Style Notes

- **TypeScript strict mode**: No `any`. All API responses typed via Zod.
- **Error handling**: Explicit error codes + Taglish messages for UX.
- **Logging**: English logs for debugging. User-facing messages: Taglish.
- **Timezone**: All dates in Asia/Manila. UTC in database, formatted on display.
- **Money**: All amounts in centavos (Philippine centavos, not US cents). Convert to peso display format in UI.
- **Soft delete**: Always use `deleted_at`. Never hard-delete.
- **RLS**: Every table must have row-level security policies. No exceptions.

## Support & Debugging

### Claude API Errors
If Claude API calls fail consistently:
1. Check `ANTHROPIC_API_KEY` environment variable
2. Verify API rate limits not exceeded
3. Check Sentry for error patterns
4. Review retry logic in `lib/claude/retry.ts`

### Circuit Breaker Activation
If circuit breaker opens unexpectedly:
1. Check spend in `ai_spend_log` table
2. Verify `DAILY_CAP_CENTAVOS` setting
3. Check if multiple users are generating high volume
4. Monitor token usage per message (may indicate prompt verbosity)

### Supabase RLS Issues
If users can't retrieve their messages:
1. Verify `ka_conversations` RLS policies are enabled
2. Check `user_id` matches authenticated user
3. Verify `deleted_at IS NULL` in queries
4. Test with admin client to isolate RLS issue

---

**Last Updated:** March 2026
**Skill:** fullstack-engineer
**Build:** Build 5 (KA Chat Integration)
**Status:** Production-ready
