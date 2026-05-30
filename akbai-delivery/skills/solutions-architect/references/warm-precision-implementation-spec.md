# Warm Precision — Engineer Implementation Spec

> **Status:** Contract for the build-engineer. Architecture gate output for the Warm Precision visual redesign.
> **Anchored by:** ADR-021 (`architecture-decisions.md`). **Plan:** `warm-precision-plan.md` (§0.5 locked decisions, §1 corrections that override `design.md`, §2 workstreams W1–W12).
> **Visual source of truth:** `design_handoff_akbai_redesign/design_handoff_akbai_warm_precision/prototype/app.css` (+ `design.md`, `README.md`).
> **Scope this sweep:** light-mode only. The `.dark{}` block in `globals.css` is **not touched**.
> **Last updated:** 2026-05-30
>
> **Hard rules (CLAUDE.md):** TypeScript strict, no `any`; Zod on API inputs; **NO hardcoded hex in components — tokens only**; `useRef` + `onClick` for forms (React 19 controlled-input bug); money in centavos (integers), display conversion at UI layer only; conversational Filipino UI copy (locked — zero copy changes this sweep).

---

## 0. Reading order for the engineer

1. This spec (the contract).
2. ADR-021 for the *why* / locked calls.
3. `prototype/app.css` for exact component CSS (notch radii, gradients, shadow stacks).
4. The 5 prototype screen JSX files (`screen-{home,chat,scan,expenses,deadlines}.jsx`) for layout — **copy, don't ship**.
5. `prototype/app/ui.jsx` `PesoNum` for the count-up reference algorithm.

**Implementation order is non-negotiable: W1 (tokens) lands and merges first.** Everything else reads the tokens.

---

## 1. Token map — `app.css :root` (hex) → `globals.css` (HSL)

All values below go into the `:root` light block of `frontend/src/app/globals.css` and become the **default (`cream`) palette**. Tailwind (`tailwind.config.js`) references `hsl(var(--token))` and needs edits **only** for genuinely-new tokens (the NEW rows + the `secondary-container` alias already exists). HSL triplets are written as Tailwind/MD3 convention: `H S% L%`.

### 1a. Surfaces

| Prototype token | Hex | globals.css `--token` | HSL (new) | Old HSL | Verdict |
|---|---|---|---|---|---|
| `--bg` / surface | `#fdfaf4` | `--background`, `--surface`, `--surface-bright` | `40 56% 97%` | `39 47% 97%` (`#fdf9f2`) | **RETUNE** (¼-step cooler paper) |
| `--c-lowest` | `#ffffff` | `--surface-container-lowest` | `0 0% 100%` | `0 0% 100%` | SAME |
| `--c-low` | `#f8f4ec` | `--surface-container-low` | `40 50% 95%` | `33 19% 94%` (`#f7f3ec`) | **RETUNE** |
| `--c` | `#f2ede4` | `--surface-container` | `39 39% 92%` | `33 13% 91%` (`#f1ede7`) | **RETUNE** (card bg / Level 1) |
| `--c-high` | `#ece7dd` | `--surface-container-high` | `40 33% 90%` | `33 11% 87%` (`#ebe8e1`) | **RETUNE** |
| `--c-highest` | `#e7e1d6` | `--surface-container-highest` | `37 30% 87%` | `33 8% 84%` (`#e6e2db`) | **RETUNE** (pressed state) |

> `--surface-dim` is not in the prototype; leave as-is (it has no Warm Precision consumer). Update the hex comment on `--background` to `#fdfaf4`.

### 1b. Ink

| Prototype token | Hex | globals.css `--token` | HSL (new) | Old HSL | Verdict |
|---|---|---|---|---|---|
| `--on-surface` | `#1c1c18` | `--on-surface`, `--foreground`, `--ink` | `45 9% 10%` | `48 8% 10%` | SAME (rounding-equal; keep current) |
| `--on-variant` | `#5b4a38` | `--on-surface-variant`, `--ink-soft` | `28 24% 29%` | `27 20% 27%` (`#534434`) | **RETUNE** (warmer, slightly lighter) |
| `--on-faint` | `#8a7558` | `--ink-faint` **(remap)** + NEW `--on-faint` | `33 22% 44%` | `--ink-faint` was `30 11% 45%` (`#867461`) | **RETUNE + NEW alias** |

> The prototype's `--on-faint` is the muted/tertiary ink. Map it onto the existing `--ink-faint` (retune to `#8a7558`) AND expose a `--on-faint` alias so component classes named `text-on-faint` resolve. Add Tailwind alias `'on-faint': 'hsl(var(--on-faint))'`.

### 1c. Honey / brand

