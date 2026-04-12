/**
 * Resibo Scanner — Server Page
 * Feature: Resibo Scanner (Build 3)
 * Role: Entry point for the scan flow. Performs auth check and
 *       OCR_ENABLED feature flag gate server-side before rendering
 *       the client-side ScannerFlow orchestrator.
 *
 * Flow: Auth -> Feature flag check -> Render ScannerFlow (client)
 *
 * Dependencies: Supabase auth, feature flags, ScannerFlow component
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { getFeatureFlag } from '@/lib/feature-flags';
import { FLAGS } from '@/lib/feature-flags/flags';
import { PageBackground } from '@/components/ui/page-background';
import { ScannerFlow } from '@/components/scanner/scanner-flow';

export const metadata: Metadata = {
  title: 'Resibo Scanner — AKBai',
};

// ============================================================
// Feature Gated State — shown when OCR is disabled for the user
// ============================================================

function FeatureGated() {
  return (
    <PageBackground variant="scan">
      <div className="min-h-dvh flex items-center justify-center px-4">
        <div className="bg-surface-container-low rounded-2xl p-6 text-center max-w-sm">
          <p className="text-on-surface font-semibold text-base mb-2">
            Hindi pa available ang Resibo Scanner
          </p>
          <p className="text-on-surface-variant text-sm mb-4">
            Malapit na! Abangan ang feature na ito sa susunod na update.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 min-h-[44px] bg-primary-container text-on-primary font-semibold rounded-xl px-5 py-2.5"
          >
            Bumalik sa Dashboard
          </a>
        </div>
      </div>
    </PageBackground>
  );
}

// ============================================================
// Page Component
// ============================================================

export default async function ScanPage() {
  // --- Auth Check ---
  const supabase = await createClient();

  let userId: string;

  if (SKIP_AUTH) {
    userId = DEV_USER.id;
  } else {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) redirect('/login');
    userId = user.id;
  }

  // --- Feature Flag Gate: OCR_ENABLED ---
  const ocrEnabled = await getFeatureFlag(userId, FLAGS.OCR_ENABLED);
  if (!ocrEnabled) {
    return <FeatureGated />;
  }

  // --- Render Scanner Flow ---
  return (
    <PageBackground variant="scan">
      <ScannerFlow />
    </PageBackground>
  );
}
