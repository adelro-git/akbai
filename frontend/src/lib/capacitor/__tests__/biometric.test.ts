// ============================================================
// Biometric — module tests (Sprint 16 batch 3)
// Feature: @aparajita/capacitor-biometric-auth integration
//
// Scope: validates the biometric.ts module without loading the
//        native bridge. Mocks @capacitor/core, the biometric plugin,
//        and @capacitor/preferences (the failure-counter store).
//
// Key assertions:
//   - isBiometricSupported: web → false; native+available → true;
//     native+unavailable → false; native+throws → false
//   - enableBiometric: web no-op; native cancel → error; native
//     success → PATCH /api/profile with biometric_enabled=true
//   - disableBiometric: web no-op; native success → PATCH with
//     biometric_enabled=false
//   - verifyBiometric: success → counter reset; failure → counter
//     incremented; 3 consecutive failures surfaces failureCount=3
//   - Failure counter persists in @capacitor/preferences (NOT
//     localStorage — architect §4 risk #3)
//
// Reference: sprint-16-native-plugin-pattern.md §4 + §7 audit #3.
// ============================================================

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

// ============================================================
// Capacitor mocks — declared BEFORE the import under test so the
// module-load-time Capacitor.isNativePlatform() resolves through
// the stub. vi.mock is hoisted; this block runs first.
// ============================================================

const mockIsNativePlatform = vi.fn(() => true);

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => mockIsNativePlatform(),
    getPlatform: () => 'android',
  },
}));

// --- @aparajita/capacitor-biometric-auth ---
const mockCheckBiometry = vi.fn();
const mockAuthenticate = vi.fn();

vi.mock('@aparajita/capacitor-biometric-auth', () => {
  // BiometryError must live INSIDE the factory because vi.mock is
  // hoisted above all top-level declarations (vitest restriction).
  class FakeBiometryError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.code = code;
    }
  }
  return {
    BiometricAuth: {
      checkBiometry: (...args: unknown[]) => mockCheckBiometry(...args),
      authenticate: (...args: unknown[]) => mockAuthenticate(...args),
    },
    BiometryError: FakeBiometryError,
    BiometryErrorType: {
      none: '',
      appCancel: 'appCancel',
      authenticationFailed: 'authenticationFailed',
      userCancel: 'userCancel',
      userFallback: 'userFallback',
      biometryLockout: 'biometryLockout',
      biometryNotAvailable: 'biometryNotAvailable',
      biometryNotEnrolled: 'biometryNotEnrolled',
    },
  };
});

// ============================================================
// Local error constructor used by the tests below — must
// duplicate the shape because the factory above is hoisted away.
// Tests use this to feed `mockAuthenticate.mockRejectedValue(...)`.
// The biometric.ts production code uses a structural check
// (`'code' in err`) when instanceof fails across module boundaries,
// so a structurally-equivalent throwable still hits the right branch.
// ============================================================

class TestBiometryError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

// --- @capacitor/preferences: in-memory store with a per-test reset ---
const prefStore = new Map<string, string>();
const mockPrefGet = vi.fn(async ({ key }: { key: string }) => ({
  value: prefStore.get(key) ?? null,
}));
const mockPrefSet = vi.fn(async ({ key, value }: { key: string; value: string }) => {
  prefStore.set(key, value);
});
const mockPrefRemove = vi.fn(async ({ key }: { key: string }) => {
  prefStore.delete(key);
});

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: (...args: Parameters<typeof mockPrefGet>) => mockPrefGet(...args),
    set: (...args: Parameters<typeof mockPrefSet>) => mockPrefSet(...args),
    remove: (...args: Parameters<typeof mockPrefRemove>) => mockPrefRemove(...args),
  },
}));

// ============================================================
// Subject under test
// ============================================================

import {
  isBiometricSupported,
  enableBiometric,
  disableBiometric,
  verifyBiometric,
  getFailureCount,
  resetFailureCount,
  BIOMETRIC_FAILURES_KEY,
  MAX_BIOMETRIC_FAILURES,
} from '../biometric';

// ============================================================
// Helpers
// ============================================================

const originalFetch = global.fetch;

