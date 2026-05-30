# Handoff: AKBai — "Warm Precision" mobile app

## Overview
AKBai is a native mobile finance companion for Filipino micro-entrepreneurs (sari-sari stores, karinderya, online resellers, freelancers). Its personality is **Kai**, a warm AI partner who greets the owner, scans receipts, explains where the money went, and watches BIR tax deadlines. This bundle is the **"Warm Precision"** design direction realized as five core screens plus the app shell.

The product north star (from `design.md`): *parang katuwang na maaasahan* — "a partner you trust because the work is clearly, calmly done." Two things lead every screen: **the numbers** (calm, tabular, teal) and **Kai** (present at a few earned hero moments, absent elsewhere).

> **`design.md` (included at the bundle root) is the canonical spec.** This README is the implementation-facing summary; when in doubt, defer to `design.md` for color, type, motion, and voice rules.

---

## About the design files
The files in `prototype/` are a **design reference built in HTML/React + Babel** — a prototype that demonstrates the intended look, layout, and behavior. **They are not production code to ship.** Your task is to **recreate these designs in the app's real environment** using its established patterns and libraries.

Per `design.md`, the target stack is **Next.js-adjacent React + Tailwind + Shadcn/UI, wrapped with Capacitor for iOS/Android**. If that codebase already exists, implement these screens with its components, theme tokens, and conventions. If it doesn't yet, scaffold the most appropriate mobile-first framework and build there.

**Mobile-first is mandatory.** These are phone screens. The iPhone bezel in the prototype (`frames/ios-frame.jsx`) and the JS that scales the 402×874 canvas are **presentation chrome only — strip them.** Build to a fluid mobile viewport with safe-area insets; the real device chrome (status bar, home indicator) is the OS's job.

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, elevation, and interactions are final and intended to be matched precisely. Exact tokens are in the "Design Tokens" section and in `prototype/app.css`. Recreate pixel-for-pixel using the codebase's libraries, but honor these exact values (they were contrast-checked for AA — see `design.md §3`).

---

## ⚠️ Kai is a PLACEHOLDER — do not recreate it
In this bundle, every Kai character is rendered as a **neutral dashed-circle placeholder** labeled `KAI` + the expression (e.g. `KAI · working`). This is deliberate: **do not try to reproduce a mascot from the placeholder.** Drop in the real Kai asset set from the repo.

- The placeholder lives in `prototype/components/kai-placeholder.jsx`. It exposes the same API the screens call: `<Kai size expression />` and `<KaiHero size expression />`.
- Wherever you see a placeholder, render the **real Kai raster asset** (transparent background, **circle-masked** so no rectangle edge shows on warm surfaces). A subtle `primary @ 10%` radial glow is allowed *behind the hero Kai only*.
- **Honor the size + expression** the placeholder declares — they encode the spec.

**Expression → context map (`design.md §7`):**
| Expression | Used at |
|---|---|
| `waving` | onboarding step 1, first-ever home open |
| `happy` | default home greeting, confirmations |
| `working` | scanning a receipt, generating a draft, loading |
| `thinking` | composing a chat reply, computing costing |
| `concerned` | BIR deadline ≤3 days, negative cash flow, errors |
| `celebrating` | milestones, streaks, first profit, paid invoice |

**Sizing per context:** Home hero 96–120px · Onboarding up to 160px · Empty states 120px · Chat avatar 32px · inline confirm bubble 28px · nav/chrome 22px mark only. **Kai is large ONLY at hero moments** (home greeting, onboarding, empty states, celebration, error-recovery); everywhere else it's a 22–32px mark or absent.

---

## 🗣️ Tone & language — derive from the repo, don't copy the prototype
The Filipino/English copy in these screens is **illustrative placeholder voice**, not the source of truth. **Adjust all tone, wording, and language toggling to match the existing reference files already in your repo** (voice/persona guides, copy decks, localization strings, brand docs). The prototype's voice is *locked in spirit* per `design.md` (conversational, warm, partner-not-bot, Taglish), but the **exact strings should come from your repo's references** — reconcile any difference in favor of the repo.

