import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Mock timezone — control time of day for greeting tests
// ============================================================

let mockHour = 9; // default: morning

vi.mock('@/lib/timezone', () => ({
  toManila: () => {
    // Returns a Date where getUTCHours() returns mockHour
    const d = new Date(Date.UTC(2026, 2, 24, mockHour, 0, 0));
    return d;
  },
  getManilaToday: () => '2026-03-24',
}));

// ============================================================
// Mock Supabase
// ============================================================

const mockUser = { id: 'user-maria-123', email: 'maria@test.local' };

// Sprint 15: the GET /api/dashboard handler was extended to compute
// streak + tiles, which fan out into additional chained methods
// (`.order`, `.maybeSingle`, `.lt`, `.gte`, `.in`, plus a count-style
// `.select` second-argument). The chain factory exposes all of them as
// stubs that resolve to "empty" by default so the legacy tests (which
// only set up users/business_profiles/daily_check_in) continue to pass
// — any newly-queried table falls through to undefined data + null
// error, which the handler treats as "no rows".
const mockChain = () => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    gte: vi.fn(),
    lt: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  };
  Object.values(chain).forEach((fn) => fn.mockReturnValue(chain));
  // Default terminals return { data: null, error: null } so any table
  // the test forgets to wire up doesn't blow up the handler.
  chain.single.mockResolvedValue({ data: null, error: null });
  chain.maybeSingle.mockResolvedValue({ data: null, error: null });
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
import { GET, POST, generateGreeting } from '../route';

function makeRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/dashboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ============================================================
// Tests: GET /api/dashboard
// ============================================================

describe('GET /api/dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFromChains = {};
    mockHour = 9; // morning
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

  it('should return greeting + dashboard cards for authenticated user', async () => {
    // Setup user data
    const usersChain = mockChain();
    usersChain.single.mockResolvedValue({
      data: { display_name: 'Maria' },
      error: null,
    });
    mockFromChains['users'] = usersChain;

    // Setup business profile
    const profileChain = mockChain();
    profileChain.single.mockResolvedValue({
      data: { business_name: 'Maria Cakes', business_type: 'food_baking' },
      error: null,
    });
    mockFromChains['business_profiles'] = profileChain;

    // Setup daily check-in (none for today)
    const checkInChain = mockChain();
    checkInChain.single.mockResolvedValue({ data: null, error: null });
    mockFromChains['daily_check_in'] = checkInChain;

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.greeting).toContain('Maria');
    expect(json.data.userName).toBe('Maria');
    expect(json.data.businessName).toBe('Maria Cakes');
    expect(json.data.businessType).toBe('food_baking');
    expect(json.data.dashboardCards).toHaveLength(4);
  });

  it('should return morning greeting when hour is 9', async () => {
    mockHour = 9;
    setupMinimalUserData();

    const res = await GET();
    const json = await res.json();

    expect(json.data.greeting).toContain('Magandang umaga');
  });

  it('should return afternoon greeting when hour is 14', async () => {
    mockHour = 14;
    setupMinimalUserData();

    const res = await GET();
    const json = await res.json();

    expect(json.data.greeting).toContain('Magandang hapon');
  });

  it('should return evening greeting when hour is 20', async () => {
    mockHour = 20;
    setupMinimalUserData();

    const res = await GET();
    const json = await res.json();

    expect(json.data.greeting).toContain('Magandang gabi');
  });

  it('should return 4 dashboard cards including Quick Chat', async () => {
    setupMinimalUserData();

    const res = await GET();
    const json = await res.json();

    const cardIds = json.data.dashboardCards.map((c: { id: string }) => c.id);
    expect(cardIds).toContain('resibo-scanner');
    expect(cardIds).toContain('saan-napunta');
    expect(cardIds).toContain('bir-deadlines');
    expect(cardIds).toContain('quick-chat');
  });

  it('should use "Boss" as fallback when display_name is null', async () => {
    const usersChain = mockChain();
    usersChain.single.mockResolvedValue({ data: { display_name: null }, error: null });
    mockFromChains['users'] = usersChain;

    const profileChain = mockChain();
    profileChain.single.mockResolvedValue({ data: null, error: null });
    mockFromChains['business_profiles'] = profileChain;

    const checkInChain = mockChain();
    checkInChain.single.mockResolvedValue({ data: null, error: null });
    mockFromChains['daily_check_in'] = checkInChain;

    const res = await GET();
    const json = await res.json();

    expect(json.data.userName).toBe('Boss');
    expect(json.data.greeting).toContain('Boss');
  });
});

// ============================================================
// Tests: POST /api/dashboard
// ============================================================

