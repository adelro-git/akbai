# AKBai — Test Strategy
> Used by: qa-engineer, fullstack-engineer, devops-engineer, ai-engineer
> Last updated: 2026-05-29 (Sprint 18 — added §11 pre-launch hardening test patterns: tax-year rollover with `vi.setSystemTime`, CSV formula-injection regression, offline-queue attempt-cap/flush) | Source: Tech Stack, Gap Registry, all engineering skill specs

---

## 1. Testing Philosophy

AKBai is built by a solo founder with 10–15 hours per sprint. The testing strategy must maximize defect prevention per hour invested. This means:

- **Test business-critical logic exhaustively.** BIR deadlines, payment flows, data isolation, and financial calculations are existential — a bug here costs users real money, creates compliance violations, or leaks data.
- **Skip commodity code.** Simple CRUD, basic rendering, and happy paths that TypeScript strict mode already enforces don't justify the maintenance overhead of tests.
- **Prefer cheap tests.** A unit test that runs in 5ms catches the same BIR deadline bug as an e2e test that takes 30 seconds. Default to the cheapest layer that can catch the failure.

---

## 2. Testing Pyramid

### Layer 1: Unit Tests (Vitest)
**Purpose:** Test pure business logic with no external dependencies.
**Speed:** < 10ms per test. Full unit suite < 5 seconds.
**Current count (as of Sprint 6+7):** 559 tests passing across 26+ files (Vitest), 0 failures. Sprint 6 added 25-case prompt regression test suite (`prompt-regression.test.ts`, Design Gate 3) covering 5 groups: persona integrity, conversational Filipino compliance (8 syntactic markers — enclitic placement, Filipino conjunctions, Filipino prepositions, Filipino time adverbs, affixed English verbs, Filipino comparatives, `ang` vs `yung` for definite objects, Filipino SVO/VSO word order), feature prompts, guardrails, integration — all deterministic, no API calls. Sprint 5 added 68 new tests + fixed 3 pre-existing failures: 21 check-in/dashboard, 26 profile, 13 feature-flags, 8 PWA/offline. Sprint 4 added 129: 40 email, 43 dashboard, 46 OCR.
**When to use:** Any function that takes input and returns output without side effects.

**Primary targets:**
- BIR deadline calculations (weekend/holiday rollover, mid-year registration, VAT threshold, partial-year)
- Money utilities (centavos ↔ peso conversion, formatting with ₱ sign, rounding)
- Tier permission checks (feature access by tier, scan limits, query limits)
- Receipt deduplication hash (amount + date + merchant ±30 minutes)
- OCR response validation (Zod schema parsing, field extraction)
- Confidence scoring (per-field confidence calculation, threshold flagging)
- Timezone conversions (UTC ↔ Asia/Manila, midnight boundary)
- Query counter logic (daily limit tracking, midnight reset in Manila time)
- Notification sequence generation (7-day, 3-day, 1-day before deadline)
- Email templates (17 tests — HTML rendering, placeholder injection, conversational Filipino copy)
- Email provider detection (23 tests — domain parsing, provider-specific SMTP config)
- Dashboard API + components (43 tests — API route validation, summary card rendering, data aggregation)
- OCR pipeline (46 tests — Zod schema validation, image format/size validation, model fallback from Sonnet → Haiku)

