import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config for AKBai
 *
 * Mobile-first: Pixel 5 is the primary target (Filipino MSMEs on Android).
 * Desktop Chromium as secondary. No Safari/Firefox for now — single founder.
 *
 * Run: npx playwright test
 * UI:  npx playwright test --ui
 * Debug: npx playwright test --debug
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Primary: Mobile Android (Pixel 5) — target audience device
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    // Secondary: Desktop Chromium
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Auto-start dev server for local runs
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
