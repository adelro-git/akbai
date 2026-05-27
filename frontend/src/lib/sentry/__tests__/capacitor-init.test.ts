// ============================================================
// Sentry Capacitor — init wrapper tests (Sprint 16 batch 3)
// Feature: @sentry/capacitor native crash SDK
//
// Scope: validates the initSentryCapacitor() control flow without
//        loading the native SDK. Mocks @capacitor/core and uses a
//        dynamic-import shim for @sentry/capacitor.
//
// Key assertions:
//   - Web: no init call, no exception
//   - Native without DSN: no init call (silent skip)
//   - Native with DSN: init called once with enableNative=true
//   - Native idempotent: second call is a no-op
//   - Native init throw: handled, no exception propagation
//
// Reference: sprint-16-native-plugin-pattern.md §6.
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Capacitor mocks — declared BEFORE the import under test.
// ============================================================

const mockIsNativePlatform = vi.fn(() => true);

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => mockIsNativePlatform(),
    getPlatform: () => 'android',
  },
}));

// @sentry/capacitor is dynamically imported by initSentryCapacitor(),
// so a vi.mock at the module level intercepts it.
const mockSentryInit = vi.fn();

vi.mock('@sentry/capacitor', () => ({
  init: (...args: unknown[]) => mockSentryInit(...args),
}));

// ============================================================
// Subject under test
// ============================================================

import {
  initSentryCapacitor,
  __resetSentryCapacitorInitForTests,
} from '../capacitor-init';

beforeEach(() => {
  mockIsNativePlatform.mockReset().mockReturnValue(true);
  mockSentryInit.mockReset();
  __resetSentryCapacitorInitForTests();
  // Clear DSN by default; tests opt in by setting it.
  delete process.env.NEXT_PUBLIC_SENTRY_DSN;
});

describe('initSentryCapacitor', () => {
  it('is a no-op on web', async () => {
    mockIsNativePlatform.mockReturnValue(false);
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://example@sentry.io/1';
    await initSentryCapacitor();
    expect(mockSentryInit).not.toHaveBeenCalled();
  });

  it('skips silently on native without DSN', async () => {
    // Native + no DSN — should NOT call init (silent skip).
    await initSentryCapacitor();
    expect(mockSentryInit).not.toHaveBeenCalled();
  });

  it('calls Sentry.init with enableNative=true on native with DSN', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://example@sentry.io/1';
    await initSentryCapacitor();
    expect(mockSentryInit).toHaveBeenCalledTimes(1);
    const callArgs = mockSentryInit.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(callArgs.dsn).toBe('https://example@sentry.io/1');
    expect(callArgs.enableNative).toBe(true);
  });

  it('passes NO sibling-init function (no JS double-capture)', async () => {
    // Architect §6 + risk #4: we deliberately omit the sibling init
    // function so @sentry/capacitor does NOT wrap @sentry/browser.
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://example@sentry.io/1';
    await initSentryCapacitor();
    expect(mockSentryInit).toHaveBeenCalledTimes(1);
    // mock.calls[0] is the args array; should only have ONE arg (the
    // options object). Two args would mean a sibling init was passed.
    expect(mockSentryInit.mock.calls[0]?.length).toBe(1);
  });

  it('is idempotent — second call is a no-op', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://example@sentry.io/1';
    await initSentryCapacitor();
    await initSentryCapacitor();
    expect(mockSentryInit).toHaveBeenCalledTimes(1);
  });

  it('handles init throw without propagating exception', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://example@sentry.io/1';
    mockSentryInit.mockImplementation(() => {
      throw new Error('native bridge not loaded');
    });
    // Should not throw.
    await expect(initSentryCapacitor()).resolves.toBeUndefined();
  });
});
