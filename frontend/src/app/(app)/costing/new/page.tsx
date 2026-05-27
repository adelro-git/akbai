'use client';

/**
 * Bagong Costing Card — Create page (Sprint 15 Capacitor conversion)
 *
 * Renders the CostingCardForm in create mode. Adds the per-page client
 * auth gate so the surface no longer relies on the (app) layout doing
 * server-side auth.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CostingCardForm from '@/components/costing/costing-card-form';
import { createClient } from '@/lib/supabase/client';
import { SKIP_AUTH } from '@/lib/supabase/dev-auth';

export default function NewCostingCardPage() {
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
      console.error('new costing page auth gate failed', err);
      router.replace('/login');
    });
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-dvh pb-20 px-4 pt-5">
        <p className="text-on-surface-variant text-sm text-center py-10">Loading...</p>
      </div>
    );
  }

  return (
    <div data-testid="new-costing-page">
      <CostingCardForm />
    </div>
  );
}
