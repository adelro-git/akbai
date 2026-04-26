# Handoff: AKBai Redesign

This handoff covers the **home screen redesign in detail**, plus the surrounding screens that share the same design language and are in scope to be ported with equal fidelity. The home screen is the canonical reference for tokens, type, and motion — every other screen reuses those decisions.

## Screenshots

Reference renders of the prototype, captured from the actual prototype HTML.

### Home (primary scope)

| File | What it shows |
|---|---|
| `screenshots/01-home-honey-fil-andoy.png` | **Desktop, honey palette, Filipino, Andoy persona** — the full landing view with the AKBai sidebar visible. This is the canonical reference shot. |
| `screenshots/02-home-honey-fil-mobile.png` | **Mobile, honey palette, Filipino** — same screen at <860px width, sidebar collapsed, action grid stacks to 2 columns, hero stacks vertically (Kai mark above greeting copy). |
| `screenshots/03-home-honey-en.png` | **Desktop, honey palette, English** — same layout, English copy. Useful for verifying that nothing breaks on the longer/shorter English strings (`What would you like to do?` vs `Anong gagawin natin?`, etc.). |
| `screenshots/04-home-dawn-fil.png` | **Desktop, dawn palette, Filipino** — alternate palette variant (peachy / coral honey). Tile background tints stay the same since they use literal hex values, not palette tokens — that's intentional, the tile chips are part of the brand vocabulary. |

### Other screens (also in scope)

These screens are documented in less detail below, but they're hi-fi designs and should be ported with the same care as the home screen. They reuse all of the home screen's tokens, type scale, and chrome (sidebar, mobile nav, persona switcher).

| File | Screen | Purpose |
|---|---|---|
| `screenshots/06-chat-honey-fil.png` | **Kausap (Chat with Kai)** | Conversational interface — message thread, suggested-question chips, composer with attach button. Empty state shown. |
| `screenshots/07-saan-honey-fil.png` | **Saan napunta ang pera? (Expense dashboard)** | Money story screen — total spend donut, category breakdown bars, Kai callout, 7-day spend chart. |
| `screenshots/08-scan-honey-fil.png` | **Scan (Receipt capture)** | Camera-style full-bleed dark UI with corner brackets, sample receipt preview, large shutter button. |
| `screenshots/09-deadlines-honey-fil.png` | **BIR Deadlines** | Tax deadline list with date chips, form codes (2551Q, 1701Q, etc.), urgency state on the next-due item, Kai pre-deadline callout. |
| `screenshots/10-costing-honey-fil.png` | **Pricing / Costing** | Product cost + markup slider → recommended price card with competitor benchmark callout from Kai. |
| `screenshots/11-invoices-honey-fil.png` | **Mga Invoice (Invoices)** | Outstanding-vs-late summary tiles, invoice list with status pills (Bayad na / Hinihintay / Late na). |
| `screenshots/12-checkin-honey-fil.png` | **Daily Check-in** | 30-second mood + energy + freeform-note form for emotional context Kai uses to tune its tone. |
| `screenshots/13-sundaystory-honey-fil.png` | **Linggong Kuwento (Sunday Story)** | Dark-mode weekly recap — narrative paragraph with inline highlights, KPI grid, share button. The only screen in the app that uses the inverted dark palette; intentional and worth preserving. |

## Overview

This is a redesign of the **AKBai home screen** — the main landing tab of the AKBai app (a Filipino-language accounting/financial assistant for SMBs and freelancers). The redesign moves the home screen from a generic dashboard feel toward a warm, illustration-aligned "kumustahan" (greeting/check-in) layout that matches Kai's brand voice and the existing landing-page artwork.

The redesign covers four discrete zones of the home screen:

1. **Kumustahan** — hero greeting with the Kai brand mark, a time-aware salutation, and Kai's daily check-in invite presented as a tilted paper note.
2. **Quick actions** — five feature tiles ("Anong gagawin natin?") in a responsive grid, each with a single icon, title, and subtitle.
3. **Kuwento ng Linggo** — weekly money story card with a narrative line, three KPI tiles (Kita / Gastos / Tubo), a banig-textured 7-day stacked bar chart, and a paper-note takeaway from Kai.
4. **Closing** — a single "— Kai" sign-off.

Two ambient elements span the screen: a subtle `CapizPattern` SVG background behind the hero, and a low-density `FloatingPetals` animation. A `WovenDivider` (banig-style zig-zag dashes) separates the action grid from the weekly story.

## About the Design Files

The files in `prototype/` are **design references created in HTML** — a working React-on-Babel prototype showing the intended look and behavior. They are **not production code to copy directly**. The task is to **recreate this design in the AKBai codebase** using its existing React + TypeScript + Tailwind/CSS conventions, component library, and routing. Match the layout, typography, color usage, copy, and interaction patterns — but use the codebase's own primitives (Button, Card, etc.), iconography pipeline, and state management.

If a piece of the prototype duplicates something already in the codebase (e.g. a tile button, a pill component), prefer the codebase's existing version and re-skin it rather than introducing a parallel implementation.

## Fidelity

