import { describe, it, expect } from 'vitest';
import { MORE_DRAWER_ITEMS } from '../more-drawer';

// ============================================================
// Phase 5 — "Higit pa…" / "More" drawer item registry.
// Per C7 verdict: 6 long-tail routes. Drafts and Linggong
// Kuwento are coming-soon stubs until Phase 10 ships.
// ============================================================

describe('MoreDrawer — item registry', () => {
  it('exposes exactly 6 drawer items', () => {
    expect(MORE_DRAWER_ITEMS).toHaveLength(6);
  });

  it('lists the C7 verdict items in the canonical order', () => {
    expect(MORE_DRAWER_ITEMS.map((item) => item.key)).toEqual([
      'deadlines',
      'costing',
      'invoices',
      'drafts',
      'checkin',
      'kuwento',
    ]);
  });

  it('marks Drafts and Linggong Kuwento as coming-soon (not yet routed)', () => {
    const drafts = MORE_DRAWER_ITEMS.find((item) => item.key === 'drafts');
    const kuwento = MORE_DRAWER_ITEMS.find((item) => item.key === 'kuwento');
    expect(drafts?.comingSoon).toBe(true);
    expect(kuwento?.comingSoon).toBe(true);
    expect(drafts?.href).toBeNull();
    expect(kuwento?.href).toBeNull();
  });

  it('routes the live items to existing app routes', () => {
    const live = MORE_DRAWER_ITEMS.filter((item) => !item.comingSoon);
    expect(live.map((item) => item.href)).toEqual([
      '/deadlines',
      '/costing',
      '/invoices',
      '/dashboard',
    ]);
  });

  it('uses unique i18n keys per item', () => {
    const keys = MORE_DRAWER_ITEMS.map((item) => item.i18nKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
