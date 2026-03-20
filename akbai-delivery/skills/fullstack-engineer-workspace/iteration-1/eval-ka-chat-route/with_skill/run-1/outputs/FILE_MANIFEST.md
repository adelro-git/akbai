# File Manifest — KA Chat API Route

## Overview
This directory contains complete, production-ready TypeScript code for AKBai's `POST /api/ka/chat` endpoint. Total: **10 files, ~1,960 lines of code, 80 KB**.

All code follows the fullstack-engineer skill standards (strict TypeScript, Zod validation, RLS, soft-delete, Taglish error messages, timezone awareness).

## Files by Category

### 📋 Documentation (Read First)
1. **README.md** — Start here. Overview, features, usage example, setup steps
2. **IMPLEMENTATION_NOTES.md** — Design decisions, flow diagram, testing, debugging, future enhancements
3. **FILE_MANIFEST.md** — This file

### 🛣️ API Route (Deploy This)
4. **route.ts** — Main endpoint: `/app/api/ka/chat/route.ts`
   - Location: `/app/api/ka/chat/route.ts`
   - 298 lines, ~10 KB
   - Handles: auth, validation, context building, model routing, circuit breaker, Claude API call, message storage, error response
   - Dependencies: supabase, claude client, context builder, conversation storage, schemas, api-response

### 🧠 Context & Prompts
5. **ka-context-builder.ts** — Build KA persona system prompt
   - Location: `/lib/claude/contexts/ka-context-builder.ts`
   - 163 lines, ~6.7 KB
   - Functions: `buildKAContext()`, `buildKASystemPrompt()`
   - Fetches: user profile, business profile from Supabase
   - Builds: modular system prompt with domain scopes

### 💬 Conversation Storage
6. **conversation-storage.ts** — Store and retrieve chat history
   - Location: `/lib/supabase/queries/ka-conversations.ts`
   - 232 lines, ~6.2 KB
   - Functions: store, retrieve, delete, stats, prune
   - Implements: soft-delete, RLS enforcement, domain filtering

### 🎯 Validation & Types
7. **request-schema.ts** — Zod schemas for request/response validation
   - Location: `/lib/utils/zod-schemas/ka-chat-schema.ts`
   - 94 lines, ~3.5 KB
   - Schemas: KAChatRequest, KAChatMessage, KAChatResponse, KAContext, ConversationHistoryItem

### 🚦 Model Routing
8. **model-router.ts** — Tier-based model selection (Haiku vs Sonnet)
   - Location: `/lib/claude/model-router.ts`
   - 170 lines, ~6.3 KB
   - Functions: `selectModel()`, `estimateCost()`
   - Logic: free=Haiku only, pro/business=task-based routing

### ⏰ Date Utilities
9. **date-helpers.ts** — Timezone-aware date handling for Asia/Manila
   - Location: `/lib/utils/date-helpers.ts`
   - 233 lines, ~7.0 KB
   - Functions: formatDateInTimezone, getTodayInTimezone, month boundaries, relative time, etc.
   - Critical for: BIR deadline accuracy, financial period calculations

### 📦 Response Envelopes
10. **api-response.ts** — Standard response helpers for all API routes
    - Location: `/lib/utils/api-response.ts`
    - 122 lines, ~3.4 KB
    - Functions: `apiSuccess()`, `apiError()`
    - Includes: error code reference, HTTP status code guide

### 🗄️ Database
11. **MIGRATION.sql** — Create ka_conversations table
    - 71 lines, ~3.3 KB
    - Creates: table, indexes, RLS policies, soft-delete, triggers
    - Run: `psql < MIGRATION.sql` in Supabase

## Deployment Steps

### Step 1: Apply Database Migration
```bash
# Option A: Supabase CLI
cd supabase
supabase migration add ka_conversations
# Copy MIGRATION.sql contents
supabase db push

# Option B: Direct Supabase SQL
# Go to Supabase Dashboard > SQL Editor
# Paste MIGRATION.sql and run
```

### Step 2: Copy Files to Project
```bash
# Copy each file to its location in your Next.js project
cp route.ts app/api/ka/chat/
cp request-schema.ts lib/utils/zod-schemas/ka-chat-schema.ts
cp ka-context-builder.ts lib/claude/contexts/ka-context-builder.ts
cp conversation-storage.ts lib/supabase/queries/ka-conversations.ts
cp model-router.ts lib/claude/model-router.ts
cp date-helpers.ts lib/utils/date-helpers.ts
cp api-response.ts lib/utils/api-response.ts
```

### Step 3: Generate TypeScript Types
```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
```

### Step 4: Verify Dependencies Exist
Ensure these files are already in your project:
- `lib/supabase/client.ts` — Browser Supabase client
- `lib/supabase/server.ts` — Server Supabase client
- `lib/supabase/admin.ts` — Admin (service role) client
- `lib/claude/client.ts` — Claude API wrapper with circuit breaker
- `lib/claude/circuit-breaker.ts` — Daily spend tracking
- `lib/claude/retry.ts` — Retry logic with exponential backoff

### Step 5: Environment Variables
```bash
# Add to .env.local (or your deployment environment)
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... # Server-side only
```

### Step 6: Test
```bash
# Test the endpoint
curl -X POST http://localhost:3000/api/ka/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"message": "Hi KA!"}'
```

## File Sizes Summary

