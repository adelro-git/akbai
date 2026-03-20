---
name: "review"
description: >
  Comprehensive code review covering quality and security. Performs dual review: code quality (conventions, TypeScript, error handling, TanStack Query)
  and security (RLS, input validation, secrets, prompt injection, auth, data classification). Review severity: CRITICAL (must fix), IMPORTANT (should fix),
  SUGGESTION (nice to have). Trigger on "/review" when code is ready for quality gate before merge.
---

# /review Command — Fullstack Engineer

You perform comprehensive code reviews for AKBai features, combining code quality and security analysis. When the user requests `/review`, you conduct a dual-track review across TypeScript compliance, convention adherence, error handling, and security posture.

## Before Starting

Read the shared context files:
- `/AKBai/akbai-delivery/shared/project-context.md` — product, constraints, solo-founder survivability principle
- `/AKBai/akbai-delivery/shared/tech-stack.md` — canonical Next.js 14, TypeScript strict, Supabase, Claude API stack
- `/AKBai/akbai-delivery/shared/gap-registry.md` — hard gates and compliance gaps
- `/AKBai/akbai-delivery/shared/glossary.md` — product terms, KA persona, Taglish rules
- `/AKBai/akbai-delivery/shared/brand-context.md` — KA voice, tone calibration by context

Then read the fullstack-engineer references:
- `references/nextjs-conventions.md` — file structure, Server Components, App Router patterns
- `references/supabase-patterns.md` — RLS policies, soft deletes, audit columns, connection handling
- And the security-compliance references:
- `references/security-framework.md` — RLS, input validation, secrets management, prompt injection defense, CSRF/XSS, auth checks, data classification

---

## Workflow: /review

### Step 1: Parse Review Scope
Ask the user:
- "What feature are you reviewing? (e.g., Resibo Scanner, Dashboard, Reply Drafter)"
- "Which file(s) or PR should I focus on?" (e.g., /app/(features)/resibo/page.tsx, /app/api/resibo/route.ts)
- "Any known concerns or edge cases to focus on?"

### Step 2: Read the Code Being Reviewed
1. Request the file path(s) from the user.
2. Read the code (typically 1–3 files per review: page.tsx or component, API route, Zod schemas).
3. Ask if there are related files (hooks, utils, tests) you should review.

### Step 3: Code Quality Review

Perform systematic checks across these areas:

#### 3a. Convention Adherence

Check against `references/nextjs-conventions.md` and tech-stack.md §Development Conventions:

**File/Folder Structure:**
- ✓ Feature folders follow `/app/(features)/[feature-name]/` pattern
- ✓ Server components in feature root or `components/`
- ✓ `'use client'` components in `components/` subdirectory
- ✓ API routes in `/app/api/[feature]/route.ts`
- ✓ Hooks in `hooks/` subdirectory (named `use[FeatureName]`)
- ✓ Shared lib code in `lib/` subdirectory (schemas, utils)

**Naming Conventions:**
- ✓ Components: PascalCase (ReceiptCard.tsx, CameraCapture.tsx)
- ✓ Hooks: camelCase starting with 'use' (useReceiptScan, useScanMutation)
- ✓ Utilities: camelCase (formatCurrency, validateReceipt)
- ✓ Zod schemas: PascalCase ending with 'Schema' (ReceiptInputSchema)
- ✓ API routes: lowercase (e.g., /api/resibo/route.ts, not /api/Resibo)

**Comment/Documentation:**
- ✓ No commented-out code (delete it or use git history)
- ✓ Inline comments explain "why", not "what" (code should be self-documenting)
- ✓ Complex logic has a comment explaining intent

#### 3b. TypeScript Strict Compliance

Check against tech-stack.md §Development Conventions (no `any` allowed):

**Type Safety:**
- ✓ No `any` types anywhere (CRITICAL if found)
- ✓ All function parameters typed
- ✓ All return types explicitly declared (or inferred from return statement)
- ✓ Zod schemas used for API inputs (never untyped req.body)
- ✓ All imports have named types where applicable
- ✓ Generics properly constrained (e.g., `<T extends Record<string, any>>`)

**Error Handling:**
- ✓ Try-catch blocks around Promise chains or async/await
- ✓ All error types explicitly typed (not just `catch (error)`)
- ✓ No silent failures (always log or handle errors)

Example issue:
```typescript
// BAD - any type
const data: any = await response.json();

// GOOD - typed
interface ApiResponse {
  success: boolean;
  data: ReceiptData;
  error?: { code: string; message_tl: string };
}
const data = (await response.json()) as ApiResponse;
```

