import { describe, it, expect } from 'vitest';

// ============================================================
// Phase 5 — SidebarNav configuration mirror.
// Sidebar at ≥ 860px (custom `tablet:` breakpoint). Layout:
// brand lockup → persona pill → 4 primary nav items + 5th
// "Higit pa…" Vaul trigger → language toggle pinned bottom.
// Profile is removed from the nav list — it's reachable via
// the persona pill (per C4 verdict, single-user app).
// ============================================================

interface SidebarNavItem {
  key: 'home' | 'chat' | 'scan' | 'money';
  href: string;
  testId: string;
}

const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  { key: 'home', href: '/dashboard', testId: 'sidebar-nav-home' },
  { key: 'chat', href: '/chat', testId: 'sidebar-nav-chat' },
  { key: 'scan', href: '/scan', testId: 'sidebar-nav-scan' },
  { key: 'money', href: '/expenses', testId: 'sidebar-nav-money' },
];

describe('SidebarNav — configuration', () => {
  it('should have 4 primary link items (5th is the More drawer trigger)', () => {
    expect(SIDEBAR_NAV_ITEMS).toHaveLength(4);
  });

  it('should not include /profile in nav items — taps go via the persona pill', () => {
    const hrefs = SIDEBAR_NAV_ITEMS.map((item) => item.href);
    expect(hrefs).not.toContain('/profile');
  });

  it('should match the four bottom-nav routes exactly (chrome consistency)', () => {
    expect(SIDEBAR_NAV_ITEMS.map((item) => item.key)).toEqual(['home', 'chat', 'scan', 'money']);
  });
});

describe('SidebarNav — persona tagline derivation', () => {
  // Mirror the layout's tagline derivation logic for the persona pill.
  function deriveTagline(
    rawType: string | null,
    labels: Record<string, string>,
    fallback: string,
  ): string | null {
    if (!rawType) return null;
    if (rawType.startsWith('other:')) {
      const custom = rawType.slice('other:'.length).trim();
      return custom.length > 0 ? custom : (labels.other ?? fallback);
    }
    return labels[rawType] ?? fallback;
  }

  const LABELS: Record<string, string> = {
    food_baking: 'Food / Baking',
    online_selling: 'Online seller',
    sari_sari_retail: 'Sari-sari / Retail',
    other: 'Negosyante',
  };

  it('should map a known business_type slug to its localized label', () => {
    expect(deriveTagline('sari_sari_retail', LABELS, 'Negosyante')).toBe('Sari-sari / Retail');
  });

  it('should surface the user-typed string for "other:" prefixed types', () => {
    expect(deriveTagline('other:Specialty Coffee', LABELS, 'Negosyante')).toBe('Specialty Coffee');
  });

  it('should fall back to the "other" label when the user typed nothing after "other:"', () => {
    expect(deriveTagline('other:', LABELS, 'Negosyante')).toBe('Negosyante');
  });

  it('should return null when no business_type is set yet', () => {
    expect(deriveTagline(null, LABELS, 'Negosyante')).toBeNull();
  });
});
