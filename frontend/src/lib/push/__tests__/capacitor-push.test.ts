// ============================================================
// Capacitor Native Push — register flow tests (Sprint 16)
// Feature: @capacitor/push-notifications integration
//
// Scope: validates the registerNativePush() control flow without
//        actually loading the native bridge. We mock @capacitor/core
//        and @capacitor/push-notifications so the module loads under
//        the vitest node env. The key assertions are:
//          - web path returns early (no permission request, no register)
//          - native path requests permission, registers, and POSTs the
//            FCM/APNs token to /api/push/subscribe via the discriminated
//            union shape (platform + native_token)
//          - listeners are bound exactly once across repeated calls
//          - denied permission short-circuits before register()
//
// Reference: sprint-16-native-plugin-pattern.md §3 + migration 020.
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Capacitor mocks — declared BEFORE the import under test so
// the module-load-time Capacitor.isNativePlatform() resolves
// through the stub.
// ============================================================

const mockIsNativePlatform = vi.fn(() => true);
const mockGetPlatform = vi.fn(() => 'android' as 'android' | 'ios' | 'web');

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => mockIsNativePlatform(),
    getPlatform: () => mockGetPlatform(),
  },
}));

const mockRequestPermissions = vi.fn();
const mockRegister = vi.fn();
const mockAddListener = vi.fn();

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    requestPermissions: (...args: unknown[]) => mockRequestPermissions(...args),
    register: (...args: unknown[]) => mockRegister(...args),
    addListener: (...args: unknown[]) => mockAddListener(...args),
  },
}));

// ============================================================
// Subject under test
// ============================================================

import {
  registerNativePush,
  postNativeToken,
  isNativePushSupported,
  unregisterNativePush,
  __resetListenersBoundForTests,
} from '../capacitor-push';

// ============================================================
// Helpers
// ============================================================

const originalFetch = global.fetch;

beforeEach(() => {
  mockIsNativePlatform.mockReset().mockReturnValue(true);
  mockGetPlatform.mockReset().mockReturnValue('android');
  mockRequestPermissions.mockReset();
  mockRegister.mockReset();
  mockAddListener.mockReset();
  __resetListenersBoundForTests();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 201,
    json: async () => ({ success: true, data: { subscribed: true } }),
  }) as unknown as typeof fetch;
});

// ============================================================
// isNativePushSupported
// ============================================================

describe('isNativePushSupported', () => {
  it('returns true on native', async () => {
    mockIsNativePlatform.mockReturnValue(true);
    await expect(isNativePushSupported()).resolves.toBe(true);
  });

  it('returns false on web', async () => {
    mockIsNativePlatform.mockReturnValue(false);
    await expect(isNativePushSupported()).resolves.toBe(false);
  });
});

// ============================================================
// registerNativePush — web no-op
// ============================================================

describe('registerNativePush — web no-op', () => {
  it('returns success=false without requesting permissions on web', async () => {
    mockIsNativePlatform.mockReturnValue(false);

    const result = await registerNativePush();

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Capacitor build/i);
    expect(mockRequestPermissions).not.toHaveBeenCalled();
    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockAddListener).not.toHaveBeenCalled();
  });
});

// ============================================================
// registerNativePush — native happy path
// ============================================================

describe('registerNativePush — native happy path', () => {
  it('requests permission and calls register() on grant', async () => {
    mockIsNativePlatform.mockReturnValue(true);
    mockRequestPermissions.mockResolvedValue({ receive: 'granted' });
    mockRegister.mockResolvedValue(undefined);
    mockAddListener.mockResolvedValue({ remove: vi.fn() });

    const result = await registerNativePush();

    expect(result.success).toBe(true);
    expect(mockRequestPermissions).toHaveBeenCalledOnce();
    expect(mockRegister).toHaveBeenCalledOnce();
    // 4 listeners: registration, registrationError, pushNotificationReceived,
    // pushNotificationActionPerformed (architect §3).
    expect(mockAddListener).toHaveBeenCalledTimes(4);
  });

  it('binds listeners exactly once across repeated calls', async () => {
    mockIsNativePlatform.mockReturnValue(true);
    mockRequestPermissions.mockResolvedValue({ receive: 'granted' });
    mockRegister.mockResolvedValue(undefined);
    mockAddListener.mockResolvedValue({ remove: vi.fn() });

    await registerNativePush();
    await registerNativePush();
    await registerNativePush();

    // Listeners bound once; register() called every time.
    expect(mockAddListener).toHaveBeenCalledTimes(4);
    expect(mockRegister).toHaveBeenCalledTimes(3);
  });
});

// ============================================================
// registerNativePush — denied permission short-circuit
// ============================================================

describe('registerNativePush — denied permission', () => {
  it('returns conversational Filipino error when receive !== granted', async () => {
    mockIsNativePlatform.mockReturnValue(true);
    mockRequestPermissions.mockResolvedValue({ receive: 'denied' });

    const result = await registerNativePush();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Hindi pa naka-allow ang notifications.');
    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockAddListener).not.toHaveBeenCalled();
  });

  it('propagates a thrown permission request as success=false', async () => {
    mockIsNativePlatform.mockReturnValue(true);
    mockRequestPermissions.mockRejectedValue(new Error('os-denied'));

    const result = await registerNativePush();

    expect(result.success).toBe(false);
    expect(result.error).toBe('os-denied');
    expect(mockRegister).not.toHaveBeenCalled();
  });
});

// ============================================================
// postNativeToken — POST shape conforms to migration 020 schema
// ============================================================

describe('postNativeToken', () => {
  it('POSTs platform=android + native_token to /api/push/subscribe', async () => {
    mockGetPlatform.mockReturnValue('android');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201 });
    global.fetch = fetchMock as unknown as typeof fetch;

    await postNativeToken('fcm-token-xyz');

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/push/subscribe');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({ platform: 'android', native_token: 'fcm-token-xyz' });
  });

  it('POSTs platform=ios when Capacitor.getPlatform() === "ios"', async () => {
    mockGetPlatform.mockReturnValue('ios');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201 });
    global.fetch = fetchMock as unknown as typeof fetch;

    await postNativeToken('apns-token-abc');

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.platform).toBe('ios');
    expect(body.native_token).toBe('apns-token-abc');
  });
});

// ============================================================
// unregisterNativePush — Sprint 16 is a no-op on web; native stub.
// ============================================================

describe('unregisterNativePush', () => {
  it('is a no-op on web', async () => {
    mockIsNativePlatform.mockReturnValue(false);
    await expect(unregisterNativePush()).resolves.toBeUndefined();
  });

  it('resolves without throwing on native (Sprint 19 wires real unregister)', async () => {
    mockIsNativePlatform.mockReturnValue(true);
    await expect(unregisterNativePush()).resolves.toBeUndefined();
  });
});

// ============================================================
// Restore globals after the suite
// ============================================================

describe('teardown', () => {
  it('restores global.fetch', () => {
    global.fetch = originalFetch;
    expect(typeof global.fetch).toBe('function');
  });
});
