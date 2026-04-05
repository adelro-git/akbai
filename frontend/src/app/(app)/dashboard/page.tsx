import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { toManila, getManilaToday } from '@/lib/timezone';
import DashboardTracker from '@/components/dashboard/dashboard-tracker';
import KaiGreeting from '@/components/dashboard/kai-greeting';
import DashboardCard from '@/components/dashboard/dashboard-card';
import CheckInSection from '@/components/dashboard/check-in-section';
import WelcomeTour from '@/components/onboarding/welcome-tour';
import MorningBriefingCard from '@/components/dashboard/morning-briefing-card';
import { PageBackground } from '@/components/ui/page-background';

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
  nextDeadlineDate: string | null;
  overdueCount: number;
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
      hasData: data.birRegistered || data.nextDeadlineDate !== null,
      summary: data.overdueCount > 0
        ? `${data.overdueCount} overdue!`
        : data.nextDeadlineDate
          ? `Next: ${data.nextDeadlineDate}`
          : data.birRegistered
            ? 'BIR: Registered'
            : undefined,
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
      emptyState: 'I-record ang gastos mo para makita dito!',
      hasData: data.expenseCount > 0,
      summary: data.expenseCount > 0
        ? `${data.expenseCount} transactions`
        : undefined,
    },
    {
      id: 'reply-drafter',
      title: 'Reply Drafter',
      description: 'Draft reply sa customer mo',
      href: '/reply-drafter',
      icon: 'message-square',
      emptyState: 'I-draft ni Kai ang reply mo',
      hasData: true,
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
  let primaryPain: string | null = null;

  // --- Data for dashboard cards ---
  let conversationCount = 0;
  let birRegistered = false;
  let expenseCount = 0;
  let nextDeadlineDate: string | null = null;
  let overdueCount = 0;

  // --- Check-in data (Task 1) ---
  let todayCheckIn: {
    id: string;
    mood: string | null;
    kai_greeting: string;
    check_in_date: string;
    sales_amount: number | null;
    expenses_amount: number | null;
  } | null = null;

  // Use service client in dev mode to bypass RLS (no real auth session)
  const db = SKIP_AUTH ? createServiceClient() : supabase;

  if (SKIP_AUTH) {
    userId = DEV_USER.id;
  } else {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) redirect('/login');
    userId = user.id;
  }

  // Fetch user profile
  const { data: userData } = await db
    .from('users')
    .select('display_name')
    .eq('id', userId)
    .single();

  userName = userData?.display_name ?? 'Boss';

  // Fetch business profile (includes bir_registered for card wiring)
  const { data: profile } = await db
    .from('business_profiles')
    .select('business_name, business_type, bir_registered, primary_pain')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  businessName = profile?.business_name ?? null;
  businessType = profile?.business_type ?? null;
  birRegistered = profile?.bir_registered === true;
  primaryPain = profile?.primary_pain ?? null;

  // --- Fetch today's check-in ---
  const today = getManilaToday();
  const { data: checkInData } = await db
    .from('daily_check_in')
    .select('id, mood, kai_greeting, check_in_date, sales_amount, expenses_amount')
    .eq('user_id', userId)
    .eq('check_in_date', today)
    .is('deleted_at', null)
    .single();

  todayCheckIn = checkInData ?? null;

  // --- Fetch conversation count for Quick Chat card ---
  const { count } = await db
    .from('ka_conversations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('deleted_at', null);

  conversationCount = count ?? 0;

  // --- Fetch this month's transaction count for Saan Napunta card ---
  const currentMonth = today.slice(0, 7); // YYYY-MM
  const monthStart = `${currentMonth}-01`;
  const [y, m] = currentMonth.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const monthEnd = `${currentMonth}-${String(lastDay).padStart(2, '0')}`;

  const { count: txCount } = await db
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('deleted_at', null)
    .gte('transaction_date', monthStart)
    .lte('transaction_date', monthEnd);

  expenseCount = txCount ?? 0;

  // --- Fetch deadline summary for BIR Deadlines card (Build 6) ---
  const { data: nextDeadline } = await db
    .from('bir_deadlines')
    .select('due_date')
    .eq('user_id', userId)
    .eq('status', 'upcoming')
    .is('deleted_at', null)
    .gte('due_date', today)
    .order('due_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (nextDeadline?.due_date) {
    const d = new Date(nextDeadline.due_date + 'T00:00:00');
    nextDeadlineDate = d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  }

  const { count: odCount } = await db
    .from('bir_deadlines')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'upcoming')
    .is('deleted_at', null)
    .lt('due_date', today);

  overdueCount = odCount ?? 0;

  const greeting = generateGreeting(userName);
  const dashboardCards = getDashboardCards({ conversationCount, birRegistered, expenseCount, nextDeadlineDate, overdueCount });

  return (
    <PageBackground variant="dashboard">
    <div
      className="min-h-dvh bg-background pb-20 md:pb-6"
      data-testid="dashboard-page"
    >
      <DashboardTracker />
      <WelcomeTour primaryPain={primaryPain} firstName={userName} />

      {/* Kai Greeting */}
      <KaiGreeting
        greeting={greeting}
        userName={userName}
        businessName={businessName}
        businessType={businessType}
      />

      {/* Morning Briefing — prominently placed above check-in (Build 5) */}
      <MorningBriefingCard />

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
    </PageBackground>
  );
}
