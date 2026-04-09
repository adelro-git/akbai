import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import ProfileView from '@/components/profile/profile-view';
import { PageBackground } from '@/components/ui/page-background';

export const metadata: Metadata = {
  title: 'Profile — AKBai',
};

export default async function ProfilePage() {
  const supabase = await createClient();

  let userId: string;
  let email: string | null = null;

  // Use service client in dev mode to bypass RLS (no real auth session)
  const db = SKIP_AUTH ? createServiceClient() : supabase;

  if (SKIP_AUTH) {
    userId = DEV_USER.id;
    email = DEV_USER.email ?? 'dev@akbai.test';
  } else {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) redirect('/login');
    userId = user.id;
    email = user.email ?? null;
  }

  // Fetch user profile
  const { data: userData } = await db
    .from('users')
    .select('display_name')
    .eq('id', userId)
    .single();

  const displayName = userData?.display_name ?? null;

  // Fetch business profile
  const { data: profile } = await db
    .from('business_profiles')
    .select('business_name, business_type, income_range, bir_registered, bir_tax_type')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  const businessName = profile?.business_name ?? null;
  const businessType = profile?.business_type ?? null;
  const incomeRange = profile?.income_range ?? null;
  const birRegistered = profile?.bir_registered ?? false;
  const birTaxType = profile?.bir_tax_type ?? null;
  const profileVersion = 1;

  return (
    <PageBackground variant="profile">
    <div
      className="min-h-dvh pb-20"
      data-testid="profile-page"
    >
      <ProfileView
        displayName={displayName}
        email={email}
        businessName={businessName}
        businessType={businessType}
        incomeRange={incomeRange}
        birRegistered={birRegistered}
        birTaxType={birTaxType}
        profileVersion={profileVersion}
      />
    </div>
    </PageBackground>
  );
}