**Configuration:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      include: [
        'lib/bir/**',        // BIR deadline logic
        'lib/payments/**',   // Payment/subscription logic
        'lib/utils/money*',  // Money utilities
        'lib/utils/tier*',   // Tier permission logic
        'lib/ocr/**',        // OCR pipeline (non-AI parts)
      ],
      thresholds: {
        // Only enforce coverage on business-critical modules
        'lib/bir/**': { branches: 95, functions: 95, lines: 90 },
        'lib/payments/**': { branches: 90, functions: 90, lines: 85 },
        'lib/utils/money*': { branches: 100, functions: 100, lines: 100 },
      },
    },
  },
});
```

### Layer 2: Integration Tests (Vitest + Supabase Local)
**Purpose:** Test cross-layer behavior — API routes, RLS policies, webhook handlers, circuit breaker.
**Speed:** < 500ms per test. Full integration suite < 60 seconds.
**When to use:** Any flow that touches the database, auth system, or external service boundary.

**Primary targets:**
- RLS policy enforcement (user isolation across all tables)
- Xendit webhook processing (idempotency, signature verification, state transitions)
- API route auth/tier gating (every route checks auth, every paid feature checks tier)
- Circuit breaker behavior (daily spend cap → graceful degradation)
- Migration integrity (all migrations apply + rollback cleanly)
- Soft-delete enforcement (no physical deletes, deleted_at filtering)
- Dev bypass persistence (SKIP_AUTH routes must write to real DB via service client, not mock/in-memory — Sprint 10 learning)

**Setup:**
```bash
# Local Supabase for integration tests
supabase start          # starts local Supabase (Postgres, Auth, Storage)
vitest run tests/integration/
supabase stop           # cleanup
```

**Test isolation pattern:**
Each integration test creates its own test users via `supabase.auth.admin.createUser()` with unique emails. Tests clean up by soft-deleting their data. Never share test users across tests — this prevents test pollution and makes failures reproducible.

### Layer 3: E2E Tests (Playwright)
**Purpose:** Verify critical user journeys end-to-end in a real browser.
**Speed:** 10–30 seconds per test. Full e2e suite < 5 minutes.
**When to use:** Only for the 5–8 most critical user paths where a failure is catastrophic.

**Primary targets (keep this list short):**
1. **Onboarding (Kilala Kita):** 5-step flow completes, business profile created, user reaches dashboard
2. **Receipt scan:** Camera → upload → OCR → review card → user confirms → transaction saved
3. **Subscription upgrade:** Free → Pro → payment → features unlocked immediately
4. **BIR deadline alert:** Deadline in calendar → 7-day notification → 3-day → 1-day → user sees each
5. **Morning Briefing:** Ang Umaga Mo loads with correct data for user's tier (teaser vs full)

### Visual-Parity Gate Pattern (established Sprint 13, Phase 8-9)

For redesigned screens, augment behavioral e2e with **visual-parity snapshots** that pin the rendered UI to the handoff reference within a tight pixel-diff budget. This catches regressions that automated behavior tests + code review miss (Sprint 5 retro: 17+ design-system violations slipped past engineer review on Build 2 before live testing surfaced them).

**Canonical form** (see `frontend/e2e/synthesis/{chat,expenses,deadlines}.spec.ts` for live examples):

```typescript
test('visual parity — mobile FIL', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chrome', 'Pinned to mobile-chrome');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.context().addCookies([{ name: 'NEXT_LOCALE', value: 'fil', url: 'http://localhost:3000' }]);
  await mockNonDeterministicRoutes(page);  // mock anything that drifts: rule-based APIs, dated data, server-personalized content
  await hideDevOverlay(page);  // hide Next.js dev portal so it doesn't appear in snapshots

  await page.goto('/screen-under-test');
  await waitForReadySignals(page);  // explicit testid-based readiness, not just networkidle

  await expect(page).toHaveScreenshot(['screen', 'mobile-fil.png'], {
    fullPage: true,
    animations: 'disabled',
    maxDiffPixelRatio: 0.005,  // 0.5% — tight enough to catch real regressions, loose enough for font hinting drift
  });
});
```

**Required variants per visual-parity screen:**
1. **FIL locale** (default — primary user audience)
2. **EN locale** (validate i18n catalogs render without layout shift)
3. **Reduced-motion** (assert `prefers-reduced-motion: reduce` neutralizes animations; `motion-reduce:animate-none` Tailwind class is the standard hook)
4. **Locale flip** (set FIL cookie, render, flip to EN cookie, reload — verify no broken state)

**Mocking discipline:**
- Mock anything **non-deterministic** at the route layer (`page.route('**/api/foo', ...)`) — rule-based suggestion APIs, server-personalized chips, dated content
- Do NOT mock the screen's own data layer — that's the regression you're testing
- Empty-state vs data-state are SEPARATE snapshot tests, not branches in one test

**Snapshot location:** `frontend/e2e/synthesis/{screen}.spec.ts-snapshots/{screen}/mobile-{locale}.png`. Commit them to git — first run generates, subsequent runs assert.

**When a snapshot fails:**
1. Run `npx playwright test --update-snapshots <spec>` locally
2. **Eyeball the diff** before committing the new baseline — a passing `--update-snapshots` only means "the run produced a new image", not "the new image is correct"
3. If the change is intentional (design system edit, copy change), commit the new baseline with a note in the commit msg
4. If the change is regression, fix the regression — don't update the baseline

**Why `maxDiffPixelRatio: 0.005` (0.5%):**
- Tighter (0.001) → flaky on font hinting, sub-pixel scrollbar widths, anti-aliasing drift
- Looser (0.05) → misses real regressions like a 4px padding bug or wrong color token
- 0.5% is the sweet spot validated across `home.spec.ts`, `chat.spec.ts`, `expenses.spec.ts`, `deadlines.spec.ts`

**Why pin to `mobile-chrome` project only:**
- AKBai is mobile-first; tablet/desktop layouts derive from mobile
- Multi-project snapshots multiply baseline file count without catching new regressions
- Add a desktop snapshot only when desktop has its own divergent layout (per-screen judgment call)

**Counter-pattern — do NOT do this:** Adding a visual-parity test for *every* component or page. Visual parity is for the 5-8 redesigned brand-defining screens. For components, use vitest + Testing Library DOM assertions. For routine pages, behavioral e2e is enough.

**Configuration:**
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 375, height: 812 },  // iPhone SE — mobile-first
    locale: 'en-PH',
    timezoneId: 'Asia/Manila',
  },
  projects: [
    { name: 'mobile-chrome', use: { ...devices['iPhone SE'] } },
    // No desktop tests — AKBai is mobile-first PWA
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 3. Coverage Targets

Coverage is NOT a vanity metric. High coverage on business-critical modules prevents real damage. Zero coverage on commodity code is fine.

| Module | Branch Coverage | Rationale |
|--------|----------------|-----------|
| `lib/bir/` | 95% | BIR deadline bugs = government fines for users |
| `lib/payments/` | 90% | Payment bugs = lost revenue or double-charges |
| `lib/utils/money*` | 100% | Money math must be correct — no excuses |
| `lib/utils/tier*` | 90% | Tier bugs = revenue leakage or user lockout |
| `lib/ocr/` (non-AI) | 80% | Pipeline validation matters; model output can't be covered |
| Everything else | No target | Not worth the maintenance overhead |

---

## 4. Test Data Principles

### Use Realistic Philippine Context

Test data should feel like real AKBai data. This surfaces edge cases that generic data misses:

- **Names:** Maria Santos, Jose Reyes, Ana Garcia, Andoy Cruz (from persona definitions)
- **Amounts:** Always in centavos integers. ₱345.50 → `34550`. ₱18,400 → `1840000`.
- **Dates:** Use `Asia/Manila` timezone. Format as ISO 8601 with +08:00 offset.
- **BIR forms:** 1701Q (quarterly income tax), 2550M (monthly VAT), 2551Q (quarterly percentage tax), 1701 (annual income tax)
- **Merchants:** SM Supermarket, Puregold, Mercury Drug, Shopee, Lazada, GCash
- **Holidays:** Use actual Philippine holidays — not US holidays. Include both regular and special non-working days.

### Philippine Holiday Calendar (2026 reference)

The test suite should maintain a `fixtures/holidays/` directory with holiday calendars per year. At minimum include:

**Regular holidays:** New Year's Day (Jan 1), Araw ng Kagitingan (Apr 9), Maundy Thursday, Good Friday, Labor Day (May 1), Independence Day (Jun 12), National Heroes Day (last Mon of Aug), Bonifacio Day (Nov 30), Christmas Day (Dec 25), Rizal Day (Dec 30)

**Special non-working days:** EDSA Anniversary (Feb 25), Black Saturday, Ninoy Aquino Day (Aug 21), All Saints Day (Nov 1), Immaculate Conception (Dec 8), Last Day of Year (Dec 31)

**Note:** The president may declare additional holidays. The test fixture must be updatable without changing test logic.

### Fixture Files

```
tests/fixtures/
  receipts/
    sm-receipt-standard.json        — typical SM Supermarket receipt
    gcash-screenshot.json           — GCash payment confirmation
    handwritten-receipt.json        — low confidence, partial fields
    faded-thermal.json              — low confidence on amount
    shopee-waybill.json             — different format, no itemization
    duplicate-receipt.json          — matches sm-receipt-standard by hash
  webhooks/
    payment-success.json            — valid Xendit payment.success payload
    payment-failed.json             — valid Xendit payment.failed payload
    subscription-cancelled.json     — valid Xendit subscription.cancelled
    invalid-signature.json          — payload with wrong signature
    malformed-body.json             — missing required fields
  holidays/
    2026.json                       — Philippine holidays for 2026
    2027.json                       — Philippine holidays for 2027