beforeEach(() => {
  mockIsNativePlatform.mockReset().mockReturnValue(true);
  mockCheckBiometry.mockReset();
  mockAuthenticate.mockReset();
  mockPrefGet.mockClear();
  mockPrefSet.mockClear();
  mockPrefRemove.mockClear();
  prefStore.clear();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ success: true }),
  }) as unknown as typeof fetch;
});

// ============================================================
// isBiometricSupported
// ============================================================

describe('isBiometricSupported', () => {
  it('returns false on web', async () => {
    mockIsNativePlatform.mockReturnValue(false);
    await expect(isBiometricSupported()).resolves.toBe(false);
    expect(mockCheckBiometry).not.toHaveBeenCalled();
  });

  it('returns true on native when biometry is available', async () => {
    mockCheckBiometry.mockResolvedValue({ isAvailable: true });
    await expect(isBiometricSupported()).resolves.toBe(true);
  });

  it('returns false on native when biometry is not enrolled', async () => {
    mockCheckBiometry.mockResolvedValue({ isAvailable: false });
    await expect(isBiometricSupported()).resolves.toBe(false);
  });

  it('returns false when checkBiometry throws', async () => {
    mockCheckBiometry.mockRejectedValue(new Error('plugin not configured'));
    await expect(isBiometricSupported()).resolves.toBe(false);
  });
});

// ============================================================
// enableBiometric
// ============================================================

describe('enableBiometric', () => {
  it('returns failure on web', async () => {
    mockIsNativePlatform.mockReturnValue(false);
    const result = await enableBiometric();
    expect(result.success).toBe(false);
    expect(result.error).toContain('AKBai app');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns failure when no biometric is enrolled', async () => {
    mockCheckBiometry.mockResolvedValue({ isAvailable: false });
    const result = await enableBiometric();
    expect(result.success).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns failure when user cancels the biometric prompt', async () => {
    mockCheckBiometry.mockResolvedValue({ isAvailable: true });
    mockAuthenticate.mockRejectedValue(
      new TestBiometryError('User cancelled', 'userCancel'),
    );
    const result = await enableBiometric();
    expect(result.success).toBe(false);
    expect(result.error).toContain('Na-cancel');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('PATCHes /api/profile with biometric_enabled=true on success', async () => {
    mockCheckBiometry.mockResolvedValue({ isAvailable: true });
    mockAuthenticate.mockResolvedValue(undefined);
    const result = await enableBiometric();
    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/profile',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ biometric_enabled: true }),
      }),
    );
  });

  it('surfaces server-side error message on PATCH failure', async () => {
    mockCheckBiometry.mockResolvedValue({ isAvailable: true });
    mockAuthenticate.mockResolvedValue(undefined);
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message_tl: 'Hindi ma-save.' } }),
    }) as unknown as typeof fetch;
    const result = await enableBiometric();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Hindi ma-save.');
  });

  it('resets the failure counter after a successful enable', async () => {
    prefStore.set(BIOMETRIC_FAILURES_KEY, '2');
    mockCheckBiometry.mockResolvedValue({ isAvailable: true });
    mockAuthenticate.mockResolvedValue(undefined);
    await enableBiometric();
    expect(prefStore.has(BIOMETRIC_FAILURES_KEY)).toBe(false);
  });
});

// ============================================================
// disableBiometric
// ============================================================

describe('disableBiometric', () => {
  it('returns failure on web', async () => {
    mockIsNativePlatform.mockReturnValue(false);
    const result = await disableBiometric();
    expect(result.success).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('PATCHes /api/profile with biometric_enabled=false', async () => {
    const result = await disableBiometric();
    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/profile',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ biometric_enabled: false }),
      }),
    );
  });

  it('resets the failure counter after a successful disable', async () => {
    prefStore.set(BIOMETRIC_FAILURES_KEY, '2');
    await disableBiometric();
    expect(prefStore.has(BIOMETRIC_FAILURES_KEY)).toBe(false);
  });
});

// ============================================================
// verifyBiometric — happy + counter + 3-strike fallback
// ============================================================

