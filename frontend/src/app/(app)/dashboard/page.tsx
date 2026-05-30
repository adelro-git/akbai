'use client';

// ============================================================
// /dashboard — Client Component (Sprint 15 Capacitor conversion)
//
// Per sprint-15-conversion-pattern.md §3 row 2 + Open Question 1:
// REAL fetch against /api/dashboard (extended to return the full
// Phase-7 hero/tiles/streak payload in Sprint 15). Spike used stubs;
// main wires real data so the first device build doesn't look broken.
//
// Conversions made vs server version:
//   - 'use client' directive
//   - Removed server createClient / createServiceClient / redirect / metadata
//   - Removed getTranslations(server) → useTranslations(client)
//   - All Supabase fetches + streak/morning-briefing computation moved
//     into /api/dashboard route; page fetches the assembled payload
//   - SKIP_AUTH bypass handled server-side in the API route
// ============================================================

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { SKIP_AUTH } from '@/lib/supabase/dev-auth';
import DashboardTracker from '@/components/dashboard/dashboard-tracker';
import DashboardCard from '@/components/dashboard/dashboard-card';
import CheckInSection from '@/components/dashboard/check-in-section';
import WelcomeTour from '@/components/onboarding/welcome-tour';
import KumustahanHero from '@/components/dashboard/kumustahan-hero';
import KuwentoCard from '@/components/dashboard/kuwento-card';
import WeeklyReconciliationCard from '@/components/dashboard/weekly-reconciliation-card';
import MonthlyReconciliationCard from '@/components/dashboard/monthly-reconciliation-card';
import { TrialCountdownBanner } from '@/components/subscription/trial-countdown-banner';
import { computeTrialState } from '@/lib/subscriptions/trial';
import { PageBackground } from '@/components/ui/page-background';
import type { StreakStatus } from '@/lib/streak/compute-streak';
import type { MorningTone } from '@/lib/morning-briefing/types';
import type { TimeOfDay } from '@/lib/timezone/time-of-day';

// ============================================================
// API response shape — mirrors /api/dashboard GET (extended Sprint 15).
// Only the Phase-7 fields are required for render; legacy fields are
// ignored here (kept on the API for back-compat with existing tests).
// ============================================================

interface ActionTile {
  id: string;
  titleKey: string;
  href: string;
  icon: string;
  emptyState: string;
  hasData: boolean;
  summary?: string;
}

interface DashboardCheckIn {
  id: string;
  mood: string | null;
  kai_greeting: string;
  check_in_date: string;
  sales_amount: number | null;
  expenses_amount: number | null;
}

interface DashboardPayload {
  userName: string;
  todayCheckIn: DashboardCheckIn | null;
  primaryPain: string | null;
  welcomeTourCompleted: boolean;
  initialTimeOfDay: TimeOfDay;
  aiTagline: string | null;
  aiTone: MorningTone | null;
  streak: number;
  streakStatus: StreakStatus;
  actionTiles: ActionTile[];
  subscription: { tier: string; status: string; started_at: string } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const t = useTranslations('home');

  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message_tl ?? 'May problema sa pagkuha ng data.');
        return;
      }
      setData(json.data as DashboardPayload);
    } catch {
      setError('Hindi makakonekta. I-check mo ang internet mo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function bootstrap() {
      if (!SKIP_AUTH) {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) {
          router.replace('/login');
          return;
        }
      }
      await fetchData();
    }
    bootstrap().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('dashboard bootstrap failed', err);
      setError('Hindi makapag-load. Subukan muli.');
      setLoading(false);
    });
  }, [router, fetchData]);

  if (loading) {
    return (
      <PageBackground variant="dashboard">
        <div className="min-h-dvh flex items-center justify-center text-on-surface-variant">
          Loading...
        </div>
      </PageBackground>
    );
  }

  if (error || !data) {
    return (
      <PageBackground variant="dashboard">
        <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
          <p className="text-destructive text-sm mb-2">{error ?? 'Walang data.'}</p>
          <button
            onClick={fetchData}
            type="button"
            className="text-primary text-sm font-semibold"
          >
            Subukan muli
          </button>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground variant="dashboard">
      {/* Phase 7 home shell — unified vertical rhythm (gap-[18px]) and
          py-6 / pb-24 to clear the 56px bottom-nav. PageBackground is a
          full-bleed wrapper, so max-w + mx-auto live here so the column
          stays centred on tablets and the gap rules apply uniformly. */}
      <div
        className="relative min-h-dvh max-w-[760px] mx-auto px-5 py-6 pb-24 flex flex-col gap-[18px]"
        data-testid="dashboard-page"
      >
        <DashboardTracker />
        <WelcomeTour
          primaryPain={data.primaryPain}
          firstName={data.userName}
          initiallyCompleted={data.welcomeTourCompleted}
        />

        {/* Trial countdown (Sprint 18 §11) — render while trialing OR expired so the
            day-7 paywall branch stays reachable if a lifecycle flips status to
            'expired'; the banner self-hides for paid tiers. */}
        {(data.subscription?.status === 'trialing' ||
          data.subscription?.status === 'expired') && (
          <TrialCountdownBanner
            trialState={computeTrialState(data.subscription.started_at)}
            tier={data.subscription.tier}
          />
        )}

        {/* Kumustahan hero */}
        <KumustahanHero
          userName={data.userName}
          initialTimeOfDay={data.initialTimeOfDay}
          aiTagline={data.aiTagline}
          aiTone={data.aiTone}
        />

        {/* Daily Check-In CTA or Summary (paper-note invite when not yet checked in) */}
        <CheckInSection
          todayCheckIn={data.todayCheckIn}
          streak={data.streak}
          streakStatus={data.streakStatus}
          userName={data.userName}
        />

        {/* 5-tile action grid */}
        <section aria-label="Home actions">
          <h2 className="font-serif text-lg font-semibold mb-3 text-on-surface">
            {t('actions.header')}
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
            {data.actionTiles.map((tile) => (
              <DashboardCard
                key={tile.id}
                title={t(`actions.${tile.titleKey}.title`)}
                description={t(`actions.${tile.titleKey}.description`)}
                href={tile.href}
                icon={tile.icon}
                emptyState={tile.emptyState}
                hasData={tile.hasData}
                summary={tile.summary}
              />
            ))}
          </div>
        </section>

        {/* Kuwento ng Linggo summary card */}
        <KuwentoCard />

        {/* Sprint 18 — data-completeness reconciliation (Build 5) */}
        <WeeklyReconciliationCard />
        <MonthlyReconciliationCard />

        {/* Closing — centered Fraunces italic 13px "— Kai" */}
        <footer className="text-center">
          <span className="font-serif italic text-[13px] text-on-surface-variant">— Kai</span>
        </footer>
      </div>
    </PageBackground>
  );
}
