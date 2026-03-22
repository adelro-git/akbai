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
  // Each method returns the chain for chaining
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

// Import AFTER mocks
import { POST, GET } from '../route';

function makeRequest(body: unknown, method = 'POST'): Request {
  return new Request('http://localhost:3000/api/onboarding', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  });
}

// ============================================================
// POST /api/onboarding
// ============================================================

describe('POST /api/onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFromChains = {};
    mockGetUser = vi.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  // --- Auth ---

  it('should return 401 if not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'not logged in' } });

    const res = await POST(makeRequest({ step: 1, display_name: 'Maria' }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('UNAUTHORIZED');
    expect(json.error.message_tl).toContain('login');
  });

  // --- Validation ---

  it('should return 400 for invalid step data', async () => {
    setupUserState(0, false);

    const res = await POST(makeRequest({ step: 1 })); // missing display_name
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('should return 400 for invalid step number', async () => {
    setupUserState(0, false);

    const res = await POST(makeRequest({ step: 6, unknown_field: 'test' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  it('should return 400 for invalid business type', async () => {
    setupUserState(1, false);

    const res = await POST(makeRequest({ step: 2, business_type: 'farming' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('INVALID_INPUT');
  });

  // --- Sequential enforcement ---

  it('should reject step 2 when current step is 0 (must do step 1 first)', async () => {
    setupUserState(0, false);

    const res = await POST(makeRequest({ step: 2, business_type: 'food_baking' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('WRONG_STEP');
    expect(json.error.message_tl).toContain('step 1');
  });

  it('should reject step 3 when current step is 1 (must do step 2 first)', async () => {
    setupUserState(1, false);

    const res = await POST(makeRequest({ step: 3, income_range: 'below_50k' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('WRONG_STEP');
  });

  // --- Already completed ---

  it('should reject if onboarding already completed', async () => {
    setupUserState(5, true);

    const res = await POST(makeRequest({ step: 1, display_name: 'Maria' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('ALREADY_COMPLETED');
  });

  // --- Step 1: Name ---

  it('should save display_name on step 1', async () => {
    setupUserState(0, false);

    const res = await POST(makeRequest({ step: 1, display_name: 'Maria' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.step).toBe(1);
    expect(json.data.completed).toBe(false);

    // Verify update was called on users table
    const usersChain = mockFromChains['users'];
    expect(usersChain.update).toHaveBeenCalled();
  });

  // --- Step 2: Business Type ---

  it('should save business_type on step 2 (new profile)', async () => {
    setupUserState(1, false);
    // No existing business profile
    mockFromChains['business_profiles'] = mockChain();
    mockFromChains['business_profiles'].single.mockResolvedValue({ data: null, error: null });

    const res = await POST(makeRequest({ step: 2, business_type: 'food_baking' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.step).toBe(2);
  });

  it('should update existing profile on step 2', async () => {
    setupUserState(1, false);
    // Existing business profile
    mockFromChains['business_profiles'] = mockChain();
    mockFromChains['business_profiles'].single.mockResolvedValue({
      data: { id: 'profile-123' },
      error: null,
    });

    const res = await POST(makeRequest({ step: 2, business_type: 'online_selling' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.step).toBe(2);
  });

  // --- Step 5: Complete ---

  it('should mark onboarding complete on step 5 and return first message', async () => {
    setupUserState(4, false);

    // Setup for step 5 completion reads
    setupUserFinalData('Maria', 'receipt_tracking', 'food_baking');

    const res = await POST(makeRequest({ step: 5, bir_consent: true }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.completed).toBe(true);
    expect(json.data.firstMessage).toBeTruthy();
    expect(json.data.firstMessage).toContain('Maria');
    expect(json.data.featureNudge).toBeTruthy();
  });

  it('should save first KA message to ka_conversations on step 5', async () => {
    setupUserState(4, false);
    setupUserFinalData('Jose', 'bir_compliance', 'online_selling');

    await POST(makeRequest({ step: 5, bir_consent: false }));

    // Verify conversation insert
    const convoChain = mockFromChains['ka_conversations'];
    expect(convoChain.insert).toHaveBeenCalled();
  });

  it('should accept bir_consent: false on step 5', async () => {
    setupUserState(4, false);
    setupUserFinalData('Ana', 'knowing_earnings', 'freelance_creative');

    const res = await POST(makeRequest({ step: 5, bir_consent: false }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.completed).toBe(true);
  });
});

// ============================================================
// GET /api/onboarding
// ============================================================

describe('GET /api/onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFromChains = {};
    mockGetUser = vi.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  it('should return 401 if not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('should return current onboarding state for resumability', async () => {
    // Users table
    const usersChain = mockChain();
    usersChain.single.mockResolvedValue({
      data: {
        display_name: 'Maria',
        primary_pain: 'receipt_tracking',
        bir_consent: null,
        onboarding_step: 2,
        onboarding_completed: false,
      },
      error: null,
    });
    mockFromChains['users'] = usersChain;

    // Business profiles table
    const profileChain = mockChain();
    profileChain.single.mockResolvedValue({
      data: { business_type: 'food_baking', income_range: null },
      error: null,
    });
    mockFromChains['business_profiles'] = profileChain;

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.onboarding_step).toBe(2);
    expect(json.data.onboarding_completed).toBe(false);
    expect(json.data.display_name).toBe('Maria');
    expect(json.data.business_type).toBe('food_baking');
    expect(json.data.income_range).toBeNull();
  });

  it('should return defaults for new user with no data', async () => {
    const usersChain = mockChain();
    usersChain.single.mockResolvedValue({ data: null, error: null });
    mockFromChains['users'] = usersChain;

    const profileChain = mockChain();
    profileChain.single.mockResolvedValue({ data: null, error: null });
    mockFromChains['business_profiles'] = profileChain;

    const res = await GET();
    const json = await res.json();

    expect(json.data.onboarding_step).toBe(0);
    expect(json.data.onboarding_completed).toBe(false);
    expect(json.data.display_name).toBeNull();
  });
});

// ============================================================
// Helpers
// ============================================================

function setupUserState(step: number, completed: boolean) {
  const usersChain = mockChain();
  usersChain.single.mockResolvedValue({
    data: { onboarding_step: step, onboarding_completed: completed },
    error: null,
  });
  // For update calls, return success
  usersChain.update.mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
  });
  mockFromChains['users'] = usersChain;
}

function setupUserFinalData(name: string, pain: string, businessType: string) {
  // After step 5, the route re-reads user + profile
  // Override the mock chain's single to return different data on subsequent calls
  const usersChain = mockFromChains['users'];

  let callCount = 0;
  usersChain.single.mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      return Promise.resolve({
        data: { onboarding_step: 4, onboarding_completed: false },
        error: null,
      });
    }
    return Promise.resolve({
      data: { display_name: name, primary_pain: pain },
      error: null,
    });
  });

  usersChain.update.mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
  });

  const profileChain = mockChain();
  profileChain.single.mockResolvedValue({
    data: { id: 'profile-123', business_type: businessType },
    error: null,
  });
  profileChain.update.mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
  });
  mockFromChains['business_profiles'] = profileChain;

  const convoChain = mockChain();
  convoChain.insert.mockResolvedValue({ data: null, error: null });
  mockFromChains['ka_conversations'] = convoChain;
}
