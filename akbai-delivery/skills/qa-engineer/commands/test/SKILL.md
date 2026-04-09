---
name: "test"
description: >
  Generate test suite for specified feature. Covers unit tests (Jest) for business logic and Zod schemas,
  integration tests for API routes with Supabase mocking, and E2E tests (Playwright) for user flows.
  AI-specific tests include prompt regression, guardrail triggers, and confidence thresholds.
  Philippine-context test data: ₱ amounts, Filipino names, conversational Filipino strings, GCash screenshots, thermal receipts.
  Trigger on "/test [scope]" where scope is feature name and test types needed (unit/integration/e2e or all).
---

# /test Command — QA Engineer

You generate comprehensive test suites for AKBai features. When the user requests `/test [feature-name]`, you create unit, integration, and E2E test files covering both happy paths and edge cases relevant to Filipino MSMEs.

## Before Starting

Read the shared context files:
- `/AKBai/akbai-delivery/shared/project-context.md` — personas (Maria, Jose, Ana, Andoy), product phases, tiers
- `/AKBai/akbai-delivery/shared/tech-stack.md` — Next.js 14, TypeScript strict, Supabase, Zod, testing stack (Jest + Vitest, Playwright)
- `/AKBai/akbai-delivery/shared/glossary.md` — product terms, Filipino business context, BIR, tax concepts
- `/AKBai/akbai-delivery/shared/brand-context.md` — KA voice, conversational Filipino tone for test assertions

Then read the qa-engineer references:
- `references/test-strategy.md` — testing pyramid, coverage targets, test naming conventions
- `references/regression-library.md` — conversational Filipino tone regression tests, prompt consistency tests, AI guardrail test cases
- `references/test-checklist.md` — required test scenarios by feature type (receipt scanning, BIR compliance, chat, payments)

---

## Workflow: /test [feature-name]

### Step 1: Parse Test Scope

Ask the user:
- "What feature are you testing? (e.g., Resibo Scanner, Dashboard, Reply Drafter, Deadline Watcher)"
- "What test types? (unit / integration / e2e / all)"
- "Any specific edge cases you want to ensure are covered?"
- "Is this a Free/Pro/Business tier feature or all tiers?"

### Step 2: Read Feature References

Check the references for:
- `references/test-checklist.md` — what scenarios are required for this feature type
- `references/regression-library.md` — AI-specific test cases (for KA chat/reasoning features)
- `references/test-strategy.md` — coverage targets and naming conventions

Ask the user if they have existing code files to reference (page.tsx, API route, Zod schemas).

### Step 3: Identify Test Scope

Map the feature to test types:

| Feature Type | Unit | Integration | E2E |
|---|---|---|---|
| **Receipt Scanning** (Resibo Scanner) | Zod validation, image compression | Claude Haiku Vision call mocking, Supabase Storage | Camera flow, upload, preview, save |
| **Dashboard / Data Display** (Ang Umaga Mo, Saan Napunta) | Data formatting, calculations | Supabase queries with RLS, cache invalidation | Page load, filters, refresh |
| **KA Chat / Reply Drafting** (Reply Drafter, Dashboard KA) | Zod schemas, tone validation | Claude API mocking, conversation history | Chat input, response display, copy-paste |
| **BIR Compliance** (Deadline Watcher) | Date calculations, timezone (UTC+8) | BIR deadline lookup, notification scheduling | Deadline display, notification triggers |
| **Payments / Subscriptions** | Tier validation, grace period logic | Xendit webhook mocking, subscription state | Payment flow, tier access gates |
| **Onboarding** (Kilala Kita) | Form validation (Zod) | Resume-from-step logic, profile storage | Full 5-step flow, mid-flow drop-in |

### Step 4: Generate Unit Tests (Jest/Vitest)

Create unit test files for:
- **Zod schemas:** Parse/validation logic
- **Utility functions:** Calculations, formatting, date logic
- **Business logic:** Tier checks, grace period logic, deduplication

**File location:** `__tests__/[name].test.ts` (colocated with the code being tested)

**Test template:**

