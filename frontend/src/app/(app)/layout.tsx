import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import BottomNav from '@/components/dashboard/bottom-nav';
import SidebarNav from '@/components/dashboard/sidebar-nav';
import SessionGuard from '@/components/auth/session-guard';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';

export const metadata: Metadata = {
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AKBai',
  },
};

// ============================================================
// (app) layout — sidebar (≥ 860px tablet:) + bottom nav (< 860px),
// PWA enabled. Phase 5: fetches persona data server-side and
// pipes it into SidebarNav so the persona pill renders without
// a client-side round trip.
// ============================================================

interface BusinessProfileRow {
  business_name: string | null;
  business_type: string | null;
}

interface UserRow {
  display_name: string | null;
}

const KNOWN_BUSINESS_TYPES = [
  'food_baking',
  'online_selling',
  'freelance_creative',
  'sari_sari_retail',
  'food_carinderia',
  'service_salon',
  'other',
] as const;
type KnownBusinessType = (typeof KNOWN_BUSINESS_TYPES)[number];

function isKnownBusinessType(value: string | null): value is KnownBusinessType {
  return value !== null && (KNOWN_BUSINESS_TYPES as readonly string[]).includes(value);
}

async function loadPersona(): Promise<{ name: string | null; tagline: string | null }> {
  const t = await getTranslations('nav');

  let userId: string | null = null;
  let supabaseClient: Awaited<ReturnType<typeof createClient>> | null = null;

  if (SKIP_AUTH) {
    userId = DEV_USER.id;
  } else {
    supabaseClient = await createClient();
    const { data } = await supabaseClient.auth.getUser();
    userId = data.user?.id ?? null;
  }

  if (!userId) {
    return { name: null, tagline: null };
  }

  const db = SKIP_AUTH || !supabaseClient ? createServiceClient() : supabaseClient;

  const { data: userData } = await db
    .from('users')
    .select('display_name')
    .eq('id', userId)
    .maybeSingle<UserRow>();

  const { data: profile } = await db
    .from('business_profiles')
    .select('business_name, business_type')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle<BusinessProfileRow>();

  const name = profile?.business_name ?? userData?.display_name ?? null;

  let tagline: string | null = null;
  if (profile?.business_type) {
    const raw = profile.business_type;
    if (raw.startsWith('other:')) {
      tagline = raw.slice('other:'.length).trim() || t('businessTypeLabel.other');
    } else if (isKnownBusinessType(raw)) {
      tagline = t(`businessTypeLabel.${raw}`);
    }
  }

  return { name, tagline };
}

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const persona = await loadPersona();

  return (
    <>
      <SessionGuard />
      <SidebarNav persona={persona} />
      <div className="tablet:ml-60">{children}</div>
      <BottomNav />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `,
        }}
      />
    </>
  );
}
