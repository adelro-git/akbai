import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { toManila, getManilaToday } from '@/lib/timezone';
import DashboardTracker from '@/components/dashboard/dashboard-tracker';
import KaiGreeting from '@/components/dashboard/kai-greeting';
import DashboardCard from '@/components/dashboard/dashboard-card';

export const metadata: Metadata = {
  title: 'Dashboard — AKBai',
};

// ============================================================
// Greeting Generator (server-side, time-of-day aware)
// ============================================================

function generateGreeting(name: string): string {
  const manila = toManila();
  const hour = manila.getUTCHours();

  if (hour >= 5 && hour < 12) {
    return `Magandang umaga, ${name}! Ang Umaga Mo ngayon...`;
  }
  if (hour >= 12 && hour < 18) {
    return `Magandang hapon, ${name}! Kumusta ang negosyo?`;
  }
  return `Magandang gabi, ${name}! Tara, check natin ang araw mo.`;
}

// ============================================================
// Dashboard Cards Definition
// ============================================================

interface CardDef {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  emptyState: string;
  hasData: boolean;
}

const DASHBOARD_CARDS: CardDef[] = [
  {
    id: 'resibo-scanner',
    title: 'Resibo Scanner',
    description: 'I-scan ang mga resibo mo',
    href: '/scan',
    icon: 'camera',
    emptyState: 'Mag-scan ng resibo para makapagsimula',
    hasData: false,
  },
  {
    id: 'saan-napunta',
    title: 'Saan Napunta?',
    description: 'Expenses at gastos mo',
    href: '/expenses',
    icon: 'wallet',
    emptyState: 'Wala pang data. Upload receipts muna!',
    hasData: false,
  },
  {
    id: 'bir-deadlines',
    title: 'BIR Deadlines',
    description: 'Tax calendar at reminders',
    href: '/deadlines',
    icon: 'calendar',
    emptyState: 'Wala pang tax calendar. I-setup natin!',
    hasData: false,
  },
  {
    id: 'quick-chat',
    title: 'Quick Chat with Kai',
    description: 'Kausapin si Kai',
    href: '/chat',
    icon: 'message-circle',
    emptyState: '',
    hasData: true,
  },
];

// ============================================================
// Page Component
// ============================================================

export default async function DashboardPage() {
  const supabase = await createClient();

  let userId: string;
  let userName = 'Boss';
  let businessName: string | null = null;
  let businessType: string | null = null;

  if (SKIP_AUTH) {
    userId = DEV_USER.id;
    userName = 'Boss';
    businessName = 'Dev Business';
    businessType = 'food_baking';
  } else {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) redirect('/login');

    userId = user.id;

    // Fetch user profile
    const { data: userData } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', userId)
      .single();

    userName = userData?.display_name ?? 'Boss';

    // Fetch business profile
    const { data: profile } = await supabase
      .from('business_profiles')
      .select('business_name, business_type')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    businessName = profile?.business_name ?? null;
    businessType = profile?.business_type ?? null;
  }

  // Check for today's check-in (non-critical, don't block render on error)
  if (!SKIP_AUTH) {
    const today = getManilaToday();
    // Pre-fetch but don't use yet — will power check-in UI in a future sprint
    await supabase
      .from('daily_check_in')
      .select('id, mood, kai_greeting, check_in_date')
      .eq('user_id', userId)
      .eq('check_in_date', today)
      .is('deleted_at', null)
      .single();
  }

  const greeting = generateGreeting(userName);

  return (
    <div
      className="min-h-dvh bg-background pb-20"
      data-testid="dashboard-page"
    >
      <DashboardTracker />

      {/* KA Greeting */}
      <KaiGreeting
        greeting={greeting}
        userName={userName}
        businessName={businessName}
        businessType={businessType}
      />

      {/* Dashboard Cards Grid */}
      <section className="px-4 pb-4" aria-label="Dashboard features">
        <div className="grid grid-cols-2 gap-3">
          {DASHBOARD_CARDS.map((card) => (
            <DashboardCard
              key={card.id}
              title={card.title}
              description={card.description}
              href={card.href}
              icon={card.icon}
              emptyState={card.emptyState}
              hasData={card.hasData}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