#### 3c. Error Handling Completeness

Check against tech-stack.md §Development Conventions (error pattern: `{ success, data?, error? }`):

**API Routes:**
- ✓ All endpoints return `{ success: boolean, data?, error? }` shape
- ✓ error object has `{ code: string, message: string, message_tl: string }`
- ✓ All throw statements inside try-catch
- ✓ HTTP status codes match error type (401 for auth, 429 for rate limit, 500 for internal, etc.)
- ✓ Console errors in English, user-facing messages in Taglish (message_tl)

**Client Components:**
- ✓ useMutation() has onError callback
- ✓ useQuery() has error state handling
- ✓ All async operations wrapped in try-catch
- ✓ Error toast or error state shown to user

Example issue:
```typescript
// BAD - no error handling
const result = await fetch('/api/resibo', { method: 'POST' });
const data = await result.json();

// GOOD - with status & error checks
const result = await fetch('/api/resibo', { method: 'POST' });
if (!result.ok) throw new Error(`API error: ${result.status}`);
const data = (await result.json()) as ApiResponse;
if (!data.success && data.error) {
  throw new Error(data.error.message);
}
```

#### 3d. Loading, Empty, Error State Coverage

Check against gap-registry.md §Category B (UX Gaps B1, B5):

**UI Completeness:**
- ✓ Every page/component with async data has a loading state (spinner, skeleton, disabled buttons)
- ✓ Empty state message shown when no data (Taglish, e.g., "Wala pang data. Mag-upload ka ng receipt para makapagsimula.")
- ✓ Error state shown with actionable message (e.g., "May problema sa network. Mag-retry ka in a few seconds.")
- ✓ All Claude API calls show animated thinking indicator (gap-registry.md B1)

Example issue:
```typescript
// BAD - no loading/error states
export function ReceiptList({ receipts }) {
  return <div>{receipts.map(r => <ReceiptCard key={r.id} receipt={r} />)}</div>;
}

// GOOD - with states
export function ReceiptList({ receipts, isLoading, error }) {
  if (isLoading) return <LoadingSpinner message="Scanning..." />;
  if (error) return <ErrorState message="May problema — subukan mo ulit." />;
  if (!receipts?.length) return <EmptyState message="Wala pang receipts." />;
  return <div>{receipts.map(r => <ReceiptCard key={r.id} receipt={r} />)}</div>;
}
```

#### 3e. TanStack Query Patterns

Check against tech-stack.md (data fetching best practices):

**Query Patterns:**
- ✓ Cache keys are stable and unique (e.g., `['receipts', userId]` not `['receipts', Math.random()]`)
- ✓ staleTime and cacheTime set appropriately for the data type
  - Financial data: staleTime 0, cacheTime 5min (always fresh)
  - User profile: staleTime 5min, cacheTime 30min
  - Static lookups (BIR calendar): staleTime 1 day, cacheTime unlimited
- ✓ Mutations have onSuccess callback to invalidate related queries
- ✓ useQuery error boundary or onError callback present
- ✓ No unnecessary refetches or polling

Example issue:
```typescript
// BAD - unstable cache key
useQuery({
  queryKey: ['receipts', Math.random()],  // New key every render!
  queryFn: fetchReceipts,
});

// GOOD - stable cache key
useQuery({
  queryKey: ['receipts', userId],
  queryFn: () => fetchReceipts(userId),
  staleTime: 0,  // Financial data is time-sensitive
});
```

#### 3f. Taglish Copy Quality

Check against brand-context.md (KA voice, tone calibration):

**User-Facing Strings:**
- ✓ No corporate jargon ("Certainly!", "As an AI...")
- ✓ Warm, conversational tone ("Check mo if tama lahat" not "Please verify correctness")
- ✓ Uses "po" naturally (especially on tax/BIR topics)
- ✓ Numbers in digits with peso sign (₱18,400 not "18400 pesos" or "PHP 18400")
- ✓ Names used when available ("Maria" not "user")
- ✓ Action-oriented copy ("Mag-retry ka" not "Please retry")

Example issues:
```typescript
// BAD - corporate tone
const message = "Your receipt has been successfully processed and stored.";

// GOOD - Taglish, warm
const message = "Na-scan ko na yung receipt mo — check mo if tama lahat bago i-save natin.";
```

---

### Step 4: Security Review

Perform systematic security checks:

