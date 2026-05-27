// AKBai — Per-route rate-limit guard
// Replaces the global proxy.ts middleware for static-export (Capacitor) builds
// where Next 16 middleware does not execute. For SSR builds, proxy.ts continues
// to apply a blanket 20/60s IP cap and individual routes may layer stricter
// per-endpoint caps via enforceRateLimit().
//
// See ADR-019 Sprint-15 pattern §4 / §5 for rationale and the per-route opt-in
// table.

import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit, type RateLimitResult } from './index'

export interface RateLimitOptions {
  /** Sliding-window length in ms. Default 60_000 (60s). */
  windowMs?: number
  /** Max requests per window. Default 20. */
  maxRequests?: number
  /**
   * Key namespace prepended to the IP — lets two routes with different caps
   * share the in-memory store without colliding. Recommended per-route.
   */
  key?: string
}

const DEFAULTS = { windowMs: 60_000, maxRequests: 20 } as const

/**
 * Resolves the client IP from forwarded headers, falling back to 'unknown'.
 * Same precedence the proxy.ts middleware uses.
 */
function resolveClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (forwarded) return forwarded
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}

/**
 * Per-route rate-limit guard. Call as the first line of a route handler:
 *
 *   export async function POST(req: NextRequest) {
 *     const limited = enforceRateLimit(req, { key: 'chat', maxRequests: 20 })
 *     if (limited) return limited
 *     // ...handler body...
 *   }
 *
 * Returns a 429 NextResponse with our standard error envelope if the request
 * is over the limit, or null if the request is allowed (caller continues).
 */
export function enforceRateLimit(
  req: NextRequest,
  opts: RateLimitOptions = {}
): NextResponse | null {
  const windowMs = opts.windowMs ?? DEFAULTS.windowMs
  const maxRequests = opts.maxRequests ?? DEFAULTS.maxRequests

  const ip = resolveClientIp(req)
  const storeKey = opts.key ? `${opts.key}:${ip}` : ip

  const result: RateLimitResult = checkRateLimit(storeKey, { windowMs, maxRequests })

  if (result.allowed) return null

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again shortly.',
        message_tl: 'Sobrang dami ng requests. Subukan ulit mamaya.',
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((result.retryAfterMs ?? windowMs) / 1000)),
      },
    }
  )
}
