'use client';

// ============================================================
// DisclaimerBanner — Phase 8c restyle
// Voice manual §3 canonical copy, soft honey-pale tint, ink-soft
// text, no harsh border. Persistent + non-dismissible (Design
// Gate 2: Trust Recovery).
// ============================================================

export default function DisclaimerBanner() {
  return (
    <div
      className="flex-shrink-0 bg-honey-cream/40 px-4 py-2"
      data-testid="disclaimer-banner"
      role="status"
      aria-label="BIR disclaimer"
    >
      <p className="text-[11px] text-ink-soft leading-snug text-center">
        Ito ay gabay lamang, hindi tax advice.
      </p>
    </div>
  );
}