```typescript
import { describe, it, expect } from 'vitest'; // or 'jest'
import { z } from 'zod';

// Example: Testing a Zod schema
describe('TransactionSchema', () => {
  it('should validate a valid transaction', () => {
    const input = {
      amount_centavos: 3450,  // ₱34.50
      date: '2026-03-19T10:30:00Z',
      category: 'supplies',
      description: 'Office supplies',
    };
    const result = TransactionSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount_centavos).toBe(3450);
    }
  });

  it('should reject negative amounts', () => {
    const input = {
      amount_centavos: -500,  // Invalid
      date: '2026-03-19T10:30:00Z',
      category: 'supplies',
      description: 'Office supplies',
    };
    const result = TransactionSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('positive');
    }
  });

  it('should reject missing required fields', () => {
    const input = {
      amount_centavos: 3450,
      // Missing date, category, description
    };
    const result = TransactionSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// Example: Testing a utility function (BIR deadline calculation)
describe('calculateBIRDeadline', () => {
  it('should calculate 1701Q deadline for Q1 (April 15)', () => {
    // Q1 (Jan-Mar) deadline is April 15
    const deadline = calculateBIRDeadline('1701Q', 1);
    expect(deadline.month).toBe(4);
    expect(deadline.day).toBe(15);
  });

  it('should return correct deadline for each quarter', () => {
    expect(calculateBIRDeadline('1701Q', 1).month).toBe(4);  // Q1 → April 15
    expect(calculateBIRDeadline('1701Q', 2).month).toBe(7);  // Q2 → July 15
    expect(calculateBIRDeadline('1701Q', 3).month).toBe(10); // Q3 → October 15
    expect(calculateBIRDeadline('1701Q', 4).month).toBe(1);  // Q4 → Jan 15 next year
  });

  it('should handle timezone correctly (UTC+8)', () => {
    // Deadline should be in UTC+8 (Asia/Manila)
    const deadline = calculateBIRDeadline('1701Q', 1);
    expect(deadline.timezone).toBe('UTC+8');
  });
});

// Example: Testing tier-gating logic
describe('isFeatureAvailableForTier', () => {
  it('should allow Free tier 10 queries per day', () => {
    const available = isFeatureAvailableForTier('text-query', 'Free', 10);
    expect(available).toBe(true);

    const unavailable = isFeatureAvailableForTier('text-query', 'Free', 11);
    expect(unavailable).toBe(false);
  });

  it('should allow Pro tier full feature access', () => {
    const available = isFeatureAvailableForTier('receipt-scanning', 'Pro', 1);
    expect(available).toBe(true);
  });

  it('should deny Free tier receipt scanning', () => {
    const available = isFeatureAvailableForTier('receipt-scanning', 'Free', 1);
    expect(available).toBe(false);
  });
});

// Example: Testing grace period logic
describe('isSubscriptionInGracePeriod', () => {
  it('should return true if within 3 days of failed payment', () => {
    const failedAt = new Date();
    failedAt.setDate(failedAt.getDate() - 1);  // 1 day ago
    expect(isSubscriptionInGracePeriod(failedAt)).toBe(true);
  });

  it('should return false if 4+ days past failed payment', () => {
    const failedAt = new Date();
    failedAt.setDate(failedAt.getDate() - 4);  // 4 days ago
    expect(isSubscriptionInGracePeriod(failedAt)).toBe(false);
  });
});
```

**Best practices:**
- Test name format: "should [behavior] when [condition]"
- Use Arrange/Act/Assert pattern
- Test happy path + all error cases
- Include Philippine-context data (₱ amounts, Filipino names, GCash context)
- No snapshot tests (hard to maintain for financial data)

**Coverage targets:**
- Business logic: 100% (Zod schemas, calculations, tier checks)
- Utilities: 80%+ (formatting, parsing functions)
- Components: 40%+ (complex interactions, not simple renders)

### Step 5: Generate Integration Tests

Create integration test files for:
- **API routes:** POST/GET handlers with mocked Supabase + Claude API
- **Database operations:** RLS policy verification, soft deletes, audit columns
- **Webhook handlers:** Idempotency, state transitions

**File location:** `/app/api/[feature]/__tests__/route.test.ts`

**Test template (using Vitest + Mock Supabase client):**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockSupabaseClient } from '@/lib/supabase/__mocks__';
import { POST } from '../route';

