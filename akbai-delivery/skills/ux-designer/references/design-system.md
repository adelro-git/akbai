# AKBai — Design System Specification: The Art of Warmth
> Used by: ux-designer, fullstack-engineer, marketing-lead
> Last updated: March 2026 | Source: DESIGN.md v1.0
> This is the authoritative visual design specification. When in conflict with other files, this file wins.

---

## 1. Creative North Star: "The Sun-Drenched Atelier"

This design system rejects the clinical coldness of modern SaaS. Instead, it embraces "Cafe Energy" — the feeling of a premium, light-filled space where intentionality meets comfort. We move beyond the "template" look by treating the browser as a physical desk: elements aren't just "placed," they are curated.

To achieve this, we leverage **Intentional Asymmetry** and **Tonal Depth**. We avoid rigid, boxed-in grids in favor of overlapping elements and generous "Breathing Room" (Scale 12+). The goal is a digital experience that feels bespoke, airy, and editorial — less like a software tool and more like a high-end lifestyle journal.

**Default theme is Light.** Dark mode is available as a user preference toggle.

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

---

## 3. Typography: Editorial Authority

We use **Plus Jakarta Sans** exclusively. Its geometric yet friendly curves perfectly mirror our "Rounded Twelve" geometry.

* **Display (lg/md):** Use `weight-800` with tight letter-spacing (-0.02em). These are your "billboard" moments.
* **Headlines:** Use `on-surface` (#1c1c18 light) at `weight-700`. These should feel like ink on cream paper.
* **Body:** Use `body-lg` for primary reading. Ensure a line-height of at least 1.6 to maintain the "airy" feel.
* **Labels:** Use `label-md` in `on-surface-variant` (#534434 light). Small caps can be used sparingly for a more "designed" editorial look.
* **Numbers and data points:** Always `weight-800` to make them feel like "Art."

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

---

## 6. Do's and Don'ts

### Do
* **Do** use asymmetrical margins. If the left margin is `spacing-12`, try a right margin of `spacing-24` for editorial layouts.
* **Do** prioritize `Plus Jakarta Sans` at `weight-800` for numbers and data points.
* **Do** use `spacing-20` (7rem) between major sections to let the design breathe.

### Don't
* **Don't** use pure black (#000000). Use `on-surface` (#1c1c18) for headlines and `on-surface-variant` (#534434) for body text.
* **Don't** use 1px solid borders to "box in" content.
* **Don't** use standard grey drop shadows. If it doesn't have a hint of amber/warmth, it doesn't belong.
* **Don't** use cold greys for backgrounds. Always warm tones.