**High-fidelity (hifi).** All colors, typography, spacing, copy, and interaction details below are final and should be implemented pixel-accurately. Use the exact hex values, font sizes, and animation durations listed in [Design Tokens](#design-tokens).

The one piece that is intentionally loose is the **bar chart's banig texture** — the prototype hand-rolls it with stacked `<div>` segments and CSS gradients. Reproduce the visual effect (stacked weave-textured blocks, subtle 45° hatch overlay, peak day highlighted in deeper honey), but feel free to use the team's existing chart library (Recharts, Visx, etc.) plus a custom `<Bar>` shape if that's cleaner than raw divs.

---

## Screens / Views

The **home screen** is the canonical, fully-specified deliverable below. The other screens (Kausap, Saan, Scan, Deadlines, Costing, Invoices, Drafts, Check-in, Linggong Kuwento) are also in scope and should be built with the same care — they reuse all of the home screen's tokens, type, motion, and chrome. See [Other Screens — Detail](#other-screens--detail) near the end of this doc for per-screen notes.

### HomeScreen (route `/` or `/umaga`)

### Layout

- Outer container: vertically scrollable, `flex: 1; overflow: auto; position: relative`.
- Inner column: `max-width: 760px`, centered (`margin: 0 auto`), `padding: 24px 20px 48px`, vertical stack with `gap: 18px`.
- All sections share this column. The page background comes from the global app gradient (radial honey-cream, see [Design Tokens](#design-tokens)).
- `<FloatingPetals>` is absolutely positioned over the whole scroll container, `pointer-events: none`.

### Section 1 — Kumustahan (Hero)

A relatively positioned block, `min-height: 200px`, with a `CapizPattern` SVG absolutely positioned at `inset: 0; opacity: 0.18; pointer-events: none` as the background.

Inner flex row, `align-items: center; gap: 4px; flex-wrap: wrap`:

- **Kai brand mark** (left): 168×168 box, `flex-shrink: 0`, `margin-top: -4px; margin-left: -8px`. Wraps an `<img src="kai-mark.png">` in a circle (`border-radius: 50%; overflow: hidden`) with `drop-shadow(0 4px 14px rgba(168,120,40,0.22))`. Bobs gently via the `kai-bob` animation (see [Animations](#animations--transitions)).

- **Greeting block** (right): `flex: 1; min-width: 240px; padding-top: 12px`. Stack:
  1. **Time-of-day pill**: inline-flex, gap 6, font-size 11, weight 800, letter-spacing 0.12em, uppercase, color `--honey-deep`. Background `rgba(255,255,255,0.55)`, padding `4px 10px`, `border-radius: 999px`, `white-space: nowrap`. Leading 11px sampaguita SVG icon.
     - Time-aware copy (Filipino / English):
       - `< 11:00` → "Magandang umaga" / "Good morning"
       - `< 14:00` → "Kumusta na, tanghali na" / "How's the day going"
       - `< 17:00` → "Merienda break?" / "Afternoon check-in"
       - `< 20:00` → "Magandang hapon" / "Good evening"
       - else → "Magandang gabi" / "Good evening"
  2. **Name line**: serif (Fraunces), 30px, weight 500, line-height 1.1, letter-spacing -0.02em, color `--ink`, margin-top 8. Renders the persona's first name + comma (e.g. `Andoy,`).
  3. **Question line**: serif, 26px, weight 500, italic, line-height 1.15, margin-top 2. Color `--honey-deep`. Copy: `kumusta ka?` / `how are you?`. **A single hand-drawn `<Squiggle>` underline** sits absolutely at `left: 0; right: 0; bottom: -6` — width 120 (FIL) / 130 (EN), color `#e89b2f`, stroke 2.2px. **This is the only squiggle on the screen** — do not add more.
  4. **Kai's check-in note** (paper-note button, see below). Margin-top 22.

#### Kai's check-in note (button)

A `<button>` styled as a tilted index card:

- `background: #fffdf5`
- `border: 1.5px solid rgba(232, 155, 47, 0.35)`
- `border-radius: 4px 12px 4px 12px` (asymmetric — gives the torn-paper feel)
- `padding: 14px 16px 12px`
- `width: 100%; max-width: 360px`, left-aligned text
- `transform: rotate(-1.2deg)`
- `box-shadow: 0 6px 14px -4px rgba(168,120,40,0.18), 0 1px 0 rgba(232,220,192,0.6)`
- Hover: `transform: rotate(-0.4deg) translateY(-2px)` and a deeper shadow. Transition 0.2s on transform + box-shadow.

**Tape strip** sits absolutely on top of the card: a 64×18 strip at `top: -9px; left: 30%; transform: translateX(-50%) rotate(-3deg)`, with `background: linear-gradient(180deg, rgba(245,179,71,0.45), rgba(245,179,71,0.25))`, top + bottom 1px borders in `rgba(232,155,47,0.5/0.4)`, and a subtle `0 1px 3px rgba(168,120,40,0.15)` shadow. `pointer-events: none; z-index: 2`.

Card content:

1. Eyebrow label: 10px, weight 800, color `--honey-deep`, letter-spacing 0.12em, uppercase, `white-space: nowrap`. Copy: `Mensahe ni Kai` / `A note from Kai`.
2. Body line: serif, 15px, weight 500, italic, color `--ink`, line-height 1.4. Copy:
   - FIL: `"Ready ka na bang mag-check-in? Pang-{streak} araw na natin 🌼"`
   - EN: `"Ready for today's check-in? Day {streak} together 🌼"`
   - The streak number is **bold** (`<b>{streak}</b>`). Hardcoded to `12` in the prototype; pull from real data in production.
3. CTA: 11.5px, weight 800, color `--honey-deep`, margin-top 8, with a trailing `→`. Copy: `Buksan` / `Open`.

Click action: navigate to the daily check-in screen (route `checkin` in the prototype's screen state).

### Section 2 — "Anong gagawin natin?" (Action grid)

**Section header** — flex row, baseline-aligned, `gap: 12; margin-top: 6; margin-bottom: -4`:

- Single label: serif, 18px, weight 600, color `--ink`, letter-spacing -0.01em, `white-space: nowrap`. Copy: `Anong gagawin natin?` / `What would you like to do?`. **No squiggle, no underline.** Reviewer feedback was explicit: only one squiggle per screen, and it lives under "kumusta ka?".

**Grid** — CSS grid, `grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12; margin-top: 8`.

**Five tiles**, in this order. Each is a `<button class="feature-tile-illo slide-up squish-on-hover">`:

| id | FIL title | FIL sub | EN title | EN sub | Icon | tint (background) | route |
|---|---|---|---|---|---|---|---|
| `scan` | Scan resibo | Kuhanan ng litrato | Scan a receipt | Snap a photo | `IconResibo` | `#fef3d9` | `scan` |
| `usap` | Kausapin si Kai | Magtanong tungkol sa pera | Talk with Kai | Ask about your money | `IconUsap` | `#fde9d4` | `chat` |
| `deadlines` | BIR paalala | 2 deadline sa linggo | BIR reminders | 2 deadlines this week | `IconKalendaryo` | `#fceadd` | `deadlines` |
| `precio` | Tamang presyo | I-check ang pricing | Right pricing | Check your pricing | `IconPrecio` | `#fef3d9` | `costing` |
| `invoice` | Mga invoice | 3 pending, 1 overdue | Invoices | 3 pending, 1 overdue | `IconInvoice` | `#f4ecdb` | `invoices` |

Tile structure (top-to-bottom):

1. **Single icon** at `size={42}`, `position: relative; z-index: 1`. **Important**: the prototype previously had decorative SVG "motif" corners (fluttering receipt, chat bubbles, calendar leaf, stacked coins, paper stack) on each tile *in addition to* the icon. **These have been removed** per reviewer feedback ("too many icons going on"). Each tile now has exactly one icon.
2. **Title** — `feature-tile-title` class — weight 800, 14.5px, color `--ink`, letter-spacing -0.01em, line-height 1.25.
3. **Subtitle** — `feature-tile-sub` class — 12px, color `--ink-soft`, line-height 1.4, weight 600.

Title + subtitle wrap in a `<div>` with `display: flex; flex-direction: column; gap: 3; position: relative; z-index: 1; width: 100%`.

Each tile staggers its slide-up animation with `animation-delay: ${60 + i * 40}ms`.

**`squish-on-hover` behavior**: scale slightly down on press, very quick (~80ms) — see prototype CSS for exact timing.

Click: navigate to the tile's `to` route.

### Section 3 — Woven divider

A `<WovenDivider>` block with `margin-top: 8`:

- Centered flex container, padding `4px 0`, opacity 0.55, `aria-hidden="true"`.
- Inner SVG is `width="100%"; height="10"; viewBox="0 0 400 10"; preserveAspectRatio="none"`.
- 32 line segments, each 7px wide horizontally, alternating slope: even index goes `(x, 2) → (x+7, 8)`, odd index goes `(x, 8) → (x+7, 2)`. Stroke `#b06410`, width 1.2, linecap round, opacity 0.55.

This replaces an earlier sampaguita-flower garland that reviewers flagged as too feminine. The banig zig-zag reads as neutral textile.

### Section 4 — Kuwento ng Linggo (Weekly story card)

A `home-card slide-up` (`animation-delay: 300ms`), padding 22, `overflow: hidden`, `cursor: pointer`, relative position. Click anywhere → navigate to `saan` route.

**Header row** — flex justify-between, margin-bottom 10:

- Left: `IconPera` at 28px + a stacked label.
  - Eyebrow: 10.5px weight 800, color `--honey-deep`, letter-spacing 0.12em, uppercase. `Kuwento ng Linggo` / `This Week's Story`.
  - Title: serif 18px weight 600, color `--ink`, letter-spacing -0.01em, margin-top 2. `Saan napunta ang pera?` / `Where did the money go?`.
- Right: `pill pill-sage` with copy `↗ +12%`, font-size 11, weight 800.

**Narrative line** — serif 19px weight 500, color `--ink-soft`, line-height 1.4, letter-spacing -0.01em, max-width 540, margin-top 10, margin-bottom 18.

- FIL: `Nakaipon ka ng {profit} ngayong linggo.`
- EN: `You saved {profit} this week.`
- The `{profit}` value is wrapped in a `<span>` with color `--honey-deep`, weight 600, `white-space: nowrap`. **No squiggle under it** (was removed per reviewer feedback).

**KPI grid** — 3 columns, no internal gaps; `border: 1px solid rgba(232,220,192,0.7); border-radius: 14; overflow: hidden; background: rgba(255,251,240,0.6); margin-bottom: 20`.

Each cell: padding `12px 10px`, text-align center, border-right `1px solid rgba(232,220,192,0.7)` on cells 1 and 2 (not 3).

| index | label | value | highlighted |
|---|---|---|---|
| 0 | KITA / REVENUE | `pesoShort(p.stats.revenue)` | no |
| 1 | GASTOS / EXPENSES | `pesoShort(p.stats.expenses)` | no |
| 2 | TUBO / PROFIT | `pesoShort(p.stats.profit)` | **yes** |

- Cell label: 9.5px, weight 800, color `--ink-faint`, uppercase, letter-spacing 0.08em.
- Cell value: serif, weight 600, margin-top 4. Highlighted cell uses 22px and color `--honey-deep`; others use 19px and color `--ink`. Highlighted cell also gets `background: linear-gradient(180deg, transparent, rgba(253,232,160,0.45))`.

**Bar chart subhead** — flex justify-between, margin-bottom 10:

- Left label: 10.5px weight 800, color `--ink-faint`, letter-spacing 0.08em, uppercase. `Pang-araw-araw na kita` / `Daily revenue`.
- Right label: 10.5px weight 700, color `--ink-faint`. `7 araw` / `7 days`.

**Banig-textured stacked bar chart** — flex row, align-items: flex-end, justify-between, height 96, gap 6, padding `0 2px`, with a subtle floor shadow gradient: `linear-gradient(180deg, transparent 0%, transparent 90%, rgba(168,120,40,0.12) 100%)`.

For each of 7 days (Mon–Sun, labels `M T W Th F Sa Su`):

- Source data: `WEEK_DATA[persona]` — array of 7 objects with `{rev}` field. If absent, fall back to randomized values.
- `maxVal = Math.max(...weekData.map(d => d.rev || 0), 1)`.
- `h = max(14, (val / maxVal) * 86)` — bar pixel height.
- `segments = max(2, floor(h / 14))` — number of stacked weave segments.
- Peak day (`val === maxVal`) gets:
  - `filter: drop-shadow(0 2px 4px rgba(200,123,20,0.35))`
  - Brighter colors (see below)
  - A 10px sampaguita SVG icon absolutely positioned 18px above the bar, centered.
  - Day label below uses color `--honey-deep` instead of `--ink-faint`.

**Bar segment styling** (each of `segments` divs, rendered bottom-up via `flex-direction: column-reverse; gap: 1.5`):

```css
flex: 1;
min-height: 8px;
background:
  /* highlight sweep */
  linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%),
  /* 45° weave hatch */
  repeating-linear-gradient(45deg,
    rgba(255,255,255,0.12) 0 2px,
    transparent 2px 4px),
  /* base color, with the topmost segment getting the lighter shade */
  linear-gradient(180deg, ${j === segments-1 ? topColor : baseColor}, ${baseColor});
border-radius: ${j === segments-1 ? '5px 5px 0 0' : '0'};
border: 1px solid rgba(168,120,40,0.18);
border-bottom: ${j === 0 ? '1px solid rgba(168,120,40,0.18)' : 'none'};
box-shadow: inset 0 1px 0 rgba(255,255,255,0.25);
```

Colors:

- Peak: `baseColor = #e89b2f`, `topColor = #fbd672`
- Other days: `baseColor = #f0c878`, `topColor = #fde8c0`

Day label: 10.5px, weight 800, letter-spacing -0.01em, margin-top 6 (via parent flex gap 6).

> **Note:** This chart was explicitly approved by the reviewer ("Bar chart looks good. Let's keep this look and feel"). Preserve the textural quality — it's a deliberate brand element, not a default chart.

**Kai's takeaway note** — paper-note style, like the kumustahan check-in but smaller and tilted differently:

- Margin-top 22, padding `14px 16px 12px`
- `background: #fffdf5`
- `border: 1.5px solid rgba(232,155,47,0.28)`
- `border-radius: 4px 12px 4px 12px`
- `transform: rotate(-0.6deg)`
- `box-shadow: 0 4px 12px -4px rgba(168,120,40,0.15)`
- Tape strip on top: same component as the kumustahan note, but `rotate=2`, `top=-9`, `left=22%`.

Inside: flex row, gap 10, align-items flex-start.

- Left: 32px `<Kai expression="happy" animated={false}/>` avatar.
- Right: serif (Fraunces), 13px, weight 500, italic, color `--ink-soft`, line-height 1.5. Copy:
  - FIL: `"Miyerkules ang pinakamainit — 4pm na-spike ang benta. Pabalik na sana yan next week."`
  - EN: `"Wednesday was your peak — sales spiked at 4pm. Let's try to repeat that next week."`

**Card footer link** — margin-top 14, font-size 12, weight 800, color `--honey-deep`, text-align right, with trailing `→`. Copy: `Buksan ang detalye` / `Open full details`.

### Section 5 — Closing

Centered, padding `20px 20px 0`, color `--ink-faint`, font-size 13, weight 500, italic, `font-family: 'Fraunces', Georgia, serif`. Copy: `— Kai` (em-dash + name only). **No quote, no squiggle.**

The previous version had `"Unti-unti lang, Kai"` with a squiggle underneath — both were removed per reviewer feedback.

---

## Interactions & Behavior

### Animations

| Animation | Where | Properties |
|---|---|---|
| `fade-in` | Outer scroll container | Opacity 0→1, ~300ms |
| `slide-up` | Hero block, action tiles, weekly card | translateY(8px → 0) + opacity 0→1, ~400ms with cubic-bezier ease-out, staggered |
| `kai-bob` | Kai brand mark wrapper | Subtle vertical bob, ~3s infinite, ease-in-out |
| `petal-drift` | `FloatingPetals` spans | translateY from `-20px` to `100vh`, rotation, 14–22s linear, infinite, randomized delays |
| Note hover | Both paper-note buttons | `transform` and `box-shadow` transition 0.2s |
| Tile press | `squish-on-hover` | Brief scale-down on click, ~80–120ms |

The exact `@keyframes` definitions live in the prototype's `styles.css`. Lift them as a starting point.

### Click handlers

- Kumustahan note → `onOpenScreen('checkin')`
- Each action tile → `onOpenScreen(f.to)` per the table in [Section 2](#section-2--anong-gagawin-natin-action-grid)
- Weekly story card (anywhere) → `onOpenScreen('saan')`

### Responsive behavior

- The action grid uses `auto-fill, minmax(160px, 1fr)` — adapts from 1 to 4+ columns based on width.
- The kumustahan row is `flex-wrap: wrap`. On narrow widths (~400px and below), the greeting copy stacks under the Kai mark.
- The weekly card's KPI grid stays at 3 columns; if this is too cramped on phones, consider stacking at <360px width.

### Empty / loading states

The prototype hardcodes data via `PERSONAS[persona]` and `WEEK_DATA[persona]`. In production:

- If weekly data hasn't loaded → render the bar chart skeleton with neutral grey segments and hide the takeaway note + delta pill until data arrives.
- If `streak === 0` (new user) → swap the check-in note copy to an onboarding variant ("Subukan natin ang unang check-in mo!" / "Let's try your first check-in!"). Streak reference falls back to `1`.
- If profit is negative → swap the narrative pill from `pill-sage` (↗ +12%) to a neutral or rose tone (↘) and adjust the takeaway tone to be supportive, not celebratory.

---

## State Management

The prototype's home screen is largely stateless — it reads `persona`, `lang`, and the current time, and calls `onOpenScreen(route)` for navigation. In production:

- `persona` + `lang` come from user profile / app-level state.
- `streak`, `weekData`, `stats` (revenue / expenses / profit), and the takeaway sentence should come from a single weekly-summary API call — likely the same endpoint that powers the `saan` (Where did the money go) detail screen.
- The takeaway sentence is generated server-side (LLM-authored, persona-aware). The prototype's hardcoded Wednesday-spike line is illustrative.
- `tod` (time-of-day) is derived locally from `Date.now()`. Re-derive when the tab regains visibility so a "Magandang umaga" doesn't linger into afternoon.

---

## Design Tokens

These are all defined in `prototype/styles.css` under `:root` (default palette is `cream`; `data-palette="honey"` and `data-palette="dawn"` override key colors). Use the `honey` palette as the default for the home redesign — that's what reviewers signed off on.

### Colors

```css
/* Ink */
--ink:        #2b2317;
--ink-soft:   #5c4a35;
--ink-faint:  #8f7a5e;
--outline:        #e8ddc7;
--outline-soft:   #f0e7d4;

/* Surfaces (honey palette) */
--bg:               #fef4dd;
--bg-top:           #fef6e2;
--bg-bottom:        #f7e6c4;
--surface:          #fffbf0;
--surface-low:      #fde9c3;
--surface-container: #fbddab;

/* Honey (hero color) */
--honey:        #e89b2f;
--honey-bright: #f5b347;
--honey-pale:   #fcebc4;
--honey-deep:   #a1620e;
--honey-cream:  #fef3d9;

/* Sage (accent — used sparingly) */
--sage:       #97b39d;
--sage-deep:  #5a7d62;
--sage-pale:  #e2ebde;
```

The page background is layered:

```css
background:
  radial-gradient(ellipse 120% 80% at 50% 0%, var(--bg-top) 0%, transparent 60%),
  radial-gradient(ellipse 80% 60% at 50% 100%, var(--bg-bottom) 0%, transparent 65%),
  var(--bg);
```

### Typography

- **Sans (default)**: Nunito, with system fallback `'SF Pro Rounded', system-ui, -apple-system, sans-serif`.
- **Serif (display)**: Fraunces, with fallback `Georgia, serif`. Used for greeting lines, card titles, narrative lines, KPI values, and quoted takeaways. Always set `letter-spacing: -0.01em` to -0.02em on display sizes.
- Font weights used: 500, 600, 700, 800. The prototype has no 900s.

### Spacing scale

The prototype mostly uses raw px values rather than a token scale. Common multiples: 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 32, 48. Map these onto your existing spacing tokens (`gap-2`, `gap-3`, `gap-4`, etc. in Tailwind) where they fit; preserve raw values where they don't.

### Border radius

- Cards / container blocks: 14px (also `--r-lg`)
- Pills: `999px`
- Paper-note cards: `4px 12px 4px 12px` (asymmetric, deliberate)
- Bar chart top segments: `5px 5px 0 0`

### Shadows

```css
/* Soft card shadow */
--shadow-soft: 0 1px 2px rgba(76, 51, 21, 0.04), 0 4px 12px -2px rgba(76, 51, 21, 0.08);

/* Paper-note shadow (kumustahan) */
0 6px 14px -4px rgba(168,120,40,0.18), 0 1px 0 rgba(232,220,192,0.6)

/* Paper-note shadow (takeaway) */
0 4px 12px -4px rgba(168,120,40,0.15)

/* Tape strip */
0 1px 3px rgba(168,120,40,0.15)

/* Peak bar drop shadow */
drop-shadow(0 2px 4px rgba(200,123,20,0.35))

/* Kai mark drop shadow */
drop-shadow(0 4px 14px rgba(168,120,40,0.22))
```

---

## Assets

- **`assets/kai-mark.png`** — the Kai brand mark (orange C-swoosh + grey crescent + smiling face on honey background). Sourced from the AKBai repo at `frontend/public/icons/mark-honey.png`. Use the codebase's existing copy of this file — don't import the prototype's. The mark is rendered inside a circular clip (`border-radius: 50%; overflow: hidden`) so the orange square edge is hidden.

### Icons

These are SVG components defined in `prototype/components/icons.jsx`. The codebase likely already has equivalents — match by intent:

- `IconResibo` — receipt
- `IconUsap` — chat / speech bubble
- `IconKalendaryo` — calendar
- `IconPrecio` — price tag
- `IconInvoice` — document / invoice
- `IconPera` — money / coins (used in the weekly story header)
- `Sampaguita` — small 5-petal flower (used in the time-of-day pill at 11px and as a peak-bar marker at 10px)

If the codebase doesn't have these yet, port the SVGs from `prototype/components/icons.jsx` directly — they're brand-aligned line-art icons with hand-drawn warmth.

### Other components from the prototype worth porting or referencing

- **`Kai`** (`prototype/components/kai.jsx`) — the small avatar component used in the takeaway note. Has expressions (`happy`, etc.) and an `animated` prop. Likely already exists in the codebase.
- **`CapizPattern`** — subtle SVG pattern used as the kumustahan background. If not in the codebase, port from the prototype.
- **`WovenDivider`**, **`Squiggle`**, **`TapeStrip`**, **`FloatingPetals`** — defined inline in `prototype/components/screen-home.jsx`. These are home-screen-specific; lift them and place under the home-screen module.

---

## Reviewer feedback already incorporated

For context, this design went through one review cycle. The following changes were already applied — please don't reintroduce the originals:

1. **Squiggles**: previous version had hand-drawn squiggle underlines under the section header, the profit amount in the narrative line, and the closing quote. **All removed except the one under "kumusta ka?"**. Reviewer note: "Too many of these squiggle lines."
2. **Sampaguita garland**: an earlier divider was a string of small white sampaguita flowers. **Replaced with the woven banig zig-zag**. Reviewer note: "Might be too feminine for some users. We want a more all-inclusive view."
3. **Kai illustration**: an earlier hero was a custom SVG ("Kai sitting" with sunburst rays) that drifted from the brand mark. **Replaced with the actual brand mark PNG**, clipped to a circle. Reviewer note: "Kai is not faithful to the logo provided." Always use the canonical brand mark — do not redraw Kai in SVG for the home screen.
4. **Tile decoration**: each action tile previously had both an icon AND a decorative SVG "motif" in the top-right corner (fluttering receipt, chat bubbles, calendar leaf, stacked coins, paper stack). **Motifs removed** — each tile has just the single icon now. Reviewer note: "Too many icons going on."
5. **Bar chart**: explicitly kept as-is. Preserve the banig texture treatment.

---

## Shared Chrome

Every screen renders inside a persistent app shell. Build this once and reuse it; do not re-implement per screen.

### Desktop sidebar (≥ 860px)

Fixed left rail, ~240px wide, on the same honey-cream background as the page. Contents top-to-bottom:

1. **AKBai wordmark** (top-left, ~24px height) — "AKB" in `--ink`, "ai" in `--honey-deep` italic. The small logo dot is the `<KaiSitting>` mark at 22px.
2. **Persona pill** — a rounded card with the persona avatar (initials in a colored circle), persona name (bold), and tagline (small, muted). Tapping opens the persona switcher.
3. **Nav items** — 5 items: `Umaga Mo` (Home), `Kausap` (Chat), `Scan`, `Pera` (Saan), `Higit pa…` (More tools drawer). Each is an icon + label, 14px label, 18px icon. Active state: solid honey gradient pill background, white text. Inactive: transparent, ink text, hover = honey-cream tint.
4. **Bottom of sidebar**: language toggle pills (`Filipino` / `English`), small.

The "Higit pa…" item opens a drawer (slide-in from left or modal sheet) containing: BIR Deadlines, Tamang Presyo (Costing), Mga Invoice, Mga Draft, Daily Check-in, Linggong Kuwento. Each row has a small icon + label + one-line description.

### Mobile bottom nav (< 860px)

The sidebar is replaced by a fixed bottom tab bar. **Only 4 tabs** (vs 5 on desktop): `Umaga`, `Kai` (chat), `Pera` (Saan), `Iba pa` (more drawer). Scan is reachable from the home screen tile or a FAB; it does not get its own tab. Tab labels: 11px, icon: 22px, active = honey-deep label + ink-filled icon, inactive = muted.

### Persona switcher

The persona pill in the sidebar (or the mobile profile header) opens a sheet listing the available personas. Each row: avatar + name + business tagline. Tapping switches `persona` globally; all copy, week data, and Kai's tone update accordingly.

### Background

All screens share the same background gradient (radial honey-cream from top center). The `<FloatingPetals>` ambient layer is **only on the home screen** — do not render it elsewhere. The `CapizPattern` SVG is also home-only.

---

## Other Screens — Detail

Each screen below uses the [Design Tokens](#design-tokens) and the type scale from the home screen. Section headers across the app follow the same pattern: a small icon + ALL-CAPS label in `--honey-deep` (12px, letter-spacing 0.08em), then a serif H1 in `--ink` (Fraunces, 28–32px, weight 500, line-height 1.15). Body copy is sans (Inter or system), 15–16px, color `--ink-soft`.

### Kausap — Chat with Kai

File: `prototype/components/screen-chat.jsx`. Screenshot: `screenshots/06-chat-honey-fil.png`.

- **Top bar**: back chevron — round Kai avatar (32px) — `Kai` (serif, 18px) on top of `● Nandito ako para sa’yo` / `● Here for you` (sage green dot + 12px caption). Kebab menu on the right.
- **Message thread**: vertical scroll. User messages = honey-deep filled bubble, white text, right-aligned, 75% max width, 14px radius (sharper bottom-right corner: 4px). Kai messages = cream-tinted bubble with thin honey border, ink text, left-aligned, 14px radius (sharper bottom-left). 8px gap between consecutive messages from the same speaker; 16px between speaker turns. Avatar (24px) shown only on the first Kai message in a turn.
- **Suggested-question chips**: horizontal scrollable row above the composer. Cream background pill, thin honey border, 13px label, 6px×12px padding. Tap inserts the question and sends. The prototype shows 4 chips: “Saan napunta ang pera ko?”, “Kailan yung BIR deadline?”, “Magkano dapat presyo ng t-shirt?”, “I-record ang gastos”.
- **Composer**: bottom of screen. Camera/attach icon on the left, text input (placeholder `Magtanong kay Kai…` / `Ask Kai…`), send button on the right (honey-deep filled circle, white arrow). Multi-line input grows up to 4 lines then scrolls.
- **Empty state**: thread is blank (as shown in screenshot). The suggested chips and composer are still visible — those are always present.

### Saan napunta ang pera? — Expense dashboard

File: `prototype/components/screen-saan.jsx`. Screenshot: `screenshots/07-saan-honey-fil.png`.

- **Header**: 💰 SAAN NAPUNTA ANG PERA? + serif H1 `Heto kung saan napunta ang pera mo.` / `Here’s where your money went.`
- **Time-range pills**: `Linggo` / `Buwan` / `Buong Taon` (Week / Month / Year). `Buwan` is default-active (honey-deep pill).
- **Total card**: large white card. Left: donut chart, total amount inside (`₱89.3K`, serif, 22px, with `TOTAL` caption above). Right: GASTOS · NGAYONG BUWAN caption + `₱89,300` (serif, 28px) + `↗ +4.1% kaysa nakaraang buwan` delta line. Below: `Kita: ₱124.7K` and `Tubo: ₱35.4K` in small captions (kita = sage green, tubo = honey-deep).
- **Category breakdown**: “BAWAT KATEGORYA” caption + `Nob 2025` on the right. List of 5 rows, each: small category icon + name on the left, peso amount + `%` on the right, full-width progress bar below in the category color (Paninda = honey, Kuryente/Tubig = orange-deep, Upa = sage, Pamasahe = sand, Iba pa = clay). Bars are 6px tall, 4px radius.
- **Kai callout**: cream-honey card with mini Kai avatar on the left and a plain-language insight on the right (`Tumaas ng 18% ang gastos mo sa Paninda kumpara nung nakaraang buwan. Sulit pa ba yung deal mo sa supplier?`). 14px serif italic for the question.
- **Daily bars**: “PANG-ARAW-ARAW” caption + `7 araw` on the right. 7 stacked bars (M T W H B S L), peak day in honey-deep, others in honey-light. Same banig texture treatment as the home weekly chart.

### Scan — Receipt capture

File: `prototype/components/screen-scan-deadlines.jsx` (`ScanScreen`). Screenshot: `screenshots/08-scan-honey-fil.png`.

- **Full-bleed dark UI**: ink-black background overrides the honey gradient. Status bar / page chrome dims to match.
- **Viewfinder**: 4 honey-deep corner brackets framing the center 70% of the screen. Subtle radial spotlight gradient from center.
- **Sample receipt**: a slightly-rotated paper card in the center showing line items (Katsa, Kambray, Buttons, Thread) and total `₱3,240`. This is a placeholder for the live camera feed — in production it’s replaced with the actual `<video>` element.
- **Bottom action bar**: `Cancel` (left, white text), big shutter button (center, honey-deep filled, 80px, white inner ring), `🖼 Album` (right, white text).
- **Phases**: prototype state machine has `aim → scanning → result`. `scanning` overlays a horizontal scanline animation; `result` replaces the viewfinder with the parsed receipt + a `Save` CTA. Build all 3 phases.

### BIR Deadlines

File: `prototype/components/screen-scan-deadlines.jsx` (`DeadlinesScreen`). Screenshot: `screenshots/09-deadlines-honey-fil.png`.

- **Header**: 📅 BIR DEADLINES + serif H1 `Hindi ka mahuhuli kay Kai.` / `Kai won’t let you miss a deadline.` + small caption `Automatic na paalala bago ang due date.`
- **Kai pre-deadline callout** (top, urgent items only): cream-honey card with mini Kai avatar + dynamic copy (`Paparating na ang 2551Q sa Nov 25. Nandiyan pa ang 5 araw — i-prepare ko na ang numero mo?`). Tap = open prepare flow.
- **Deadline list**: each row is a card with:
  - **Date chip** (left): cream-honey filled rounded square, 56×56px, with month abbreviation (NOB) on top + day number (25) bottom in serif. Urgent (≤7 days) chip uses the urgent-honey fill.
  - **Form code pill** + days-left counter (e.g. `2551Q` + `⚠ 5 araw`). Days counter is honey-deep when urgent.
  - **Form name** (serif, 16px, weight 500): `Quarterly Percentage Tax`.
  - **Description** (caption, muted): `Para sa Oct–Dec quarter`.
- **First (next-due) card** is highlighted with a 2px honey-deep border; subsequent cards have only the standard hairline.
- Items shown in prototype: 2551Q (Nov 25), 1701Q (Dec 2), 1601-C (Dec 15), 1604-E (Jan 31), 1701 (Apr 15).

### Tamang Presyo — Costing

File: `prototype/components/screen-other.jsx` (`CostingScreen`). Screenshot: `screenshots/10-costing-honey-fil.png`.

- **Header**: 📐 PRICING AT COSTING + serif H1 `Magkano dapat ang presyo?` / `What price should you set?`
- **Inputs card**: white card with three stacked fields:
  1. **Produkto** (text input, label above) — default `Lomi (Medium)`.
  2. **Kapalit (bawat isa)** (cost per unit) — peso input, default `₱ 85`.
  3. **Markup** — horizontal slider (0–100%), with current value (e.g. `45%`) displayed honey-deep, top-right of the slider. Track is honey-light, fill is honey-deep gradient, thumb is honey-deep filled circle.
- **Recommended price card** (below, honey-cream gradient fill): `INIREKOMENDA NI KAI` caption + huge serif amount (`₱123`, 56px, honey-deep) + `Kita bawat isa: ₱38` caption underneath.
- **Kai competitor callout**: small white pill at the bottom of the card with mini Kai avatar + `Ang karibal mo (Lomi Shop sa tabi) — ₱133. Pwede mo pang taasan.`
- The price recomputes live as the user adjusts cost or markup. The competitor benchmark is a one-line pill that updates with persona context.

### Mga Invoice — Invoices

File: `prototype/components/screen-other.jsx` (`InvoicesScreen`). Screenshot: `screenshots/11-invoices-honey-fil.png`.

- **Header**: 📄 MGA INVOICE + serif H1 `Sinong may utang pa sa’yo?` / `Who still owes you?`
- **Two summary tiles** side-by-side: `HINIHINTAY` (Pending) `₱61,700` and `LATE NA` (Overdue) `₱35,000`. Tile = white card, caption + serif amount (24px). Late-na uses urgent-honey accent color on the amount.
- **Invoice list**: rows with INV-#### caption on top, client name (serif, 16px), date below, peso amount on the right (serif, 18px), and a status pill (`Bayad na` = sage fill, `Hinihintay` = honey fill, `Late na` = urgent-honey fill).
- Tap row = open invoice detail (out of scope for this handoff — stub a route).

### Mga Draft

File: `prototype/components/screen-other.jsx` (`DraftsScreen`). No screenshot in this handoff but follows the same pattern as Invoices: header + list of draft cards (saved-but-not-sent invoices, scanned-but-not-categorized receipts, half-finished entries). Each row: title, last-edited timestamp, type pill, resume CTA. Build it with the same row pattern as Invoices.

### Daily Check-in

File: `prototype/components/screen-other.jsx` (`CheckinScreen`). Screenshot: `screenshots/12-checkin-honey-fil.png`.

- **Header**: ❤ DAILY CHECK-IN + serif H1 `Kamusta ang araw mo?` / `How’s your day going?` + caption `30 segundo lang — para magkakilala tayo pang-mabuti.` (`Just 30 seconds — so we get to know each other better.`)
- **Q1: Pakiramdam mo?** — 5 mood tiles in a row: 😊 Masaya, 😐 Okay lang, 😩 Pagod, 😰 Stressed, 🤩 Excited. Each tile is white card with the emoji (32px) on top and the label (12px caption) below. Selected = honey-deep border + cream fill.
- **Q2: Energy mo ngayon?** — horizontal slider (1–5), labels: `Pagod` left, `Sagad` right, current value above the thumb in honey-deep (`Okay`). Same slider treatment as the Costing screen.
- **Q3: May gusto ka bang ikwento kay Kai? (optional)** — textarea, placeholder `Halimbawa: “Mabagal ang benta kanina…”`. 3 rows visible.
- **Submit**: full-width button, honey-deep filled, white text — `Sabihin kay Kai`. Disabled until Q1 is answered.

### Linggong Kuwento — Sunday Story

File: `prototype/components/screen-other.jsx` (`SundayStoryScreen`). Screenshot: `screenshots/13-sundaystory-honey-fil.png`.

**This is the only screen with an inverted (dark) palette.** Background = `--ink-deep` (`#1a1410`), text = warm cream/white. The honey accents stay the same hue but are pushed brighter to read on dark.

- **Header**: 📖 LINGGONG KUWENTO caption (honey-deep on dark) + small caption `LINGGO 46 · NOB 11 – NOB 17` + serif H1 `Isang linggo ng tubo at pag-asa.` / `A week of profit and hope.` (Fraunces, 32px, weight 500, white).
- **Narrative paragraphs**: 4 short paragraphs, sans-serif, 16px, `rgba(255,255,255,0.78)`. Inline highlights are honey-deep + bold (e.g. `8 resibo`, `₱35,400`, `Sabado at Linggo`, `34%`). The closing emphasis line is honey-deep serif italic: `Maganda ang simula ng bago mong linggo. Kaya mo ’to. 🖤`.
- **KPI grid** (2×2): 4 dark-cream cards, each with a small caption + big serif metric. `PINAKA-MABENTANG ARAW: Sabado / ₱14,200`, `RESIBO NA-SCAN: 18 / record mo ‘to`, `NA-SAVE SA ORAS: 4.2 hrs / vs. Excel`, `ARAW NA MAY TUBO: 6/7 / +2 vs. last wk`. Card backgrounds = `rgba(255,255,255,0.04)` with a subtle honey hairline.
- **Share button**: full-width, honey-deep filled, white text, `🇧🇿 I-share sa family` / `Share with family`. The narrative is generated server-side (LLM-authored) and stays consistent across re-shares within the same week.

---

## Files

Inside `prototype/`:

- `AKBai Prototype.html` — entry point. Loads React + Babel + the component scripts. The home screen is rendered when `screen === 'home'`.
- `styles.css` — global styles, color tokens, animations, and the `.home-card`, `.feature-tile-illo`, `.pill-sage` etc. utility classes referenced above.
- `components/screen-home.jsx` — **the primary file**. Contains `HomeScreen`, `KaiSitting` (the brand-mark wrapper), `Squiggle`, `TapeStrip`, `WovenDivider`, `FloatingPetals`. ~620 lines.
- `components/icons.jsx` — line-art icon set (Resibo, Usap, Pera, Kalendaryo, Precio, Invoice, Sampaguita, etc.).
- `components/ui.jsx` — shared primitives (`CapizPattern`, `KaiHero`, etc.).
- `components/kai.jsx` — the small Kai avatar with expressions.
- `components/data.jsx` — `PERSONAS`, `COPY` (FIL/EN strings), `WEEK_DATA`, `pesoShort`, `formatPeso`.
- `components/screen-chat.jsx`, `screen-saan.jsx`, `screen-scan-deadlines.jsx`, `screen-other.jsx` — the **other in-scope screens** (Kausap, Saan, Scan, Deadlines, Costing, Invoices, Drafts, Check-in, Linggong Kuwento). Same fidelity bar as the home screen — see [Other Screens — Detail](#other-screens--detail) below.
- `assets/kai-mark.png` — the brand mark (also lives at `frontend/public/icons/mark-honey.png` in the AKBai repo).

When in doubt, open `AKBai Prototype.html` in a browser and inspect the home screen directly.
