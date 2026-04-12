/**
 * Grace Period Tests — Start, check, and expire grace period logic
 * Feature: Xendit Payment Infrastructure (Build 8), Gap C2
 *
 * Tests: startGracePeriod, checkGracePeriod (in period, expired, no subscription),
 *        expireGracePeriod
 * Mocks: Supabase service client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  startGracePeriod,
  checkGracePeriod,
  expireGracePeriod,
} from '../grace-period';

// ============================================================
// Mock Supabase Client Factory
// ============================================================

function createMockClient(overrides?: {
  updateReturn?: { error: null | { message: string } };
  selectReturn?: { data: Record<string, unknown> | null; error: null | { message: string } };
}) {
  const updateFn = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      is: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue(overrides?.updateReturn ?? { error: null }),
        then: undefined,
        error: overrides?.updateReturn?.error ?? null,
      }),
      then: undefined,
      error: overrides?.updateReturn?.error ?? null,
    }),
  });

  const selectFn = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      is: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(
          overrides?.selectReturn ?? { data: null, error: null }
        ),
      }),
    }),
  });

  return {
    from: vi.fn().mockReturnValue({
      update: updateFn,
      select: selectFn,
    }),
    _updateFn: updateFn,
    _selectFn: selectFn,
  };
}

// ============================================================
// startGracePeriod Tests
// ============================================================

describe('startGracePeriod', () => {
  it('should update subscription to past_due with 3-day grace end', async () => {
    const mockClient = createMockClient();
    const now = new Date();

    await startGracePeriod(mockClient as never, 'user-123');

    expect(mockClient.from).toHaveBeenCalledWith('subscriptions');
    const updateCall = mockClient._updateFn.mock.calls[0][0];
    expect(updateCall.status).toBe('past_due');
    expect(updateCall.grace_notifications_sent).toBe(0);

    // Grace period end should be ~3 days from now
    const graceEnd = new Date(updateCall.grace_period_end);
    const diffMs = graceEnd.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThanOrEqual(2.9);
    expect(diffDays).toBeLessThanOrEqual(3.1);
  });

  it('should throw on database error', async () => {
    const mockClient = createMockClient({
      updateReturn: { error: { message: 'DB error' } },
    });

    await expect(
      startGracePeriod(mockClient as never, 'user-123')
    ).rejects.toThrow('Failed to start grace period');
  });
});

// ============================================================
// checkGracePeriod Tests
// ============================================================

describe('checkGracePeriod', () => {
  it('should return inGracePeriod=true when within grace window', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);

    const mockClient = createMockClient({
      selectReturn: {
        data: {
          status: 'past_due',
          grace_period_end: futureDate.toISOString(),
        },
        error: null,
      },
    });

    const result = await checkGracePeriod(mockClient as never, 'user-123');

    expect(result.inGracePeriod).toBe(true);
    expect(result.daysRemaining).toBeGreaterThanOrEqual(1);
    expect(result.daysRemaining).toBeLessThanOrEqual(3);
    expect(result.expired).toBe(false);
    expect(result.graceEndDate).toBeDefined();
  });

  it('should return expired=true when grace period has passed', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const mockClient = createMockClient({
      selectReturn: {
        data: {
          status: 'past_due',
          grace_period_end: pastDate.toISOString(),
        },
        error: null,
      },
    });

    const result = await checkGracePeriod(mockClient as never, 'user-123');

    expect(result.inGracePeriod).toBe(false);
    expect(result.daysRemaining).toBe(0);
    expect(result.expired).toBe(true);
  });

  it('should return not in grace period when no subscription exists', async () => {
    const mockClient = createMockClient({
      selectReturn: { data: null, error: { message: 'Not found' } },
    });

    const result = await checkGracePeriod(mockClient as never, 'user-123');

    expect(result.inGracePeriod).toBe(false);
    expect(result.expired).toBe(false);
    expect(result.daysRemaining).toBe(0);
    expect(result.graceEndDate).toBeNull();
  });

  it('should return not in grace period when status is active', async () => {
    const mockClient = createMockClient({
      selectReturn: {
        data: {
          status: 'active',
          grace_period_end: null,
        },
        error: null,
      },
    });

    const result = await checkGracePeriod(mockClient as never, 'user-123');

    expect(result.inGracePeriod).toBe(false);
    expect(result.expired).toBe(false);
  });

  it('should return not in grace period when grace_period_end is null', async () => {
    const mockClient = createMockClient({
      selectReturn: {
        data: {
          status: 'past_due',
          grace_period_end: null,
        },
        error: null,
      },
    });

    const result = await checkGracePeriod(mockClient as never, 'user-123');

    expect(result.inGracePeriod).toBe(false);
    expect(result.expired).toBe(false);
  });
});

// ============================================================
// expireGracePeriod Tests
// ============================================================

describe('expireGracePeriod', () => {
  it('should set subscription to cancelled and free tier', async () => {
    const mockClient = createMockClient();

    await expireGracePeriod(mockClient as never, 'user-123');

    expect(mockClient.from).toHaveBeenCalledWith('subscriptions');
    const updateCall = mockClient._updateFn.mock.calls[0][0];
    expect(updateCall.status).toBe('cancelled');
    expect(updateCall.tier).toBe('free');
    expect(updateCall.scan_limit).toBe(0);
    expect(updateCall.grace_period_end).toBeNull();
    expect(updateCall.grace_notifications_sent).toBe(0);
    expect(updateCall.cancelled_at).toBeDefined();
  });

  it('should throw on database error', async () => {
    const mockClient = createMockClient({
      updateReturn: { error: { message: 'DB error' } },
    });

    await expect(
      expireGracePeriod(mockClient as never, 'user-123')
    ).rejects.toThrow('Failed to expire grace period');
  });
});
