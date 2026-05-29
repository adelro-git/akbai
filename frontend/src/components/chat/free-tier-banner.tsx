'use client'

interface FreeTierBannerProps {
  queriesUsed: number
  tier: string
  /**
   * Sprint 17: replaces the dead `/pricing` href with a PaywallModal
   * trigger. Parent (chat-interface) owns the open/close state and
   * passes the callback. If omitted, the banner falls back to no-op
   * so existing call sites don't break.
   */
  onUpgrade?: () => void
}

/**
 * Free tier usage warning banner.
 * Shows an amber warning at 8+ queries and a red block banner at 10+ queries.
 * Only renders for free tier users.
 *
 * Sprint 17 change (architect §4 line 682): the "Learn about Pro" CTA used
 * to be an <a href="/pricing">. That route was removed when paywall logic
 * consolidated into <PaywallModal />. The CTA is now a button that calls
 * onUpgrade — chat-interface wires it to open the PaywallModal with
 * source="chat".
 */
export default function FreeTierBanner({ queriesUsed, tier, onUpgrade }: FreeTierBannerProps) {
  // Only show for free tier users
  if (tier !== 'free') return null

  // At 10+ queries: red/error banner (blocked)
  if (queriesUsed >= 10) {
    return (
      <div
        className="mx-4 mb-2 rounded-xl px-4 py-3 bg-error/10 shadow-ambient"
        data-testid="free-tier-block-banner"
        role="alert"
      >
        <p className="text-sm text-error font-medium">
          Naka-max ka na for today — bukas ulit tayo! Pro users get unlimited queries.
        </p>
        <button
          type="button"
          onClick={onUpgrade}
          className="text-xs text-error underline underline-offset-2 mt-1 inline-block min-h-[44px]"
          data-testid="free-tier-block-upgrade-cta"
        >
          Alamin ang Pro
        </button>
      </div>
    )
  }

  // At 8-9 queries: amber/warning banner
  if (queriesUsed >= 8) {
    const remaining = 10 - queriesUsed
    return (
      <div
        className="mx-4 mb-2 rounded-xl px-4 py-3 bg-amber-500/10 shadow-ambient"
        data-testid="free-tier-warning-banner"
        role="alert"
      >
        <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
          {remaining} na lang ang tanong mo ngayon. Bukas ulit, o mag-upgrade sa Pro!
        </p>
      </div>
    )
  }

  // Below 8: render nothing
  return null
}
