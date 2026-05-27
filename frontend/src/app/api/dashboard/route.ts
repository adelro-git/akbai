import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { toManila, getManilaToday } from '@/lib/timezone';
import { computeStreak, type StreakStatus } from '@/lib/streak/compute-streak';
import { pickTone } from '@/lib/morning-briefing/tone';
import { pickFallback } from '@/lib/morning-briefing/fallback-templates';
import { computeTimeOfDay, type TimeOfDay } from '@/lib/timezone/time-of-day';
import type { MorningTone } from '@/lib/morning-briefing/types';

// ============================================================
// Types
// ============================================================

interface DashboardCard {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  emptyState: string;
  hasData: boolean;
}

interface CheckInData {
  id: string;
  mood: string | null;
  kai_greeting: string;
  check_in_date: string;
  sales_amount: number | null;
  expenses_amount: number | null;
}

// ── Phase-7 hero/tiles extension (Sprint 15 capacitor conversion) ──
// New fields the client `/dashboard` page consumes alongside the legacy
// `greeting`/`userName`/`dashboardCards` shape kept for back-compat. Tests
// on the legacy shape continue to pass because we only add, never remove.
interface ActionTile {
  id: string;
  titleKey: string;
  href: string;
  icon: string;
  emptyState: string;
  hasData: boolean;
  summary?: string;
}

interface DashboardResponse {
  // ── Legacy shape (pre-Sprint-15) ──
  greeting: string;
  userName: string;
  businessName: string | null;
  businessType: string | null;
  todayCheckIn: CheckInData | null;
  dashboardCards: DashboardCard[];
  // ── Phase-7 hero/tiles extension ──
  primaryPain: string | null;
  birRegistered: boolean;
  welcomeTourCompleted: boolean;
  initialTimeOfDay: TimeOfDay;
  aiTagline: string | null;
  aiTone: MorningTone | null;
  streak: number;
  streakStatus: StreakStatus;
  actionTiles: ActionTile[];
}

// ============================================================
// Zod Schemas — Check-In with optional financial fields
// sales_amount and expenses_amount are non-negative integers (centavos)
// ============================================================

const CheckInSchema = z.object({
  mood: z.string().max(200).optional(),
  sales_amount: z.number().int().nonnegative().optional(),
  expenses_amount: z.number().int().nonnegative().optional(),
  expense_category: z.string().min(1).optional(),
});

// ============================================================
// Greeting Generator
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

/** Exported for testing */
export { generateGreeting, CheckInSchema };

// ============================================================
// Dashboard Cards (Build 2 — all empty state)
// ============================================================

function getDashboardCards(): DashboardCard[] {
  return [
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
      hasData: true, // Chat always available
    },
  ];
}

// ============================================================
// GET — Fetch today's dashboard data
// ============================================================

export async function GET() {
  const supabase = await createClient();

  let userId: string;
  let userName = 'Boss';
  let welcomeTourCompleted = false;

  if (SKIP_AUTH) {
    userId = DEV_USER.id;
  } else {
    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message_tl: 'Kailangan mag-login muna.' } },
        { status: 401 }
      );
    }

    userId = user.id;
    welcomeTourCompleted = Boolean(user.user_metadata?.welcome_tour_completed);
  }

  // Dev bypass uses service client to bypass RLS; auth path uses normal client
  const db = SKIP_AUTH ? createServiceClient() : supabase;

  // Fetch user profile
  const { data: userData } = await db
    .from('users')
    .select('display_name')
    .eq('id', userId)
    .single();

  userName = userData?.display_name ?? 'Boss';

  // Fetch business profile — Phase-7 needs primary_pain + bir_registered too.
  const { data: businessProfile } = await db
    .from('business_profiles')
    .select('business_name, business_type, bir_registered, primary_pain')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  const birRegistered = businessProfile?.bir_registered === true;
  const primaryPain = businessProfile?.primary_pain ?? null;

  // Check if user has checked in today
  const today = getManilaToday();
  const { data: todayCheckIn } = await db
    .from('daily_check_in')
    .select('id, mood, kai_greeting, check_in_date, sales_amount, expenses_amount')
    .eq('user_id', userId)
    .eq('check_in_date', today)
    .is('deleted_at', null)
    .single();

  // ── Streak (Phase-7) — all check_in_dates DESC then computeStreak walks. ──
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

  // ── Action-grid summary counts (Hicks's law — 5 tiles, fixed order). ──
  const { count: convoCount } = await db
    .from('ka_conversations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('deleted_at', null);
  const conversationCount = convoCount ?? 0;

  const { count: ccCount } = await db
    .from('costing_cards')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('deleted_at', null);
  const costingCardCount = ccCount ?? 0;

  // Next deadline + overdue
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

  let nextDeadlineDate: string | null = null;
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
  const overdueCount = odCount ?? 0;

  // Invoice counts
  const { count: invPendingCount } = await db
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['draft', 'sent'])
    .is('deleted_at', null);
  const invoicePendingCount = invPendingCount ?? 0;

  const { count: invOverdueCount } = await db
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'overdue')
    .is('deleted_at', null);
  const invoiceOverdueCount = invOverdueCount ?? 0;

  // ── Time-of-day for the hero pill (deterministic from Manila clock). ──
  const manilaHour = toManila().getUTCHours();
  const initialTimeOfDay = computeTimeOfDay(manilaHour);

  // ── Morning-briefing tagline + tone. Best-effort cache read; falls back
  //    to the deterministic template when the column is missing or any
  //    error fires. Hero degrades gracefully to a static greeting via
  //    null tagline/tone.
  let aiTagline: string | null = null;
  let aiTone: MorningTone | null = null;
  try {
    aiTone = pickTone(today);

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
      aiTagline = pickFallback(aiTone, today, userName).tagline;
    }
  } catch {
    aiTagline = null;
    aiTone = null;
  }

  // ── 5-tile action grid (Hicks's law — exactly 5, fixed order). ──
  const actionTiles: ActionTile[] = [
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
      summary: conversationCount > 0 ? `${conversationCount} messages` : undefined,
    },
    {
      id: 'bir-paalala',
      titleKey: 'birPaalala',
      href: '/deadlines',
      icon: 'kalendaryo',
      emptyState: 'Wala pang tax calendar. I-setup natin!',
      hasData: birRegistered || nextDeadlineDate !== null,
      summary:
        overdueCount > 0
          ? `${overdueCount} overdue!`
          : nextDeadlineDate
            ? `Next: ${nextDeadlineDate}`
            : birRegistered
              ? 'BIR: Registered'
              : undefined,
    },
    {
      id: 'tamang-presyo',
      titleKey: 'tamangPresyo',
      href: '/costing',
      icon: 'precio',
      emptyState: 'Alamin ang totoong gastos ng produkto mo!',
      hasData: costingCardCount > 0,
      summary:
        costingCardCount > 0
          ? `${costingCardCount} costing card${costingCardCount !== 1 ? 's' : ''}`
          : undefined,
    },
    {
      id: 'mga-invoice',
      titleKey: 'mgaInvoice',
      href: '/invoices',
      icon: 'invoice',
      emptyState: 'Gumawa ng invoice para sa mga customer mo!',
      hasData: invoicePendingCount > 0 || invoiceOverdueCount > 0,
      summary:
        invoiceOverdueCount > 0
          ? `${invoiceOverdueCount} overdue!`
          : invoicePendingCount > 0
            ? `${invoicePendingCount} pending`
            : undefined,
    },
  ];

  const greeting = generateGreeting(userName);

  const response: DashboardResponse = {
    // Legacy shape
    greeting,
    userName,
    businessName: businessProfile?.business_name ?? null,
    businessType: businessProfile?.business_type ?? null,
    todayCheckIn: todayCheckIn ?? null,
    dashboardCards: getDashboardCards(),
    // Phase-7 extension
    primaryPain,
    birRegistered,
    welcomeTourCompleted,
    initialTimeOfDay,
    aiTagline,
    aiTone,
    streak: streakResult.streak,
    streakStatus: streakResult.status,
    actionTiles,
  };

  return NextResponse.json({ success: true, data: response });
}

