import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Hoisted mocks (vi.mock factories run before module-level code) ---
const { mockSupabaseAuth, mockSupabaseFrom, mockAnthropicCreate } = vi.hoisted(() => {
  const mockSupabaseFrom = vi.fn();
  const mockSupabaseAuth = {
    getUser: vi.fn(),
  };
  const mockAnthropicCreate = vi.fn();
  return { mockSupabaseAuth, mockSupabaseFrom, mockAnthropicCreate };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: mockSupabaseAuth,
    from: mockSupabaseFrom,
  }),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          data: [{ total_cost_usd: 0 }],
          error: null,
          eq: vi.fn().mockReturnValue({
            // Circuit breaker reads per-user spend via .maybeSingle() (C6).
            maybeSingle: vi.fn().mockResolvedValue({
              data: { total_cost_usd: 0, query_count: 0 },
              error: null,
            }),
          }),
        }),
      }),
    }),
    rpc: vi.fn().mockResolvedValue({ error: null }),
  })),
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockAnthropicCreate },
  })),
}));

// --- Default mock data ---
const mockUser = { id: 'user-123', email: 'maria@test.local' };
const mockProfile = { business_type: 'food_seller', bir_registered: true };
const mockUserData = { display_name: 'Maria' };
const mockSubscription = { tier: 'free' };

function setupSupabaseFromMock(overrides?: {
  user?: typeof mockUser | null;
}) {
  const user = overrides?.user !== undefined ? overrides.user : mockUser;

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
            single: () => Promise.resolve({ data: mockUserData, error: null }),
          }),
        }),
      };
    }
    if (table === 'subscriptions') {
      return {
        select: () => ({
          eq: () => ({
            is: () => ({
              single: () => Promise.resolve({ data: mockSubscription, error: null }),
            }),
          }),
        }),
      };
    }
    if (table === 'ka_conversations') {
      return {
        select: (_cols?: string, opts?: { count?: string; head?: boolean }) => {
          // Count query for queriesUsedToday (head: true)
          if (opts?.head) {
            return {
              eq: () => ({
                eq: () => ({
                  is: () => ({
                    gte: () => Promise.resolve({ count: 1, error: null }),
                  }),
                }),
              }),
            };
          }
          // History query (order + limit)
          return {
            eq: () => ({
              is: () => ({
                order: () => ({
                  limit: () => Promise.resolve({ data: [], error: null }),
                }),
              }),
            }),
          };
        },
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    }
    return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) };
  });
}

// Import after mocks are defined
import { POST } from '../route';

function createRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as Request;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ANTHROPIC_API_KEY = 'test-api-key-123';

  mockAnthropicCreate.mockResolvedValue({
    content: [{ type: 'text', text: 'Magandang umaga, Maria! Eto ang sales mo ngayong linggo.' }],
    usage: { input_tokens: 1500, output_tokens: 200 },
  });

  setupSupabaseFromMock();
});

describe('POST /api/chat', () => {
  // --- Auth ---
  it('returns 401 when user not authenticated', async () => {
    setupSupabaseFromMock({ user: null });

    const req = createRequest({ message: 'Hello' });
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('UNAUTHORIZED');
    expect(json.error.message_tl).toContain('mag-login');
  });

  // --- Validation ---
  it('returns 400 for empty message', async () => {
    const req = createRequest({ message: '' });
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('returns 400 for missing message field', async () => {
    const req = createRequest({});
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('returns 400 for invalid feature', async () => {
    const req = createRequest({ message: 'test', feature: 'bogus' });
    const res = await POST(req as any);

    expect(res.status).toBe(400);
  });

  // --- Happy Path ---
  it('returns 200 with Kai response for valid request', async () => {
    const req = createRequest({ message: 'Magkano ang sales ko ngayong linggo?' });
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.message).toBeDefined();
    expect(typeof json.data.message).toBe('string');
  });

  it('calls Claude API with correct model for free tier', async () => {
    const req = createRequest({ message: 'Hello' });
    await POST(req as any);

    expect(mockAnthropicCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-haiku-4-5-20251001',
      })
    );
  });

  // --- Error Envelope ---
  it('returns standard error envelope on all error responses', async () => {
    setupSupabaseFromMock({ user: null });

    const req = createRequest({ message: 'test' });
    const res = await POST(req as any);
    const json = await res.json();

    expect(json).toHaveProperty('success', false);
    expect(json).toHaveProperty('error');
    expect(json.error).toHaveProperty('code');
    expect(json.error).toHaveProperty('message');
    expect(json.error).toHaveProperty('message_tl');
  });

  it('returns standard success envelope on success', async () => {
    const req = createRequest({ message: 'Hello' });
    const res = await POST(req as any);
    const json = await res.json();

    expect(json).toHaveProperty('success', true);
    expect(json).toHaveProperty('data');
    expect(json.data).toHaveProperty('message');
  });

  // --- C4: internal-only classification features are NOT client-selectable ---
  it('returns 400 for classify_expense (internal-only feature)', async () => {
    const req = createRequest({ message: 'test', feature: 'classify_expense' });
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INVALID_INPUT');
    // The model must never have been called with an unsubstituted prompt.
    expect(mockAnthropicCreate).not.toHaveBeenCalled();
  });

  it('returns 400 for classify_intent (internal-only feature)', async () => {
    const req = createRequest({ message: 'test', feature: 'classify_intent' });
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('INVALID_INPUT');
    expect(mockAnthropicCreate).not.toHaveBeenCalled();
  });

  // --- C7: empty Claude content array must not throw — falls back to error msg ---
  it('handles an empty Claude content array without throwing (C7)', async () => {
    mockAnthropicCreate.mockResolvedValueOnce({
      content: [],
      usage: { input_tokens: 1500, output_tokens: 0 },
    });

    const req = createRequest({ message: 'Hello' });
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(typeof json.data.message).toBe('string');
    expect(json.data.message.length).toBeGreaterThan(0);
  });

  // --- C5: a tax-containing reply-draft must NOT stack two BIR disclaimers ---
  it('does not stack disclaimers on a tax-containing reply draft (C5)', async () => {
    // Reply mentions VAT (a BIR trigger) but contains no advice/commitment
    // patterns, so it passes reply-output validation and gets a BIR disclaimer.
    mockAnthropicCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Option 1:\nAng presyo po ay may kasamang VAT. Salamat!' }],
      usage: { input_tokens: 1500, output_tokens: 60 },
    });

    const req = createRequest({ message: 'tulungan mo ako sagutin ang customer', feature: 'reply_drafter' });
    const res = await POST(req as any);
    const json = await res.json();

    expect(res.status).toBe(200);
    const msg: string = json.data.message;
    // Exactly ONE BIR disclaimer (no stacking).
    expect((msg.match(/hindi tax advice/g) ?? []).length).toBe(1);
    // The reply-draft notice is present...
    expect(msg).toContain('draft lang');
    // ...and the BIR disclaimer comes BEFORE the reply notice (correct order).
    expect(msg.indexOf('hindi tax advice')).toBeLessThan(msg.indexOf('draft lang'));
  });
});
