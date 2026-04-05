/**
 * Offline Fallback Page
 * Feature: PWA Hardening (Sprint 5)
 * Role: Static page served by the service worker when network is unavailable.
 *       Shows Taglish message with retry button. Light theme, AKBai branding.
 */

import type { Metadata } from 'next';
import { IllustrationWrapper } from '@/components/illustrations/IllustrationWrapper';
import { PageBackground } from '@/components/ui/page-background';
import RetryButton from './retry-button';

export const metadata: Metadata = {
  title: 'Offline — AKBai',
};

export default function OfflinePage() {
  return (
    <PageBackground variant="offline">
    <main
      className="flex min-h-dvh flex-col items-center justify-center px-6 text-center bg-background"
    >
      {/* --- AKBai Logo / Brand Mark --- */}
      <div className="mb-6 text-4xl font-bold text-on-surface">
        AKBai
      </div>

      {/* --- Offline Illustration --- */}
      <div className="mb-4">
        <IllustrationWrapper
          src="status/offline.webp"
          alt="Walang internet connection"
          category="status"
          width={240}
          height={180}
        />
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
    </PageBackground>
  );
}
