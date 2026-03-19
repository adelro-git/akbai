/**
 * /lib/claude/model-router.ts
 * Route tasks to appropriate Claude model based on complexity and tier
 *
 * Principle: Use the cheapest model that produces acceptable quality.
 * Haiku is 10–20x cheaper than Sonnet — use it for structured tasks.
 * Sonnet for reasoning, generation, and personality.
 */

import { MODELS, type ModelId } from './client';

type TaskType =
  | 'receipt_ocr' // Haiku Vision — structured extraction
  | 'classification' // Haiku — categorize transaction, detect intent
  | 'quick_qa' // Haiku — simple factual answers
  | 'ka_reasoning' // Sonnet — KA persona conversation, advice
  | 'morning_briefing' // Sonnet — synthesize data into narrative
  | 'reply_draft' // Sonnet — compose customer reply in context
  | 'financial_analysis' // Sonnet — interpret trends, recommend actions
  | 'costing_analysis'; // Sonnet — recipe/product costing with reasoning

/**
 * Select Claude model based on task type and user tier
 *
 * Business rule: Free tier gets Haiku only (cost control).
 * Pro/Business: Task determines model (Haiku for simple, Sonnet for complex).
 *
 * Cost reference (as of March 2026):
 * - Haiku: $0.80 input, $4.00 output per 1M tokens = ~₱46/1M input, ~₱228/1M output
 * - Sonnet: $3.00 input, $15.00 output per 1M tokens = ~₱171/1M input, ~₱858/1M output
 * - Sonnet is ~4-5x more expensive for input, 3.75x for output
 *
 * Philosophy:
 * - Receipt OCR (Haiku): ₱0.16/scan (structured extraction)
 * - Morning Briefing (Sonnet): ₱2-5/call (synthesis + personality)
 * - KA Chat (Sonnet): ₱1-3/message (reasoning + Taglish tone)
 *
 * For Pro/Business tiers, the revenue supports Sonnet costs:
 * - Pro ₱399/mo = 25-30 Sonnet calls per month budget
 * - Business ₱899/mo = 60-90 Sonnet calls per month budget
 * See Financial Model v5 for unit economics
 */
export function selectModel(taskType: TaskType, userTier: 'free' | 'pro' | 'business'): ModelId {
  // ============================================
  // FREE TIER: Haiku only, no exceptions
  // ============================================
  // Free tier exists to lower barrier to entry for users.
  // Haiku + text queries only. No receipt scanning, no morning briefing, no expensive tasks.
  if (userTier === 'free') {
    console.log(`Model selection: tier=free, task=${taskType} -> forcing Haiku (free tier rule)`);
    return MODELS.HAIKU;
  }

  // ============================================
  // PRO/BUSINESS TIER: Route by task complexity
  // ============================================

  // Fast, cheap, structured extraction — use Haiku
  const haikuTasks: TaskType[] = ['receipt_ocr', 'classification', 'quick_qa'];
  if (haikuTasks.includes(taskType)) {
    console.log(`Model selection: tier=${userTier}, task=${taskType} -> Haiku (structured task)`);
    return MODELS.HAIKU;
  }

  // Complex reasoning, generation, personality — use Sonnet
  const sonnetTasks: TaskType[] = [
    'ka_reasoning',
    'morning_briefing',
    'reply_draft',
    'financial_analysis',
    'costing_analysis',
  ];
  if (sonnetTasks.includes(taskType)) {
    console.log(
      `Model selection: tier=${userTier}, task=${taskType} -> Sonnet (reasoning/generation)`
    );
    return MODELS.SONNET;
  }

  // Fallback (shouldn't happen if TaskType is exhaustive)
  console.warn(`Model selection: unknown task type "${taskType}", defaulting to Sonnet`);
  return MODELS.SONNET;
}

/**
 * Task complexity classification (for reference)
 *
 * HAIKU TASKS (structured, low reasoning):
 * - receipt_ocr: Parse image → JSON (vendor, amount, date, items, tax)
 *   Example: "Extract the receipt data"
 *   Input tokens: ~1,500-2,000 (image)
 *   Output tokens: ~200-300 (structured JSON)
 *   Cost: ~₱0.16/scan
 *
 * - classification: Text → category
 *   Example: "Is this income or expense? Category?"
 *   Input: ~200 tokens
 *   Output: ~50 tokens
 *   Cost: ~₱0.01/call
 *
 * - quick_qa: Factual lookup
 *   Example: "Kailan ang 1701Q deadline this year?"
 *   Input: ~300 tokens
 *   Output: ~100 tokens
 *   Cost: ~₱0.02/call
 *
 * SONNET TASKS (reasoning, generation, personality):
 * - ka_reasoning: Multi-turn chat with business context
 *   Example: "Magkano na ang sales ko? May unusual patterns?"
 *   Input: ~2,000 tokens (profile + history + message)
 *   Output: ~300-500 tokens (warm, detailed response)
 *   Cost: ~₱1-2/message
 *
 * - morning_briefing: Synthesize 5+ data points into narrative
 *   Example: "Summarize yesterday's income, today's tasks, cash position"
 *   Input: ~2,500-3,000 tokens (multiple data sources)
 *   Output: ~400-600 tokens (warm narrative)
 *   Cost: ~₱2-3/briefing
 *
 * - reply_draft: Compose context-aware customer message
 *   Example: "Draft a reply to customer order inquiry in Taglish"
 *   Input: ~1,500 tokens (context + customer message)
 *   Output: ~200-300 tokens (reply)
 *   Cost: ~₱1-2/draft
 *
 * - financial_analysis: Interpret cash flow trends
 *   Example: "Why is my spending up this week? What should I do?"
 *   Input: ~2,000 tokens (transaction history + context)
 *   Output: ~300-500 tokens (analysis + suggestions)
 *   Cost: ~₱1-2/analysis
 *
 * - costing_analysis: Recipe costing, margin calculation
 *   Example: "Calculate margin if I sell ube cake at ₱200"
 *   Input: ~1,500 tokens (recipe + pricing)
 *   Output: ~200-300 tokens (calculation + explanation)
 *   Cost: ~₱1-2/analysis
 */

/**
 * Estimate cost of a Claude call (for reference, not production use)
 * Actual cost is calculated by callClaude() after the API returns usage info.
 *
 * This is for UI previews or logging estimates.
 */
export function estimateCost(
  model: ModelId,
  estimatedInputTokens: number,
  estimatedOutputTokens: number
): number {
  // Prices as of March 2026 (from /lib/claude/cost.ts)
  const PRICING = {
    [MODELS.HAIKU]: {
      inputPer1M: 100, // $1.00 per 1M
      outputPer1M: 500, // $5.00 per 1M
    },
    [MODELS.SONNET]: {
      inputPer1M: 300, // $3.00 per 1M
      outputPer1M: 1500, // $15.00 per 1M
    },
  } as const;

  const PHP_PER_USD = 56;

  const pricing = PRICING[model];
  const usdCost =
    (estimatedInputTokens / 1_000_000) * pricing.inputPer1M +
    (estimatedOutputTokens / 1_000_000) * pricing.outputPer1M;

  return Math.ceil(usdCost * PHP_PER_USD * 100); // Return in centavos
}
