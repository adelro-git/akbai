import { test } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Phase 2.1 — Visual comparison harness
 *
 * Captures full-page screenshots of the current AKBai app at each in-scope
 * route, at both mobile (Pixel 5) and desktop (Chrome) viewports. The captures
 * land under `design_handoff_akbai_redesign/synthesis/screenshots/<screen>/`
 * and get paired against the handoff PNGs in `design_handoff_akbai_redesign/screenshots/`
 * by `design_handoff_akbai_redesign/synthesis/build-report.mjs`.
 *
 * Run:
 *   npm run test:e2e -- e2e/synthesis/compare.spec.ts
 *
 * Output:
 *   design_handoff_akbai_redesign/synthesis/screenshots/<screen>/current-<viewport>.png
 *
 * Requires:
 *   NEXT_PUBLIC_SKIP_AUTH=true (already set in playwright.config.ts webServer.env)
 */

type Screen = {
  name: string;
  route: string;
  waitFor?: string;
  setupSteps?: string[];
};

const SCREENS: Screen[] = [
  { name: '00-home', route: '/dashboard', waitFor: '[data-testid="dashboard-page"]' },
  { name: '01-chat', route: '/chat' }, // no page testid — falls back to networkidle
  { name: '02-expenses', route: '/expenses', waitFor: '[data-testid="expenses-page"]' },
  { name: '03-scan', route: '/scan' }, // camera page — capture initial state only
  { name: '04-deadlines', route: '/deadlines', waitFor: '[data-testid="deadlines-page"]' },
  { name: '05-costing', route: '/costing', waitFor: '[data-testid="costing-page"]' },
  { name: '06-invoices', route: '/invoices', waitFor: '[data-testid="invoices-page"]' },
  { name: '07-profile', route: '/profile', waitFor: '[data-testid="profile-page"]' },
];

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const OUTPUT_DIR = path.join(
  REPO_ROOT,
  'design_handoff_akbai_redesign',
  'synthesis',
  'screenshots',
);

test.describe('Phase 2.1 visual capture (current app)', () => {
  test.beforeEach(async ({ page }) => {
    // Skip welcome tour and any first-run modals so the page is stable for capture.
    await page.addInitScript(() => {
      try {
        localStorage.setItem('akbai_tour_seen', 'true');
      } catch {
        // SSR contexts can't access localStorage; safe to ignore.
      }
    });
  });

  for (const screen of SCREENS) {
    test(`capture ${screen.name} (${screen.route})`, async ({ page }, testInfo) => {
      await page.goto(screen.route);

      if (screen.waitFor) {
        try {
          await page.waitForSelector(screen.waitFor, { timeout: 8000 });
        } catch {
          // If the test-id never appears, fall back to network idle so we still capture *something*.
          await page.waitForLoadState('networkidle');
        }
      } else {
        await page.waitForLoadState('networkidle');
      }

      // Settle ambient animations (Kai bob, fade-ins). Reduces visual noise across runs.
      await page.waitForTimeout(800);

      const viewportLabel = testInfo.project.name; // 'mobile-chrome' | 'desktop-chrome'
      const dir = path.join(OUTPUT_DIR, screen.name);
      fs.mkdirSync(dir, { recursive: true });

      await page.screenshot({
        path: path.join(dir, `current-${viewportLabel}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
});