describe('POST /api/dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFromChains = {};
    mockHour = 9;
    mockGetUser = vi.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  it('should return 401 if not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'not logged in' } });

    const res = await POST(makeRequest({ mood: 'okay' }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('should save check-in with mood', async () => {
    // User data for greeting
    const usersChain = mockChain();
    usersChain.single.mockResolvedValue({
      data: { display_name: 'Maria' },
      error: null,
    });
    mockFromChains['users'] = usersChain;

    // Upsert daily check-in
    const checkInChain = mockChain();
    checkInChain.single.mockResolvedValue({
      data: {
        id: 'checkin-001',
        user_id: mockUser.id,
        check_in_date: '2026-03-24',
        mood: 'maganda',
        kai_greeting: 'Magandang umaga, Maria! Ang Umaga Mo ngayon...',
      },
      error: null,
    });
    mockFromChains['daily_check_in'] = checkInChain;

    const res = await POST(makeRequest({ mood: 'maganda' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.mood).toBe('maganda');
  });

  it('should save check-in without mood (optional field)', async () => {
    const usersChain = mockChain();
    usersChain.single.mockResolvedValue({
      data: { display_name: 'Jose' },
      error: null,
    });
    mockFromChains['users'] = usersChain;

    const checkInChain = mockChain();
    checkInChain.single.mockResolvedValue({
      data: {
        id: 'checkin-002',
        user_id: mockUser.id,
        check_in_date: '2026-03-24',
        mood: null,
        kai_greeting: 'Magandang umaga, Jose! Ang Umaga Mo ngayon...',
      },
      error: null,
    });
    mockFromChains['daily_check_in'] = checkInChain;

    const res = await POST(makeRequest({}));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('should return 400 for invalid body', async () => {
    const res = await POST(
      new Request('http://localhost:3000/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{',
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('should return 500 on database error', async () => {
    const usersChain = mockChain();
    usersChain.single.mockResolvedValue({
      data: { display_name: 'Maria' },
      error: null,
    });
    mockFromChains['users'] = usersChain;

    const checkInChain = mockChain();
    checkInChain.single.mockResolvedValue({
      data: null,
      error: { message: 'unique constraint violation' },
    });
    mockFromChains['daily_check_in'] = checkInChain;

    const res = await POST(makeRequest({ mood: 'okay' }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error.code).toBe('DB_ERROR');
  });
});

// ============================================================
// Tests: generateGreeting
// ============================================================

describe('generateGreeting', () => {
  it('should return morning greeting for hours 5-11', () => {
    mockHour = 5;
    expect(generateGreeting('Maria')).toContain('Magandang umaga');
    mockHour = 11;
    expect(generateGreeting('Maria')).toContain('Magandang umaga');
  });

  it('should return afternoon greeting for hours 12-17', () => {
    mockHour = 12;
    expect(generateGreeting('Maria')).toContain('Magandang hapon');
    mockHour = 17;
    expect(generateGreeting('Maria')).toContain('Magandang hapon');
  });

  it('should return evening greeting for hours 18-4', () => {
    mockHour = 18;
    expect(generateGreeting('Maria')).toContain('Magandang gabi');
    mockHour = 23;
    expect(generateGreeting('Maria')).toContain('Magandang gabi');
    mockHour = 2;
    expect(generateGreeting('Maria')).toContain('Magandang gabi');
  });

  it('should include the user name in the greeting', () => {
    mockHour = 9;
    expect(generateGreeting('Jose')).toContain('Jose');
  });
});

// ============================================================
// Tests: Check-in → Expenses integration (Sprint 7, Task 13)
// ============================================================

describe('POST /api/dashboard — check-in creates transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFromChains = {};
    mockHour = 9;
    mockGetUser = vi.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  it('creates transactions when check-in includes sales and expenses', async () => {
    const usersChain = mockChain();
    usersChain.single.mockResolvedValue({ data: { display_name: 'Maria' }, error: null });
    mockFromChains['users'] = usersChain;

    const checkInChain = mockChain();
    checkInChain.single.mockResolvedValue({
      data: {
        id: 'checkin-fin-001', user_id: mockUser.id, check_in_date: '2026-03-24',
        mood: 'okay', kai_greeting: 'Magandang umaga!',
        sales_amount: 50000, expenses_amount: 15000,
      },
      error: null,
    });
    mockFromChains['daily_check_in'] = checkInChain;

    const txChain = mockChain();
    mockFromChains['transactions'] = txChain;

    const res = await POST(makeRequest({ mood: 'okay', sales_amount: 50000, expenses_amount: 15000 }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(txChain.update).toHaveBeenCalled(); // soft-delete old
    expect(txChain.insert).toHaveBeenCalled(); // insert new
  });

  it('does NOT create transactions when no financial data', async () => {
    const usersChain = mockChain();
    usersChain.single.mockResolvedValue({ data: { display_name: 'Maria' }, error: null });
    mockFromChains['users'] = usersChain;

    const checkInChain = mockChain();
    checkInChain.single.mockResolvedValue({
      data: {
        id: 'checkin-nofin', user_id: mockUser.id, check_in_date: '2026-03-24',
        mood: 'okay', kai_greeting: 'Magandang umaga!',
        sales_amount: null, expenses_amount: null,
      },
      error: null,
    });
    mockFromChains['daily_check_in'] = checkInChain;

    const res = await POST(makeRequest({ mood: 'okay' }));
    expect(res.status).toBe(200);
    expect(mockFromChains['transactions']).toBeUndefined();
  });
});

// ============================================================
// Helpers
// ============================================================

function setupMinimalUserData() {
  const usersChain = mockChain();
  usersChain.single.mockResolvedValue({
    data: { display_name: 'Maria' },
    error: null,
  });
  mockFromChains['users'] = usersChain;

  const profileChain = mockChain();
  profileChain.single.mockResolvedValue({
    data: { business_name: null, business_type: 'food_baking' },
    error: null,
  });
  mockFromChains['business_profiles'] = profileChain;

  const checkInChain = mockChain();
  checkInChain.single.mockResolvedValue({ data: null, error: null });
  mockFromChains['daily_check_in'] = checkInChain;
}