describe('POST /api/resibo', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let mockAnthropicClient: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    mockAnthropicClient = {
      messages: {
        create: vi.fn(),
      },
    };
    vi.stubGlobal('Anthropic', () => mockAnthropicClient);
  });

  it('should return 401 if user not authenticated', async () => {
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null } });

    const request = new Request('http://localhost:3000/api/resibo', {
      method: 'POST',
      body: JSON.stringify({ image: 'base64-image' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json.error.code).toBe('UNAUTHENTICATED');
    expect(json.error.message_tl).toContain('mag-login');
  });

  it('should scan receipt and store in Supabase Storage', async () => {
    const userId = 'user-123';
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: { id: userId } },
    });

    mockAnthropicClient.messages.create.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            merchant: 'SM Supermarket',
            amount: 3450,  // ₱34.50
            items: ['Eggs', 'Milk'],
            date: '2026-03-19',
          }),
        },
      ],
    });

    mockSupabase.storage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: 'receipts/user-123/receipt-1.jpg' } }),
    });

    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: [{ id: 'receipt-1' }], error: null }),
    });

    const request = new Request('http://localhost:3000/api/resibo', {
      method: 'POST',
      body: JSON.stringify({ image: 'base64-image-data' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.merchant).toBe('SM Supermarket');
    expect(json.data.amount_centavos).toBe(3450);
  });

  it('should reject if receipt amount validation fails', async () => {
    const userId = 'user-123';
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: { id: userId } },
    });

    mockAnthropicClient.messages.create.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            merchant: 'SM Supermarket',
            amount: -100,  // Invalid: negative
            items: ['Eggs'],
            date: '2026-03-19',
          }),
        },
      ],
    });

    const request = new Request('http://localhost:3000/api/resibo', {
      method: 'POST',
      body: JSON.stringify({ image: 'base64-image-data' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(json.error.message_tl).toContain('invalid');
  });

  it('should verify RLS scoping: user can only access own receipts', async () => {
    const userId1 = 'user-123';
    const userId2 = 'user-456';

    // RLS policy: SELECT ... WHERE user_id = auth.uid()
    // If user1 tries to read user2's receipt, RLS should block it
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),  // Empty result due to RLS
      }),
    });

    // User1 can read own receipt
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: { id: userId1 } },
    });

    // Result: only user1's receipt returned
    const response = await mockSupabase
      .from('receipts')
      .select('*')
      .eq('user_id', userId1);

    expect(response.data).toEqual([]); // No data due to mocking, but RLS policy prevents cross-user access
  });

  it('should deduplicate receipt: same merchant, amount, date within ±30 min', async () => {
    const userId = 'user-123';
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: { id: userId } },
    });

    // First scan
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'receipt-1',
              merchant: 'SM Supermarket',
              amount_centavos: 3450,
              date: '2026-03-19T10:00:00Z',
            },
          ],
          error: null,
        }),
      }),
    });

    // Second scan (same amount, merchant, within 30 min)
    const isDuplicate = await checkDuplicate({
      merchant: 'SM Supermarket',
      amount_centavos: 3450,
      date: '2026-03-19T10:15:00Z',  // 15 min later
      userId,
    });

    expect(isDuplicate).toBe(true);
  });
});
```

**Best practices:**
- Mock Supabase client and Claude API (don't call real APIs in tests)
- Test RLS enforcement (verify users can't access other users' data)
- Test idempotency (for webhook handlers)
- Test error flows (invalid input, API failures, Supabase errors)
- Test tier gating (Free/Pro/Business access control)

**Coverage targets:** 80%+ of API routes

### Step 6: Generate E2E Tests (Playwright)

Create E2E test files for:
- **User flows:** Full feature from login to completion
- **Edge cases:** Mobile viewport, slow network, offline scenarios
- **Accessibility:** Forms are keyboard-navigable, errors announced

**File location:** `/e2e/[feature].spec.ts`

**Test template:**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Resibo Scanner Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'maria@test.local');
    await page.fill('input[type="password"]', 'test-password-123');
    await page.click('button:has-text("Sign in")');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
  });

  test('should scan a receipt and display extracted data', async ({ page }) => {
    // Navigate to Resibo Scanner
    await page.click('a:has-text("Resibo")');
    await page.waitForURL('**/resibo');

    // Upload receipt image
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('./test-fixtures/receipt-sample.jpg');

    // Wait for scanning animation
    await expect(page.locator('text=Scanning...')).toBeVisible();

    // Wait for scan result
    await page.waitForSelector('[data-testid="receipt-preview"]');

    // Verify extracted data displayed
    await expect(page.locator('text=SM Supermarket')).toBeVisible();
    await expect(page.locator('text=₱34.50')).toBeVisible();
    await expect(page.locator('text=Eggs, Milk')).toBeVisible();

    // Verify edit form shown for confirmation
    const amountInput = await page.locator('input[name="amount"]');
    await expect(amountInput).toHaveValue('3450');  // in centavos
  });

  test('should handle OCR errors gracefully (faded receipt)', async ({ page }) => {
    // Navigate to Resibo Scanner
    await page.click('a:has-text("Resibo")');

    // Upload a poor-quality (faded) receipt
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('./test-fixtures/receipt-faded.jpg');

    // Wait for error state
    await expect(page.locator('text=Hindi ko masyadong naintindihan')).toBeVisible();
    await expect(page.locator('button:has-text("Subukan ulit")')).toBeVisible();

    // User can retry
    await page.click('button:has-text("Subukan ulit")');
    // Should go back to upload state
    await expect(page.locator('input[type="file"]')).toBeVisible();
  });

  test('should deduplicate receipt: show warning if already scanned', async ({ page }) => {
    // Scan a receipt first time
    await page.click('a:has-text("Resibo")');
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('./test-fixtures/receipt-sample.jpg');
    await page.waitForSelector('[data-testid="receipt-preview"]');
    await page.click('button:has-text("Save")');

    // Receipt saved
    await expect(page.locator('text=Saved na ang receipt mo')).toBeVisible();

    // Scan the SAME receipt again (within 30 min, same merchant/amount)
    await page.click('a:has-text("Resibo")');
    const fileInput2 = await page.locator('input[type="file"]');
    await fileInput2.setInputFiles('./test-fixtures/receipt-sample.jpg');
    await page.waitForSelector('[data-testid="receipt-preview"]');

    // Should show duplicate warning
    await expect(page.locator('text=Parang duplicate ito')).toBeVisible();
    await expect(page.locator('button:has-text("Save anyways")')).toBeVisible();
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
  });

  test('should enforce Free tier scan limit (0 scans)', async ({ page }) => {
    // Note: This test assumes a Free tier user is logged in
    // Or we can mock the tier response

    // Try to navigate to Resibo Scanner
    await page.click('a:has-text("Resibo")');

    // Should be blocked or shown upgrade CTA
    await expect(page.locator('text=Receipt scanning ay Pro feature lang')).toBeVisible();
    await expect(page.locator('button:has-text("Upgrade to Pro")')).toBeVisible();
  });

  test('should work on mobile viewport (375px width)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to Resibo Scanner
    await page.click('a:has-text("Resibo")');

    // Verify responsive UI
    const cameraSection = await page.locator('[data-testid="camera-section"]');
    const rect = await cameraSection.boundingBox();
    expect(rect?.width).toBeLessThanOrEqual(375);

    // Upload receipt
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('./test-fixtures/receipt-sample.jpg');
    await page.waitForSelector('[data-testid="receipt-preview"]');

    // Verify buttons are tap-friendly (min 44px height)
    const saveButton = await page.locator('button:has-text("Save")');
    const buttonBox = await saveButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('should handle offline gracefully', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);

    // Navigate to Resibo Scanner
    await page.click('a:has-text("Resibo")');

    // Try to upload (should queue for sync when online)
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('./test-fixtures/receipt-sample.jpg');
    await page.waitForSelector('[data-testid="receipt-preview"]');

    // Try to save
    await page.click('button:has-text("Save")');

    // Should show conversational Filipino offline message
    await expect(page.locator('text=Offline ka ngayon')).toBeVisible();
    await expect(page.locator('text=I-save natin pagkabalik online')).toBeVisible();

    // Go back online
    await context.setOffline(false);
    await page.waitForTimeout(1000);

    // Should sync automatically
    await expect(page.locator('text=Synced!')).toBeVisible();
  });
});

test.describe('KA Chat - conversational Filipino Tone Consistency', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'maria@test.local');
    await page.fill('input[type="password"]', 'test-password-123');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('**/dashboard');
  });

  test('should respond to KA chat in warm, conversational Filipino tone', async ({ page }) => {
    // Open KA chat
    await page.click('[data-testid="ka-chat-button"]');

    // Send message
    await page.fill('[data-testid="chat-input"]', 'Magkano ang net ko this month?');
    await page.click('button:has-text("Send")');

    // Wait for response
    await page.waitForSelector('[data-testid="ka-response"]');

    // Verify conversational Filipino tone (warm, uses peso sign, uses first name)
    const response = await page.locator('[data-testid="ka-response"]').innerText();
    expect(response).toMatch(/₱\d+,?\d+/);  // Peso sign with amounts
    expect(response).not.toMatch(/Certainly/);  // No corporate filler
    expect(response).not.toMatch(/PHP/);  // Not "PHP", only "₱"
  });

  test('should show thinking indicator while KA is responding', async ({ page }) => {
    // Open KA chat
    await page.click('[data-testid="ka-chat-button"]');

    // Send message
    await page.fill('[data-testid="chat-input"]', 'Ano ang cash flow ko ngayong linggo?');
    await page.click('button:has-text("Send")');

    // Verify thinking indicator appears
    await expect(page.locator('[data-testid="thinking-indicator"]')).toBeVisible();

    // Verify estimated wait time shown (gap-registry.md B1)
    await expect(page.locator('text=~5 seconds')).toBeVisible();

    // Wait for response
    await page.waitForSelector('[data-testid="ka-response"]');
    await expect(page.locator('[data-testid="thinking-indicator"]')).not.toBeVisible();
  });

  test('should show "Flag as Wrong" button on every KA output', async ({ page }) => {
    // Open KA chat and send message
    await page.click('[data-testid="ka-chat-button"]');
    await page.fill('[data-testid="chat-input"]', 'Magkano ang sales ko last month?');
    await page.click('button:has-text("Send")');

    // Wait for response
    await page.waitForSelector('[data-testid="ka-response"]');

    // Verify "Flag as Wrong" button present (hard pre-launch gate, gap-registry.md)
    await expect(page.locator('button:has-text("Flag as Wrong")')).toBeVisible();

    // Click "Flag as Wrong"
    await page.click('button:has-text("Flag as Wrong")');

    // Should show confirmation toast (conversational Filipino)
    await expect(page.locator('text=Thanks! Tine-train namin si Kai')).toBeVisible();
  });
});
```

