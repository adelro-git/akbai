import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { checkRateLimit } from '@/lib/rate-limit'

// IP-based rate limiting for API routes.
// Phase 0-1: in-memory sliding window (single Vercel instance).
// Month 7+: replace with Cloudflare WAF rate limiting rules.
const API_RATE_LIMIT = { windowMs: 60_000, maxRequests: 20 }

export async function proxy(request: NextRequest) {
  // Rate limit API routes by client IP
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? 'unknown'

    const result = checkRateLimit(ip, API_RATE_LIMIT)

    if (!result.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please try again shortly.',
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((result.retryAfterMs ?? 60000) / 1000)),
          },
        }
      )
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
