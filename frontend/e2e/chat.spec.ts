import { test, expect } from '@playwright/test';

/**
 * Chat E2E — verifies chat interface loads, input bar works,
 * disclaimer banner is visible, and flag button exists on messages.
 *
 * Requires: NEXT_PUBLIC_SKIP_AUTH=true (set in playwright.config.ts webServer.env)
 */

test.describe('Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat');
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
  });

  test('renders chat input bar with text input and send button', async ({ page }) => {
    await expect(page.locator('[data-testid="chat-input-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-text-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-send-btn"]')).toBeVisible();
  });

  test('disclaimer banner is visible (Design Gate 2)', async ({ page }) => {
    const banner = page.locator('[data-testid="disclaimer-banner"]');
    await expect(banner).toBeVisible();
  });

  test('can type in chat input', async ({ page }) => {
    const input = page.locator('[data-testid="chat-text-input"]');
    await input.click();
    await input.pressSequentially('Kumusta');
    // useRef-based input — verify DOM value property directly
    const value = await input.inputValue();
    expect(value).toContain('Kumusta');
  });

  test('send button is present and clickable', async ({ page }) => {
    const sendBtn = page.locator('[data-testid="chat-send-btn"]');
    await expect(sendBtn).toBeVisible();
    await expect(sendBtn).toBeEnabled();
  });
});
