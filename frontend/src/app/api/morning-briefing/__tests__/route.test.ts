/**
 * API Route Tests — GET /api/morning-briefing
 * Feature: Ang Umaga Mo (Build 5)
 *
 * Tests the morning briefing endpoint's gating logic: feature flags,
 * tier checks, caching, time window enforcement, Claude API integration,
 * and error handling. These are critical paths — a bug here could mean
 * Free users getting Pro content (revenue loss) or cached stale data.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Hoisted Mocks
// ============================================================

const {
  mockSupabaseAuth,
  mockSupabaseFrom,
  mockAnthropicCreate,
  mockServiceFrom,
  mockServiceRpc,
} = vi.hoisted(() => {
  return {
    mockSupabaseAuth: { getUser: vi.fn() },
    mockSupabaseFrom: vi.fn(),
    mockAnthropicCreate: vi.fn(),
    mockServiceFrom: vi.fn(),
    mockServiceRpc: vi.fn(),
  };
});

// --- Supabase client mock ---
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: mockSupabaseAuth,
    from: mockSupabaseFrom,
  }),
}));

// --- Supabase service client mock ---
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({
    from: mockServiceFrom,
    rpc: mockServiceRpc.mockResolvedValue({ error: null }),
  })),
}));

// --- Anthropic SDK mock ---
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockAnthropicCreate },
  })),
}));

// --- Dev-auth: ensure SKIP_AUTH is false for most tests ---
vi.mock('@/lib/supabase/dev-auth', () => ({
  SKIP_AUTH: false,
  DEV_USER: { id: '00000000-0000-0000-0000-000000000000' },
}));

// --- Timezone: deterministic Manila time ---
let mockManilaHour = 8; // Default: 8 AM (inside morning window)

vi.mock('@/lib/timezone', () => ({
  getManilaToday: () => '2026-03-28',
  toManila: () => new Date(Date.UTC(2026, 2, 28, mockManilaHour, 0, 0)),
  formatManilaDate: (_date?: Date, fmt?: string) => {
    if (fmt === 'EEEE') return 'Saturday';
    return '2026-03-28';
  },
}));

// --- Feature flags ---
vi.mock('@/lib/feature-flags/flags', () => ({
  FLAGS: {
    MORNING_BRIEFING_ENABLED: 'morning_briefing_enabled',
  },
}));

// --- Aggregation mock ---
vi.mock('@/lib/morning-briefing', () => ({
  aggregateBriefingData: vi.fn().mockResolvedValue({
    briefing_date: '2026-03-28',
    day_of_week: 'Saturday',
    yesterday: {
      total_income_centavos: 500000,
      total_expenses_centavos: 150000,
      income_count: 3,
      expense_count: 2,
      top_expense_categories: [{ category: 'ingredients', amount_centavos: 100000 }],
      has_transactions: true,
    },
    cash_position: { balance_centavos: 350000, trend_vs_last_week: 'up', change_centavos: 50000 },
    upcoming_deadlines: [],
    week_comparison: {
      this_week_income_centavos: 800000,
      last_week_income_centavos: 600000,
      this_week_expense_centavos: 300000,
      last_week_expense_centavos: 250000,
    },
    days_since_signup: 30,
    has_any_transactions: true,
  }),
}));

// --- Claude lib mocks ---
vi.mock('@/lib/claude', () => ({
  assembleSystemPrompt: vi.fn(() => 'mock-system-prompt'),
  selectModel: vi.fn(() => 'claude-sonnet-4-20250514'),
  getMaxTokens: vi.fn(() => 500),
  applyBIRDisclaimer: vi.fn((text: string) => text),
  filterOutput: vi.fn((text: string) => text),
  checkCircuitBreaker: vi.fn().mockResolvedValue({ allowed: true }),
  recordSpend: vi.fn().mockResolvedValue(undefined),
  estimateCost: vi.fn(() => 0.005),
  calculateActualCost: vi.fn(() => 0.003),
  KA_ERROR_MESSAGES: {
    api_error: 'Pasensya, may problema.',
    global_cap: 'Nag-cap na ang system.',
    user_cap: 'Nag-cap na ang account mo.',
    circuit_breaker_unavailable: 'Hindi available ang system ngayon.',
  },
}));

// ============================================================
// Helpers
// ============================================================

const mockUser = { id: 'user-maria-001', email: 'maria@test.local' };
const mockProfile = { business_type: 'food_baking', bir_registered: true };
const mockUserData = {
  display_name: 'Maria',
  onboarding_completed: true,
  feature_flags: {},
};
const mockSubscription = { tier: 'pro' };

function setupDefaultMocks(overrides?: {
  user?: typeof mockUser | null;
  subscription?: { tier: string } | null;
  featureFlags?: Record<string, boolean>;
  cachedBriefing?: string | null;
}) {
  const user = overrides?.user !== undefined ? overrides.user : mockUser;
  const sub = overrides?.subscription !== undefined ? overrides.subscription : mockSubscription;
  const flags = overrides?.featureFlags ?? {};
  const cached = overrides?.cachedBriefing ?? null;

  mockSupabaseAuth.getUser.mockResolvedValue({
    data: { user },
    error: user ? null : { message: 'Not authenticated' },
  });

  mockSupabaseFrom.mockImplementation((table: string) => {
    if (table === 'business_profiles') {
      return {
        select: () => ({
          eq: () => ({
            is: () => ({
              single: () => Promise.resolve({ data: mockProfile, error: null }),
            }),
          }),
        }),
      };
    }
    if (table === 'users') {
      return {
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: { ...mockUserData, feature_flags: flags },
                error: null,
              }),
          }),
        }),
      };
    }
    if (table === 'subscriptions') {
      return {
        select: () => ({
          eq: () => ({
            is: () => ({
              single: () => Promise.resolve({ data: sub, error: null }),
            }),
          }),
        }),
      };
    }
    if (table === 'daily_check_in') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              is: () => ({
                not: () => ({
                  single: () =>
                    Promise.resolve({
                      data: cached ? { briefing_content: cached, briefing_generated_at: '2026-03-28T08:00:00Z' } : null,
                      error: cached ? null : { code: 'PGRST116' },
                    }),
                }),
              }),
            }),
          }),
        }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };
    }
    return {
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    };
  });

  // Service client mocks for circuit breaker
  mockServiceFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        data: [{ total_cost_usd: 0 }],
        error: null,
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { total_cost_usd: 0, query_count: 0 },
            error: null,
          }),
        }),
      }),
    }),
  });
}

// Import route handler AFTER mocks
import { GET } from '../route';

// ============================================================
// Tests
// ============================================================

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ANTHROPIC_API_KEY = 'test-api-key-123';
  mockManilaHour = 8; // Reset to morning window
  setupDefaultMocks();
});

describe('GET /api/morning-briefing', () => {
  // --- Auth ---

  it('returns 401 when user is not authenticated', async () => {
    setupDefaultMocks({ user: null });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('UNAUTHORIZED');
    expect(json.error.message_tl).toContain('mag-login');
  });

  // --- Feature flag disabled ---

  it('returns feature_disabled when morning briefing flag is false', async () => {
    setupDefaultMocks({
      featureFlags: { morning_briefing_enabled: false },
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.available).toBe(false);
    expect(json.data.reason).toBe('feature_disabled');
    expect(json.data.message_tl).toBeTruthy();
  });

  // --- Free tier ---

  it('returns tier_required for free tier users', async () => {
    setupDefaultMocks({ subscription: { tier: 'free' } });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.available).toBe(false);
    expect(json.data.reason).toBe('tier_required');
    expect(json.data.message_tl).toContain('Pro');
  });

  // --- Cache hit ---

  it('returns cached briefing without calling Claude', async () => {
    const cachedText = 'Magandang umaga, Maria! Eto ang update mo...';
    setupDefaultMocks({ cachedBriefing: cachedText });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.available).toBe(true);
    expect(json.data.briefing).toBe(cachedText);
    expect(json.data.cached).toBe(true);
    // Claude should NOT have been called
    expect(mockAnthropicCreate).not.toHaveBeenCalled();
  });

  // --- Outside time window ---

  it('returns outside_window when outside 5AM-12PM Manila', async () => {
    mockManilaHour = 14; // 2 PM
    setupDefaultMocks();

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.available).toBe(false);
    expect(json.data.reason).toBe('outside_window');
    expect(json.data.message_tl).toContain('5AM to 12PM');
  });

  it('returns outside_window before 5AM Manila', async () => {
    mockManilaHour = 3; // 3 AM
    setupDefaultMocks();

    const res = await GET();
    const json = await res.json();

    expect(json.data.available).toBe(false);
    expect(json.data.reason).toBe('outside_window');
  });

  // --- Successful generation ---

  it('calls Claude, caches, and returns briefing for valid Pro user in morning window', async () => {
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Magandang umaga, Maria! Happy Saturday...' }],
      usage: { input_tokens: 2500, output_tokens: 300 },
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.available).toBe(true);
    expect(json.data.briefing).toBe('Magandang umaga, Maria! Happy Saturday...');
    expect(json.data.cached).toBe(false);
    expect(mockAnthropicCreate).toHaveBeenCalledOnce();
  });

  // --- Claude API error ---

  it('returns error response gracefully when Claude API throws', async () => {
    mockAnthropicCreate.mockRejectedValue(new Error('Claude API overloaded'));

    const res = await GET();
    const json = await res.json();

    // The route catches all errors and returns a graceful response
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.available).toBe(false);
    expect(json.data.reason).toBe('error');
    expect(json.data.message_tl).toContain('problema');
  });

  // --- Missing API key ---

  it('returns error when ANTHROPIC_API_KEY is not configured', async () => {
    process.env.ANTHROPIC_API_KEY = '';

    const res = await GET();
    const json = await res.json();

    expect(json.data.available).toBe(false);
    expect(json.data.reason).toBe('error');
    expect(mockAnthropicCreate).not.toHaveBeenCalled();
  });

  // --- Business tier also allowed ---

  it('allows business tier users to access morning briefing', async () => {
    setupDefaultMocks({ subscription: { tier: 'business' } });
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Good morning, Boss!' }],
      usage: { input_tokens: 2000, output_tokens: 200 },
    });

    const res = await GET();
    const json = await res.json();

    expect(json.data.available).toBe(true);
    expect(json.data.briefing).toBeTruthy();
  });

  // --- Feature flag not explicitly set (defaults to enabled) ---

  it('treats missing feature flag as enabled (default behavior)', async () => {
    setupDefaultMocks({ featureFlags: {} }); // No flag set
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Morning briefing content' }],
      usage: { input_tokens: 2000, output_tokens: 200 },
    });

    const res = await GET();
    const json = await res.json();

    // Should proceed to generate briefing (flag not explicitly false)
    expect(json.data.reason).not.toBe('feature_disabled');
  });
});
