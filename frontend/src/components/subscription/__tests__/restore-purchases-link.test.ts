/**
 * RestorePurchasesLink — behavior tests (Sprint 17 batch 3).
 *
 * Scope: validates the pure `handleRestoreResult` dispatcher across the
 *        4 outcome branches:
 *
 *          - success(pro)      → success toast + onSuccess(pro)
 *          - success(starter)  → success toast + onSuccess(starter)
 *          - error(nothing)    → 'iap.error.nothing_to_restore' toast
 *          - error(unknown)    → 'iap.error.unknown' toast
 *          - error(web_only)   → 'iap.error.web_only' toast (web branch)
 *          - cancelled         → no-op guard (defensive)
 *
 * The component itself wraps the dispatcher with a useState + async
 * onClick, which jsdom would exercise. In node-env we cover the
 * outcome contract directly.
 *
 * Reference: sprint-17-revenuecat-pattern.md §2 messageKey table + §4
 *            lines 752-770 (Apple Guideline 3.1.1 restore link).
 */

import { describe, it, expect, vi } from 'vitest';
import { handleRestoreResult } from '../restore-purchases-link';

describe('RestorePurchasesLink — handleRestoreResult dispatcher', () => {
  it('success(pro) → success toast + onSuccess(pro)', () => {
    const onSuccess = vi.fn();
    const onToast = vi.fn();
    handleRestoreResult(
      { status: 'success', tier: 'pro' },
      onSuccess,
      onToast,
    );
    expect(onToast).toHaveBeenCalledWith('iap.success.restore', 'success');
    expect(onSuccess).toHaveBeenCalledWith('pro');
  });

  it('success(starter) → success toast + onSuccess(starter)', () => {
    const onSuccess = vi.fn();
    const onToast = vi.fn();
    handleRestoreResult(
      { status: 'success', tier: 'starter' },
      onSuccess,
      onToast,
    );
    expect(onToast).toHaveBeenCalledWith('iap.success.restore', 'success');
    expect(onSuccess).toHaveBeenCalledWith('starter');
  });

  it('error(nothing_to_restore) → emits the nothing-to-restore toast', () => {
    const onSuccess = vi.fn();
    const onToast = vi.fn();
    handleRestoreResult(
      { status: 'error', messageKey: 'iap.error.nothing_to_restore' },
      onSuccess,
      onToast,
    );
    expect(onToast).toHaveBeenCalledWith('iap.error.nothing_to_restore', 'error');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('error(unknown) → emits the unknown toast', () => {
    const onSuccess = vi.fn();
    const onToast = vi.fn();
    handleRestoreResult(
      { status: 'error', messageKey: 'iap.error.unknown' },
      onSuccess,
      onToast,
    );
    expect(onToast).toHaveBeenCalledWith('iap.error.unknown', 'error');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('error(web_only) → emits the web_only toast (web branch)', () => {
    const onSuccess = vi.fn();
    const onToast = vi.fn();
    handleRestoreResult(
      { status: 'error', messageKey: 'iap.error.web_only' },
      onSuccess,
      onToast,
    );
    expect(onToast).toHaveBeenCalledWith('iap.error.web_only', 'error');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('cancelled → no-op (no toast, no onSuccess)', () => {
    const onSuccess = vi.fn();
    const onToast = vi.fn();
    handleRestoreResult(
      { status: 'cancelled' },
      onSuccess,
      onToast,
    );
    expect(onToast).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('success with no onSuccess callback → still emits toast (no throw)', () => {
    const onToast = vi.fn();
    expect(() =>
      handleRestoreResult(
        { status: 'success', tier: 'pro' },
        undefined,
        onToast,
      ),
    ).not.toThrow();
    expect(onToast).toHaveBeenCalledWith('iap.success.restore', 'success');
  });

  it('error with no onToast callback → still completes (no throw)', () => {
    const onSuccess = vi.fn();
    expect(() =>
      handleRestoreResult(
        { status: 'error', messageKey: 'iap.error.unknown' },
        onSuccess,
        undefined,
      ),
    ).not.toThrow();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe('RestorePurchasesLink — module exports', () => {
  it('exports RestorePurchasesLink + handleRestoreResult', async () => {
    const mod = await import('../restore-purchases-link');
    expect(mod.RestorePurchasesLink).toBeDefined();
    expect(mod.handleRestoreResult).toBeDefined();
  });
});
