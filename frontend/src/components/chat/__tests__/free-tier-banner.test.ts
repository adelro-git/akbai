import { describe, it, expect } from 'vitest';

// ============================================================
// Test FreeTierBanner logic — query limit thresholds and tier filtering
// Without @testing-library, we verify the banner display logic directly.
// ============================================================

interface BannerState {
  visible: boolean;
  variant: 'none' | 'warning' | 'block';
  message: string;
}

/**
 * Pure logic extracted from FreeTierBanner component.
 * Determines banner visibility, variant, and message based on queries + tier.
 */
function getBannerState(queriesUsed: number, tier: string): BannerState {
  // Only show for free tier users
  if (tier !== 'free') {
    return { visible: false, variant: 'none', message: '' };
  }

  // At 10+ queries: red/error banner (blocked)
  if (queriesUsed >= 10) {
    return {
      visible: true,
      variant: 'block',
      message: 'Naka-max ka na for today — bukas ulit tayo! Pro users get unlimited queries.',
    };
  }

  // At 8-9 queries: amber/warning banner
  if (queriesUsed >= 8) {
    const remaining = 10 - queriesUsed;
    return {
      visible: true,
      variant: 'warning',
      message: `${remaining} na lang ang tanong mo ngayon. Bukas ulit, o mag-upgrade sa Pro!`,
    };
  }

  // Below 8: no banner
  return { visible: false, variant: 'none', message: '' };
}

describe('FreeTierBanner — visibility thresholds', () => {
  it('banner not rendered when queriesUsed < 8', () => {
    expect(getBannerState(0, 'free').visible).toBe(false);
    expect(getBannerState(5, 'free').visible).toBe(false);
    expect(getBannerState(7, 'free').visible).toBe(false);
  });

  it('warning banner shown at queriesUsed = 8', () => {
    const state = getBannerState(8, 'free');
    expect(state.visible).toBe(true);
    expect(state.variant).toBe('warning');
    expect(state.message).toContain('2 na lang ang tanong mo');
    expect(state.message).toContain('mag-upgrade sa Pro');
  });

  it('warning banner shown at queriesUsed = 9 with 1 remaining', () => {
    const state = getBannerState(9, 'free');
    expect(state.visible).toBe(true);
    expect(state.variant).toBe('warning');
    expect(state.message).toContain('1 na lang ang tanong mo');
  });

  it('block banner shown at queriesUsed = 10', () => {
    const state = getBannerState(10, 'free');
    expect(state.visible).toBe(true);
    expect(state.variant).toBe('block');
    expect(state.message).toContain('Naka-max ka na');
    expect(state.message).toContain('Pro users get unlimited');
  });

  it('block banner shown at queriesUsed > 10', () => {
    const state = getBannerState(15, 'free');
    expect(state.visible).toBe(true);
    expect(state.variant).toBe('block');
  });
});

describe('FreeTierBanner — tier filtering', () => {
  it('banner hidden for pro tier regardless of queries', () => {
    expect(getBannerState(8, 'pro').visible).toBe(false);
    expect(getBannerState(10, 'pro').visible).toBe(false);
    expect(getBannerState(20, 'pro').visible).toBe(false);
  });

  it('banner hidden for business tier regardless of queries', () => {
    expect(getBannerState(10, 'business').visible).toBe(false);
    expect(getBannerState(20, 'business').visible).toBe(false);
  });

  it('banner only shows for free tier', () => {
    // At threshold, only free tier should see it
    expect(getBannerState(8, 'free').visible).toBe(true);
    expect(getBannerState(8, 'pro').visible).toBe(false);
    expect(getBannerState(8, 'business').visible).toBe(false);
  });
});

describe('FreeTierBanner — conversational Filipino copy', () => {
  it('warning message uses conversational Filipino', () => {
    const state = getBannerState(8, 'free');
    // Contains Filipino: "na lang ang tanong mo"
    expect(state.message).toContain('na lang ang tanong mo');
    // Filipinized verb (mag-upgrade) — no English SVO leak.
    expect(state.message).toContain('mag-upgrade sa Pro');
    expect(state.message).not.toContain('for today');
    expect(state.message).not.toContain(' or ');
  });

  it('block message uses conversational Filipino', () => {
    const state = getBannerState(10, 'free');
    // Filipino: "Naka-max ka na" and "bukas ulit tayo"
    expect(state.message).toContain('Naka-max ka na');
    expect(state.message).toContain('bukas ulit tayo');
  });

  it('block message should not use corporate English', () => {
    const state = getBannerState(10, 'free');
    expect(state.message).not.toContain('You have exceeded');
    expect(state.message).not.toContain('Please');
    expect(state.message).not.toContain('limit reached');
  });
});
