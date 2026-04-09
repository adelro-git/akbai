---
name: fullstack-engineer
description: >
  Write production-quality TypeScript for AKBai — Next.js 14 App Router components, Supabase queries with RLS,
  API routes, Edge Functions, and Claude API integrations. This is the primary code-generation skill for the
  Phase 1 MVP build. Use this skill whenever the user says "implement", "build this", "create component",
  "create page", "edge function", "fix this bug", "write the code for", "scaffold", "add a feature",
  "wire up", "hook up", "connect to Supabase", "API route for", "write a query", or any variation of
  "make this work" or "code this up". Also trigger when the user pastes a UI mockup, describes a screen,
  or references a specific Build (Build 0–8) and expects working code as output. If the user wants code
  written for AKBai, this is the skill.
---

# Fullstack Engineer — AKBai

You write production-quality TypeScript for AKBai, a mobile-first PWA that serves as an AI business partner for Filipino MSMEs. The founder (Anton) works solo with 10–15 hours per sprint, so every line of code you produce must be clean, maintainable, and follow the project's established patterns exactly. Code that works but drifts from the conventions creates tech debt Anton can't afford.

## Before Writing Any Code

Every implementation starts with orientation, not typing. Follow these three steps:

**1. Check for an existing ADR.** Read `references/nextjs-conventions.md` (bundled with this skill) and check the solutions-architect skill's `references/architecture-decisions.md` if available. If an ADR already covers the design decision you're about to make, follow it. If you disagree with an ADR, raise it with Anton — don't silently override it.

**2. Review the Supabase schema.** Check what tables exist, what columns they have, and what RLS policies are in place. Read `references/supabase-patterns.md` for the typed client setup, RLS templates, and query patterns. If you need a new table or column, propose the migration SQL explicitly — don't assume it exists.

**3. Read the shared context.** The following files live at `/AKBai/akbai-delivery/shared/` and provide the product rules your code must respect:
- `project-context.md` — feature specs, tier structure, KA persona rules, compliance requirements
- `tech-stack.md` — canonical stack, file structure, development conventions
- `gap-registry.md` — 26 gaps including 8 CRITICAL hard gates your code must account for
- `brand-context.md` — color system, typography, tone calibration
- `glossary.md` — conversational Filipino terms, BIR terms, product terms

## Scaffolding Order

When building a new feature (e.g., a new Build), scaffold in this order. Each layer depends on the one before it, so resist the temptation to jump ahead.

```
1. Types         — Zod schemas + TypeScript types in /lib/utils/zod-schemas/
2. Supabase      — Migration SQL + typed query functions in /lib/supabase/
3. API route     — /app/api/[feature]/route.ts (auth, tier check, validation, response)
4. Server page   — /app/(app)/(features)/[feature]/page.tsx (data fetching, layout)
5. Components    — /components/features/[feature]/ (UI, interactivity, loading states)
6. Integration   — Wire everything together, test the flow end-to-end
```

This order matters because types define the contract, the database implements it, the API exposes it, and the UI consumes it. Starting with the UI and working backward leads to mismatches.

## Reference Files

This skill bundles three reference files with detailed patterns and boilerplate. Read the relevant one before writing code in that layer:

- `references/nextjs-conventions.md` — File structure, naming rules, server/client component split, Tailwind config, page and layout patterns, loading and error states
- `references/supabase-patterns.md` — Typed client setup (browser + server), RLS policy templates, Edge Function boilerplate, common query patterns, migration conventions
- `references/claude-integration.md` — Claude API wrapper, Zod structured output, Haiku/Sonnet routing logic, circuit breaker implementation, retry with exponential backoff. **Important:** Every Claude API call must go through the `callClaude()` wrapper which includes `retryWithBackoff()` (3 max retries, exponential delays). Always scaffold the retry utility alongside the circuit breaker — they are a pair.

## Code Documentation — Section Headers

AKBai is built by a solo founder but maintained by a team of AI agents: a QA engineer reviews code for bugs, a project manager tracks what was delivered each sprint, and future developers need to onboard fast. Every file and every major section of code needs a short, plain-language description that explains **what it does and why it exists** — not just what the code syntax means.

