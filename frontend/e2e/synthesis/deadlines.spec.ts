import { test, expect } from '@playwright/test';

/**
 * Phase 9b Deadlines — Visual-Parity Gate
 *
 * Spec: design_handoff_akbai_redesign/synthesis/screens/04-deadlines.md §7
 * Reference: design_handoff_akbai_redesign/screenshots/09-deadlines-honey-fil.png
 *
 *   - Pixel-diff ≤ 0.5% at 390×844 (mobile reference)
 *   - Both FIL and EN render via cookie locale toggle
 *   - Reduced-motion path: skeleton placeholders do NOT pulse
 *   - At least one deadline ≤ 7 days seeded so the Kai pre-deadline
 *     callout renders, AND one > 30 days so urgent vs non-urgent rows
 *     are both in frame
 *
 * Captures (2 baselines pinned to mobile-chrome):
 *   __snapshots__/deadlines/mobile-fil.png   (390×844)
 *   __snapshots__/deadlines/mobile-en.png    (390×844)
 *
 * Mock matches the GET /api/deadlines DeadlineWithUrgency contract from
 * src/lib/deadlines/types.ts.
 */

const DEADLINES_VIEWPORT = { width: 390, height: 844 } as const;
const SNAPSHOT_PROJECT = 'mobile-chrome';

// Build a 2-deadline payload: one ≤ 7 days (urgent) so the Kai callout
// renders, one > 30 days (non-urgent) so both row tones are in frame.
function buildDeadlinesPayload() {
  const today = new Date();
  const isoDay = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  };

  return {
    success: true,
    data: {
      deadlines: [
        {
          id: 'dl-urgent-1',
          user_id: '00000000-0000-0000-0000-000000000000',
          form_name: '2551Q',
          due_date: isoDay(5),
          description: 'Quarterly Percentage Tax Return',
          status: 'upcoming',
          notified_7d: false,
          notified_3d: false,
          notified_1d: false,
          created_at: today.toISOString(),
          updated_at: today.toISOString(),
          urgency: 'urgent',
          days_until: 5,
        },
        {
          id: 'dl-future-1',
          user_id: '00000000-0000-0000-0000-000000000000',
          form_name: '1701Q',
          due_date: isoDay(45),
          description: 'Quarterly Income Tax Return',
          status: 'upcoming',
          notified_7d: false,
          notified_3d: false,
          notified_1d: false,
          created_at: today.toISOString(),
          updated_at: today.toISOString(),
          urgency: 'normal',
          days_until: 45,
        },
      ],
    },
  };
}

async function hideDevOverlay(page: import('@playwright/test').Page) {
  await page
    .addStyleTag({
      content: `
        nextjs-portal,
        [data-nextjs-dialog-overlay],
        [data-nextjs-dialog],
        [data-nextjs-toast] { display: none !important; visibility: hidden !important; }
      `,
    })
    .catch(() => {});
}

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

async function mockDeadlines(page: import('@playwright/test').Page) {
  const payload = buildDeadlinesPayload();
  await page.route('**/api/deadlines**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });
    } else {
      await route.continue();
    }
  });
}

async function waitForDeadlinesReady(page: import('@playwright/test').Page) {
  await hideDevOverlay(page);
  await expect(page.locator('[data-testid="deadlines-page"]')).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.locator('[data-testid="deadline-list"]')).toBeVisible({
    timeout: 8_000,
  });
  // Kai callout renders only when ≤7 day deadline is in the seed — verify
  // it's there so the snapshot includes it.
  await expect(page.locator('[data-testid="deadlines-kai-callout"]')).toBeVisible();
  await page.waitForLoadState('networkidle');
}

// ============================================================
// Visual-parity captures
// ============================================================

test.describe('Phase 9b deadlines — visual parity', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('akbai_tour_seen', 'true');
      } catch {
        /* SSR fallback */
      }
    });
    await mockDeadlines(page);
  });

  for (const locale of ['fil', 'en'] as const) {
    test(`visual parity — mobile ${locale.toUpperCase()}`, async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name !== SNAPSHOT_PROJECT,
        `Snapshot test pinned to ${SNAPSHOT_PROJECT}`,
      );

      await page.setViewportSize(DEADLINES_VIEWPORT);
      await setLocaleCookie(page, locale);

      await page.goto('/deadlines');
      await waitForDeadlinesReady(page);

      await expect(page).toHaveScreenshot([`deadlines`, `mobile-${locale}.png`], {
        fullPage: true,
        animations: 'disabled',
        maxDiffPixelRatio: 0.005,
      });
    });
  }
});

// ============================================================
// Reduced-motion — loading skeleton placeholders must not pulse
// ============================================================

test.describe('Phase 9b deadlines — reduced motion', () => {
  test('respects prefers-reduced-motion on loading skeleton', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== SNAPSHOT_PROJECT, 'Pinned to mobile-chrome');

    // Delay the deadlines fetch slightly so the skeleton actually renders
    // long enough to inspect.
    await page.route('**/api/deadlines**', async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildDeadlinesPayload()),
      });
    });

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      try {
        localStorage.setItem('akbai_tour_seen', 'true');
      } catch {
        /* no-op */
      }
    });

    await page.goto('/deadlines');
    // Catch the skeleton mid-flight.
    const skeleton = page.locator('[data-testid="deadline-loading"]');
    await expect(skeleton).toBeVisible({ timeout: 1_000 });

    // motion-reduce:animate-none short-circuits animate-pulse on bars.
    const animationName = await skeleton.evaluate((el) => {
      const first = el.querySelector('div');
      return first ? getComputedStyle(first).animationName : 'none';
    });
    expect(animationName === 'none' || animationName === '').toBeTruthy();

    // Then settle.
    await waitForDeadlinesReady(page);
  });
});

// ============================================================
// Locale flip — EN render must not gap out form-name labels
// ============================================================

test.describe('Phase 9b deadlines — locale flip', () => {
  test('FIL → EN cookie flip rerenders the deadline list', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== SNAPSHOT_PROJECT, 'Pinned to mobile-chrome');

    await mockDeadlines(page);
    await page.addInitScript(() => {
      try {
        localStorage.setItem('akbai_tour_seen', 'true');
      } catch {
        /* no-op */
      }
    });

    await setLocaleCookie(page, 'fil');
    await page.goto('/deadlines');
    await waitForDeadlinesReady(page);

    await setLocaleCookie(page, 'en');
    await page.reload();
    await waitForDeadlinesReady(page);

    await expect(page.locator('[data-testid="deadline-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="deadlines-kai-callout"]')).toBeVisible();
  });
});