| Prototype token | Hex | globals.css `--token` | HSL (new) | Old HSL | Verdict |
|---|---|---|---|---|---|
| `--primary` (honey text/CTA) | `#855300` | `--primary`, `--honey-deep` | `32 100% 26%` | `32 100% 26%` | SAME |
| `--honey` (primary-container) | `#f59e0b` | `--primary-container`, `--honey` | `37 90% 51%` | `37 90% 51%` | SAME |
| `--honey-bright` | `#f5b347` | `--honey-bright` | `37 89% 62%` | `36 100% 69%` (`#ffb95f`) | **RETUNE** (prototype's brighter honey is a touch deeper) |
| `--secondary` (secondary-container) | `#fef3d9` | `--secondary-container` | `43 92% 92%` | `27 99% 59%` (`#fe932c` orange) | **RETUNE + ROLE-CHANGE** (audit consumers — see §1g) |
| `--grad-from` | `#f5b347` | NEW `--grad-from` | `37 89% 62%` | — | **NEW** (gradient stop) |
| `--grad-to` | `#d97706` | NEW `--grad-to` | `30 95% 44%` | — | **NEW** (gradient stop) |
| `--on-primary` | `#ffffff` | `--on-primary` | `0 0% 100%` | `0 0% 100%` | SAME |

> **Honey gradient** (CTA buttons, FAB, user chat bubble, send button) = `linear-gradient(180deg, hsl(var(--grad-from)) 0%, hsl(var(--grad-to)) 100%)`. The chat user bubble uses `135deg`. White label sits on the darker `--grad-to` stop (AA-safe at ≥16px/700).

### 1d. Tertiary / teal (financial trust)

| Prototype token | Hex | globals.css `--token` | HSL (new) | Old HSL | Verdict |
|---|---|---|---|---|---|
| `--teal` | `#006b54` | `--tertiary`, `--sage-deep`, `teal` alias | `162 100% 21%` | `160 100% 21%` | SAME (keep current; teal = ALL peso amounts) |
| `--teal-container` | `#cdeee2` | `--tertiary-container` | `159 47% 87%` | `161 76% 45%` (`#1ec89f`) | **RETUNE + ROLE-CHANGE** (audit consumers — see §1g) |

### 1e. Semantic

| Prototype token | Hex | globals.css `--token` | HSL (new) | Old HSL | Verdict |
|---|---|---|---|---|---|
| `--warning` | `#FBBF24` | NEW `--warning` | `43 96% 56%` | — | **NEW** (deadline urgency amber bar — *not red*) |
| `--error` (text) | `#c0392b` → **REJECT** | `--destructive` (keep) | `0 63% 41%` (`#ba1a1a`) | `0 63% 41%` | SAME — **do NOT adopt `#c0392b`** |
| `--error-fill` | `#F87171` | NEW `--error-fill` | `0 91% 71%` | — | **NEW** (error icons/fills only) |
| `--error-pale` | `#fde0dc` | NEW `--error-pale` | `8 90% 93%` | — | **NEW** (overdue tag fill only) |

> Status-tag "overdue" uses `--error-pale` fill + `--destructive` text (NOT `#c0392b`). The prototype's `tag-overdue { color: var(--error) }` maps to our `--destructive`.

### 1f. Lines, scrim, motif, radii

| Prototype token | Hex/rgba | globals.css `--token` | Value | Verdict |
|---|---|---|---|---|
| `--outline-variant` | `rgba(91,74,56,0.20)` | `--outline-variant`, `--outline-soft` | keep as HSL `28 24% 29%` consumed at `/20` opacity via Tailwind (`border-outline-variant/20`) | RETUNE (align base ink to `#5b4a38`) |
| `--outline-input` | `rgba(91,74,56,0.32)` | NEW `--outline-input` | base `28 24% 29%`, consume at `/32` | **NEW** (permitted input bottom hairline) |
| `--outline-chart` | `rgba(91,74,56,0.18)` | reuse `--outline-variant` at `/18` | — | SAME (no new token; use opacity) |
| `--ink-scrim` | `rgba(28,24,16,0.45)` | NEW `--ink-scrim` | base `40 27% 9%`, consume at `/45` | **NEW** (sheet/scan scrim) |
| `--sampaguita` | `#ffffff` | NEW `--sampaguita` | `0 0% 100%` | **NEW** (banig-chart peak marker / motif accent) |
| `--r-sm/--r/--r-lg/--r-xl` | 12/16/24/28px | Tailwind `rounded-*` | sm 12 · card 16 · lg 24 · xl 28 | use Tailwind utilities; no token needed (`--radius` stays `0.75rem`=12px) |

### 1g. RETUNE + ROLE-CHANGE consumer audit (do this BEFORE flipping)

Two tokens change meaning, not just value. Audit every consumer and confirm the new role holds:

- **`--secondary-container`** `#fe932c` (saturated orange) → `#fef3d9` (pale honey). New role: soft tile/bubble fill (action tiles, warm Kai bubble, KPI profit tile, input focus tint). Known consumer: `chat-bubble.tsx` user bubble uses `bg-secondary-container` — under Warm Precision the **user bubble becomes the honey gradient**, so that class is replaced (see §6). Tailwind alias `user-bubble` also points at `--secondary-container`; reconcile (the user bubble no longer uses it). Grep `secondary-container` + `user-bubble` and verify each is a *fill* not *text*; the old orange may have been used where contrast assumed a saturated bg.
- **`--tertiary-container`** `#1ec89f` (bright mint) → `#cdeee2` (pale success). New role: success/positive tag + callout fill. Known consumers: `status-badge.tsx` (`bg-tertiary-container/20` for sent/viewed/paid). At pale `#cdeee2`, `/20` opacity is nearly invisible — **drop the `/20`** for these or move them onto the new `<StatusTag>` (see §5). Audit donut/category colors that may reference tertiary-container.

> `on-secondary-container` / `on-tertiary-container` ink tokens: re-verify AA against the new *pale* fills (W11). Pale fills want the *darker* on-* ink, which already exists.

### 1h. Palette-variant handling (locked)

- **`cream` = canonical Warm Precision.** Put the full retune in `:root`; `:root[data-palette='cream']` stays empty (default).
- **`honey` / `dawn` stay functional.** They override only `--background`/`--surface`/`--surface-bright` (as today). Do **not** re-derive every card/ink token per variant in this sweep.
- **Follow-up (not a blocker):** reconcile the new card/ink/elevation tokens against `honey`/`dawn` backgrounds once the default palette ships and Anton eyeballs it on device. Note this in the build PR description.

### 1i. New Tailwind aliases to add (`tailwind.config.js` → `theme.extend.colors`)

```js
'on-faint':        'hsl(var(--on-faint))',
warning:           'hsl(var(--warning))',
'error-fill':      'hsl(var(--error-fill))',
'error-pale':      'hsl(var(--error-pale))',
'outline-input':   'hsl(var(--outline-input))',
'ink-scrim':       'hsl(var(--ink-scrim))',
sampaguita:        'hsl(var(--sampaguita))',
'grad-from':       'hsl(var(--grad-from))',
'grad-to':         'hsl(var(--grad-to))',
```

> `secondary-container`, `tertiary-container`, `tertiary`/`teal` aliases already exist — no Tailwind edit, only the `globals.css` value changes. **HSL triplets above are derived for parity; the engineer must confirm each against the source hex (use a hex→HSL converter) and adjust the L%/S% rounding if a visual diff appears.** Treat them as ±1% starting points, not gospel.

---

## 2. `<Money>` primitive contract (W2)

**File:** `frontend/src/components/ui/money.tsx` (new). Reference algorithm: `prototype/app/ui.jsx` `PesoNum`. Wraps `centavosToPeso` from `@/lib/utils/money.ts` (do not re-implement formatting).

### Props

```ts
interface MoneyProps {
  /** Amount in centavos (canonical integer money unit). */
  centavos: number;
  /** Visual scale → maps to Number-lg/md/sm type tokens. Default 'md'. */
  size?: 'lg' | 'md' | 'sm';
  /** Ink override: teal (default, all financial figures) | 'ink' (on-surface) | 'white' (on honey gradient). */
  tone?: 'teal' | 'ink' | 'white';
  /** Animate 0→value on first paint. Default true. */
  countUp?: boolean;
  /** Show a leading +/- sign (net figures). Default false. */
  signed?: boolean;
  className?: string;
}
```

### Behavior

- **Formatting:** render `centavosToPeso(centavos)` (gives `₱3,450.00`). `signed` prepends `+`/`-` for non-negative/negative net values (mirrors existing `expenses-summary.tsx` `isPositive` pattern). Centavos display is preserved (existing formatter shows 2 decimals — keep; the prototype dropped decimals but the repo standard is `.00`, and changing it is out of scope for a *visual* sweep).
- **Style:** `font-variant-numeric: tabular-nums` + `font-weight: 700` + `white-space: nowrap`. `tone='teal'` → `text-tertiary` (teal, the default for all amounts); `tone='ink'` → `text-on-surface`; `tone='white'` → `text-on-primary`. Size maps to the Number type classes (§3): `num-lg`/`num-md`/`num-sm`.
- **Count-up:** enabled when `countUp !== false` AND not `prefers-reduced-motion` AND no global disable. 600ms, cubic ease-out `1 - (1-p)^3`, `requestAnimationFrame`, **once** (guard with a `useRef` `started` flag), animate the integer-peso value then snap to exact on completion. Width is reserved by the wrapper so the layout doesn't reflow during count.
  - **Global disable escape hatch:** read a single source of truth — recommend a `data-count-up="off"` attribute on `<html>` (set from a user setting / future toggle) read via `document.documentElement.dataset.countUp === 'off'`, OR a `window.__AKB_NOCOUNT` flag as the prototype uses. Pick one; document it in the component header. When off, render the final value immediately.
- **a11y:** `aria-label` spells the value naturally and **localized**, e.g. `aria-label="3,450 piso"` (peso → "piso"). The visible glyph is `₱`; the label says "piso". Do not animate the label (set it to the final value).
- **SSR safety:** initial state = final value on the server; count-up only starts client-side in `useEffect` (component is `'use client'`).

### Call-sites to migrate (~20 display sites across 14 component files)

Replace inline `{centavosToPeso(x)}` / `₱{n.toLocaleString(...)}` renders with `<Money centavos={x} … />`. **Screen/app surfaces get count-up; lists/editors/PDF do NOT.**

| File | Sites | Notes |
|---|---|---|
| `components/dashboard/check-in-section.tsx` | 2 | kita/gastos summary — `size='sm'`, countUp on |
| `components/dashboard/weekly-reconciliation-card.tsx` | 1 | net (via i18n interpolation — see caveat) |
| `components/dashboard/monthly-reconciliation-card.tsx` | 3 | sales/expenses/net KPIs — count-up |
| `components/dashboard/check-in-modal.tsx` | 1 | expenses prompt — `countUp={false}` (form) |
| `components/expenses/expenses-summary.tsx` | 3 | net (`signed`), income, expenses — count-up |
| `components/expenses/expenses-donut.tsx` | 1 (center total) | currently inline `₱{totalPesos}` in Fraunces — convert to `<Money size='md' tone='ink'>`; **keep Fraunces? No** — Number-md is Jakarta tabular. Reconcile per §3 |
| `components/expenses/transaction-list.tsx` | 1 | per-row `±` amount — `signed`, `size='sm'`, `countUp={false}` (list) |
| `components/expenses/category-chart.tsx` | 1 | per-segment amount — `size='sm'`, no count-up |
| `components/costing/costing-summary.tsx` | 4 | KPI grid — count-up on the summary card values |
| `components/costing/costing-card-list.tsx` | 2 | list rows — `countUp={false}` |
| `components/costing/item-line-editor.tsx` | 2 | editor totals — `countUp={false}` (form) |
| `app/(app)/costing/[id]/client-page.tsx` | 1 | item total — `countUp={false}` |
| `components/scanner/scan-results.tsx` | 2 | editable amount + unit price — `countUp={false}` (editable) |
| `components/invoices/invoice-list.tsx` | 1 | list total — `countUp={false}` |
| `components/invoices/line-item-editor.tsx` | 2 | editor — `countUp={false}` |
| `components/invoices/invoice-form.tsx` | 2 | subtotal/total — `countUp={false}` |
| `components/admin/mrr-card.tsx` | 2 | admin — `size='md'`, count-up optional |
| `components/admin/admin-stats.tsx` | 1 | StatCard value (string-typed — may need StatCard prop change) |
| `components/ocr/dedup-warning.tsx` | 1 | warning amount — `countUp={false}` |

**Do NOT migrate (leave as plain `centavosToPeso` strings):**
- `components/invoices/invoice-preview.tsx` (print/PDF visual — 7 sites) and `lib/invoices/pdf-generator.ts` (HTML→PDF, no React, no token system). These are document surfaces, not app UI.

**Caveats:**
- **i18n-interpolated amounts** (`weekly-reconciliation-card.tsx` uses `t('netSoFar', { amount: centavosToPeso(...) })`; `check-in-section.tsx` uses `{t(...)}: {centavosToPeso(...)}`): `<Money>` is a React node and can't go inside a `t()` string arg. Either render `<Money>` *adjacent* to the translated label (preferred — split the i18n key into label-only) or keep these as styled `centavosToPeso` strings wrapped in a `.num` span. Engineer's call per site; flag any i18n-key reshaping to `build-ux`/`build-marketing` since copy is locked (label text must not change).
- **`StatCard`** (used by `monthly-reconciliation-card`, `costing-summary`, `admin-stats`) takes a `value: string`. To put `<Money>` inside, either add a `valueNode?: ReactNode` prop to `StatCard` or render `<Money>` as children. Do not fork StatCard.

---

## 3. Typography (W3)

Lives in `globals.css` (add the type classes the prototype defines) + Tailwind `fontFamily` (already has `serif: Fraunces`, `sans: Plus Jakarta Sans`). Add these classes under `@layer components` (or as utilities) so components reference `className="display"`, `.num-lg`, etc. — matching the prototype contract.

| Role | Change | Spec |
|---|---|---|
| Display | **weight 800 → 600**, size 40/44 | Fraunces 600, `-0.02em`, `font-size:40px; line-height:44px` |
| H1 | **weight 800 → 600**, size 30/36 | Fraunces 600, `-0.02em` |
| H2 | confirm | Jakarta 700, 22/28, `-0.01em` |
| H3 | confirm | Jakarta 600, 18/24 |
| Body | confirm | Jakarta 400, 15/22 |
| **Body-strong** | **NEW** | Jakarta 600, 15/22 |
| Label | confirm | Jakarta 700, 11/14, `0.08em` uppercase |
| **Number-lg** | **NEW** | Jakarta 700 tabular, 30/32, `-0.01em` |
| **Number-md** | **NEW** | Jakarta 700 tabular, 20/24, `-0.01em` |
| **Number-sm** | **NEW** | Jakarta 700 tabular, 15/18 |
| Chat bubble text | **14 → 15** | 15/21 (see §6) |

- Number classes: `.num { font-variant-numeric: tabular-nums; font-weight:700; letter-spacing:-0.01em; color: hsl(var(--tertiary)); white-space:nowrap; }` + `.num-lg/.num-md/.num-sm` size modifiers + `.num-ink { color: hsl(var(--on-surface)); }` + `.num-white { color: hsl(var(--on-primary)); }`. `<Money>` (§2) composes these.
- **Expenses donut center total** currently renders in Fraunces serif (`expenses-donut.tsx` L104). Warm Precision spec: donut total is **Number-md tabular teal** (Jakarta), not serif. Switch it to `<Money size='md'>` and drop the inline `fontFamily: Fraunces`. Flag to `build-ux` as an intentional change.
- Display/H1 weight drop touches every Fraunces heading (dashboard greeting, drawer title, deadline form codes). Verify nothing relied on 800 for contrast — Fraunces 600 on cream is fine at these sizes.

---

## 4. Elevation (W4)

Add warm two-layer shadow tokens (never grey). Put as Tailwind `boxShadow` entries + optionally CSS vars:

```js
// tailwind.config.js → theme.extend.boxShadow
'el-2': '0 1px 2px rgba(120,80,10,0.10)',
'el-3': '0 1px 3px rgba(120,80,10,0.14), 0 12px 32px -8px rgba(176,100,16,0.18)',
```

> These are the *one* permitted place for rgba shadow literals (shadows aren't theme-tokenized as HSL today; the existing `shadow-ambient` already uses `hsl(var(--primary)/0.08)` — you may also express `el-2/el-3` as `hsl(var(--primary)/…)` stacks if you prefer full tokenization, but match the warm hue).

**Card level rules:**
- **Level 1 (static card):** `bg-surface-container` (`#f2ede4`), **no shadow** — separated by tone only. (Kuwento card, breakdown cards.)
- **Level 2 (raised / press-from):** `bg-surface-container-high` + `shadow-el-2`. Press state: `scale(0.98)` + tone step to `surface-container-highest`, ~120ms.
- **Level 3 (floating: bottom sheet / FAB / toast / data card):** `bg-surface-container-lowest` (white) + `shadow-el-3`, radius 24 (sheet top 28).

**Glass is restricted to TWO places only:** the bottom-nav (`.glass-nav`) and the scan overlay control bar. Remove/avoid `.glass` on cards, modals, drawers — those become **solid** Level-3 sheets. Audit existing `.glass` usages; the `MoreDrawer` already uses solid `bg-surface` (good).

---

## 5. Status-tag component (W6)

**Reuse target:** `frontend/src/components/ui/pill.tsx` (existing CVA pill). Add a `status` variant set rather than forking. The prototype's 4 kinds map onto the new tokens:

| Kind | Fill | Text | Maps to existing |
|---|---|---|---|
| `positive` (paid/on-track) | `--tertiary-container` (`#cdeee2`) | `--tertiary` (`#006b54`) | extend Pill `sage` variant or add `positive` |
| `pending` (due-soon) | `--secondary-container` (`#fef3d9`) | `--primary` (`#855300`) | maps to Pill `honey` variant (retuned) |
| `overdue` (error) | `--error-pale` (`#fde0dc`) | `--destructive` (`#ba1a1a`) | replace Pill `urgent` variant's `error-container` with `error-pale` |
| `neutral` (info) | `--surface-container-high` (`#ece7dd`) | `--on-surface-variant` | maps to Pill `neutral` variant |

- Pill geometry for tags: 11px / weight-700 / `0.04em`, `padding 2px 8px`, `rounded-full` (`size='sm'` ≈ matches; confirm height).
- **`invoices/status-badge.tsx`** has its own 6-state config — reconcile it onto the Pill status variants (paid/sent → positive/pending; overdue → overdue; draft/cancelled → neutral) OR leave it as the invoice-specific wrapper but re-point its classes to the new tokens (it currently uses `bg-tertiary-container/20` which goes near-invisible at the pale value — see §1g). Do not introduce a third parallel tag component.
- **`scanner/confidence-badge.tsx`** and **`deadlines/deadline-date-chip.tsx`** are distinct components (confidence %, calendar date-chip) — not status tags; leave their semantics, just reroute any hardcoded color (see §10 deadline-row).

---

## 6. Chat bubble restyle (W6)

**File:** `frontend/src/components/chat/chat-bubble.tsx` (re-skin in place).

**Kai bubble (assistant):**
- `bg-surface-container-lowest` (white) + **1px hairline** `inset 0 0 0 1px hsl(var(--outline-variant)/0.24)` (use `ring-1 ring-outline-variant/24` or a box-shadow inset).
- Radius **`20px` with a 6px notch bottom-left**: `rounded-[20px] rounded-bl-[6px]`.
- **Warm variant** (greetings / first message): `bg-secondary-container` (`#fef3d9`), no hairline. Add a `warm?: boolean` prop or detect first-in-thread.
- Text **15/21** (was 14): `text-[15px] leading-[21px]`, `text-on-surface`.

**User bubble:**
- **Honey gradient** `linear-gradient(135deg, hsl(var(--grad-from)) 0%, hsl(var(--grad-to)) 100%)`, `text-on-primary` (white), weight 500.
- Radius `20px` with **6px notch bottom-right**: `rounded-[20px] rounded-br-[6px]`.
- **Replaces** the current `bg-secondary-container` user bubble (which was the orange token). This resolves the `--secondary-container` role-change for chat (§1g).

**Typing indicator:** 3 honey dots, 1.2s bounce — reuse existing `animate-typing-bounce` keyframe (already in Tailwind config) with `bg-honey` dots.
**Composer / chips / send button:** suggested chips = white + hairline (`chip-suggest`); send = honey-gradient 44px circle (`shadow-el-2`). Reuse `suggested-chips.tsx`; restyle, don't fork.

---

## 7. Nav FAB structural change (W7) — `bottom-nav.tsx`

**File:** `frontend/src/components/dashboard/bottom-nav.tsx`. Convert **5 tabs (Home/Chat/Scan/Pera/More)** → **4 tabs + center Scan FAB**.

**New `NAV_ITEMS` (4):**
| key | href | i18nKey (label) | position |
|---|---|---|---|
| `home` | `/dashboard` | `home` ("Umaga") | left-1 |
| `chat` | `/chat` | `chat` ("Kai") | left-2 |
| *(FAB gap)* | — | — | center spacer |
| `money` | `/expenses` | `money` ("Pera") | right-1 |
| `more` | (drawer) | `more` ("Iba pa") | right-2 |

- **Scan FAB:** floating honey-gradient circle, 60px, `top:-22px`, centered (`left-1/2 -translate-x-1/2`), `shadow-el-3`, links to `/scan`. Press `scale(0.92)` with spring easing. Render it as a sibling positioned over a `botnav-spacer` (64px flex gap) so the 4 tabs space evenly around it. **This is the only structural addition** — it is *not* a parallel nav component.
- **`Scan` leaves the tab row** — remove the `scan` entry from `NAV_ITEMS`; `IconScanNav` is now only the FAB glyph.
- **`More` becomes a real tab** in the row (4th visible item) that triggers `MoreDrawer` (today it's the trailing item after the 4 links — keep `MoreDrawer` as the trigger wrapper). Label "Iba pa".
- **Preserve:** hide-on-`/chat` (`if (pathname === '/chat') return null`); `body[data-scanning='true']` nav suppression (globals.css selector `nav[data-testid='bottom-nav']` — keep the `data-testid`); glass nav (`.glass-nav`); `tablet:hidden` breakpoint; active state honey-gradient pill + `text-honey-deep`.
- **Active styling per prototype:** active tab `color: primary` honey; inactive `on-faint`; active label weight-800. Reconcile with the current gradient-pill active treatment — keep the gradient pill (it's the repo's established active affordance) OR adopt the prototype's flat honey color; **recommend keeping the gradient pill** (less churn, already AA) and just swapping inactive color to `text-on-faint`.

**Routing impact / `MoreDrawer` reshape (`more-drawer.tsx`):**
- Scan is no longer reachable from the tab row except via FAB — confirm no other surface relied on a Scan *tab* (action-grid "Scan receipt" tile still routes to `/scan`, unaffected).
- The "Iba pa" sheet lists secondary tools (Deadlines, Costing, Invoices, Drafts, Check-In, Kuwento) — the existing 6-item `ITEMS` set already matches; keep it. Re-skin sheet items to Level-3 solid (already solid).
- **Tests:** `e2e/navigation.spec.ts` and any test asserting a `nav-scan` tab need updating to assert the **FAB** (`data-testid="nav-scan-fab"` recommended) instead. Flag to `build-qa`.

---

## 8. Component inventory — prototype → existing repo reuse target

| Prototype element (`app.css` / screen JSX) | Existing repo component (reuse) | Action |
|---|---|---|
| `PesoNum` (`ui.jsx`) | **NEW** `components/ui/money.tsx` | create (§2) — the one genuinely-new component |
| `.tag` / `Tag` (4 kinds) | `components/ui/pill.tsx` | extend variants (§5) |
| `.card` / `.card-raised` / `.card-float` | `components/dashboard/dashboard-card.tsx` + ad-hoc cards | re-skin to Level 1/2/3 (§4) |
| `.bubble-kai` / `.bubble-me` | `components/chat/chat-bubble.tsx` | re-skin (§6) |
| `.chip-suggest` / chip-scroll | `components/chat/suggested-chips.tsx` | re-skin |
| `.botnav` + `.fab-scan` | `components/dashboard/bottom-nav.tsx` | restructure (§7) |
| `.sheet` / `.sheet-item` (Iba pa) | `components/dashboard/more-drawer.tsx` (Vaul) | re-skin (§7) |
| `.bars` / `.bar` (banig chart) | `components/ui/banig-bar-chart.tsx` | re-skin + bug-fix stripe (§10) |
| donut + center total | `components/expenses/expenses-donut.tsx` | re-skin total → `<Money>` (§3) |
| `.cat-row` / `.cat-track` / `.cat-fill` | `components/expenses/category-breakdown-row.tsx`, `category-chart.tsx` | re-skin |
| `.datechip` (deadlines) | `components/deadlines/deadline-date-chip.tsx` | re-skin (urgent uses `error-fill`) |
| next-due highlighted card | `components/deadlines/deadline-row.tsx` + deadlines page | re-skin (warning-amber bar, not red) + bug-fix (§10) |
| KPI row (3-up) | dashboard Kuwento card | re-skin (profit tile = `secondary-container`) |
| paper-note takeaway | `.paper-note` utility (globals.css, exists) | reuse |
| action grid tiles | dashboard action grid | re-skin (`secondary-container` fill) |
| Kai hero / disc | `components/illustrations/kai/kai.tsx` + `KaiSitting` | scale existing assets (no new asset) |
| scan overlay (aim/parsing/result) | `components/scanner/*` (`camera-capture.tsx`, `scan-results.tsx`) | re-skin; result sheet = Level-3 solid |
| `--warning` amber bar | NEW token usage | apply to deadline next-due card |

**Genuinely new:** only `components/ui/money.tsx`. Everything else is a re-skin of an existing component (ADR-013 / Sprint 5 reuse rule).

---

## 9. Implementation sequence (engineer batches)

> **W1 tokens FIRST and merged before anything reads them.** Then proceed; batches are independently reviewable.

**Batch 1 — Tokens + bug fixes (W1 + W10) [merge first]**
Files: `globals.css` (`:root` retune + new tokens; `.dark{}` untouched), `tailwind.config.js` (new aliases §1i + `el-2`/`el-3` shadows), then the 3 W10 fixes (`free-tier-banner.tsx`, `deadline-row.tsx`, `banig-bar-chart.tsx`). Run the secondary/tertiary-container consumer audit (§1g) in this batch.

**Batch 2 — Number system (W2 + Number typography)**
Files: `components/ui/money.tsx` (new), the Number/Body-strong classes in `globals.css` (§3), then migrate the ~20 call-sites (§2 table). StatCard prop tweak if needed.

**Batch 3 — Typography + elevation (W3 + W4)**
Files: `globals.css` (Display/H1 weight→600, type classes), card components → Level 1/2/3, glass restriction audit, donut total → Number-md.

**Batch 4 — Status tags + chat + chips (W6)**
Files: `pill.tsx` (status variants), `chat-bubble.tsx`, `suggested-chips.tsx`, `status-badge.tsx` reconcile.

**Batch 5 — Nav FAB (W7)**
Files: `bottom-nav.tsx` (4-tab + FAB), `more-drawer.tsx` reshape, nav tests update.

**Batch 6 — Per-screen application (the 5 prototyped screens)**
Files: dashboard (Home/Kumustahan), `/chat`, `/scan`, `/expenses`, `/deadlines` page assembly using the re-skinned primitives. `build-ux` owns motif dial-down ("one personality element per screen") here.

> Onboarding/login/profile/paywall/costing/invoices/check-in/kuwento are **extrapolated** — apply tokens + primitives, no pixel target. Lower priority; can trail Batch 6.

---

## 10. W10 bug fixes (fold into Batch 1 — adoption-independent correctness)

1. **`text-error` no-op** — `components/chat/free-tier-banner.tsx` lines 38 & 44 use `text-error`, which is **not a defined Tailwind color** (no `error` color alias exists; only `destructive`). It renders as inherited/default, not red. Fix: `text-error` → `text-destructive`. Also `bg-error/10` (line 34) → `bg-destructive/10`.
2. **Hardcoded `#F87171`** — `components/deadlines/deadline-row.tsx` line 87: `text-[#F87171]`. Replace with the new token: `text-error-fill`.
3. **`BanigBarChart` hardcoded `#fdf9f2` stripe** — `components/ui/banig-bar-chart.tsx` lines 114-115 (`stroke="#fdf9f2"`) and the `#867461`/`#855300` fallbacks (lines 99, 122). The `#fdf9f2` stripe is a light-surface literal that breaks dark mode. Since SVG fills can't take Tailwind classes, **read the CSS var at runtime** (same `getComputedStyle(document.documentElement).getPropertyValue('--surface')` pattern `expenses-donut.tsx` already uses via `resolveBgColor`) — extract a shared helper or inline it. Stripe → `--surface`; tick fill → `--ink-faint`; bar fallback → `--honey-deep`/`--primary`.

> These are pure correctness; they don't depend on the redesign but the redesign provides the tokens (`error-fill`) the deadline fix needs, so they batch together.

---

## 11. QA — snapshot specs to re-baseline (W11 / hand to `build-qa`)

A token reroot fails every visual-parity baseline by design. Re-baseline (and Anton eyeballs the new baselines) — not a regression:

- `frontend/e2e/synthesis/home.spec.ts` (+ its `*-snapshots/`)
- `frontend/e2e/synthesis/chat.spec.ts`
- `frontend/e2e/synthesis/expenses.spec.ts`
- `frontend/e2e/synthesis/deadlines.spec.ts`
- `frontend/e2e/synthesis/compare.spec.ts` (capture harness — current-app screenshots for the handoff diff report; regenerate captures)

**Also touched (functional, not visual-snapshot, but verify):**
- `frontend/e2e/navigation.spec.ts` — Scan tab → Scan FAB assertion change (§7).
- `frontend/e2e/scanner-tokens.spec.ts` — scan overlay token assertions may shift.
- Component unit tests referencing money render output (`expenses.test.ts`, `costing.test.ts`, `invoices.test.ts`, `scan-results.test.ts`, `check-in-section.test.ts`) — `<Money>` wrapping may change DOM structure (extra span / `aria-label`); update queries, keep assertions on the formatted value.

**A11y re-verify (W11):** AA contrast against the *actual* final tokens (not the prototype's `#c0392b`/`#fdfaf4`) for: on-surface/on-variant/on-faint on the retuned surfaces; teal on white and on `tertiary-container`; on-primary white on the `grad-to` stop; status-tag text-on-fill pairs. `<Money>` `aria-label` ("…piso") present on every migrated site. Dynamic-type ≥130% on the new Number sizes.

---

## 12. Handoff notes to teammates

- **`build-engineer`:** start at Batch 1; do not let any other batch merge before tokens. Confirm each HSL triplet in §1 against source hex with a converter — they are ±1% starting points. The only new component is `money.tsx`; everything else is re-skin (ADR-013).
- **`build-ux`:** owns motif dial-down (one personality element/screen) in Batch 6, the donut-total serif→Number-md change (§3), and the active-nav treatment call (§7). Watch for the Sprint 5 "17 violations" precedent.
- **`build-qa`:** owns the §11 re-baseline + nav-FAB test rewrite + the `<Money>` DOM-structure test updates.
- **`build-marketing` (if pulled):** copy is LOCKED — flag if any i18n-key reshaping (§2 caveat) risks touching visible strings.
- **No `build-data` / `build-ai` / `review-security`** — no schema, prompts, auth, or PII in this gate.
