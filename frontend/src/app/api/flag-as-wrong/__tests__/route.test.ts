import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Mock Supabase
// ============================================================

const mockUser = { id: 'user-maria-123', email: 'maria@test.local' };

const mockChain = () => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    single: vi.fn(),
  };
  Object.values(chain).forEach((fn) => fn.mockReturnValue(chain));
  return chain;
};

let mockFromChains: Record<string, ReturnType<typeof mockChain>>;
let mockGetUser: ReturnType<typeof vi.fn>;

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: (table: string) => {
      if (!mockFromChains[table]) {
        mockFromChains[table] = mockChain();
      }
      return mockFromChains[table];
    },
  })),
}));

// Mock dev-auth to NOT skip auth in tests
vi.mock('@/lib/supabase/dev-auth', () => ({
  SKIP_AUTH: false,
  DEV_USER: {
    id: '00000000-0000-0000-0000-000000000000',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'dev@akbai.test',
    email_confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
  },
}));

// Import AFTER mocks
import { POST } from '../route';

function makeRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/flag-as-wrong', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ============================================================
// Tests: POST /api/flag-as-wrong
// ============================================================

describe('POST /api/flag-as-wrong', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFromChains = {};
    mockGetUser = vi.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  it('should return success with Taglish confirmation for valid data', async () => {
    // Setup: insert succeeds
    const flagChain = mockChain();
    flagChain.insert.mockResolvedValue({ error: null });
    mockFromChains['flag_as_wrong_reports'] = flagChain;

    const res = await POST(
      makeRequest({
        message_id: 'kai-123456',
        reason: 'wrong_amount',
        comment: 'Mali ang amount, ₱3,450 dapat',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.message_tl).toContain('Salamat sa feedback mo');
  });

  it('should return 400 without message_id', async () => {
    const res = await POST(
      makeRequest({
        reason: 'wrong_amount',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('should return 400 with empty message_id', async () => {
    const res = await POST(
      makeRequest({
        message_id: '',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('should return 401 without auth', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'not logged in' },
    });

    const res = await POST(
      makeRequest({
        message_id: 'kai-123456',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  it('should accept message_id only (reason and comment are optional)', async () => {
    const flagChain = mockChain();
    flagChain.insert.mockResolvedValue({ error: null });
    mockFromChains['flag_as_wrong_reports'] = flagChain;

    const res = await POST(
      makeRequest({
        message_id: 'kai-789',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('should return 400 for invalid JSON body', async () => {
    const res = await POST(
      new Request('http://localhost:3000/api/flag-as-wrong', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid{json',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('should return 500 when database insert fails', async () => {
    const flagChain = mockChain();
    flagChain.insert.mockResolvedValue({
      error: { message: 'DB connection failed' },
    });
    mockFromChains['flag_as_wrong_reports'] = flagChain;

    const res = await POST(
      makeRequest({
        message_id: 'kai-fail',
        reason: 'wrong_info',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('DB_ERROR');
  });
});
