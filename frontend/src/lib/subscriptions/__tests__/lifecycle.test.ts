/**
 * Subscription Lifecycle Tests — State transitions for subscription management
 * Feature: Xendit Payment Infrastructure (Build 8)
 *
 * Tests: activateSubscription, pauseSubscription, cancelSubscription, renewSubscription
 * Mocks: Supabase service client
 */

import { describe, it, expect, vi } from 'vitest';
import {
  activateSubscription,
  pauseSubscription,
  cancelSubscription,
  renewSubscription,
} from '../lifecycle';
import { SCAN_LIMITS, UNLIMITED_SCANS, isUnlimitedScans } from '../types';

// ============================================================
// Mock Supabase Client Factory
// ============================================================

function createMockClient(overrides?: {
  upsertReturn?: { error: null | { message: string } };
  updateReturn?: { error: null | { message: string } };
  selectReturn?: { data: Record<string, unknown> | null; error: null | { message: string; code?: string } };
}) {
  const upsertFn = vi.fn().mockResolvedValue(overrides?.upsertReturn ?? { error: null });

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
          overrides?.selectReturn ?? { data: { tier: 'pro', current_period_end: null }, error: null }
        ),
      }),
    }),
  });

  return {
    from: vi.fn().mockReturnValue({
      upsert: upsertFn,
      update: updateFn,
      select: selectFn,
    }),
    _upsertFn: upsertFn,
    _updateFn: updateFn,
    _selectFn: selectFn,
  };
}

// ============================================================
// SCAN_LIMITS — tier entitlement correctness (P1)
// ============================================================
// project-context.md §4: Pro Monthly / Pro Annual = Unlimited scans.
// Pro was previously the literal 50 — BELOW Starter's 100 — which made the
// pricier subscription look more limited than the cheaper lifetime tier.

describe('SCAN_LIMITS — tier entitlements', () => {
  it('pro is the UNLIMITED_SCANS sentinel (NOT the legacy 50)', () => {
    expect(SCAN_LIMITS.pro).toBe(UNLIMITED_SCANS);
    expect(SCAN_LIMITS.pro).not.toBe(50);
  });

  it('pro scan limit is strictly greater than starter (entitlement ordering)', () => {
    expect(SCAN_LIMITS.pro).toBeGreaterThan(SCAN_LIMITS.starter);
  });

  it('starter stays 100, free stays 0', () => {
    expect(SCAN_LIMITS.starter).toBe(100);
    expect(SCAN_LIMITS.free).toBe(0);
  });

  it('isUnlimitedScans flags the pro limit but not starter/free', () => {
    expect(isUnlimitedScans(SCAN_LIMITS.pro)).toBe(true);
    expect(isUnlimitedScans(SCAN_LIMITS.starter)).toBe(false);
    expect(isUnlimitedScans(SCAN_LIMITS.free)).toBe(false);
  });

  it('UNLIMITED_SCANS cannot overflow the int4 scan_limit column', () => {
    // Postgres int4 max is 2_147_483_647 (migration 023 scan_limit INTEGER).
    expect(UNLIMITED_SCANS).toBeLessThan(2_147_483_647);
  });
});

// ============================================================
// activateSubscription Tests
// ============================================================

