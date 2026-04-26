# Screen 02 — Saan napunta (`/expenses`)

**Verdict:** ADOPT HANDOFF (per [A3](../02-decisions.md#a-per-screen-verdicts-locked))
**Visual reference:** [current](../screenshots/02-expenses/current-mobile-chrome.png) · [handoff](../../screenshots/07-saan-honey-fil.png)

## 1. Comparison summary

Current expenses screen is functional and clean but reads as a budgeting form — time-range pills, flat list, basic chart. The handoff replaces this with a money-story layout: donut + delta, category progress bars, banig 7-day chart, and a Kai callout paper-note that converts the screen from a passive report into an active reflection. The current month-picker logic is solid; keep it as the data-layer contract only.

## 2. Synthesized layout

Palette context: `honey`. Route: `/expenses`. Reference: `prototype/components/screen-saan.jsx`.

Top → bottom (scrollable column, `max-w-[760px]`, `px-4 py-6 pb-24`):

1. **Screen header** — icon `IconPera` (28px, pending B4 approval) + eyebrow "SAAN NAPUNTA ANG PERA?" (10px/800, honey-deep, letter-spacing 0.08em) + Fraunces serif H1 "Heto kung saan napunta ang pera mo." (28px/500).
2. **Time-range pills** — `Linggo / Buwan / Buong Taon`. `Buwan` default active (honey-deep fill). Tap switches data range. Current's month-picker date logic powers the data fetch behind these pills.
3. **Total card** — white card (`surface-container-lowest`). Left: donut chart (total inside, Fraunces 22px, "TOTAL" caption). Right: "GASTOS · NGAYONG BUWAN" + Fraunces 28px amount + delta line (↗ +X% kaysa nakaraang buwan, sage on positive). Below donut: "Kita: ₱Xk" sage green + "Tubo: ₱Xk" honey-deep.
4. **Category breakdown** — "BAWAT KATEGORYA" eyebrow + active month label right. List of up to 5 rows: `expense-categories/` icon (existing SVG set, keep as-is) + name left, peso + % right, 6px progress bar below in category color. `pattern:one-handed-cta-thumb-zone` — each row 56px min height for tap.
5. **Kai callout** — `<PaperNote>` (`pattern:paper-note-asymmetric-corners`) with mini Kai avatar (24px, `concerned` or `happy` per `pattern:varying-kai-expression-by-context`) + Fraunces italic 14px insight question. Copy follows voice manual §2 and `pattern:hooked-variance-coach-not-casino`.
6. **7-day daily chart** — "PANG-ARAW-ARAW" eyebrow + "7 araw" right. Banig-textured stacked bars (same `BanigBarChart` component as home Kuwento card). Peak-day `Sampaguita` marker (pending B4 approval) + honey-deep day label. `pattern:media-hand-me-down-baseline` — chart renders via Recharts custom `<Bar>` shape, not raw divs, for frame budget compliance.

**Empty state** (no transactions): "Wala ka pang naka-log na gastos. I-try mo ang Resibo Scanner?" — per voice manual §5, action-oriented. Shows `BanigBarChart` skeleton only.

## 3. Decisions table

| Verdict ID | Dimension | Verdict | Rationale |
|---|---|---|---|
| A3 | Expenses layout | ADOPT HANDOFF | Full replace; data layer (month picker) reused only |
| B1 | Palette | honey | Non-home screen |
| B2 | Typography | Fraunces serif | H1 + KPI amounts in Fraunces |
| B4 | Icons | DEFER | `IconPera`, `Sampaguita` pending repo approval; lucide fallback until approved |
| D1 | Kai callout copy | KEEP CURRENT | Voice manual overrides handoff strings |
| D2 | Empty state | KEEP CURRENT | "Wala ka pang gastos" + scanner CTA |
| F3 | Contrast | VERIFY | honey-deep × honey-cream on progress bars needs WCAG AA verification |

## 4. Enrichments applied

- `pattern:paper-note-asymmetric-corners` — Kai callout uses `PaperNote` primitive
- `pattern:varying-kai-expression-by-context` — Kai avatar in callout: `concerned` when spending +15% vs prior period; `happy` when tubo positive
- `pattern:hooked-variance-coach-not-casino` — callout insight rotates across Energetic / Observant / Celebratory registers
- `pattern:po-register-calibration` — "po" only if insight touches BIR amounts or VAT threshold proximity
- `pattern:media-hand-me-down-baseline` — banig chart via Recharts, not raw divs; image budget enforced
- `pattern:filipino-mobile-data-resilience` — expense list cached on first load; stale-while-revalidate; delta pill shows "sa nakaraang buwan" framing
- `pattern:one-handed-cta-thumb-zone` — category rows are full-width tappable; no action in top 20%

## 5. Reuse map

| Component needed | Source | Notes |
|---|---|---|
| Month picker logic | Current — data-layer only | No UI change; drives time-range pills |
| Category icons | Current `expense-categories/` SVGs | Keep as-is, no changes |
| `BanigBarChart` | New build (shared with home) | Recharts custom Bar shape |
| `PaperNote` | New build Phase 4 | `frontend/src/components/ui/paper-note.tsx` |
| Donut chart | Library (Recharts) wrap | New implementation |
| Progress bar rows | New build | Category breakdown row component |

Full table: [`04-reuse-audit.md`](../04-reuse-audit.md)

## 6. Open questions

1. **Category colors**: the handoff uses literal hex tints per category (Paninda = honey, Kuryente = orange-deep, etc.). Are these sourced from the existing `EXPENSE_CATEGORIES` data in `frontend/src/lib/expenses/categories.ts`, or do they need a color field added to that registry?
2. **Donut chart library**: Recharts `<PieChart>` or Visx? Confirm with engineer before Phase 3 to avoid parallel chart installs.

## 7. Acceptance signal

- Visual parity vs `screenshots/07-saan-honey-fil.png` — pixel diff ≤ 0.5% mobile-chrome viewport
- Lighthouse perf ≥ 85 mobile
- Time-range pill switch re-fetches data and updates donut + bars + category list
- Both FIL and EN locale render (month label, category names, Kai callout copy)
- Empty state shows "Wala ka pang naka-log" copy + scanner CTA, not blank
- Reduced-motion: banig bars render without animation; peak-day drop-shadow still present
- Kai callout paper-note absent until data loads (no skeleton needed — omit callout, not show empty note)