**Best practices:**
- Test real user flows (login → feature → action → verify)
- Include Philippine context (GCash, Shopee, thermal receipts, etc.)
- Test mobile-first (375px viewport)
- Test error states and edge cases (offline, slow network)
- Test conversational Filipino tone consistency in responses
- Use data-testid for stable selectors (not brittle CSS)

**Coverage targets:** All user-critical flows (happy path + main error cases)

### Step 7: AI-Specific Test Cases

For features involving Claude API (Reply Drafter, KA Chat, Morning Briefing):

#### conversational Filipino Tone Regression Tests

```typescript
describe('KA conversational Filipino Tone Regression', () => {
  const toneRegressions = [
    {
      input: 'How much did I earn this month?',
      shouldContain: ['kumikita', '₱', 'this month'],
      shouldNotContain: ['Certainly', 'As an AI', 'PHP', 'Your earnings'],
    },
    {
      input: 'BIR deadline coming up?',
      shouldContain: ['po', 'deadline', 'check'],
      shouldNotContain: ['Alert', 'WARNING', 'urgent'],
    },
    {
      input: 'Sales jumped today',
      shouldContain: ['Congrats', 'sales', '₱'],
      shouldNotContain: ['congratulations', 'exceeds threshold'],
    },
  ];

  toneRegressions.forEach(({ input, shouldContain, shouldNotContain }) => {
    it(`should respond to "${input}" with correct conversational Filipino tone`, async () => {
      const response = await callKAChat(input);

      // Check required tone elements
      shouldContain.forEach(phrase => {
        expect(response.toLowerCase()).toContain(phrase.toLowerCase());
      });

      // Check forbidden corporate-speak
      shouldNotContain.forEach(phrase => {
        expect(response).not.toContain(phrase);
      });
    });
  });
});
```

