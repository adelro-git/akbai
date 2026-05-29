# Kai Character Usage Audit + Enye Rendering Audit

> Used by: ux-designer, fullstack-engineer, product-owner
> Created: 2026-05-29 (Sprint 18 Pre-Launch Readiness)
> Source tasks: Gap §11 Pre-Launch Feature Readiness Gate (G7) — brand/UX items:
> 1. "Kai character art deployed in ≥5 product surfaces OR Kai mark fallback documented"
> 2. "Enye (ñ), long Tagalog captions, business names with special chars render without truncation/clipping in chat, briefings, invoices, PDF exports"

---

## Part 1 — Kai Character Usage Audit (Gap §11 brand item)

### Kai asset inventory

Two component entrypoints under `frontend/src/components/illustrations/kai/`:

| Component | Asset | Notes |
|-----------|-------|-------|
| `Kai` (`kai.tsx`) | Inline SVG expressions from `svg/ka-expressions/*` — `happy`, `concerned`, `thinking`, `celebrating`, `waving`, `working` | Expression-driven mark. `animated` → `animate-kai-bob`. ADR-013. |
| `KaiSitting` (`kai-sitting.tsx`) | `/public/icons/kai-mark.png` (512×512, 445KB, chroma-keyed) via Next/Image | Hero PNG mark, circular clip + ambient shadow. `animated` → `animate-kai-breathe`. Uses `priority` (LCP on home hero). ADR-013. |

The chat top-bar avatar additionally renders `/icons/mark-honey.png` (the honey-tinted Kai mark) inside an `<img>` — a third Kai-branded raster used only as the bubble avatar.

### Product surfaces where Kai appears

Distinct product SURFACES (page / component) using a Kai mark or expression:

| # | Surface | File | Asset / expression used |
|---|---------|------|--------------------------|
| 1 | **Login screen** | `app/(auth)/login/page.tsx:38` | `<KaiSitting size={168} animated />` (hero mark, breathing) |
| 2 | **Dashboard hero (Kumustahan)** | `components/dashboard/kumustahan-hero.tsx:113` | `<KaiSitting size={168} animated />` (hero mark, breathing) |
| 3 | **Chat top bar** | `components/chat/chat-interface.tsx:377` | `<Kai expression={loading ? 'thinking' : 'happy'} size={28} />` (live expression swap on loading) |
| 4 | **Chat message avatar** | `components/chat/chat-bubble.tsx:65` | `/icons/mark-honey.png` (honey Kai mark, per-Kai-message avatar) |
| 5 | **Onboarding wizard shell** | `components/onboarding/onboarding-wizard.tsx:219` | `<KaiSitting size={144} animated />` |
| 6 | **Onboarding step shell** | `components/onboarding/onboarding-shell.tsx:43` | `<Kai expression={expression} size={72} animated />` (per-step expression) |
| 7 | **Welcome tour** | `components/onboarding/welcome-tour.tsx:213` | `<Kai expression={features.expression} size={88} animated />` |
| 8 | **Onboarding biometric step** | `components/onboarding/step-biometric.tsx:60` | `<KaiSitting size={120} animated />` |
| 9 | **Biometric app-open overlay** | `components/auth/biometric-overlay.tsx:46` | `<KaiSitting size={120} animated />` |
| 10 | **Expenses insight callout** | `app/(app)/expenses/page.tsx:455` | `<Kai expression={insight.expression} size={32} />` |
| 11 | **Deadlines pre-callout** | `components/deadlines/deadline-pre-callout.tsx:79` | `<Kai expression="concerned" size={32} />` |
| 12 | **Sidebar nav (tablet/desktop)** | `components/dashboard/sidebar-nav.tsx:74` | `<KaiSitting size={40} />` (brand lockup) |
| 13 | **Public landing — "Kilanin si Kai" section** | `components/public/landing-page.tsx:543` | `/illustrations/empty-states/no-chat.webp` used as Kai mascot art (see note below) |

**Distinct product surfaces using Kai: 13 — comfortably ≥5. Gate item PASSES.**

> Note on surface #13: the public landing "Meet Kai" section uses a WebP empty-state illustration (`no-chat.webp`) as a stand-in mascot rather than the canonical `KaiSitting`/`kai-mark.png`. It is Kai-branded copy + art but does NOT use the canonical mark. Counted as a Kai brand surface; flagged for G6 follow-up so the landing mascot is swapped to a real Kai character pose once the Gemini set lands. Even excluding #13, the gate is satisfied with 12 canonical-mark surfaces.

### Fallback policy (accepted for the Pre-Launch Gate)

