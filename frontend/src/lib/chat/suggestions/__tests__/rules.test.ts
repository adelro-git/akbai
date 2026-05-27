/**
 * Unit tests — Rule-based suggestion generators (ADR-016 §3)
 *
 * Each rule is a pure function of (db client, userId) → ChatSuggestion | null.
 * Pure functions = exhaustive deterministic testing.
 *
 * Rules under test:
 *   R1 recent_receipts:    transactions(source='ocr', created_at >= now()-24h, deleted_at IS NULL) >= 3
 *   R2 upcoming_deadline:  bir_deadlines(status='upcoming', due_date BETWEEN today..today+7d, deleted_at IS NULL) LIMIT 1
 *   R3 overdue_invoice:    invoices(status='overdue', deleted_at IS NULL) EXISTS
 *                          (skipped silently if invoices table missing — Phase 10 forward-compat)
 *   R4 evergreen pricing:  always fires
 *
 * Cold-start fallback (no rule fires): 4 fixed chips, locked verbatim per ADR-016 §3.
 *
 * Why these tests: rule order = chip order (personalized first, evergreen
 * last). A bug in the rule selector means the user's most-relevant chip is
 * pushed off the visible row → cold-start barrier returns. The verbatim
 * cold-start fallback is also load-bearing copy (voice manual checked) — a
 * typo here ships to production.
 */

import { describe, it, expect, vi } from 'vitest';
import type { ChatSuggestion } from '../types';
import * as rulesMod from '../rules';
import * as indexMod from '../index';

// Modules now exist (engineer shipped Phase 8c). Vitest's `require()` shim
// does not resolve TS files, so the original try/catch describeIfPresent
// always took the skip branch — replaced with plain static imports.
const describeIfPresent = describe;

const USER_ID = '11111111-1111-1111-1111-111111111111';

// Cold-start fallback — locked verbatim per ADR-016 §3.
const COLD_START_FALLBACK: ChatSuggestion[] = [
  { id: 'cold_start_expenses', text_tl: 'Saan napunta ang pera ko?', intent: 'expenses' },
  { id: 'cold_start_deadlines', text_tl: 'Kailan ang BIR deadline?', intent: 'deadlines' },
  { id: 'cold_start_pricing', text_tl: 'Magkano dapat presyo?', intent: 'pricing' },
  { id: 'cold_start_capture', text_tl: 'I-record ang gastos', intent: 'expense_capture' },
];

/**
 * Build a chainable Supabase mock that resolves a SELECT-style query to the
 * provided rows. The shape mirrors the existing mocks in
 * `morning-briefing/__tests__/route.test.ts`.
 */
function mockDb(handlers: {
  transactions?: { rows: unknown[]; count?: number };
  birDeadlines?: { rows: Array<{ form_name: string; due_date: string; status: string }> };
  invoices?: { rows: unknown[]; tableMissing?: boolean };
}) {
  return {
    from: vi.fn((table: string) => {
      if (table === 'transactions') {
        const rows = handlers.transactions?.rows ?? [];
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                is: vi.fn().mockResolvedValue({
                  data: rows,
                  error: null,
                  count: handlers.transactions?.count ?? rows.length,
                }),
              })),
            })),
          })),
        };
      }
      if (table === 'bir_deadlines') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() => ({
                  is: vi.fn(() => ({
                    order: vi.fn(() => ({
                      limit: vi.fn().mockResolvedValue({
                        data: handlers.birDeadlines?.rows ?? [],
                        error: null,
                      }),
                    })),
                  })),
                })),
              })),
            })),
          })),
        };
      }
      if (table === 'invoices') {
        if (handlers.invoices?.tableMissing) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                is: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: '42P01', message: 'relation "invoices" does not exist' },
                }),
              })),
            })),
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              is: vi.fn().mockResolvedValue({
                data: handlers.invoices?.rows ?? [],
                error: null,
              }),
            })),
          })),
        };
      }
      return {
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    }),
  };
}

describeIfPresent('lib/chat/suggestions/rules — R1 recent_receipts', () => {
  it('fires when 3+ OCR receipts exist in last 24h', async () => {
    const db = mockDb({
      transactions: {
        rows: [
          { id: 't1', source: 'ocr', created_at: '2026-04-28T07:00:00Z' },
          { id: 't2', source: 'ocr', created_at: '2026-04-28T06:00:00Z' },
          { id: 't3', source: 'ocr', created_at: '2026-04-28T05:00:00Z' },
        ],
        count: 3,
      },
    });
    const result = await rulesMod!.runRecentReceipts(db, USER_ID);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('recent_receipts');
    expect(result!.intent).toBe('expenses');
    expect(result!.text_tl).toBe('I-summarize ang gastos ngayong linggo');
  });

  it('does NOT fire with fewer than 3 receipts', async () => {
    const db = mockDb({
      transactions: { rows: [{ id: 't1' }, { id: 't2' }], count: 2 },
    });
    expect(await rulesMod!.runRecentReceipts(db, USER_ID)).toBeNull();
  });

  it('returns null on DB error (graceful degradation)', async () => {
    const db = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              is: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
            })),
          })),
        })),
      })),
    };
    expect(await rulesMod!.runRecentReceipts(db, USER_ID)).toBeNull();
  });
});

