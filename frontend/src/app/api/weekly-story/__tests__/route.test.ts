/**
 * API Route Tests — GET /api/weekly-story
 * Feature: Phase 7 home Kuwento card (ADR-015).
 *
 * Tests the four shapes the route can return:
 *   - SKIP_AUTH path resolves DEV_USER and aggregates via the service client.
 *   - No-data path returns { available: false, reason: 'no_data' }.
 *   - Happy path returns { available: true, story, cached: false }.
 *   - DB error path returns { available: false, reason: 'error' }.
 *
 * Mocking pattern mirrors morning-briefing/__tests__/route.test.ts so future
 * QA passes can read both side-by-side without context-switching.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Hoisted Mocks
// ============================================================

const {
  mockSupabaseAuth,
  mockSupabaseFrom,
  mockServiceFrom,
  mockAggregate,
} = vi.hoisted(() => {
  return {
    mockSupabaseAuth: { getUser: vi.fn() },
    mockSupabaseFrom: vi.fn(),
    mockServiceFrom: vi.fn(),
    mockAggregate: vi.fn(),
  };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: mockSupabaseAuth,
    from: mockSupabaseFrom,
  }),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({
    from: mockServiceFrom,
  })),
}));

// Default to SKIP_AUTH=true so the dev path is the headline shape; individual
// tests can override by re-mocking the module before importing GET.
vi.mock('@/lib/supabase/dev-auth', () => ({
  SKIP_AUTH: true,
  DEV_USER: { id: '00000000-0000-0000-0000-000000000000' },
}));

vi.mock('@/lib/timezone', () => ({
  getManilaToday: () => '2026-04-22',
}));

// Mock the aggregator — the route's job is glue, not aggregation logic.
// aggregate.test.ts already covers the math. Here we only verify the route's
// branching on aggregator output.
vi.mock('@/lib/weekly-story/aggregate', () => ({
  aggregateWeeklyStory: mockAggregate,
}));

// Helper to wire up a baseline `users` table read (display_name lookup).
function setupUsersTable(displayName: string | null = 'Maria') {
  const usersBuilder = {
    select: () => ({
      eq: () => ({
        single: () =>
          Promise.resolve({
            data: displayName ? { display_name: displayName } : null,
            error: null,
          }),
      }),
    }),
  };
  mockServiceFrom.mockImplementation((table: string) => {
    if (table === 'users') return usersBuilder;
    // Return a no-op chain for any other table — aggregator is mocked.
    return {
      select: () => ({
        eq: () => ({
          is: () => ({
            gte: () => ({
              lte: () =>
                Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
      }),
    };
  });
  // Mirror on the auth client too, in case any test flips SKIP_AUTH off.
  mockSupabaseFrom.mockImplementation((table: string) => {
    if (table === 'users') return usersBuilder;
    return {
      select: () => ({
        eq: () => ({
          is: () => ({
            gte: () => ({
              lte: () =>
                Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
      }),
    };
  });
}

// Import AFTER mocks so the route binds to them.
import { GET } from '../route';

// ============================================================
// Tests
// ============================================================

beforeEach(() => {
  vi.clearAllMocks();
  setupUsersTable('Maria');
});

describe('GET /api/weekly-story', () => {
  it('SKIP_AUTH path resolves DEV_USER and returns aggregated story', async () => {
    mockAggregate.mockResolvedValue({
      week_start: '2026-04-20',
      week_end: '2026-04-26',
      kita_centavos: 80000,
      gastos_centavos: 15000,
      tubo_centavos: 65000,
      daily_breakdown: [
        { date: '2026-04-20', day_label: 'Lun', kita_centavos: 50000, gastos_centavos: 0 },
        { date: '2026-04-21', day_label: 'Mar', kita_centavos: 0, gastos_centavos: 0 },
        { date: '2026-04-22', day_label: 'Miy', kita_centavos: 30000, gastos_centavos: 10000 },
        { date: '2026-04-23', day_label: 'Hue', kita_centavos: 0, gastos_centavos: 0 },
        { date: '2026-04-24', day_label: 'Bie', kita_centavos: 0, gastos_centavos: 0 },
        { date: '2026-04-25', day_label: 'Sab', kita_centavos: 0, gastos_centavos: 5000 },
        { date: '2026-04-26', day_label: 'Lin', kita_centavos: 0, gastos_centavos: 0 },
      ],
      peak_day_index: 0,
      takeaway: 'Kayang-kaya, Maria!',
      tone: 'celebratory',
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.available).toBe(true);
    expect(json.data.cached).toBe(false);
    expect(json.data.story.week_start).toBe('2026-04-20');
    expect(json.data.story.week_end).toBe('2026-04-26');
    expect(json.data.story.kita_centavos).toBe(80000);
    expect(json.data.story.tubo_centavos).toBe(65000);
    expect(json.data.story.daily_breakdown).toHaveLength(7);
    // Aggregator called with DEV_USER's id (the SKIP_AUTH constant).
    expect(mockAggregate).toHaveBeenCalledTimes(1);
    expect(mockAggregate.mock.calls[0][1]).toBe('00000000-0000-0000-0000-000000000000');
    // userName was forwarded from the users table read.
    expect(mockAggregate.mock.calls[0][2]).toBe('Maria');
  });

  it('returns no_data shape when the aggregator returns null', async () => {
    mockAggregate.mockResolvedValue(null);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.available).toBe(false);
    expect(json.data.reason).toBe('no_data');
    expect(json.data.cached).toBe(false);
    expect(typeof json.data.message_tl).toBe('string');
    // Empty-state copy must invite the next action (resibo or check-in).
    expect(json.data.message_tl).toMatch(/resibo|check-in/i);
  });

  it('returns error shape when the aggregator throws', async () => {
    mockAggregate.mockRejectedValue(new Error('db down'));

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200); // Route swallows DB errors — UI degrades gracefully
    expect(json.success).toBe(true);
    expect(json.data.available).toBe(false);
    expect(json.data.reason).toBe('error');
    expect(json.data.cached).toBe(false);
    expect(json.data.message_tl).toContain('problema');
  });

  it('forwards undefined userName when display_name is null', async () => {
    setupUsersTable(null);
    mockAggregate.mockResolvedValue(null);

    await GET();

    expect(mockAggregate).toHaveBeenCalledTimes(1);
    // 3rd arg is the user's display name; null → undefined per the route.
    expect(mockAggregate.mock.calls[0][2]).toBeUndefined();
  });

  it('returns error shape (top-level catch) when the supabase client itself throws', async () => {
    // Force users-table lookup to blow up before the aggregator is reached.
    mockServiceFrom.mockImplementation(() => {
      throw new Error('service client unavailable');
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.available).toBe(false);
    expect(json.data.reason).toBe('error');
    expect(json.data.message_tl).toContain('problema');
    // Aggregator should never have been reached.
    expect(mockAggregate).not.toHaveBeenCalled();
  });
});
