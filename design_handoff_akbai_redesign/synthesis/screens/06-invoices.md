# Screen 06 — Mga Invoice (`/invoices`)

**Verdict:** HYBRIDIZE (per [A7](../02-decisions.md#a-per-screen-verdicts-locked))
**Visual reference:** [current](../screenshots/06-invoices/current-mobile-chrome.png) · [handoff](../../screenshots/11-invoices-honey-fil.png)

## 1. Comparison summary

Current invoices screen has a functional list with status grouping and an established illustration on the empty state. The handoff adds a serif H1 that directly answers the user's real question ("Sinong may utang pa sa'yo?"), two summary tiles (Hinihintay / Late na), and status pills that communicate state at a glance. Same HYBRIDIZE pattern as Costing: adopt handoff layout + summary tiles + status pills + header; keep the current invoice illustration on empty state.

## 2. Synthesized layout

Palette context: `honey`. Route: `/invoices`. Reference: `prototype/components/screen-other.jsx` (`InvoicesScreen`).

**Empty state** (no invoices):
- Existing invoice illustration (KEEP CURRENT — port into the handoff layout column)
- Copy: "Wala ka pang invoices. Gumawa tayo ng una mo!" (voice manual §5)
- CTA "Gawa ng Invoice" (voice manual §9), `primary-container` fill

**Active state**:

Top → bottom:

1. **Screen header** — `IconInvoice` (28px, pending B4 approval; lucide `FileText` fallback) + eyebrow "MGA INVOICE" (10px/800, honey-deep) + Fraunces serif H1 "Sinong may utang pa sa'yo?" (28px/500).
2. **Two summary tiles** side-by-side (`grid-cols-2 gap-3`):
   - **HINIHINTAY** — `surface-container-lowest`, `rounded-xl`, `p-3`. Caption 10px/800 honey-deep. Fraunces amount 24px/600 ink.
   - **LATE NA** — same structure. Amount uses `error` color (`#F87171`) when overdue > 0.
   Each tile: 44px minimum height, full card is tappable (filters list below).
3. **Invoice list** — vertical stack of rows:
   - Row: `surface-container-lowest` card, `rounded-xl`, `p-3`. Left: "INV-####" caption (10px/700, ink-faint) + client name (Fraunces 16px/500, ink) + date (12px/400, ink-soft). Right: amount (Fraunces 18px/600, ink) + status pill below.
   - **Status pills** (3 variants): "Bayad na" = sage fill (`tertiary` token) + white text. "Hinihintay" = honey-pale fill + honey-deep text. "Late na" = error-tint fill + error text.
   - Row minimum height 72px (full-width tappable per mobile-first.md §2).
   - Swipe-to-archive (left): red background + archive icon, 40% threshold, per E2 (KEEP CURRENT swipe gesture).
4. **New invoice FAB** — honey-deep circle, 56×56px, fixed bottom-right (above bottom nav), "+ Gawa ng Invoice". Primary action in thumb zone per `pattern:one-handed-cta-thumb-zone`.

## 3. Decisions table

| Verdict ID | Dimension | Verdict | Rationale |
|---|---|---|---|
| A7 | Invoices layout | HYBRIDIZE | Handoff header + tiles + pills; current illustration on empty |
| B1 | Palette | honey | Non-home screen |
| B2 | Typography | Fraunces | Serif H1 + client name + amount |
| B4 | Icons | DEFER | `IconInvoice` pending; lucide `FileText` fallback |
| E2 | Card swipe | KEEP CURRENT | Swipe-to-archive on invoice rows preserved |
| E3 | Long-press | KEEP CURRENT | Long-press context menu on invoice rows |
| F1 | Touch targets | VERIFY | FAB 56×56px; row min-height 72px |

## 4. Enrichments applied

- `pattern:one-handed-cta-thumb-zone` — FAB in bottom-right above nav; destructive archive behind swipe gesture (not in thumb zone)
- `pattern:filipino-mobile-data-resilience` — invoice list cached on first load; stale-while-revalidate; offline state: "Hindi ma-load ang invoices ngayon — na-save ko yung huli" 
- `pattern:sage-caregiver-trust-recovery` — invoice send failure: "Hindi na-send ang invoice, boss. I-try mo ulit o check ang internet?" (no error code shown)
- `pattern:po-register-calibration` — "po" only when invoice relates to formal business context or the client is referred to formally
- `pattern:varying-kai-expression-by-context` — if Late na tile > 0: a `concerned` Kai bubble appears above the list as a soft nudge ("May utang pa na hindi nababayad — gusto mo bang mag-send ng reminder?")

## 5. Reuse map

| Component needed | Source | Notes |
|---|---|---|
| Invoice data logic | Current — no change | Status, amounts, client fields reused |
| Invoice illustration | Current — port | Show on empty state only |
| Summary tiles | New build | Reuse `feature-tile.tsx` skin |
| Status pills | Current pill primitive re-skin | 3 variants: sage / honey / error |
| Row card | Current list row re-skin | Fraunces client name + amount |
| FAB | New build | Fixed position, honey-deep fill |
| Swipe gesture | Current — no change | 40% threshold, spring-back |

Full table: [`04-reuse-audit.md`](../04-reuse-audit.md)

## 6. Open questions

1. **Late na tile tap action**: tapping the "Late na" summary tile — does it filter the list to overdue-only, or is it purely informational? Needs product decision before Phase 3 interaction spec.
2. **Kai nudge bubble threshold**: when does the `concerned` Kai bubble appear — any Late na count > 0, or only when the overdue amount exceeds a threshold (e.g., > ₱5,000)? Needs product + AI engineer alignment.

## 7. Acceptance signal

- Visual parity vs `screenshots/11-invoices-honey-fil.png` with current illustration on empty state — pixel diff ≤ 0.5%
- Lighthouse perf ≥ 85 mobile
- Status pill variants render correctly for all 3 states (Bayad na / Hinihintay / Late na)
- Summary tiles show correct totals from live data
- FIL and EN locale: H1, labels, status pills, empty state copy all render correctly
- Swipe-to-archive gesture functional; confirmation dialog for destructive swipe
- FAB visible above bottom nav on all mobile viewport heights (320px–932px)
- Reduced-motion: swipe physics intact; no animation on status pill color change
