'use client'

interface FreeTierBannerProps {
  queriesUsed: number
  tier: string
}

/**
 * Free tier usage warning banner.
 * Shows an amber warning at 8+ queries and a red block banner at 10+ queries.
 * Only renders for free tier users.
 */
export default function FreeTierBanner({ queriesUsed, tier }: FreeTierBannerProps) {
  // Only show for free tier users
  if (tier !== 'free') return null

  // At 10+ queries: red/error banner (blocked)
  if (queriesUsed >= 10) {
    return (
      <div
        className="mx-4 mb-2 rounded-xl px-4 py-3 bg-error/10 border border-error/30"
        data-testid="free-tier-block-banner"
        role="alert"
      >
        <p className="text-sm text-error font-medium">
          Naka-max ka na for today — bukas ulit tayo! Pro users get unlimited queries.
        </p>
        <a
          href="/pricing"
          className="text-xs text-error underline underline-offset-2 mt-1 inline-block"
        >
          Learn about Pro
        </a>
      </div>
    )
  }

  // At 8-9 queries: amber/warning banner
  if (queriesUsed >= 8) {
    const remaining = 10 - queriesUsed
    return (
      <div
        className="mx-4 mb-2 rounded-xl px-4 py-3 bg-amber-500/10 border border-amber-500/30"
        data-testid="free-tier-warning-banner"
        role="alert"
      >
        <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
          {remaining} na lang ang tanong mo for today. Bukas ulit, or upgrade to Pro!
        </p>
      </div>
    )
  }

  // Below 8: render nothing
  return null
}
