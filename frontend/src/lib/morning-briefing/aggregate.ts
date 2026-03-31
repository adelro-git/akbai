/**
 * Morning Briefing — Data Aggregation
 * Feature: Ang Umaga Mo (Build 5)
 * Role: Queries Supabase for yesterday's transactions, cash position,
 *       BIR deadlines, and week-over-week comparison. Returns a typed
 *       MorningBriefingContext for prompt injection.
 *
 * All monetary values are in centavos (integers).
 * All date logic uses Asia/Manila timezone helpers.
 *
 * Dependencies: Supabase client (server-side), timezone.ts
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getManilaToday, toManila, formatManilaDate } from '@/lib/timezone';
import type { MorningBriefingContext } from './types';

// ============================================================
// Helper — compute date strings relative to Manila "today"
// ============================================================

function getManilaYesterday(): string {
  const today = new Date(getManilaToday() + 'T00:00:00Z');
  today.setUTCDate(today.getUTCDate() - 1);
  const y = today.getUTCFullYear();
  const m = String(today.getUTCMonth() + 1).padStart(2, '0');
  const d = String(today.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDateNDaysAgo(n: number): string {
  const today = new Date(getManilaToday() + 'T00:00:00Z');
  today.setUTCDate(today.getUTCDate() - n);
  const y = today.getUTCFullYear();
  const m = String(today.getUTCMonth() + 1).padStart(2, '0');
  const d = String(today.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDateNDaysFromNow(n: number): string {
  const today = new Date(getManilaToday() + 'T00:00:00Z');
  today.setUTCDate(today.getUTCDate() + n);
  const y = today.getUTCFullYear();
  const m = String(today.getUTCMonth() + 1).padStart(2, '0');
  const d = String(today.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Get the Monday of the week containing a given YYYY-MM-DD date string */
function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const dayOfWeek = d.getUTCDay(); // 0=Sun
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday-based
  d.setUTCDate(d.getUTCDate() - diff);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Get the Sunday (end) of the week containing a given YYYY-MM-DD date string */
