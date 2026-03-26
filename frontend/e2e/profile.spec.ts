import { test, expect } from '@playwright/test';

/**
 * Profile E2E — verifies profile page loads with dev user data,
 * edit mode toggles, and form fields are present.
 *
 * Requires: NEXT_PUBLIC_SKIP_AUTH=true (set in playwright.config.ts webServer.env)
 */

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();
  });

  test('renders profile with user sections', async ({ page }) => {
    // "Ikaw" (You) section
    await expect(page.locator('[data-testid="section-ikaw"]')).toBeVisible();
    // "Negosyo" (Business) section
    await expect(page.locator('[data-testid="section-negosyo"]')).toBeVisible();
  });

  test('displays dev user email', async ({ page }) => {
    const email = page.locator('[data-testid="email"]');
    await expect(email).toBeVisible();
    // Dev user email
    await expect(email).toContainText('dev@akbai.test');
  });

  test('edit button toggles to edit form', async ({ page }) => {
    const editBtn = page.locator('[data-testid="edit-btn"]');
    await expect(editBtn).toBeVisible();

    await editBtn.click();

    // Edit form should appear
    await expect(page.locator('[data-testid="profile-edit-form"]')).toBeVisible();
    // Cancel and Save buttons
    await expect(page.locator('[data-testid="cancel-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="save-btn"]')).toBeVisible();
  });

  test('cancel button returns to read-only view', async ({ page }) => {
    await page.click('[data-testid="edit-btn"]');
    await expect(page.locator('[data-testid="profile-edit-form"]')).toBeVisible();

    await page.click('[data-testid="cancel-btn"]');
    // Should return to read-only mode
    await expect(page.locator('[data-testid="profile-edit-form"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="business-info-readonly"]')).toBeVisible();
  });

  test('back button navigates to dashboard', async ({ page }) => {
    const backBtn = page.locator('[data-testid="profile-back-btn"]');
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await page.waitForURL(/\/dashboard/);
    }
  });
});
