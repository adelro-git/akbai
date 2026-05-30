'use client';

// ============================================================
// /deadlines — Client Component (Sprint 15 Capacitor conversion)
//
// Per sprint-15-conversion-pattern.md §3 row 9: page does no server work
// of its own — it just renders <DeadlineList /> which fetches its own
// data client-side. Conversion = add `'use client'` + auth gate, remove
// Metadata export.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SKIP_AUTH } from '@/lib/supabase/dev-auth';
import DeadlineList from '@/components/deadlines/deadline-list';
import DeferredPushPrompt from '@/components/push/deferred-prompt';
import { PageBackground } from '@/components/ui/page-background';
import { IconKalendaryo } from '@/components/illustrations/icons';

export default function DeadlinesPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  // Sprint 16: imminent-deadline signal drives the native-push deferred-prompt
  // card (architect §3 Open Q 2 recommendation (a)). DeferredPushPrompt owns
  // its own native+localStorage gating; this page just forwards the signal.
  const [hasImminentDeadline, setHasImminentDeadline] = useState(false);
  const handleImminentSignal = useCallback((value: boolean) => {
    setHasImminentDeadline(value);
  }, []);

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
      console.error('deadlines page bootstrap failed', err);
      router.replace('/login');
    });
  }, [router]);

  if (!ready) {
    return (
      <PageBackground variant="deadlines">
        <div className="min-h-dvh flex items-center justify-center text-on-surface-variant">
          Loading...
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground variant="deadlines">
      <div
        className="min-h-dvh pb-24 max-w-[760px] mx-auto px-4 py-6"
        data-testid="deadlines-page"
      >
        {/* ── Screen header ── */}
        <header className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-honey-deep" aria-hidden>
              <IconKalendaryo size={28} />
            </span>
            <span className="text-[10px] font-extrabold tracking-[0.08em] text-honey-deep">
              BIR DEADLINES
            </span>
          </div>
          <h1 className="wp-h1 mb-1" data-testid="deadlines-h1">
            Hindi ka mahuhuli kay Kai.
          </h1>
          <p className="text-[13px] text-ink-soft">
            Automatic na paalala bago ang due date.
          </p>
        </header>

        {/* ── BIR disclaimer banner — voice manual §3 canonical ── */}
        <div
          className="mb-5 rounded-xl bg-honey-cream/40 px-4 py-2.5"
          data-testid="deadlines-disclaimer"
          role="status"
          aria-label="BIR disclaimer"
        >
          <p className="text-[11px] text-ink-soft leading-snug">
            Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo.
          </p>
        </div>

        {/* ── Sprint 16: native push deferred-prompt (renders only when
              Capacitor.isNativePlatform() AND at least one deadline ≤ 14 days
              AND localStorage flag absent — see DeferredPushPrompt for the
              full decision logic). ── */}
        <DeferredPushPrompt hasImminentDeadline={hasImminentDeadline} />

        {/* ── Deadline list (client) ── */}
        <DeadlineList onImminentDeadlineSignal={handleImminentSignal} />
      </div>
    </PageBackground>
  );
}