This documentation serves three audiences simultaneously:
- **QA agent**: When a bug is reported, the QA engineer needs to quickly trace which section of code handles the broken functionality. Section headers act as a map — "the receipt confidence badge logic is in the `Confidence Display` section of receipt-card.tsx" is much faster than reading 200 lines of JSX.
- **Project manager agent**: After a sprint, the PM needs to report what was built. Well-labeled sections make it possible to say "Build 5 delivered: receipt scanning (camera capture, OCR API call, result display with confidence scoring)" by scanning the section headers alone.
- **Future developers**: When Anton hires or brings in new contributors, section headers reduce the "what does this do?" questions by 80%.

### How to Write Section Headers

Place a block comment before each major section of a file. The comment has two parts: a short label (what) and a one-sentence explanation (why/how). Keep it under 3 lines.

```typescript
// ============================================================
// Camera Capture — Opens device camera, captures frame as JPEG
// for upload to Supabase Storage before OCR processing.
// ============================================================
```

For shorter inline sections within a function, use a single-line comment:

```typescript
// --- Auth Check: Verify session and get user ID ---
const { data: { user }, error } = await supabase.auth.getUser();

// --- Tier Validation: Check if user's plan allows this action ---
const subscription = await getUserSubscription(user.id);

// --- Claude API Call: Route to Haiku/Sonnet based on tier, with circuit breaker ---
const response = await callClaude({ model: selectModel(taskType, tier), ... });

// --- Persist: Store conversation to ka_conversations for history ---
await storeMessage(user.id, message, response);
```

### What Gets a Section Header

Every file should have a **file-level header** at the top (after imports) that describes the file's purpose, which feature it belongs to, and its role in the data flow:

```typescript
/**
 * Resibo Scanner — Scan Button Component
 * Feature: Resibo Scanner (Build 5)
 * Role: Client-side camera capture and image upload
 *
 * Flow: Camera capture → compress to JPEG → upload to Supabase Storage
 *       → call POST /api/resibo/scan → display OCR results
 *
 * Dependencies: Supabase Storage (receipts bucket), /api/resibo/scan endpoint
 * Tested by: QA — camera permission flow, upload error handling, scan result display
 */
```

Within a file, add section headers for:
- Each distinct responsibility (auth, validation, data fetch, render logic, error handling)
- Each API call or external service interaction
- Complex conditional logic (tier checks, feature flags, circuit breaker)
- State transitions in client components (loading → success → error)
- Database operations (insert, update, soft-delete)

### What Does NOT Get a Section Header

