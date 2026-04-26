import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import OnboardingWizard from '@/components/onboarding/onboarding-wizard';
import { PageBackground } from '@/components/ui/page-background';
import { CapizPattern } from '@/components/illustrations/svg/decorative/CapizPattern';
import { FloatingPetals } from '@/components/illustrations/svg/decorative/FloatingPetals';
import type { OnboardingState } from '@/lib/kilala-kita';

export const metadata: Metadata = {
  title: 'Kilala Kita — AKBai',
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const t = await getTranslations('onboarding');

  let user;
  if (SKIP_AUTH) {
    user = DEV_USER;
  } else {
    const { data } = await supabase.auth.getUser();
    user = data.user;
    if (!user) redirect('/login');
  }

  // Fetch onboarding state
  const { data: userData } = await supabase
    .from('users')
    .select('display_name, primary_pain, bir_consent, onboarding_step, onboarding_completed')
    .eq('id', user.id)
    .single();

  if (userData?.onboarding_completed) {
    redirect('/dashboard');
  }

  const { data: profile } = await supabase
    .from('business_profiles')
    .select('business_type, income_range')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single();

  const state: OnboardingState = {
    onboarding_step: userData?.onboarding_step ?? 0,
    onboarding_completed: false,
    display_name: userData?.display_name ?? null,
    business_type: profile?.business_type ?? null,
    income_range: profile?.income_range ?? null,
    primary_pain: userData?.primary_pain ?? null,
    bir_consent: userData?.bir_consent ?? null,
  };

  return (
    <PageBackground variant="onboarding">
      <main className="relative min-h-dvh flex items-start justify-center pt-safe overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <CapizPattern opacity={0.12} />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <FloatingPetals count={6} />
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
