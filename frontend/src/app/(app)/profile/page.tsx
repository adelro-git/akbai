import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import ProfileView from '@/components/profile/profile-view';

export const metadata: Metadata = {
  title: 'Profile — AKBai',
};

export default async function ProfilePage() {
  const supabase = await createClient();

  let displayName: string | null = null;
  let email: string | null = null;
  let businessName: string | null = null;
  let businessType: string | null = null;
  let incomeRange: string | null = null;
  let birRegistered = false;
  let profileVersion = 1;

  if (SKIP_AUTH) {
    displayName = 'Boss';
    email = DEV_USER.email ?? 'dev@akbai.test';
    businessName = 'Dev Business';
    businessType = 'food_baking';
    incomeRange = 'below_50k';
    birRegistered = false;
    profileVersion = 1;
  } else {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) redirect('/login');

    email = user.email ?? null;

    // Fetch user profile
    const { data: userData } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', user.id)
      .single();

    displayName = userData?.display_name ?? null;

    // Fetch business profile
    const { data: profile } = await supabase
      .from('business_profiles')
      .select('business_name, business_type, income_range, bir_registered, profile_version')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    businessName = profile?.business_name ?? null;
    businessType = profile?.business_type ?? null;
    incomeRange = profile?.income_range ?? null;
    birRegistered = profile?.bir_registered ?? false;
    profileVersion = profile?.profile_version ?? 1;
  }

  return (
    <div
      className="min-h-dvh bg-background pb-20"
      data-testid="profile-page"
    >
      <ProfileView
        displayName={displayName}
        email={email}
        businessName={businessName}
        businessType={businessType}
        incomeRange={incomeRange}
        birRegistered={birRegistered}
        profileVersion={profileVersion}
      />
    </div>
  );
}
