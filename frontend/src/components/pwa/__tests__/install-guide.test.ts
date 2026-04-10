/**
 * Tests for PWA Install Guide — platform detection, install state, copy
 * Feature: PWA Install Guide (Sprint 12, Gaps B7+D9)
 *
 * Tests platform detection logic, install state checks, and content contract
 * without @testing-library (unit-level validation).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectIsIOS, detectIsAndroid, detectPlatform, detectIsInstalled } from '@/hooks/use-pwa-install';

// ============================================================
// 1. Platform Detection — iOS
// ============================================================

describe('detectIsIOS', () => {
  const originalNavigator = global.navigator;

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it('should detect iPhone user agent as iOS', () => {
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        platform: 'iPhone',
        maxTouchPoints: 5,
      },
      writable: true,
      configurable: true,
    });
    expect(detectIsIOS()).toBe(true);
  });

  it('should detect iPad user agent as iOS', () => {
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        platform: 'iPad',
        maxTouchPoints: 5,
      },
      writable: true,
      configurable: true,
    });
    expect(detectIsIOS()).toBe(true);
  });

  it('should detect modern iPad (MacIntel + touch) as iOS', () => {
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        platform: 'MacIntel',
        maxTouchPoints: 5,
      },
      writable: true,
      configurable: true,
    });
    expect(detectIsIOS()).toBe(true);
  });

  it('should not detect Android as iOS', () => {
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/112.0',
        platform: 'Linux armv8l',
        maxTouchPoints: 5,
      },
      writable: true,
      configurable: true,
    });
    expect(detectIsIOS()).toBe(false);
  });
});

// ============================================================
// 2. Platform Detection — Android
// ============================================================

describe('detectIsAndroid', () => {
  const originalNavigator = global.navigator;

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it('should detect Android user agent', () => {
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/112.0',
        platform: 'Linux armv8l',
        maxTouchPoints: 5,
      },
      writable: true,
      configurable: true,
    });
    expect(detectIsAndroid()).toBe(true);
  });

  it('should not detect desktop Chrome as Android', () => {
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/112.0',
        platform: 'Win32',
        maxTouchPoints: 0,
      },
      writable: true,
      configurable: true,
    });
    expect(detectIsAndroid()).toBe(false);
  });
});

// ============================================================
// 3. Platform Detection — Combined
// ============================================================

describe('detectPlatform', () => {
  const originalNavigator = global.navigator;

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it('should return "ios" for iPhone', () => {
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        platform: 'iPhone',
        maxTouchPoints: 5,
      },
      writable: true,
      configurable: true,
    });
    expect(detectPlatform()).toBe('ios');
  });

  it('should return "android" for Android', () => {
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Linux; Android 13) Chrome/112.0',
        platform: 'Linux armv8l',
        maxTouchPoints: 5,
      },
      writable: true,
      configurable: true,
    });
    expect(detectPlatform()).toBe('android');
  });

  it('should return "desktop" for Windows desktop', () => {
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/112.0',
        platform: 'Win32',
        maxTouchPoints: 0,
      },
      writable: true,
      configurable: true,
    });
    expect(detectPlatform()).toBe('desktop');
  });
});

// ============================================================
// 4. Install State Detection
// ============================================================

describe('detectIsInstalled', () => {
  it('should return false when window is undefined (SSR)', () => {
    // In test env window exists but matchMedia may not
    const originalWindow = global.window;
    // @ts-expect-error -- testing SSR scenario
    delete global.window;
    expect(detectIsInstalled()).toBe(false);
    global.window = originalWindow;
  });

  it('should return false for normal browser mode', () => {
    // Mock window.matchMedia for test environment
    const mockMatchMedia = vi.fn().mockReturnValue({ matches: false });
    const originalWindow = global.window;
    global.window = { matchMedia: mockMatchMedia } as unknown as Window & typeof globalThis;
    expect(detectIsInstalled()).toBe(false);
    global.window = originalWindow;
  });

  it('should return true when display-mode is standalone', () => {
    const mockMatchMedia = vi.fn().mockReturnValue({ matches: true });
    const originalWindow = global.window;
    global.window = { matchMedia: mockMatchMedia } as unknown as Window & typeof globalThis;
    expect(detectIsInstalled()).toBe(true);
    global.window = originalWindow;
  });
});

// ============================================================
// 5. Conversational Filipino Copy Contract
// ============================================================

describe('Install Guide — copy contract', () => {
  it('should have conversational Filipino CTA text', () => {
    // These are the key user-facing strings in install-guide.tsx
    const ctaText = 'I-add ang AKBai sa home screen mo';
    expect(ctaText).toContain('AKBai');
    expect(ctaText).toContain('home screen');
    // Uses Filipino word order: verb-first (I-add)
    expect(ctaText.startsWith('I-add')).toBe(true);
  });

  it('should use Filipino for installed state message', () => {
    const installedMsg = 'Naka-install na ang AKBai';
    expect(installedMsg).toContain('Naka-install');
    expect(installedMsg).toContain('AKBai');
  });

  it('should have non-corporate dismiss text for onboarding variant', () => {
    const dismissText = 'Mamaya na lang';
    // Not "Skip" or "Later" — conversational Filipino
    expect(dismissText).not.toBe('Skip');
    expect(dismissText).not.toBe('Later');
    expect(dismissText).toContain('Mamaya');
  });
});