| File | Lines | Size | Purpose |
|------|-------|------|---------|
| route.ts | 298 | 9.7K | 🛣️ API endpoint (main) |
| ka-context-builder.ts | 163 | 6.7K | 🧠 System prompt assembly |
| conversation-storage.ts | 232 | 6.2K | 💬 Chat history storage |
| model-router.ts | 170 | 6.3K | 🚦 Model selection logic |
| date-helpers.ts | 233 | 7.0K | ⏰ Timezone utilities |
| request-schema.ts | 94 | 3.5K | 🎯 Zod validation schemas |
| api-response.ts | 122 | 3.4K | 📦 Response envelope helpers |
| MIGRATION.sql | 71 | 3.3K | 🗄️ Database schema |
| README.md | 301 | 13K | 📖 Getting started guide |
| IMPLEMENTATION_NOTES.md | 275 | 11K | 📋 Design & troubleshooting |
| **TOTAL** | **1,959** | **79K** | **Complete implementation** |

## Code Statistics

- **TypeScript files:** 7 files, ~1,280 lines
- **SQL migrations:** 1 file, ~71 lines
- **Documentation:** 3 files, ~850 lines
- **Total:** 11 files, ~1,960 lines of code

## Key Principles Implemented

✅ **Strict TypeScript** — No `any`, all types defined via Zod
✅ **Validation First** — Zod schemas on all inputs/outputs
✅ **Error Handling** — Standard envelope, error codes, Taglish messages
✅ **Soft Delete** — deleted_at timestamp, never hard-delete
✅ **Row-Level Security** — RLS on all tables, per-user data scoping
✅ **Timezone Awareness** — All dates in Asia/Manila for BIR compliance
✅ **Money in Centavos** — All amounts as integers, converted to peso on display
✅ **Circuit Breaker** — Daily spend cap with graceful degradation
✅ **Retry Logic** — Exponential backoff, max 3 retries
✅ **Conversation Context** — Multi-turn chat with history
✅ **Cost Tracking** — Every API call tracked: tokens, model, cost
✅ **Domain Tagging** — Conversations tagged for Phase 4+ expansion

## Architecture Diagram

```
POST /api/ka/chat
├─ route.ts (main handler)
│  ├─ Auth check (supabase.auth.getUser)
│  ├─ Zod validation (request-schema.ts)
│  ├─ Build context (ka-context-builder.ts)
│  │  ├─ Fetch user profile
│  │  └─ Fetch business profile
│  ├─ Model routing (model-router.ts)
│  │  └─ Select Haiku or Sonnet
│  ├─ Conversation history (conversation-storage.ts)
│  │  └─ Fetch last 10 messages
│  ├─ System prompt assembly (ka-context-builder.ts)
│  │  └─ Build KA persona prompt
│  ├─ Claude API call (callClaude in client)
│  │  ├─ Circuit breaker check
│  │  ├─ Retry logic (up to 3x)
│  │  └─ Parse response
│  ├─ Store messages (conversation-storage.ts)
│  │  ├─ Store user message
│  │  └─ Store assistant message
│  └─ Response (api-response.ts)
│     └─ Return { success, data } or { success: false, error }
```

## Integration Checklist

- [ ] Database migration applied (MIGRATION.sql)
- [ ] TypeScript types generated (`supabase gen types`)
- [ ] 7 TypeScript files copied to correct locations
- [ ] Supporting files exist (claude client, circuit breaker, retry)
- [ ] Environment variables set (ANTHROPIC_API_KEY, Supabase credentials)
- [ ] Endpoint tested (`POST /api/ka/chat` with auth header)
- [ ] Free tier gets Haiku responses
- [ ] Pro tier gets Sonnet responses
- [ ] Circuit breaker works (cap reached = graceful degradation)
- [ ] Messages stored in ka_conversations table
- [ ] Conversation history includes previous messages
- [ ] Error messages are in Taglish

## Common Issues & Solutions

**"Cannot find module 'lib/claude/client'"**
→ Ensure Claude API wrapper exists at `lib/claude/client.ts`

**"User cannot read conversations (RLS error)"**
→ Check RLS policies in migration, verify user_id matches auth.uid()

**"Circuit breaker always open"**
→ Check ai_spend_log table, verify DAILY_CAP_CENTAVOS setting

**"Messages are not stored"**
→ Verify migration applied, ka_conversations table exists, RLS allows inserts

**"Conversation history is empty"**
→ First message is expected to have no history, subsequent messages will include previous exchanges

## Next Steps After Deployment

1. **Build the UI component** — Create chat interface that calls this route
2. **Add message persistence** — Store conversations in UI state or localStorage
3. **Implement message reactions** — Allow users to rate response quality
4. **Monitor costs** — Set up Sentry alerts for high API spend
5. **Test with real users** — Phase 0B demand validation (Build 1: Kilala Kita)
6. **Iterate on prompts** — Refine KA tone based on user feedback

## Support

- **Design Questions:** See IMPLEMENTATION_NOTES.md
- **API Error Codes:** See api-response.ts
- **Database Schema:** See MIGRATION.sql
- **Claude Integration Patterns:** `/AKBai/akbai-delivery/skills/fullstack-engineer/references/claude-integration.md`
- **Supabase Patterns:** `/AKBai/akbai-delivery/skills/fullstack-engineer/references/supabase-patterns.md`
- **Skill Reference:** `/AKBai/akbai-delivery/skills/fullstack-engineer/SKILL.md`

---

**Version:** 1.0
**Created:** March 2026
**Skill:** fullstack-engineer
**Build:** Build 5 (KA Chat Integration)
**Status:** ✅ Production-Ready