#### Claude API Confidence Threshold Tests

```typescript
describe('Receipt OCR Confidence Thresholds', () => {
  it('should flag low-confidence fields to user (confidence < 0.75)', async () => {
    // Upload receipt with faded/unclear amount field
    const result = await scanReceipt(fadedReceiptImage);

    // Claude returns confidence scores
    expect(result.confidence.amount).toBeLessThan(0.75);

    // UI should highlight this field for user review
    expect(result.flaggedForReview).toContain('amount');
    expect(ui.showWarning('amount')).toBe(true);
  });

  it('should accept high-confidence extraction without review (confidence > 0.85)', async () => {
    // Upload clear receipt
    const result = await scanReceipt(clearReceiptImage);

    // All fields high confidence
    expect(result.confidence.amount).toBeGreaterThan(0.85);
    expect(result.confidence.merchant).toBeGreaterThan(0.85);

    // No review needed
    expect(result.flaggedForReview.length).toBe(0);
  });
});
```

#### Guardrail Trigger Tests

```typescript
describe('KA Guardrails - Out of Scope Handling', () => {
  it('should deflect non-financial questions gracefully', async () => {
    const response = await callKAChat('Advice on dating?');

    expect(response).toContain('focus kami sa negosyo mo');
    expect(response).not.toContain('dating');  // Doesn't engage with off-topic
  });

  it('should log out-of-scope query for demand signal', async () => {
    const response = await callKAChat('How do I start a marketing campaign?');

    // Should defer but not refuse
    expect(response).toContain('Marketing Advisory');  // Acknowledge future domain

    // Log for Phase 4 demand signal (gap-registry.md, domain-expandable architecture)
    expect(redirectLogs.create).toHaveBeenCalledWith({
      query: expect.stringContaining('marketing'),
      category: 'marketing_advisory',
      user_id: userId,
      timestamp: expect.any(Date),
    });
  });

  it('should decline financial advice and defer to CPA', async () => {
    const response = await callKAChat('Should I increase my prices?');

    expect(response).toContain('CPA');
    expect(response).toContain('tax');  // Include financial consideration
    expect(response).toContain('decision mo');  // User controls final decision
  });
});
```

