/**
 * Claude API Retry Utility with Exponential Backoff
 * Feature: AI Integration (used across all Claude API calls)
 * Role: Handles transient failures with exponential backoff strategy
 *
 * Responsibility: Retry failed Claude API calls with exponential backoff + jitter.
 * Respects retryable status codes (429, 5xx, 529). Non-retryable errors fail immediately.
 * Max 3 retries (4 total attempts). Used by the callClaude wrapper.
 *
 * Dependencies: Anthropic SDK errors
 * Tested by: QA — rate limits, network failures, server errors
 */

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  userId?: string; // For logging context
}

// Status codes that indicate a transient failure and should be retried
const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 529];

/**
 * Retry a function with exponential backoff and jitter.
 *
 * Strategy:
 * - Attempt the function up to maxRetries + 1 times
 * - On failure, check if the error is retryable (specific status codes)
 * - Apply exponential backoff: baseDelay * 2^attempt + random jitter (0-1s)
 * - Cap max delay at maxDelayMs to prevent absurd wait times
 * - Log each retry with attempt number and delay
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration
 * @returns Promise that resolves to function result or rejects with final error
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    userId = 'unknown',
  } = options;

  let lastError: Error | undefined;

  // --- Attempt Loop: Try up to maxRetries + 1 times ---
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // --- Non-Retryable Error Check: Fail immediately on 4xx/401/403 ---
      const statusCode = error?.status ?? error?.statusCode;
      if (statusCode && !RETRYABLE_STATUS_CODES.includes(statusCode)) {
        console.error(
          `[Claude Retry] Non-retryable error (status ${statusCode}) for user ${userId}. Failing immediately.`,
          error.message
        );
        throw error;
      }

      // --- Exhausted Retries: Break if all attempts used ---
      if (attempt === maxRetries) {
        console.error(
          `[Claude Retry] All ${maxRetries + 1} attempts exhausted for user ${userId}. Last error: ${error.message}`
        );
        break;
      }

      // --- Exponential Backoff Calculation: 2^attempt * baseDelay + random jitter ---
      const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
      const jitter = Math.random() * 1000; // 0-1000ms random jitter
      const delay = Math.min(exponentialDelay + jitter, maxDelayMs);

      console.warn(
        `[Claude Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed (status: ${statusCode || 'unknown'}) for user ${userId}. ` +
          `Retrying in ${Math.round(delay)}ms...`
      );

      // --- Wait: Sleep before retry ---
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // --- Final Error: Throw the last error encountered ---
  throw lastError ?? new Error('[Claude Retry] Function failed after all retry attempts');
}
