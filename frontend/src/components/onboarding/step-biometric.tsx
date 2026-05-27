'use client';

/**
 * Onboarding Step 6.25 — Biometric enable prompt
 * Feature: Biometric Second Factor (Sprint 16, Gap G4 mitigation)
 * Role: After celebrate (step 6), before PWA install (step 6.5), prompt the
 *       user to enable Face ID / fingerprint. Skip is prominent and persists.
 *       On web, this whole step is bypassed at the wizard level
 *       (Capacitor.isNativePlatform() check) — this component is reachable
 *       only on native.
 *
 * Architect placement: step 6.25 (between celebrate=6 and install=6.5)
 *   per sprint-16-native-plugin-pattern.md §4 + Open Q 3 (a).
 *
 * Conversational Filipino copy locked per architect §4 + copy guide §3.
 */

import { useState } from 'react';
import { KaiSitting } from '@/components/illustrations/kai';
import { PaperNote } from '@/components/ui/paper-note';
import { enableBiometric } from '@/lib/capacitor/biometric';

interface StepBiometricProps {
  /** Continue to step 6.5 (PWA install). Called on success OR skip. */
  onContinue: () => void;
  /** Optional — defaults to the user's first name, used in the prompt. */
  firstName?: string;
}

export default function StepBiometric({ onContinue, firstName }: StepBiometricProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnable = async () => {
    setBusy(true);
    setError(null);
    const result = await enableBiometric();
    if (!result.success) {
      // userCancel or denial — surface a soft retry, do NOT advance.
      // Network/API errors land here too.
      setError(result.error ?? 'Hindi nag-match. Subukan mo ulit.');
      setBusy(false);
      return;
    }
    setBusy(false);
    onContinue();
  };

  const handleSkip = () => {
    // No DB write — default is already biometric_enabled=false.
    onContinue();
  };

  return (
    <div
      className="flex flex-col gap-6 animate-in fade-in duration-500"
      data-testid="onboarding-step-biometric"
    >
      <div className="flex justify-center">
        <KaiSitting size={120} animated />
      </div>

      <PaperNote tone="honey" tilt="left" tape="right" padding="md" className="self-center">
        <p className="font-serif text-lg leading-snug text-on-surface">
          {firstName
            ? `Gusto mo bang i-secure ang AKBai mo, ${firstName}, gamit ang Face ID o fingerprint?`
            : 'Gusto mo bang i-secure ang AKBai gamit ang Face ID o fingerprint?'}
        </p>
        <p className="mt-2 text-xs text-on-surface-variant">
          Para mas ligtas — bago tayo magbukas ng app, kailangan namin ng mukha o
          fingerprint mo.
        </p>
      </PaperNote>

      {error && (
        <div
          className="bg-error-container/20 border border-on-error-container/20 rounded-2xl p-3"
          data-testid="biometric-step-error"
          role="alert"
        >
          <p className="text-on-error-container text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleEnable}
          disabled={busy}
          className="w-full bg-gradient-to-r from-honey to-honey-deep text-white font-semibold py-3.5 px-4 rounded-full shadow-ambient transition-all min-h-[48px] disabled:opacity-60"
          data-testid="biometric-step-enable-btn"
        >
          {busy ? 'Sandali lang...' : 'Sige, i-enable mo'}
        </button>
        <button
          type="button"
          onClick={handleSkip}
          disabled={busy}
          className="w-full text-on-surface-variant font-medium py-3 px-4 min-h-[44px] disabled:opacity-60"
          data-testid="biometric-step-skip-btn"
        >
          Skip muna
        </button>
      </div>
    </div>
  );
}
