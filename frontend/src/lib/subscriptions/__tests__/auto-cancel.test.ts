/**
 * Auto-Cancel Tests — Batch processing of expired grace periods
 * Feature: Xendit Payment Infrastructure (Build 8)
 *
 * Tests: processExpiredGracePeriods — empty set, batch processing, partial failures
 * Mocks: Supabase service client, expireGracePeriod
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processExpiredGracePeriods } from '../auto-cancel';

// --- Mock the grace-period module ---
vi.mock('../grace-period', () => ({
  expireGracePeriod: vi.fn(),
}));

import { expireGracePeriod } from '../grace-period';

// ============================================================
// Mock Supabase Client Factory
// ============================================================

function createMockClient(expiredSubs: Array<{ user_id: string }> | null, error?: string) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            is: vi.fn().mockResolvedValue({
              data: expiredSubs,
              error: error ? { message: error } : null,
            }),
          }),
        }),
      }),
    }),
  };
}

// ============================================================
// Tests
// ============================================================

describe('processExpiredGracePeriods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return zero counts when no expired subscriptions exist', async () => {
    const mockClient = createMockClient([]);

    const result = await processExpiredGracePeriods(mockClient as never);

    expect(result.processed).toBe(0);
    expect(result.cancelled).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('should cancel all expired subscriptions', async () => {
    const mockClient = createMockClient([
      { user_id: 'user-1' },
      { user_id: 'user-2' },
      { user_id: 'user-3' },
    ]);
    vi.mocked(expireGracePeriod).mockResolvedValue();

    const result = await processExpiredGracePeriods(mockClient as never);

    expect(result.processed).toBe(3);
    expect(result.cancelled).toBe(3);
    expect(result.failed).toBe(0);
    expect(expireGracePeriod).toHaveBeenCalledTimes(3);
  });

  it('should handle partial failures without stopping batch', async () => {
    const mockClient = createMockClient([
      { user_id: 'user-1' },
      { user_id: 'user-2' },
      { user_id: 'user-3' },
    ]);

    vi.mocked(expireGracePeriod)
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('DB timeout'))
      .mockResolvedValueOnce();

    const result = await processExpiredGracePeriods(mockClient as never);

    expect(result.processed).toBe(3);
    expect(result.cancelled).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].userId).toBe('user-2');
    expect(result.errors[0].error).toBe('DB timeout');
  });

  it('should throw when query itself fails', async () => {
    const mockClient = createMockClient(null, 'Connection refused');

    await expect(
      processExpiredGracePeriods(mockClient as never)
    ).rejects.toThrow('Failed to query expired subscriptions');
  });

  it('should handle null data gracefully', async () => {
    const mockClient = createMockClient(null);

    const result = await processExpiredGracePeriods(mockClient as never);

    expect(result.processed).toBe(0);
    expect(result.cancelled).toBe(0);
  });
});
