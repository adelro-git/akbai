import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { toManila, getManilaToday } from '@/lib/timezone';
import DashboardTracker from '@/components/dashboard/dashboard-tracker';
import KaiGreeting from '@/components/dashboard/kai-greeting';
import DashboardCard from '@/components/dashboard/dashboard-card';
import CheckInSection from '@/components/dashboard/check-in-section';

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
// Dashboard Cards Definition — dynamic based on actual user data
// ============================================================

interface CardDef {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  emptyState: string;
  hasData: boolean;
  summary?: string;
}

interface DashboardData {
  conversationCount: number;
  birRegistered: boolean;
  expenseCount: number;
}

function getDashboardCards(data: DashboardData): CardDef[] {
  return [
    {
      id: 'quick-chat',
      title: 'Quick Chat with Kai',
      description: 'Kausapin si Kai',
      href: '/chat',
      icon: 'message-circle',
      emptyState: '',
      hasData: true,
      summary: data.conversationCount > 0 ? `${data.conversationCount} messages` : undefined,
    },
    {
      id: 'bir-deadlines',
      title: 'BIR Deadlines',
      description: 'Tax calendar at reminders',
      href: '/deadlines',
      icon: 'calendar',
      emptyState: 'Wala pang tax calendar. I-setup natin!',
      hasData: data.birRegistered,
      summary: data.birRegistered ? 'BIR: Registered' : undefined,
    },
    {
      id: 'resibo-scanner',
      title: 'Resibo Scanner',
      description: 'I-scan ang mga resibo mo',
      href: '/scan',
      icon: 'camera',
      emptyState: 'Mag-scan ng resibo para makapagsimula',
      hasData: false, // Build 3 scope
    },
    {
      id: 'saan-napunta',
      title: 'Saan Napunta?',
      description: 'Expenses at gastos mo',
      href: '/expenses',
      icon: 'wallet',
      emptyState: 'Wala pang data. Upload receipts muna!',
      hasData: false, // Build 4 scope
    },
  ];
}

// ============================================================
// Page Component
// ============================================================

export default async function DashboardPage() {
  const supabase = await createClient();

  let userId: string;
  let userName = 'Boss';
  let businessName: string | null = null;
  let businessType: string | null = null;

  // --- Data for dashboard cards (Task 2) ---
  let conversationCount = 0;
  let birRegistered = false;

  // --- Check-in data (Task 1) ---
  let todayCheckIn: {
    id: string;
    mood: string | null;
    kai_greeting: string;
    check_in_date: string;
    sales_amount: number | null;
    expenses_amount: number | null;
  } | null = null;

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

    // Fetch business profile (includes bir_registered for card wiring)
    const { data: profile } = await supabase
      .from('business_profiles')
      .select('business_name, business_type, bir_registered')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    businessName = profile?.business_name ?? null;
    businessType = profile?.business_type ?? null;
    birRegistered = profile?.bir_registered === true;

    // --- Fetch today's check-in (now captured and used) ---
    const today = getManilaToday();
    const { data: checkInData } = await supabase
      .from('daily_check_in')
      .select('id, mood, kai_greeting, check_in_date, sales_amount, expenses_amount')
      .eq('user_id', userId)
      .eq('check_in_date', today)
      .is('deleted_at', null)
      .single();

    todayCheckIn = checkInData ?? null;

    // --- Fetch conversation count for Quick Chat card ---
    const { count } = await supabase
      .from('ka_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null);

    conversationCount = count ?? 0;
  }

  const greeting = generateGreeting(userName);
  const dashboardCards = getDashboardCards({ conversationCount, birRegistered });

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

      {/* Daily Check-In CTA or Summary */}
      <CheckInSection todayCheckIn={todayCheckIn} />

      {/* Dashboard Cards Grid */}
      <section className="px-4 pb-4" aria-label="Dashboard features">
        <div className="grid grid-cols-2 gap-3">
          {dashboardCards.map((card) => (
            <DashboardCard
              key={card.id}
              title={card.title}
              description={card.description}
              href={card.href}
              icon={card.icon}
              emptyState={card.emptyState}
              hasData={card.hasData}
              summary={card.summary}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