describe('activateSubscription', () => {
  it('should upsert subscription with correct tier and scan limits', async () => {
    const mockClient = createMockClient();

    await activateSubscription(mockClient as never, 'user-123', 'pro', {
      xenditSubscriptionId: 'xnd-sub-123',
      paymentMethod: 'gcash',
    });

    expect(mockClient.from).toHaveBeenCalledWith('subscriptions');
    const upsertCall = mockClient._upsertFn.mock.calls[0][0];
    expect(upsertCall.user_id).toBe('user-123');
    expect(upsertCall.tier).toBe('pro');
    expect(upsertCall.status).toBe('active');
    expect(upsertCall.scan_limit).toBe(SCAN_LIMITS.pro);
    // P1 — activating Pro writes the unlimited sentinel, not 50.
    expect(upsertCall.scan_limit).toBe(UNLIMITED_SCANS);
    expect(upsertCall.scans_used_this_period).toBe(0);
    expect(upsertCall.xendit_subscription_id).toBe('xnd-sub-123');
    expect(upsertCall.payment_method).toBe('gcash');
    expect(upsertCall.grace_period_end).toBeNull();
  });

  it('should throw on database error', async () => {
    const mockClient = createMockClient({
      upsertReturn: { error: { message: 'DB error' } },
    });

    await expect(
      activateSubscription(mockClient as never, 'user-123', 'pro')
    ).rejects.toThrow('Failed to activate subscription');
  });
});

// ============================================================
// pauseSubscription Tests
// ============================================================

describe('pauseSubscription', () => {
  it('should update status to past_due', async () => {
    const mockClient = createMockClient();

    await pauseSubscription(mockClient as never, 'user-123');

    expect(mockClient.from).toHaveBeenCalledWith('subscriptions');
    const updateCall = mockClient._updateFn.mock.calls[0][0];
    expect(updateCall.status).toBe('past_due');
  });
});

// ============================================================
// cancelSubscription Tests
// ============================================================

describe('cancelSubscription', () => {
  it('should set status to cancelled and tier to free', async () => {
    const mockClient = createMockClient();

    await cancelSubscription(mockClient as never, 'user-123');

    expect(mockClient.from).toHaveBeenCalledWith('subscriptions');
    const updateCall = mockClient._updateFn.mock.calls[0][0];
    expect(updateCall.status).toBe('cancelled');
    expect(updateCall.tier).toBe('free');
    expect(updateCall.scan_limit).toBe(SCAN_LIMITS.free);
    expect(updateCall.cancelled_at).toBeDefined();
    expect(updateCall.grace_period_end).toBeNull();
  });

  it('should throw on database error', async () => {
    const mockClient = createMockClient({
      updateReturn: { error: { message: 'DB error' } },
    });

    await expect(
      cancelSubscription(mockClient as never, 'user-123')
    ).rejects.toThrow('Failed to cancel subscription');
  });
});

// ============================================================
// renewSubscription Tests
// ============================================================

describe('renewSubscription', () => {
  it('should extend period and reset scan usage', async () => {
    const existingEnd = new Date();
    existingEnd.setDate(existingEnd.getDate() + 5);

    const mockClient = createMockClient({
      selectReturn: {
        data: { tier: 'pro', current_period_end: existingEnd.toISOString() },
        error: null,
      },
    });

    await renewSubscription(mockClient as never, 'user-123');

    const updateCall = mockClient._updateFn.mock.calls[0][0];
    expect(updateCall.status).toBe('active');
    expect(updateCall.scans_used_this_period).toBe(0);
    expect(updateCall.grace_period_end).toBeNull();

    // New period end should be ~30 days from existing end
    const newEnd = new Date(updateCall.current_period_end);
    const diffDays = (newEnd.getTime() - existingEnd.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThanOrEqual(29.5);
    expect(diffDays).toBeLessThanOrEqual(30.5);
  });

  it('should use provided tier when overriding', async () => {
    const mockClient = createMockClient({
      selectReturn: {
        data: { tier: 'pro', current_period_end: null },
        error: null,
      },
    });

    await renewSubscription(mockClient as never, 'user-123', 'business');

    const updateCall = mockClient._updateFn.mock.calls[0][0];
    expect(updateCall.tier).toBe('business');
    expect(updateCall.scan_limit).toBe(SCAN_LIMITS.business);
  });

  it('should throw when no subscription exists', async () => {
    const mockClient = createMockClient({
      selectReturn: { data: null, error: { message: 'Not found', code: 'PGRST116' } },
    });

    await expect(
      renewSubscription(mockClient as never, 'user-123')
    ).rejects.toThrow('No subscription found');
  });
});
