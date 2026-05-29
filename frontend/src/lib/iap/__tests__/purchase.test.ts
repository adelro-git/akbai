// ============================================================
// RevenueCat purchase + restore — wrapper tests (Sprint 17 batch 1)
// Feature: @revenuecat/purchases-capacitor IAP SDK
//
// Scope: validates purchasePackage() + restorePurchases() control
//        flow without loading the native bridge. Mocks @capacitor/core,
//        @revenuecat/purchases-capacitor, @sentry/capacitor.
//
// Key assertions:
//   - Web (purchase): returns iap.error.web_only
//   - Web (restore):  returns iap.error.web_only
//   - userCancelled=true: silent { status: 'cancelled' } (no Sentry)
//   - Happy path: returns success + tier from PRODUCT_TO_TIER
//   - Error-code mapping (both enum-name + numeric-string forms):
//       NETWORK_ERROR / '10'           → iap.error.network
//       PAYMENT_PENDING_ERROR / '20'   → iap.error.pending
//       INVALID_CREDENTIALS_ERROR / '11' → iap.error.invalid
//       STORE_PROBLEM_ERROR / '2'      → iap.error.store_unavailable
//       unknown code                   → iap.error.unknown
//   - No current offering: iap.error.store_unavailable
//   - Product not found in offering: iap.error.product_not_found
//   - restorePurchases happy path (pro / starter)
//   - restorePurchases empty: iap.error.nothing_to_restore
//   - restorePurchases throw: iap.error.unknown + Sentry capture
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
// RevenueCat plugin mock
// ============================================================

const mockGetOfferings = vi.fn();
const mockPurchasePackage = vi.fn();
const mockRestorePurchases = vi.fn();

vi.mock('@revenuecat/purchases-capacitor', () => ({
  Purchases: {
    getOfferings: (...args: unknown[]) => mockGetOfferings(...args),
    purchasePackage: (...args: unknown[]) => mockPurchasePackage(...args),
    restorePurchases: (...args: unknown[]) => mockRestorePurchases(...args),
  },
}));

const mockSentryCapture = vi.fn();
vi.mock('@sentry/capacitor', () => ({
  captureException: (...args: unknown[]) => mockSentryCapture(...args),
}));

// ============================================================
// Subject under test
// ============================================================

import { purchasePackage, restorePurchases, PRODUCT_TO_TIER } from '../purchase';

// Helper: build a fake offering containing the named products.
function offering(productIds: string[]) {
  return {
    current: {
      availablePackages: productIds.map((id) => ({
        product: { identifier: id },
      })),
    },
  };
}

function customerInfo(active: Record<string, unknown>) {
  return { customerInfo: { entitlements: { active } } };
}

beforeEach(() => {
  mockIsNativePlatform.mockReset().mockReturnValue(true);
  mockGetOfferings.mockReset();
  mockPurchasePackage.mockReset();
  mockRestorePurchases.mockReset();
  mockSentryCapture.mockReset();
});

// ============================================================
// purchasePackage — web fallback + happy + error paths
// ============================================================

