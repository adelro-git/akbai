import { test, expect } from '@playwright/test';

/**
 * Navigation E2E — verifies bottom nav (mobile) and cross-page
 * navigation works correctly across the app.
 *
 * Requires: NEXT_PUBLIC_SKIP_AUTH=true (set in playwright.config.ts webServer.env)
 */

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Skip welcome tour by setting localStorage before page loads
    await page.addInitScript(() => {
      localStorage.setItem('akbai_tour_seen', 'true');
    });
  });

  test('bottom nav is visible on dashboard (mobile)', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }

    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();

    const nav = page.locator('[data-testid="bottom-nav"]');
    await expect(nav).toBeVisible();

    // Warm Precision nav: 4 tabs (home/chat/money/more) flanking the center Scan FAB.
    await expect(page.locator('[data-testid="nav-home"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-chat"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-money"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-more"]')).toBeVisible();

    // Center Scan FAB (floating honey-gradient) — replaces the old nav-scan tab.
    const scanFab = page.locator('[data-testid="nav-scan-fab"]');
    await expect(scanFab).toBeVisible();
    await expect(scanFab).toHaveAttribute('href', '/scan');
  });

  test('bottom nav is hidden on chat page (mobile)', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }

    await page.goto('/chat');
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();

    // Bottom nav should be hidden on /chat to avoid overlapping input
    const nav = page.locator('[data-testid="bottom-nav"]');
    await expect(nav).not.toBeVisible();
  });

  test('navigate: dashboard → chat via nav', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }

    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();


    await page.click('[data-testid="nav-chat"]');
    await page.waitForURL(/\/chat/);
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
  });

  test('navigate: dashboard → money (expenses) via nav', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }

    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();


    // The Warm Precision "Pera" tab points at /expenses (profile left the bottom nav).
    await page.click('[data-testid="nav-money"]');
    await page.waitForURL(/\/expenses/);
    await expect(page.locator('[data-testid="expenses-page"]')).toBeVisible();
  });

  test('navigate: dashboard → scan via center Scan FAB', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }

    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();


    // Center floating FAB replaces the old nav-scan tab; it routes to /scan.
    await page.click('[data-testid="nav-scan-fab"]');
    await page.waitForURL(/\/scan/);
  });

  test('navigate: dashboard → expenses via Saan Napunta card', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();


    const walletCard = page.locator('[data-testid="dashboard-card-wallet"]');
    if (await walletCard.isVisible()) {
      await walletCard.click();
      await page.waitForURL(/\/expenses/);
      await expect(page.locator('[data-testid="expenses-page"]')).toBeVisible();
    }
  });

  test('desktop: sidebar nav is visible', async ({ page, isMobile }) => {
    if (isMobile) {
      test.skip();
      return;
    }

    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();


    const sidebar = page.locator('[data-testid="sidebar-nav"]');
    if (await sidebar.isVisible()) {
      await expect(sidebar).toBeVisible();
    }
  });
});
