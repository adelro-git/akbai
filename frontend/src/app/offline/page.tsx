/**
 * Offline Fallback Page
 * Feature: PWA Hardening (Sprint 5)
 * Role: Static page served by the service worker when network is unavailable.
 *       Shows Taglish message with retry button. Light theme, AKBai branding.
 */

import type { Metadata } from 'next';
import RetryButton from './retry-button';

export const metadata: Metadata = {
  title: 'Offline — AKBai',
};

export default function OfflinePage() {
  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center px-6 text-center bg-background"
    >
      {/* --- AKBai Logo / Brand Mark --- */}
      <div className="mb-6 text-4xl font-bold text-on-surface">
        AKBai
      </div>

      {/* --- Offline Icon --- */}
      <div className="mb-4 text-6xl" aria-hidden="true">
        📡
      </div>

      {/* --- Taglish Offline Message --- */}
      <h1
        className="mb-2 text-xl font-semibold text-on-surface"
      >
        Walang internet connection
      </h1>
      <p className="mb-8 text-base text-on-surface-variant">
        I-check ang WiFi o data mo, tapos i-refresh.
      </p>

      {/* --- Retry Button (client component) --- */}
      <RetryButton />
    </main>
  );
}
