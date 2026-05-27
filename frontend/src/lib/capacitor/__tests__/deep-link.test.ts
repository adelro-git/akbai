// ============================================================
// Deep Link — module tests (Sprint 16 batch 3)
// Feature: @capacitor/app appUrlOpen listener
//
// Scope: validates the deep-link parser and listener registration
//        without loading the native bridge. Mocks @capacitor/core
//        and @capacitor/app.
//
// Key assertions:
//   - parseDeepLinkUrl: maps com.akbai.app://auth/callback?code=X to
//     /auth/callback?code=X&next=/dashboard (default next preserved)
//   - parseDeepLinkUrl: preserves explicit `next` param
//   - parseDeepLinkUrl: preserves `error` param
//   - parseDeepLinkUrl: returns null for unknown host/path
//   - parseDeepLinkUrl: returns null for malformed URLs
//   - registerDeepLink: web no-op (returns cleanup that does nothing)
//   - registerDeepLink: native — addListener called, forwarder invoked
//     when appUrlOpen fires
//
// Reference: sprint-16-native-plugin-pattern.md §5.
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

// We capture the listener callback so the test can invoke it directly
// rather than trying to simulate a native event.
let capturedListener: ((event: { url: string }) => void) | null = null;
const mockAddListener = vi.fn(
  async (_event: string, listener: (event: { url: string }) => void) => {
    capturedListener = listener;
    return {
      remove: vi.fn(async () => {
        capturedListener = null;
      }),
    };
  },
);

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: (...args: Parameters<typeof mockAddListener>) =>
      mockAddListener(...args),
  },
}));

// ============================================================
// Subject under test
// ============================================================

import { parseDeepLinkUrl, registerDeepLink } from '../deep-link';

beforeEach(() => {
  mockIsNativePlatform.mockReset().mockReturnValue(true);
  mockAddListener.mockClear();
  capturedListener = null;
});

// ============================================================
// parseDeepLinkUrl — URL → path mapping
// ============================================================

describe('parseDeepLinkUrl — auth/callback mapping', () => {
  it('maps com.akbai.app://auth/callback?code=X to /auth/callback path with default next', () => {
    const path = parseDeepLinkUrl('com.akbai.app://auth/callback?code=ABC123');
    expect(path).toBe('/auth/callback?code=ABC123&next=%2Fdashboard');
  });

  it('preserves explicit next param', () => {
    const path = parseDeepLinkUrl(
      'com.akbai.app://auth/callback?code=ABC123&next=%2Fexpenses',
    );
    expect(path).toBe('/auth/callback?code=ABC123&next=%2Fexpenses');
  });

  it('preserves error param', () => {
    const path = parseDeepLinkUrl(
      'com.akbai.app://auth/callback?error=otp_expired',
    );
    expect(path).toContain('error=otp_expired');
  });

  it('returns null for unknown host', () => {
    const path = parseDeepLinkUrl('com.akbai.app://unknown/path?code=X');
    expect(path).toBeNull();
  });

  it('returns null for known host but unknown path', () => {
    const path = parseDeepLinkUrl('com.akbai.app://auth/elsewhere?code=X');
    expect(path).toBeNull();
  });

  it('returns null for malformed URLs', () => {
    expect(parseDeepLinkUrl('not-a-url')).toBeNull();
    expect(parseDeepLinkUrl('')).toBeNull();
  });
});

// ============================================================
// registerDeepLink — listener wiring
// ============================================================

describe('registerDeepLink — listener wiring', () => {
  it('returns a no-op cleanup on web (no listener bound)', async () => {
    mockIsNativePlatform.mockReturnValue(false);
    const cleanup = registerDeepLink(() => {
      // Forwarder not expected to be invoked on web.
    });
    await cleanup();
    expect(mockAddListener).not.toHaveBeenCalled();
  });

  it('binds appUrlOpen listener on native', () => {
    registerDeepLink(() => {
      // Forwarder placeholder.
    });
    expect(mockAddListener).toHaveBeenCalledWith(
      'appUrlOpen',
      expect.any(Function),
    );
  });

  it('forwards the parsed path when appUrlOpen fires with a matching URL', () => {
    const forwarder = vi.fn();
    registerDeepLink(forwarder);
    // Trigger the captured listener as if @capacitor/app emitted an event.
    expect(capturedListener).not.toBeNull();
    capturedListener?.({ url: 'com.akbai.app://auth/callback?code=XYZ' });
    expect(forwarder).toHaveBeenCalledWith(
      '/auth/callback?code=XYZ&next=%2Fdashboard',
    );
  });

  it('does NOT forward when appUrlOpen fires with an unknown URL', () => {
    const forwarder = vi.fn();
    registerDeepLink(forwarder);
    capturedListener?.({ url: 'com.akbai.app://something-else' });
    expect(forwarder).not.toHaveBeenCalled();
  });

  it('cleanup removes the listener', async () => {
    const cleanup = registerDeepLink(() => {
      // no-op
    });
    expect(capturedListener).not.toBeNull();
    await cleanup();
    // Our mock's remove() callback nulls the captured listener.
    expect(capturedListener).toBeNull();
  });
});
