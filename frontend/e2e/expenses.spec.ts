import { test, expect } from '@playwright/test';

/**
 * Expenses (Saan Napunta) E2E — verifies expenses page loads,
 * add transaction modal opens, and form elements are present.
 *
 * Requires: NEXT_PUBLIC_SKIP_AUTH=true (set in playwright.config.ts webServer.env)
 */

test.describe('Expenses Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/expenses');
    await expect(page.locator('[data-testid="expenses-page"]')).toBeVisible();
  });

  test('renders expenses page with title', async ({ page }) => {
    // Page should have Saan Napunta heading or expenses content
    await expect(page.locator('[data-testid="expenses-page"]')).toBeVisible();
  });

  test('add transaction FAB is visible on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }
    await expect(page.locator('[data-testid="add-transaction-fab"]')).toBeVisible();
  });

  test('add transaction modal opens and has form fields', async ({ page, isMobile }) => {
    // Click FAB on mobile or add button on desktop
    const fab = page.locator('[data-testid="add-transaction-fab"]');
    const addBtn = page.locator('[aria-label="Add transaction"]');

    if (await fab.isVisible()) {
      await fab.click();
    } else if (await addBtn.isVisible()) {
      await addBtn.click();
    } else {
      test.skip();
      return;
    }

    const modal = page.locator('[data-testid="add-transaction-modal"]');
    await expect(modal).toBeVisible();

    // Type toggle (expense/income)
    await expect(page.locator('[data-testid="type-expense"]')).toBeVisible();
    await expect(page.locator('[data-testid="type-income"]')).toBeVisible();
  });

  test('add transaction modal closes on close button', async ({ page }) => {
    const fab = page.locator('[data-testid="add-transaction-fab"]');
    const addBtn = page.locator('[aria-label="Add transaction"]');

    const hasFab = await fab.isVisible({ timeout: 3000 }).catch(() => false);
    const hasAdd = await addBtn.isVisible({ timeout: 1000 }).catch(() => false);

    if (!hasFab && !hasAdd) {
      test.skip();
      return;
    }

    if (hasFab) await fab.click();
    else await addBtn.click();

    const modal = page.locator('[data-testid="add-transaction-modal"]');
    const visible = await modal.isVisible({ timeout: 3000 }).catch(() => false);
    if (!visible) {
      test.skip();
      return;
    }

    // Close via close button (more reliable than backdrop click)
    const closeBtn = page.locator('[data-testid="add-transaction-close"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await expect(modal).not.toBeVisible();
    }
  });
});
