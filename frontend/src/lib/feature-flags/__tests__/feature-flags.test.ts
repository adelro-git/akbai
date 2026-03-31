/**
 * Feature Flags — Unit Tests
 * Feature: Feature Flags (Sprint 5)
 * Tests: flag reading (fail-closed), admin writes, FLAGS const, middleware guard
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Mock Supabase server client — controls what the DB "returns"
// ============================================================

const mockSingle = vi.fn();
const mockIs = vi.fn(() => ({ single: mockSingle }));
const mockEq = vi.fn(() => ({ is: mockIs }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
}));

// ============================================================
// Mock dev-auth — default to auth-required (SKIP_AUTH = false)
// ============================================================

vi.mock('@/lib/supabase/dev-auth', () => ({
  SKIP_AUTH: false,
  DEV_USER: { id: '00000000-0000-0000-0000-000000000000' },
}));

// ============================================================
// Tests for getFeatureFlag
// ============================================================

describe('getFeatureFlag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when flag is set to true', async () => {
    mockSingle.mockResolvedValue({
      data: { feature_flags: { ocr_enabled: true } },
      error: null,
    });

    const { getFeatureFlag } = await import('../index');
    const result = await getFeatureFlag('user-1', 'ocr_enabled');
    expect(result).toBe(true);
  });

  it('returns false when flag is set to false', async () => {
    mockSingle.mockResolvedValue({
      data: { feature_flags: { ocr_enabled: false } },
      error: null,
    });

    const { getFeatureFlag } = await import('../index');
    const result = await getFeatureFlag('user-1', 'ocr_enabled');
    expect(result).toBe(false);
  });

  it('returns false when flag does not exist (fail-closed)', async () => {
    mockSingle.mockResolvedValue({
      data: { feature_flags: {} },
      error: null,
    });

    const { getFeatureFlag } = await import('../index');
    const result = await getFeatureFlag('user-1', 'nonexistent_flag');
    expect(result).toBe(false);
  });

  it('returns false when DB query fails (fail-closed)', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'connection error' },
    });

    const { getFeatureFlag } = await import('../index');
    const result = await getFeatureFlag('user-1', 'ocr_enabled');
    expect(result).toBe(false);
  });

  it('returns false when feature_flags is null', async () => {
    mockSingle.mockResolvedValue({
      data: { feature_flags: null },
      error: null,
    });

    const { getFeatureFlag } = await import('../index');
    const result = await getFeatureFlag('user-1', 'ocr_enabled');
    expect(result).toBe(false);
  });
});

// ============================================================
// Tests for getAllFeatureFlags
// ============================================================

describe('getAllFeatureFlags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all flags for a user', async () => {
    const flags = { ocr_enabled: true, dark_mode_enabled: false };
    mockSingle.mockResolvedValue({
      data: { feature_flags: flags },
      error: null,
    });

    const { getAllFeatureFlags } = await import('../index');
    const result = await getAllFeatureFlags('user-1');
    expect(result).toEqual(flags);
  });

  it('returns empty object when query fails', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'timeout' },
    });

    const { getAllFeatureFlags } = await import('../index');
    const result = await getAllFeatureFlags('user-1');
    expect(result).toEqual({});
  });
});

// ============================================================
// Tests for FLAGS const
// ============================================================

describe('FLAGS', () => {
  it('has all expected flag members', async () => {
    const { FLAGS } = await import('../flags');
    expect(FLAGS.DAILY_CHECK_IN_ENABLED).toBe('daily_check_in_enabled');
    expect(FLAGS.OCR_ENABLED).toBe('ocr_enabled');
    expect(FLAGS.MORNING_BRIEFING_ENABLED).toBe('morning_briefing_enabled');
    expect(FLAGS.DARK_MODE_ENABLED).toBe('dark_mode_enabled');
  });

  it('has exactly 6 flags', async () => {
    const { FLAGS } = await import('../flags');
    expect(Object.keys(FLAGS)).toHaveLength(6);
  });
});

// ============================================================
// Tests for setFeatureFlag (admin)
// Tested separately via direct function logic validation since
// the admin module uses @supabase/supabase-js directly.
// ============================================================

const mockAdminSingle = vi.fn();
const mockAdminIs = vi.fn(() => ({ single: mockAdminSingle }));
const mockAdminEq2 = vi.fn(() => ({ is: mockAdminIs }));
const mockAdminSelect = vi.fn(() => ({ eq: mockAdminEq2 }));
const mockAdminUpdateEq = vi.fn().mockResolvedValue({ error: null });
const mockAdminUpdate = vi.fn(() => ({ eq: mockAdminUpdateEq }));
const mockAdminFrom = vi.fn(() => ({
  select: mockAdminSelect,
  update: mockAdminUpdate,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mockAdminFrom })),
}));

describe('setFeatureFlag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-wire the chained mocks after clearAllMocks
    mockAdminIs.mockReturnValue({ single: mockAdminSingle });
    mockAdminEq2.mockReturnValue({ is: mockAdminIs });
    mockAdminSelect.mockReturnValue({ eq: mockAdminEq2 });
    mockAdminUpdate.mockReturnValue({ eq: mockAdminUpdateEq });
    mockAdminUpdateEq.mockResolvedValue({ error: null });
    mockAdminFrom.mockReturnValue({
      select: mockAdminSelect,
      update: mockAdminUpdate,
    });

    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');
  });

  it('updates JSONB correctly by merging with existing flags', async () => {
    mockAdminSingle.mockResolvedValue({
      data: { feature_flags: { existing_flag: true } },
      error: null,
    });

    const { setFeatureFlag } = await import('../admin');
    await setFeatureFlag('user-1', 'ocr_enabled', true);

    expect(mockAdminUpdate).toHaveBeenCalledWith({
      feature_flags: { existing_flag: true, ocr_enabled: true },
    });
  });
});

// ============================================================
// Tests for withFeatureFlag middleware
// ============================================================

describe('withFeatureFlag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks access when flag is off', async () => {
    mockSingle.mockResolvedValue({
      data: { feature_flags: { ocr_enabled: false } },
      error: null,
    });

    const { withFeatureFlag } = await import('../middleware');
    const checkOcr = withFeatureFlag('ocr_enabled');
    const allowed = await checkOcr('user-1');
    expect(allowed).toBe(false);
  });

  it('allows access when flag is on', async () => {
    mockSingle.mockResolvedValue({
      data: { feature_flags: { ocr_enabled: true } },
      error: null,
    });

    const { withFeatureFlag } = await import('../middleware');
    const checkOcr = withFeatureFlag('ocr_enabled');
    const allowed = await checkOcr('user-1');
    expect(allowed).toBe(true);
  });

  it('exports FEATURE_BLOCKED_MESSAGE with Taglish copy', async () => {
    const { FEATURE_BLOCKED_MESSAGE } = await import('../middleware');
    expect(FEATURE_BLOCKED_MESSAGE).toBe(
      'Hindi pa available ang feature na ito. Stay tuned!'
    );
  });
});
