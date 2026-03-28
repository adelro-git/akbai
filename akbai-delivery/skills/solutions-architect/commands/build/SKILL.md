---
name: "build"
description: >
  End-to-end feature build command orchestrating design, architecture decisions, schema design, code scaffolding, and implementation.
  Chains solutions-architect → data-architect → fullstack-engineer → qa-engineer for complete feature delivery.
  Trigger on "/build [feature]" where feature is a Build 0–8 item (e.g., "/build Resibo Scanner", "/build Dashboard", "/build Daily Check-In").
  Generates Architecture Decision Record (ADR), database migrations, React component scaffolds, API routes, and test stubs.
---

# /build Command — Solutions Architect

You orchestrate end-to-end feature builds for AKBai. When the user requests `/build [feature]`, you coordinate across architecture, data modeling, implementation, and testing.

## Before Starting

Read the shared context files (these define your product, constraints, and standards):
- `/AKBai/akbai-delivery/shared/project-context.md` — product overview, target market, phases, current phase
- `/AKBai/akbai-delivery/shared/tech-stack.md` — canonical Next.js 14, TypeScript, Supabase, Claude API, Xendit stack
- `/AKBai/akbai-delivery/shared/gap-registry.md` — pre-launch gaps and hard gates (critical for phase safety)
- `/AKBai/akbai-delivery/shared/glossary.md` — product terms (Kilala Kita, Ang Umaga Mo, KA, Taglish, personas)
- `/AKBai/akbai-delivery/shared/brand-context.md` — KA voice, Taglish tone rules, brand archetypes

Then read the solutions-architect references:
- `references/architecture-decisions.md` — existing ADRs (avoid duplicate decisions)
- `references/api-design.md` — REST conventions, error format, authentication patterns
- `references/design-gates.md` — hard design gates and trust recovery patterns

---

## Workflow: /build [feature]

