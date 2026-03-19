/**
 * Claude Model Router — Task-to-Model Selection
 * Feature: AI Integration (cost optimization)
 * Role: Routes tasks to the cheapest model that produces acceptable quality
 *
 * Responsibility: Given a task type and user tier, select Haiku or Sonnet.
 * Business rule: Free tier = Haiku only, no exceptions. This is non-negotiable
 * to keep free tier operational costs near zero. Pro/Business = smart routing.
 *
 * Model selection is a cost optimization decision, not a quality preference.
 * Haiku is 10–20x cheaper than Sonnet. Use it for structured extraction and
 * classification. Use Sonnet for reasoning, generation, and nuanced tasks.
 *
 * Dependencies: Model price list (kept in sync with Anthropic API docs)
 * Tested by: QA — tier routing, task mapping, cost impact
 */

// ============================================================
// Model Identifiers & Pricing Reference
// ============================================================
export const MODELS = {
  HAIKU: 'claude-haiku-4-5-20251001',
  SONNET: 'claude-sonnet-4-6',
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

/**
 * Task types that determine model selection.
 *
 * Haiku tasks: Structured extraction (OCR, classification, intent detection, factual lookup)
 * Sonnet tasks: Reasoning, generation, multi-turn conversation, synthesis
 */
export type TaskType =
  | 'receipt_ocr' // Haiku — parse receipt image to JSON
  | 'classification' // Haiku — categorize transaction, detect intent
  | 'quick_qa' // Haiku — simple factual answers (e.g., BIR deadline dates)
  | 'ka_reasoning' // Sonnet — KA persona conversation with advice/analysis
  | 'morning_briefing' // Sonnet — synthesize data into warm narrative
  | 'reply_draft' // Sonnet — compose context-aware customer reply
  | 'financial_analysis' // Sonnet — interpret trends, recommend actions
  | 'costing_analysis'; // Sonnet — recipe/product costing with reasoning

/**
 * Pricing reference (March 2026 — update if Anthropic changes rates).
 * Used for cost estimation and budget planning.
 */
export const PRICING = {
  [MODELS.HAIKU]: {
    inputPer1M: 100, // $1.00 per 1M input tokens
    outputPer1M: 500, // $5.00 per 1M output tokens
  },
  [MODELS.SONNET]: {
    inputPer1M: 300, // $3.00 per 1M input tokens
    outputPer1M: 1500, // $15.00 per 1M output tokens
  },
} as const;

// PHP to USD conversion (update periodically as exchange rates change)
const PHP_PER_USD = 56;

/**
 * Select the appropriate Claude model for a task, based on task type and user tier.
 *
 * Tier business rules:
 * - Free tier: ALWAYS Haiku. Free users get limited AI features, and we keep costs low.
 * - Pro/Business: Route by task complexity.
 *
 * Haiku is the "workhorse" model — use it unless reasoning is required.
 * Sonnet is the "thinker" model — use for multi-step reasoning and generation.
 *
 * @param taskType - Type of task (determines model suitability)
 * @param userTier - User's subscription tier (determines cost budget)
 * @returns ModelId to use for this call
 */
export function selectModel(
  taskType: TaskType,
  userTier: 'free' | 'pro' | 'business'
): ModelId {
  // --- Tier 1: Free Tier — No Exceptions ---
  // Free tier gets Haiku only. This is a hard business rule.
  if (userTier === 'free') {
    return MODELS.HAIKU;
  }

  // --- Tier 2: Pro/Business — Smart Routing ---
  // Haiku for structured extraction, Sonnet for reasoning
  const haikuTasks: TaskType[] = ['receipt_ocr', 'classification', 'quick_qa'];

  if (haikuTasks.includes(taskType)) {
    return MODELS.HAIKU;
  }

  // All other tasks (reasoning, generation, synthesis) → Sonnet
  return MODELS.SONNET;
}

/**
 * Calculate the cost of a Claude API call in Philippine centavos.
 *
 * Formula: (inputTokens / 1M) * inputPricing + (outputTokens / 1M) * outputPricing
 * Result: USD cost * PHP_PER_USD * 100 (convert to centavos)
 * Rounded up to nearest centavo (Math.ceil) for conservative accounting.
 *
 * @param model - Model ID (Haiku or Sonnet)
 * @param inputTokens - Number of input tokens consumed
 * @param outputTokens - Number of output tokens consumed
 * @returns Cost in Philippine centavos
 */
export function calculateCost(
  model: ModelId,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = PRICING[model];

  // --- Cost Calculation: (tokens / 1M) * pricePerM ---
  const inputCostUsd = (inputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCostUsd = (outputTokens / 1_000_000) * pricing.outputPer1M;
  const totalUsd = inputCostUsd + outputCostUsd;

  // --- Convert to PHP Centavos: USD * PHP_PER_USD * 100 ---
  // Rounded up (Math.ceil) for conservative accounting
  return Math.ceil(totalUsd * PHP_PER_USD * 100);
}

/**
 * Estimate token count for text input (rough approximation).
 *
 * Anthropic doesn't publish a free tokenizer, so we use a conservative estimate:
 * - English text: ~4 characters per token
 * - Filipino/Taglish: ~3.5 characters per token (longer words)
 * - Use 3.5 as the default estimate
 *
 * Useful for previewing costs before calling Claude API.
 *
 * @param text - Text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  // Conservative estimate: 3.5 characters per token for Taglish
  return Math.ceil(text.length / 3.5);
}

/**
 * Estimate token count for image input (Claude Vision).
 *
 * Claude Vision charges based on image size. Rough approximation:
 * Images are divided into 512x512 tiles. Each tile costs ~750 tokens.
 * Useful for receipt OCR preview costs.
 *
 * @param widthPx - Image width in pixels
 * @param heightPx - Image height in pixels
 * @returns Estimated token count for the image
 */
export function estimateImageTokens(widthPx: number, heightPx: number): number {
  // Tiles: ceil(width / 512) * ceil(height / 512)
  const tilesHorizontal = Math.ceil(widthPx / 512);
  const tilesVertical = Math.ceil(heightPx / 512);
  const tiles = tilesHorizontal * tilesVertical;

  // ~750 tokens per tile
  return tiles * 750;
}
