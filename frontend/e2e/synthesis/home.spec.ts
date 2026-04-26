import { test, expect } from '@playwright/test';

/**
 * Phase 7 Home — Visual-Parity Gate (deferred from Phase 4 retro)
 *
 * Spec: design_handoff_akbai_redesign/synthesis/screens/00-home.md §7 Acceptance signal
 *   - Pixel-diff ≤ 0.5% at 390×844 (mobile reference: handoff PNG adapted to cream bg)
 *   - Both FIL and EN render via cookie locale toggle
 *   - Reduced-motion path: layout identical, animations absent
 *   - First-visit petals deferral: static IconSampaguita decorations only
 *
 * Captures (4 baselines):
 *   __snapshots__/home/mobile-fil.png   (390×844)
 *   __snapshots__/home/mobile-en.png    (390×844)
 *   __snapshots__/home/desktop-fil.png  (1280×800)
 *   __snapshots__/home/desktop-en.png   (1280×800)
 *
 * On first run Playwright stores baselines automatically. Subsequent runs
 * fail if maxDiffPixelRatio > 0.005. The cream-bg adapted reference is not
 * yet committed — this test self-checks until the design team commits one.
 *
 * Requires NEXT_PUBLIC_SKIP_AUTH=true (already set in playwright.config.ts).
 *
 * NOTE on Playwright project matrix: this file pins explicit viewports inside
 * each test via page.setViewportSize, so the same test produces consistent
 * captures regardless of which project (`mobile-chrome` / `desktop-chrome`)
 * the harness happens to run it under. To avoid double captures we pin to
 * the `mobile-chrome` project for the viewport-explicit tests; the
 * locale-flip + reduced-motion + petals tests run on both projects (they
 * don't write snapshots).
 */

const HOME_VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1280, height: 800 },
} as const;

// Pin the screenshot tests to a single project so we don't snapshot twice.
const SNAPSHOT_PROJECT = 'mobile-chrome';

/**
 * Hide the Next.js dev error overlay so it can't intercept page locators.
 * Pre-existing dev console warning from src/app/layout.tsx:103 (script tag
 * in React component) keeps re-mounting an overlay that visually obscures
 * the dashboard. This is a baseline dev-mode issue, NOT a Phase 7 regression
 * — but the visual-parity gate has to render the page anyway, so we
 * inject CSS to hide the dev overlay portal entirely. The fix-source is
 * tracked separately (replace `<script>` with `next/script`).
 */
async function hideDevOverlay(page: import('@playwright/test').Page) {
  await page.addStyleTag({
    content: `
      nextjs-portal,
      [data-nextjs-dialog-overlay],
      [data-nextjs-dialog],
      [data-nextjs-toast] { display: none !important; visibility: hidden !important; }
    `,
  }).catch(() => {});
}

/**
 * Wait for the home page to be paint-stable: dashboard testid present, both
 * data-fetching components have settled, and the network is idle.
 */
async function waitForHomeReady(page: import('@playwright/test').Page) {
  await hideDevOverlay(page);
  await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-testid="kumustahan-hero"]')).toBeVisible({ timeout: 5_000 });

  // Wait for the Kuwento card to leave its loading skeleton — it lands as
  // either `kuwento-card` (data) or `kuwento-card-empty` (no_data / error).
  // Either is a valid stable state for the snapshot.
  await page.waitForFunction(
    () =>
      Boolean(
        document.querySelector('[data-testid="kuwento-card"]') ||
          document.querySelector('[data-testid="kuwento-card-empty"]'),
      ),
    null,
    { timeout: 8_000 },
  );

  await page.waitForLoadState('networkidle');
}

/**
 * Set the next-intl locale cookie BEFORE the first navigation so the SSR
 * render uses the requested locale. Setting via page.context().addCookies()
 * works for the playwright/test runner because the dev server reads the
 * cookie on the server side via getRequestConfig().
 */
async function setLocaleCookie(
  page: import('@playwright/test').Page,
  locale: 'fil' | 'en',
) {
  await page.context().addCookies([
    {
      name: 'NEXT_LOCALE',
      value: locale,
      url: 'http://localhost:3000',
    },
  ]);
}

// ============================================================
// Visual-parity captures (the actual home gate)
// ============================================================

test.describe('Phase 7 home — visual parity', () => {
  test.beforeEach(async ({ page }) => {
    // Bypass the welcome tour so the hero is the first thing on the page.
    await page.addInitScript(() => {
      try {
        localStorage.setItem('akbai_tour_seen', 'true');
        // Mark the home as already-visited twice so the static petals layer
        // is the active mode (predictable across captures). Day-0 vs day-2
        // visual is exercised separately below.
        localStorage.setItem('akbai_home_visit_count', '2');
      } catch {
        /* SSR fallback */
      }
    });
  });

  for (const locale of ['fil', 'en'] as const) {
    for (const [vpName, viewport] of Object.entries(HOME_VIEWPORTS) as Array<
      ['mobile' | 'desktop', { width: number; height: number }]
    >) {
      test(`visual parity — ${vpName} ${locale.toUpperCase()}`, async ({ page }, testInfo) => {
        // Run only under one project to keep snapshot counts stable.
        test.skip(
          testInfo.project.name !== SNAPSHOT_PROJECT,
          `Snapshot test pinned to ${SNAPSHOT_PROJECT}`,
        );

        await page.setViewportSize(viewport);
        await setLocaleCookie(page, locale);

        await page.goto('/dashboard');
        await waitForHomeReady(page);

        // Snapshot path:
        //   __snapshots__/home/<vp>-<locale>.png
        // animations:'disabled' neutralises kai-breathe / petal-drift / squiggle
        // hover; the home gate is layout/typography parity, not motion parity.
        await expect(page).toHaveScreenshot([`home`, `${vpName}-${locale}.png`], {
          fullPage: true,
          animations: 'disabled',
          maxDiffPixelRatio: 0.005, // 0.5% per spec §7
        });
      });
    }
  }
});

