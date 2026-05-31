// ============================================================
// OCR Pipeline: Receipt Parser (Sprint 4 — Gap E1 Spike)
// Feature: Resibo Scanner
// Version: 0.1.0 (spike)
// Last changed: 2026-03-24
//
// Purpose: Parse a receipt image into structured financial data using Claude Vision.
// Pipeline: Image validation → Haiku Vision → Zod validation → confidence check
//           → (optional Sonnet fallback) → ReceiptParseResult
// Guardrails: Image size (10MB), MIME type, circuit breaker, confidence-based retry
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import type { ClaudeModelId } from '@/lib/claude/types';
import { estimateCost, calculateActualCost } from '@/lib/claude/cost-estimator';
import { ClaudeReceiptExtractionSchema } from './schemas';
import { RECEIPT_OCR_PROMPT, RECEIPT_OCR_RETRY_SUFFIX } from './prompts';
import type {
  ReceiptParseResult,
  ReceiptField,
  ReceiptItemField,
  ReceiptFields,
  SupportedMimeType,
  ClaudeReceiptExtraction,
  OcrCallTokenUsage,
} from './types';
import { MAX_IMAGE_SIZE_BYTES, SUPPORTED_MIME_TYPES } from './types';

// --- Constants ---

const HAIKU_MODEL: ClaudeModelId = 'claude-haiku-4-5-20251001';
const SONNET_MODEL: ClaudeModelId = 'claude-sonnet-4-6';
const OCR_MAX_TOKENS = 1024;

/** Confidence threshold below which we retry with Sonnet. */
const LOW_CONFIDENCE_THRESHOLD = 0.6;

// --- JSON Extraction ---

/**
 * Extract JSON from Claude's text response.
 * Handles both raw JSON and markdown code block wrappers.
 */
export function extractJSON(text: string): unknown {
  // Try to find JSON in markdown code block first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1].trim());
  }
  // Fall back to finding raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error('No JSON found in Claude response');
}

// --- Confidence Mapping ---

/**
 * Map a numeric confidence score (0.0–1.0) to a categorical level.
 */
function confidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.8) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

// --- Transform Claude Output → ReceiptParseResult ---

/**
 * Transform Claude's raw extraction into the standardized ReceiptParseResult format.
 */
function transformExtraction(
  extraction: ClaudeReceiptExtraction,
  model: 'haiku' | 'sonnet',
  processingTimeMs: number,
  tokenUsage: { input: number; output: number }
): ReceiptParseResult {
  const merchantField: ReceiptField = {
    field: 'merchant',
    value: extraction.store_name,
    confidence: confidenceLevel(extraction.confidence.store_name),
    raw: extraction.store_name ?? '',
  };

  const dateField: ReceiptField = {
    field: 'date',
    value: extraction.date,
    confidence: confidenceLevel(extraction.confidence.date),
    raw: extraction.date ?? '',
  };

  const totalField: ReceiptField = {
    field: 'total',
    value: extraction.total_centavos,
    confidence: confidenceLevel(extraction.confidence.total),
    raw: `${extraction.total_centavos}`,
  };

  const fields: ReceiptFields = {
    merchant: merchantField,
    date: dateField,
    total: totalField,
  };

  // Optional fields
  if (extraction.subtotal_centavos !== null && extraction.subtotal_centavos !== undefined) {
    fields.subtotal = {
      field: 'subtotal',
      value: extraction.subtotal_centavos,
      confidence: confidenceLevel(extraction.confidence.total),
      raw: `${extraction.subtotal_centavos}`,
    };
  }

  if (extraction.tax_centavos !== null && extraction.tax_centavos !== undefined) {
    fields.vat = {
      field: 'vat',
      value: extraction.tax_centavos,
      confidence: confidenceLevel(extraction.confidence.total),
      raw: `${extraction.tax_centavos}`,
    };
  }

  if (extraction.tin !== null && extraction.tin !== undefined) {
    fields.tin = {
      field: 'tin',
      value: extraction.tin,
      confidence: confidenceLevel(extraction.confidence.store_name),
      raw: extraction.tin ?? '',
    };
  }

  if (extraction.receipt_number !== null && extraction.receipt_number !== undefined) {
    fields.receiptNumber = {
      field: 'receiptNumber',
      value: extraction.receipt_number,
      confidence: confidenceLevel(extraction.confidence.store_name),
      raw: extraction.receipt_number ?? '',
    };
  }

  if (extraction.items.length > 0) {
    fields.items = extraction.items.map(
      (item): ReceiptItemField => ({
        name: item.name,
        quantity: item.quantity ?? 1,
        unitPrice: item.unit_price_centavos ?? item.total_centavos,
        total: item.total_centavos,
      })
    );
  }

  return {
    success: true,
    fields,
    rawText: extraction.raw_text_excerpt,
    model,
    processingTimeMs,
    tokenUsage,
    errors: extraction.warnings.length > 0 ? extraction.warnings : undefined,
  };
}