function getWeekEnd(dateStr: string): string {
  const start = new Date(getWeekStart(dateStr) + 'T00:00:00Z');
  start.setUTCDate(start.getUTCDate() + 6);
  const y = start.getUTCFullYear();
  const m = String(start.getUTCMonth() + 1).padStart(2, '0');
  const d = String(start.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ============================================================
// Main Aggregation — queries Supabase and builds context
// ============================================================

interface TransactionRow {
  type: string;
  amount: number;
  category: string;
}

interface DeadlineRow {
  form_name: string;
  description: string | null;
  due_date: string;
  status: string;
}

export async function aggregateBriefingData(
  supabase: SupabaseClient,
  userId: string
): Promise<MorningBriefingContext> {
  const today = getManilaToday();
  const yesterday = getManilaYesterday();
  const manilaDate = toManila();
  const dayOfWeek = formatManilaDate(undefined, 'EEEE'); // "Monday", etc.

  // --- Yesterday's transactions (Manila date) ---
  const { data: yesterdayTxns } = await supabase
    .from('transactions')
    .select('type, amount, category')
    .eq('user_id', userId)
    .eq('transaction_date', yesterday)
    .is('deleted_at', null);

  const yRows = (yesterdayTxns ?? []) as TransactionRow[];
  let yIncome = 0;
  let yExpenses = 0;
  let yIncomeCount = 0;
  let yExpenseCount = 0;
  const yCatMap = new Map<string, number>();

  for (const tx of yRows) {
    if (tx.type === 'income') {
      yIncome += tx.amount;
      yIncomeCount += 1;
    } else {
      yExpenses += tx.amount;
      yExpenseCount += 1;
      yCatMap.set(tx.category, (yCatMap.get(tx.category) ?? 0) + tx.amount);
    }
  }

  const topExpenseCategories = Array.from(yCatMap.entries())
    .map(([category, amount_centavos]) => ({ category, amount_centavos }))
    .sort((a, b) => b.amount_centavos - a.amount_centavos)
    .slice(0, 3);

  // --- All-time balance (sum income - sum expenses) ---
  const { data: allTimeTxns } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('user_id', userId)
    .is('deleted_at', null);

  const allRows = (allTimeTxns ?? []) as Array<{ type: string; amount: number }>;
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const tx of allRows) {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else {
      totalExpenses += tx.amount;
    }
  }

  const currentBalance = totalIncome - totalExpenses;

  // --- Balance 7 days ago (for trend) ---
  const sevenDaysAgo = getDateNDaysAgo(7);
  const { data: olderTxns } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .lte('transaction_date', sevenDaysAgo);

  const olderRows = (olderTxns ?? []) as Array<{ type: string; amount: number }>;
  let oldIncome = 0;
  let oldExpenses = 0;

  for (const tx of olderRows) {
    if (tx.type === 'income') {
      oldIncome += tx.amount;
    } else {
      oldExpenses += tx.amount;
    }
  }

  const balanceWeekAgo = oldIncome - oldExpenses;
  const balanceChange = currentBalance - balanceWeekAgo;

  let trend: 'up' | 'down' | 'flat' = 'flat';
  if (balanceChange > 0) trend = 'up';
  else if (balanceChange < 0) trend = 'down';

  // --- This week vs last week comparison ---
  const thisWeekStart = getWeekStart(today);
  const thisWeekEnd = getWeekEnd(today);
  const lastWeekStart = getWeekStart(getDateNDaysAgo(7));
  const lastWeekEnd = getWeekEnd(getDateNDaysAgo(7));

  const { data: thisWeekTxns } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .gte('transaction_date', thisWeekStart)
    .lte('transaction_date', thisWeekEnd);

  const { data: lastWeekTxns } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .gte('transaction_date', lastWeekStart)
    .lte('transaction_date', lastWeekEnd);

  let twIncome = 0, twExpenses = 0;
  for (const tx of (thisWeekTxns ?? []) as Array<{ type: string; amount: number }>) {
    if (tx.type === 'income') twIncome += tx.amount;
    else twExpenses += tx.amount;
  }

  let lwIncome = 0, lwExpenses = 0;
  for (const tx of (lastWeekTxns ?? []) as Array<{ type: string; amount: number }>) {
    if (tx.type === 'income') lwIncome += tx.amount;
    else lwExpenses += tx.amount;
  }

  // --- BIR deadlines (next 14 days, not filed) ---
  const fourteenDaysOut = getDateNDaysFromNow(14);

  const { data: deadlines } = await supabase
    .from('bir_deadlines')
    .select('form_name, description, due_date, status')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .neq('status', 'filed')
    .gte('due_date', today)
    .lte('due_date', fourteenDaysOut)
    .order('due_date', { ascending: true });

  const deadlineRows = (deadlines ?? []) as DeadlineRow[];
  const upcomingDeadlines = deadlineRows.map((dl) => {
    const dueDate = new Date(dl.due_date + 'T00:00:00Z');
    const todayDate = new Date(today + 'T00:00:00Z');
    const daysUntil = Math.round((dueDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      form_type: dl.form_name,
      form_description: dl.description ?? '',
      deadline_date: dl.due_date,
      days_until: daysUntil,
      status: dl.status,
      filing_period: '', // Future: derive from form_name + quarter
    };
  });

  // --- Days since signup ---
  const { data: userData } = await supabase
    .from('users')
    .select('created_at')
    .eq('id', userId)
    .single();

  let daysSinceSignup = 0;
  if (userData?.created_at) {
    const signupDate = new Date(userData.created_at);
    const now = new Date();
    daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  // --- Has any transactions ever ---
  const hasAnyTransactions = allRows.length > 0;

  return {
    briefing_date: today,
    day_of_week: dayOfWeek,
    yesterday: {
      total_income_centavos: yIncome,
      total_expenses_centavos: yExpenses,
      income_count: yIncomeCount,
      expense_count: yExpenseCount,
      top_expense_categories: topExpenseCategories,
      has_transactions: yRows.length > 0,
    },
    cash_position: {
      balance_centavos: currentBalance,
      trend_vs_last_week: trend,
      change_centavos: balanceChange,
    },
    upcoming_deadlines: upcomingDeadlines,
    week_comparison: {
      this_week_income_centavos: twIncome,
      last_week_income_centavos: lwIncome,
      this_week_expense_centavos: twExpenses,
      last_week_expense_centavos: lwExpenses,
    },
    days_since_signup: daysSinceSignup,
    has_any_transactions: hasAnyTransactions,
  };
}