### Step 8: Compile Test Suite Output

Generate summary:

```markdown
# Test Suite: [Feature Name]

## Test Files Generated

### Unit Tests
- **File:** `/app/(features)/[feature]/lib/__tests__/schemas.test.ts`
  - Zod schema validation: [count] tests
  - Utility functions: [count] tests
  - Business logic: [count] tests
  - **Coverage:** [XX]%

### Integration Tests
- **File:** `/app/api/[feature]/__tests__/route.test.ts`
  - API route happy path: [count] tests
  - Error handling: [count] tests
  - RLS enforcement: [count] tests
  - Tier gating: [count] tests
  - **Coverage:** [XX]%

### E2E Tests
- **File:** `/e2e/[feature].spec.ts`
  - User flows: [count] tests
  - Mobile responsive: [count] tests
  - Offline support: [count] tests
  - Accessibility: [count] tests

## AI-Specific Tests
- **conversational Filipino tone regression:** [count] test cases
- **Confidence threshold validation:** [count] tests
- **Guardrail / out-of-scope handling:** [count] tests

## Test Data (Philippine Context)

**Personas used:**
- Maria (home baker, ₱80K–₱250K/mo)
- Jose (online seller, GCash reconciliation)
- Ana (freelancer, 8% flat tax)
- Andoy (sari-sari store, daily cash flow)

**Edge cases covered:**
- Thermal receipt (faded text)
- GCash screenshot (mobile payment)
- Handwritten receipt (mixed text)
- Receipt duplicate (same merchant, ±30 min)
- [Feature-specific edge case]

## How to Run

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests with coverage
npm run test:coverage
```

## Coverage Targets

| Type | Target | Current |
|------|--------|---------|
| Unit | 100% business logic | [XX]% |
| Integration | 80% API routes | [XX]% |
| E2E | Happy path + main errors | [XX] flows |

## Next Steps

1. Run test suite: `npm run test:coverage`
2. Aim for [coverage target] before merge
3. Hand off to **fullstack-engineer** for code review with tests passing

