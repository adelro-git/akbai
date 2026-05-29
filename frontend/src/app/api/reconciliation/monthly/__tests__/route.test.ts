/**
 * API Route Tests — GET /api/reconciliation/monthly
 * Feature: Sprint 18 data-completeness reconciliation (Build 5 rebuild).
 *
 * Verifies auth resolution (SKIP_AUTH dev path + service client per ADR-014),
 * query Zod validation, the daily_check_in fetch, and the response envelope.
 * Aggregation math is covered by lib/reconciliation/__tests__/aggregate.test.ts.
 *
 * Mocking pattern mirrors api/weekly-story/__tests__/route.test.ts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

const reqMock = (url = 'http://localhost/api/reconciliation/monthly'): NextRequest =>
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
  // Mid-month so days_elapsed is comfortably > 1.
  getManilaToday: () => '2026-05-10',
}));

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

describe('GET /api/reconciliation/monthly', () => {
  it('SKIP_AUTH path resolves DEV_USER and returns monthly reconciliation', async () => {
    mockServiceFrom.mockImplementation((table: string) => {
      expect(table).toBe('daily_check_in');
      return checkInBuilder([
        { check_in_date: '2026-05-01', sales_amount: 100000, expenses_amount: 30000 },
        { check_in_date: '2026-05-03', sales_amount: 50000, expenses_amount: null },
      ]);
    });

    const res = await GET(reqMock());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.month_start).toBe('2026-05-01');
    expect(json.data.month_end).toBe('2026-05-10');
    expect(json.data.month_label).toBe('Mayo 2026');
    expect(json.data.days_elapsed).toBe(10);
    expect(json.data.days_logged).toBe(2);
    expect(json.data.total_sales_centavos).toBe(150000);
    expect(json.data.total_expenses_centavos).toBe(30000);
    expect(json.data.net_centavos).toBe(120000);
    expect(json.data.missing_dates).toContain('2026-05-02');
    expect(json.data.missing_dates).not.toContain('2026-05-01');
  });

  it('returns all-missing reconciliation when the user has no check-ins', async () => {
    mockServiceFrom.mockImplementation(() => checkInBuilder([]));

    const res = await GET(reqMock());
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.days_logged).toBe(0);
    expect(json.data.days_elapsed).toBe(10);
    expect(json.data.missing_dates).toHaveLength(10);
    expect(json.data.net_centavos).toBe(0);
  });

  it('honors a valid ?today= override', async () => {
    mockServiceFrom.mockImplementation(() => checkInBuilder([]));

    const res = await GET(
      reqMock('http://localhost/api/reconciliation/monthly?today=2026-02-15'),
    );
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.month_start).toBe('2026-02-01');
    expect(json.data.month_end).toBe('2026-02-15');
    expect(json.data.month_label).toBe('Pebrero 2026');
    expect(json.data.days_elapsed).toBe(15);
  });

  it('rejects a malformed ?today= with INVALID_INPUT 400', async () => {
    const res = await GET(
      reqMock('http://localhost/api/reconciliation/monthly?today=05-2026'),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INVALID_INPUT');
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
  });
});