```

---

## 5. CI Pipeline Integration

### Pipeline Stages (fail-fast)

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx tsc --noEmit
    # Fails fast — type errors block everything

  unit:
    needs: typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx vitest run tests/unit/ --coverage
    # Fast — pure logic, no dependencies

  integration:
    needs: unit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - uses: supabase/setup-cli@v1
      - run: supabase start
      - run: npm ci
      - run: npx vitest run tests/integration/
      - run: supabase stop
    # Medium — needs local Supabase

  e2e:
    needs: integration
    if: github.ref == 'refs/heads/main'   # Only on merge to main
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - uses: supabase/setup-cli@v1
      - run: supabase start
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build && npm start &
      - run: npx playwright test
    # Expensive — only on main branch merges
```

### PR Requirements

Every PR that touches these areas MUST include corresponding test updates:

| Code Area Changed | Required Test Update |
|---|---|
| `lib/bir/` | Unit tests in `bir-deadlines.test.ts` |
| `lib/payments/` or Xendit webhook | Integration tests in `xendit-webhooks.test.ts` |
| Any Supabase migration | Integration test in `migration-integrity.test.ts` |
| RLS policy change | Integration test in `rls-isolation.test.ts` |
| OCR pipeline or Zod schema | Unit tests in `ocr-schema-validation.test.ts` |
| Tier permission logic | Unit tests in `tier-permissions.test.ts` |
| System prompt change | Run Conversational Filipino regression library (20–30 cases) |

