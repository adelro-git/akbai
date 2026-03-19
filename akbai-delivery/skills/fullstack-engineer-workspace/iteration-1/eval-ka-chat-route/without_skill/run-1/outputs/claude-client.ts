// lib/claude/client.ts
// Anthropic SDK wrapper for AKBai
//
// Centralizes:
// - Model selection (Haiku vs Sonnet)
// - Circuit breaker checks (daily spend cap)
// - Retry logic (exponential backoff)
// - Cost calculation & tracking
// - Error handling

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { checkCircuitBreaker, recordSpend } from './circuit-breaker';
import { retryWithBackoff } from './retry';

/**
 * Supported Claude models
 * Updated as Anthropic releases new models
 * As of March 2026: Haiku 4.5, Sonnet 4.6
 */
export const MODELS = {
  HAIKU: 'claude-haiku-4-5-20251001',
  SONNET: 'claude-sonnet-4-6',
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

/**
 * Options for calling Claude
 */
export interface ClaudeRequestOptions {
  model: ModelId;
  system: string;
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
  temperature?: number;
  userId: string; // For spend tracking and circuit breaker
}

/**
 * Response from Claude API call
 * Includes token counts and cost for monitoring
 */
export interface ClaudeResponse {
  content: string; // The actual response text
  inputTokens: number;
  outputTokens: number;
  model: string;
  costCentavos: number; // Cost in Philippine centavos
}

/**
 * Error thrown when circuit breaker opens
 */
export class ClaudeCircuitOpenError extends Error {
  name = 'ClaudeCircuitOpenError';

  constructor(
    message: string,
    public spentToday: number,
    public dailyCap: number
  ) {
    super(message);
  }
}

/**
 * Initialize Anthropic SDK
 * Reads ANTHROPIC_API_KEY from environment
 */
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Call Claude API with all safeguards:
 * 1. Circuit breaker check
 * 2. Retry logic
 * 3. Cost calculation
 * 4. Spend tracking
 *
 * @throws ClaudeCircuitOpenError if daily cap exceeded
 * @throws Error if all retries fail (rate limit, network, auth, etc.)
 */
export async function callClaude(options: ClaudeRequestOptions): Promise<ClaudeResponse> {
  const { model, system, messages, maxTokens = 1024, temperature = 0, userId } = options;

  // 1. Check circuit breaker before making any call
  const circuitStatus = await checkCircuitBreaker(userId);
  if (!circuitStatus.allowed) {
    throw new ClaudeCircuitOpenError(
      `Daily spend cap reached: ₱${(circuitStatus.spentToday / 100).toFixed(2)} of ₱${(circuitStatus.dailyCap / 100).toFixed(2)}`,
      circuitStatus.spentToday,
      circuitStatus.dailyCap
    );
  }

  // 2. Make the API call with retry logic
  const response = await retryWithBackoff(
    () =>
      anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system,
        messages,
      }),
    { maxRetries: 3 }
  );

  // 3. Calculate cost and extract content
  const costCentavos = calculateCost(model, response.usage.input_tokens, response.usage.output_tokens);
  const textBlock = response.content.find((block) => block.type === 'text');
  const content = textBlock && 'text' in textBlock ? textBlock.text : '';

  // 4. Record spend in database for circuit breaker and analytics
  await recordSpend(userId, costCentavos, model);

  return {
    content,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    model: response.model,
    costCentavos,
  };
}

/**
 * Calculate cost in Philippine centavos
 *
 * Pricing (as of March 2026):
 * Haiku:
 *   Input:  $1.00 per 1M tokens
 *   Output: $5.00 per 1M tokens
 *
 * Sonnet:
 *   Input:  $3.00 per 1M tokens
 *   Output: $15.00 per 1M tokens
 *
 * Exchange rate: ~56 PHP per USD (update periodically)
 * Output is in centavos for database storage (easy integer arithmetic)
 *
 * Example:
 * - Haiku: 1000 input + 200 output = (1/1M * $1 + 200/1M * $5) * 56 * 100 = 63 centavos = ₱0.63
 * - Sonnet: 2000 input + 400 output = (2/1M * $3 + 400/1M * $15) * 56 * 100 = 303 centavos = ₱3.03
 */
function calculateCost(model: ModelId, inputTokens: number, outputTokens: number): number {
  // Pricing in USD per 1M tokens
  const pricing: Record<ModelId, { input: number; output: number }> = {
    [MODELS.HAIKU]: {
      input: 1.0,
      output: 5.0,
    },
    [MODELS.SONNET]: {
      input: 3.0,
      output: 15.0,
    },
  };

  const modelPricing = pricing[model];
  const phpPerUsd = 56; // Approximate, update if exchange rate changes significantly

  const usdCost =
    (inputTokens / 1_000_000) * modelPricing.input + (outputTokens / 1_000_000) * modelPricing.output;

  // Convert to Philippine centavos (₱1 = 100 centavos)
  const centavos = Math.ceil(usdCost * phpPerUsd * 100);

  return centavos;
}

/**
 * Cost reference for documentation
 * (same as calculateCost, but documented for reference)
 */
export const COST_REFERENCE = {
  [MODELS.HAIKU]: {
    inputUsdPer1M: 1.0,
    outputUsdPer1M: 5.0,
    estimatedCostPerReceipt: 63, // centavos (~₱0.16 at typical receipt size)
  },
  [MODELS.SONNET]: {
    inputUsdPer1M: 3.0,
    outputUsdPer1M: 15.0,
    estimatedCostPerChat: 303, // centavos (~₱3 for typical chat)
  },
} as const;