### Step 1: Validate Feature & Scope
1. Parse the feature name from the user's request.
2. Check `project-context.md` §5 (Core MVP Features Build 0–8) to confirm this is a planned feature.
3. Confirm the current phase allows this feature (e.g., don't build Build 3 features during Phase 0).
4. If out of scope: show the user the official Build order and ask which feature they actually want.
5. **If `po` (product-owner) is on the team:** Wait for scope approval message from `po` before proceeding to Step 3. The `po` validates tier allocation, MCTD score, and acceptance criteria. Incorporate their scope guidance into the ADR.

### Step 2: Read Architecture References
1. Check `references/architecture-decisions.md` for any existing ADRs about this feature (avoid duplicates).
2. Check `references/design-gates.md` for any hard gates blocking this feature (e.g., "Taglish Style Guide must be finalized before KA reasoning features ship").
3. Review `references/api-design.md` for REST conventions that apply to this feature's API routes.

### Step 3: Generate Architecture Decision Record (ADR)
1. If an ADR already exists for this feature (found in Step 2), skip to Step 4.
2. If no ADR exists, generate one using this format:

```
# ADR-[N]: [Feature Name]

## Context
[Problem statement: Why are we building this? What user pain does it solve?
Reference project-context.md §2 (Target Market & Personas) if applicable.]

## Decision
[High-level approach: What technology/pattern/design are we using?
Reference solutions-architect principles (solo-founder survivability, mobile-first, cost efficiency).
Call out tier scope if tier-specific (Free/Pro/Business).]

## Consequences
- **Positive:** [List benefits: performance, maintainability, cost, etc.]
- **Negative:** [List trade-offs: complexity, cost, potential future challenges, etc.]

## Alternatives Considered
- [Alternative A: Brief description and why we rejected it]
- [Alternative B: Brief description and why we rejected it]

## Related Gaps
- [Link to gap-registry.md items this ADR addresses, e.g., "Addresses Gap B1 (AI loading states)"]
```

Example ADR context:
- **For KA chat features:** Include Taglish tone requirements, system prompt architecture, daily API spend cap considerations.
- **For payment/subscription features:** Include Xendit webhook idempotency, grace period logic, tier enforcement.
- **For receipt scanning:** Include Haiku Vision cost model (₱0.16/scan), accuracy targets (85%+), file storage patterns.
- **For BIR compliance features:** Include timezone enforcement (UTC+8), disclaimer requirements, legal boundaries.

3. Present the ADR to the user for review before proceeding. Ask: "Does this architecture direction align with your vision?"

### Step 4: Hand Off to Data Architect for Schema Design
Output: "Now handing off to **data-architect** to design schema changes and generate migrations."

Delegate to data-architect patterns with these inputs:
```
Feature: [Feature Name]
ADR: [Link to ADR if created, or ADR number from references]
Tier scope: [Free/Pro/Business/All]
Primary tables involved: [e.g., "transactions, daily_entries, bir_deadlines"]
Key constraints:
  - RLS required on all new tables (user_id scoped)
  - Soft delete on all user-owned tables (deleted_at TIMESTAMPTZ NULL)
  - Audit columns on all tables (created_at, updated_at via trigger)
  - Service role key never in client code
Key decisions from ADR:
  - [Relevant architectural decision that affects schema, e.g., "conversation_domain column for future multi-domain expansion"]
```

**If running in a team:** Use SendMessage to deliver the handoff inputs above to the `data` teammate. Also message `ux` (if present) with UI pattern decisions for this feature (Chat+Card / Card-only / Form, key screens). Mark your ADR task complete in the shared task list.

**If running sequentially:** Wait for data-architect to return:
- Migration SQL file(s) in format: `YYYYMMDDHHMMSS_description.sql`
- RLS policy definitions per table
- Seed data (if applicable, e.g., bir_deadlines lookup table)

### Step 5: Scaffold Feature Folder Structure
Using the feature name, create the folder structure following Next.js 14 App Router conventions:

```
/app/(features)/[feature-slug]/
  page.tsx                 # Server component, entry point
  layout.tsx               # Feature-scoped layout (if needed)
  components/
    [ComponentName].tsx
    [ComponentName].client.tsx  # 'use client' if interactive
  hooks/
    use[FeatureName].ts    # Custom hooks for this feature (data fetching, state)
  lib/
    schemas.ts             # Zod schemas for API inputs
    utils.ts               # Feature-specific helpers
/app/api/[feature]/
  route.ts                 # POST/GET handlers for Claude API calls, Supabase operations
```

Example scaffold for Resibo Scanner:
```
/app/(features)/resibo/
  page.tsx                 # Scanner UI entry
  components/
    CameraCapture.tsx
    ReceiptPreview.tsx
    ReceiptCard.tsx
  hooks/
    useScanReceipt.ts
  lib/
    schemas.ts             # ReceiptInput, ReceiptOutput Zod schemas
    utils.ts               # Image compression, file size validation
/app/api/resibo/
  route.ts                 # POST handler: accept image → call Claude Haiku Vision → store in Supabase Storage + create receipt record
```

### Step 6: Generate Implementation Code
Output skeleton code for:

**1. Server Component (page.tsx)**
- TypeScript strict, no `any`
- All server-side data fetching using Supabase client with RLS context
- Composition of child components (mostly static)
- Error states, empty states, loading states with Taglish messages
- No API keys exposed

Example snippet:
```typescript
// /app/(features)/[feature]/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import ErrorState from '@/components/ui/ErrorState';
import { ComponentName } from './components/ComponentName';

export default async function FeaturePage() {
  const supabase = createServerComponentClient({ cookies });

  try {
    // Fetch user context
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <ErrorState message="Kailangan mo mag-login muna." />;

    // Fetch feature-specific data (RLS scopes to user automatically)
    const { data, error } = await supabase
      .from('[table]')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) {
      return <EmptyState message="Wala pang [resource]. Simulan mo ngayon." />;
    }

    return <ComponentName data={data} userId={user.id} />;
  } catch (err) {
    return <ErrorState message="May problema — subukan mo ulit sa ilang minuto." />;
  }
}
```

**2. Client Components**
- Mark with `'use client'` only if they need interactivity (state, hooks, event handlers)
- Use TanStack Query for data fetching and mutations
- Proper error boundaries and loading states
- Taglish user-facing copy

Example:
```typescript
'use client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/spinner';

interface ComponentNameProps {
  data: any[];
  userId: string;
}

export function ComponentName({ data, userId }: ComponentNameProps) {
  const mutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch('/api/[feature]', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to process');
      return res.json();
    },
    onSuccess: () => {
      // Refetch or update cache
    },
    onError: (error) => {
      console.error(error);
      // Show Taglish error toast
    },
  });

  return (
    <div>
      <button onClick={() => mutation.mutate({ userId })}>
        {mutation.isPending ? <LoadingSpinner /> : 'Submit'}
      </button>
    </div>
  );
}
```

**3. API Route (/app/api/[feature]/route.ts)**
- Always server-side only
- Auth check first (verify user via Supabase session)
- Tier check (Free/Pro/Business)
- Daily spend cap check (circuit breaker for Claude API calls)
- Zod schema validation on input
- Claude API call (if needed)
- Supabase mutation (insert/update)
- Structured error response with code + message_tl (Taglish message)

Example:
```typescript
// /app/api/[feature]/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';

const InputSchema = z.object({
  /* Define expected input shape */
});

export async function POST(req: Request) {
  try {
    // 1. Auth check
    const supabase = createServerClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      cookies,
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message_tl: 'Kailangan mo mag-login muna.' } },
        { status: 401 }
      );
    }

    // 2. Tier check
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .single();
    if (!subscription || subscription.tier === 'Free') {
      // May check for this feature availability
    }

    // 3. Daily spend cap
    const { data: spend } = await supabase
      .from('daily_api_spend')
      .select('amount_usd')
      .eq('user_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .single();
    if (spend && spend.amount_usd > 5) {
      return Response.json(
        { success: false, error: { code: 'RATE_LIMITED', message_tl: 'Umabot na sa daily limit. Subukan bukas.' } },
        { status: 429 }
      );
    }

    // 4. Parse & validate input
    const body = await req.json();
    const input = InputSchema.parse(body);

    // 5. Claude API call (if needed)
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: 'You are KA...',
      messages: [{ role: 'user', content: input.prompt }],
    });

    // 6. Extract & validate response
    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    // 7. Store in Supabase
    const { error: dbError } = await supabase
      .from('[table]')
      .insert({ user_id: user.id, data: content.text, created_at: new Date() });
    if (dbError) throw dbError;

    // 8. Return success
    return Response.json({ success: true, data: content.text });
  } catch (error: unknown) {
    console.error('API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message_tl: 'May problema — subukan mo ulit sa ilang minuto.' } },
      { status: 500 }
    );
  }
}
```

**4. Zod Schemas (lib/schemas.ts)**
- Define input/output shapes for all API routes
- Strict validation (no lenient parsing)
- Money handling: amounts as integers in centavos (₱34.50 = 3450)
- Taglish field names where applicable

Example:
```typescript
// /app/(features)/[feature]/lib/schemas.ts
import { z } from 'zod';

export const ReceiptInputSchema = z.object({
  amount_centavos: z.number().int().positive('Dapat may amount'),
  date: z.string().datetime('Invalid date'),
  merchant: z.string().min(1, 'Merchant name required'),
  category: z.enum(['food', 'supplies', 'utilities', 'other']),
});

export type ReceiptInput = z.infer<typeof ReceiptInputSchema>;
```

**5. RLS Policies**
- Generate SQL for every table this feature touches
- Scoped to `auth.uid() = user_id` (user owns their rows)
- Include SELECT, INSERT, UPDATE policies as needed

Example:
```sql
-- RLS policies for receipts table
CREATE POLICY "Users can read own receipts"
  ON receipts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receipts"
  ON receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own receipts"
  ON receipts FOR UPDATE
  USING (auth.uid() = user_id);
```

**6. Error Handling & Taglish User-Facing Messages**
- Every user-visible error should be Taglish, warm, and actionable
- Console errors in English (for debugging)
- Pattern: `{ success: boolean, error?: { code: string, message: string, message_tl: string } }`

Example Taglish messages:
- "Hindi ko na-detect ang receipt. Subukan mo ng mas malinaw ang photo."
- "May problema sa network. Mag-retry ka in a few seconds."
- "Umabot na sa scan limit mo. Upgrade ka to Pro para sa unlimited scans."

### Step 7: Generate Test Stubs
Output: "Now handing off to **qa-engineer** to generate test suite."

Delegate to qa-engineer patterns with these inputs:
```
Feature: [Feature Name]
Scope: [Unit tests / Integration tests / E2E tests]
Test checklist items:
  - [Behavior 1: should [action] when [condition]]
  - [Behavior 2: should [action] when [condition]]
  - [Philippine MSME-specific edge case, e.g., GCash receipt, thermal receipt]
API routes to test: [e.g., POST /api/resibo for Resibo Scanner]
Claude API calls involved: [Haiku Vision, Sonnet reasoning, etc.]
RLS policies to verify: [e.g., "Users cannot access other users' receipts"]
```

**If running in a team:** Use SendMessage to deliver the test inputs above to the `qa` teammate. Mark your test handoff task complete in the shared task list.

**If running sequentially:** Wait for qa-engineer to return test files (Jest + Playwright) ready to run.

### Step 8: Compile & Output Deliverables

Create a summary output with all deliverables:

```markdown
# Build Deliverables: [Feature Name]

## 1. Architecture Decision Record (ADR)
- **File:** references/architecture-decisions.md (append entry)
- **Key decision:** [1-2 sentence summary]
- **Tier scope:** [Free/Pro/Business]

## 2. Database Migrations
- **File:** /supabase/migrations/[YYYYMMDDHHMMSS_description.sql](path)
- **Tables created/modified:** [list]
- **RLS policies:** [list]

## 3. Code Scaffolds
- **Feature folder:** /app/(features)/[feature-slug]/
  - page.tsx (Server component)
  - components/ (Child components)
  - hooks/ (Data fetching)
  - lib/ (Schemas, utils)
- **API route:** /app/api/[feature]/route.ts

## 4. Zod Schemas
- **File:** /app/(features)/[feature-slug]/lib/schemas.ts
- **Schemas:** [InputSchema, OutputSchema, etc.]

## 5. Test Stubs
- **Unit tests:** /app/(features)/[feature-slug]/__tests__/[component].test.ts
- **Integration tests:** /app/api/[feature]/__tests__/route.test.ts
- **E2E tests:** /e2e/[feature].spec.ts

## Next Steps
1. Update migration file with actual SQL if not auto-generated
2. Implement components using scaffolds
3. Run tests: `npm run test`
4. Hand off to **fullstack-engineer** for implementation review

---
**Generated by:** /build [feature] workflow
**Phase:** [Current Phase]
**Date:** [Today's date]
```

### Step 9: Ask for User Confirmation
Before finalizing, ask the user:
- "Should I proceed with generating the full code scaffolds and migrations?"
- If they want to refine the ADR, offer to iterate.
- If they want to skip something (e.g., "Just scaffolds, no migrations yet"), respect that.

---

## Hand-Off Protocol

When delegating to another skill:

1. **To data-architect:** Provide feature name, ADR reference, tier scope, and primary tables.
2. **To fullstack-engineer:** Provide feature folder path, API route skeleton, and Zod schemas.
3. **To qa-engineer:** Provide feature name, test scope (unit/integration/E2E), and edge cases to test.

Each skill returns artifacts ready for the next step. Don't wait in the background — the user will call the next skill or come back with feedback.

---

## Common Patterns

### For Receipt Scanning Features (Resibo Scanner)
- Claude Haiku Vision (₱0.16/scan cost target)
- Storage: Supabase Storage (receipts/ folder)
- Schema: receipts table with image_path, structured_data (JSON), confidence score
- Accuracy target: 85%+ field extraction (test via Build E1 spike)
- Edge cases: thermal prints, faded text, handwritten notes

### For KA Chat/Reasoning Features (Reply Drafter, Morning Briefing, etc.)
- Claude Sonnet (Pro/Business only)
- System prompt architecture: modular scopes + user context + conversation history
- Tone: Taglish, warm, proactive, cite data
- Error handling: Trust recovery pattern (acknowledge → explain → next step)
- Cost: Circuit breaker on daily spend

### For BIR Compliance Features (Deadline Watcher)
- Timezone: UTC+8 (Asia/Manila) — critical for deadline accuracy
- Disclaimers: Required on all outputs ("Ito ay gabay lamang, hindi tax advice.")
- Data: bir_deadlines lookup table (business_type → filing_type → due_date)
- Push notifications: 7/3/1-day sequence for Pro/Business

### For Multi-Tier Features
- Free tier: Limited queries/scans, Haiku only
- Pro tier: Full feature, Sonnet included
- Business tier: Same as Pro + multi-seat + GSheets OAuth (Phase 2)
- Enforce in API route via tier check before processing

---

## Troubleshooting

- **Feature doesn't exist in Build 0–8:** Check project-context.md §5 and ask user to clarify.
- **ADR already exists:** Reference it instead of creating a duplicate.
- **Design gate blocking this feature:** List the gate and ask user if they want to resolve it first or defer.
- **Unclear tier scope:** Ask user: "Is this Free/Pro/Business/All tiers?" and reference gap-registry.md for hints.

---

## Validation Checklist

Before handing off to fullstack-engineer, verify:
- [ ] ADR created or referenced
- [ ] Schema designed with RLS policies
- [ ] Folder structure follows /app/(features)/[feature-name]/ pattern
- [ ] API routes have auth checks, tier checks, and error handling
- [ ] Zod schemas defined
- [ ] Taglish error messages included
- [ ] No API keys in client code
- [ ] All test stubs passed to qa-engineer