Per Gap **G6** (Kai character evolution via Gemini image generation): Anton's full Gemini-generated Kai character set (8-pose minimum + 1 hero shot, using the locked Character DNA preamble in `kai-gemini-prompts.md`) is scheduled to replace static `kai-mark.png` usages in Sprint 18/19. That set has not yet landed.

**Accepted fallback for the G7 gate:** The current static **`kai-mark.png`** (rendered via `KaiSitting`) plus the inline **`Ka*` SVG expression set** (rendered via `Kai`) ARE the canonical Kai mark today and are the accepted fallback until the Gemini character set ships. The gate requirement is explicitly "Kai character art deployed in ≥5 product surfaces **OR** Kai mark fallback documented" — both halves are satisfied: 12+ canonical-mark surfaces are deployed, AND this document records the fallback policy.

**Known asset-hygiene follow-up (does not block the gate):** Per memory `project_kai_mark_master_reexport.md`, the current `kai-mark.png` was chroma-keyed + circular-masked from a 2048×2048 master whose soft honey-glow layer is baked into the PNG, leaving a faint cream rim around the crescents. Anton's queued action item is to re-export the master from the design tool with the **soft-glow layer hidden**, drop the clean PNG at `design_handoff_akbai_redesign/prototype/assets/kai-mark.png`, then re-run a `sharp().trim().resize(512,512)` for true transparency. This rim is most visible at the 168px hero size against darker (dark-mode) backgrounds. It is cosmetic and does not affect the gate; the Phase 4 ship was intentional.

**Summary:** Gate brand item GREEN. ≥5 surfaces (12+ canonical) deployed; static mark + SVG expression set documented as the accepted fallback pending the G6 Gemini character set; mark re-export tracked as a non-blocking asset-hygiene follow-up.

---

## Part 2 — Enye / Special-Character Rendering Audit (Gap §11 brand item)

### Scope and method

Audited every surface that renders user-supplied or Filipino text for truncation/clipping risk: chat bubbles, morning briefing / Kumustahan hero, invoices + invoice PDF export, expense category labels, business-name displays, and OCR scan-results. Searched for `truncate`, `line-clamp`, `overflow-hidden`, `text-overflow`, `whitespace-nowrap`, fixed widths/heights on text, and missing `break-words` / `overflow-wrap` on user content.

### Font / glyph confirmation

The ñ glyph and accented Latin characters are NOT a font-coverage problem. **Plus Jakarta Sans** (UI) and **Fraunces** (display/serif) both cover Latin Extended, so ñ, é, ü, etc. render correctly. The PDF export declares `<meta charset="UTF-8">` and uses the Plus Jakarta Sans stack, so ñ renders in PDFs too. Critically, `text-overflow: ellipsis` (Tailwind `truncate`) does **not** clip or corrupt the ñ glyph — it only ellipsizes overflow at the END of an overflowing single line; ñ in the visible portion renders intact. The real Gap §11 risk is therefore (a) long unbroken tokens overflowing a wrapping container horizontally (missing `break-words`/`overflow-wrap`), and (b) intentional single-line truncation hiding the tail of a long ñ-bearing business name.

### Findings table