// --- Image Validation ---

/**
 * Validate image buffer size and MIME type before sending to Claude.
 *
 * @throws Error if image fails validation
 */
export function validateImage(
  imageBuffer: Buffer,
  mimeType: string
): { valid: true; mimeType: SupportedMimeType } {
  if (imageBuffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(
      `Image too large: ${(imageBuffer.length / (1024 * 1024)).toFixed(1)}MB exceeds 10MB limit`
    );
  }

  if (imageBuffer.length === 0) {
    throw new Error('Image buffer is empty');
  }

  if (!SUPPORTED_MIME_TYPES.includes(mimeType as SupportedMimeType)) {
    throw new Error(
      `Unsupported image type: ${mimeType}. Supported: ${SUPPORTED_MIME_TYPES.join(', ')}`
    );
  }

  return { valid: true, mimeType: mimeType as SupportedMimeType };
}

// --- Claude Vision API Call ---

/**
 * Error thrown when a Claude Vision call SUCCEEDED at the API level (tokens were
 * spent) but its response failed to parse/validate (C3 + C2). Carries the token
 * usage so the caller can still bill the consumed call, and `cause` so the
 * retry-classifier (isRetryableParseError) can inspect the underlying
 * SyntaxError / ZodError / "No JSON found" Error.
 */
class VisionParseError extends Error {
  readonly tokenUsage: { input: number; output: number };
  readonly cause: unknown;
  constructor(cause: unknown, tokenUsage: { input: number; output: number }) {
    super(cause instanceof Error ? cause.message : 'OCR response parse failed');
    this.name = 'VisionParseError';
    this.cause = cause;
    this.tokenUsage = tokenUsage;
  }
}

/**
 * Call Claude Vision API with a receipt image and return the raw extraction.
 *
 * On a parse/validation failure AFTER the API call (tokens already spent), this
 * throws a {@link VisionParseError} carrying the token usage so the caller can
 * record the cost of the consumed call (C3).
 */
async function callClaudeVision(
  client: Anthropic,
  imageBase64: string,
  mimeType: SupportedMimeType,
  model: ClaudeModelId,
  prompt: string
): Promise<{
  extraction: ClaudeReceiptExtraction;
  tokenUsage: { input: number; output: number };
}> {
  // The API call itself — if THIS throws (auth/rate-limit/network), no tokens
  // were billed and the error propagates unwrapped (not retryable as a parse).
  const response = await client.messages.create({
    model,
    max_tokens: OCR_MAX_TOKENS,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  });

  // C7: guard against an empty content array. Indexing content[0] on an empty
  // array yields undefined → TypeError on `.type`. Fall back to '' so the
  // existing JSON-extraction path throws the normal "No JSON found" error.
  const firstBlock = Array.isArray(response.content) ? response.content[0] : undefined;
  const rawText =
    firstBlock && firstBlock.type === 'text' ? firstBlock.text : '';

  const tokenUsage = {
    input: response.usage.input_tokens,
    output: response.usage.output_tokens,
  };

  // From here the API call has already been billed. Wrap any parse/validation
  // failure in a VisionParseError so the caller can (a) bill the spent tokens
  // and (b) decide whether to retry — without losing the underlying error type.
  try {
    // Parse JSON from Claude's response
    const parsed = extractJSON(rawText);
    // Validate against Zod schema
    const validated = ClaudeReceiptExtractionSchema.parse(parsed);
    return { extraction: validated as ClaudeReceiptExtraction, tokenUsage };
  } catch (parseError) {
    throw new VisionParseError(parseError, tokenUsage);
  }
}

