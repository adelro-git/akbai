import { describe, it, expect } from 'vitest';

// ============================================================
// Phase 5 — BottomNav configuration mirror.
// 5 tabs: Home / Chat / Scan / Pera / More. The 5th tab opens
// the Vaul "Higit pa…" drawer instead of navigating; it has no
// href, so it's tested separately.
// ============================================================

interface NavItem {
  key: 'home' | 'chat' | 'scan' | 'money';
  label: string;
  href: string;
  testId: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', href: '/dashboard', testId: 'nav-home' },
  { key: 'chat', label: 'Kausap', href: '/chat', testId: 'nav-chat' },
  { key: 'scan', label: 'Scan', href: '/scan', testId: 'nav-scan' },
  { key: 'money', label: 'Pera', href: '/expenses', testId: 'nav-money' },
];

const MORE_TAB = { key: 'more', label: 'Higit pa', testId: 'nav-more' } as const;

describe('BottomNav — configuration', () => {
  it('should have exactly 4 link tabs + 1 drawer trigger = 5 total', () => {
    expect(NAV_ITEMS).toHaveLength(4);
    expect(MORE_TAB.testId).toBe('nav-more');
  });

  it('should expose the 4 primary routes', () => {
    expect(NAV_ITEMS.map((item) => item.key)).toEqual(['home', 'chat', 'scan', 'money']);
    expect(NAV_ITEMS.map((item) => item.href)).toEqual([
      '/dashboard',
      '/chat',
      '/scan',
      '/expenses',
    ]);
  });

  it('should have unique test IDs across the 4 link tabs and the More drawer trigger', () => {
    const allIds = [...NAV_ITEMS.map((item) => item.testId), MORE_TAB.testId];
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it('should not include /profile in primary tabs (Profile moved to sidebar persona pill)', () => {
    const hrefs = NAV_ITEMS.map((item) => item.href);
    expect(hrefs).not.toContain('/profile');
  });
});

describe('BottomNav — active route detection', () => {
  function isRouteActive(pathname: string, itemHref: string): boolean {
    return pathname === itemHref || (itemHref !== '/dashboard' && pathname.startsWith(itemHref));
  }

  it('should highlight Home only on exact /dashboard match', () => {
    expect(isRouteActive('/dashboard', '/dashboard')).toBe(true);
    expect(isRouteActive('/dashboard-settings', '/dashboard')).toBe(false);
  });

  it('should highlight Chat including nested chat routes', () => {
    expect(isRouteActive('/chat', '/chat')).toBe(true);
    expect(isRouteActive('/chat/some-conversation', '/chat')).toBe(true);
  });

  it('should highlight Scan when pathname is /scan', () => {
    expect(isRouteActive('/scan', '/scan')).toBe(true);
  });

  it('should highlight Pera (money) for /expenses including detail routes', () => {
    expect(isRouteActive('/expenses', '/expenses')).toBe(true);
    expect(isRouteActive('/expenses/123', '/expenses')).toBe(true);
  });

  it('should not highlight any primary tab when on a long-tail route reached via the More drawer', () => {
    expect(isRouteActive('/deadlines', '/dashboard')).toBe(false);
    expect(isRouteActive('/deadlines', '/chat')).toBe(false);
    expect(isRouteActive('/deadlines', '/scan')).toBe(false);
    expect(isRouteActive('/deadlines', '/expenses')).toBe(false);
  });
});
