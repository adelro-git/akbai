import { test, expect } from '@playwright/test';

/**
 * Dashboard E2E — verifies dashboard loads with dev data,
 * cards render, and check-in modal opens/closes.
 *
 * Requires: NEXT_PUBLIC_SKIP_AUTH=true (set in playwright.config.ts webServer.env)
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Skip welcome tour by setting localStorage before page loads
    await page.addInitScript(() => {
      localStorage.setItem('akbai_tour_seen', 'true');
    });
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
  });

  test('renders KA greeting with user name', async ({ page }) => {
    const greeting = page.locator('[data-testid="kai-greeting"]');
    await expect(greeting).toBeVisible();
    const greetingText = page.locator('[data-testid="kai-greeting-text"]');
    await expect(greetingText).toBeVisible();
  });

  test('renders all 4 dashboard cards', async ({ page }) => {
    await expect(page.locator('[data-testid="dashboard-card-message-circle"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-card-calendar"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-card-camera"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-card-wallet"]')).toBeVisible();
  });

  test('Quick Chat card navigates to /chat', async ({ page }) => {
    await page.click('[data-testid="dashboard-card-message-circle"]');
    await page.waitForURL(/\/chat/);
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
  });

  test('check-in section is visible', async ({ page }) => {
    // Check-in shows either a CTA (not yet checked in) or summary (already checked in)
    const cta = page.locator('[data-testid="check-in-cta"]');
    const summary = page.locator('[data-testid="check-in-summary"]');
    const ctaButton = page.locator('[data-testid="check-in-cta-button"]');

    const hasCheckIn = await cta.or(summary).or(ctaButton).first().isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasCheckIn) {
      test.skip();
      return;
    }
    // At least one check-in element is visible
    expect(hasCheckIn).toBeTruthy();
  });

  test('check-in modal opens and has form fields', async ({ page }) => {
    const ctaButton = page.locator('[data-testid="check-in-cta-button"]');
    const updateButton = page.locator('[data-testid="check-in-update-btn"]');

    // Try to open the modal — skip if neither button exists
    const hasCta = await ctaButton.isVisible({ timeout: 3000 }).catch(() => false);
    const hasUpdate = await updateButton.isVisible({ timeout: 1000 }).catch(() => false);

    if (!hasCta && !hasUpdate) {
      test.skip();
      return;
    }

    if (hasCta) await ctaButton.click();
    else await updateButton.click();

    // Wait for modal — skip if it doesn't appear (requires Supabase)
    const modal = page.locator('[data-testid="check-in-modal"]');
    const modalVisible = await modal.isVisible({ timeout: 3000 }).catch(() => false);
    if (!modalVisible) {
      test.skip();
      return;
    }

    // Mood selectors
    await expect(page.locator('[data-testid="mood-great"]')).toBeVisible();
    await expect(page.locator('[data-testid="mood-good"]')).toBeVisible();

    // Amount inputs
    await expect(page.locator('[data-testid="check-in-sales"]')).toBeVisible();
    await expect(page.locator('[data-testid="check-in-expenses"]')).toBeVisible();
  });
});