// --- Main Parse Function ---

/**
 * Parse a receipt image into structured financial data using Claude Vision.
 *
 * Strategy:
 * 1. Validate image (size, MIME type)
 * 2. Call Haiku Vision (cheaper, faster)
 * 3. If key fields have low confidence, auto-retry with Sonnet
 * 4. Transform extraction into ReceiptParseResult
 *
 * @param imageBuffer - Raw image bytes
 * @param mimeType - Image MIME type (image/jpeg, image/png, image/webp)
 * @param options - Optional configuration overrides
 * @returns Structured receipt parse result
 */
export async function parseReceipt(
  imageBuffer: Buffer,
  mimeType: string,
  options?: {
    /** Force a specific model instead of the Haiku-first strategy */
    forceModel?: 'haiku' | 'sonnet';
    /** Custom Anthropic API key (for spike testing) */
    apiKey?: string;
  }
): Promise<ReceiptParseResult> {
  const startTime = Date.now();

  // --- Stage 1: Validate Image ---
  let validatedMimeType: SupportedMimeType;
  try {
    const validation = validateImage(imageBuffer, mimeType);
    validatedMimeType = validation.mimeType;
  } catch (validationError) {
    return {
      success: false,
      fields: emptyFields(),
      rawText: '',
      model: 'haiku',
      processingTimeMs: Date.now() - startTime,
      tokenUsage: { input: 0, output: 0 },
      errors: [
        validationError instanceof Error ? validationError.message : 'Image validation failed',
      ],
    };
  }

  // --- Stage 2: Prepare API Client ---
  const apiKey = options?.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      fields: emptyFields(),
      rawText: '',
      model: 'haiku',
      processingTimeMs: Date.now() - startTime,
      tokenUsage: { input: 0, output: 0 },
      errors: ['ANTHROPIC_API_KEY not configured'],
    };
  }

  const client = new Anthropic({ apiKey });
  const imageBase64 = imageBuffer.toString('base64');

  // --- Stage 3: Determine Model ---
  const useModel = options?.forceModel === 'sonnet' ? SONNET_MODEL : HAIKU_MODEL;
  const modelLabel: 'haiku' | 'sonnet' =
    options?.forceModel === 'sonnet' ? 'sonnet' : 'haiku';

  // --- Token accounting (C3) ---
  // Every Claude call appends to this breakdown so the route can record cost
  // for ALL calls made (e.g. both the Haiku attempt AND the Sonnet fallback),
  // not just the winning model. Without this, a fallback under-counts spend in
  // the circuit breaker.
  const tokenUsageBreakdown: OcrCallTokenUsage[] = [];

  // --- Stage 4: Call Claude Vision (Haiku first) ---
  try {
    const { extraction, tokenUsage } = await callClaudeVision(
      client,
      imageBase64,
      validatedMimeType,
      useModel,
      RECEIPT_OCR_PROMPT
    );
    tokenUsageBreakdown.push({ model: modelLabel, ...tokenUsage });

    const result = transformExtraction(
      extraction,
      modelLabel,
      Date.now() - startTime,
      tokenUsage
    );

    // --- Stage 5: Check if Sonnet fallback needed ---
    if (
      !options?.forceModel &&
      modelLabel === 'haiku' &&
      shouldRetryWithSonnet(extraction)
    ) {
      console.warn(
        '[OCR] Low confidence on key fields from Haiku — retrying with Sonnet'
      );

      try {
        const sonnetStart = Date.now();
        const { extraction: sonnetExtraction, tokenUsage: sonnetTokens } =
          await callClaudeVision(
            client,
            imageBase64,
            validatedMimeType,
            SONNET_MODEL,
            RECEIPT_OCR_PROMPT
          );
        // Record the Sonnet call's tokens regardless of which result we keep —
        // the call was made and billed (C3).
        tokenUsageBreakdown.push({ model: 'sonnet', ...sonnetTokens });

        const sonnetResult = transformExtraction(
          sonnetExtraction,
          'sonnet',
          Date.now() - sonnetStart,
          sonnetTokens
        );

        // Use Sonnet result if it has better overall confidence
        if (
          sonnetExtraction.confidence.overall > extraction.confidence.overall
        ) {
          return finalizeResult(sonnetResult, tokenUsageBreakdown, startTime);
        }
      } catch (sonnetError) {
        console.error('[OCR] Sonnet fallback failed, using Haiku result:', sonnetError);
        // Fall through to return Haiku result
      }
    }

    return finalizeResult(result, tokenUsageBreakdown, startTime);
  } catch (error) {
    // The first call's tokens are only spent if it reached the API and got a
    // billed response (VisionParseError carries them); a raw APIError means no
    // tokens were billed. Record any spent tokens so the route bills them (C3).
    if (error instanceof VisionParseError) {
      tokenUsageBreakdown.push({ model: modelLabel, ...error.tokenUsage });
    }

    // --- Stage 4b: Structured Retry (C2) ---
    // Only retry on a GENUINE parse failure — a SyntaxError from JSON.parse,
    // the "No JSON found" Error thrown by extractJSON, or a ZodError from
    // schema validation. Retrying these with a more structured prompt can fix
    // a malformed response. Do NOT retry on Anthropic APIError (401 auth, 429
    // rate-limit, 5xx) — those won't be fixed by re-prompting the same model
    // with no backoff, and re-issuing burns quota/spend. The old guard
    // (`SyntaxError || Error`) was always true, so it retried everything.
    if (isRetryableParseError(error)) {
      console.warn('[OCR] First attempt failed (parse error), retrying with structured prompt');
      try {
        const { extraction, tokenUsage } = await callClaudeVision(
          client,
          imageBase64,
          validatedMimeType,
          useModel,
          RECEIPT_OCR_PROMPT + RECEIPT_OCR_RETRY_SUFFIX
        );
        tokenUsageBreakdown.push({ model: modelLabel, ...tokenUsage });

        return finalizeResult(
          transformExtraction(
            extraction,
            modelLabel,
            Date.now() - startTime,
            tokenUsage
          ),
          tokenUsageBreakdown,
          startTime
        );
      } catch (retryError) {
        // The retry's tokens, too, if it got a billed-but-unparseable response.
        if (retryError instanceof VisionParseError) {
          tokenUsageBreakdown.push({ model: modelLabel, ...retryError.tokenUsage });
        }
        console.error('[OCR] Retry also failed:', retryError);
      }
    }

    // All attempts failed. Surface whatever tokens WERE spent (e.g. a first
    // call that returned then failed Zod, plus a failed retry) so the route
    // still records that cost.
    return {
      success: false,
      fields: emptyFields(),
      rawText: '',
      model: modelLabel,
      processingTimeMs: Date.now() - startTime,
      tokenUsage: sumTokenUsage(tokenUsageBreakdown),
      tokenUsageBreakdown: tokenUsageBreakdown.length > 0 ? tokenUsageBreakdown : undefined,
      errors: [
        unwrapErrorMessage(error),
        'Hindi ma-process ang receipt — subukan ulit o i-type manually.',
      ],
    };
  }
}

