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
import { GET, PATCH } from '../route';

function makePatchRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ============================================================
// Helpers
// ============================================================

function setupFullUserData() {
  const usersChain = mockChain();
  usersChain.single.mockResolvedValue({
    data: { display_name: 'Maria' },
    error: null,
  });
  mockFromChains['users'] = usersChain;

  const profileChain = mockChain();
  profileChain.single.mockResolvedValue({
    data: {
      business_name: 'Maria Cakes',
      business_type: 'food_baking',
      income_range: 'below_50k',
      bir_registered: false,
      profile_version: 1,
    },
    error: null,
  });
  mockFromChains['business_profiles'] = profileChain;
}

function setupPatchChains(currentVersion: number) {
  // First call: users update
  const usersChain = mockChain();
  usersChain.single.mockResolvedValue({
    data: { display_name: 'Maria Updated' },
    error: null,
  });
  // update returns no error
  usersChain.update.mockReturnValue({
    ...usersChain,
    eq: vi.fn().mockResolvedValue({ error: null }),
  });
  mockFromChains['users'] = usersChain;

  // Business profiles chain: first call is select for version, second is update, third is re-fetch
  const profileChain = mockChain();

  // For select().eq().is().single() — get current version
  let selectCallCount = 0;
  profileChain.single.mockImplementation(() => {
    selectCallCount++;
    if (selectCallCount === 1) {
      // First single() call: get profile with id + profile_version
      return Promise.resolve({
        data: { id: 'profile-001', profile_version: currentVersion },
        error: null,
      });
    }
    // Subsequent calls: re-fetch updated profile
    return Promise.resolve({
      data: {
        business_name: 'Maria Cakes Updated',
        business_type: 'online_selling',
        income_range: '50k_150k',
        bir_registered: true,
        profile_version: currentVersion + 1,
      },
      error: null,
    });
  });

  // update returns no error
  profileChain.update.mockReturnValue({
    ...profileChain,
    eq: vi.fn().mockResolvedValue({ error: null }),
  });

  mockFromChains['business_profiles'] = profileChain;
}

// ============================================================
// Tests: GET /api/profile
// ============================================================

describe('GET /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFromChains = {};
    mockGetUser = vi.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  it('should return 401 if not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'not logged in' } });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  it('should return profile data for authenticated user', async () => {
    setupFullUserData();

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.display_name).toBe('Maria');
    expect(json.data.email).toBe('maria@test.local');
    expect(json.data.business_name).toBe('Maria Cakes');
    expect(json.data.business_type).toBe('food_baking');
    expect(json.data.income_range).toBe('below_50k');
    expect(json.data.bir_registered).toBe(false);
    expect(json.data.profile_version).toBe(1);
  });
});

// ============================================================
// Tests: PATCH /api/profile
// ============================================================

describe('PATCH /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFromChains = {};
    mockGetUser = vi.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  it('should return 401 if not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'not logged in' } });

    const res = await PATCH(makePatchRequest({ business_name: 'Test' }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('should return 400 for invalid JSON body', async () => {
    const res = await PATCH(
      new Request('http://localhost:3000/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid{json',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('should return 400 for empty payload (no fields to update)', async () => {
    const res = await PATCH(makePatchRequest({}));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('should return 400 for invalid business_type', async () => {
    const res = await PATCH(makePatchRequest({ business_type: 'invalid_type' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('should update business_profiles and increment profile_version', async () => {
    setupPatchChains(3);

    const res = await PATCH(
      makePatchRequest({ business_type: 'online_selling' })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.profile_version).toBe(4);
  });

  it('should return 404 if business profile does not exist', async () => {
    // Users update succeeds
    const usersChain = mockChain();
    usersChain.single.mockResolvedValue({
      data: { display_name: 'Maria' },
      error: null,
    });
    mockFromChains['users'] = usersChain;

    // Business profile not found
    const profileChain = mockChain();
    profileChain.single.mockResolvedValue({
      data: null,
      error: null,
    });
    mockFromChains['business_profiles'] = profileChain;

    const res = await PATCH(
      makePatchRequest({ business_name: 'New Name' })
    );
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('should validate display_name is not empty when provided', async () => {
    const res = await PATCH(makePatchRequest({ display_name: '' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('should accept valid income_range values', async () => {
    setupPatchChains(1);

    const res = await PATCH(makePatchRequest({ income_range: '50k_150k' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });
});
