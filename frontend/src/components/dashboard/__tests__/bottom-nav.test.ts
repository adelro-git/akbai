import { describe, it, expect } from 'vitest';

// ============================================================
// Warm Precision (spec §7) — BottomNav configuration mirror.
// Restructured 5-tabs → 4 tabs + center Scan FAB:
//   [ home · chat ]  ( Scan FAB )  [ money · more-drawer ]
// Scan LEFT the link-tab row; it is now the floating honey-gradient
// FAB (data-testid "nav-scan-fab") that routes to /scan. The "more"
// tab opens the Vaul drawer (no href). Active-route detection is
// unchanged; /scan still highlights via the FAB's aria-current.
// ============================================================

interface NavItem {
  key: 'home' | 'chat' | 'money';
  label: string;
  href: string;
  testId: string;
}

// Three routing link tabs flank the center Scan FAB.
const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', href: '/dashboard', testId: 'nav-home' },
  { key: 'chat', label: 'Kausap', href: '/chat', testId: 'nav-chat' },
  { key: 'money', label: 'Pera', href: '/expenses', testId: 'nav-money' },
];

const MORE_TAB = { key: 'more', label: 'Higit pa', testId: 'nav-more' } as const;

// Scan is now the center FAB (a Link to /scan), not a row tab.
const SCAN_FAB = { key: 'scan', label: 'Scan', href: '/scan', testId: 'nav-scan-fab' } as const;

describe('BottomNav — configuration (Warm Precision: 4 tabs + Scan FAB)', () => {
  it('should have exactly 3 routing link tabs + 1 drawer trigger = 4 row slots', () => {
    expect(NAV_ITEMS).toHaveLength(3);
    expect(MORE_TAB.testId).toBe('nav-more');
  });

  it('should NOT include Scan in the routing tab row', () => {
    expect(NAV_ITEMS.map((item) => item.key)).not.toContain('scan');
    expect(NAV_ITEMS.map((item) => item.testId)).not.toContain('nav-scan');
  });

  it('should expose Scan as the center FAB routing to /scan', () => {
    expect(SCAN_FAB.testId).toBe('nav-scan-fab');
    expect(SCAN_FAB.href).toBe('/scan');
  });

  it('should expose the 3 routing tabs in order', () => {
    expect(NAV_ITEMS.map((item) => item.key)).toEqual(['home', 'chat', 'money']);
    expect(NAV_ITEMS.map((item) => item.href)).toEqual([
      '/dashboard',
      '/chat',
      '/expenses',
    ]);
  });

  it('should have unique test IDs across tabs, the More trigger, and the Scan FAB', () => {
    const allIds = [
      ...NAV_ITEMS.map((item) => item.testId),
      MORE_TAB.testId,
      SCAN_FAB.testId,
    ];
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

  it('should highlight the Scan FAB when pathname is /scan', () => {
    expect(isRouteActive('/scan', SCAN_FAB.href)).toBe(true);
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
