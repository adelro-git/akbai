// ============================================================
// Deferred Push Prompt — decision-function tests (Sprint 16)
// Feature: native push permission deferred-prompt
//
// Scope: validates the pure shouldShowDeferredPrompt() function that
//        gates rendering. The full React component is exercised in
//        e2e/Playwright; here we lock the truth table.
//
// Reference: sprint-16-native-plugin-pattern.md §3 (Open Q 2 (a) trigger).
// ============================================================

import { describe, it, expect, vi } from 'vitest';

// Capacitor mock to satisfy the module-level import in deferred-prompt.tsx
// when this test file pulls in the component module via the named export.
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
    getPlatform: () => 'web',
  },
}));

// Stub the capacitor-push module — we don't exercise registerNativePush here.
vi.mock('@/lib/push/capacitor-push', () => ({
  registerNativePush: vi.fn().mockResolvedValue({ success: true }),
  postNativeToken: vi.fn(),
  isNativePushSupported: vi.fn().mockResolvedValue(false),
  unregisterNativePush: vi.fn(),
  __resetListenersBoundForTests: vi.fn(),
}));

import { shouldShowDeferredPrompt } from '../deferred-prompt';

describe('shouldShowDeferredPrompt', () => {
  // ===== Happy path =====
  it('shows when native, has imminent deadline, never prompted', () => {
    expect(
      shouldShowDeferredPrompt({
        hasImminentDeadline: true,
        isNative: true,
        promptedAt: null,
      })
    ).toEqual({ show: true });
  });

  // ===== Web fallback =====
  it('hides on web regardless of other inputs', () => {
    expect(
      shouldShowDeferredPrompt({
        hasImminentDeadline: true,
        isNative: false,
        promptedAt: null,
      })
    ).toEqual({ show: false, reason: 'not-native' });
  });

  // ===== No imminent deadline =====
  it('hides on native when no imminent deadline within 14 days', () => {
    expect(
      shouldShowDeferredPrompt({
        hasImminentDeadline: false,
        isNative: true,
        promptedAt: null,
      })
    ).toEqual({ show: false, reason: 'no-imminent-deadline' });
  });

  // ===== One-shot guard =====
  it('hides on native + imminent when localStorage flag is already set', () => {
    expect(
      shouldShowDeferredPrompt({
        hasImminentDeadline: true,
        isNative: true,
        promptedAt: '2026-05-20T12:00:00.000Z',
      })
    ).toEqual({ show: false, reason: 'already-prompted' });
  });

  // ===== Precedence — `not-native` short-circuits other rejections =====
  it('returns not-native reason even when also missing imminent deadline', () => {
    expect(
      shouldShowDeferredPrompt({
        hasImminentDeadline: false,
        isNative: false,
        promptedAt: null,
      })
    ).toEqual({ show: false, reason: 'not-native' });
  });

  // ===== Precedence — `no-imminent-deadline` short-circuits `already-prompted` =====
  it('returns no-imminent-deadline reason when no imminent AND already-prompted', () => {
    expect(
      shouldShowDeferredPrompt({
        hasImminentDeadline: false,
        isNative: true,
        promptedAt: '2026-05-20T12:00:00.000Z',
      })
    ).toEqual({ show: false, reason: 'no-imminent-deadline' });
  });
});
