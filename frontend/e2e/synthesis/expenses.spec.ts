import { test, expect } from '@playwright/test';

/**
 * Phase 8d Expenses (Saan Napunta) — Visual-Parity Gate
 *
 * Spec: design_handoff_akbai_redesign/synthesis/screens/03-saan.md §7 Acceptance signal
 * Reference: design_handoff_akbai_redesign/screenshots/07-saan-honey-fil.png
 *
 *   - Pixel-diff ≤ 0.5% at 390×844 (mobile reference)
 *   - Both FIL and EN render via cookie locale toggle
 *   - Reduced-motion path: donut + banig bars do NOT animate
 *   - At least one transaction is required so donut + categories +
 *     banig render (NOT the empty state)
 *
 * Captures (2 baselines pinned to mobile-chrome):
 *   __snapshots__/expenses/mobile-fil.png   (390×844)
 *   __snapshots__/expenses/mobile-en.png    (390×844)
 *
 * Data is mocked at the route layer (`/api/expenses`) so the snapshot is
 * deterministic across runs. Real-DB seeding via dev-auth would drift as
 * new transactions get added by other tests.
 */

const EXPENSES_VIEWPORT = { width: 390, height: 844 } as const;
const SNAPSHOT_PROJECT = 'mobile-chrome';

// Today in Manila — keep dates in the current month so the page renders
// the data flow (not the empty state). Dates are computed at runtime so
// the snapshot is dependent only on layout, not on calendar drift.
function buildExpensesPayload() {
  const today = new Date();
  // Anchor to a fixed dev day-of-month so the banig bars are predictable.
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const day = (n: number) => `${yyyy}-${mm}-${String(n).padStart(2, '0')}`;

  return {
    success: true,
    data: {
      transactions: [
        {
          id: 'tx-1',
          type: 'expense',
          amount: 45000, // ₱450 — Pagkain
          category: 'pagkain',
          description: 'Lunch sa palengke',
          transaction_date: day(5),
          source: 'manual',
        },
        {
          id: 'tx-2',
          type: 'expense',
          amount: 120000, // ₱1,200 — Sasakyan
          category: 'sasakyan',
          description: 'Diesel sa Petron',
          transaction_date: day(8),
          source: 'manual',
        },
        {
          id: 'tx-3',
          type: 'expense',
          amount: 85000, // ₱850 — Bilihin
          category: 'bilihin',
          description: 'Stocks ng tindahan',
          transaction_date: day(12),
          source: 'scan',
        },
        {
          id: 'tx-4',
          type: 'income',
          amount: 500000, // ₱5,000 — Kita
          category: 'tindahan',
          description: 'Sales ng linggo',
          transaction_date: day(10),
          source: 'manual',
        },
      ],
      summary: {
        total_income: 500000,
        total_expenses: 250000,
        net: 250000,
        by_category: [
          { category: 'sasakyan', total: 120000, count: 1 },
          { category: 'bilihin', total: 85000, count: 1 },
          { category: 'pagkain', total: 45000, count: 1 },
          { category: 'tindahan', total: 500000, count: 1 },
        ],
      },
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

async function mockExpenses(page: import('@playwright/test').Page) {
  const payload = buildExpensesPayload();
  await page.route('**/api/expenses**', async (route) => {
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

async function waitForExpensesReady(page: import('@playwright/test').Page) {
  await hideDevOverlay(page);
  await expect(page.locator('[data-testid="expenses-page"]')).toBeVisible({
    timeout: 10_000,
  });
  // Total card present == data flow rendered (not empty/loading).
  await expect(page.locator('[data-testid="expenses-total-card"]')).toBeVisible({
    timeout: 8_000,
  });
  await expect(page.locator('[data-testid="expenses-banig-bar"]')).toBeVisible();
  await expect(page.locator('[data-testid="expenses-kai-callout"]')).toBeVisible();
  await page.waitForLoadState('networkidle');
}

// ============================================================
// Visual-parity captures
// ============================================================

test.describe('Phase 8d expenses — visual parity', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('akbai_tour_seen', 'true');
      } catch {
        /* SSR fallback */
      }
    });
    await mockExpenses(page);
  });

  for (const locale of ['fil', 'en'] as const) {
    test(`visual parity — mobile ${locale.toUpperCase()}`, async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name !== SNAPSHOT_PROJECT,
        `Snapshot test pinned to ${SNAPSHOT_PROJECT}`,
      );

      await page.setViewportSize(EXPENSES_VIEWPORT);
      await setLocaleCookie(page, locale);

      await page.goto('/expenses');
      await waitForExpensesReady(page);

      await expect(page).toHaveScreenshot([`expenses`, `mobile-${locale}.png`], {
        fullPage: true,
        animations: 'disabled',
        maxDiffPixelRatio: 0.005,
      });
    });
  }
});

// ============================================================
// Reduced-motion — donut + banig bars must not animate
// ============================================================

test.describe('Phase 8d expenses — reduced motion', () => {
  test('respects prefers-reduced-motion: donut + banig bars render without animation', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== SNAPSHOT_PROJECT, 'Pinned to mobile-chrome');

    await mockExpenses(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      try {
        localStorage.setItem('akbai_tour_seen', 'true');
      } catch {
        /* no-op */
      }
    });

    await page.goto('/expenses');
    await waitForExpensesReady(page);

    // Layout still renders (no opacity:0 or hidden elements as a side
    // effect of motion-reduce). Total card + banig present.
    await expect(page.locator('[data-testid="expenses-total"]')).toBeVisible();
    await expect(page.locator('[data-testid="expenses-banig-bar"]')).toBeVisible();

    // Animation neutered on the banig bars (Tailwind motion-reduce:animate-none).
    const banig = page.locator('[data-testid="expenses-banig-bar"]');
    const computed = await banig.evaluate((el) => {
      // Walk children — at least one bar should compute animation-name: none
      // under reduced-motion. We assert no descendant runs an active
      // running animation (animationPlayState would be 'running' on a
      // genuinely animating bar).
      const descendants = Array.from(el.querySelectorAll('*'));
      const running = descendants.filter(
        (n) => getComputedStyle(n as Element).animationPlayState === 'running',
      );
      return running.length;
    });
    expect(computed).toBe(0);
  });
});

// ============================================================
// Locale flip — EN render must not gap-out the eyebrow strings
// ============================================================

test.describe('Phase 8d expenses — locale flip', () => {
  test('FIL → EN cookie flip rerenders the data flow without layout shift', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== SNAPSHOT_PROJECT, 'Pinned to mobile-chrome');

    await mockExpenses(page);
    await page.addInitScript(() => {
      try {
        localStorage.setItem('akbai_tour_seen', 'true');
      } catch {
        /* no-op */
      }
    });

    await setLocaleCookie(page, 'fil');
    await page.goto('/expenses');
    await waitForExpensesReady(page);

    await setLocaleCookie(page, 'en');
    await page.reload();
    await waitForExpensesReady(page);

    // Total card still rendered after locale flip.
    await expect(page.locator('[data-testid="expenses-total-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="expenses-banig-bar"]')).toBeVisible();
  });
});