// ============================================================
// POST — Save today's check-in
// ============================================================

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  let userId: string;
  let userName = 'Boss';

  if (SKIP_AUTH) {
    userId = DEV_USER.id;
  } else {
    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message_tl: 'Kailangan mag-login muna.' } },
        { status: 401 }
      );
    }

    userId = user.id;
  }

  // Dev bypass uses service client to bypass RLS; auth path uses normal client
  const db = SKIP_AUTH ? createServiceClient() : supabase;

  // Validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message_tl: 'Mali ang request format.' } },
      { status: 400 }
    );
  }

  const parsed = CheckInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message_tl: 'Mali ang data.',
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  // Get user's name for greeting
  const { data: postUserData } = await db
    .from('users')
    .select('display_name')
    .eq('id', userId)
    .single();

  userName = postUserData?.display_name ?? 'Boss';

  const greeting = generateGreeting(userName);
  const today = getManilaToday();

  // Upsert check-in (one per user per day) — includes financial fields
  const { data: checkIn, error: insertError } = await db
    .from('daily_check_in')
    .upsert(
      {
        user_id: userId,
        check_in_date: today,
        mood: parsed.data.mood ?? null,
        kai_greeting: greeting,
        sales_amount: parsed.data.sales_amount ?? null,
        expenses_amount: parsed.data.expenses_amount ?? null,
      },
      { onConflict: 'user_id,check_in_date' }
    )
    .select('id, user_id, check_in_date, mood, kai_greeting, sales_amount, expenses_amount')
    .single();

  if (insertError) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi ma-save ang check-in. Subukan muli.' } },
      { status: 500 }
    );
  }

  // ── Check-in → Expenses integration (Sprint 7, Task 13) ──
  // Create transactions from check-in financial data so they appear in Saan Napunta.
  // Soft-delete existing check-in transactions for this check-in to avoid duplicates on re-submit.
  if (checkIn && (parsed.data.sales_amount || parsed.data.expenses_amount)) {
    await db
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('source', 'check_in')
      .eq('source_ref_id', checkIn.id);

    const txRows: Array<Record<string, unknown>> = [];

    if (parsed.data.sales_amount && parsed.data.sales_amount > 0) {
      txRows.push({
        user_id: userId,
        type: 'income',
        amount: parsed.data.sales_amount,
        category: 'check_in_sales',
        description: `Daily check-in sales (${today})`,
        transaction_date: today,
        source: 'check_in',
        source_ref_id: checkIn.id,
      });
    }

    if (parsed.data.expenses_amount && parsed.data.expenses_amount > 0) {
      txRows.push({
        user_id: userId,
        type: 'expense',
        amount: parsed.data.expenses_amount,
        category: parsed.data.expense_category ?? 'other_expense',
        description: `Daily check-in gastos (${today})`,
        transaction_date: today,
        source: 'check_in',
        source_ref_id: checkIn.id,
      });
    }

    if (txRows.length > 0) {
      await db.from('transactions').insert(txRows);
    }
  }

  return NextResponse.json({ success: true, data: checkIn });
}
