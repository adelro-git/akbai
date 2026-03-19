// lib/claude/model-router.ts
// Tier-based and task-based model routing for Claude API calls
//
// Principle: Use the cheapest model that produces acceptable quality.
// Haiku is 10-20x cheaper than Sonnet. Free tier only gets Haiku (business rule).

import { MODELS, type ModelId } from './client';

/**
 * Task types supported by AKBai
 * Each task is routed to Haiku or Sonnet based on complexity
 */
export type TaskType =
  | 'receipt_ocr' // Haiku Vision — extract structured data from receipt image
  | 'classification' // Haiku — categorize transaction, classify intent
  | 'quick_qa' // Haiku — simple factual Q&A ("Kailan ang 1701Q deadline?")
  | 'ka_reasoning' // Sonnet — KA persona conversation, multi-turn advice
  | 'morning_briefing' // Sonnet — synthesize data into warm narrative
  | 'reply_draft' // Sonnet — compose customer DM reply in context
  | 'financial_analysis' // Sonnet — interpret trends, recommend actions
  | 'costing_analysis'; // Sonnet — recipe/product costing with reasoning

/**
 * Select Claude model based on:
 * 1. User tier (Free tier only gets Haiku — business rule)
 * 2. Task complexity (Haiku for simple extraction, Sonnet for reasoning)
 *
 * Returns ModelId: 'claude-haiku-4-5-20251001' or 'claude-sonnet-4-6'
 */
export function selectModel(taskType: TaskType, userTier: 'free' | 'pro' | 'business'): ModelId {
  // RULE: Free tier only uses Haiku. No exceptions.
  // This is a cost control & business rule, not a technical limitation.
  if (userTier === 'free') {
    return MODELS.HAIKU;
  }

  // Pro/Business: route by task complexity
  const haikuTasks: TaskType[] = ['receipt_ocr', 'classification', 'quick_qa'];

  if (haikuTasks.includes(taskType)) {
    return MODELS.HAIKU;
  }

  // All reasoning tasks (KA conversation, briefing, drafting, analysis) → Sonnet
  return MODELS.SONNET;
}

/**
 * Cost reference (in USD, as of March 2026)
 * Update if Anthropic changes pricing
 *
 * Haiku (cheap, fast):
 *   $1.00 per 1M input tokens
 *   $5.00 per 1M output tokens
 *
 * Sonnet (powerful, expensive):
 *   $3.00 per 1M input tokens
 *   $15.00 per 1M output tokens
 *
 * Example cost estimates:
 * - Receipt OCR (Haiku): 1,500 tokens in → 500 tokens out = ~$0.0025
 * - KA chat (Sonnet): 2,000 tokens in → 400 tokens out = ~$0.0075
 */
export const COST_REFERENCE = {
  [MODELS.HAIKU]: {
    usdPer1MInputTokens: 1.0,
    usdPer1MOutputTokens: 5.0,
  },
  [MODELS.SONNET]: {
    usdPer1MInputTokens: 3.0,
    usdPer1MOutputTokens: 15.0,
  },
} as const;

/**
 * Task categorization (for analytics and future optimization)
 *
 * Group 1: Structured extraction (Haiku ideal)
 *   - receipt_ocr: High success rate, low token cost, deterministic output
 *   - classification: Simple categorization, deterministic
 *   - quick_qa: Lookup queries, brief responses
 *
 * Group 2: Reasoning & generation (Sonnet required)
 *   - ka_reasoning: Multi-turn conversation, nuanced Taglish, advice
 *   - morning_briefing: Narrative synthesis, tone, business insight
 *   - reply_draft: Context-aware composition, customer empathy
 *   - financial_analysis: Trend interpretation, anomaly detection, recommendations
 *   - costing_analysis: Multi-step calculations, business logic reasoning
 */
export const TASK_GROUPS = {
  haiku_ideal: ['receipt_ocr', 'classification', 'quick_qa'] as const,
  sonnet_only: ['ka_reasoning', 'morning_briefing', 'reply_draft', 'financial_analysis', 'costing_analysis'] as const,
} as const;

/**
 * Estimate cost in Philippine centavos before making a Claude API call
 *
 * Used by:
 * - Receipt scanner UI: show "₱0.16" before user taps scan
 * - Daily spend tracking: check if cost would exceed circuit breaker
 * - Invoice PDF generation: estimate cost of batching invoice summaries
 *
 * Note: This is a rough estimate. Actual token count may vary.
 * Always check circuit breaker before committing to a call.
 */
export function estimateCostCentavos(
  taskType: TaskType,
  userTier: 'free' | 'pro' | 'business',
  estimatedInputTokens: number,
  estimatedOutputTokens: number
): number {
  const model = selectModel(taskType, userTier);
  const pricing = COST_REFERENCE[model];

  const usdCost =
    (estimatedInputTokens / 1_000_000) * pricing.usdPer1MInputTokens +
    (estimatedOutputTokens / 1_000_000) * pricing.usdPer1MOutputTokens;

  // Convert USD to PHP centavos
  // Exchange rate: ~56 PHP per USD (update periodically)
  const phpPerUsd = 56;
  const centavos = Math.ceil(usdCost * phpPerUsd * 100);

  return centavos;
}

/**
 * Document model selection logic (for reference)
 *
 * Haiku is used for:
 * ✓ Receipt OCR (structured data extraction from image)
 * ✓ Transaction categorization (expense → "marketing", "ingredients", etc.)
 * ✓ Intent detection (is user asking about profit? cash flow? deadline?)
 * ✓ Simple factual Q&A (BIR deadline lookups, rate explanations)
 * ✓ Any task where output is deterministic and schema-validated
 * → Total cost for Haiku: ~₱0.16 per receipt scan ($0.0028 × 57.2 exchange)
 *
 * Sonnet is used for:
 * ✓ KA persona conversation (multi-turn, Taglish tone, business advice)
 * ✓ Morning Briefing generation (synthesize 5+ data points into narrative)
 * ✓ Customer reply drafting (context-aware, empathetic composition)
 * ✓ Financial analysis (interpret trends, flag anomalies, recommend actions)
 * ✓ Costing & margin calculations (with reasoning, not just math)
 * ✓ Any task requiring nuanced reasoning or creative generation
 * → Cost: ~₱0.42-0.84 per KA chat turn (Sonnet)
 *
 * Why this split matters:
 * - Receipt OCR: 500 daily scans at Haiku = ~₱80/day. At Sonnet = ~₱500/day.
 * - KA chat: 100 free users × 1 query/day at Haiku = cost no issue. At Sonnet = ~₱84/day.
 * - Break-even: With receipt scanning as 80% of cost, Haiku routing saves ~₱400/day at scale.
 */