#### 4a. RLS Policies on All New/Modified Tables

Check against tech-stack.md and security-framework.md:

**For every table touched by this feature:**
- ✓ SELECT policy exists: `USING (auth.uid() = user_id)` or equivalent
- ✓ INSERT policy exists: `WITH CHECK (auth.uid() = user_id)` or equivalent
- ✓ UPDATE policy exists: `USING (auth.uid() = user_id)` or equivalent
- ✓ DELETE policy not present (soft-delete only, never hard-delete)
- ✓ No `ENABLE ROW LEVEL SECURITY` is missing

Example issue:
```sql
-- BAD - missing RLS
CREATE TABLE receipts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  amount_centavos INT
);

-- GOOD - RLS enabled
CREATE TABLE receipts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount_centavos INT
);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own receipts"
  ON receipts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receipts"
  ON receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

#### 4b. Input Validation (Zod Schemas on All API Inputs)

Check against security-framework.md:

**API Routes:**
- ✓ All request body parsed via Zod schema (never unvalidated req.json())
- ✓ All query parameters validated (not assumed safe)
- ✓ Zod schema has min/max length constraints where applicable
- ✓ Email/URL fields validated with .email(), .url()
- ✓ Money amounts validated as positive integers (no floats)
- ✓ Enum fields restrict to known values
- ✓ Custom refinements for cross-field validation (e.g., end_date > start_date)

Example issue:
```typescript
// BAD - unvalidated input
export async function POST(req: Request) {
  const { amount, description } = await req.json();
  await supabase.from('expenses').insert({ amount, description });
}

// GOOD - Zod validation
const ExpenseSchema = z.object({
  amount_centavos: z.number().int().positive('Amount must be positive'),
  description: z.string().min(1).max(255),
  date: z.string().datetime(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const { amount_centavos, description, date } = ExpenseSchema.parse(body);
  // Now safe to use
  await supabase.from('expenses').insert({ amount_centavos, description, date });
}
```

#### 4c. No Secrets in Client Code

Check against security-framework.md and tech-stack.md:

**Environment Variables:**
- ✓ API keys NOT in NEXT_PUBLIC_ env vars
  - NEXT_PUBLIC_SUPABASE_URL ✓ (public, safe)
  - NEXT_PUBLIC_SUPABASE_ANON_KEY ✓ (public anon key, safe)
  - ANTHROPIC_API_KEY ✗ (never NEXT_PUBLIC_)
  - SUPABASE_SERVICE_ROLE_KEY ✗ (never NEXT_PUBLIC_, server-side only)
- ✓ .env.local or .env.local.example never committed (check .gitignore)
- ✓ All Claude API calls in /app/api/ routes, not in client components

**Client-side checks:**
- ✓ No hardcoded API keys in component code
- ✓ No sensitive data in fetch payloads that could be logged
- ✓ All calls to external APIs proxied through Next.js API routes

Example issue:
```typescript
// BAD - secret in client code
const ANTHROPIC_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
export function ReceiptScanner() {
  const client = new Anthropic({ apiKey: ANTHROPIC_KEY });
  // ...
}

// GOOD - Claude call in API route
// /app/api/resibo/route.ts
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// /app/(features)/resibo/hooks/useScanReceipt.ts
export function useScanReceipt() {
  return useMutation({
    mutationFn: (image) =>
      fetch('/api/resibo', { method: 'POST', body: JSON.stringify({ image }) }),
  });
}
```

#### 4d. Prompt Injection Defense on User Inputs to Claude

Check against security-framework.md:

**Before passing user input to Claude API:**
- ✓ All user inputs treated as untrusted data
- ✓ No string interpolation of user input into system prompt
- ✓ User input passed as separate `messages` element, not merged into system
- ✓ System prompt locked and versioned (not dynamically constructed)
- ✓ If user context needed in system prompt, it's restricted to safe fields (name, business_type, tier)

Example issue:
```typescript
// BAD - user input interpolated into prompt
const userQuery = req.body.question; // Untrusted
const response = await anthropic.messages.create({
  system: `You are KA. The user's question is: ${userQuery}`,  // INJECTION RISK
  messages: [{ role: 'user', content: 'Answer their question' }],
});

// GOOD - user input in messages, not system
const userQuery = req.body.question; // Untrusted
const { data: user } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from('users')
  .select('business_name, tier')
  .eq('id', user.id)
  .single();

const response = await anthropic.messages.create({
  system: `You are KA, a business partner for ${profile.business_name}. You speak Taglish...`,  // Safe: only business_name
  messages: [{ role: 'user', content: userQuery }],  // User input here
});
```

#### 4e. CSRF/XSS Protection

Check against security-framework.md:

**Form Submissions:**
- ✓ All POST requests use next/navigation or built-in Next.js form handling
- ✓ No raw fetch() POST without authentication check in API route
- ✓ API routes verify session/auth before processing (CSRF implicitly protected via session)

**HTML/Content:**
- ✓ No dangerouslySetInnerHTML() unless absolutely necessary
- ✓ If user content displayed, sanitize with `npm install sanitize-html` or use shadcn components
- ✓ Shadcn/UI components used (built-in XSS protection)

Example issue:
```typescript
// BAD - XSS risk
export function ReceiptCard({ receipt }) {
  return <div dangerouslySetInnerHTML={{ __html: receipt.notes }} />;
}

// GOOD - safe rendering
export function ReceiptCard({ receipt }) {
  return <div className="whitespace-pre-wrap">{receipt.notes}</div>;
}
```

#### 4f. Proper Auth Checks on API Routes

Check against security-framework.md:

**Every API route must:**
- ✓ Call `supabase.auth.getUser()` first
- ✓ Check if `user` exists; return 401 if null
- ✓ Use user.id for all queries (RLS enforced at database level too)
- ✓ Never trust user_id from request body (use auth.getUser() always)

Example issue:
```typescript
// BAD - trusting user_id from body
export async function POST(req: Request) {
  const { user_id, amount } = await req.json();
  await supabase.from('transactions').insert({ user_id, amount });
}

// GOOD - using authenticated user
export async function POST(req: Request) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 });

  const { amount } = await req.json();
  await supabase.from('transactions').insert({ user_id: user.id, amount });
}
```

#### 4g. Data Classification Compliance

Check against project-context.md §9 (Compliance Requirements) and security-framework.md:

**PII Data (name, email, phone, business_name):**
- ✓ Encrypted at rest (Supabase handles, verify encryption settings enabled)
- ✓ Never logged (console.log, Sentry, PostHog)
- ✓ RLS scoped to user

**Financial Data (transaction amounts, receipts, costing):**
- ✓ Encrypted at rest
- ✓ RLS scoped to user
- ✓ Never exposed to third-party APIs without user consent

**Analytics Data (feature usage, session data):**
- ✓ Anonymized where possible (no user names in event names)
- ✓ PostHog configured to not capture PII

Example issue:
```typescript
// BAD - logging PII
console.log('User email:', user.email, 'Amount:', transaction.amount);

