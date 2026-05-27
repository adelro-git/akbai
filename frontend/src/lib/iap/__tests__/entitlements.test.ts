// ============================================================
// RevenueCat entitlements — getEntitlements() tests (Sprint 17 batch 1)
// Feature: @revenuecat/purchases-capacitor IAP SDK
//
// Scope: validates the tier-resolution predicate set without
//        loading the native bridge. Mocks @capacitor/core and
//        @revenuecat/purchases-capacitor.
//
// Key assertions:
//   - Web (isNativePlatform=false): returns { tier: 'free', isNative: false }
//   - Native + active pro entitlement: returns { tier: 'pro', proExpiresAt }
//   - Native + active starter only: returns { tier: 'starter' }
//   - Native + BOTH pro and starter: pro wins (Open Q 3 priority)
//   - Native + no entitlements: returns { tier: 'free', isNative: true }
//   - Native + getCustomerInfo throws: returns { tier: 'free', isNative: true }
//
// Reference: sprint-17-revenuecat-pattern.md §2 + §8.
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Capacitor mock
// ============================================================

const mockIsNativePlatform = vi.fn(() => true);

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => mockIsNativePlatform(),
    getPlatform: () => 'android',
  },
}));

// ============================================================
// RevenueCat plugin mock — getCustomerInfo returns whatever
// mockGetCustomerInfo is configured to resolve.
// ============================================================

const mockGetCustomerInfo = vi.fn();

vi.mock('@revenuecat/purchases-capacitor', () => ({
  Purchases: {
    getCustomerInfo: (...args: unknown[]) => mockGetCustomerInfo(...args),
  },
}));

// --- Sentry capture for the catch path
const mockSentryCapture = vi.fn();
vi.mock('@sentry/capacitor', () => ({
  captureException: (...args: unknown[]) => mockSentryCapture(...args),
}));

// ============================================================
// Subject under test
// ============================================================

import { getEntitlements } from '../entitlements';

const FUTURE_DATE = '2099-12-31T00:00:00.000Z';
const PURCHASE_DATE = '2026-05-27T00:00:00.000Z';

function customerInfo(active: Record<string, unknown>) {
  return { customerInfo: { entitlements: { active } } };
}

beforeEach(() => {
  mockIsNativePlatform.mockReset().mockReturnValue(true);
  mockGetCustomerInfo.mockReset();
  mockSentryCapture.mockReset();
});

describe('getEntitlements', () => {
  it('returns tier=free + isNative=false on web', async () => {
    mockIsNativePlatform.mockReturnValue(false);
    const result = await getEntitlements();
    expect(result).toEqual({
      tier: 'free',
      proExpiresAt: null,
      starterPurchasedAt: null,
      isNative: false,
    });
    expect(mockGetCustomerInfo).not.toHaveBeenCalled();
  });

  it('returns tier=pro with proExpiresAt when pro_unlimited is active', async () => {
    mockGetCustomerInfo.mockResolvedValue(
      customerInfo({
        pro_unlimited: { expirationDate: FUTURE_DATE },
      }),
    );
    const result = await getEntitlements();
    expect(result.tier).toBe('pro');
    expect(result.proExpiresAt).toBe(FUTURE_DATE);
    expect(result.isNative).toBe(true);
  });

  it('returns tier=starter when only starter_lifetime is active', async () => {
    mockGetCustomerInfo.mockResolvedValue(
      customerInfo({
        starter_lifetime: { latestPurchaseDate: PURCHASE_DATE },
      }),
    );
    const result = await getEntitlements();
    expect(result.tier).toBe('starter');
    expect(result.starterPurchasedAt).toBe(PURCHASE_DATE);
    expect(result.proExpiresAt).toBeNull();
    expect(result.isNative).toBe(true);
  });

  it('returns tier=pro when BOTH entitlements are active (pro priority)', async () => {
    mockGetCustomerInfo.mockResolvedValue(
      customerInfo({
        pro_unlimited: { expirationDate: FUTURE_DATE },
        starter_lifetime: { latestPurchaseDate: PURCHASE_DATE },
      }),
    );
    const result = await getEntitlements();
    expect(result.tier).toBe('pro');
    // Pro wins, but starter purchase date is preserved for /profile display.
    expect(result.starterPurchasedAt).toBe(PURCHASE_DATE);
  });

  it('returns tier=free + isNative=true when no entitlements are active', async () => {
    mockGetCustomerInfo.mockResolvedValue(customerInfo({}));
    const result = await getEntitlements();
    expect(result).toEqual({
      tier: 'free',
      proExpiresAt: null,
      starterPurchasedAt: null,
      isNative: true,
    });
  });

  it('falls back to tier=free + isNative=true when getCustomerInfo throws', async () => {
    mockGetCustomerInfo.mockRejectedValue(new Error('native bridge offline'));
    const result = await getEntitlements();
    expect(result.tier).toBe('free');
    expect(result.isNative).toBe(true);
    expect(mockSentryCapture).toHaveBeenCalledTimes(1);
    const captureArgs = mockSentryCapture.mock.calls[0]?.[1] as
      | { tags?: { source?: string } }
      | undefined;
    expect(captureArgs?.tags?.source).toBe('revenuecat-entitlements');
  });

  it('handles missing expirationDate gracefully (proExpiresAt=null)', async () => {
    mockGetCustomerInfo.mockResolvedValue(
      customerInfo({
        pro_unlimited: {}, // No expirationDate field
      }),
    );
    const result = await getEntitlements();
    expect(result.tier).toBe('pro');
    expect(result.proExpiresAt).toBeNull();
  });
});
