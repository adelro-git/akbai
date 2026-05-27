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
import type { NextRequest } from 'next/server';
import { _resetStore } from '@/lib/rate-limit';

// Sprint 15: route GET signature gained `req: NextRequest` for the per-route
// rate-limit guard. Tests pass a minimal mock — enforceRateLimit() only reads
// the `headers` interface. The in-memory rate-limit store is reset in
// beforeEach to keep tests independent (the 10/60s cap would otherwise trip
// after the 10th test in the file).
const reqMock = (): NextRequest =>
  new Request('http://localhost/api/morning-briefing') as unknown as NextRequest;

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

// --- Aggregation + tone + fallback mocks ---
// We mock only `aggregateBriefingData` (network-bound). pickTone + pickFallback
// are pure functions — let the route exercise them for real so we verify the
// real D6 rotation copy is what reaches the client.
vi.mock('@/lib/morning-briefing', async () => {
  const actual = await vi.importActual<typeof import('@/lib/morning-briefing')>(
    '@/lib/morning-briefing'
  );
  return {
    ...actual,
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
  };
});

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
  _resetStore();
  process.env.ANTHROPIC_API_KEY = 'test-api-key-123';
  mockManilaHour = 8; // Reset to morning window
  setupDefaultMocks();
});

describe('GET /api/morning-briefing', () => {
  // --- Auth ---

  it('returns 401 when user is not authenticated', async () => {
    setupDefaultMocks({ user: null });

    const res = await GET(reqMock());
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

    const res = await GET(reqMock());
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

    const res = await GET(reqMock());
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

    const res = await GET(reqMock());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.available).toBe(true);
    expect(json.data.briefing).toBe(cachedText);
    expect(json.data.cached).toBe(true);
    // Tone is computed deterministically even on cache hits (Phase 7).
    // 2026-03-28 → dayOfYear 87 → celebratory.
    expect(json.data.tone).toBe('celebratory');
    // Tagline is undefined for pre-migration cached rows — hero degrades cleanly.
    expect(json.data.tagline).toBeUndefined();
    // Claude should NOT have been called
    expect(mockAnthropicCreate).not.toHaveBeenCalled();
  });

  // --- Outside time window ---

  it('returns outside_window when outside 5AM-11PM Manila', async () => {
    mockManilaHour = 23; // 11 PM
    setupDefaultMocks();

    const res = await GET(reqMock());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.available).toBe(false);
    expect(json.data.reason).toBe('outside_window');
    expect(json.data.message_tl).toContain('5AM');
  });

  it('returns outside_window before 5AM Manila', async () => {
    mockManilaHour = 3; // 3 AM
    setupDefaultMocks();

    const res = await GET(reqMock());
    const json = await res.json();

    expect(json.data.available).toBe(false);
    expect(json.data.reason).toBe('outside_window');
  });

  // --- Successful generation ---

  it('calls Claude, parses JSON, and returns briefing + tagline + tone', async () => {
    mockAnthropicCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            briefing: 'Magandang umaga, Maria! Happy Saturday — eto ang update mo.',
            tagline: 'Tara, simulan na natin ang araw, Maria!',
          }),
        },
      ],
      usage: { input_tokens: 2500, output_tokens: 300 },
    });

    const res = await GET(reqMock());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.available).toBe(true);
    expect(json.data.briefing).toContain('Magandang umaga, Maria');
    expect(json.data.tagline).toBe('Tara, simulan na natin ang araw, Maria!');
    // 2026-03-28 → dayOfYear 87 → (87-1) % 3 = 86 % 3 = 2 → celebratory
    expect(json.data.tone).toBe('celebratory');
    expect(json.data.cached).toBe(false);
    expect(mockAnthropicCreate).toHaveBeenCalledOnce();
  });

  it('falls back to no tagline when Claude returns non-JSON text', async () => {
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Magandang umaga, Maria! Plain text response.' }],
      usage: { input_tokens: 2500, output_tokens: 300 },
    });

    const res = await GET(reqMock());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.available).toBe(true);
    expect(json.data.briefing).toContain('Magandang umaga, Maria');
    expect(json.data.tagline).toBeUndefined();
    expect(json.data.tone).toBe('celebratory'); // tone is still selected
  });

  it('strips markdown fences when parsing Claude JSON', async () => {
    mockAnthropicCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: '```json\n{"briefing": "Briefing text", "tagline": "Hello, Maria!"}\n```',
        },
      ],
      usage: { input_tokens: 2500, output_tokens: 300 },
    });

    const res = await GET(reqMock());
    const json = await res.json();

    expect(json.data.briefing).toContain('Briefing text');
    expect(json.data.tagline).toBe('Hello, Maria!');
  });

  // --- Claude graceful fallback (Phase 7 — no_credits) ---

  it('returns deterministic fallback when Claude throws "credit balance" error', async () => {
    mockAnthropicCreate.mockRejectedValue(new Error('Your credit balance is too low to process this request.'));

    const res = await GET(reqMock());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.available).toBe(true);
    expect(json.data.reason).toBe('no_credits');
    expect(json.data.tone).toBe('celebratory'); // 2026-03-28 → celebratory
    expect(typeof json.data.tagline).toBe('string');
    expect(json.data.tagline.length).toBeGreaterThan(0);
    expect(json.data.tagline.length).toBeLessThanOrEqual(80);
    expect(json.data.tagline).toContain('Maria');
    expect(typeof json.data.briefing).toBe('string');
    expect(json.data.briefing).toContain('Maria');
    // Fallback must NOT contain fabricated peso amounts
    expect(json.data.briefing).not.toMatch(/₱\s*\d/);
  });

  it('returns deterministic fallback when Claude throws "insufficient" error', async () => {
    mockAnthropicCreate.mockRejectedValue(new Error('Insufficient funds for this request'));

    const res = await GET(reqMock());
    const json = await res.json();

    expect(json.data.available).toBe(true);
    expect(json.data.reason).toBe('no_credits');
    expect(json.data.tagline).toBeTruthy();
  });

  it('returns deterministic fallback on Anthropic 5xx errors', async () => {
    const sdkError = Object.assign(new Error('Internal server error'), { status: 503 });
    mockAnthropicCreate.mockRejectedValue(sdkError);

    const res = await GET(reqMock());
    const json = await res.json();

    expect(json.data.available).toBe(true);
    expect(json.data.reason).toBe('no_credits');
    expect(json.data.tone).toBeDefined();
  });

  it('returns deterministic fallback when ANTHROPIC_API_KEY is the dev placeholder', async () => {
    process.env.ANTHROPIC_API_KEY = 'your-anthropic-api-key-here';

    const res = await GET(reqMock());
    const json = await res.json();

    expect(json.data.available).toBe(true);
    expect(json.data.reason).toBe('no_credits');
    expect(json.data.tone).toBeDefined();
    expect(json.data.tagline).toBeTruthy();
    expect(mockAnthropicCreate).not.toHaveBeenCalled();
  });

  it('returns deterministic fallback when ANTHROPIC_API_KEY is empty', async () => {
    process.env.ANTHROPIC_API_KEY = '';

    const res = await GET(reqMock());
    const json = await res.json();

    expect(json.data.available).toBe(true);
    expect(json.data.reason).toBe('no_credits');
    expect(json.data.tagline).toBeTruthy();
    expect(mockAnthropicCreate).not.toHaveBeenCalled();
  });

  // --- Other Claude error (4xx that isn't credits) — should still degrade gracefully ---

  it('returns generic error for non-credit non-5xx Claude failures', async () => {
    // 4xx that's NOT a credit issue — caught by outer try/catch.
    // Because pickedTone is set by this point, the route falls back to a tagline.
    const sdkError = Object.assign(new Error('Bad request: malformed input'), { status: 400 });
    mockAnthropicCreate.mockRejectedValue(sdkError);

    const res = await GET(reqMock());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    // Phase 7 last-ditch fallback: even unexpected errors degrade to a tagline
    // because pickedTone is set during the cache-check phase.
    expect(json.data.available).toBe(true);
    expect(json.data.reason).toBe('no_credits');
  });

  // --- Business tier also allowed ---

  it('allows business tier users to access morning briefing', async () => {
    setupDefaultMocks({ subscription: { tier: 'business' } });
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Good morning, Boss!' }],
      usage: { input_tokens: 2000, output_tokens: 200 },
    });

    const res = await GET(reqMock());
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

    const res = await GET(reqMock());
    const json = await res.json();

    // Should proceed to generate briefing (flag not explicitly false)
    expect(json.data.reason).not.toBe('feature_disabled');
  });
});