// GOOD - only log safe context
console.log('Transaction processed for tier:', tier, 'Amount cents:', amount);
```

---

### Step 5: Compile Review Comments

Organize findings into three severity levels:

#### CRITICAL (Must Fix Before Merge)
- Any security vulnerability (RLS missing, unvalidated input, exposed secrets)
- TypeScript `any` types
- Unhandled errors in production code
- Missing auth checks on API routes
- Prompt injection risks

Format:
```
🔴 CRITICAL: [File] — [Issue]
   Location: [Line number if possible]
   Why: [Explanation of risk]
   Fix: [Specific recommendation]
```

#### IMPORTANT (Should Fix)
- Convention violations (naming, folder structure)
- Missing error states (loading, empty, error)
- Suboptimal TanStack Query cache keys
- Missing unit/integration tests for this feature
- Non-standard Taglish tone in user-facing copy

Format:
```
🟡 IMPORTANT: [File] — [Issue]
   Location: [Line number if possible]
   Suggestion: [Recommendation]
```

#### SUGGESTION (Nice to Have)
- Code clarity improvements (rename variables for clarity)
- Performance micro-optimizations
- Additional comments for complex logic
- Nice-to-have test coverage for edge cases

Format:
```
💡 SUGGESTION: [File] — [Issue]
   Note: [Observation]
   Could consider: [Optional improvement]
```

### Step 6: Output Review Report

Provide a structured report:

```markdown
# Code Review: [Feature Name]

## Summary
- **Files reviewed:** [Count]
- **Total issues:** [CRITICAL: X, IMPORTANT: Y, SUGGESTION: Z]
- **Merge readiness:** [APPROVE / REQUEST CHANGES / COMMENT ONLY]

## CRITICAL Issues (Blocking)
1. [CRITICAL issue 1]
2. [CRITICAL issue 2]
...

## IMPORTANT Issues
1. [IMPORTANT issue 1]
2. [IMPORTANT issue 2]
...