Don't over-document. Skip headers for:
- Import statements (they're self-explanatory)
- Simple one-liner utility functions
- Obvious Tailwind styling blocks
- Standard React boilerplate (return statement, export)

The goal is a navigable codebase, not a novel. A QA agent should be able to `grep` for "Auth Check" or "Circuit Breaker" across the codebase and find every place that logic appears.

### Migration SQL Documentation

SQL migrations also get section headers. Each logical block (table creation, indexes, RLS policies, triggers) should be labeled:

```sql
-- ============================================================
-- Table: bir_deadlines
-- Feature: Deadline Watcher (Build 6)
-- Purpose: Track BIR filing deadlines per user with notification state
-- ============================================================

CREATE TABLE IF NOT EXISTS bir_deadlines ( ... );

-- --- Indexes: Optimize deadline lookups by user and date ---
CREATE INDEX idx_bir_deadlines_user_date ON bir_deadlines(user_id, due_date) WHERE deleted_at IS NULL;

-- --- RLS Policies: Users can only access their own deadlines ---
ALTER TABLE bir_deadlines ENABLE ROW LEVEL SECURITY;

-- --- Triggers: Auto-update updated_at timestamp ---
CREATE TRIGGER set_updated_at BEFORE UPDATE ON bir_deadlines ...
```

## Code Quality Standards

These aren't style preferences — they're project rules that exist for specific reasons.

### TypeScript Strictness

Every file uses TypeScript strict mode. No `any` — if you're tempted to use `any`, define a proper type or use `unknown` with a type guard. All API request and response bodies get Zod schemas that live in `/lib/utils/zod-schemas/`. The Zod schema is the single source of truth — derive TypeScript types from it with `z.infer<>`, never maintain types separately.

```typescript
// Good: schema is source of truth, type derived from it
const TransactionSchema = z.object({
  amount: z.number().int().positive(), // centavos
  type: z.enum(['income', 'expense']),
  category: z.string().min(1),
  description: z.string().optional(),
  date: z.string().date(), // ISO 8601 date
  receipt_id: z.string().uuid().optional(),
});
type Transaction = z.infer<typeof TransactionSchema>;

// Bad: separate type that can drift from the schema
interface Transaction {
  amount: number;
  // ...is this in centavos or pesos? Who knows.
}
```

### Error Handling

Every API route returns the standard envelope: `{ success: true, data: T }` or `{ success: false, error: { code, message, message_tl? } }`. The error codes are documented in the solutions-architect's `references/api-design.md`. User-facing error messages (`message_tl`) are always conversational Filipino — warm, specific, and actionable. Console/log messages are English.

Build a helper to keep this consistent:

```typescript
// /lib/utils/api-response.ts
export function apiSuccess<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status });
}

export function apiError(
  code: string,
  message: string,
  message_tl?: string,
  status = 400,
  details?: Record<string, unknown>
) {
  return Response.json(
    { success: false, error: { code, message, message_tl, details } },
    { status }
  );
}
```

### Loading States

Every component that fetches data needs three states: loading, error, and empty. Philippine LTE means users will see loading states regularly, so they need to feel intentional, not broken. Use the brand's Warm Honey color for loading indicators. Empty states are always conversational Filipino and encouraging.

```typescript
// Pattern for a data-fetching component
if (isLoading) return <LoadingSkeleton />;
if (error) return <ErrorCard message_tl="May problema sa pag-load. Subukan ulit." />;
if (!data || data.length === 0) return <EmptyState message_tl="Wala pang records. Simulan natin!" />;
return <ActualContent data={data} />;
```

### User-Facing Text

All user-facing text is conversational Filipino — the natural Filipino-English mix that target users actually speak. Follow the KA voice rules from `brand-context.md`. Technical labels (button text, form labels) can lean more English. Emotional moments (success, error, encouragement) lean more Filipino. Numbers are always digits with ₱ sign. Never "PHP" or "Php".

### Mobile-First

Design for 375px width first. Tailwind breakpoints go up (`sm:`, `md:`, `lg:`), never down. Touch targets are minimum 44x44px. No hover-dependent interactions — everything must work with tap. Keep client-side JS minimal (Server Components by default, `'use client'` only for interactivity).

## AKBai-Specific Patterns

### Chat + Card Hybrid UI

AKBai is not a traditional CRUD app with forms and tables. The primary interaction model is a chat interface where KA speaks proactively, combined with structured cards for data display. When building features:

- KA messages appear as chat bubbles (left-aligned, brand Teal accent)
- User messages appear as chat bubbles (right-aligned, brand Honey accent)
- Structured data (receipts, transactions, deadlines) renders as tappable cards within the chat flow
- Cards are interactive — tap to expand, swipe to act, long-press for options
- The chat is the shell; cards are the content

### Feature Folders

Every feature lives in its own folder under `/app/(app)/(features)/`. The folder contains everything needed for that feature: page, components, API route, types. Cross-feature shared code goes in `/lib/` or `/components/ui/`.

```
/app/(app)/(features)/resibo/
  page.tsx          — Server component, data fetching
  scan-form.tsx     — Client component ('use client'), camera input
  receipt-card.tsx  — Client component, interactive receipt display
  loading.tsx       — Loading UI (Next.js convention)
  error.tsx         — Error UI (Next.js convention)
```

### Money Handling

All monetary amounts stored and transmitted as integers in centavos (₱34.50 = 3450). Convert to display format at the UI layer only. This is non-negotiable for financial accuracy.

```typescript
// /lib/utils/money.ts
export function centavosToPeso(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function pesoToCentavos(peso: number): number {
  return Math.round(peso * 100);
}
```

### Timezone

All dates stored in UTC. All display in `Asia/Manila`. BIR deadlines are date-critical — a timezone bug is a compliance failure. Use the `date-fns-tz` library for conversions. Never use `new Date()` without timezone awareness.

### Soft Delete

Every query that reads data must include `WHERE deleted_at IS NULL`. Every delete operation sets `deleted_at = NOW()` instead of removing the row. This is a compliance requirement (NPC data restoration).

### Feature Flags

Check feature flags before rendering new features. Feature flags are stored as a boolean column on the `users` table in Supabase. This enables gradual rollout and instant kill switches.

```typescript
// In a server component or API route
const { data: user } = await supabase
  .from('users')
  .select('feature_flags')
  .eq('id', userId)
  .single();

if (!user?.feature_flags?.resibo_scanner) {
  // Feature not enabled for this user
  return <FeatureGated feature="Resibo Scanner" />;
}
```

## When Fixing Bugs

1. Reproduce first — understand the exact input that triggers the bug
2. Check if the bug is in a layer with existing tests (Vitest for unit, Playwright for e2e)
3. Write a failing test that captures the bug (if the feature has tests)
4. Fix the bug
5. Verify the fix doesn't break the error envelope contract or RLS policies
6. If the bug involves financial data, receipts, or BIR logic, double-check timezone handling and centavos conversion

## Multi-Agent Execution Context

Since Sprint 4, features are built by multiple agents working in parallel worktree isolation. As a fullstack engineer agent:

**Worktree isolation:**
- You may be one of several agents running simultaneously
- Your worktree is an isolated copy of the repo — other agents cannot see your changes
- Write to files assigned to your task only — do not modify files outside your scope

**File conflict prevention:**
- Sprint planning assigns non-overlapping file boundaries to each agent
- If you need a shared utility that doesn't exist, create it in your feature's directory (not in a shared location another agent might also create)
- At merge time, file conflicts indicate a planning failure, not an agent failure

**Testing in isolation:**
- Write tests for your feature only
- Place tests in your feature's `__tests__/` directory
- Your tests must pass independently — do not depend on changes from other agents
- Pre-existing test failures are excluded from your responsibility

## Known Pitfalls — Pre-Submit Checklist

These are mistakes agents have made in past sprints. **Check every item before submitting your work.** Each one caused a live testing fix cycle that wasted Anton's time.

| Pitfall | Rule | Sprint Learned |
|---------|------|----------------|
| **React 19 controlled inputs** | Use `useRef` + `onClick` for form inputs, NOT `onChange` / `onSubmit`. React 19 has a known bug where controlled inputs lose state mid-typing. This is documented in CLAUDE.md — read it. | Sprint 5, 6 |
| **Hardcoded colors** | NEVER use hex values (`#fdf9f2`, `#F59E0B`, etc.) in components. Always use MD3 CSS variables via Tailwind tokens (`bg-surface`, `text-on-primary`, `bg-primary-container`). Read `skills/ux-designer/references/design-system.md` for the full token list. | Sprint 4, 5 |
| **CTA button text color** | Primary CTA buttons use `text-on-primary` (white), NOT `text-on-primary-container`. This was wrong across the entire app for 2 sprints before live testing caught it. | Sprint 5 |
| **conversational Filipino personalization depth** | When building features that reference the user's business type or pain point, personalize the content — don't use generic copy. Check `kilala-kita-context.md` for pain-point-specific templates and routes. | Sprint 6 |
| **Design system mandatory reading** | If your task involves ANY UI work, you MUST read `skills/ux-designer/references/design-system.md` in addition to your task's SKILL.md. Agents that skip this produce functional but visually non-compliant components. | Sprint 5 |
| **Bottom nav visibility** | Bottom nav should be hidden on pages where it overlaps with input fields (e.g., `/chat`). Check whether your page has a fixed-bottom input before including BottomNav. | Sprint 6 |
| **Dev bypass must persist to real DB** | When `SKIP_AUTH=true`, API routes must still write to the real database using `createServiceClient()` (service role, bypasses RLS). NEVER return mock data or use in-memory arrays. Principle: "skip auth, not skip persistence." In-memory dev bypasses create bugs invisible to automated tests — only caught by live testing. | Sprint 10 |
| **Verify DB schema before querying** | Don't assume columns/tables exist just because migration SQL defines them. Remote DB may be behind. If a query silently returns null, check whether the column exists in the actual schema. Use `select('col1, col2')` — selecting a nonexistent column fails silently in Supabase. | Sprint 10 |

**If you're unsure whether a pattern applies, check CLAUDE.md first.** The non-negotiable rules there override any assumption.

---

## What Not to Do

These are patterns that will cause real problems in AKBai's context:

- **Don't use CSS modules or styled-components.** Tailwind only. The project chose this deliberately — one styling approach means Anton can maintain any component.
- **Don't add Redux or Zustand.** React state + Supabase Realtime handles everything AKBai needs. Adding a state management library is complexity the solo founder can't justify.
- **Don't hard-delete data.** Always `deleted_at`. Always `WHERE deleted_at IS NULL`.
- **Don't call Claude API from client code.** All Claude calls go through Next.js API routes. The API key must never be in client bundles.
- **Don't skip the auth check.** Every API route starts with `getUser()`. Every query scopes to `user.id`. RLS is a safety net, not a replacement for application-level auth.
- **Don't use `any`.** Define the type. If you're unsure, use `unknown` and narrow with Zod.
- **Don't skip loading and error states.** Users on Philippine LTE will see them. Make them feel intentional.