// ============================================================
// First-visit petals deferral (Q2 — static day 0, animated day 2+)
// ============================================================

test.describe('Phase 7 home — petals deferral (Q2)', () => {
  test('first visit renders static IconSampaguita decorations, not animated FloatingPetals', async ({
    page,
  }, testInfo) => {
    // Pin to mobile-chrome so we only assert this once; the gating logic is
    // viewport-independent.
    test.skip(testInfo.project.name !== SNAPSHOT_PROJECT, 'Pinned to mobile-chrome');

    // Cold load: clear the visit counter so the first useEffect bumps it from 0→1
    // (still < 2 — static petals must render).
    await page.addInitScript(() => {
      try {
        localStorage.setItem('akbai_tour_seen', 'true');
        localStorage.removeItem('akbai_home_visit_count');
      } catch {
        /* no-op */
      }
    });

    await page.goto('/dashboard');
    await waitForHomeReady(page);

    // Static petals layer present (testid wired in floating-petals-layer.tsx).
    await expect(page.locator('[data-testid="static-sampaguita-decor"]')).toBeVisible();

    // Visit counter bumped from 0 → 1 by the cold-load useEffect.
    const count = await page.evaluate(() =>
      Number(localStorage.getItem('akbai_home_visit_count') ?? '0'),
    );
    expect(count).toBe(1);
  });

  test('second visit swaps in animated FloatingPetals (no static decor)', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== SNAPSHOT_PROJECT, 'Pinned to mobile-chrome');

    // Pre-seed visit count to 2 so the layer flips to animated on this load.
    await page.addInitScript(() => {
      try {
        localStorage.setItem('akbai_tour_seen', 'true');
        localStorage.setItem('akbai_home_visit_count', '2');
      } catch {
        /* no-op */
      }
    });

    await page.goto('/dashboard');
    await waitForHomeReady(page);

    // Static layer must NOT be present once we cross the visit threshold.
    await expect(page.locator('[data-testid="static-sampaguita-decor"]')).toBeHidden();
  });
});

// ============================================================
// Reduced-motion path — static layer rendered, layout identical
// ============================================================

test.describe('Phase 7 home — reduced motion', () => {
  test('respects prefers-reduced-motion: animated petals never render', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== SNAPSHOT_PROJECT, 'Pinned to mobile-chrome');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      try {
        localStorage.setItem('akbai_tour_seen', 'true');
        // Force the visit counter past the threshold — but reduced-motion
        // must still keep us on the static layer.
        localStorage.setItem('akbai_home_visit_count', '5');
      } catch {
        /* no-op */
      }
    });

    await page.goto('/dashboard');
    await waitForHomeReady(page);

    await expect(page.locator('[data-testid="static-sampaguita-decor"]')).toBeVisible();
  });
});

// ============================================================
// Locale flip — first end-to-end home-locale proof per the spec
// ============================================================

test.describe('Phase 7 home — locale flip end-to-end', () => {
  test('FIL → EN swap re-renders the kumustahan greeting pill copy', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== SNAPSHOT_PROJECT, 'Pinned to mobile-chrome');

    await page.addInitScript(() => {
      try {
        localStorage.setItem('akbai_tour_seen', 'true');
        localStorage.setItem('akbai_home_visit_count', '2');
      } catch {
        /* no-op */
      }
    });

    await setLocaleCookie(page, 'fil');
    await page.goto('/dashboard');
    await waitForHomeReady(page);

    const filGreeting = await page
      .locator('[data-testid="kumustahan-greeting-pill"]')
      .textContent();
    expect(filGreeting).toBeTruthy();
    const filQuestion = await page
      .locator('[data-testid="kumustahan-question"]')
      .textContent();
    // FIL: "kumusta ka?"
    expect(filQuestion?.toLowerCase()).toContain('kumusta');

    // The language toggle lives in the More drawer on mobile chrome (Phase 5).
    // Open the drawer first. The bottom nav is hidden at >=860px via
    // `tablet:hidden`; this test runs under mobile-chrome (Pixel 5, 393w),
    // so the drawer trigger is visible.
    // The sidebar also renders the toggle (hidden via Tailwind `tablet:` breakpoint
    // on mobile, but still in the DOM). Scope to the drawer to avoid strict-mode
    // duplicate-element violations.
    const moreTab = page.locator('[data-testid="nav-more"]');
    if (await moreTab.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await moreTab.click();
    }

    const enPill = page
      .getByTestId('more-drawer-content')
      .getByTestId('lang-en');
    await expect(enPill).toBeVisible({ timeout: 5_000 });
    await enPill.click();

    // The locale switch triggers a server action + transition; wait for the
    // greeting pill to re-render in EN. The EN messages set has
    // greeting.morning="Good morning" / .afternoon="Good afternoon" /
    // .evening="Good evening" — the substring "Good" is unique vs FIL's
    // "Magandang", so we assert the FIL string is gone.
    await expect
      .poll(
        async () => {
          const txt = await page
            .locator('[data-testid="kumustahan-question"]')
            .textContent();
          return txt?.toLowerCase() ?? '';
        },
        { timeout: 8_000, message: 'kumustahan-question never re-rendered in EN' },
      )
      .toContain('how are you');
  });
});