describe('verifyBiometric', () => {
  it('returns verified=false on web (counter untouched)', async () => {
    mockIsNativePlatform.mockReturnValue(false);
    const result = await verifyBiometric();
    expect(result.verified).toBe(false);
    expect(result.failureCount).toBe(0);
    expect(mockAuthenticate).not.toHaveBeenCalled();
  });

  it('returns verified=true on native success and resets the counter', async () => {
    prefStore.set(BIOMETRIC_FAILURES_KEY, '1');
    mockAuthenticate.mockResolvedValue(undefined);
    const result = await verifyBiometric();
    expect(result.verified).toBe(true);
    expect(result.failureCount).toBe(0);
    expect(prefStore.has(BIOMETRIC_FAILURES_KEY)).toBe(false);
  });

  it('increments the failure counter on first failure (count = 1)', async () => {
    mockAuthenticate.mockRejectedValue(
      new TestBiometryError('No match', 'authenticationFailed'),
    );
    const result = await verifyBiometric();
    expect(result.verified).toBe(false);
    expect(result.failureCount).toBe(1);
    expect(prefStore.get(BIOMETRIC_FAILURES_KEY)).toBe('1');
  });

  it('counter reaches MAX_BIOMETRIC_FAILURES after 3 consecutive failures', async () => {
    mockAuthenticate.mockRejectedValue(
      new TestBiometryError('No match', 'authenticationFailed'),
    );
    const r1 = await verifyBiometric();
    const r2 = await verifyBiometric();
    const r3 = await verifyBiometric();
    expect(r1.failureCount).toBe(1);
    expect(r2.failureCount).toBe(2);
    expect(r3.failureCount).toBe(3);
    expect(r3.failureCount).toBe(MAX_BIOMETRIC_FAILURES);
    expect(prefStore.get(BIOMETRIC_FAILURES_KEY)).toBe('3');
  });

  it('treats user-cancel as a failure (architect §4 — cancel-and-retry attack)', async () => {
    mockAuthenticate.mockRejectedValue(
      new TestBiometryError('cancel', 'userCancel'),
    );
    const result = await verifyBiometric();
    expect(result.verified).toBe(false);
    expect(result.failureCount).toBe(1);
  });

  it('counter resets to zero after a successful verify following failures', async () => {
    // 2 failures, then success — counter should clear.
    mockAuthenticate
      .mockRejectedValueOnce(new TestBiometryError('fail', 'authenticationFailed'))
      .mockRejectedValueOnce(new TestBiometryError('fail', 'authenticationFailed'))
      .mockResolvedValueOnce(undefined);
    await verifyBiometric();
    await verifyBiometric();
    const success = await verifyBiometric();
    expect(success.verified).toBe(true);
    expect(success.failureCount).toBe(0);
    expect(prefStore.has(BIOMETRIC_FAILURES_KEY)).toBe(false);
  });
});

// ============================================================
// getFailureCount + resetFailureCount
// ============================================================

describe('getFailureCount + resetFailureCount', () => {
  it('getFailureCount returns 0 on web', async () => {
    mockIsNativePlatform.mockReturnValue(false);
    await expect(getFailureCount()).resolves.toBe(0);
  });

  it('getFailureCount returns 0 when Preferences has no entry', async () => {
    await expect(getFailureCount()).resolves.toBe(0);
  });

  it('getFailureCount parses the stored counter', async () => {
    prefStore.set(BIOMETRIC_FAILURES_KEY, '2');
    await expect(getFailureCount()).resolves.toBe(2);
  });

  it('getFailureCount returns 0 for garbage stored values', async () => {
    prefStore.set(BIOMETRIC_FAILURES_KEY, 'NaN-or-something');
    await expect(getFailureCount()).resolves.toBe(0);
  });

  it('resetFailureCount clears the Preferences entry', async () => {
    prefStore.set(BIOMETRIC_FAILURES_KEY, '2');
    await resetFailureCount();
    expect(prefStore.has(BIOMETRIC_FAILURES_KEY)).toBe(false);
  });

  it('resetFailureCount is a no-op on web', async () => {
    mockIsNativePlatform.mockReturnValue(false);
    await resetFailureCount();
    expect(mockPrefRemove).not.toHaveBeenCalled();
  });
});

// Restore fetch on teardown so subsequent test files don't see our stub.
afterAll(() => {
  global.fetch = originalFetch;
});

