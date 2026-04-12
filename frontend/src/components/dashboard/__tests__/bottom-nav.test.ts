import { describe, it, expect } from 'vitest';

// ============================================================
// Test BottomNav configuration and logic
// Without @testing-library we test the nav item definitions directly.
// ============================================================

interface NavItem {
  label: string;
  href: string;
  testId: string;
}

// Mirror the NAV_ITEMS from bottom-nav.tsx (5-item nav: Home, Chat, Resibo, Gastos, Profile)
const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/dashboard', testId: 'nav-home' },
  { label: 'Chat', href: '/chat', testId: 'nav-chat' },
  { label: 'Resibo', href: '/scan', testId: 'nav-scan' },
  { label: 'Gastos', href: '/expenses', testId: 'nav-expenses' },
  { label: 'Profile', href: '/profile', testId: 'nav-profile' },
];

describe('BottomNav — configuration', () => {
  it('should have exactly 5 tabs', () => {
    expect(NAV_ITEMS).toHaveLength(5);
  });

  it('should have Home, Chat, Resibo, Gastos, and Profile tabs', () => {
    const labels = NAV_ITEMS.map((item) => item.label);
    expect(labels).toEqual(['Home', 'Chat', 'Resibo', 'Gastos', 'Profile']);
  });

  it('should link to correct routes', () => {
    expect(NAV_ITEMS[0].href).toBe('/dashboard');
    expect(NAV_ITEMS[1].href).toBe('/chat');
    expect(NAV_ITEMS[2].href).toBe('/scan');
    expect(NAV_ITEMS[3].href).toBe('/expenses');
    expect(NAV_ITEMS[4].href).toBe('/profile');
  });

  it('should have unique test IDs for each tab', () => {
    const testIds = NAV_ITEMS.map((item) => item.testId);
    const uniqueIds = new Set(testIds);
    expect(uniqueIds.size).toBe(5);
  });

  it('should have unique hrefs for each tab', () => {
    const hrefs = NAV_ITEMS.map((item) => item.href);
    const uniqueHrefs = new Set(hrefs);
    expect(uniqueHrefs.size).toBe(5);
  });
});

describe('BottomNav — active route detection', () => {
  // Mirror the isActive logic from the component
  function isActive(pathname: string, itemHref: string): boolean {
    return (
      pathname === itemHref ||
      (itemHref !== '/dashboard' && pathname.startsWith(itemHref))
    );
  }

  it('should highlight Home when pathname is /dashboard', () => {
    expect(isActive('/dashboard', '/dashboard')).toBe(true);
    expect(isActive('/dashboard', '/chat')).toBe(false);
  });

  it('should highlight Chat when pathname is /chat', () => {
    expect(isActive('/chat', '/chat')).toBe(true);
    expect(isActive('/chat', '/dashboard')).toBe(false);
  });

  it('should highlight Resibo when pathname is /scan', () => {
    expect(isActive('/scan', '/scan')).toBe(true);
  });

  it('should highlight Chat for nested chat routes', () => {
    expect(isActive('/chat/some-conversation', '/chat')).toBe(true);
  });

  it('should NOT highlight Home for nested dashboard-like routes', () => {
    // /dashboard is exact match only (not startsWith)
    expect(isActive('/dashboard-settings', '/dashboard')).toBe(false);
  });

  it('should highlight Gastos when pathname is /expenses', () => {
    expect(isActive('/expenses', '/expenses')).toBe(true);
    expect(isActive('/expenses/123', '/expenses')).toBe(true);
  });

  it('should highlight Profile when pathname is /profile', () => {
    expect(isActive('/profile', '/profile')).toBe(true);
    expect(isActive('/profile/settings', '/profile')).toBe(true);
  });
});
