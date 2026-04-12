/**
 * Upgrade Prompt — CTA card for free-tier users to upgrade
 * Feature: Xendit Payment Infrastructure (Build 8)
 * Role: Encourage free-tier users to upgrade to Pro
 *
 * Shows conversational Filipino message with feature highlights.
 * Designed as a tonal card (surface-container-low on surface background).
 * No borders (No-Line Rule). Minimum 44px touch targets.
 */

'use client';

// ============================================================
// Props
// ============================================================

interface UpgradePromptProps {
  onUpgrade?: () => void;
  className?: string;
}

// ============================================================
// Component — Tonal card with upgrade CTA
// ============================================================

export function UpgradePrompt({ onUpgrade, className = '' }: UpgradePromptProps) {
  return (
    <div
      className={`mx-4 rounded-2xl bg-surface-container-low px-5 py-4 ${className}`}
    >
      {/* --- Headline --- */}
      <h3 className="text-base font-bold text-on-surface leading-tight">
        Mag-upgrade sa Pro
      </h3>

      {/* --- Feature list --- */}
      <ul className="mt-2 space-y-1.5">
        <li className="flex items-start gap-2">
          <span className="text-tertiary mt-0.5 flex-shrink-0" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span className="text-sm text-on-surface-variant">
            50 receipt scans kada buwan
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-tertiary mt-0.5 flex-shrink-0" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span className="text-sm text-on-surface-variant">
            Unlimited na pag-chat kay Kai
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-tertiary mt-0.5 flex-shrink-0" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span className="text-sm text-on-surface-variant">
            BIR deadline reminders at compliance tips
          </span>
        </li>
      </ul>

      {/* --- CTA Button --- */}
      {onUpgrade && (
        <button
          type="button"
          onClick={onUpgrade}
          className="mt-4 w-full min-h-[44px] rounded-xl bg-primary-container text-on-primary font-bold text-sm py-3 transition-colors hover:opacity-90 active:opacity-80"
        >
          I-upgrade ang account ko
        </button>
      )}
    </div>
  );
}
