import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { toManila, getManilaToday } from '@/lib/timezone';
import DashboardTracker from '@/components/dashboard/dashboard-tracker';
import DashboardCard from '@/components/dashboard/dashboard-card';
import CheckInSection from '@/components/dashboard/check-in-section';
import WelcomeTour from '@/components/onboarding/welcome-tour';
import KumustahanHero from '@/components/dashboard/kumustahan-hero';
import { computeTimeOfDay } from '@/lib/timezone/time-of-day';
import KuwentoCard from '@/components/dashboard/kuwento-card';
import FloatingPetalsLayer from '@/components/dashboard/floating-petals-layer';
import { PageBackground } from '@/components/ui/page-background';
import { WovenDivider } from '@/components/illustrations/svg/decorative/WovenDivider';
import { computeStreak } from '@/lib/streak/compute-streak';
import { pickTone } from '@/lib/morning-briefing/tone';
import { pickFallback } from '@/lib/morning-briefing/fallback-templates';
import type { MorningTone } from '@/lib/morning-briefing/types';

export const metadata: Metadata = {
  title: 'Home — AKBai',
};

// ============================================================
// Phase 7 Home — flagship layout per
// design_handoff_akbai_redesign/synthesis/screens/00-home.md
//
// Top-to-bottom inside <PageBackground variant="dashboard">:
//   <DashboardTracker />
//   <WelcomeTour />
//   <KumustahanHero />               (KaiSitting + greeting + Squiggle + CapizPattern)
//   <CheckInSection />               (PaperNote invite or summary, streak-aware)
//   <section> action-grid header + 5-tile grid </section>
//   <WovenDivider />
//   <KuwentoCard />                  (KPI / banig chart / takeaway / footer link)
//   <footer> centered Fraunces italic 13px "— Kai" </footer>
//   <FloatingPetalsLayer />          (Q2 deferral — static day 0, animated day 2+)
//
// Hicks's law: exactly 5 action tiles, fixed order. No feature-flag gates.
// ============================================================

// ============================================================
// 5-tile action grid — locked order per Phase 7 spec §2 home
// (Scan resibo / Kausap si Kai / BIR paalala / Tamang presyo / Mga invoice).
// ============================================================

interface CardDef {
  id: string;
  /** i18n key under home.actions.<key> — both `.title` and `.description` are read from messages. */
  titleKey: string;
  href: string;
  icon: string; // ICON_MAP key in dashboard-card.tsx
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
  costingCardCount: number;
  invoicePendingCount: number;
  invoiceOverdueCount: number;
}

function buildActionTiles(data: DashboardData): CardDef[] {
  return [
    {
      id: 'scan-resibo',
      titleKey: 'scanResibo',
      href: '/scan',
      icon: 'resibo',
      emptyState: 'Mag-scan ng resibo para makapagsimula',
      hasData: false,
    },
    {
      id: 'kausap-kai',
      titleKey: 'kausapKai',
      href: '/chat',
      icon: 'usap',
      emptyState: '',
      hasData: true,
      summary:
        data.conversationCount > 0 ? `${data.conversationCount} messages` : undefined,
    },
    {
      id: 'bir-paalala',
      titleKey: 'birPaalala',
      href: '/deadlines',
      icon: 'kalendaryo',
      emptyState: 'Wala pang tax calendar. I-setup natin!',
      hasData: data.birRegistered || data.nextDeadlineDate !== null,
      summary:
        data.overdueCount > 0
          ? `${data.overdueCount} overdue!`
          : data.nextDeadlineDate
            ? `Next: ${data.nextDeadlineDate}`
            : data.birRegistered
              ? 'BIR: Registered'
              : undefined,
    },
    {
      id: 'tamang-presyo',
      titleKey: 'tamangPresyo',
      href: '/costing',
      icon: 'precio',
      emptyState: 'Alamin ang totoong gastos ng produkto mo!',
      hasData: data.costingCardCount > 0,
      summary:
        data.costingCardCount > 0
          ? `${data.costingCardCount} costing card${data.costingCardCount !== 1 ? 's' : ''}`
          : undefined,
    },
    {
      id: 'mga-invoice',
      titleKey: 'mgaInvoice',
      href: '/invoices',
      icon: 'invoice',
      emptyState: 'Gumawa ng invoice para sa mga customer mo!',
      hasData: data.invoicePendingCount > 0 || data.invoiceOverdueCount > 0,
      summary:
        data.invoiceOverdueCount > 0
          ? `${data.invoiceOverdueCount} overdue!`
          : data.invoicePendingCount > 0
            ? `${data.invoicePendingCount} pending`
            : undefined,
    },
  ];
}