---

## 6. System Prompt Regression Testing

This is a special testing category because it tests AI behavior, not deterministic code. The Design Gate (Roadmap v14) requires a 20–30 case Conversational Filipino regression test library.

### What to Regression Test

After any system prompt change:

1. **KA voice consistency** — Does KA still sound like a kababayan colleague, not a corporate bot?
2. **BIR disclaimer presence** — Does every tax-related response include the disclaimer?
3. **Confidence flagging** — Are uncertain OCR fields still flagged?
4. **Prompt injection defense** — Can a user input override KA's persona or extract the system prompt?
5. **Conversational Filipino — 8 syntactic markers** — The library must detect and reject each of these Taglish leak patterns:
   1. **Enclitic misplacement** — "bago i-save natin" → should be "bago natin i-save" (second-position enclitic before the verb after a conjunction)
   2. **English conjunctions** — `if`/`before`/`because`/`when` → should be `kung`/`bago`/`kasi` or `dahil`/`kapag`
   3. **English prepositions** — `based sa` → should be `ayon sa` or `batay sa`
   4. **English time adverbs** — `this week`/`last month` → should be `ngayong linggo`/`nakaraang buwan`
   5. **Bare English verbs** — `Save mo` → should be `I-save mo` (affixed Filipinized form)
   6. **English comparatives** — `more Filipino` → should be `mas Filipino`
   7. **`yung` for definite objects** — `yung receipt` → should be `ang resibo`
   8. **English SVO word order** — "Here's what I found" → should be "Ito ang nakita ko" (Filipino VSO / topic-first)
6. **Length constraint** — Are chat responses staying within 2-line bubble max?
7. **First name usage** — Does KA use the user's first name when available?
8. **No corporate filler** — Zero instances of "Certainly!", "As an AI...", "I'd be happy to"

### Regression Test Structure

```json
{
  "test_id": "conv-fil-001",
  "category": "voice-consistency",
  "user_input": "Magkano ang gastos ko this week?",
  "user_context": { "name": "Maria", "tier": "pro", "business_type": "food_seller" },
  "assertions": [
    { "type": "contains_name", "expected": "Maria" },
    { "type": "no_corporate_filler", "blocked_phrases": ["Certainly", "As an AI", "I'd be happy to"] },
    { "type": "uses_peso_sign", "format": "₱ followed by digits" },
    { "type": "max_lines", "max": 4 },
    { "type": "no_english_time_adverbs", "blocked": ["this week", "last month", "next week"], "expected_alternatives": ["ngayong linggo", "nakaraang buwan", "sa susunod na linggo"] },
    { "type": "no_english_prepositions", "blocked": ["based sa", "based on"], "expected_alternatives": ["ayon sa", "batay sa"] },
    { "type": "enclitic_placement", "rule": "second-position enclitic before verb after conjunction" }
  ]
}
```

These tests are semi-automated — the assertions check measurable properties (presence of name, absence of filler phrases, ₱ format, detection of the 8 Taglish leak markers), but human review is still needed for subjective conversational Filipino quality. Run the library after every prompt version bump.

