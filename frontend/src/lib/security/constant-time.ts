/**
 * Constant-time secret comparison — shared security primitive.
 * Feature: Sprint 18 cleanup — consolidate the triplicated constant-time
 *   Bearer/secret compare (demo config, cron auth, RevenueCat webhook).
 *
 * Why this exists: three independent auth surfaces had each hand-rolled the
 * SAME XOR-accumulator string compare. One canonical implementation removes
 * the drift risk (a fix or hardening in one copy silently not reaching the
 * others) and gives the comparison a single tested home.
 *
 * SECURITY MODEL (AKBai non-negotiable #4 — fail-closed auth surfaces):
 *   - `constantTimeEquals` compares two strings WITHOUT an early-exit on the
 *     first differing character, so it does not leak — via timing — how many
 *     leading characters of a guessed secret were correct. The length check is
 *     an unavoidable (and acceptable) leak: a secret's length is not the
 *     secret. There is no short-circuit on content.
 *   - `verifyBearer` is the fail-closed `Authorization: Bearer <secret>`
 *     verifier shared by the cron and webhook routes: it returns false when
 *     the configured secret is unset/empty (server misconfig must never
 *     authorize), false when the header is missing or not a well-formed
 *     `Bearer ` token, and otherwise constant-time compares the token against
 *     the secret. It performs NO logging — callers own their own log lines and
 *     posture (see the route wrappers).
 */

// ============================================================
// constantTimeEquals — XOR-accumulator string equality.
// ============================================================

/**
 * Constant-time string equality. Returns true iff `a` and `b` are the same
 * length and every character matches. Does NOT early-exit on the first
 * mismatching character (no timing leak of the matched-prefix length); the
 * length comparison itself is the only timing-observable difference.
 */
export function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// ============================================================
// verifyBearer — fail-closed Authorization: Bearer compare.
// ============================================================

/**
 * Verify an `Authorization: Bearer <secret>` header against an expected secret,
 * fail-closed:
 *   - `secret` unset/empty → false (server misconfig never authorizes).
 *   - `authHeader` null/missing or not prefixed `Bearer ` → false.
 *   - otherwise → constant-time compare of the post-prefix token vs `secret`.
 *
 * Performs no logging — callers add their own (cron logs the missing-env case,
 * RevenueCat warns on a malformed header). This is purely the verification core.
 */
export function verifyBearer(authHeader: string | null, secret: string | undefined): boolean {
  if (!secret) {
    return false;
  }
  const auth = authHeader ?? '';
  if (!auth.startsWith('Bearer ')) {
    return false;
  }
  const token = auth.slice('Bearer '.length);
  return constantTimeEquals(token, secret);
}
