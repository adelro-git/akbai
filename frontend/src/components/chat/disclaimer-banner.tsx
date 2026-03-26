'use client';

/**
 * DisclaimerBanner — Persistent informational banner at the top of chat
 * Design Gate 2: Trust Recovery — NOT dismissible, always visible.
 * Uses surface-container-low bg, on-surface-variant text, text-xs.
 */

export default function DisclaimerBanner() {
  return (
    <div
      className="flex-shrink-0 bg-surface-container-low px-4 py-2.5"
      data-testid="disclaimer-banner"
      role="status"
      aria-label="Disclaimer"
    >
      <p className="text-xs text-on-surface-variant leading-relaxed text-center">
        AKBai provides informational guidance only — hindi ito professional
        financial or tax advice.
      </p>
    </div>
  );
}
