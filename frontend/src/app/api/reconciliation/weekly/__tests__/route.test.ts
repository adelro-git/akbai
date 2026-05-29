/**
 * API Route Tests — GET /api/reconciliation/weekly
 * Feature: Sprint 18 data-completeness reconciliation (Build 5 rebuild).
 *
 * Verifies the route's glue: auth resolution (SKIP_AUTH dev path + service
 * client per ADR-014), query Zod validation, the daily_check_in fetch, and
 * the response envelope shape. The aggregation math itself is covered by
 * lib/reconciliation/__tests__/aggregate.test.ts.
 *
 * Mocking pattern mirrors api/weekly-story/__tests__/route.test.ts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

const reqMock = (url = 'http://localhost/api/reconciliation/weekly'): NextRequest =>
  new Request(url) as unknown as NextRequest;

// ============================================================
// Hoisted Mocks
// ============================================================

const { mockSupabaseAuth, mockSupabaseFrom, mockServiceFrom } = vi.hoisted(() => ({
  mockSupabaseAuth: { getUser: vi.fn() },
  mockSupabaseFrom: vi.fn(),
  mockServiceFrom: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: mockSupabaseAuth,
    from: mockSupabaseFrom,
  }),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({ from: mockServiceFrom })),
}));

vi.mock('@/lib/supabase/dev-auth', () => ({
  SKIP_AUTH: true,
  DEV_USER: { id: '00000000-0000-0000-0000-000000000000' },
}));

vi.mock('@/lib/timezone', () => ({
  getManilaToday: () => '2026-04-22',
}));

/**
 * Build a thenable daily_check_in query builder. The route chains
 * .select().eq().is().gte().lte() then awaits the result.
 */
function checkInBuilder(rows: unknown[], error: unknown = null) {
  const builder = {
    select: () => builder,
    eq: () => builder,
    is: () => builder,
    gte: () => builder,
    lte: () => builder,
    then: (resolve: (v: { data: unknown[] | null; error: unknown }) => void) =>
      resolve(error ? { data: null, error } : { data: rows, error: null }),
  };
  return builder;
}

import { GET } from '../route';

// ============================================================
// Tests
// ============================================================

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/reconciliation/weekly', () => {
  it('SKIP_AUTH path resolves DEV_USER and returns weekly reconciliation', async () => {
    mockServiceFrom.mockImplementation((table: string) => {
      expect(table).toBe('daily_check_in');
      return checkInBuilder([
        { check_in_date: '2026-04-22', sales_amount: 50000, expenses_amount: 10000 },
        { check_in_date: '2026-04-20', sales_amount: 30000, expenses_amount: null },
      ]);
    });

    const res = await GET(reqMock());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.range_end).toBe('2026-04-22');
    expect(json.data.range_start).toBe('2026-04-16');
    expect(json.data.days).toHaveLength(7);
    expect(json.data.logged_count).toBe(2);
    expect(json.data.total_sales_centavos).toBe(80000);
    expect(json.data.total_expenses_centavos).toBe(10000);
    expect(json.data.net_centavos).toBe(70000);
    expect(json.data.missing_dates).toContain('2026-04-21');
    expect(json.data.missing_dates).not.toContain('2026-04-22');
  });

  it('returns all-missing reconciliation when the user has no check-ins', async () => {
    mockServiceFrom.mockImplementation(() => checkInBuilder([]));

    const res = await GET(reqMock());
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.logged_count).toBe(0);
    expect(json.data.missing_dates).toHaveLength(7);
    expect(json.data.net_centavos).toBe(0);
  });

  it('honors a valid ?today= override', async () => {
    mockServiceFrom.mockImplementation(() => checkInBuilder([]));

    const res = await GET(
      reqMock('http://localhost/api/reconciliation/weekly?today=2026-05-03'),
    );
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.range_end).toBe('2026-05-03');
    expect(json.data.range_start).toBe('2026-04-27');
  });

  it('rejects a malformed ?today= with INVALID_INPUT 400', async () => {
    const res = await GET(
      reqMock('http://localhost/api/reconciliation/weekly?today=not-a-date'),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INVALID_INPUT');
    expect(json.error.message_tl).toBeTruthy();
  });

  it('returns DB_ERROR 500 when the query errors', async () => {
    mockServiceFrom.mockImplementation(() =>
      checkInBuilder([], new Error('db down')),
    );

    const res = await GET(reqMock());
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('DB_ERROR');
    expect(json.error.message_tl).toContain('problema');
  });
});
