/**
 * Tests for Push Registration Module
 * Feature: Push Notifications (Gap B6)
 * Tests browser API detection and permission handling.
 * Note: Full subscribe/unsubscribe tests require browser APIs (PushManager)
 * and are better tested via Playwright e2e. These unit tests focus on
 * feature detection and the utility functions' behavior in a Node environment.
 */

import { describe, it, expect } from 'vitest';
import { isPushSupported, getNotificationPermission, requestNotificationPermission } from '../register';

// ============================================================
// isPushSupported — feature detection in Node environment
// In Node (Vitest default), window/navigator/PushManager are not available,
// so isPushSupported correctly returns false.
// ============================================================

describe('isPushSupported', () => {
  it('returns false in Node environment (no window/PushManager)', () => {
    expect(isPushSupported()).toBe(false);
  });

  it('returns a boolean value', () => {
    expect(typeof isPushSupported()).toBe('boolean');
  });
});

// ============================================================
// getNotificationPermission — permission state in Node environment
// In Node, Notification API is not available, so returns 'unsupported'.
// ============================================================

describe('getNotificationPermission', () => {
  it('returns "unsupported" in Node environment (no Notification API)', () => {
    expect(getNotificationPermission()).toBe('unsupported');
  });

  it('returns a string value', () => {
    const result = getNotificationPermission();
    expect(typeof result).toBe('string');
    expect(['default', 'granted', 'denied', 'unsupported']).toContain(result);
  });
});

// ============================================================
// requestNotificationPermission — permission request in Node environment
// In Node, returns 'unsupported' since push is not supported.
// ============================================================

describe('requestNotificationPermission', () => {
  it('returns "unsupported" in Node environment', async () => {
    const result = await requestNotificationPermission();
    expect(result).toBe('unsupported');
  });

  it('returns a string value', async () => {
    const result = await requestNotificationPermission();
    expect(typeof result).toBe('string');
  });
});
