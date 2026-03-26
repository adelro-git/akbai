import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { toManila, getManilaToday } from '@/lib/timezone';

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

interface DashboardResponse {
  greeting: string;
  userName: string;
  businessName: string | null;
  businessType: string | null;
  todayCheckIn: CheckInData | null;
  dashboardCards: DashboardCard[];
}

// ============================================================
// Zod Schemas — Check-In with optional financial fields
// sales_amount and expenses_amount are non-negative integers (centavos)
// ============================================================

const CheckInSchema = z.object({
  mood: z.string().max(200).optional(),
  sales_amount: z.number().int().nonnegative().optional(),
  expenses_amount: z.number().int().nonnegative().optional(),
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

  if (SKIP_AUTH) {
    userId = DEV_USER.id;

    // Dev bypass — return mock dashboard data
    const greeting = generateGreeting('Boss');
    const response: DashboardResponse = {
      greeting,
      userName: 'Boss',
      businessName: 'Dev Business',
      businessType: 'food_baking',
      todayCheckIn: null,
      dashboardCards: getDashboardCards(),
    };

    return NextResponse.json({ success: true, data: response });
  }

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

  // Fetch user profile
  const { data: userData } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', userId)
    .single();

  userName = userData?.display_name ?? 'Boss';

  // Fetch business profile
  const { data: businessProfile } = await supabase
    .from('business_profiles')
    .select('business_name, business_type')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  // Check if user has checked in today
  const today = getManilaToday();
  const { data: todayCheckIn } = await supabase
    .from('daily_check_in')
    .select('id, mood, kai_greeting, check_in_date, sales_amount, expenses_amount')
    .eq('user_id', userId)
    .eq('check_in_date', today)
    .is('deleted_at', null)
    .single();

  const greeting = generateGreeting(userName);

  const response: DashboardResponse = {
    greeting,
    userName,
    businessName: businessProfile?.business_name ?? null,
    businessType: businessProfile?.business_type ?? null,
    todayCheckIn: todayCheckIn ?? null,
    dashboardCards: getDashboardCards(),
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
        { success: false, error: { code: 'INVALID_INPUT', message_tl: 'Mali ang data.', details: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    // Dev bypass — return mock success
    const greeting = generateGreeting('Boss');
    return NextResponse.json({
      success: true,
      data: {
        id: 'dev-checkin-001',
        user_id: userId,
        check_in_date: getManilaToday(),
        mood: parsed.data.mood ?? null,
        kai_greeting: greeting,
        sales_amount: parsed.data.sales_amount ?? null,
        expenses_amount: parsed.data.expenses_amount ?? null,
      },
    });
  }

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
  const { data: userData } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', userId)
    .single();

  userName = userData?.display_name ?? 'Boss';

  const greeting = generateGreeting(userName);
  const today = getManilaToday();

  // Upsert check-in (one per user per day) — includes financial fields
  const { data: checkIn, error: insertError } = await supabase
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
    await supabase
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
        category: 'other_expense',
        description: `Daily check-in expenses (${today})`,
        transaction_date: today,
        source: 'check_in',
        source_ref_id: checkIn.id,
      });
    }

    if (txRows.length > 0) {
      await supabase.from('transactions').insert(txRows);
    }
  }

  return NextResponse.json({ success: true, data: checkIn });
}