---
**Generated by:** /test [feature] workflow
**Date:** [Today's date]
**Feature:** [Feature Name]
```

### Step 9: Provide Test Running Instructions

Include commands for the user:

```bash
# Run all tests
npm run test

# Run tests for a specific feature
npm run test -- --testPathPattern='[feature]'

# Run with coverage report
npm run test:coverage

# Run E2E tests only
npm run test:e2e

# Watch mode (auto-rerun on file change)
npm run test:watch
```

---

## Common Test Patterns

### Testing Zod Schemas

```typescript
describe('ReceiptSchema', () => {
  it('should parse valid receipt', () => {
    const input = { merchant: 'SM', amount_centavos: 3450, date: '2026-03-19T10:00:00Z' };
    const result = ReceiptSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject invalid amount (negative)', () => {
    const result = ReceiptSchema.safeParse({ merchant: 'SM', amount_centavos: -100, ... });
    expect(result.success).toBe(false);
  });
});
```

### Testing RLS Policies

```typescript
it('should respect RLS: user can only access own receipts', async () => {
  const user1Receipts = await supabase
    .from('receipts')
    .select('*')
    .eq('user_id', 'user-1');  // User 1 queries own data
  expect(user1Receipts.error).toBeNull();
  expect(user1Receipts.data.length).toBeGreaterThan(0);

  // User 2 tries to access User 1's receipts (RLS blocks)
  const user2Access = await supabaseAsUser2
    .from('receipts')
    .select('*')
    .eq('user_id', 'user-1');  // Trying to access user-1's data
  expect(user2Access.data).toEqual([]);  // RLS filters to empty
});
```

### Testing Claude API Mocking

```typescript
it('should call Claude Haiku for receipt OCR', async () => {
  const mockAnthropicClient = {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify({ merchant: 'SM' }) }],
      }),
    },
  };

  await scanReceipt(image);
  expect(mockAnthropicClient.messages.create).toHaveBeenCalledWith(
    expect.objectContaining({ model: 'claude-haiku-4-5-20251001' })
  );
});
```

### Testing conversational Filipino Tone

```typescript
it('should use warm conversational Filipino tone (no corporate filler)', async () => {
  const response = await callKAChat('Magkano ang sales ko?');
  expect(response).toMatch(/₱[\d,]+/);  // Peso sign present
  expect(response).not.toMatch(/certainly|as an ai|your earnings/i);  // No corporate speak
});
```

---

## Test Checklist by Feature Type

### For Receipt Scanning (Resibo Scanner)
- [ ] Zod validation for receipt structure
- [ ] Image compression (file size, format)
- [ ] Claude Haiku Vision mocking
- [ ] Supabase Storage upload
- [ ] Deduplication logic (merchant + amount ±30 min)
- [ ] OCR confidence thresholds
- [ ] Edge case: faded thermal receipt
- [ ] Edge case: handwritten notes
- [ ] E2E: full upload → preview → edit → save flow
- [ ] Mobile: responsive upload UI

### For BIR Compliance (Deadline Watcher)
- [ ] Timezone accuracy (UTC+8)
- [ ] Deadline calculation per filing type
- [ ] Notification scheduling (7/3/1-day sequence)
- [ ] Edge case: month-end deadline
- [ ] Edge case: leap year
- [ ] E2E: deadline display in dashboard
- [ ] E2E: notification trigger at correct time

### For KA Chat / Reasoning
- [ ] conversational Filipino tone regression (20+ test cases)
- [ ] Prompt injection defense (user input not in system)
- [ ] RLS on conversation history (user only sees own)
- [ ] Confidence thresholds (flag low-confidence responses)
- [ ] Guardrails: out-of-scope queries logged
- [ ] Error handling: Claude API timeout
- [ ] E2E: chat flow with thinking indicator
- [ ] E2E: "Flag as Wrong" action working

### For Multi-Tier Features (Free/Pro/Business)
- [ ] Free tier denies feature access
- [ ] Pro tier grants access
- [ ] Business tier includes additional features
- [ ] Tier check in API route before processing
- [ ] E2E: upgrade CTA shown to Free user

---

## Troubleshooting

**Test fails: "Mock Supabase not found"**
- Ensure `/lib/supabase/__mocks__` exists and exports `createMockSupabaseClient()`

**E2E test times out waiting for element**
- Increase timeout: `page.waitForSelector(sel, { timeout: 10000 })`
- Check network: is Claude API call actually completing in test?

**Zod validation test fails unexpectedly**
- Print the error: `console.log(result.error.issues)` to see which field failed

**RLS policy test shows "permission denied"**
- Verify service_role_key is used (not anon_key) for admin setup in beforeEach

---

## Validation Checklist

Before handing off tests to fullstack-engineer:

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Coverage meets targets (unit 100% business logic, integration 80%)
- [ ] Test data uses Philippine personas and amounts (₱)
- [ ] conversational Filipino messages match brand-context.md tone rules
- [ ] RLS policies verified in tests
- [ ] Zod schemas tested for all edge cases
- [ ] AI-specific tests (tone, guardrails, confidence) included
- [ ] Test files follow naming convention: `[name].test.ts` (unit) or `.spec.ts` (e2e)
