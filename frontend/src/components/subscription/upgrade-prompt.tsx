/**
 * Upgrade Prompt — CTA card for free-tier users to upgrade
 * Feature: Xendit Payment Infrastructure (Build 8) + Sprint 17 paywall wiring
 * Role: Encourage free-tier users to upgrade. The CTA used to navigate to
 *       a (now-removed) /pricing route via `onUpgrade`. Sprint 17 routes
 *       this CTA through the unified PaywallModal — parents pass an
 *       onUpgrade that calls the modal's setOpen(true).
 *
 * Shows conversational Filipino message with feature highlights.
 * Designed as a tonal card (surface-container-low on surface background).
 * No borders (No-Line Rule). Minimum 44px touch targets.
 *
 * Sprint 17 (architect §4 line 683): when `onUpgrade` is omitted, the card
 * internally opens its own PaywallModal with source='manual'. This makes
 * the component drop-in safe across legacy call sites that didn't pass
 * onUpgrade — they now get the paywall for free instead of a dead button.
 */

'use client';

import { useState } from 'react';
import { PaywallModal } from './paywall-modal';

// ============================================================
// Props
// ============================================================

interface UpgradePromptProps {
  /**
   * Click handler. If omitted, the card opens its own PaywallModal
   * (source='manual') so the CTA is never a no-op.
   */
  onUpgrade?: () => void;
  className?: string;
}

// ============================================================
// Component — Tonal card with upgrade CTA
// ============================================================

export function UpgradePrompt({ onUpgrade, className = '' }: UpgradePromptProps) {
  // Self-contained paywall state — only used when the parent didn't
  // pass an onUpgrade. Parents that DO pass onUpgrade keep ownership.
  const [selfPaywallOpen, setSelfPaywallOpen] = useState(false);

  const handleClick = onUpgrade ?? (() => setSelfPaywallOpen(true));

  return (
    <>
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
              Walang-limit na receipt scans
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

        {/* --- CTA Button — always rendered now that onUpgrade is auto-fulfilled --- */}
        <button
          type="button"
          onClick={handleClick}
          className="mt-4 w-full min-h-[44px] rounded-xl bg-primary-container text-on-primary font-bold text-sm py-3 transition-colors hover:opacity-90 active:opacity-80"
          data-testid="upgrade-prompt-cta"
        >
          I-upgrade ang account ko
        </button>
      </div>

      {/* Self-contained PaywallModal — only mounted when parent didn't pass onUpgrade. */}
      {!onUpgrade && (
        <PaywallModal
          open={selfPaywallOpen}
          source="manual"
          onClose={() => setSelfPaywallOpen(false)}
        />
      )}
    </>
  );
}