---

## 7. Testing Anti-Patterns (What NOT to Do)

These waste the solo founder's limited testing budget:

- **Don't test simple CRUD.** If the Supabase client `.insert()` call works, it works. Test the business logic around it, not the database driver.
- **Don't test basic rendering.** "Component mounts without throwing" tests catch almost nothing. If TypeScript compiles, the component structure is valid.
- **Don't test third-party libraries.** Supabase, Xendit SDK, date-fns — they have their own test suites. Test your integration with them, not their internals.
- **Don't test Claude model quality directly.** Model output varies between calls. Test the deterministic pipeline that wraps the model (pre-processing, Zod validation, confidence scoring, post-processing).
- **Don't chase 100% coverage globally.** Coverage targets apply only to the business-critical modules listed above. Forcing coverage on utility code, UI components, or configuration files wastes time.
- **Don't write flaky tests.** A test that fails intermittently is worse than no test — it trains the developer to ignore failures. If a test depends on timing, network, or AI output, it's either in the wrong layer or needs a mock.
- **Don't duplicate type system checks as tests.** If TypeScript strict mode + Zod schemas already prevent a class of errors, writing tests for the same errors is redundant.

---

## 8. Bundle-Size Guard Pattern (Sprint 15, Capacitor Pre-Launch Gate)

> **Active since 2026-05-27 (Sprint 15 / Gap G1 RESOLVED).** Reference test at `frontend/src/lib/__tests__/bundle-size-guard.test.ts`.

The <30 MB Pre-Launch Gate ceiling on the Android `.aab` is a load-bearing constraint (App Store / Play Console scrutiny + cellular install friction in PH). A vitest guard catches regressions before they hit Sprint 19 store submission.

Pattern:
- Read the binary off disk at the known gradle output path (`frontend/android/app/build/outputs/bundle/debug/app-debug.aab` and `.../apk/debug/app-debug.apk`)
- Compute size in MB via `statSync(path).size / 1024 / 1024`
- Assert `<30` (the documented Pre-Launch Gate ceiling — do NOT hardcode the current size as the threshold; that would calcify whatever bloat is present today)
- **Graceful skip if the binary doesn't exist** — local CI runs without the Android toolchain still pass; the assertion only fires when an engineer or release pipeline has produced the actual binary. Use `console.warn` + early return; do not `it.skip()` (that hides the test from coverage reports).

Sprint 15 baseline: `.aab` = 14.62 MB, `.apk` = 15.35 MB — both ~50% under the ceiling. **Sprint 16 actual:** `.aab` = 20.75 MB (+6.13 MB) / `.apk` = 24.39 MB (+9.04 MB, fat debug). Came in at the top of architect's +3.5-6.0 MB per-plugin estimate; Firebase Messaging multi-ABI + Sentry native SDK drove most of the growth. Sprint 17 (RevenueCat IAP SDK) expected +1-2 MB. **Stay well clear of 30 MB through Sprint 19.**

When to widen the guard:
- Add `.aab-release` check once Sprint 19 produces a signed release build (R8/ProGuard will shrink it further — expect 14-17 MB given current 20.75 MB debug)
- Add an iOS `.ipa` check once Sprint 17/19 produces an iOS build on a Mac

---

## 9. Capacitor Plugin Mock Pattern (Sprint 16)

> **Active since 2026-05-27 (Sprint 16 / Gap G4 IMPLEMENTED).** Reference tests at `frontend/src/components/scanner/__tests__/camera-capture.native.test.ts`, `frontend/src/lib/push/__tests__/capacitor-push.test.ts`, `frontend/src/lib/capacitor/__tests__/biometric.test.ts`, `frontend/src/lib/capacitor/__tests__/deep-link.test.ts`, `frontend/src/lib/sentry/__tests__/capacitor-init.test.ts`.

Capacitor plugins (`@capacitor/camera`, `@capacitor/push-notifications`, `@capacitor-community/biometric-auth` family, `@capacitor/app`, `@sentry/capacitor`, `@capacitor/preferences`) crash on web import because the Java/Swift bridge isn't present. Every plugin call sits behind `if (Capacitor.isNativePlatform()) { ... } else { /* web fallback */ }`. Tests must mock the plugin entirely — never exercise the native SDK.

**Pattern (per plugin):**