describeIfPresent('lib/chat/suggestions/rules — R2 upcoming_deadline', () => {
  it('fires when an upcoming deadline exists within 7 days', async () => {
    const db = mockDb({
      birDeadlines: {
        rows: [{ form_name: '2551Q', due_date: '2026-05-04', status: 'upcoming' }],
      },
    });
    const result = await rulesMod!.runUpcomingDeadline(db, USER_ID);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('upcoming_deadline');
    expect(result!.intent).toBe('deadlines');
    // Form name is interpolated — must reference the actual upcoming form.
    expect(result!.text_tl).toContain('2551Q');
  });

  it('does NOT fire when no upcoming deadlines in the 7-day window', async () => {
    const db = mockDb({ birDeadlines: { rows: [] } });
    expect(await rulesMod!.runUpcomingDeadline(db, USER_ID)).toBeNull();
  });
});

describeIfPresent('lib/chat/suggestions/rules — R3 overdue_invoice', () => {
  it('fires when at least one overdue invoice exists', async () => {
    const db = mockDb({
      invoices: { rows: [{ id: 'inv-001', status: 'overdue' }] },
    });
    const result = await rulesMod!.runOverdueInvoice(db, USER_ID);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('overdue_invoice');
    expect(result!.intent).toBe('invoices');
    expect(result!.text_tl).toBe('Sinong may utang pa?');
  });

  it('returns null when invoices table is missing (Phase 10 forward-compat)', async () => {
    const db = mockDb({ invoices: { rows: [], tableMissing: true } });
    // Must NOT throw — silently skip per ADR-016 §3.
    const result = await rulesMod!.runOverdueInvoice(db, USER_ID);
    expect(result).toBeNull();
  });
});

describeIfPresent('lib/chat/suggestions/rules — R4 evergreen pricing', () => {
  it('always fires', async () => {
    const db = mockDb({});
    const result = await rulesMod!.runEvergreenPricing(db, USER_ID);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('evergreen_pricing');
    expect(result!.intent).toBe('pricing');
    expect(result!.text_tl).toBe('Magkano dapat presyo ng produkto ko?');
  });
});

describeIfPresent('lib/chat/suggestions/index — buildSuggestions orchestration', () => {
  it('returns exactly 4 chips when all rules fire', async () => {
    const db = mockDb({
      transactions: { rows: new Array(5).fill({ source: 'ocr' }), count: 5 },
      birDeadlines: { rows: [{ form_name: '2551Q', due_date: '2026-05-04', status: 'upcoming' }] },
      invoices: { rows: [{ id: 'inv-001', status: 'overdue' }] },
    });
    const result = await indexMod!.buildSuggestions(db, USER_ID);
    expect(result).toHaveLength(4);
    // Personalized rules first (R1, R2, R3), evergreen (R4) last.
    expect(result.map((c: ChatSuggestion) => c.id)).toEqual([
      'recent_receipts',
      'upcoming_deadline',
      'overdue_invoice',
      'evergreen_pricing',
    ]);
  });

  it('back-fills with cold-start chips when fewer than 4 rules fire', async () => {
    // Only R4 evergreen fires.
    const db = mockDb({
      transactions: { rows: [], count: 0 },
      birDeadlines: { rows: [] },
      invoices: { rows: [] },
    });
    const result = await indexMod!.buildSuggestions(db, USER_ID);
    expect(result).toHaveLength(4);
    // Evergreen should be present (fired), then back-fill from cold-start.
    expect(result.some((c: ChatSuggestion) => c.id === 'evergreen_pricing')).toBe(true);
    expect(result.length).toBe(4);
    // Pricing chip must not appear twice (dedup on intent or id).
    const pricingChips = result.filter((c: ChatSuggestion) => c.intent === 'pricing');
    expect(pricingChips.length).toBe(1);
  });

  it('returns full cold-start fallback verbatim when zero rules fire AND R4 is suppressed', async () => {
    // This guards the "any DB failure → return cold-start fallback" path
    // from ADR-016 §6. Engineer's index.ts should expose either
    // buildSuggestions throwing → caller catches → fallback, OR a
    // dedicated `getColdStartFallback()` helper. We assert the helper
    // shape if present.
    const helper = (indexMod as unknown as { getColdStartFallback?: () => ChatSuggestion[] })
      .getColdStartFallback;
    if (typeof helper !== 'function') {
      // Skip if engineer chose throw-and-catch route. The route-level test
      // covers DB-failure → fallback end-to-end.
      return;
    }
    expect(helper()).toEqual(COLD_START_FALLBACK);
  });
});
