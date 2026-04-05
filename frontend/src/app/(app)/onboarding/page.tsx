import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import OnboardingWizard from '@/components/onboarding/onboarding-wizard';
import type { OnboardingState } from '@/lib/kilala-kita';

export const metadata: Metadata = {
  title: 'Kilala Kita — AKBai',
};

export default async function OnboardingPage() {
  const supabase = await createClient();

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

  // Already completed — go to dashboard
  if (userData?.onboarding_completed) {
    redirect('/dashboard');
  }

  // Fetch business profile if exists
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
    <main className="min-h-dvh bg-background flex items-start justify-center pt-safe">
      <div className="w-full max-w-lg md:max-w-2xl px-5 py-8">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-on-surface">
            AKB<span className="text-primary-container">ai</span>
          </h1>
          <p className="text-outline text-base md:text-lg mt-1">Kilala Kita</p>
        </div>

        <OnboardingWizard initialState={state} />
      </div>
    </main>
  );
}
