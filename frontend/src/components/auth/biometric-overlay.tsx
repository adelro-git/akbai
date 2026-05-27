'use client';

/**
 * BiometricOverlay — Lockscreen overlay shown while biometric is verifying or
 * after a failed attempt (with attempts remaining).
 *
 * Feature: Biometric Second Factor (Sprint 16, Gap G4 mitigation)
 * Role: Renders modal-overlay above (app) children so the dashboard content
 *       is NEVER visible underneath an unverified session. Apple Guideline
 *       4.2 reviewer signal: a peek of authenticated content before biometric
 *       resolves would be flagged.
 *
 * Conversational Filipino copy locked per architect §4 + copy guide §3:
 *   verifying → "Sandali, kinukumpirma ka namin." (enclitic `ka namin` after `kinukumpirma`)
 *   failed     → "Hindi na-match. Subukan mo ulit." (Filipinized `na-match` verb; na- affix = completed state)
 *
 * Reference: sprint-16-native-plugin-pattern.md §4.
 */

import { KaiSitting } from '@/components/illustrations/kai';

export type BiometricOverlayStatus = 'verifying' | 'failed';

interface BiometricOverlayProps {
  status: BiometricOverlayStatus;
  /** Remaining biometric attempts before fallback to OTP sign-out. */
  attemptsRemaining?: number;
  /** Retry callback — re-fires verifyBiometric() in the parent layout. */
  onRetry?: () => void;
}

export default function BiometricOverlay({
  status,
  attemptsRemaining,
  onRetry,
}: BiometricOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 bg-surface"
      data-testid="biometric-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Biometric verification"
    >
      <div className="flex flex-col items-center gap-6 max-w-sm text-center">
        <KaiSitting size={120} animated />

        {status === 'verifying' && (
          <>
            <h2
              className="font-serif text-xl font-medium text-on-surface"
              data-testid="biometric-verifying-title"
            >
              Sandali, kinukumpirma ka namin.
            </h2>
            <p className="text-sm text-on-surface-variant">
              Gamitin ang Face ID o fingerprint mo para magbukas ang AKBai.
            </p>
          </>
        )}

        {status === 'failed' && (
          <>
            <h2
              className="font-serif text-xl font-medium text-on-surface"
              data-testid="biometric-failed-title"
            >
              Hindi na-match. Subukan mo ulit.
            </h2>
            {typeof attemptsRemaining === 'number' && attemptsRemaining > 0 && (
              <p
                className="text-sm text-on-surface-variant"
                data-testid="biometric-attempts-remaining"
              >
                {attemptsRemaining === 1
                  ? 'Huling 1 na lang — subukan mo ulit.'
                  : `${attemptsRemaining} na lang ang natitira.`}
              </p>
            )}
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 inline-flex items-center justify-center min-h-[48px] px-6 bg-honey-deep text-white text-sm font-semibold rounded-full shadow-ambient"
                data-testid="biometric-retry-btn"
              >
                Gamitin ang biometric muli
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
