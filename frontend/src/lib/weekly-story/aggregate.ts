// ============================================================
// aggregate.ts — Phase 7 weekly-story aggregator (ADR-015 §3).
//
// Pure-DB aggregation: queries `transactions` for the user's current Manila
// week, groups by date and type, returns the typed WeeklyStory or null when
// the week has no transactions. The route handler decides what to do with
// null (returns the `available: false` shape with a Filipino message).
//
// Indexed assumption: (user_id, transaction_date) and (user_id, deleted_at)
// — both already covered by Build 4's composite index. No N+1.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { getManilaToday } from '@/lib/timezone';
import {
  enumerateWeekDates,
  FIL_DAY_LABELS,
  getManilaWeekBounds,
} from './week-bounds';
import { pickTakeaway, pickTone } from './takeaway-templates';
import type { WeeklyStory, WeeklyStoryDay } from './types';

interface TransactionRow {
  type: string;
  amount: number;
  transaction_date: string;
}

/**
 * Build a WeeklyStory for the current Manila week. Returns null when the
 * week has no transactions (caller maps to `available: false`).
 *
 * `name` is optional — flows through to the takeaway template; defaults to
 * "Boss" inside `pickTakeaway`.
 */
export async function aggregateWeeklyStory(
  supabase: SupabaseClient,
  userId: string,
  name?: string,
): Promise<WeeklyStory | null> {
  const today = getManilaToday();
  const { week_start, week_end } = getManilaWeekBounds(today);

  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount, transaction_date')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .gte('transaction_date', week_start)
    .lte('transaction_date', week_end);

  if (error) {
    // Bubble up — route handler maps to `available: false, reason: 'error'`.
    throw error;
  }

  const rows = (data ?? []) as TransactionRow[];

  // Empty week → null (route returns `no_data`).
  if (rows.length === 0) {
    return null;
  }

  // Group by transaction_date.
  const byDate = new Map<string, { kita: number; gastos: number }>();
  for (const tx of rows) {
    const entry = byDate.get(tx.transaction_date) ?? { kita: 0, gastos: 0 };
    if (tx.type === 'income') {
      entry.kita += tx.amount;
    } else {
      // Anything not 'income' is treated as an expense (matches the legacy
      // morning-briefing aggregator's branch). Keeps the helper resilient if
      // the project ever introduces additional non-income transaction types.
      entry.gastos += tx.amount;
    }
    byDate.set(tx.transaction_date, entry);
  }

  // Materialize the 7-day breakdown, Mon..Sun, with zeros where missing.
  const dailyDates = enumerateWeekDates(week_start);
  let kitaTotal = 0;
  let gastosTotal = 0;
  let peakIndex: number | null = null;
  let peakKita = 0;

  const daily_breakdown: WeeklyStoryDay[] = dailyDates.map((date, i) => {
    const entry = byDate.get(date) ?? { kita: 0, gastos: 0 };
    kitaTotal += entry.kita;
    gastosTotal += entry.gastos;
    if (entry.kita > peakKita) {
      peakKita = entry.kita;
      peakIndex = i;
    }
    return {
      date,
      day_label: FIL_DAY_LABELS[i],
      kita_centavos: entry.kita,
      gastos_centavos: entry.gastos,
    };
  });

  const tubo = kitaTotal - gastosTotal;
  const tone = pickTone(today);
  const story: WeeklyStory = {
    week_start,
    week_end,
    kita_centavos: kitaTotal,
    gastos_centavos: gastosTotal,
    tubo_centavos: tubo,
    daily_breakdown,
    peak_day_index: peakIndex,
    takeaway: '', // filled in below; pickTakeaway needs the totals
    tone,
  };
  story.takeaway = pickTakeaway(tone, story, name);
  return story;
}
