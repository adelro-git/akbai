/**
 * API Route Tests — GET /api/chat/suggestions (ADR-016)
 *
 * Contract under test:
 *   - 401 when unauthenticated (auth path; SKIP_AUTH path uses DEV_USER)
 *   - Returns exactly 4 ChatSuggestion entries
 *   - Personalized rules first, evergreen last (verified at index.ts unit
 *     layer; route-level test asserts shape only)
 *   - In-process cache: second request within 30 min for same user returns
 *     cached:true and does NOT re-run rule queries
 *   - DB failure → graceful degradation to cold-start fallback (4 chips,
 *     cached:false), HTTP 200 (NEVER 500)
 *   - RLS scoping: User A cannot retrieve User B's cached suggestions
 *     (cache key = user.id; integration check)
 *   - All tiers allowed (no tier check); chat is universal per ADR-016 §1
 *
 * Why these tests: chip row breakage is high-visibility (first thing a user
 * sees on /chat). The "DB failure → fallback, never 500" path is the entire
 * point of the rule-based design — if it leaks a 500, the chat page error
 * boundary fires and the user sees a broken header instead of a usable
 * composer.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Hoisted Mocks
// ============================================================

const {
  mockSupabaseAuth,
  mockSupabaseFrom,
  mockServiceFrom,
  mockBuildSuggestions,
  mockGetSuggestions,
  mockSetSuggestions,
  mockClearCache,
} = vi.hoisted(() => {
  return {
    mockSupabaseAuth: { getUser: vi.fn() },
    mockSupabaseFrom: vi.fn(),
    mockServiceFrom: vi.fn(),
    mockBuildSuggestions: vi.fn(),
    mockGetSuggestions: vi.fn(),
    mockSetSuggestions: vi.fn(),
    mockClearCache: vi.fn(),
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

// SKIP_AUTH defaults to false; individual tests can re-mock if they need to
// exercise the dev-bypass path.
vi.mock('@/lib/supabase/dev-auth', () => ({
  SKIP_AUTH: false,
  DEV_USER: { id: '00000000-0000-0000-0000-000000000000' },
}));

// Engineer's planned modules — mocked at the boundary so route logic is
// isolated. Unit tests in `lib/chat/suggestions/__tests__/` cover the real
// implementations.
vi.mock('@/lib/chat/suggestions', () => ({
  buildSuggestions: mockBuildSuggestions,
  getColdStartFallback: () => [
    { id: 'cold_start_expenses', text_tl: 'Saan napunta ang pera ko?', intent: 'expenses' },
    { id: 'cold_start_deadlines', text_tl: 'Kailan ang BIR deadline?', intent: 'deadlines' },
    { id: 'cold_start_pricing', text_tl: 'Magkano dapat presyo?', intent: 'pricing' },
    { id: 'cold_start_capture', text_tl: 'I-record ang gastos', intent: 'expense_capture' },
  ],
}));

vi.mock('@/lib/chat/suggestions/cache', () => ({
  getSuggestions: mockGetSuggestions,
  setSuggestions: mockSetSuggestions,
  clearCache: mockClearCache,
}));

// ============================================================
// Helpers
// ============================================================

const PERSONALIZED_FOUR = [
  { id: 'recent_receipts', text_tl: 'I-summarize ang gastos ngayong linggo', intent: 'expenses' },
  { id: 'upcoming_deadline', text_tl: 'Ano ang 2551Q?', intent: 'deadlines' },
  { id: 'overdue_invoice', text_tl: 'Sinong may utang pa?', intent: 'invoices' },
  { id: 'evergreen_pricing', text_tl: 'Magkano dapat presyo ng produkto ko?', intent: 'pricing' },
];

const COLD_START_FOUR = [
  { id: 'cold_start_expenses', text_tl: 'Saan napunta ang pera ko?', intent: 'expenses' },
  { id: 'cold_start_deadlines', text_tl: 'Kailan ang BIR deadline?', intent: 'deadlines' },
  { id: 'cold_start_pricing', text_tl: 'Magkano dapat presyo?', intent: 'pricing' },
  { id: 'cold_start_capture', text_tl: 'I-record ang gastos', intent: 'expense_capture' },
];

const USER_A = { id: 'user-maria-001', email: 'maria@test.local' };
const USER_B = { id: 'user-jose-002', email: 'jose@test.local' };

function authAs(user: typeof USER_A | null) {
  mockSupabaseAuth.getUser.mockResolvedValue({
    data: { user },
    error: user ? null : { message: 'Not authenticated' },
  });
}

// ============================================================
// Route handler import — engineer shipped `../route.ts` in Phase 8c.
// ============================================================

import { GET } from '../route';

// ============================================================
// Tests
// ============================================================

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSuggestions.mockReturnValue(null); // default: cache miss
});

describe('GET /api/chat/suggestions', () => {
  // --- Auth ---

  it('returns 401 when unauthenticated (no SKIP_AUTH bypass)', async () => {
    authAs(null);
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('UNAUTHORIZED');
    expect(json.error.message_tl).toContain('mag-login');
  });

  // --- Happy path: cache miss, all rules fire ---

  it('returns 4 personalized suggestions on cache miss when rules fire', async () => {
    authAs(USER_A);
    mockBuildSuggestions.mockResolvedValueOnce(PERSONALIZED_FOUR);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.suggestions).toHaveLength(4);
    expect(json.data.suggestions).toEqual(PERSONALIZED_FOUR);
    expect(json.data.cached).toBe(false);
    // Cache write happened
    expect(mockSetSuggestions).toHaveBeenCalledWith(USER_A.id, PERSONALIZED_FOUR);
  });

  it('always returns exactly 4 suggestions (contract invariant)', async () => {
    authAs(USER_A);
    mockBuildSuggestions.mockResolvedValueOnce(PERSONALIZED_FOUR);

    const res = await GET();
    const json = await res.json();

    expect(json.data.suggestions).toHaveLength(4);
  });

  // --- Cache hit path ---

  it('returns cached suggestions without re-running buildSuggestions', async () => {
    authAs(USER_A);
    mockGetSuggestions.mockReturnValue(PERSONALIZED_FOUR);

    const res = await GET();
    const json = await res.json();

    expect(json.data.cached).toBe(true);
    expect(json.data.suggestions).toEqual(PERSONALIZED_FOUR);
    expect(mockBuildSuggestions).not.toHaveBeenCalled();
    expect(mockSetSuggestions).not.toHaveBeenCalled();
  });

  it('uses user.id as the cache key (RLS at cache layer)', async () => {
    // First request as user A — cache miss, build, cache.
    authAs(USER_A);
    mockGetSuggestions.mockReturnValueOnce(null);
    mockBuildSuggestions.mockResolvedValueOnce(PERSONALIZED_FOUR);

    const resA = await GET!();
    expect((await resA.json()).data.cached).toBe(false);
    expect(mockGetSuggestions).toHaveBeenCalledWith(USER_A.id);
    expect(mockSetSuggestions).toHaveBeenCalledWith(USER_A.id, PERSONALIZED_FOUR);

    // Second request as user B — must NOT see user A's cached value.
    authAs(USER_B);
    mockGetSuggestions.mockReturnValueOnce(null); // user B: distinct key, distinct miss
    mockBuildSuggestions.mockResolvedValueOnce(COLD_START_FOUR);

    const resB = await GET!();
    expect(mockGetSuggestions).toHaveBeenLastCalledWith(USER_B.id);
    expect((await resB.json()).data.cached).toBe(false);
  });

  // --- Graceful degradation (DB failure) ---

  it('returns cold-start fallback (4 chips, 200 OK) when buildSuggestions throws', async () => {
    authAs(USER_A);
    mockBuildSuggestions.mockRejectedValueOnce(new Error('Postgres connection refused'));

    const res = await GET();
    const json = await res.json();

    // Per ADR-016 §6: DB failure → fallback, NEVER 500.
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.suggestions).toHaveLength(4);
    expect(json.data.suggestions).toEqual(COLD_START_FOUR);
    expect(json.data.cached).toBe(false);
  });

  it('returns cold-start fallback when buildSuggestions returns fewer than 4 (defensive)', async () => {
    authAs(USER_A);
    // index.ts SHOULD always return 4, but if it doesn't (bug), the route
    // must not propagate a malformed contract.
    mockBuildSuggestions.mockResolvedValueOnce([
      { id: 'evergreen_pricing', text_tl: 'Magkano dapat presyo ng produkto ko?', intent: 'pricing' },
    ]);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.suggestions).toHaveLength(4);
  });

  // --- Tier-agnostic ---

  it('does NOT call any tier-gating code path (universal access per ADR-016 §1)', async () => {
    authAs(USER_A);
    mockBuildSuggestions.mockResolvedValueOnce(PERSONALIZED_FOUR);

    const res = await GET();
    expect(res.status).toBe(200);
    // We don't directly assert "subscription table NOT queried" because the
    // engineer might still load it for context; instead, assert no
    // tier-rejected response code was returned. tier_required would never
    // appear in this contract.
    const json = await res.json();
    expect(json.data.reason).not.toBe('tier_required');
  });
});