```ts
// 1. Hoist the mock function so it's accessible in tests
const mockGetPhoto = vi.fn();

// 2. Mock the plugin module BEFORE importing the subject under test
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true },  // or false for web-branch tests
}));

vi.mock('@capacitor/camera', () => ({
  Camera: { getPhoto: (...args: unknown[]) => mockGetPhoto(...args) },
  // Export enum constants matching the real plugin's runtime values
  CameraResultType: { DataUrl: 'dataUrl', Uri: 'uri', Base64: 'base64' },
  CameraSource: { Camera: 'CAMERA', Photos: 'PHOTOS', Prompt: 'PROMPT' },
}));

// 3. Import the subject AFTER mocks are declared
import { dataUrlToFile } from '../camera-capture';

// 4. In tests, use the mocked enum values (NOT raw string literals — that's a TS error)
const result = await Camera.getPhoto({
  source: CameraSource.Camera,        // ✅ correct
  resultType: CameraResultType.DataUrl, // ✅ correct
  quality: 85,
});
```

**Gotchas (learned in Sprint 16):**
- **Raw string literals vs enum imports.** `source: 'CAMERA'` compiles at runtime (mock returns the same string) but fails TypeScript strict check (expected `CameraSource`). Always destructure the enum from the mock and use the enum value. Two QA-surfaced TS errors landed because the engineer used raw literals; clean fix in `b43d8bf`.
- **Global vs per-file mock.** Sprint 16 used per-file mocks so each test could control `isNativePlatform()` independently (true for native tests, false for web fallback tests). A global mock in `vitest.setup.ts` defaulting to `false` is acceptable, but per-test override is the load-bearing pattern.
- **Don't test the plugin's own behaviour.** The plugin's contract is Capacitor's responsibility. Test only YOUR code's interaction with the plugin — mock the plugin's return, assert what your code does with it.
- **`@capacitor/preferences` for sensitive state, NOT localStorage.** Biometric failure counter must persist in `@capacitor/preferences` (SharedPreferences/UserDefaults — native-secure) per the architect's risk #3 in `sprint-16-native-plugin-pattern.md` §1. Mock pattern: `vi.mock('@capacitor/preferences', () => ({ Preferences: { get: vi.fn(), set: vi.fn(), remove: vi.fn() } }))`.

**Tests-per-plugin (Sprint 16 final count):** camera-native +7, push +39 (across capacitor-push, send, deferred-prompt, types-schemas, routes), biometric/deep-link/sentry/profile +46, login-banner +4. Total +96 tests added in Sprint 16 (1331 → 1427).

**Long-running gradle build discipline (Sprint 16 process regression, RESOLVED Sprint 17):** the Sprint 16 QA agent yielded twice mid-`gradlew bundleDebug` before the artifact landed (Sprint 14 anti-pattern violation). **Sprint 17 demonstrated the cleaner pattern: QA agent never touches gradle — PM owns it.** See `SKILL.md` §Gradle build discipline for the explicit rule. Sub-agent `Monitor.until-loop` is NO LONGER the recommended fallback; PM-owned `run_in_background` + task-notification flow is the canonical path because sub-agents don't receive task-notifications across tool boundaries while the PM (top-level Claude) does.

### Sprint 17 extension — RevenueCat SDK mock (Capacitor plugin pattern, continued)

> **Active since 2026-05-27 (Sprint 17 / Gap G2 IMPLEMENTED at plumbing level; full close-out at Sprint 19 enrollment wave).** Reference tests at `frontend/src/lib/iap/__tests__/configure.test.ts` (+9), `frontend/src/lib/iap/__tests__/entitlements.test.ts` (+7), `frontend/src/lib/iap/__tests__/purchase.test.ts` (+19), `frontend/src/app/api/webhooks/revenuecat/__tests__/route.test.ts` (+32), `frontend/src/lib/iap/__tests__/server-entitlements.test.ts` (+14), and 4 paywall component test files (+47). Total +128 tests in Sprint 17 (1427 → 1555).

`@revenuecat/purchases-capacitor@13.1.2` follows the same per-file `vi.mock()` shape as the Sprint 16 Capacitor plugins. Mocks live **inline at the top of each test file under `lib/iap/__tests__/`** (no shared `__mocks__/` directory — the Sprint 16 pattern of per-file hoisted mocks remains canonical because each test controls its own `Capacitor.isNativePlatform()` return).

**Mock shape (matches Sprint 16 §9 pattern; surface area = the 5 SDK calls our code makes):**