## Suggestions
1. [SUGGESTION 1]
2. [SUGGESTION 2]
...

## Quality Metrics
- **TypeScript strictness:** ✓ No `any` types
- **Error handling:** ✓ / ⚠ [detail]
- **RLS coverage:** ✓ / ⚠ [detail]
- **Input validation:** ✓ / ⚠ [detail]
- **Taglish tone:** ✓ / ⚠ [detail]

## Recommendations
[Summary of what to fix before merge]

## Approved for Merge?
- [ ] All CRITICAL issues resolved
- [ ] All IMPORTANT issues addressed (or deferred with justification)
- [ ] Tests passing
- [ ] Ready for production

---
**Reviewer:** /review command
**Date:** [Today's date]
**Reviewed files:** [List]
```

### Step 7: Provide Actionable Feedback

For each issue, offer:
1. **Specific location** (file, line if possible)
2. **Why it matters** (security, maintainability, user experience)
3. **Exact fix or example** (code snippet showing the correction)
4. **Follow-up question** (if clarification needed)

---

## Common Issues & Fixes

### TypeScript: `any` Type

**Issue:** Function parameter not typed.
```typescript
// BAD
function handleResponse(data: any) { ... }

// GOOD
interface ApiResponse {
  success: boolean;
  data: ReceiptData;
  error?: { code: string; message_tl: string };
}
function handleResponse(data: ApiResponse) { ... }
```

### RLS: Missing Policy

**Issue:** Table has no RLS policy.
```sql
-- BAD
CREATE TABLE receipts (id UUID, user_id UUID);
-- No policies!

-- GOOD
CREATE TABLE receipts (id UUID, user_id UUID);
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own receipts"
  ON receipts FOR SELECT USING (auth.uid() = user_id);
```

### API Route: Unvalidated Input

**Issue:** Request body not parsed via Zod.
```typescript
// BAD
export async function POST(req: Request) {
  const { amount, date } = await req.json();
  // No validation!
}

// GOOD
const TransactionSchema = z.object({
  amount_centavos: z.number().int().positive(),
  date: z.string().datetime(),
});

export async function POST(req: Request) {
  const body = TransactionSchema.parse(await req.json());
  // Safe to use body.amount_centavos, body.date
}
```

### Taglish: Corporate Tone

**Issue:** User-facing message too formal.
```typescript
// BAD
const message = "The operation has been completed successfully.";

// GOOD
const message = "Done! Saved na ang receipt mo.";
```

### TanStack Query: Unstable Cache Key

**Issue:** Cache key changes on every render.
```typescript
// BAD
const { data } = useQuery({
  queryKey: ['receipts', userId, Date.now()],  // Always new!
});

// GOOD
const { data } = useQuery({
  queryKey: ['receipts', userId],  // Stable, changes only when userId changes
});
```

---

## Review Checklist

Before declaring a review complete, verify:

### Code Quality
- [ ] No TypeScript `any` types
- [ ] All functions typed (params, return)
- [ ] Naming conventions followed (PascalCase components, camelCase functions)
- [ ] No commented-out code
- [ ] Error handling on all async operations
- [ ] Loading/empty/error states implemented
- [ ] TanStack Query patterns correct (cache keys, stale time)
- [ ] Taglish tone appropriate and consistent

### Security
- [ ] RLS policies on all tables
- [ ] Zod validation on all API inputs
- [ ] No secrets in client code (NEXT_PUBLIC_)
- [ ] No unvalidated user input to Claude API
- [ ] Auth checks on all API routes
- [ ] No XSS risks (no dangerouslySetInnerHTML)
- [ ] Data classification respected (PII/financial not logged)

### Readiness
- [ ] All CRITICAL issues resolved
- [ ] IMPORTANT issues addressed or deferred with justification
- [ ] Tests passing (npm run test)
- [ ] No merge conflicts with main branch
- [ ] Appropriate git commit messages

---

## When to Ask for Changes

- **CRITICAL issues present:** Request changes (no merge until fixed)
- **IMPORTANT issues:** Request changes if they block feature usability or introduce debt
- **Only suggestions:** Approve with comments (let developer decide to fix or defer)

---

## Handing Off

After review is complete:
- If **APPROVE:** Feature ready for merge to main. Notify the developer.
- If **REQUEST CHANGES:** List blocking issues and ask for follow-up review.
- If **COMMENT ONLY:** Approve but document non-blocking suggestions for future cleanup.
