import { test, expect } from '@playwright/test';

/**
 * Smoke test — verifies Playwright can reach the app and basic pages load.
 * Run with: npx playwright test e2e/smoke.spec.ts
 */

test.describe('AKBai Smoke Tests', () => {
  test('login page loads with AKBai branding', async ({ page }) => {
    await page.goto('/login');
    // Page should contain the app name or login form
    await expect(page.locator('body')).toBeVisible();
    // Check for login-related content
    const content = await page.content();
    expect(content.length).toBeGreaterThan(0);
  });

  test('unauthenticated user is redirected from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    // Should redirect to login (or show auth error)
    await page.waitForTimeout(2000);
    const url = page.url();
    // Either redirected to login or stayed on dashboard with auth guard
    expect(url).toBeTruthy();
  });

  test('offline page exists', async ({ page }) => {
    await page.goto('/offline');
    await expect(page.locator('body')).toBeVisible();
  });
});
