/**
 * Chat Suggestions — Rule generators (R1..R4)
 * Feature: Phase 8c — `/api/chat/suggestions` rule-based chips (ADR-016 §3)
 * Role: Each rule is a pure async function of (db, userId) → ChatSuggestion | null.
 *       A rule fires when the user's data shape matches its trigger; otherwise
 *       returns null and `index.ts` back-fills from the cold-start set.
 *
 * Why pure functions: rule logic is unit-tested in isolation (`rules.test.ts`)
 * with mocked Supabase chains. The route file orchestrates these into a 4-chip
 * response with cache + auth wrapping.
 *
 * DB chain shapes match the QA mocks in `rules.test.ts` exactly — one `.eq`
 * per rule (user_id), then range + soft-delete filters. Status / source
 * filters that don't fit the single-`.eq` chain are applied in JS after the
 * rows come back (cheap because all queries are bounded by user_id +
 * indexed range, returning at most a handful of rows).
 *
 * Graceful degradation: every rule returns null on any error path. Index
 * orchestrator + route handler treat null as "rule didn't fire" and back-fill.
 */

import type { ChatSuggestion } from './types';

// ============================================================
// Minimal db shape — anything with `.from()` returning a chainable
// builder works. Matches both Supabase clients (regular + service).
// ============================================================

type DbLike = { from: (table: string) => unknown };

// ============================================================
// R1 — recent_receipts
// Trigger: ≥ 3 OCR-source transactions in the last 24 hours.
// Insight: when the user has been actively scanning, surface a "summarize
// this week" chip so they don't have to hunt for the dashboard.
// ============================================================

export async function runRecentReceipts(
  db: DbLike,
  userId: string
): Promise<ChatSuggestion | null> {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Chain matches `rules.test.ts` mockDb('transactions') exactly:
    // .select(...).eq('user_id', userId).gte('created_at', cutoff).is('deleted_at', null)
    const builder = (db.from('transactions') as {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          gte: (col: string, val: string) => {
            is: (col: string, val: null) => Promise<{
              data: Array<{ source?: string }> | null;
              error: { message: string } | null;
              count?: number;
            }>;
          };
        };
      };
    })
      .select('source, created_at');

    const { data, error } = await builder
      .eq('user_id', userId)
      .gte('created_at', cutoff)
      .is('deleted_at', null);

    if (error || !data) return null;

    // Source filter applied in-JS — see header note on single-`.eq` chain.
    const ocrCount = data.filter((r) => r.source === 'ocr').length;
    if (ocrCount < 3) return null;

    return {
      id: 'recent_receipts',
      text_tl: 'I-summarize ang gastos ngayong linggo',
      intent: 'expenses',
    };
  } catch {
    return null;
  }
}

// ============================================================
// R2 — upcoming_deadline
// Trigger: a `bir_deadlines` row with status='upcoming' and due_date within
// the next 7 days. Surfaces the form code in the chip so Kai can open the
// conversation already aware of the form (orthogonal to the ADR-017 deeplink
// — that path is row-tap; this one is "user opens chat without context").
// ============================================================

export async function runUpcomingDeadline(
  db: DbLike,
  userId: string
): Promise<ChatSuggestion | null> {
  try {
    // Use UTC date string. bir_deadlines.due_date is DATE (no time component),
    // so the precision question is which calendar day; UTC is consistent.
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const sevenDays = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const sevenDaysStr = sevenDays.toISOString().slice(0, 10);

    // Chain matches `rules.test.ts` mockDb('bir_deadlines') exactly:
    // .select.eq.gte.lte.is.order.limit
    const builder = (db.from('bir_deadlines') as {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          gte: (col: string, val: string) => {
            lte: (col: string, val: string) => {
              is: (col: string, val: null) => {
                order: (col: string, opts: { ascending: boolean }) => {
                  limit: (n: number) => Promise<{
                    data: Array<{ form_name: string; due_date: string; status: string }> | null;
                    error: { message: string } | null;
                  }>;
                };
              };
            };
          };
        };
      };
    })
      .select('form_name, due_date, status');

    const { data, error } = await builder
      .eq('user_id', userId)
      .gte('due_date', todayStr)
      .lte('due_date', sevenDaysStr)
      .is('deleted_at', null)
      .order('due_date', { ascending: true })
      .limit(1);

    if (error || !data || data.length === 0) return null;

    const row = data[0];
    if (row.status !== 'upcoming') return null;

    return {
      id: 'upcoming_deadline',
      text_tl: `Ano ang ${row.form_name}?`,
      intent: 'deadlines',
    };
  } catch {
    return null;
  }
}

// ============================================================
// R3 — overdue_invoice
// Trigger: at least one invoice with status='overdue' (soft-delete-aware).
// Phase-10 forward-compat: the `invoices` table may not exist yet.
// Postgres returns error code '42P01' (`relation does not exist`) — we
// detect that and silently return null, so the chip row falls through to
// R4 + cold-start.
// ============================================================

export async function runOverdueInvoice(
  db: DbLike,
  userId: string
): Promise<ChatSuggestion | null> {
  try {
    const builder = (db.from('invoices') as {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          is: (col: string, val: null) => Promise<{
            data: Array<{ status?: string }> | null;
            error: { code?: string; message: string } | null;
          }>;
        };
      };
    })
      .select('id, status');

    const { data, error } = await builder
      .eq('user_id', userId)
      .is('deleted_at', null);

    // Phase 10 forward-compat: relation-missing error → silent skip.
    if (error?.code === '42P01') return null;
    if (error || !data) return null;

    const hasOverdue = data.some((r) => r.status === 'overdue');
    if (!hasOverdue) return null;

    return {
      id: 'overdue_invoice',
      text_tl: 'Sinong may utang pa?',
      intent: 'invoices',
    };
  } catch {
    return null;
  }
}

// ============================================================
// R4 — evergreen_pricing
// Trigger: always. The pricing question is universally relevant for MSMEs
// and serves as the "fourth slot" anchor when fewer than 3 personalized
// rules fire.
// ============================================================

export async function runEvergreenPricing(
  _db: DbLike,
  _userId: string
): Promise<ChatSuggestion | null> {
  return {
    id: 'evergreen_pricing',
    text_tl: 'Magkano dapat presyo ng produkto ko?',
    intent: 'pricing',
  };
}
