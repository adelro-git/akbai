# Screen 05 — Tamang Presyo (`/costing`)

**Verdict:** HYBRIDIZE (per [A6](../02-decisions.md#a-per-screen-verdicts-locked))
**Visual reference:** [current](../screenshots/05-costing/current-mobile-chrome.png) · [handoff](../../screenshots/10-costing-honey-fil.png)

## 1. Comparison summary

Current costing delivers a functional margin calculator with an established brand illustration on the empty/intro state — a meaningful visual moment that should not be lost. The handoff's layout upgrades the experience meaningfully: the markup slider + recommended-price card with Fraunces 56px serif amount transforms pricing from a calculation into a coaching moment. The Kai competitor callout pill adds the advisor positioning. The verdict is HYBRIDIZE: adopt handoff layout + slider + recommended-price card + Kai callout; keep the current illustration on empty state.

## 2. Synthesized layout

Palette context: `honey`. Route: `/costing`. Reference: `prototype/components/screen-other.jsx` (`CostingScreen`).

**Empty / intro state** (no costing cards yet):
- Existing costing illustration (KEEP CURRENT — port into the handoff layout column)
- Copy: "Wala ka pang costing card. Gawa tayo ng una mo!" (voice manual §5)
- CTA "Gawa ng Costing Card" (voice manual §9)

**Active state** (product entered / calculating):

Top → bottom:

1. **Screen header** — `IconPrecio` (28px, pending B4 approval) + eyebrow "PRICING AT COSTING" (10px/800, honey-deep) + Fraunces serif H1 "Magkano dapat ang presyo?" (28px/500).
2. **Inputs card** (`surface-container-lowest`, `rounded-xl`, `p-4`):
   - **Produkto** — text input with label above ("Pangalan ng produkto"). `useRef` + `onClick` per E1.
   - **Kapalit bawat isa** — peso input, ₱ prefix. `useRef`.
   - **Markup** — horizontal Radix slider (0–100%). Track: honey-pale. Fill: honey-deep gradient. Thumb: honey-deep 20px circle (44×44px touch target via padding). Current value displayed honey-deep top-right of slider (e.g. "45%"). Live recompute on drag.
3. **Recommended price card** (`surface-container-lowest`, honey-cream gradient fill on outer, `rounded-xl`):
   - Eyebrow "INIREKOMENDA NI KAI" (10px/800, honey-deep)
   - Fraunces serif amount (56px/600, honey-deep) — computed live
   - Caption "Kita bawat isa: ₱X" (13px/400, ink-soft)
4. **Kai competitor callout** — small `surface-container-lowest` pill below recommended price. Mini Kai avatar (24px, `happy`, `pattern:varying-kai-expression-by-context`) + inline FIL text (13px/400, Fraunces italic). Copy follows `pattern:hooked-variance-coach-not-casino` Observant register. Example: "Ang karibal mo sa tabi — ₱133. Pwede mo pang taasan."
5. **Save CTA** — full-width "I-save ang Costing Card" (voice manual §9), `primary-container` fill, 48px height.

## 3. Decisions table

| Verdict ID | Dimension | Verdict | Rationale |
|---|---|---|---|
| A6 | Costing layout | HYBRIDIZE | Handoff layout + slider + card; current illustration on empty state |
| B1 | Palette | honey | Non-home screen |
| B2 | Typography | Fraunces | Serif H1 + recommended price amount |
| B4 | Icons | DEFER | `IconPrecio` pending; lucide `Tag` fallback |
| E1 | Forms | KEEP CURRENT | `useRef` + `onClick` on all inputs |
| F1 | Touch targets | VERIFY | Slider thumb must have 44×44px touch area via padding |

## 4. Enrichments applied

- `pattern:hooked-variance-coach-not-casino` — Kai competitor callout rotates copy based on context (Observant register); content varies but tone is always supportive
- `pattern:varying-kai-expression-by-context` — Kai avatar in callout: `happy` when recommended price > current estimate; `concerned` if markup would place product above market range
- `pattern:paper-note-asymmetric-corners` — Kai callout is a pill variant, NOT a paper-note (per handoff spec; paper-note reserved for check-in and narrative callouts)
- `pattern:one-handed-cta-thumb-zone` — "I-save" CTA fixed in lower portion; slider in reachable middle zone
- `pattern:filipino-mobile-data-resilience` — costing card auto-saves each slider change to local state; no data lost on interruption per NN/g 72-second session rule

## 5. Reuse map

| Component needed | Source | Notes |
|---|---|---|
| Costing form logic | Current — keep | `useRef` inputs, calculation logic |
| Costing illustration | Current — port | Existing illustration; show on empty state only |
| Radix slider | Library (Radix) wrap | Already installed; theme to honey tokens |
| Recommended price card | New build | Fraunces serif amount, honey-cream gradient |
| Kai competitor pill | New build | Inline Kai avatar + FIL copy |
| Save CTA | Current — re-skin | `primary-container` fill, voice manual label |

Full table: [`04-reuse-audit.md`](../04-reuse-audit.md)

## 6. Open questions

1. **Competitor benchmark data source**: the handoff hardcodes a competitor price. In production, is this Kai-generated (LLM inference), user-entered, or omitted when no benchmark is available? If omitted when no data, the callout pill should not render (not show empty).
2. **Slider precision**: does the markup slider snap to integers (0–100% in 1% steps) or is finer granularity needed? Affects Radix slider `step` prop.

## 7. Acceptance signal

- Visual parity vs `screenshots/10-costing-honey-fil.png` with current illustration on empty state — pixel diff ≤ 0.5%
- Lighthouse perf ≥ 85 mobile
- Slider recomputes recommended price live on drag; no debounce needed (local state only)
- FIL and EN locale: labels, captions, Kai callout all render correctly
- Reduced-motion: slider still functional; no animation on recommended price update
- Slider thumb touch area ≥ 44×44px (padded, not visually enlarged)
- Empty state shows illustration + "Gawa tayo" copy; no blank card