// --- Helper: Finalize Result with Cumulative Token Usage (C3) ---

/**
 * Stamp a transformed result with the cumulative token usage across all calls
 * and the per-call breakdown, and recompute total processing time.
 */
function finalizeResult(
  result: ReceiptParseResult,
  breakdown: OcrCallTokenUsage[],
  startTime: number
): ReceiptParseResult {
  return {
    ...result,
    processingTimeMs: Date.now() - startTime,
    tokenUsage: sumTokenUsage(breakdown),
    tokenUsageBreakdown: breakdown,
  };
}

/** Sum input/output tokens across every recorded call. */
function sumTokenUsage(
  breakdown: OcrCallTokenUsage[]
): { input: number; output: number } {
  return breakdown.reduce(
    (acc, call) => ({ input: acc.input + call.input, output: acc.output + call.output }),
    { input: 0, output: 0 }
  );
}

// --- Helper: Classify Retryable Parse Errors (C2) ---

/**
 * True ONLY for errors that re-prompting the same model with a more structured
 * prompt can plausibly fix:
 * - JSON.parse SyntaxError (malformed JSON in the response)
 * - ZodError from schema validation (right JSON, wrong shape) — duck-typed by
 *   `name` so we don't need a hard zod import here
 * - the "No JSON found in Claude response" Error thrown by extractJSON
 *
 * Anthropic SDK errors (APIError/AuthenticationError/RateLimitError — all carry
 * a numeric `status`) and any other error are NOT retryable: a retry with no
 * backoff and the same model won't fix a 401/429/5xx and only burns quota.
 *
 * Unwraps VisionParseError to inspect the underlying cause (parse/validation
 * failures are wrapped so their token usage can be billed).
 */
