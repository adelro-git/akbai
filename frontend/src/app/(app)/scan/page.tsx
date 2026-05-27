'use client';

/**
 * Resibo Scanner — Client Component (Sprint 15 Capacitor conversion)
 *
 * Per sprint-15-conversion-pattern.md §3 row 4 + Open Question 2:
 * OCR_ENABLED feature-flag gate is REMOVED for Sprint 15. FLAGS.OCR_ENABLED
 * is server-only; building a dedicated /api/feature-flags/[key] GET surface
 * for one tile-gate is out of scope. Always render ScannerFlow.
 *
 * TODO(sprint-16): wire client-side OCR_ENABLED gate via a new
 * /api/feature-flags route (returns { enabled: boolean } per key for the
 * authenticated user).
 *
 * Conversions made vs server version:
 *   - 'use client' directive
 *   - Removed server createClient + redirect + Metadata
 *   - Removed getFeatureFlag (OCR gate)
 *   - Auth check moved into useEffect using browser supabase client
 *   - redirect('/login') → router.replace('/login')
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SKIP_AUTH } from '@/lib/supabase/dev-auth';
import { PageBackground } from '@/components/ui/page-background';
import { ScannerFlow } from '@/components/scanner/scanner-flow';

export default function ScanPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function gate() {
      if (SKIP_AUTH) {
        setReady(true);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace('/login');
        return;
      }
      setReady(true);
    }

    gate().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('scan page bootstrap failed', err);
      router.replace('/login');
    });
  }, [router]);

  if (!ready) {
    return (
      <PageBackground variant="scan">
        <div className="min-h-dvh flex items-center justify-center text-on-surface-variant">
          Loading...
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground variant="scan">
      <ScannerFlow />
    </PageBackground>
  );
}