// ============================================================
// Page Component
// ============================================================

export default async function DashboardPage() {
  const supabase = await createClient();
  const t = await getTranslations('home');

  let userId: string;
  let userName = 'Boss';
  let primaryPain: string | null = null;
  let welcomeTourCompleted = false;

  // --- Data for action-grid summaries ---
  let conversationCount = 0;
  let birRegistered = false;
  let expenseCount = 0;
  let nextDeadlineDate: string | null = null;
  let overdueCount = 0;
  let invoicePendingCount = 0;
  let invoiceOverdueCount = 0;

  // --- Check-in data ---
  let todayCheckIn: {
    id: string;
    mood: string | null;
    kai_greeting: string;
    check_in_date: string;
    sales_amount: number | null;
    expenses_amount: number | null;
  } | null = null;

  // ADR-014: dev mode uses the service client to bypass RLS so the page
  // sees the same data the API routes see under SKIP_AUTH=true.
  const db = SKIP_AUTH ? createServiceClient() : supabase;

  if (SKIP_AUTH) {
    userId = DEV_USER.id;
  } else {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) redirect('/login');
    userId = user.id;
    welcomeTourCompleted = Boolean(user.user_metadata?.welcome_tour_completed);
  }

  // Fetch user profile
  const { data: userData } = await db
    .from('users')
    .select('display_name')
    .eq('id', userId)
    .single();

  userName = userData?.display_name ?? 'Boss';

  // Fetch business profile (includes bir_registered for tile wiring)
  const { data: profile } = await db
    .from('business_profiles')
    .select('bir_registered, primary_pain')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  birRegistered = profile?.bir_registered === true;
  primaryPain = profile?.primary_pain ?? null;

  // --- Today's check-in ---
  const today = getManilaToday();
  const { data: checkInData } = await db
    .from('daily_check_in')
    .select('id, mood, kai_greeting, check_in_date, sales_amount, expenses_amount')
    .eq('user_id', userId)
    .eq('check_in_date', today)
    .is('deleted_at', null)
    .single();

  todayCheckIn = checkInData ?? null;

  // --- Streak (Phase 7) — fetch all check_in_dates and walk consecutively. ---
  const { data: checkInDateRows } = await db
    .from('daily_check_in')
    .select('check_in_date')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('check_in_date', { ascending: false });

  const checkInDates = (checkInDateRows ?? [])
    .map((r) => (r as { check_in_date: string | null }).check_in_date)
    .filter((d): d is string => typeof d === 'string');

  const streakResult = computeStreak(checkInDates, today);

  // --- Action-grid summary data fetches ---
  const { count } = await db
    .from('ka_conversations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('deleted_at', null);

  conversationCount = count ?? 0;

  // This month's transaction count → Kausap usage signal (proxied via existing
  // expense count for the legacy summary cell).
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

  let costingCardCount = 0;
  const { count: ccCount } = await db
    .from('costing_cards')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('deleted_at', null);
  costingCardCount = ccCount ?? 0;

  // BIR deadline summary
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

  // Invoice counts
  const { count: invPendingCount } = await db
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['draft', 'sent'])
    .is('deleted_at', null);
  invoicePendingCount = invPendingCount ?? 0;

  const { count: invOverdueCount } = await db
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'overdue')
    .is('deleted_at', null);
  invoiceOverdueCount = invOverdueCount ?? 0;

  // --- Time-of-day for SSR initial paint of the hero pill. ---
  const manilaHour = toManila().getUTCHours();
  const initialTimeOfDay = computeTimeOfDay(manilaHour);

  // --- Morning-briefing tagline + tone (Phase 7 hero extension) ---
  // Tone is purely date-derived (deterministic, no DB). Tagline is best-effort:
  // we try to read a cached value off `daily_check_in.briefing_tagline`, and
  // fall back to the deterministic template if the column doesn't exist yet
  // (migration 013 still pending) or any other read error fires. Hero degrades
  // gracefully to a static greeting if both paths fail.
  let aiTagline: string | null = null;
  let aiTone: MorningTone | null = null;
  try {
    aiTone = pickTone(today);

    // Best-effort cache read. We deliberately use a separate select so the
    // existing `todayCheckIn` query above keeps compiling even if the column
    // hasn't been migrated yet. On column-not-found Supabase returns an error
    // and `cachedBriefing` stays null — we then fall back to the template.
    let cachedTagline: string | null = null;
    try {
      const { data: cachedBriefing, error: briefingErr } = await db
        .from('daily_check_in')
        .select('briefing_tagline')
        .eq('user_id', userId)
        .eq('check_in_date', today)
        .is('deleted_at', null)
        .maybeSingle();
      if (!briefingErr && cachedBriefing) {
        const row = cachedBriefing as { briefing_tagline: string | null };
        cachedTagline = row.briefing_tagline ?? null;
      }
    } catch {
      // Column may not exist yet (pre-migration-013) — silently fall through.
    }

    if (cachedTagline && cachedTagline.length > 0) {
      aiTagline = cachedTagline;
    } else {
      // Fallback path — deterministic per (tone, date, name).
      aiTagline = pickFallback(aiTone, today, userName).tagline;
    }
  } catch {
    // Any unexpected throw (e.g. malformed date) → static greeting.
    aiTagline = null;
    aiTone = null;
  }

  // --- 5-tile action grid (Hicks's law — exactly 5, fixed order) ---
  const tiles = buildActionTiles({
    conversationCount,
    birRegistered,
    expenseCount,
    nextDeadlineDate,
    overdueCount,
    costingCardCount,
    invoicePendingCount,
    invoiceOverdueCount,
  });

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
          primaryPain={primaryPain}
          firstName={userName}
          initiallyCompleted={welcomeTourCompleted}
        />

        {/* Kumustahan hero */}
        <KumustahanHero
          userName={userName}
          initialTimeOfDay={initialTimeOfDay}
          aiTagline={aiTagline}
          aiTone={aiTone}
        />

        {/* Daily Check-In CTA or Summary (paper-note invite when not yet checked in) */}
        <CheckInSection
          todayCheckIn={todayCheckIn}
          streak={streakResult.streak}
          streakStatus={streakResult.status}
          userName={userName}
        />

        {/* 5-tile action grid */}
        <section aria-label="Home actions">
          <h2 className="font-serif text-lg font-semibold mb-3 text-on-surface">
            {t('actions.header')}
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
            {tiles.map((tile) => (
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

        {/* Banig divider between the action grid and the Kuwento card */}
        <div aria-hidden>
          <WovenDivider width={400} />
        </div>

        {/* Kuwento ng Linggo summary card */}
        <KuwentoCard />

        {/* Closing — centered Fraunces italic 13px "— Kai" */}
        <footer className="text-center">
          <span className="font-serif italic text-[13px] text-on-surface-variant">— Kai</span>
        </footer>

        {/* Ambient layer (Q2 deferral) — outside the scrolling content so the
            absolute positioning anchors against the dashboard root. */}
        <FloatingPetalsLayer />
      </div>
    </PageBackground>
  );
}