function isRetryableParseError(error: unknown): boolean {
  const cause = error instanceof VisionParseError ? error.cause : error;
  if (cause instanceof SyntaxError) return true;
  if (!(cause instanceof Error)) return false;
  // Anthropic SDK errors expose a numeric `status` — never retry those.
  if (typeof (cause as { status?: unknown }).status === 'number') return false;
  // ZodError — match by name to avoid importing zod into this module.
  if (cause.name === 'ZodError') return true;
  // The only plain Error the parse path raises is extractJSON's "No JSON found".
  return cause.message.includes('No JSON found');
}

/** Surface the most useful message from an error, unwrapping VisionParseError. */
function unwrapErrorMessage(error: unknown): string {
  if (error instanceof VisionParseError) {
    return error.cause instanceof Error ? error.cause.message : error.message;
  }
  return error instanceof Error ? error.message : 'Unknown OCR error';
}

// --- Helper: Should Retry with Sonnet ---

/**
 * Determine if Haiku's extraction has low enough confidence on critical fields
 * to warrant a Sonnet retry.
 *
 * Critical fields: merchant, total, date (the fields that matter most for financial records).
 */
function shouldRetryWithSonnet(extraction: ClaudeReceiptExtraction): boolean {
  const { confidence } = extraction;
  return (
    confidence.total < LOW_CONFIDENCE_THRESHOLD ||
    confidence.date < LOW_CONFIDENCE_THRESHOLD ||
    confidence.store_name < LOW_CONFIDENCE_THRESHOLD
  );
}

// --- Helper: Empty Fields ---

/**
 * Return an empty ReceiptFields structure for error cases.
 */
function emptyFields(): ReceiptFields {
  const emptyField = (field: string): ReceiptField => ({
    field,
    value: null,
    confidence: 'low',
    raw: '',
  });

  return {
    merchant: emptyField('merchant'),
    date: emptyField('date'),
    total: emptyField('total'),
  };
}

// --- Cost Estimation for OCR ---

/**
 * Estimate the cost of an OCR scan before making the API call.
 * Useful for circuit breaker pre-flight check.
 *
 * @param model - Which model to estimate for
 * @returns Estimated cost in USD
 */
export function estimateOcrCost(model: 'haiku' | 'sonnet' = 'haiku'): number {
  const modelId: ClaudeModelId =
    model === 'sonnet' ? SONNET_MODEL : HAIKU_MODEL;
  // Vision images are ~1600 tokens (depends on size). Conservative estimate: 2000 input tokens.
  const estimatedInputTokens = 2000;
  return estimateCost(modelId, estimatedInputTokens, OCR_MAX_TOKENS);
}

/**
 * Calculate actual cost from a completed OCR scan.
 *
 * @param model - Which model was used
 * @param tokenUsage - Actual token usage from the API response
 * @returns Actual cost in USD
 */
export function calculateOcrCost(
  model: 'haiku' | 'sonnet',
  tokenUsage: { input: number; output: number }
): number {
  const modelId: ClaudeModelId =
    model === 'sonnet' ? SONNET_MODEL : HAIKU_MODEL;
  return calculateActualCost(modelId, tokenUsage.input, tokenUsage.output);
}
