# AKBai — Design System Specification: The Art of Warmth
> Used by: ux-designer, fullstack-engineer, marketing-lead
> Last updated: 2026-05-30 (Warm Precision Evolution note added — light-mode merged PR #42; §3 numbers/Display weight rules superseded, §2 stale dark hex flagged. Authoritative detail: `warm-precision-implementation-spec.md` + ADR-021) | Prior: March 2026 | Source: DESIGN.md v1.0
> This is the authoritative visual design specification. When in conflict with other files, this file wins.

---

## 1. Creative North Star: "The Sun-Drenched Atelier"

This design system rejects the clinical coldness of modern SaaS. Instead, it embraces "Cafe Energy" — the feeling of a premium, light-filled space where intentionality meets comfort. We move beyond the "template" look by treating the browser as a physical desk: elements aren't just "placed," they are curated.

To achieve this, we leverage **Intentional Asymmetry** and **Tonal Depth**. We avoid rigid, boxed-in grids in favor of overlapping elements and generous "Breathing Room" (Scale 12+). The goal is a digital experience that feels bespoke, airy, and editorial — less like a software tool and more like a high-end lifestyle journal.

**Default theme is Light.** Dark mode is available as a user preference toggle.

### Why Warmth Is Load-Bearing — Don Norman's Three Layers
<!-- Phase 1 research, 2026-04-25. Source: jnd.org "Emotion & Design — Attractive Things Work Better" via NotebookLM -->

Warmth in AKBai is not decoration; it does measurable UX work across three layers Norman identified:

- **Visceral (pre-cognitive, ~200ms):** The honey palette + Kai mark + paper-note tilt + ambient amber shadows trigger an immediate positive affective reaction *before* the user has cognitively processed what the screen does. For a Filipino MSME owner approaching tax/bookkeeping (which the corpus characterizes as "fear, anxiety, dread"), this layer transforms an intimidating task into a welcoming first impression.
- **Behavioral (in-task):** Norman's heretical finding — *"pleasing things work better, are easier to learn, and produce a more harmonious result"* — applies directly. A positive affective state increases users' "tolerance for minor difficulties and blockages." When Resibo Scanner OCR misreads a receipt or a category needs manual fix, an aesthetically warm UI buys forgiveness that a sterile UI cannot.
- **Reflective (long-term):** Localized warmth lets the user form a conscious, positive attachment. The user doesn't *tolerate* AKBai because they have to; they *like* it. This is the layer that drives 30-day retention.

**Design implication:** Every warmth choice (palette, illustration vocabulary, micro-animations, paper-note treatments) is a retention investment. Don't let a future cost-cut sprint strip them out as "nice-to-have."

---

## ⚡ Warm Precision Evolution (2026-05-30) — read before this doc's older sections

The "Art of Warmth / Sun-Drenched Atelier" direction below was **evolved into "Warm Precision"** and merged light-mode to `main` (PR #42, commit 8499463). The philosophy is unchanged (warmth is load-bearing), but several concrete rules in §2–§5 are now superseded. **The authoritative detail lives in `skills/solutions-architect/references/warm-precision-implementation-spec.md` (full token map, `<Money>`, typography, elevation, nav-FAB, component specs) and ADR-021.** This note summarizes the deltas; the full token table below is NOT rewritten — defer to the impl spec.

**Scope:** light-mode only. The dark reroot is a separate, deferred workstream — the dark hex column in §2 is pre-Warm-Precision and partly stale (see correction below).

**Deltas (all verified against `frontend/src/app/globals.css` `:root`):**

- **Light-first cream retune.** Surface is now `#fdfaf4` (cooler-neutral paper; was `#fdf9f2`). The whole surface ladder retuned: `surface-container-low #f8f4ec`, `surface-container #f2ede4` (Level-1 card bg), `surface-container-high #ece7dd`, `surface-container-highest #e7e1d6`. Ink warmed: `on-surface-variant`/`ink-soft #5b4a38`, `ink-faint #8a7558`.
- **`secondary-container` role change → pale honey `#fef3d9`** (was the saturated orange `#fe932c`). New role: soft tile / warm Kai bubble / profit-KPI fill. `tertiary-container` likewise retuned to pale success `#cdeee2`.
- **New tokens:** `on-faint #8a7558` (muted/tertiary ink alias), `tertiary-container #cdeee2`, `error-fill #F87171` (icons/fills only — error TEXT stays `--destructive #ba1a1a`), `error-pale #fde0dc` (overdue tag fill), `outline-input` (`#5b4a38` base, consumed at /32), `ink-scrim` (`#1c1810` base at /45), `sampaguita #ffffff` (motif/chart peak), `scan-ink #0a0f08` (viewfinder), `warning #FBBF24` (deadline amber bar — not red), `grad-from #f5b347` / `grad-to #d97706` (honey gradient stops).
- **Fraunces serif added for Display + greeting/H1** (Plus Jakarta Sans is no longer "exclusive"). Display/H1 drop **weight-800 → 600**. See the §3 correction below.
- **Data-confident numbers (SUPERSEDES the §3 "weight-800" rule):** all financial figures are **tabular-nums, weight-700, teal (`tertiary #006b54`)**, peso-first — centralized in the `<Money>` primitive (`components/ui/money.tsx`). Numbers are no longer weight-800 and no longer "Art."
- **Daylight Elevation (W4):** warm two-layer (never-grey) `el-2`/`el-3` shadows + `card-level-1/2/3` (Level 1 = tone-only, no shadow; Level 2 raised; Level 3 floating white sheet/FAB/toast). **Glass is now restricted to TWO places: the bottom-nav and the scan overlay** — cards/modals/drawers become solid Level-3 sheets (the §2 "Glass & Gradient" rule no longer applies to modals).
- **Nav = 4 tabs + center Scan FAB** (Umaga · Kai · Pera · Iba pa); Scan leaves the tab row as a FAB-launched full-screen overlay.
- **Status tags consolidated on `pill.tsx`** — one 4-state set (positive / pending / overdue / neutral), no parallel tag component.
- **Calm-background principle:** flat "daylight on good paper" surfaces — the legacy photographic `PageBackground` washes are **removed**. One personality element (motif) per screen, max.

---

## 2. Colors: The Amber Spectrum

The palette is anchored in `surface` (#fdf9f2), a cream that feels organic rather than digital.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders for sectioning.
Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section sitting on a `surface` background provides all the separation needed. High-contrast lines create "visual noise" that breaks the airy cafe aesthetic.

### Surface Hierarchy & Nesting
Treat the UI as a series of layered fine papers.
* **Base:** `surface` (#fdf9f2) for the primary page background.
* **Sections:** Use `surface-container-low` (#f7f3ec) to define large content areas.
* **Nesting:** Place a `surface-container-lowest` (#ffffff) card inside a `surface-container-low` section to create a "lifted" focal point without a single drop shadow.

### The "Glass & Gradient" Rule
For key CTAs and hero elements, use the **Warm Honey Gradient** (`primary-container` #f59e0b to `primary` #855300). To maintain the "premium" feel, floating navigation or modals should utilize **Glassmorphism**: apply `surface-container-lowest` at 80% opacity with a `20px` backdrop-blur.

### Color Token Reference

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| surface | #fdf9f2 | #07101e | Page background |
| surface-container-lowest | #ffffff | #030812 | Lifted focal cards |
| surface-container-low | #f7f3ec | #0a1422 | Content sections |
| surface-container | #f1ede7 | #0d1a2e | Cards, containers |
| surface-container-high | #ebe8e1 | #111f36 | Alternate cards |
| surface-container-highest | #e6e2db | #172740 | Highest elevation |
| on-surface | #1c1c18 | #dae3f7 | Primary text |
| on-surface-variant | #534434 | #d8c3ad | Secondary text, labels |
| outline | #867461 | #9a8d7e | Borders when needed |
| outline-variant | #d8c3ad | #534434 | Ghost borders (20% opacity) |
| primary | #855300 | #ffb95f | Primary text/icons on light |
| primary-container | #f59e0b | #f59e0b | CTAs, highlights, badges |
| secondary-container | #fe932c | #663500 | Secondary accents |
| tertiary | #006b54 | #43deb4 | Financial data, success |
| tertiary-container | #1ec89f | #004e3c | Teal accents |
| destructive | #ba1a1a | #ba1a1a | Error states |
| error-container | #ffdad6 | #93000a | Error backgrounds |

> ⚠️ **This table is pre-Warm-Precision.** The **Light column is stale** — the live light tokens are the Warm Precision retune (surface `#fdfaf4`, `secondary-container #fef3d9`, `tertiary-container #cdeee2`, etc. — see the Warm Precision Evolution note above + `warm-precision-implementation-spec.md` for the full map). The **Dark column is also stale and was NOT changed by Warm Precision** (the dark reroot is a separate deferred workstream): the live dark surface is `#0b1525`, not `#07101e`. Do not cite this column's values as current.

---

## 3. Typography: Editorial Authority

We use **Plus Jakarta Sans** exclusively. Its geometric yet friendly curves perfectly mirror our "Rounded Twelve" geometry.

* **Display (lg/md):** Use `weight-800` with tight letter-spacing (-0.02em). These are your "billboard" moments. **⚠️ SUPERSEDED by Warm Precision:** Display + H1 are now **Fraunces serif at weight-600** (not Jakarta weight-800) — see the Warm Precision Evolution note + `warm-precision-implementation-spec.md` §3.
* **Headlines:** Use `on-surface` (#1c1c18 light) at `weight-700`. These should feel like ink on cream paper.
* **Body:** Use `body-lg` for primary reading. Ensure a line-height of at least 1.6 to maintain the "airy" feel.
* **Labels:** Use `label-md` in `on-surface-variant` (#534434 light → now `#5b4a38` under Warm Precision). Small caps can be used sparingly for a more "designed" editorial look.
* **Numbers and data points:** ~~Always `weight-800` to make them feel like "Art."~~ **⚠️ SUPERSEDED by Warm Precision:** financial figures are now **tabular-nums, weight-700, teal (`tertiary #006b54`)**, peso-first — rendered through the `<Money>` primitive (`components/ui/money.tsx`). Numbers are "data-confident," not weight-800 "Art."

---

## 4. Elevation & Depth: Tonal Layering

Traditional grey shadows are prohibited. Depth is achieved through light and warmth.

### The Layering Principle
Hierarchy is created by "stacking" tones.
* **Level 0:** `surface`
* **Level 1:** `surface-container-low`
* **Level 2:** `surface-container-highest`

### Ambient Shadows
When a floating effect is required (e.g., a primary Modal), use an **Amber Glow**:
* **Color:** `primary` at 8% opacity.
* **Blur:** 40px - 60px.
* **Spread:** -5px.
This mimics natural light passing through honey-colored glass.

### The "Ghost Border" Fallback
If a border is strictly necessary for accessibility (e.g., Input fields), use a **Ghost Border**: `outline-variant` (#d8c3ad) at **20% opacity**. Never use 100% opaque lines.

---

## 5. Component Guidelines

### Buttons (The "Honey" Interaction)
* **Primary:** Gradient from `primary-container` to `secondary`. Text is `on-primary` (#ffffff).
* **Secondary:** `surface-container-highest` background with `on-surface` text. No border.
* **Shape:** Always `DEFAULT` (0.5rem/8px) or `xl` (1.5rem) for a pill-like feel.

### Cards & Lists
* **Forbid Divider Lines.** Separate list items using `spacing-4` (1.4rem) or subtle background shifts between `surface-container-low` and `surface-container-lowest`.
* **Card Hover:** On hover, transition the background from `surface-container-lowest` to a subtle gradient and increase the **Ambient Shadow** spread.

### Input Fields
* **Style:** Minimalist. Only a bottom "Ghost Border" or a fully flooded `surface-container-low` background.
* **Focus State:** The border transitions to `primary-container` (#f59e0b) with a 2px soft outer glow.

### Navigation (Glassmorphism)
* **Top bar:** Floating with `backdrop-blur-[20px]`, `surface-container-lowest` at 80% opacity, `xl` corner radius, amber ambient shadow.
* **Bottom nav:** Same glassmorphism treatment. Active tab uses `primary-container` gradient. Inactive uses `on-surface-variant`.

### Illustrations (`IllustrationWrapper`)

All illustrations use WebP images served from `/public/illustrations/` via the `IllustrationWrapper` component at `components/illustrations/IllustrationWrapper.tsx`.

**Categories and default sizes:**
| Category | Size | Use for |
|----------|------|---------|
| `hero` | 600x338 | Landing page hero images |
| `onboarding` | 300x300 | Onboarding wizard steps |
| `empty-state` | 240x180 | Empty states (no data yet) |
| `status` | 200x150 | Error, offline, session expired |
| `celebration` | 280x210 | Achievement milestones |

**Usage pattern:**
```tsx
import { IllustrationWrapper } from '@/components/illustrations/IllustrationWrapper';

<IllustrationWrapper
  src="empty-states/no-expenses.webp"
  alt="Wala pang gastos o kita na naka-record"
  category="empty-state"
/>
```

**Rules:**
- Always use conversational Filipino alt text (see conversational-filipino-copy-guide.md)
- Use `category` prop for automatic sizing — avoid custom `width`/`height` unless necessary
- Dark mode handled automatically (`dark:brightness-[0.85] dark:saturate-[0.9]`)
- Don't use Lucide icons for empty states if a WebP illustration exists — illustrations are warmer and more on-brand
- Available illustrations: check `frontend/public/illustrations/` for the full set (37 WebPs across 7 categories)

---

## 6. Decorative Motif Vocabulary
<!-- Phase 1 research, 2026-04-25. Source: NotebookLM "AKBai Filipino MSME Context" notebook (8ee05ad7) — synthesizes COMMUNITY_RESEARCH_REPORT.md, Rest of World sari-sari article, BCG MSME report, plus prior knowledge of Filipino design semiotics. -->

When AKBai needs decorative SVGs, illustrations, dividers, or background patterns (e.g., the redesign's `CapizPattern`, `FloatingPetals`, `WovenDivider`, `Squiggle`, `TapeStrip`), pick from the **inclusive** list. Avoid the **romanticized** list — those motifs read as tourist-board, regional-biased, or politically charged to working-class Filipino MSME owners.

### Use (inclusive, working-class, unisex)

| Motif | Why it lands |
|---|---|
| **Banig** (woven mat) | Universal Filipino household texture. Neutral, working-class, unisex. The redesign's `WovenDivider` zig-zag and the banig-textured 7-day chart in the home weekly story trade on this. |
| **Capiz shell** | Heritage windowpane texture. Subtle pearlescent grid works in modern minimal design without screaming "ethnic." |
| **Sampaguita** (national flower) | Kept *small* (peak-day marker, time-of-day pill leading icon) and *not garlanded*. Everyday, not feminine-coded. |
| **Paper-note + masking tape** | Source-grounded: sari-sari owners track utang in notebooks (Rest of World); FB sellers tape receipts. Asymmetric `4px 12px 4px 12px` radius and `rotate(-1.2deg)` mimic an actual taped index card. |
| **Sachet / tingi** | Visualizes the micro-pack working-class economy. Future motif for tier visualizations. |
| **Yero** (corrugated iron roofing) | Utilitarian, hustle-coded. Useful as a subtle background texture; recognizable to urban + rural Filipinos. |
| **Squiggle** (single hand-drawn underline) | One per screen, never multiple. Reviewer-approved emphasis; reads as warmth without precious. |

### Avoid (romanticized, regional-biased, or politically charged)

| Motif | Why it doesn't land |
|---|---|
| **Bahay-kubo** | Feels rural-tourist-board; disconnected from the urban / peri-urban reality of today's digital MSMEs. |
| **Fiesta tropes / banderitas** | Too busy, too seasonal, too unserious for a tax/bookkeeping tool. |
| **Saint imagery / Catholic icons** | Alienates non-Catholic users. AKBai is a secular professional tool. |
| **Specific regional textiles** (Inabel, T'nalak, Yakan, etc.) | Risks excluding users from other regions. AKBai is national; design should not skew toward any one heritage tradition. |
| **National flag colors as primary accents** | Politically charged. Honey palette is the brand; flag motifs read as slogan-y. |
| **Bayanihan-house / fiesta-people scenes** | Cliché Filipino-illustration tropes; feels like marketing collateral, not a tool. |

### Decorative SVG implementation rules

- All decorative motifs are inline SVG (no extra HTTP requests).
- All decorative motion (`petal-drift`, `kai-bob`, `slide-up`) is gated behind `prefers-reduced-motion: no-preference`. Layout intact when motion disabled.
- Density rule: **one squiggle per screen, max.** One ambient layer (petals OR capiz, not both) per screen, max. Reviewer feedback was explicit: "too many of these squiggle lines" / "too many icons going on."
- Combined image budget for decorative SVGs ≤ 200KB on cold home load (Filipino prepaid-data reality — see `mobile-first.md` §1).

---

## 7. Do's and Don'ts

### Do
* **Do** use asymmetrical margins. If the left margin is `spacing-12`, try a right margin of `spacing-24` for editorial layouts.
* **Do** prioritize `Plus Jakarta Sans` at `weight-800` for numbers and data points.
* **Do** use `spacing-20` (7rem) between major sections to let the design breathe.

### Don't
* **Don't** use pure black (#000000). Use `on-surface` (#1c1c18) for headlines and `on-surface-variant` (#534434) for body text.
* **Don't** use 1px solid borders to "box in" content.
* **Don't** use standard grey drop shadows. If it doesn't have a hint of amber/warmth, it doesn't belong.
* **Don't** use cold greys for backgrounds. Always warm tones.
