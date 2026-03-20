/**
 * /lib/utils/api-response.ts
 * Standardized response envelope for all AKBai API routes
 *
 * Every response follows this pattern:
 * Success: { success: true, data: T }
 * Error: { success: false, error: { code, message, message_tl, details? } }
 *
 * status codes:
 * - 200: OK
 * - 201: Created
 * - 400: Bad request (validation error)
 * - 401: Unauthorized
 * - 403: Forbidden (tier limit, etc)
 * - 404: Not found
 * - 422: Unprocessable entity (Claude parse error)
 * - 429: Too many requests (rate limit)
 * - 500: Internal error
 * - 503: Service unavailable (AI circuit open)
 */

/**
 * Return successful response
 *
 * @param data - Response payload
 * @param status - HTTP status code (default 200)
 * @returns Response object ready to return from API route
 *
 * Example:
 * return apiSuccess({ id: "123", name: "Maria" }, 201);
 */
export function apiSuccess<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data }, { status });
}

/**
 * Return error response
 *
 * @param code - Machine-readable error code (AUTH_REQUIRED, VALIDATION_ERROR, etc)
 * @param message - English error message (for logs)
 * @param message_tl - Taglish error message (for user display)
 * @param status - HTTP status code (default 400)
 * @param details - Optional debugging details
 * @returns Response object ready to return from API route
 *
 * Example:
 * return apiError(
 *   'AUTH_REQUIRED',
 *   'Authentication required',
 *   'Kailangan mong mag-login.',
 *   401
 * );
 */
export function apiError(
  code: string,
  message: string,
  message_tl?: string,
  status = 400,
  details?: Record<string, unknown>
): Response {
  const errorBody: Record<string, unknown> = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (message_tl) {
    errorBody.error ??= {};
    (errorBody.error as Record<string, unknown>).message_tl = message_tl;
  }

  if (details) {
    errorBody.error ??= {};
    (errorBody.error as Record<string, unknown>).details = details;
  }

  return Response.json(errorBody, { status });
}

/**
 * Common HTTP status codes and suggested error codes
 *
 * 400 Bad Request:
 * - INVALID_JSON: Request body not valid JSON
 * - VALIDATION_ERROR: Zod schema validation failed
 * - INVALID_REQUEST: Generic bad request
 *
 * 401 Unauthorized:
 * - AUTH_REQUIRED: No authenticated user
 * - INVALID_TOKEN: Invalid or expired token
 *
 * 403 Forbidden:
 * - TIER_LIMIT_REACHED: User tier limit reached (scans, features)
 * - FEATURE_GATED: Feature not enabled for this user
 * - PERMISSION_DENIED: User doesn't have permission
 *
 * 404 Not Found:
 * - NOT_FOUND: Resource not found
 * - RECEIPT_NOT_FOUND: Specific receipt not found
 * - USER_NOT_FOUND: User record not found
 *
 * 422 Unprocessable Entity:
 * - AI_PARSE_ERROR: Claude output doesn't match expected schema
 * - PARSE_ERROR: Generic parsing error
 *
 * 429 Too Many Requests:
 * - RATE_LIMIT: Too many requests to this endpoint
 * - QUOTA_EXCEEDED: User quota exceeded
 *
 * 500 Internal Server Error:
 * - INTERNAL_ERROR: Unexpected server error
 * - DATABASE_ERROR: Database operation failed
 * - STORAGE_ERROR: File storage operation failed
 * - CONTEXT_ERROR: Cannot load required context
 *
 * 503 Service Unavailable:
 * - AI_CIRCUIT_OPEN: Daily AI spend cap reached
 * - AI_ERROR: Claude API error (transient)
 * - SERVICE_UNAVAILABLE: Service temporarily down
 */
