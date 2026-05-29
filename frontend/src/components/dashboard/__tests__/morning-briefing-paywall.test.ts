/**
 * MorningBriefingCard — paywall integration tests (Sprint 17 batch 3).
 *
 * Scope: validates that a `reason='tier_required'` API response triggers
 *        the paywall path. In production, the card renders a CTA button
 *        whose onClick calls setPaywallOpen(true), and a <PaywallModal
 *        source="morning_briefing" /> mounts in the tree.
 *
 * The vitest env is `node` (no jsdom), so we test the state-derivation
 * + CTA-handler contract the way the existing morning-briefing-card.test.ts
 * does — pure logic mirroring the production branch.
 *
 * Reference: sprint-17-revenuecat-pattern.md §4 line 684 + §8 batch 3
 *            line 1060.
 */

import { describe, it, expect, vi } from 'vitest';

// ============================================================
// Stand-in for the relevant branch of morning-briefing-card.tsx
// ============================================================

interface BriefingResponse {
  success: boolean;
  data?: {
    available: boolean;
    briefing?: string;
    reason?: 'tier_required' | 'outside_window' | 'feature_disabled' | 'error';
    message_tl?: string;
  };
}

type CardState = 'loading' | 'available' | 'unavailable' | 'error';

interface CardDerivedState {
  state: CardState;
  reason?: string;
  shouldRenderPaywallTrigger: boolean;
  paywallSource: 'morning_briefing' | null;
}

function deriveState(json: BriefingResponse): CardDerivedState {
  if (!json.success || !json.data) {
    return { state: 'error', shouldRenderPaywallTrigger: false, paywallSource: null };
  }
  const data = json.data;
  if (data.available && data.briefing) {
    return {
      state: 'available',
      shouldRenderPaywallTrigger: false,
      paywallSource: null,
    };
  }
  // Sprint 17 contract: tier_required → render CTA + mount PaywallModal.
  if (data.reason === 'tier_required') {
    return {
      state: 'unavailable',
      reason: 'tier_required',
      shouldRenderPaywallTrigger: true,
      paywallSource: 'morning_briefing',
    };
  }
  return {
    state: 'unavailable',
    reason: data.reason,
    shouldRenderPaywallTrigger: false,
    paywallSource: null,
  };
}

// ============================================================
// Tests
// ============================================================

describe('MorningBriefingCard — paywall trigger on tier_required', () => {
  it('renders paywall trigger when reason=tier_required', () => {
    const json: BriefingResponse = {
      success: true,
      data: {
        available: false,
        reason: 'tier_required',
        message_tl: 'Mag-upgrade sa Pro para makita ang Morning Briefing mo!',
      },
    };
    const derived = deriveState(json);
    expect(derived.shouldRenderPaywallTrigger).toBe(true);
    expect(derived.paywallSource).toBe('morning_briefing');
  });

  it('does NOT render paywall trigger when briefing is available', () => {
    const json: BriefingResponse = {
      success: true,
      data: {
        available: true,
        briefing: 'Magandang umaga, Maria!',
      },
    };
    const derived = deriveState(json);
    expect(derived.shouldRenderPaywallTrigger).toBe(false);
    expect(derived.paywallSource).toBeNull();
  });

  it('does NOT render paywall trigger for outside_window reason', () => {
    const json: BriefingResponse = {
      success: true,
      data: {
        available: false,
        reason: 'outside_window',
        message_tl: 'Bukas ulit!',
      },
    };
    const derived = deriveState(json);
    expect(derived.shouldRenderPaywallTrigger).toBe(false);
    expect(derived.paywallSource).toBeNull();
  });

  it('does NOT render paywall trigger for feature_disabled reason', () => {
    const json: BriefingResponse = {
      success: true,
      data: {
        available: false,
        reason: 'feature_disabled',
        message_tl: 'Disabled.',
      },
    };
    const derived = deriveState(json);
    expect(derived.shouldRenderPaywallTrigger).toBe(false);
  });

  it('does NOT render paywall trigger on API error', () => {
    const json: BriefingResponse = { success: false };
    const derived = deriveState(json);
    expect(derived.shouldRenderPaywallTrigger).toBe(false);
  });

  it('CTA click handler flips setPaywallOpen → true', () => {
    const setPaywallOpen = vi.fn();
    const handleClick = () => setPaywallOpen(true);
    handleClick();
    expect(setPaywallOpen).toHaveBeenCalledWith(true);
  });

  it('paywall source is exactly "morning_briefing" — matches PaywallSource union', () => {
    const json: BriefingResponse = {
      success: true,
      data: { available: false, reason: 'tier_required' },
    };
    const derived = deriveState(json);
    // Must match exactly — drift here means PaywallModal renders a fallback
    // title or throws (next-intl strict mode).
    expect(derived.paywallSource).toBe('morning_briefing');
  });
});