| Surface | File:line | Risk | Verdict | Action |
|---------|-----------|------|---------|--------|
| Chat bubble — user message | `components/chat/chat-bubble.tsx:31` | `whitespace-pre-wrap` wrapped but no `break-words`; a long unbroken token (URL, no-space ñ string) overflows the 78% bubble | **SAFE-TO-FIX-NOW** | ✅ Added `break-words` |
| Chat bubble — Kai message | `components/chat/chat-bubble.tsx:72` | Same as above on the 85% Kai bubble | **SAFE-TO-FIX-NOW** | ✅ Added `break-words` |
| Invoice PDF — line-item / cells | `lib/invoices/pdf-generator.ts` `tbody td` | Long unbroken description/email/name forces table wider than page → horizontal clip on print | **SAFE-TO-FIX-NOW** | ✅ Added `overflow-wrap: anywhere; word-break: break-word` |
| Invoice PDF — business detail (name/address/email) | `lib/invoices/pdf-generator.ts` `.business-detail` | Long unbroken business name/email overflows the header column | **SAFE-TO-FIX-NOW** | ✅ Added `overflow-wrap: anywhere` |
| Invoice PDF — Bill To / dates meta | `lib/invoices/pdf-generator.ts` `.meta-block p` | Long unbroken client name/email overflows meta column | **SAFE-TO-FIX-NOW** | ✅ Added `overflow-wrap: anywhere` |
| Invoice PDF — notes | `lib/invoices/pdf-generator.ts` `.notes p` | Long unbroken note token overflows the notes card | **SAFE-TO-FIX-NOW** | ✅ Added `overflow-wrap: anywhere` |
| Kumustahan hero — user name `<h1>` | `components/dashboard/kumustahan-hero.tsx:127` | 30px serif name wraps on whitespace but a long unbroken name overflows | **SAFE-TO-FIX-NOW** | ✅ Added `break-words` |
| Invoice PDF — business name (`escapeHtml`) | `lib/invoices/pdf-generator.ts:114` | ñ renders fine (UTF-8 + JK Sans); escaped correctly | **SAFE — no change** | None (already correct) |
| Expense category labels | `components/expenses/transaction-list.tsx:83`, `category-chart.tsx:88`, `category-breakdown-row.tsx:50` | `truncate` on category label | **SAFE — no change** | App-defined short Taglish labels (`getCategoryLabel`), not user input; no overflow/ñ risk |
| Transaction description (user content) | `components/expenses/transaction-list.tsx:93` | `truncate` on user description in a single-line list row | **NEEDS-DESIGN-REVIEW** | Intentional single-line list UX; removing `truncate` breaks the fixed-row layout. ñ not clipped. Leave to PM/design. |
| Invoice list — client name | `components/invoices/invoice-list.tsx:55` | `truncate` on user client name in list row | **NEEDS-DESIGN-REVIEW** | Intentional single-line list UX. ñ not clipped. Consider `title` attr tooltip if full name must be reachable. |
| Kai-greeting — business name / type | `components/dashboard/kai-greeting.tsx:51,55` | `truncate` on `businessName` / `typeLabel` | **NEEDS-DESIGN-REVIEW** | Intentional single-line persona pill. ñ not clipped. |
| Sidebar nav — persona name / tagline | `components/dashboard/sidebar-nav.tsx:97,100` | `truncate` on persona name + tagline | **NEEDS-DESIGN-REVIEW** | Intentional single-line lockup in fixed-width sidebar. |
| Deadline row — form name | `components/deadlines/deadline-row.tsx:99` | `truncate` on BIR form display name | **NEEDS-DESIGN-REVIEW** | App-defined BIR form names (short); single-line by design. Low risk. |
| Dashboard card — title / summary | `components/dashboard/dashboard-card.tsx:115,123` | `truncate` title + summary | **NEEDS-DESIGN-REVIEW** | Mixed app/AI content; `line-clamp-2` already used on descriptions. Single-line title intentional. |
| Scan-results — OCR item name | `components/scanner/scan-results.tsx:302` | `truncate block` on OCR-extracted item name (user-reviewed) | **NEEDS-DESIGN-REVIEW** | Review screen; long OCR item names get ellipsized. Full value editable downstream. PM call whether review needs full visibility. |

### Files safe-fixed (exact changes)

1. `frontend/src/components/chat/chat-bubble.tsx` — user bubble `<p>`: added `break-words` to `... whitespace-pre-wrap`.
2. `frontend/src/components/chat/chat-bubble.tsx` — Kai bubble `<p>`: added `break-words` to `... whitespace-pre-wrap`.
3. `frontend/src/lib/invoices/pdf-generator.ts` — `tbody td`: added `overflow-wrap: anywhere; word-break: break-word;`.
4. `frontend/src/lib/invoices/pdf-generator.ts` — `.business-detail`: added `overflow-wrap: anywhere;`.
5. `frontend/src/lib/invoices/pdf-generator.ts` — `.meta-block p`: added `overflow-wrap: anywhere;`.
6. `frontend/src/lib/invoices/pdf-generator.ts` — `.notes p`: added `overflow-wrap: anywhere;`.
7. `frontend/src/components/dashboard/kumustahan-hero.tsx` — name `<h1>`: added `break-words`.

All changes are additive CSS-class / inline-style additions on text containers; no layout, copy, or logic changes.

### Test confirmation

- `src/components/invoices/__tests__/invoices.test.ts` (exercises `generateInvoiceHtml`, incl. XSS/escape cases) — **36 passed**.
- `src/components/chat/__tests__/offline-send.test.ts` (renders chat bubbles) — **6 passed**.
- `src/components/illustrations/kai/__tests__/kai.test.tsx` (Kai + KaiSitting) — **8 passed**.
- (`kumustahan-hero.tsx` has no dedicated unit test; change is a single additive class.)

### Items handed to PM for design review

The NEEDS-DESIGN-REVIEW rows above are all **intentional single-line `truncate`** in fixed-row list layouts (transaction list, invoice list, kai-greeting persona pill, sidebar nav, deadline row, dashboard card, scan-results OCR review). None of them clip the ñ glyph — they ellipsize the tail of an overflowing single line, which is standard list UX. The product/design decision is whether any of these single-line displays of user-supplied names (esp. invoice client name, business name) should instead wrap or expose the full value via a `title` tooltip. No code change was applied to these because removing `truncate` would alter the established row layouts beyond a clearly-safe CSS tweak.
