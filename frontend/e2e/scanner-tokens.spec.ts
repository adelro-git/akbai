import { test, expect } from '@playwright/test';

/**
 * Phase 9a Scanner — Token + bottom-nav suppression regression
 *
 * Verdict per QA review: KEEP CURRENT (no visual-parity baseline). Instead,
 * lock the two design-token-level invariants the redesign explicitly
 * preserved:
 *
 *   1. Capture button (`open-camera-btn`) uses the `bg-primary-container`
 *      design token — NOT a raw color or the deprecated `bg-honey-deep`.
 *      Sentinel: presence of the Tailwind class on the rendered element.
 *   2. While the live camera is active, body[data-scanning='true'] is
 *      set, which causes globals.css §scanner block to hide the bottom
 *      nav. We can't reliably trigger getUserMedia in CI (permissions),
 *      so we simulate by setting the dataset attribute and asserting the
 *      nav becomes hidden.
 *
 * If either invariant breaks, the chrome on /scan goes off-token and the
 * thumb-zone assumption (`viewfinder owns full safe area`) is broken
 * silently — exactly the kind of regression a feel-test misses.
 *
 * Requires: NEXT_PUBLIC_SKIP_AUTH=true + OCR_ENABLED feature flag on for
 * the dev user. If the page renders the FeatureGated stub, both tests
 * skip with an explicit reason so this isn't silently green.
 */

test.describe('Phase 9a scan — token + bottom-nav regression', () => {
  test('capture button uses bg-primary-container token', async ({ page }) => {
    await page.goto('/scan');

    // If OCR_ENABLED is off, the FeatureGated stub renders instead of
    // the camera-capture component. Skip explicitly so the test reports
    // its own non-applicability rather than silently passing.
    const captureBtn = page.locator('[data-testid="open-camera-btn"]');
    const isPresent = await captureBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    test.skip(
      !isPresent,
      'OCR_ENABLED feature flag is off for dev user — capture button not rendered',
    );

    const cls = await captureBtn.getAttribute('class');
    expect(cls).toBeTruthy();
    expect(cls!.split(/\s+/)).toContain('bg-primary-container');
  });

  test('body[data-scanning="true"] hides bottom-nav via globals.css', async ({
    page,
  }) => {
    // Use a route that always renders the bottom nav so we can assert
    // the suppression behavior without depending on getUserMedia.
    await page.goto('/dashboard');

    const bottomNav = page.locator('[data-testid="bottom-nav"]');
    await expect(bottomNav).toBeVisible({ timeout: 8_000 });

    // Flip the body dataset attribute the way camera-capture.tsx does.
    await page.evaluate(() => {
      document.body.dataset.scanning = 'true';
    });

    // globals.css §scanner: `body[data-scanning='true'] nav[data-testid='bottom-nav']`
    // must apply display:none (or equivalent visibility:hidden / pointer-events:none).
    // Assert the nav is no longer visible to the user.
    await expect(bottomNav).toBeHidden();

    // Cleanup so subsequent tests in the same context aren't affected.
    await page.evaluate(() => {
      delete document.body.dataset.scanning;
    });
    await expect(bottomNav).toBeVisible();
  });
});
