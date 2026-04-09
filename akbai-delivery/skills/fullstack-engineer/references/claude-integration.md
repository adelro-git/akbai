# AKBai — Claude API Integration Patterns
> Reference for fullstack-engineer skill. API wrapper, Zod structured output, Haiku/Sonnet routing, circuit breaker, retry logic.
> Last updated: 2026-03-24 | Stack: Anthropic SDK (@anthropic-ai/sdk), Zod, Next.js 16 API routes

---

## Table of Contents

1. [Claude API Wrapper](#claude-api-wrapper)
2. [Haiku vs Sonnet Routing](#haiku-vs-sonnet-routing)
3. [Zod Structured Output](#zod-structured-output)
4. [Circuit Breaker (Daily Spend Cap)](#circuit-breaker)
5. [Retry with Exponential Backoff](#retry-with-exponential-backoff)
6. [Prompt Templates](#prompt-templates)
7. [Token Estimation and Cost Tracking](#token-estimation-and-cost-tracking)

---

## Claude API Wrapper

All Claude API calls go through a single wrapper. This centralizes auth, model selection, circuit breaking, retries, and cost tracking. No component or API route should import `@anthropic-ai/sdk` directly — always go through this wrapper.

```typescript
// lib/claude/client.ts
import Anthropic from '@anthropic-ai/sdk';
import { checkCircuitBreaker, recordSpend } from './circuit-breaker';
import { retryWithBackoff } from './retry';
import { z } from 'zod';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// The two models AKBai uses
export const MODELS = {
  HAIKU: 'claude-haiku-4-5-20251001',
  SONNET: 'claude-sonnet-4-6',
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

interface ClaudeRequestOptions {
  model: ModelId;
  system: string;
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
  temperature?: number;
  userId: string; // For spend tracking and circuit breaker
}

interface ClaudeResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  costCentavos: number; // Cost in Philippine centavos for tracking
}

export async function callClaude(options: ClaudeRequestOptions): Promise<ClaudeResponse> {
  const { model, system, messages, maxTokens = 1024, temperature = 0, userId } = options;

  // Check circuit breaker before making the call
  const circuitStatus = await checkCircuitBreaker(userId);
  if (!circuitStatus.allowed) {
    throw new ClaudeCircuitOpenError(
      `Daily spend cap reached: ₱${(circuitStatus.spentToday / 100).toFixed(2)} of ₱${(circuitStatus.dailyCap / 100).toFixed(2)}`,
      circuitStatus.spentToday,
      circuitStatus.dailyCap
    );
  }

  // Make the API call with retry logic
  const response = await retryWithBackoff(
    () =>
      anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system,
        messages,
      }),
    { maxRetries: 3, userId }
  );

  // Calculate cost and record spend
  const costCentavos = calculateCost(model, response.usage.input_tokens, response.usage.output_tokens);
  await recordSpend(userId, costCentavos, model);

  // Extract text content
  const textBlock = response.content.find((block) => block.type === 'text');
  const content = textBlock?.text ?? '';

  return {
    content,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    model: response.model,
    costCentavos,
  };
}

// Custom error for circuit breaker
export class ClaudeCircuitOpenError extends Error {
  constructor(
    message: string,
    public spentToday: number,
    public dailyCap: number
  ) {
    super(message);
    this.name = 'ClaudeCircuitOpenError';
  }
}
```

---

## Haiku vs Sonnet Routing

The choice of model is a business decision, not a developer preference. Haiku is 10–20x cheaper than Sonnet. Use the cheapest model that produces acceptable quality for the task.

```typescript
// lib/claude/model-router.ts
import { MODELS, type ModelId } from './client';

type TaskType =
  | 'receipt_ocr'        // Haiku Vision — structured extraction
  | 'classification'     // Haiku — categorize transaction, detect intent
  | 'quick_qa'           // Haiku — simple factual answers
  | 'ka_reasoning'       // Sonnet — KA persona conversation, advice
  | 'morning_briefing'   // Sonnet — synthesize data into narrative
  | 'reply_draft'        // Sonnet — compose customer reply in context
  | 'financial_analysis' // Sonnet — interpret trends, recommend actions
  | 'costing_analysis';  // Sonnet — recipe/product costing with reasoning

export function selectModel(taskType: TaskType, userTier: 'free' | 'pro' | 'business'): ModelId {
  // Free tier: Haiku only, no exceptions. This is a business rule.
  if (userTier === 'free') {
    return MODELS.HAIKU;
  }

  // Pro/Business: route by task complexity
  const haikuTasks: TaskType[] = ['receipt_ocr', 'classification', 'quick_qa'];
  if (haikuTasks.includes(taskType)) {
    return MODELS.HAIKU;
  }

  return MODELS.SONNET;
}
```

### When to Route to Each Model

**Haiku (cheap, fast — use for structured extraction and classification):**
- Receipt OCR: image → structured JSON (vendor, amount, date, items, tax)
- Transaction classification: description → category
- Intent detection: user message → intent enum
- Simple factual Q&A: "Kailan ang deadline ng 1701Q?" → date lookup
- Any task where the output is a fixed schema with no creative reasoning

**Sonnet (expensive, smart — use for reasoning and generation):**
- KA persona conversation: multi-turn chat with conversational Filipino tone, business advice
- Morning Briefing: synthesize 5+ data points into a warm narrative
- Reply Drafter: compose a context-aware customer reply
- Financial analysis: interpret cash flow trends, flag anomalies
- Costing analysis: calculate margins, suggest pricing, explain trade-offs
- Any task requiring nuanced reasoning, conversational Filipino generation, or multi-step logic

### Cost Reference

Keep these approximate costs in mind when designing features. AKBai stores costs in centavos.

```typescript
// lib/claude/cost.ts
// Prices as of March 2026 — update if Anthropic changes pricing
const PRICING = {
  [MODELS.HAIKU]: {
    inputPer1M: 100,    // $1.00 per 1M input tokens
    outputPer1M: 500,   // $5.00 per 1M output tokens
  },
  [MODELS.SONNET]: {
    inputPer1M: 300,    // $3.00 per 1M input tokens
    outputPer1M: 1500,  // $15.00 per 1M output tokens
  },
} as const;

const PHP_PER_USD = 56; // Approximate — update periodically

export function calculateCost(model: ModelId, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING[model];
  const usdCost =
    (inputTokens / 1_000_000) * pricing.inputPer1M +
    (outputTokens / 1_000_000) * pricing.outputPer1M;
  // Return cost in Philippine centavos
  return Math.ceil(usdCost * PHP_PER_USD * 100);
}
```

---

## Zod Structured Output

Every Claude response that feeds into application logic (not free-text chat) must be validated with Zod. This prevents Claude hallucinations from corrupting data and gives you type safety downstream.

### The Pattern

1. Define a Zod schema for the expected output
2. Include the schema description in the system prompt so Claude knows the format
3. Parse Claude's response with the schema
4. Handle parse failures gracefully (retry or degrade)

```typescript
// lib/claude/schemas/receipt-output.ts
import { z } from 'zod';

export const ReceiptOutputSchema = z.object({
  vendor_name: z.string().describe('Store or vendor name as shown on receipt'),
  date: z.string().date().describe('Transaction date in YYYY-MM-DD format'),
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().positive().optional(),
      unit_price_centavos: z.number().int().nonneg(),
      total_centavos: z.number().int().nonneg(),
    })
  ).describe('Line items on the receipt'),
  subtotal_centavos: z.number().int().nonneg(),
  tax_centavos: z.number().int().nonneg().optional(),
  total_centavos: z.number().int().nonneg(),
  payment_method: z.enum(['cash', 'gcash', 'card', 'bank_transfer', 'unknown']).optional(),
  confidence: z.number().min(0).max(1).describe('OCR confidence score 0-1'),
});

export type ReceiptOutput = z.infer<typeof ReceiptOutputSchema>;
```

### Calling Claude with Structured Output

```typescript
// lib/claude/tasks/scan-receipt.ts
import { callClaude, MODELS, ClaudeCircuitOpenError } from '../client';
import { ReceiptOutputSchema, type ReceiptOutput } from '../schemas/receipt-output';

export async function scanReceipt(
  imageBase64: string,
  userId: string
): Promise<{ success: true; data: ReceiptOutput } | { success: false; error: string }> {
  try {
    const response = await callClaude({
      model: MODELS.HAIKU,
      userId,
      system: `You are a receipt OCR system for a Filipino MSME business app.
Extract structured data from the receipt image. All monetary amounts must be in Philippine centavos (₱34.50 = 3450).
Respond with ONLY a JSON object matching this schema — no markdown, no explanation:
${JSON.stringify(ReceiptOutputSchema.shape, null, 2)}
If you cannot read a field, omit the optional fields or use "unknown".
Set confidence to a value between 0 and 1 reflecting how well you could read the receipt.`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: 'Extract the receipt data as JSON.',
            },
          ],
        },
      ],
      maxTokens: 1024,
      temperature: 0,
    });

    // Parse and validate
    const parsed = JSON.parse(response.content);
    const validated = ReceiptOutputSchema.parse(parsed);

    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ClaudeCircuitOpenError) {
      return { success: false, error: 'AI_CIRCUIT_OPEN' };
    }
    if (error instanceof z.ZodError) {
      // Claude returned something that doesn't match the schema
      console.error('Claude output failed Zod validation:', error.issues);
      return { success: false, error: 'AI_PARSE_ERROR' };
    }
    if (error instanceof SyntaxError) {
      // Claude returned non-JSON text
      console.error('Claude output was not valid JSON');
      return { success: false, error: 'AI_PARSE_ERROR' };
    }
    throw error;
  }
}
```

### Structured Output Principles

- Always set `temperature: 0` for structured extraction. Non-zero temperature introduces randomness that breaks schemas.
- Include the schema shape in the system prompt. Claude follows format instructions better when it can see the structure.
- Parse JSON yourself rather than relying on Claude's response being perfect. Wrap `JSON.parse()` in try/catch.
- Validate with Zod after parsing. A valid JSON object can still have wrong types or missing fields.
- Handle `ZodError` and `SyntaxError` separately — they need different error codes (`AI_PARSE_ERROR` for both, but the logs differ).
- For receipt OCR specifically, the `confidence` field lets the UI decide whether to show a "Please review" prompt. Below 0.7, always ask the user to verify.

---

## Circuit Breaker

The circuit breaker prevents AKBai from spending more than a daily cap on Claude API calls. This is a financial safety net. If the circuit opens, the app degrades gracefully — no AI features, but everything else works.

```typescript
// lib/claude/circuit-breaker.ts
import { createAdminClient } from '@/lib/supabase/admin';

// Daily cap in Philippine centavos
// ₱500/day during Phase 1 beta — adjust based on actual usage
const DAILY_CAP_CENTAVOS = 50000; // ₱500.00

interface CircuitStatus {
  allowed: boolean;
  spentToday: number;   // centavos
  dailyCap: number;     // centavos
  remainingBudget: number;
}

export async function checkCircuitBreaker(userId: string): Promise<CircuitStatus> {
  const supabase = createAdminClient();

  // Get today's total spend (Asia/Manila timezone for day boundary)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

  const { data, error } = await supabase
    .from('ai_spend_log')
    .select('cost_centavos')
    .gte('created_at', `${today}T00:00:00+08:00`)
    .lt('created_at', `${today}T23:59:59+08:00`);

  if (error) {
    // If we can't check spend, fail closed (deny the request)
    console.error('Circuit breaker check failed:', error);
    return { allowed: false, spentToday: 0, dailyCap: DAILY_CAP_CENTAVOS, remainingBudget: 0 };
  }

  const spentToday = data?.reduce((sum, row) => sum + row.cost_centavos, 0) ?? 0;
  const remainingBudget = DAILY_CAP_CENTAVOS - spentToday;

  return {
    allowed: spentToday < DAILY_CAP_CENTAVOS,
    spentToday,
    dailyCap: DAILY_CAP_CENTAVOS,
    remainingBudget: Math.max(0, remainingBudget),
  };
}

export async function recordSpend(
  userId: string,
  costCentavos: number,
  model: string
): Promise<void> {
  const supabase = createAdminClient();

  await supabase.from('ai_spend_log').insert({
    user_id: userId,
    cost_centavos: costCentavos,
    model,
    created_at: new Date().toISOString(),
  });
}
```

### Circuit Breaker Behavior

When the circuit opens:
- API routes that depend on Claude return `{ success: false, error: { code: 'AI_CIRCUIT_OPEN' } }`
- The UI shows a warm conversational Filipino message: "Nag-rest muna si KA para bukas — marami nang na-process ngayon. Tuloy lang ang ibang features mo!"
- All non-AI features continue to work normally (manual expense entry, deadline list, invoice viewing)
- The circuit resets at midnight Asia/Manila

### ai_spend_log Table

```sql
CREATE TABLE IF NOT EXISTS ai_spend_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  cost_centavos INTEGER NOT NULL,
  model TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast daily aggregation
CREATE INDEX idx_ai_spend_log_daily
  ON ai_spend_log(created_at);

-- This is an admin-only table — no user RLS needed
-- Only the service role client writes to it (from the Claude wrapper)
ALTER TABLE ai_spend_log ENABLE ROW LEVEL SECURITY;
-- No user-facing policies — accessed only via admin client
```

---

## Retry with Exponential Backoff

Claude API calls can fail transiently (rate limits, network issues, server errors). AKBai retries up to 3 times with exponential backoff.

```typescript
// lib/claude/retry.ts

interface RetryOptions {
  maxRetries: number;
  userId: string;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 529];

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 30000 } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on non-retryable errors
      const statusCode = error?.status ?? error?.statusCode;
      if (statusCode && !RETRYABLE_STATUS_CODES.includes(statusCode)) {
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelayMs
      );

      console.warn(
        `Claude API attempt ${attempt + 1}/${maxRetries + 1} failed (status: ${statusCode}). ` +
        `Retrying in ${Math.round(delay)}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error('Claude API call failed after all retries');
}
```

### Retry Rules

- 3 retries maximum (4 total attempts). More than that suggests a systemic issue, not a transient failure.
- Only retry on retryable status codes: 429 (rate limit), 500/502/503 (server errors), 529 (overloaded).
- Don't retry on 400 (bad request) or 401 (auth error) — those indicate a code bug, not a transient issue.
- Exponential backoff: 1s, 2s, 4s (approximately, with jitter). The jitter prevents thundering herd if multiple users hit the same error.
- The max delay cap (30s) prevents absurd wait times if the backoff calculation overflows.
- For 429 errors, Anthropic includes a `Retry-After` header. A more sophisticated version could respect that header, but the exponential backoff is a reasonable default.

---

## Prompt Templates

System prompts live in `/lib/claude/prompts/`. Each prompt template is a function that takes user context and returns the system prompt string. This keeps prompts version-controlled and testable.

### KA Persona (Core Identity)

```typescript
// lib/claude/prompts/ka-persona.ts

interface KaContext {
  userName: string;
  businessName: string;
  businessType: string;  // e.g., "bakery", "sari-sari store", "online shop"
  tier: 'free' | 'pro' | 'business';
  todayDate: string;     // ISO 8601 date in Asia/Manila
}

export function kaPersonaPrompt(ctx: KaContext): string {
  return `You are KA (short for AKBai), an AI business partner for Filipino MSMEs.

## Your identity
- You are the user's smart ate/kuya who always has their back
- Your name is KA — pronounce it like the Filipino word "ka" (companion)
- You speak natural conversational Filipino — a mix of Filipino and English, the way business owners text their barkada
- More Filipino when personal or emotional, more English when technical
- Always address the user by first name: "${ctx.userName}"

## Your user
- Name: ${ctx.userName}
- Business: ${ctx.businessName} (${ctx.businessType})
- Subscription: ${ctx.tier} tier
- Today's date: ${ctx.todayDate} (Asia/Manila timezone)

## Voice rules
- ALWAYS show data and cite numbers: "Based sa records mo..."
- NEVER guess — if unsure, say so and ask
- NEVER use stiff corporate English
- Currency: always ₱ with digits (₱3,450.00), never "PHP" or "Php"
- Amounts in conversation: use peso format, not centavos
- Be warm but competent — earn trust by showing your work
- Be proactively caring — flag upcoming deadlines, unusual spending, milestones
- Keep responses concise — users are busy, on mobile, often multitasking

## What you must never do
- Never make up financial data
- Never file taxes or sign documents on behalf of the user
- Never provide specific tax advice (you can explain BIR rules and deadlines)
- Never share data between users
- Never bypass the human-in-the-loop for financial confirmations`;
}
```

### Receipt OCR Prompt

```typescript
// lib/claude/prompts/resibo-ocr.ts

export function resiboOcrPrompt(): string {
  return `You are a receipt OCR system for AKBai, a Filipino MSME business app.

## Task
Extract structured data from the receipt image. Parse every line item, total, tax, vendor name, and date.

## Rules
- All monetary amounts MUST be in Philippine centavos (₱34.50 = 3450)
- Dates MUST be in YYYY-MM-DD format
- If you cannot read a field clearly, omit optional fields or use "unknown"
- Set confidence between 0 and 1 reflecting overall readability
- Parse Filipino/Taglish text on receipts (e.g., "Bayad:" = Payment, "Sukli:" = Change)
- Respond with ONLY a valid JSON object — no markdown fences, no explanation, no preamble`;
}
```

---

## Token Estimation and Cost Tracking

For features that need to show the user an estimated cost before calling Claude (e.g., the receipt scanner), use a rough token estimator.

```typescript
// lib/claude/token-estimate.ts

// Rough estimator — not exact, but good enough for cost previews.
// Anthropic doesn't publish a free tokenizer, so we approximate.
export function estimateTokens(text: string): number {
  // English: ~4 characters per token
  // Filipino/Taglish: slightly more (~3.5 due to longer words)
  // Use 3.5 as a conservative estimate
  return Math.ceil(text.length / 3.5);
}

// For images: Claude Vision charges based on image size
// Roughly 1000–2000 tokens for a typical receipt photo
export function estimateImageTokens(widthPx: number, heightPx: number): number {
  // Approximate: ~750 tokens per 512x512 tile
  const tiles = Math.ceil(widthPx / 512) * Math.ceil(heightPx / 512);
  return tiles * 750;
}
```

### Using the API Route

Putting it all together in an API route:

```typescript
// app/api/resibo/scan/route.ts
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { scanReceipt } from '@/lib/claude/tasks/scan-receipt';
import { z } from 'zod';

const RequestSchema = z.object({
  storage_path: z.string().min(1),
});

export async function POST(req: Request) {
  // 1. Auth
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return apiError('AUTH_REQUIRED', 'Authentication required', undefined, 401);
  }

  // 2. Tier check — receipt scan is a metered feature
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier, scans_used, scans_limit')
    .eq('user_id', user.id)
    .single();

  if (subscription && subscription.scans_used >= subscription.scans_limit) {
    return apiError(
      'TIER_LIMIT_REACHED',
      'Scan limit reached',
      'Na-reach mo na ang scan limit mo ngayong buwan. Upgrade sa Pro para sa 50 scans/month.',
      403
    );
  }

  // 3. Validate request
  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Invalid request body', undefined, 400, {
      issues: parsed.error.issues,
    });
  }

  // 4. Fetch image from Supabase Storage
  const { data: imageData, error: storageError } = await supabase.storage
    .from('receipts')
    .download(parsed.data.storage_path);

  if (storageError || !imageData) {
    return apiError('NOT_FOUND', 'Receipt image not found', undefined, 404);
  }

  // 5. Convert to base64 and scan
  const buffer = Buffer.from(await imageData.arrayBuffer());
  const base64 = buffer.toString('base64');

  const result = await scanReceipt(base64, user.id);

  if (!result.success) {
    if (result.error === 'AI_CIRCUIT_OPEN') {
      return apiError(
        'AI_CIRCUIT_OPEN',
        'Daily AI budget reached',
        'Nag-rest muna si KA para bukas. Puwede mo i-manually encode ang receipt.',
        503
      );
    }
    return apiError('AI_PARSE_ERROR', 'Could not parse receipt', undefined, 422);
  }

  // 6. Increment scan counter
  await supabase.rpc('increment_scan_count', { p_user_id: user.id });

  return apiSuccess(result.data, 200);
}
```
