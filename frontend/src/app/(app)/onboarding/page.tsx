'use client';

// ============================================================
// /onboarding — Client Component (Sprint 15 Capacitor conversion)
//
// Per sprint-15-conversion-pattern.md §3 row 14: fetches the existing
// GET /api/onboarding (returns OnboardingState). If the user has already
// completed onboarding, router.replace('/dashboard'). Translations move
// from server (getTranslations) to client (useTranslations).
// ============================================================

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { SKIP_AUTH } from '@/lib/supabase/dev-auth';
import OnboardingWizard from '@/components/onboarding/onboarding-wizard';
import { PageBackground } from '@/components/ui/page-background';
import { CapizPattern } from '@/components/illustrations/svg/decorative/CapizPattern';
import type { OnboardingState } from '@/lib/kilala-kita';

export default function OnboardingPage() {
  const router = useRouter();
  const t = useTranslations('onboarding');
  const [state, setState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/onboarding');
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message_tl ?? 'Hindi makuha ang onboarding data.');
        return;
      }
      const data = json.data as OnboardingState;
      // If onboarding is already done, route away — no point showing the
      // wizard again (preserves the server page's behaviour).
      if (data.onboarding_completed) {
        router.replace('/dashboard');
        return;
      }
      setState(data);
    } catch {
      setError('Hindi makakonekta. I-check mo ang internet mo.');
    } finally {
      setLoading(false);
    }
  }, [router]);

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
      await fetchState();
    }
    bootstrap().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('onboarding page bootstrap failed', err);
      setError('Hindi makapag-load. Subukan muli.');
      setLoading(false);
    });
  }, [router, fetchState]);

  if (loading) {
    return (
      <PageBackground variant="onboarding">
        <div className="min-h-dvh flex items-center justify-center text-on-surface-variant">
          Loading...
        </div>
      </PageBackground>
    );
  }

  if (error || !state) {
    return (
      <PageBackground variant="onboarding">
        <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
          <p className="text-destructive text-sm mb-2">{error ?? 'Walang data.'}</p>
          <button
            onClick={fetchState}
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
    <PageBackground variant="onboarding">
      <main className="relative min-h-dvh flex items-start justify-center pt-safe overflow-hidden">
        {/* W7 motif dial-down: one ambient layer per screen. CapizPattern is
            the onboarding ambient; the prior FloatingPetals second layer was
            removed (petals OR capiz, not both — design-system §6). */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <CapizPattern opacity={0.12} />
        </div>
        <div className="relative w-full max-w-lg tablet:max-w-2xl px-5 py-8">
          <header className="mb-6 text-center">
            <h1 className="text-3xl tablet:text-4xl font-extrabold tracking-tight text-on-surface">
              AKB<span className="font-serif italic font-medium text-honey-deep">ai</span>
            </h1>
            <p className="mt-1 font-serif italic text-honey-deep text-base tablet:text-lg">
              {t('tagline')}
            </p>
          </header>

          <OnboardingWizard initialState={state} />
        </div>
      </main>
    </PageBackground>
  );
}
