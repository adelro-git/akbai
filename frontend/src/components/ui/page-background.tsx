/**
 * PageBackground — calm page wrapper (Warm Precision).
 *
 * The old per-variant photographic WebP background washes were REMOVED:
 * the Warm Precision direction calls for flat "daylight on good paper"
 * surfaces (design.md §1, Principle 7 — quiet so the numbers and Kai lead).
 * Decoration is reserved for a single per-screen personality moment (the
 * hero), not a full-bleed image behind every screen.
 *
 * Kept as a thin wrapper (the `variant` prop is retained for API/back-compat
 * so the 11 call sites are untouched) — it now just anchors the page on the
 * flat `--surface` body background.
 */

type PageVariant =
  | 'login'
  | 'dashboard'
  | 'onboarding'
  | 'chat'
  | 'expenses'
  | 'deadlines'
  | 'profile'
  | 'offline'
  | 'scan'
  | 'costing'
  | 'invoices';

interface PageBackgroundProps {
  /** Retained for API back-compat; no longer drives a background image. */
  variant: PageVariant;
  children: React.ReactNode;
}

export function PageBackground({ variant: _variant, children }: PageBackgroundProps) {
  void _variant;
  return <div className="relative min-h-dvh">{children}</div>;
}
