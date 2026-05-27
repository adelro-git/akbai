// ============================================================
// RevenueCat configure — init wrapper tests (Sprint 17 batch 1)
// Feature: @revenuecat/purchases-capacitor IAP SDK
//
// Scope: validates initRevenueCat() control flow without loading
//        the native bridge. Mocks @capacitor/core, @sentry/capacitor,
//        and @revenuecat/purchases-capacitor (the latter via the
//        Sprint 16 plugin-mock pattern — see biometric.test.ts).
//
// Key assertions:
//   - Web: no configure call, no exception, configured stays false
//   - Native + missing env key: silent skip (no configure call)
//   - Native + missing user id: silent skip (defers until layout re-fires)
//   - Native happy path: Purchases.configure called once with the
//     platform-keyed apiKey + supabase user id
//   - Native idempotent: second call short-circuits via module guard
//   - Native error path: Sentry.captureException tagged source='revenuecat-configure'
//   - Platform-keyed key resolution: iOS picks Apple key, Android picks Google key
//
// Reference: sprint-17-revenuecat-pattern.md §2 + §8.
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Capacitor mocks — declared BEFORE the import under test.
// ============================================================

const mockIsNativePlatform = vi.fn(() => true);
const mockGetPlatform = vi.fn(() => 'android');

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => mockIsNativePlatform(),
    getPlatform: () => mockGetPlatform(),
  },
}));

// --- @revenuecat/purchases-capacitor: factory exposes configure + setLogLevel.
//     LOG_LEVEL must live inside the factory because vi.mock is hoisted
//     above all top-level declarations.
const mockConfigure = vi.fn(async () => undefined);
const mockSetLogLevel = vi.fn(async () => undefined);

vi.mock('@revenuecat/purchases-capacitor', () => ({
  Purchases: {
    configure: (...args: unknown[]) => mockConfigure(...args),
    setLogLevel: (...args: unknown[]) => mockSetLogLevel(...args),
  },
  LOG_LEVEL: {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    VERBOSE: 'VERBOSE',
  },
}));

// --- @sentry/capacitor: captureException must surface in expect() calls.
const mockSentryCapture = vi.fn();
vi.mock('@sentry/capacitor', () => ({
  captureException: (...args: unknown[]) => mockSentryCapture(...args),
}));

// ============================================================
// Subject under test
// ============================================================

import { initRevenueCat, __resetRevenueCatForTests } from '../configure';

const FAKE_USER_ID = '00000000-0000-0000-0000-000000000001';

beforeEach(() => {
  mockIsNativePlatform.mockReset().mockReturnValue(true);
  mockGetPlatform.mockReset().mockReturnValue('android');
  mockConfigure.mockReset().mockResolvedValue(undefined as never);
  mockSetLogLevel.mockReset().mockResolvedValue(undefined as never);
  mockSentryCapture.mockReset();
  __resetRevenueCatForTests();
  delete process.env.NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY;
  delete process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY;
});

describe('initRevenueCat', () => {
  it('is a no-op on web (Capacitor.isNativePlatform=false)', async () => {
    mockIsNativePlatform.mockReturnValue(false);
    process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY = 'rcb_test_google';
    await initRevenueCat(FAKE_USER_ID);
    expect(mockConfigure).not.toHaveBeenCalled();
  });

  it('skips silently on native without an API key', async () => {
    // Native + no env key (dev local, smoke build) — should NOT call configure.
    await initRevenueCat(FAKE_USER_ID);
    expect(mockConfigure).not.toHaveBeenCalled();
  });

  it('defers when no supabase user id is available', async () => {
    process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY = 'rcb_test_google';
    await initRevenueCat(null);
    expect(mockConfigure).not.toHaveBeenCalled();
  });

  it('calls Purchases.configure with the Android API key on Android', async () => {
    process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY = 'rcb_test_google';
    process.env.NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY = 'rcb_test_apple';
    mockGetPlatform.mockReturnValue('android');
    await initRevenueCat(FAKE_USER_ID);
    expect(mockConfigure).toHaveBeenCalledTimes(1);
    const args = mockConfigure.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(args.apiKey).toBe('rcb_test_google');
    expect(args.appUserID).toBe(FAKE_USER_ID);
  });

  it('calls Purchases.configure with the Apple API key on iOS', async () => {
    process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY = 'rcb_test_google';
    process.env.NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY = 'rcb_test_apple';
    mockGetPlatform.mockReturnValue('ios');
    await initRevenueCat(FAKE_USER_ID);
    expect(mockConfigure).toHaveBeenCalledTimes(1);
    const args = mockConfigure.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(args.apiKey).toBe('rcb_test_apple');
  });

  it('is idempotent — second call short-circuits via module guard', async () => {
    process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY = 'rcb_test_google';
    await initRevenueCat(FAKE_USER_ID);
    await initRevenueCat(FAKE_USER_ID);
    expect(mockConfigure).toHaveBeenCalledTimes(1);
  });

  it('captures Sentry with source=revenuecat-configure when configure throws', async () => {
    process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY = 'rcb_test_google';
    mockConfigure.mockRejectedValueOnce(new Error('native bridge unreachable') as never);
    await expect(initRevenueCat(FAKE_USER_ID)).resolves.toBeUndefined();
    expect(mockSentryCapture).toHaveBeenCalledTimes(1);
    const captureArgs = mockSentryCapture.mock.calls[0]?.[1] as
      | { tags?: { source?: string } }
      | undefined;
    expect(captureArgs?.tags?.source).toBe('revenuecat-configure');
  });

  it('does NOT mark configured=true if configure throws (next call retries)', async () => {
    process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY = 'rcb_test_google';
    mockConfigure.mockRejectedValueOnce(new Error('first try fails') as never);
    await initRevenueCat(FAKE_USER_ID);
    mockConfigure.mockResolvedValueOnce(undefined as never);
    await initRevenueCat(FAKE_USER_ID);
    expect(mockConfigure).toHaveBeenCalledTimes(2);
  });

  it('sets DEBUG log level when NODE_ENV !== production', async () => {
    process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY = 'rcb_test_google';
    // vitest exposes vi.stubEnv as the supported way to mutate
    // hardened NODE_ENV. Restored automatically per beforeEach via
    // vi.unstubAllEnvs would be cleaner, but here a single test
    // re-stubs and the harness resets at suite end.
    vi.stubEnv('NODE_ENV', 'development');
    try {
      await initRevenueCat(FAKE_USER_ID);
      expect(mockSetLogLevel).toHaveBeenCalledTimes(1);
      const args = mockSetLogLevel.mock.calls[0]?.[0] as { level?: string } | undefined;
      expect(args?.level).toBe('DEBUG');
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