describe('purchasePackage', () => {
  it('returns iap.error.web_only on web', async () => {
    mockIsNativePlatform.mockReturnValue(false);
    const result = await purchasePackage('akbai_pro_monthly');
    expect(result).toEqual({ status: 'error', messageKey: 'iap.error.web_only' });
    expect(mockGetOfferings).not.toHaveBeenCalled();
  });

  it('returns iap.error.store_unavailable when no current offering', async () => {
    mockGetOfferings.mockResolvedValue({ current: null });
    const result = await purchasePackage('akbai_pro_monthly');
    expect(result).toEqual({ status: 'error', messageKey: 'iap.error.store_unavailable' });
  });

  it('returns iap.error.product_not_found when product missing from offering', async () => {
    mockGetOfferings.mockResolvedValue(offering(['akbai_pro_annual']));
    const result = await purchasePackage('akbai_pro_monthly');
    expect(result).toEqual({ status: 'error', messageKey: 'iap.error.product_not_found' });
  });

  it('returns success + tier=pro for akbai_pro_monthly', async () => {
    mockGetOfferings.mockResolvedValue(offering(['akbai_pro_monthly']));
    mockPurchasePackage.mockResolvedValue(undefined);
    const result = await purchasePackage('akbai_pro_monthly');
    expect(result).toEqual({ status: 'success', tier: 'pro' });
    expect(PRODUCT_TO_TIER['akbai_pro_monthly']).toBe('pro');
  });

  it('returns success + tier=pro for akbai_pro_annual', async () => {
    mockGetOfferings.mockResolvedValue(offering(['akbai_pro_annual']));
    mockPurchasePackage.mockResolvedValue(undefined);
    const result = await purchasePackage('akbai_pro_annual');
    expect(result).toEqual({ status: 'success', tier: 'pro' });
  });

  it('returns success + tier=starter for akbai_starter_lifetime', async () => {
    mockGetOfferings.mockResolvedValue(offering(['akbai_starter_lifetime']));
    mockPurchasePackage.mockResolvedValue(undefined);
    const result = await purchasePackage('akbai_starter_lifetime');
    expect(result).toEqual({ status: 'success', tier: 'starter' });
  });

  it('returns cancelled (silent, no Sentry) when userCancelled=true', async () => {
    mockGetOfferings.mockResolvedValue(offering(['akbai_pro_monthly']));
    mockPurchasePackage.mockRejectedValue({ userCancelled: true, code: '1' });
    const result = await purchasePackage('akbai_pro_monthly');
    expect(result).toEqual({ status: 'cancelled' });
    expect(mockSentryCapture).not.toHaveBeenCalled();
  });

  it('maps NETWORK_ERROR to iap.error.network', async () => {
    mockGetOfferings.mockResolvedValue(offering(['akbai_pro_monthly']));
    mockPurchasePackage.mockRejectedValue({ code: 'NETWORK_ERROR' });
    const result = await purchasePackage('akbai_pro_monthly');
    expect(result).toEqual({ status: 'error', messageKey: 'iap.error.network' });
    expect(mockSentryCapture).toHaveBeenCalledTimes(1);
  });

  it('maps numeric code "10" (NETWORK_ERROR) to iap.error.network', async () => {
    // Real SDK errors come in as the enum's NUMERIC-STRING value, not the
    // enum NAME — see DRIFT note in purchase.ts module docblock.
    mockGetOfferings.mockResolvedValue(offering(['akbai_pro_monthly']));
    mockPurchasePackage.mockRejectedValue({ code: '10' });
    const result = await purchasePackage('akbai_pro_monthly');
    expect(result).toEqual({ status: 'error', messageKey: 'iap.error.network' });
  });

  it('maps PAYMENT_PENDING_ERROR to iap.error.pending', async () => {
    mockGetOfferings.mockResolvedValue(offering(['akbai_pro_monthly']));
    mockPurchasePackage.mockRejectedValue({ code: 'PAYMENT_PENDING_ERROR' });
    const result = await purchasePackage('akbai_pro_monthly');
    expect(result).toEqual({ status: 'error', messageKey: 'iap.error.pending' });
  });

  it('maps INVALID_CREDENTIALS_ERROR to iap.error.invalid', async () => {
    mockGetOfferings.mockResolvedValue(offering(['akbai_pro_monthly']));
    mockPurchasePackage.mockRejectedValue({ code: 'INVALID_CREDENTIALS_ERROR' });
    const result = await purchasePackage('akbai_pro_monthly');
    expect(result).toEqual({ status: 'error', messageKey: 'iap.error.invalid' });
  });

  it('maps STORE_PROBLEM_ERROR to iap.error.store_unavailable', async () => {
    mockGetOfferings.mockResolvedValue(offering(['akbai_pro_monthly']));
    mockPurchasePackage.mockRejectedValue({ code: 'STORE_PROBLEM_ERROR' });
    const result = await purchasePackage('akbai_pro_monthly');
    expect(result).toEqual({ status: 'error', messageKey: 'iap.error.store_unavailable' });
  });

  it('maps unknown code to iap.error.unknown', async () => {
    mockGetOfferings.mockResolvedValue(offering(['akbai_pro_monthly']));
    mockPurchasePackage.mockRejectedValue({ code: 'SOMETHING_NEW_FROM_RC' });
    const result = await purchasePackage('akbai_pro_monthly');
    expect(result).toEqual({ status: 'error', messageKey: 'iap.error.unknown' });
  });

  it('tags Sentry with source=revenuecat-purchase + code on non-cancellation errors', async () => {
    mockGetOfferings.mockResolvedValue(offering(['akbai_pro_monthly']));
    mockPurchasePackage.mockRejectedValue({ code: 'NETWORK_ERROR' });
    await purchasePackage('akbai_pro_monthly');
    expect(mockSentryCapture).toHaveBeenCalledTimes(1);
    const captureArgs = mockSentryCapture.mock.calls[0]?.[1] as
      | { tags?: { source?: string; code?: string } }
      | undefined;
    expect(captureArgs?.tags?.source).toBe('revenuecat-purchase');
    expect(captureArgs?.tags?.code).toBe('NETWORK_ERROR');
  });
});

// ============================================================
// restorePurchases — web fallback + happy + empty + error
// ============================================================

describe('restorePurchases', () => {
  it('returns iap.error.web_only on web', async () => {
    mockIsNativePlatform.mockReturnValue(false);
    const result = await restorePurchases();
    expect(result).toEqual({ status: 'error', messageKey: 'iap.error.web_only' });
    expect(mockRestorePurchases).not.toHaveBeenCalled();
  });

  it('returns success + tier=pro when pro_unlimited entitlement is active', async () => {
    mockRestorePurchases.mockResolvedValue(
      customerInfo({ pro_unlimited: { expirationDate: '2099-12-31T00:00:00.000Z' } }),
    );
    const result = await restorePurchases();
    expect(result).toEqual({ status: 'success', tier: 'pro' });
  });

  it('returns success + tier=starter when only starter_lifetime is active', async () => {
    mockRestorePurchases.mockResolvedValue(
      customerInfo({ starter_lifetime: { latestPurchaseDate: '2026-05-27T00:00:00.000Z' } }),
    );
    const result = await restorePurchases();
    expect(result).toEqual({ status: 'success', tier: 'starter' });
  });

  it('returns iap.error.nothing_to_restore when no entitlements found', async () => {
    mockRestorePurchases.mockResolvedValue(customerInfo({}));
    const result = await restorePurchases();
    expect(result).toEqual({ status: 'error', messageKey: 'iap.error.nothing_to_restore' });
  });

  it('returns iap.error.unknown + captures Sentry when restore throws', async () => {
    mockRestorePurchases.mockRejectedValue(new Error('store offline'));
    const result = await restorePurchases();
    expect(result).toEqual({ status: 'error', messageKey: 'iap.error.unknown' });
    expect(mockSentryCapture).toHaveBeenCalledTimes(1);
    const captureArgs = mockSentryCapture.mock.calls[0]?.[1] as
      | { tags?: { source?: string } }
      | undefined;
    expect(captureArgs?.tags?.source).toBe('revenuecat-restore');
  });
});
