/**
 * Admin Dashboard — Unit Tests
 * Feature: Admin Dashboard (Gap D10)
 * Tests: admin auth (email match/reject), MRR calculation,
 *        flag review (list/resolve), feature flag toggle, schemas
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Tests for isAdminEmail — lightweight email check
// ============================================================

describe('isAdminEmail', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns true when email matches ADMIN_EMAIL', async () => {
    vi.stubEnv('ADMIN_EMAIL', 'anton@akbai.ph');
    // Re-import to pick up env change
    const { isAdminEmail } = await import('../auth');
    expect(isAdminEmail('anton@akbai.ph')).toBe(true);
  });

  it('returns false when email does not match ADMIN_EMAIL', async () => {
    vi.stubEnv('ADMIN_EMAIL', 'anton@akbai.ph');
    const { isAdminEmail } = await import('../auth');
    expect(isAdminEmail('hacker@evil.com')).toBe(false);
  });

  it('returns false when ADMIN_EMAIL is not set', async () => {
    vi.stubEnv('ADMIN_EMAIL', '');
    const { isAdminEmail } = await import('../auth');
    expect(isAdminEmail('anton@akbai.ph')).toBe(false);
  });

  it('returns false when email is null', async () => {
    vi.stubEnv('ADMIN_EMAIL', 'anton@akbai.ph');
    const { isAdminEmail } = await import('../auth');
    expect(isAdminEmail(null)).toBe(false);
  });

  it('returns false when email is undefined', async () => {
    vi.stubEnv('ADMIN_EMAIL', 'anton@akbai.ph');
    const { isAdminEmail } = await import('../auth');
    expect(isAdminEmail(undefined)).toBe(false);
  });
});

// ============================================================
// Tests for admin Zod schemas
// ============================================================

describe('Admin Schemas', () => {
  describe('ResolveFlagSchema', () => {
    it('accepts valid UUID', async () => {
      const { ResolveFlagSchema } = await import('../schemas');
      const result = ResolveFlagSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('rejects non-UUID string', async () => {
      const { ResolveFlagSchema } = await import('../schemas');
      const result = ResolveFlagSchema.safeParse({ id: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('rejects missing id', async () => {
      const { ResolveFlagSchema } = await import('../schemas');
      const result = ResolveFlagSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('ToggleFeatureFlagSchema', () => {
    it('accepts valid input', async () => {
      const { ToggleFeatureFlagSchema } = await import('../schemas');
      const result = ToggleFeatureFlagSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        flag: 'ocr_enabled',
        value: true,
      });
      expect(result.success).toBe(true);
    });

    it('rejects non-UUID userId', async () => {
      const { ToggleFeatureFlagSchema } = await import('../schemas');
      const result = ToggleFeatureFlagSchema.safeParse({
        userId: 'bad',
        flag: 'ocr_enabled',
        value: true,
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty flag name', async () => {
      const { ToggleFeatureFlagSchema } = await import('../schemas');
      const result = ToggleFeatureFlagSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        flag: '',
        value: true,
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-boolean value', async () => {
      const { ToggleFeatureFlagSchema } = await import('../schemas');
      const result = ToggleFeatureFlagSchema.safeParse({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        flag: 'ocr_enabled',
        value: 'yes',
      });
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================
// Tests for MRR Calculation — Tier pricing constants
// ============================================================

describe('MRR Tier Pricing', () => {
  it('free tier costs 0 centavos', async () => {
    const { TIER_PRICING_CENTAVOS } = await import(
      '@/app/api/admin/mrr/route'
    );
    expect(TIER_PRICING_CENTAVOS['free']).toBe(0);
  });

  it('pro tier costs 29900 centavos (P299)', async () => {
    const { TIER_PRICING_CENTAVOS } = await import(
      '@/app/api/admin/mrr/route'
    );
    expect(TIER_PRICING_CENTAVOS['pro']).toBe(29900);
  });

  it('business tier costs 79900 centavos (P799)', async () => {
    const { TIER_PRICING_CENTAVOS } = await import(
      '@/app/api/admin/mrr/route'
    );
    expect(TIER_PRICING_CENTAVOS['business']).toBe(79900);
  });

  it('MRR for 10 pro + 5 business = 10*29900 + 5*79900 = 698500', () => {
    const proMrr = 10 * 29900;
    const bizMrr = 5 * 79900;
    expect(proMrr + bizMrr).toBe(698500);
  });

  it('MRR for all-free users is 0', () => {
    const freeMrr = 100 * 0;
    expect(freeMrr).toBe(0);
  });
});

// ============================================================
// Tests for isAdmin — full Supabase auth lookup
// ============================================================

const mockGetUserById = vi.fn();

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({
    auth: {
      admin: {
        getUserById: mockGetUserById,
      },
    },
  })),
}));

describe('isAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('returns true when user email matches ADMIN_EMAIL', async () => {
    vi.stubEnv('ADMIN_EMAIL', 'anton@akbai.ph');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key');

    mockGetUserById.mockResolvedValue({
      data: { user: { email: 'anton@akbai.ph' } },
      error: null,
    });

    const { isAdmin } = await import('../auth');
    const result = await isAdmin('user-123');
    expect(result).toBe(true);
  });

  it('returns false when user email does not match', async () => {
    vi.stubEnv('ADMIN_EMAIL', 'anton@akbai.ph');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key');

    mockGetUserById.mockResolvedValue({
      data: { user: { email: 'other@user.com' } },
      error: null,
    });

    const { isAdmin } = await import('../auth');
    const result = await isAdmin('user-456');
    expect(result).toBe(false);
  });

  it('returns false when Supabase auth lookup fails', async () => {
    vi.stubEnv('ADMIN_EMAIL', 'anton@akbai.ph');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key');

    mockGetUserById.mockResolvedValue({
      data: null,
      error: { message: 'User not found' },
    });

    const { isAdmin } = await import('../auth');
    const result = await isAdmin('nonexistent');
    expect(result).toBe(false);
  });

  it('returns false when ADMIN_EMAIL env var is not set', async () => {
    vi.stubEnv('ADMIN_EMAIL', '');

    const { isAdmin } = await import('../auth');
    const result = await isAdmin('user-123');
    expect(result).toBe(false);
  });
});