Practical guidance for the implementing agent:
- Treat every visible string as an i18n key, not a literal. Wire copy through the repo's localization layer.
- The prototype ships **Filipino (`fil`) and English (`en`)** variants per screen as a structural example of what needs translating — mirror that structure, but pull real strings from the repo.
- Keep the voice rules from `design.md §10` (e.g., Kai bubbles ≤2 lines; amounts peso-first; deadlines reassuring not alarming).
- Financial `aria-label`s must spell the value naturally (`"Kita: 18,400 piso"`), localized.

---

## Screens / Views
All screens sit on `surface` (`#fdfaf4`) with a subtle top/bottom daylight radial. Content column is full-width with **18px horizontal padding**, **~60px top** (clear status bar) and **~108px bottom** (clear bottom nav + safe area).

### 1. Home — "Kumustahan"
- **Purpose:** a warm hello, then the week's truth at a glance.
- **Layout (top→bottom):**
  1. **Time-of-day pill** (right-aligned): rounded 28px, translucent white, uppercase 11px label (`Umaga/Hapon/Gabi`) + tiny Kai mark.
  2. **Kumustahan hero card** — radius 24px, fill `linear-gradient(160deg, #fef3d9, #fde8c0)`. Contains: **CapizPattern at 8% opacity** behind (the *one* personality element), **FloatingPetals** ambient (≤6 nodes, motion-gated), **Kai hero ~94px** (`happy`) left, and right column: small honey label "`Good morning,`" (`primary #855300`, 14/600) → name in **Fraunces H1** (30/600) → question line in **Fraunces italic** (16, `primary`) → **one squiggle** underline. Below, a savings sentence with an inline tabular teal figure.
  3. **Kuwento (This Week's Story) card** — Level-1 card (`#f2ede4`, r16, no shadow). Header: 30px circle Kai mark + H3 title + date label + right `positive` status tag ("▲ 12%"). Body: **3-up KPI row** (`Kita/Gastos/Tubo`) — each a `surface-container-low` tile, profit tile uses `secondary #fef3d9`; values are **Number-md tabular teal** with count-up. Then a **banig bar chart** (7 bars, peak bar honey-gradient, baseline hairline). Footer: text button "Open details →" → navigates to Expenses.
  4. **Paper-note takeaway** — white card, `el-2` shadow, slight `-0.5deg` rotation, faux tape strip on top; a short Kai note.
  5. **Action grid** — 2-col, ~10px gap. Four tiles (Scan receipt, Talk to Kai, BIR reminders [+pending count badge], Right pricing). Tiles fill `secondary #fef3d9` (last one plain `surface-container`), single illustrated icon each, title 15/700 + 12px sub.

### 2. Chat — "Kausap si Kai"
- **Purpose:** talking to a partner, not a bot.
- **Layout:** Fixed **top bar** (Kai 32px disc + name + teal "online" status with dot), scrolling **message list**, fixed **composer**.
- **Bubbles (`design.md §8`):** Kai = `surface-container-lowest` white, **1px `outline-variant @24%` hairline**, radius `20px` with **6px notch bottom-left**; warm variant = `secondary #fef3d9` (greetings). User = honey **gradient `#f5b347→#d97706`**, white text, 6px notch bottom-right. Text 15/21, timestamp 11px. Typing indicator = 3 honey dots, 1.2s bounce.
- **Composer:** horizontally-scrolling **suggested-question chips** (white + hairline) above; recessed text field (`surface-container-low`, r22); **send = honey-gradient circle** 44px.
- **Behavior:** sending a message hides chips, appends user bubble, shows typing ~950ms, then a Kai reply. Some replies attach a **floating data card** (e.g., spend breakdown, weekly income) — Level-3 white card with tabular teal figures.

### 3. Resibo Scanner
- **Purpose:** instant, confident capture. **Full-bleed dark** screen (warm near-black `#0a0f08`) — the OS status bar flips to light here.
- **Layout:** top bar (close ✕ + title), camera frame with **honey corner brackets** + animated **scan sweep line** + hint text, and a **glass control bar** (gallery · big **70px shutter** · flash) with bottom safe-area padding.
- **Flow / states:**
  - `aim` → tap shutter →
  - `parsing` — dark blur overlay + **Kai `working` ~96px** + "reading your receipt…" (~1.9s) →
  - `result` — a **solid bottom sheet** slides up (`surface-container-lowest`, 28px top radius, Level-3 shadow, `ink-scrim` behind). Contains a Kai confirm bubble + an **editable Expense Card**: vendor + date + "New" tag, an **amount field** (tabular teal, editable), **category chips** (active = honey fill). Footer: secondary "Edit" + primary "Looks right, save". Save → return to Home + success toast.

### 4. Expenses — "Saan Napunta ang Pera?"
- **Purpose:** where the money went, calmly.
- **Layout:** H1 title + month chip; **donut card** (148px SVG donut, 20px stroke, category colors, **total in center as Number-md tabular teal** + legend with %); **Kai insight callout** (`secondary` fill, Kai 36px + one-line insight); **category breakdown** card (rows: color dot + name + **banig-textured progress bar** in category color + tabular amount, hairline dividers); **7-day spend strip** (bars, peak highlighted, baseline hairline).

### 5. BIR Deadlines — "Deadline Watcher"
- **Purpose:** turn tax anxiety into control.
- **Layout:** H1 + subtitle; **next-due highlighted card** (Level-3, warm cream gradient, left **warning-amber** 4px bar — *not red*) containing **Kai `concerned` 66px** + form code (H2) + `overdue` "3 days left" tag + reassuring body + primary CTA "Let's prepare it"; **upcoming list** card (rows: **date-chip** [month band + tabular day] + form code + name + neutral days-left tag, hairline dividers); a **persistent disclaimer** line (info glyph + muted text).

### App shell
- **Bottom nav** — translucent glass (`surface-container-lowest @82%` + blur 20px), 56px + 22px safe area, **4 tabs** (Umaga · Kai · Pera · Iba pa) with a **center Scan FAB** (honey-gradient 60px, floating −22px). Active tab = `primary` honey; inactive = `on-faint`. Labels 10–11/700–800.
- **More-tools bottom sheet** ("Iba pa") — lists secondary tools (BIR Deadlines, Pricing/Costing, Invoices, Reply Drafts, Daily Check-In, Sunday Story). In the prototype only Deadlines is built; the rest show a "coming soon" toast — **these are real planned features, build them out.**
- **Toast** — Level-3 card near the bottom, Kai mark + message, auto-dismiss ~2.6s.

---

## Interactions & Behavior
- **Navigation:** tab bar + FAB switch screens; action-grid tiles and the More sheet route to screens. Scan is a full-screen overlay (no tab bar).
- **Press states (`design.md §5/§6`):** `transform: scale(0.98)` + tone step to `surface-container-highest`, ~120ms. iOS no ripple; Android subtle bounded ripple `primary @12%`.
- **Number count-up:** KPIs/totals animate 0→value over **600ms (cubic ease-out), once on first paint**. Honor `prefers-reduced-motion` (render final value immediately). Prototype exposes this as a tweak; ship it on by default, subtle.
- **Card enter:** list/feed items stagger 40ms, opacity 0→1 + translateY 8→0, 300ms.
- **Bottom sheet:** scrim fade + slide-up 360ms; spec calls for drag-to-dismiss + rubber-band (prototype uses tap-scrim/buttons — add the gesture in native).
- **Scan sweep / petals / glow:** GPU transforms only; **disable entirely under reduced-motion / battery-saver.**
- **Haptics (Capacitor):** `impactLight` (CTA tap, tab switch), `impactMedium` (receipt captured, saved), `notificationSuccess` (milestone), `notificationWarning` (deadline ≤3 days, errors). Never on scroll.
- **Reduced motion:** every animation has a ≤160ms fade fallback (`design.md §6` table).

## State management
Per-screen, lightweight:
- **Global app state:** `activeScreen`, `persona` (which business profile), `lang` (`fil`/`en`), `countUp` (bool), `toolsSheetOpen`, `toast`.
- **Chat:** `messages[]` (`{who:'kai'|'me', text, tone?, card?, time}`), `isTyping`, `draft`, `showSuggestedChips`. Reply selection is keyword-matched in the prototype — replace with the real assistant/back-end.
- **Scan:** `phase` (`aim|parsing|result`), editable `amount`, `category`.
- **Data:** prototype reads mock personas + weekly series from `components/data.jsx`. Replace with real account data; keep amounts peso-first and **always teal**.

---

## Design Tokens
Full source: `prototype/app.css` (`:root`) and `design.md §3–§5, §11`. Light mode (ship light first; dark spec is in `design.md §3` — a warm near-black reroot, flagged as a separate high-blast-radius change).

### Color — surfaces
| Token | Hex | Role |
|---|---|---|
| `background` / `surface` | `#fdfaf4` | page |
| `surface-container-lowest` | `#ffffff` | base white / floating |
| `surface-container-low` | `#f8f4ec` | inputs / recessed |
| `surface-container` | `#f2ede4` | card bg (Level 1) |
| `surface-container-high` | `#ece7dd` | elevated / pressed-from |
| `surface-container-highest` | `#e7e1d6` | pressed |

### Color — ink, brand, semantic
| Token | Hex | Notes |
|---|---|---|
| `on-surface` | `#1c1c18` | primary text |
| `on-surface-variant` | `#5b4a38` | secondary text (AA) |
| `on-faint` | `#8a7558` | tertiary/muted |
| `primary` (honey text/CTA) | `#855300` | **use for honey TEXT** (AA 5.4:1) |
| `primary-container` (honey) | `#f59e0b` | **fills/icons/borders only — never text** |
| honey gradient | `#f5b347 → #d97706` | CTA bg; white label sits on darker stop |
| `secondary-container` | `#fef3d9` | soft honey tile / warm Kai bubble |
| `on-primary` | `#ffffff` | text on honey gradient (≥16px/700) |
| `tertiary` (teal) | `#006b54` | **ALL peso amounts** |
| `tertiary-container` | `#cdeee2` | success fill |
| `warning` | `#FBBF24` | deadline urgency accent |
| `error` (text) | `#c0392b` | AA on cream |
| `error-fill` | `#F87171` | error icons/fills |
| `error-pale` | `#fde0dc` | overdue tag fill |
| `outline-variant` | `rgba(91,74,56,0.20)` | ghost hairline |
| `outline-input` | `rgba(91,74,56,0.32)` | input bottom hairline (permitted) |
| `ink-scrim` | `rgba(28,24,16,0.45)` | sheet/scan scrim |

**Hard color rules:** financial amounts are *always* teal `#006b54`, tabular, peso-first (`₱18,400`). Honey `#f59e0b` is never body text (use `primary #855300`). Error *text* uses `#c0392b`; keep `#F87171` for fills/icons only.

### Typography (`design.md §4`) — Families: **Plus Jakarta Sans** (UI) + **Fraunces** (display/greeting serif)
| Role | Size/Line | Weight | Tracking | Family |
|---|---|---|---|---|
| Display | 40/44 | 600 | -0.02em | Fraunces |
| H1 | 30/36 | 600 | -0.02em | Fraunces |
| H2 | 22/28 | 700 | -0.01em | Jakarta |
| H3 | 18/24 | 600 | — | Jakarta |
| Body | 15/22 | 400 | — | Jakarta |
| Body-strong | 15/22 | 600 | — | Jakarta |
| Label | 11/14 | 700 | 0.08em (uppercase) | Jakarta |
| **Number-lg** | 30/32 | 700 | -0.01em | Jakarta **tabular-nums** |
| **Number-md** | 20/24 | 700 | -0.01em | Jakarta tabular-nums |
| **Number-sm** | 15/18 | 700 | — | Jakarta tabular-nums |

All financial figures: `font-variant-numeric: tabular-nums`, weight 700, teal.

### Radii · Elevation · Easing
- Radii: `sm 12 · card 16 · floating 24 · sheet-top 28`.
- **Level 1 (static card):** `surface-container`, **no shadow** — separated by tone.
- **Level 2 (raised/press):** `surface-container-high` + `0 1px 2px rgba(120,80,10,0.10)`.
- **Level 3 (floating: sheet/FAB/toast):** `surface-container-lowest` + `0 1px 3px rgba(120,80,10,0.14), 0 12px 32px -8px rgba(176,100,16,0.18)` (warm two-layer, never grey).
- **Glass** only on bottom nav + scan overlay.
- Easing: `standard cubic-bezier(0.2,0,0,1)` · `spring cubic-bezier(0.34,1.4,0.64,1)` (Kai/celebration only).

### Status tags (`design.md §8`) — pill, 11/700, 0.04em
| State | Fill | Text |
|---|---|---|
| Positive/Paid/On-track | `#cdeee2` | `#006b54` |
| Pending/Due-soon | `#fef3d9` | `#855300` |
| Overdue/Error | `#fde0dc` | `#c0392b` |
| Neutral/Info | `#ece7dd` | `#5b4a38` |

### Components quick-ref (`design.md §11`)
- **Primary CTA:** honey gradient, white ≥16/700, 52px, r16, press scale 0.98 + 6% darken.
- **Secondary:** `surface-container-high` fill, 16/600, 52px, r16.
- **Inputs:** `surface-container-low` fill, **bottom hairline** `outline-variant @32%`, 52px, r12; focus = honey 2px bottom + `secondary` tint.
- **Chips:** 32–34px, r999; active honey fill + white; suggested = white + hairline.
- **Charts:** banig-textured bars (base `#f0c878`, peak honey-gradient), baseline hairline, tabular 11px Y-labels; donut 20px stroke, total center Number-lg teal.

---

## Assets
- **Kai** — PLACEHOLDER ONLY here (`components/kai-placeholder.jsx`). Supply the real raster expression set (waving/happy/working/thinking/concerned/celebrating + a seated/onboarding variant) at ≥3× for 120–160px, transparent bg, circle-masked.
- **UI icons** — `components/icons.jsx` are illustration-style SVGs (receipt, chat, coins, calendar, price tag, invoice, etc.). These are fine to reuse as references or replace with the repo's icon set; they are *not* Kai.
- **Motifs** — CapizPattern, FloatingPetals, banig texture, squiggle, sampaguita: accents only, **one personality element per screen max** (`design.md §9`).
- **Fonts** — Plus Jakarta Sans + Fraunces (Google Fonts in prototype; use the repo's font pipeline).

## Files (in `prototype/`)
| File | Contains |
|---|---|
| `AKBai Warm Precision.html` | app shell: bottom nav + FAB, routing, More sheet, Tweaks, toast |
| `app.css` | **all design tokens** + component styles (Warm Precision) |
| `app/ui.jsx` | `PesoNum` (tabular count-up), `Tag`, `Squiggle`, `FloatingPetals`, etc. |
| `app/screen-home.jsx` | Home / Kumustahan |
| `app/screen-chat.jsx` | Chat + reply data cards |
| `app/screen-scan.jsx` | Scanner (aim→parsing→editable expense sheet) |
| `app/screen-expenses.jsx` | Saan Napunta (donut + bars + insight) |
| `app/screen-deadlines.jsx` | BIR Deadlines |
| `components/kai-placeholder.jsx` | **Kai placeholder** (replace with real asset) |
| `components/data.jsx` | mock personas, weekly series, formatters (replace with real data) |
| `components/icons.jsx` | UI icon set |
| `frames/ios-frame.jsx` | **presentation-only** iPhone bezel — strip on implementation |
| `../design.md` | **canonical direction spec** (color/type/motion/voice/screens) |

## Implementation checklist
- [ ] Recreate screens in the repo's stack (React + Tailwind + Shadcn / Capacitor), mobile-first; strip the iPhone frame + scaling JS.
- [ ] Wire tokens into the existing theme; honor exact hex/type/elevation values.
- [ ] Replace the Kai placeholder with the real asset set; respect size + expression per slot.
- [ ] Pull all copy + the fil/en toggle from the repo's reference/voice/i18n files (not the prototype strings).
- [ ] All amounts teal + tabular + peso-first; KPI count-up 600ms once.
- [ ] Connect real data + assistant back-end; build out the "coming soon" tools.
- [ ] Add native gestures (sheet drag-to-dismiss) + Capacitor haptics; honor reduced-motion/battery-saver.
- [ ] Verify AA contrast pairings from `design.md §3/§12`.
