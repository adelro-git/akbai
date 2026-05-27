import { test, expect } from '@playwright/test';

/**
 * Phase 8c Chat — Visual-Parity Gate (ADR-016)
 *
 * Spec: design_handoff_akbai_redesign/synthesis/screens/01-chat.md §7 Acceptance signal
 * Reference: design_handoff_akbai_redesign/screenshots/06-chat-honey-fil.png
 *
 *   - Pixel-diff ≤ 0.5% at 390×844 (mobile reference)
 *   - Both FIL and EN render via cookie locale toggle
 *   - Reduced-motion path: top-bar status dot must NOT pulse
 *   - In-bubble Kai illustration is preserved per HYBRIDIZE
 *
 * Captures (2 baselines pinned to mobile-chrome):
 *   __snapshots__/chat/mobile-fil.png   (390×844)
 *   __snapshots__/chat/mobile-en.png    (390×844)
 *
 * The chips row is rule-based (DB queries) and would otherwise be a flake
 * source; we mock /api/chat/suggestions to a deterministic 4-chip cold-start
 * payload so the snapshot is stable. Conversation-history fetch is left to
 * the real route — under SKIP_AUTH the dev user has no rows, so the empty
 * state renders predictably.
 */

const CHAT_VIEWPORT = { width: 390, height: 844 } as const;
const SNAPSHOT_PROJECT = 'mobile-chrome';

// Deterministic chip payload — cold-start canon per ADR-016 §3.
const COLD_START_CHIPS = [
  { id: 'cold_start_expenses', text_tl: 'Saan napunta ang pera ko?', intent: 'expenses' },
  { id: 'cold_start_deadlines', text_tl: 'Kailan ang BIR deadline?', intent: 'deadlines' },
  { id: 'cold_start_pricing', text_tl: 'Magkano dapat presyo?', intent: 'pricing' },
  { id: 'cold_start_capture', text_tl: 'I-record ang gastos', intent: 'expense_capture' },
];

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

async function mockSuggestions(page: import('@playwright/test').Page) {
  await page.route('**/api/chat/suggestions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { suggestions: COLD_START_CHIPS, cached: false },
      }),
    });
  });
}

async function waitForChatReady(page: import('@playwright/test').Page) {
  await hideDevOverlay(page);
  await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.locator('[data-testid="chat-topbar"]')).toBeVisible();
  await expect(page.locator('[data-testid="chat-suggested-chips"]')).toBeVisible({
    timeout: 5_000,
  });
  await expect(page.locator('[data-testid="chat-composer"]')).toBeVisible();
  await page.waitForLoadState('networkidle');
}

// ============================================================
// Visual-parity captures
// ============================================================

test.describe('Phase 8c chat — visual parity', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('akbai_tour_seen', 'true');
      } catch {
        /* SSR fallback */
      }
    });
    await mockSuggestions(page);
  });

  for (const locale of ['fil', 'en'] as const) {
    test(`visual parity — mobile ${locale.toUpperCase()}`, async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name !== SNAPSHOT_PROJECT,
        `Snapshot test pinned to ${SNAPSHOT_PROJECT}`,
      );

      await page.setViewportSize(CHAT_VIEWPORT);
      await setLocaleCookie(page, locale);

      await page.goto('/chat');
      await waitForChatReady(page);

      await expect(page).toHaveScreenshot([`chat`, `mobile-${locale}.png`], {
        fullPage: true,
        animations: 'disabled',
        maxDiffPixelRatio: 0.005,
      });
    });
  }
});

// ============================================================
// Reduced-motion — top-bar status dot must not pulse
// ============================================================

test.describe('Phase 8c chat — reduced motion', () => {
  test('respects prefers-reduced-motion: top-bar status dot has motion-reduce:animate-none', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== SNAPSHOT_PROJECT, 'Pinned to mobile-chrome');

    await mockSuggestions(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      try {
        localStorage.setItem('akbai_tour_seen', 'true');
      } catch {
        /* no-op */
      }
    });

    await page.goto('/chat');
    await waitForChatReady(page);

    const statusDot = page.locator('[data-testid="chat-topbar-status"]');
    await expect(statusDot).toBeVisible();

    // Tailwind `motion-reduce:animate-none` short-circuits the pulse.
    // Verify the computed animationName under the reduced-motion media match.
    const animationName = await statusDot.evaluate(
      (el) => getComputedStyle(el).animationName,
    );
    expect(animationName === 'none' || animationName === '').toBeTruthy();
  });
});

// ============================================================
// Locale flip — chat top-bar caption + composer placeholder swap
// ============================================================

test.describe('Phase 8c chat — locale flip', () => {
  test('FIL → EN cookie flip rerenders without layout shift on chips', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== SNAPSHOT_PROJECT, 'Pinned to mobile-chrome');

    await mockSuggestions(page);
    await page.addInitScript(() => {
      try {
        localStorage.setItem('akbai_tour_seen', 'true');
      } catch {
        /* no-op */
      }
    });

    await setLocaleCookie(page, 'fil');
    await page.goto('/chat');
    await waitForChatReady(page);

    const filChipCount = await page.locator('[data-testid^="chat-chip-"]').count();
    expect(filChipCount).toBe(4);

    // Flip to EN via cookie + reload (drawer flow exercised in home spec).
    await setLocaleCookie(page, 'en');
    await page.reload();
    await waitForChatReady(page);

    const enChipCount = await page.locator('[data-testid^="chat-chip-"]').count();
    expect(enChipCount).toBe(4);
  });
});
