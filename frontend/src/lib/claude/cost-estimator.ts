// AKBai Build 0 — Pre-call cost estimator for circuit breaker
// Anthropic pricing as of early 2026

import type { ClaudeModelId } from './types';

/** Pricing per million tokens (USD). */
const PRICING: Record<ClaudeModelId, { input: number; output: number }> = {
  'claude-haiku-4-5-20251001': { input: 0.80, output: 4.00 },
  'claude-sonnet-4-6': { input: 3.00, output: 15.00 },
};

/**
 * Estimate the USD cost of a Claude API call before making it.
 * Uses conservative estimates — intentionally overestimates for safety.
 *
 * @param model - The Claude model to use
 * @param inputTokens - Estimated input tokens (system prompt + history + message)
 * @param maxOutputTokens - Max tokens in the response
 * @returns Estimated cost in USD
 */
export function estimateCost(
  model: ClaudeModelId,
  inputTokens: number,
  maxOutputTokens: number
): number {
  const price = PRICING[model];
  const inputCost = (inputTokens / 1_000_000) * price.input;
  const outputCost = (maxOutputTokens / 1_000_000) * price.output;
  return inputCost + outputCost;
}

/**
 * Calculate actual cost from Claude response usage data.
 *
 * @param model - The Claude model used
 * @param inputTokens - Actual input tokens from response.usage
 * @param outputTokens - Actual output tokens from response.usage
 * @returns Actual cost in USD
 */
export function calculateActualCost(
  model: ClaudeModelId,
  inputTokens: number,
  outputTokens: number
): number {
  const price = PRICING[model];
  const inputCost = (inputTokens / 1_000_000) * price.input;
  const outputCost = (outputTokens / 1_000_000) * price.output;
  return inputCost + outputCost;
}