```ts
const mockConfigure = vi.fn();
const mockGetCustomerInfo = vi.fn();
const mockPurchasePackage = vi.fn();
const mockRestorePurchases = vi.fn();
const mockGetOfferings = vi.fn();

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true },  // false for web-branch tests
}));

vi.mock('@revenuecat/purchases-capacitor', () => ({
  Purchases: {
    configure: (...args: unknown[]) => mockConfigure(...args),
    getCustomerInfo: (...args: unknown[]) => mockGetCustomerInfo(...args),
    purchasePackage: (...args: unknown[]) => mockPurchasePackage(...args),
    restorePurchases: (...args: unknown[]) => mockRestorePurchases(...args),
    getOfferings: (...args: unknown[]) => mockGetOfferings(...args),
  },
  // Export enum constants matching the real SDK's runtime values
  LOG_LEVEL: { VERBOSE: 'VERBOSE', INFO: 'INFO', WARN: 'WARN', ERROR: 'ERROR' },
  PURCHASES_ERROR_CODE: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    PURCHASE_CANCELLED_ERROR: 'PURCHASE_CANCELLED_ERROR',
    PURCHASE_NOT_ALLOWED_ERROR: 'PURCHASE_NOT_ALLOWED_ERROR',
    // ...etc — mirror the real enum so name-string assertions remain valid
  },
}));

import { configureRevenueCat, __resetRevenueCatForTests } from '../configure';

beforeEach(() => {
  __resetRevenueCatForTests();  // module-singleton reset between runs (see below)
  vi.clearAllMocks();
});
```

**Module-singleton reset (`__resetRevenueCatForTests()`):** `lib/iap/configure.ts` caches a "have we already called `Purchases.configure()`?" boolean at module scope so re-renders of `(app)/layout.tsx` don't reinitialize. Tests need to reset that flag between runs. The escape hatch is a `__resetRevenueCatForTests()` export — same pattern as Sprint 16's `initSentryCapacitor()` reset in `lib/sentry/capacitor-init.ts`. Reset in `beforeEach()`; assert in the test that `Purchases.configure` is called once (or not called on the web branch).

