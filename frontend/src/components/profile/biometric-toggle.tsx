'use client';

/**
 * BiometricToggle — Profile section that lets the user enable/disable
 * Face ID / fingerprint as a second factor on app open.
 *
 * Feature: Biometric Second Factor (Sprint 16, Gap G4 mitigation)
 * Role: Optional second-factor opt-in surface inside /profile. Default off.
 *       Visible on every platform (web + native), but the enable action is
 *       blocked on web — there's no Web Authentication path in scope for
 *       Sprint 16. On web, the section renders an explanatory note instead
 *       of the toggle.
 *
 * Architect reference: sprint-16-native-plugin-pattern.md §4 (Profile toggle).
 */

import { useEffect, useState } from 'react';
import { Fingerprint } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import {
  isBiometricSupported,
  enableBiometric,
  disableBiometric,
} from '@/lib/capacitor/biometric';

interface BiometricToggleProps {
  /** Initial state from the /api/profile GET. */
  initialEnabled: boolean;
  /** Audit trail timestamp (server-derived; UTC ISO). */
  initialSetupAt: string | null;
}

export default function BiometricToggle({
  initialEnabled,
  initialSetupAt,
}: BiometricToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [setupAt, setSetupAt] = useState<string | null>(initialSetupAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);

  // --- On mount: check whether device supports + has biometric enrolled ---
  useEffect(() => {
    let cancelled = false;
    async function check() {
      const ok = await isBiometricSupported();
      if (!cancelled) setSupported(ok);
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  // ----------------------------------------------------------
  // Web branch — feature is native-only. Render an informative note
  // INSTEAD of the toggle so the user knows the option exists in the
  // app. No CTA — there's nothing to do here on web.
  // ----------------------------------------------------------
  if (!Capacitor.isNativePlatform()) {
    return (
      <section
        className="bg-surface-container rounded-2xl p-4"
        aria-label="Biometric settings"
        data-testid="section-biometric"
      >
        <div className="flex items-center gap-2 mb-2">
          <Fingerprint className="w-5 h-5 text-primary-container" />
          <h2 className="text-base font-semibold text-on-surface">Biometric</h2>
        </div>
        <p className="text-xs text-on-surface-variant" data-testid="biometric-web-note">
          Para ma-secure mo ang account mo gamit ang Face ID o fingerprint,
          i-install mo muna ang AKBai sa Android o iOS.
        </p>
      </section>
    );
  }

  const handleToggle = async () => {
    setBusy(true);
    setError(null);

    if (!enabled) {
      // ENABLE — calls enableBiometric() which re-verifies via biometric
      // BEFORE persisting (architect §4: confirm muna namin bago i-save).
      const result = await enableBiometric();
      if (!result.success) {
        setError(result.error ?? 'Hindi nag-match. Subukan mo ulit.');
        setBusy(false);
        return;
      }
      setEnabled(true);
      // The server stamps biometric_setup_at; we mirror it client-side as
      // a best-effort label. A real source-of-truth refresh would re-GET
      // /api/profile, but the timestamp here is purely cosmetic.
      setSetupAt(new Date().toISOString());
      setBusy(false);
      return;
    }

    // DISABLE — no biometric re-prompt (user already passed app-open guard).
    const result = await disableBiometric();
    if (!result.success) {
      setError(result.error ?? 'Hindi ma-save. Subukan muli.');
      setBusy(false);
      return;
    }
    setEnabled(false);
    setSetupAt(null);
    setBusy(false);
  };

  return (
    <section
      className="bg-surface-container rounded-2xl p-4"
      aria-label="Biometric settings"
      data-testid="section-biometric"
    >
      <div className="flex items-center gap-2 mb-3">
        <Fingerprint className="w-5 h-5 text-primary-container" />
        <h2 className="text-base font-semibold text-on-surface">Biometric</h2>
      </div>

      {supported === false && (
        <p className="text-xs text-on-surface-variant mb-3">
          Walang naka-enroll na biometric sa device mo. I-setup muna ang Face ID o
          fingerprint sa Settings ng phone mo.
        </p>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-on-surface">
            Gamitin ang Face ID o fingerprint
          </p>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Bago tayo magbukas ng AKBai, kailangan namin ng mukha o fingerprint mo.
          </p>
          {enabled && setupAt && (
            <p
              className="text-[11px] text-on-surface-variant mt-1"
              data-testid="biometric-setup-at"
            >
              Naka-enable mula {formatSetupAt(setupAt)}.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={busy || supported === false}
          aria-pressed={enabled}
          aria-label={enabled ? 'I-off ang biometric' : 'I-on ang biometric'}
          data-testid="biometric-toggle"
          className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors min-w-[44px] min-h-[44px] justify-center disabled:opacity-50 ${
            enabled ? 'bg-honey-deep' : 'bg-surface-container-high'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-2.5' : '-translate-x-2.5'
            }`}
          />
        </button>
      </div>

      {error && (
        <p
          className="mt-2 text-xs text-red-600"
          role="alert"
          data-testid="biometric-error"
        >
          {error}
        </p>
      )}
    </section>
  );
}

// ============================================================
// Helper — render the setup timestamp as a Manila-local date.
// We don't reach for date-fns here; this is a one-shot label.
// ============================================================

function formatSetupAt(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleDateString('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}
