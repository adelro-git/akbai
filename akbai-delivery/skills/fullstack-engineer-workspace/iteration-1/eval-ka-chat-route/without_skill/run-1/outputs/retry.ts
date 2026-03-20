// lib/claude/retry.ts
// Exponential backoff retry logic for Claude API calls
//
// Handles transient failures: rate limits (429), server errors (500/502/503),
// and overload (529). Does NOT retry on authentication (401) or client errors (400).

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

// HTTP status codes that indicate a transient error worth retrying
// Based on Anthropic API documentation and HTTP conventions
const RETRYABLE_STATUS_CODES = new Set([
  429, // Too Many Requests — rate limit, retry with backoff
  500, // Internal Server Error — temporary server issue
  502, // Bad Gateway — load balancer/reverse proxy issue
  503, // Service Unavailable — server overloaded or under maintenance
  529, // Site Overloaded — Anthropic specific, queue is full
]);

/**
 * Retry a Claude API call with exponential backoff
 *
 * Strategy:
 * 1. Try the function
 * 2. If it fails with a retryable status code, wait and retry
 * 3. Exponential backoff: 1s, 2s, 4s (with jitter)
 * 4. Give up after maxRetries attempts (total = maxRetries + 1)
 * 5. If non-retryable error (4xx except 429), fail immediately
 *
 * Usage:
 *   const response = await retryWithBackoff(
 *     () => claudeApi.messages.create(...),
 *     { maxRetries: 3 }
 *   );
 *
 * @param fn Function that returns a Promise (e.g., Claude API call)
 * @param options Retry configuration
 * @returns Result of fn if successful
 * @throws The last error encountered, if all retries fail
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 30000 } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Extract HTTP status code from error
      // Different libraries expose this differently
      const statusCode = error?.status ?? error?.statusCode ?? error?.code;

      // Non-retryable error (4xx except 429, 5xx except retryable, etc.) — fail immediately
      if (statusCode && !RETRYABLE_STATUS_CODES.has(statusCode)) {
        throw error;
      }

      // This was our last attempt — give up
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff + jitter
      // Backoff: 1s → 2s → 4s → 8s (capped at maxDelayMs)
      // Jitter: ±0-1s random (prevents thundering herd if multiple users hit same error)
      const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
      const jitter = Math.random() * 1000;
      const delay = Math.min(exponentialDelay + jitter, maxDelayMs);

      console.warn(
        `[Claude Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed (status: ${statusCode ?? 'unknown'}). ` +
          `Retrying in ${Math.round(delay)}ms...`
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All retries exhausted
  throw (
    lastError ??
    new Error('Claude API call failed after all retries (error details unavailable)')
  );
}

/**
 * Retry logic documentation & decision tree
 *
 * When should we retry?
 * ========================
 *
 * Status 429 (Rate Limited)
 * - Meaning: Too many requests in a time window
 * - Cause: Spike in traffic, hitting concurrent request limit
 * - Recovery: Yes, exponential backoff works
 * - Anthropic provides "Retry-After" header; we use exponential backoff as good default
 *
 * Status 500 (Internal Server Error)
 * - Meaning: Server crashed or unhandled exception
 * - Cause: Bug in Anthropic's code, temporary issue
 * - Recovery: Yes, usually fixed within seconds
 *
 * Status 502 (Bad Gateway)
 * - Meaning: Upstream server (load balancer, reverse proxy) returned error
 * - Cause: Infrastructure issue, not Anthropic's main API
 * - Recovery: Yes, almost always transient
 *
 * Status 503 (Service Unavailable)
 * - Meaning: Server is temporarily down or overloaded
 * - Cause: Maintenance, DDoS, unexpected surge in traffic
 * - Recovery: Yes, service should come back online
 *
 * Status 529 (Site Overloaded)
 * - Meaning: Anthropic-specific: request queue is full
 * - Cause: Sustained high load, all servers busy
 * - Recovery: Yes, queue processes requests, so waiting helps
 *
 * When should we NOT retry?
 * ========================
 *
 * Status 400 (Bad Request)
 * - Meaning: Request is malformed (invalid JSON, wrong field, etc.)
 * - Cause: Bug in our code, not a transient issue
 * - Recovery: No, retrying won't fix it
 * - Action: Fix the request, don't retry
 *
 * Status 401 (Unauthorized)
 * - Meaning: API key is missing, invalid, or expired
 * - Cause: Configuration error or security issue
 * - Recovery: No, retrying won't fix it
 * - Action: Check API key, rotate if leaked
 *
 * Status 403 (Forbidden)
 * - Meaning: API key doesn't have permission for this operation
 * - Cause: Wrong key, permission scope too narrow
 * - Recovery: No, retrying won't fix it
 * - Action: Check API key and organization
 *
 * Status 404 (Not Found)
 * - Meaning: Resource doesn't exist (e.g., wrong model ID)
 * - Cause: Typo in request, model was deleted
 * - Recovery: No, retrying won't fix it
 * - Action: Check model ID and request structure
 *
 * What about network timeouts?
 * ===========================
 * If the HTTP client library times out, it usually throws a different type of error
 * (not an HTTP status code). Examples:
 * - Node.js: ECONNREFUSED, ECONNRESET, ETIMEDOUT
 * - Fetch API: TypeError: Failed to fetch
 * - Axios: ENOTFOUND, EHOSTUNREACH
 *
 * These are typically transient (network flake) and safe to retry.
 * However, handling these depends on the specific library.
 * For now, the circuit breaker + maxRetries provides reasonable resilience.
 *
 * Backoff math:
 * =============
 * Exponential backoff with jitter prevents "thundering herd":
 *
 * Attempt 1: 1000ms + jitter = 1000-2000ms
 * Attempt 2: 2000ms + jitter = 2000-3000ms
 * Attempt 3: 4000ms + jitter = 4000-5000ms
 * Attempt 4: 8000ms + jitter = 8000-9000ms (capped at maxDelayMs=30s)
 *
 * Total max wait for 3 retries: ~5s + ~3s + ~5s = ~13s
 * This is acceptable for a KA chat response (user expects some latency)
 *
 * If 30s has passed and service is still down, it's likely a major incident.
 * At that point, failing fast and surfacing an error is better than hanging.
 */

/**
 * For testing: create a fake error with a given status code
 */
export function createTestError(statusCode: number, message: string): Error {
  const error = new Error(message);
  (error as any).status = statusCode;
  return error;
}