**Error-code dual-form handling (Sprint 17 batch 1 DRIFT, see sprint-history §Sprint 17 DRIFT #2):** the architect spec switch-cased `rcErr.code` against enum NAMES (`'NETWORK_ERROR'`, `'PURCHASE_CANCELLED_ERROR'`, etc.) but the real SDK exposes `code` as numeric-string values (`'10'`, `'1'`, etc., per `node_modules/@revenuecat/purchases-capacitor/dist/esm/errors.d.ts`). The engineer added a `NUMERIC_TO_NAME` normaliser in `lib/iap/purchase.ts` so both forms route to the same conversational Filipino messageKey. **Test implication:** the `purchase.test.ts` suite asserts against EITHER form interchangeably — feeding `mockPurchasePackage` a rejection with `code: '10'` and asserting the resulting messageKey is `iap.error.network` is equivalent to feeding `code: 'NETWORK_ERROR'`. Both paths flow through `NUMERIC_TO_NAME` and produce the same surface output. The normaliser itself has dedicated assertions on the numeric → name mapping.

**Sprint 17 file map:**
- `lib/iap/configure.ts` + `__tests__/configure.test.ts` (+9) — SDK init, `__resetRevenueCatForTests()` export, web fallback branch
- `lib/iap/entitlements.ts` + `__tests__/entitlements.test.ts` (+7) — client-side entitlement read via `getCustomerInfo`
- `lib/iap/purchase.ts` + `__tests__/purchase.test.ts` (+19) — `purchasePackage` + `restorePurchases` + `NUMERIC_TO_NAME` normaliser
- `lib/iap/server-entitlements.ts` + `__tests__/server-entitlements.test.ts` (+14) — REST helper to RevenueCat dashboard (no SDK, mocks `fetch`)
- `app/api/webhooks/revenuecat/route.ts` + `__tests__/route.test.ts` (+32) — webhook handler with signature verification + event-UUID dedup
- 4 paywall component test files (+47) — paywall-modal, restore-link, paywall-trigger, morning-briefing-paywall integration

**Gotcha — TS `vi.mocked` spread-arg pattern:** the 7 net-new TS errors in `configure.test.ts` come from the same `vi.mocked(...).mockImplementation((...args) => ...)` spread-arg pattern that Sprint 16's profile-test propagation surfaced. Not a Sprint 17 regression; carry-over for housekeeping cleanup (Sprint 17 retro action item).

### Sprint 18 extension — Pre-launch hardening test patterns

> **Active since 2026-05-29 (Sprint 18 / Gap G7 code-side GREEN).** New regression patterns established while driving the Pre-Launch Feature Readiness Gate. Tests grew 1555 → 1716 (+161). These three patterns are reusable beyond their originating features.

**1. Date-dependent logic — pin the clock with `vi.setSystemTime`.** The tax-year 2027 rollover test (and the trial-countdown banner day-math) must not depend on the wall clock. Freeze time at the boundary you're testing, exercise the function, restore in `afterEach`. This also surfaced a real bug: `lib/deadlines/generate.ts` used the runtime timezone instead of Manila — a frozen-clock test in a non-Manila CI env exposed it. **Always pin AND set a non-Manila TZ in date tests so Manila-tz bugs can't hide behind a Manila-tz dev machine.**

```ts
import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
  // Freeze at the year boundary in UTC — if the SUT assumes runtime tz,
  // a UTC-frozen clock at 2026-12-31T20:00:00Z (= 2027-01-01 04:00 Manila)
  // will reveal the off-by-one-year bug a Manila-tz machine would mask.
  vi.setSystemTime(new Date('2026-12-31T20:00:00Z'));
});
afterEach(() => vi.useRealTimers());
```

Coverage target: tax-year rollover, trial day-countdown, deadline generation, any "today/this period" boundary. Pair with the `lib/timezone` helpers — never `new Date()` directly in the SUT.

**2. CSV / spreadsheet export — OWASP formula-injection regression.** Any value that can begin with `=`, `+`, `-`, `@`, tab, or CR (`\t`, `\r`) must be neutralized (prefix with `'`) before it lands in a CSV cell, or a malicious merchant/category name becomes a formula when the user opens the export in Excel/Sheets. The guard lives in `lib/expenses/csv.ts`; the regression suite feeds each dangerous-prefix value and asserts the output cell is escaped, plus asserts ordinary values pass through unquoted. This is a business-critical security test, not commodity-CRUD — keep it.

```ts
it.each(['=cmd()', '+1+1', '-2+3', '@SUM(A1)', '\t=x', '\r=y'])(
  'neutralizes formula-injection prefix %j', (evil) => {
    expect(toCsvCell(evil)).toMatch(/^'/);   // leading apostrophe guard
  });
it('leaves a normal merchant name untouched', () => {
  expect(toCsvCell('SM Supermarket')).toBe('SM Supermarket');
});
```

**3. Offline queue — attempt-cap, dedup, and flush behavior.** The offline receipt scan queue (`lib/ocr/offline-queue.ts`) must be tested for: validate-before-save (a malformed item never enters the queue — review finding C1/C3 poisoning), per-item attempt cap (a permanently-failing item is dropped, not retried forever), dedup (the same scan enqueued twice yields one entry), retriable vs non-retriable error classification (non-JSON OCR error is retriable — review finding C5), and clear-on-sign-out (no other user's queued images survive a sign-out — review finding M1). Mock the network/OCR call; drive the queue through enqueue → flush → assert side effects. Do NOT test the storage driver itself — test the queue's policy logic around it.

**Provenance note:** patterns 1-3 each fixed a real review finding (Manila-tz bug; H1 CSV injection; C1/C3/C5/M1 offline-queue). Pre-launch hardening tests earn their keep — they encode the exact hazard a security pass caught, so a future refactor can't silently reintroduce it.

---

## 10. Multi-Agent Testing Pattern (Sprint 4)

Sprint 4 introduced a parallel worktree workflow: 5 Claude Code agents worked simultaneously in isolated git worktrees, each writing tests for their own feature area (email templates, email provider detection, dashboard API, dashboard components, OCR pipeline). Key observations:

- **All agent test suites passed individually.** Each agent ran `vitest` against its own test files before committing, ensuring no broken tests were merged.
- **3 pre-existing failures in `chat/route.test.ts`** were identified during the combined test run. These are caused by a circuit breaker mock issue that predates Sprint 4 — they are not regressions from the new code.
- **Isolation matters.** Because each agent operated in a separate worktree, there were no merge conflicts in test files. Test file naming conventions (`<feature>.test.ts`) prevented collisions.
- **Recommended for future sprints** when multiple independent features need test coverage in parallel. The constraint is that agents must not modify the same source files — tests-only parallelism works cleanly.
