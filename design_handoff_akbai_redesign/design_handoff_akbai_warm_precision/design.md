# AKBai Design Direction — "Warm Precision"

> design.md · evolves "The Art of Warmth / Sun-Drenched Atelier"
> Owner: Design · Audience: Eng (Next.js 16 + Tailwind + Shadcn/UI, Capacitor iOS/Android)
> Status: direction spec for implementation. Voice is LOCKED; visuals evolved.

---

## 1. Direction Summary

**Warm Precision** keeps AKBai's sun-drenched, light-first warmth as its soul, but grows it into a premium native app that feels precise and trustworthy with people's money. We quiet the decoration so two things can lead: **the numbers** (calm, confident, well-set financial data) and **Kai** (a character with real presence at a few earned hero moments). Cream-and-honey stays; the clutter goes. Every surface should feel like daylight on good paper — and every peso figure should feel counted, not decorated.

The north star: *parang katuwang na maaasahan* — a partner you trust because the work is clearly, calmly done.

---

## 2. Design Principles (evolved)

The original six, diffed. New count: **7** (added the tension-resolution principle).

1. **No-Line, but earn the exception** — *CHANGE.* Was: never use 1px solid borders. Now: tonal separation is still the default, but a hairline `outline-variant @ 32%` is permitted on **inputs, table rows, and chart baselines** where AA legibility or scan-ability needs it. Rationale: pure tonal layering reads as "soft web app"; surgical hairlines read as "precise native app." Still no decorative boxes.

2. **Tonal Layering** — *KEEP.* Hierarchy still comes from stacked surface tones first. We add one elevation tool (see §5) for genuinely floating material (sheets, FAB, sticky CTA), not for static cards.

3. **Ambient Shadows → Daylight Elevation** — *CHANGE.* Was: amber-tinted shadow, primary @8%, 40–60px blur. Now: a **two-layer warm shadow** (a tight contact layer + a soft ambient layer, both warm-tinted, never grey) reserved for floating material only. Static cards use tone, not shadow. Rationale: native depth needs a crisp contact shadow; one blurry amber glow alone looks web-y.

4. **Ghost Border Fallback** — *KEEP* (folded into Principle 1).

5. **Glass, sparingly** — *CHANGE.* Was: floating nav/modals at 80% bg + 20px blur. Now: glass only on the **bottom nav and the scan overlay**. Bottom sheets are **solid** surface-container-lowest (glass on a full sheet hurts text contrast and costs GPU on mid-range Android). Rationale: performance + legibility.

6. **Editorial Typography → Data-Confident Typography** — *CHANGE.* Was: weight-800 for display + key numbers. Now: numbers get a dedicated treatment — **tabular figures, weight-700, -0.01em, tertiary (teal)** — distinct from display headlines (Fraunces). Big numbers should read as *measured*, not *shouty*. Rationale: 800-everywhere flattens hierarchy; reserving a precise number style signals fintech trust.

7. **Quiet so Kai and the numbers lead** — *ADD (the B↔C resolution).* Decoration density goes down; Kai's presence goes *up* — but only through **character quality and a few hero moments**, never scattered motif wallpaper. Rule of thumb: on any given screen, you get **at most one** "personality" element (a Kai hero OR a motif accent, not both) plus the data. If you're tempted to add a second decorative flourish, delete it. Kai earns attention by being *present and expressive where it matters* (greeting, empty, celebration, error-recovery), and absent everywhere else.

---

## 3. Color System

Token **names are locked** (MD3 semantic). Hex values retuned toward a slightly cooler-neutral paper in light mode (less yellow cast for long-session comfort and AA), and a richer ink in dark mode. Honey and teal anchors are preserved.

### Light

| Token | Role | Old | New | Status |
|---|---|---|---|---|
| background / surface | Page bg | #fdf9f2 | **#fdfaf4** | RETUNED (¼-step lighter, less yellow) |
| surface-container-lowest | Base white | #ffffff | #ffffff | SAME |
| surface-container-low | Recessed / inputs | #f7f3ec | **#f8f4ec** | RETUNED |
| surface-container | Card bg | #f1ede7 | **#f2ede4** | RETUNED |
| surface-container-high | Elevated | #ebe8e1 | **#ece7dd** | RETUNED |
| surface-container-highest | Pressed / heavy | #e6e2db | **#e7e1d6** | RETUNED |
| on-surface | Primary text | #1c1c18 | #1c1c18 | SAME |
| on-surface-variant | Secondary text | #534434 | **#5b4a38** | RETUNED (AA on new cards) |
| primary | Brand action (text/CTA) | #855300 | #855300 | SAME |
| primary-container | Honey highlight | #f59e0b | #f59e0b | SAME |
| on-primary | Text on honey | — | **#ffffff** | NEW (token formalized) |
| secondary-container | Soft honey fill (tiles) | — | **#fef3d9** | NEW |
| tertiary | Trust / financial data | #006b54 | #006b54 | SAME |
| tertiary-container | Success fill | — | **#cdeee2** | NEW |
| error | Error only | #F87171 | **#c0392b** | RETUNED (AA on cream for text; keep #F87171 for fills/icons) |
| warning | Warning | #FBBF24 | #FBBF24 | SAME |
| outline-variant | Ghost border | #534434 @20% | **#5b4a38 @20%** | RETUNED |
| sampaguita | Petal/accent white | — | **#ffffff** | NEW (motif token) |
| ink-scrim | Sheet/scan scrim | — | **rgba(28,24,16,0.45)** | NEW |

### Dark

| Token | Old | New | Status |
|---|---|---|---|
| background / surface | #07101e | **#0a0f08** (warm near-black, not blue-black) | RETUNED |
| surface-container-lowest | #030812 | **#070b05** | RETUNED |
| surface-container-low | #0a1422 | **#11160d** | RETUNED |
| surface-container | #0d1a2e | **#171d12** | RETUNED |
| surface-container-high | #111f36 | **#202618** | RETUNED |
| surface-container-highest | #172740 | **#2a3120** | RETUNED |
| on-surface | #e6e2db | #e9e3d6 | RETUNED |
| on-surface-variant | #d8c3ad | #d8c3ad | SAME |
| primary | #ffb95f | #ffb95f | SAME |
| primary-container | #f59e0b | #f59e0b | SAME |
| tertiary | #43deb4 | #43deb4 | SAME |
| error | #F87171 | #F87171 | SAME |
| outline-variant | #d8c3ad @20% | #d8c3ad @20% | SAME |

> **Direction change worth flagging:** dark mode moves from a *blue ink* (#07101e) to a *warm near-black* (#0a0f08). The old blue fought the warm identity. This is a visible, app-wide change — see §13.

### Usage rules

- **Financial amounts are always `tertiary` (teal), formatted, peso-first** (`₱18,400`). Never honey, never ink, never error-red for amounts. Negative cash flow uses `error` only on the **delta/label**, not the figure.
- **Honey (`primary-container`) is for action and one brand accent per screen** — the primary CTA, the active nav state, one highlight. It is not a background wash.
- **`secondary-container` (#fef3d9)** is the soft honey used for action-tile fills and Kai's chat bubbles' warm variant.
- **Tone first for separation.** Reach for `outline-variant` only on inputs, list dividers, chart baselines.

### AA contrast (verified pairings)

| Pairing | Ratio | Verdict |
|---|---|---|
| on-surface #1c1c18 on surface #fdfaf4 | ~15.8:1 | ✅ AAA |
| on-surface-variant #5b4a38 on surface-container #f2ede4 | ~6.9:1 | ✅ AA (body), ✅ AAA (large) |
| tertiary #006b54 on surface #fdfaf4 | ~5.2:1 | ✅ AA |
| tertiary #006b54 on surface-container #f2ede4 | ~4.8:1 | ✅ AA (≥4.5) |
| **primary #855300 on surface #fdfaf4** | ~5.4:1 | ✅ AA — use this for honey *text*, NOT #f59e0b |
| **#f59e0b honey on cream (text)** | ~2.0:1 | ❌ FAIL — honey is fills/icons/borders only, never body text. For "honey text" use `primary` #855300. |
| on-primary #ffffff on honey #f59e0b | ~2.1:1 | ⚠️ For large/bold button labels only (≥18px/700 → passes AA large at 3:1... **#f59e0b @ ~2.1 still fails 3:1**). **Mitigation:** primary CTA uses the honey **gradient ending at #d97706**; white label sits on the darker stop. White-on-#d97706 ≈ 3.3:1 → ✅ AA large. Specify CTA labels ≥16px/700. |
| error #c0392b on surface #fdfaf4 | ~5.9:1 | ✅ AA (this is why error text retuned from #F87171) |

---

## 4. Typography

Families unchanged: **Plus Jakarta Sans** (UI) + **Fraunces** (display/editorial/greeting serif).

| Role | Size / Line | Weight | Tracking | Family | Change |
|---|---|---|---|---|---|
| Display | 40 / 44 | 600 | -0.02em | Fraunces | CHANGE: was 48/800. Lighter weight, slightly smaller — calmer, more editorial than shouty. |
| H1 | 30 / 36 | 600 | -0.02em | Fraunces | CHANGE: was 32/800. |
| H2 | 22 / 28 | 700 | -0.01em | Jakarta | RETUNED |
| H3 | 18 / 24 | 600 | normal | Jakarta | SAME |
| Body | 15 / 22 | 400 | normal | Jakarta | SAME |
| Body-strong | 15 / 22 | 600 | normal | Jakarta | ADD |
| Chat | 15 / 21 | 400 | normal | Jakarta | CHANGE: bumped 14→15 for mid-range-screen legibility |
| Label | 11 / 14 | 700 | 0.08em (uppercase) | Jakarta | SAME |
| **Number-lg** | 30 / 32 | 700 | -0.01em | Jakarta **tabular-nums** | NEW |
| **Number-md** | 20 / 24 | 700 | -0.01em | Jakarta tabular-nums | NEW |
| **Number-sm** | 15 / 18 | 700 | normal | Jakarta tabular-nums | NEW |

**Data-confident number styling (the headline change):** all financial figures use `font-variant-numeric: tabular-nums`, weight-700, tertiary teal, peso-first. Tabular figures make columns of money line up and stop the "jitter" that makes amounts feel untrustworthy. Display headlines are **no longer** weight-800 — that emphasis now belongs to numbers, so the two never compete. Greetings stay Fraunces (warmth); data stays Jakarta-tabular (precision).

---

## 5. Depth, Elevation & Material

A 3-level system. Static content never floats; only interactive/floating material does.

- **Level 0 — Page.** `surface`. No shadow.
- **Level 1 — Card (static).** `surface-container`. **No shadow** — separated by tone only (No-Line heritage). Corner radius **16px**.
- **Level 2 — Raised (tappable cards on press, popovers).** `surface-container-high` + **contact shadow**: `0 1px 2px rgba(120,80,10,0.10)`. Radius 16px.
- **Level 3 — Floating (bottom sheets, FAB, sticky CTA, toast).** `surface-container-lowest` + **two-layer warm shadow**:
  ```
  box-shadow:
    0 1px 3px rgba(120,80,10,0.14),     /* contact */
    0 12px 32px -8px rgba(176,100,16,0.18); /* ambient, warm — never grey */
  ```
  Radius 24px (sheets: 28px top corners only).

**Glass** survives only on: bottom nav (`surface-container-lowest @ 82%` + `backdrop-blur(20px)`) and the scan camera overlay. Everything else is solid.

**Native material feel:** press states use a **scale + tone** combo, not a ripple-only — `transform: scale(0.98)` + step to `surface-container-highest`, 120ms. iOS gets no Android ripple; Android keeps a subtle bounded ripple in `primary @ 12%`.

---

## 6. Motion & Interaction

Global easing tokens:
- `ease-standard: cubic-bezier(0.2, 0, 0, 1)` (most transitions)
- `ease-emphasized: cubic-bezier(0.2, 0, 0, 1)` enter / `cubic-bezier(0.3, 0, 0.8, 0.15)` exit
- `ease-spring: cubic-bezier(0.34, 1.4, 0.64, 1)` (playful pops — Kai, celebrations only)

| Interaction | Spec | Reduced-motion fallback |
|---|---|---|
| Screen push (native stack) | Slide-in 320ms ease-standard, parallax: outgoing -30% x, incoming 100%→0 | Cross-fade 160ms, no translate |
| Screen modal (sheet up) | 360ms ease-emphasized, scrim fade `ink-scrim` | Fade 160ms |
| Card enter (list/feed) | Stagger 40ms, each: opacity 0→1 + translateY 8px→0, 300ms ease-standard | Opacity only, no translate, no stagger |
| Card press | scale 0.98 + tone step, 120ms | tone step only |
| Bottom sheet | drag-to-dismiss, rubber-band; snap 280ms ease-emphasized | tap-scrim-to-close, fade |
| Swipe on card (delete/file) | follows finger; threshold 40% reveals action color; spring back 240ms ease-spring | show explicit action buttons instead of swipe |
| Pull-to-refresh | Kai mark rotates with pull; release → 1 calm spin + haptic | static spinner, no Kai spin |
| Long-press (context menu) | 320ms hold → haptic + menu pop 200ms ease-spring | also reachable via "⋯" affordance |
| Number count-up (KPIs) | 600ms ease-standard on first paint of a value | render final value immediately |
| Kai expression change | cross-fade frames 200ms | instant swap |

**Haptic moments (Capacitor Haptics):**
- `impactLight` — primary CTA tap, tab switch, swipe threshold reached.
- `impactMedium` — receipt captured, check-in saved, invoice marked paid.
- `notificationSuccess` — milestone / celebration / streak.
- `notificationWarning` — BIR deadline ≤3 days surfaced, error states.
- Never haptic on scroll or passive surfacing.

Performance: cap simultaneous animated nodes; `FloatingPetals` ≤6 nodes, GPU-composited transforms only, and **disabled entirely on `prefers-reduced-motion` and when battery-saver is detected**.

---

## 7. Kai Visual Treatment

Persona + voice **unchanged**. Visual presence elevated, but concentrated.

**Expression → context map:**
| Expression | Used at |
|---|---|
| waving | Onboarding step 1, first-ever home open |
| happy | Default home greeting, confirmations |
| working | Scanning a receipt, generating a draft, loading |
| thinking | Composing a chat reply, computing costing |
| concerned | BIR deadline ≤3 days, negative cash flow, errors |
| celebrating | Milestones, streaks, first profit, paid invoice |

**Sizing per context:**
- Home hero (Kumustahan): **96–120px**, the one big moment on the screen.
- Onboarding: up to **160px** (KaiSitting variant).
- Empty states: **120px**, centered.
- Chat avatar: **32px**.
- Inline confirm bubble / takeaway note: **28px**.
- Nav / chrome: **22px** mark only (not the full character).

**Hero moments (the only places Kai is large):** home greeting, onboarding, empty states, celebration/milestone overlays, and error-recovery screens. **Everywhere else Kai is a 22–32px mark or absent.** This is the literal mechanism that reconciles "calmer" with "Kai-forward": fewer, bigger, better Kai — not Kai sprinkled everywhere.

Rendering: Kai is a raster character asset (the re-rendered illustration set) with a transparent background, **circle-masked** when placed on warm surfaces so no rectangle edge shows. A subtle `sun-slow` radial glow (`primary @ 10%`) is allowed *behind the hero Kai only*.

---

## 8. Chat + Card Evolution

Pattern **unchanged** (bubble → card → action → confirm bubble). Styling modernized.

**Chat bubbles:**
- Kai bubble: `surface-container-lowest` (white) with a **1px `outline-variant @ 24%` hairline** (new — gives crisp native edge), radius `20px` with a 6px notch on the bottom-left. Warm variant for greetings/celebration: `secondary-container` #fef3d9.
- User bubble: honey **gradient** (#f5b347→#d97706), `on-primary` white text, radius 20px, 6px notch bottom-right.
- Chat text: 15/21. Max 2 lines per Kai bubble (voice rule). Timestamp 11px on-surface-variant.
- Typing indicator: 3 honey dots, 1.2s bounce.

**Card anatomy (all card types):**
- Container: Level 1 (`surface-container`, 16px radius, no shadow at rest; Level 2 on press).
- **Header:** 20px leading icon + H3 title + right-aligned **status tag**. 12px gap below.
- **Body:** the scannable primary data. Financial figures = Number-lg/md, tertiary, tabular. This is the visual center of gravity.
- **Footer:** primary action (text button, honey `primary`) + optional secondary (on-surface-variant). 44px min touch height. 12px gap between.

**Status tags (pill, 11px/700, 0.04em):**
| State | Fill | Text |
|---|---|---|
| Positive / Paid / On-track | tertiary-container #cdeee2 | tertiary #006b54 |
| Pending / Due-soon | secondary-container #fef3d9 | primary #855300 |
| Overdue / Error | #fde0dc | error #c0392b |
| Neutral / Info | surface-container-high | on-surface-variant |

**Card types:**
- **Expense Card** — icon + vendor + category tag; body = `₱3,240` (Number-lg, teal); footer = "I-edit" / "Tama na". Editable fields on tap.
- **Morning Briefing Card** — Kai mini-avatar + date; body = 3 KPIs (Kita/Gastos/Tubo) in a tabular row, profit highlighted; footer = "Buksan ang detalye →".
- **BIR Deadline Card** — calendar date-chip (left) + form code pill + days-left; concerned tone + warning warm-amber accent when ≤3 days; footer = "I-prepare natin".
- **Invoice Card** — INV# + client + amount (teal, tabular) + status tag (Paid/Pending/Overdue); footer = "I-follow up" on overdue.
- **Costing Card** — product + cost/markup; body = recommended price (Number-lg, teal) + margin; footer = "I-save ang presyo".

---

## 9. Decorative Motif Vocabulary

Motifs survive but become **accents, never wallpaper**. The enforcement rule (Principle 7): **one personality element per screen, max.**

| Motif | Status | Allowed | Forbidden |
|---|---|---|---|
| CapizPattern | KEEP, dialed to ≤8% opacity | Behind the home Kumustahan hero only | Any list/feed/card background, any other screen |
| FloatingPetals | KEEP, ≤6 nodes, motion-gated | Home hero ambient + celebration overlays | Everywhere else; off under reduced-motion / battery-saver |
| WovenDivider (banig) | KEEP | One per screen as a section divider; banig texture on chart bars | Stacked repeatedly; as a full background |
| Sunburst glow | KEEP, ≤10% | Behind hero Kai only | As a button/card texture |
| TapeStrip + paper-note card | KEEP, sparingly | Kai's check-in invite + weekly takeaway note (1–2 per app) | Generic cards, lists |
| Squiggle underline | KEEP — **one per screen** | Under the greeting question line | Under every heading (this was the over-use we cut) |
| Sampaguita | KEEP, tiny | Time-of-day pill icon, chart peak marker | As repeating background, as a divider garland (cut — read as too floral) |
| SwayingLeaf | DEMOTE | Home hero corner only, low opacity | Anywhere data lives |
| DoodleArrow | RESTRICT | Onboarding coachmarks only | Production screens |
| bahay-kubo / fiesta / religious | FORBIDDEN | — | Everywhere |

---

## 10. Screen-by-Screen Direction

Format: **intent** · key visual changes · sample copy (conversational Filipino).

**Home (Kumustahan + action grid + Kuwento card)** — *Intent: a warm hello, then the week's truth at a glance.* Hero Kai (96–120px) + time-aware greeting (Fraunces) + one squiggle under the question line. Below: a **3-up KPI row** (Kita/Gastos/Tubo, tabular teal, profit highlighted) leading the Kuwento card, banig-bar weekly chart, one paper-note takeaway from Kai. Action grid = 4–5 soft `secondary-container` tiles, single icon each (no corner motifs). CapizPattern ≤8% behind hero only.
Copy: *"Magandang umaga, Maria! Nakaipon ka ng ₱8,400 ngayong linggo — mas mataas kaysa noong nakaraan."*

**Chat (Kausap si Kai)** — *Intent: talking to a partner, not a bot.* Top bar: Kai 32px + "Nandito ako para sa'yo" status. Evolved bubbles (§8). Suggested-question chips above composer; send = honey-gradient circle.
Copy: *"Ano'ng gusto mong malaman? Pwede mo akong tanungin kung saan napunta ang pera mo."*

**Resibo Scanner** — *Intent: instant, confident capture.* Full-bleed dark (warm near-black), honey corner brackets, glass control bar, big shutter. `working` Kai during parse. Result slides up as an editable Expense Card.
Copy: *"Na-scan ko na — ₱3,240 sa Divisoria. I-check mo kung tama bago natin i-save."*

**Expenses (Saan Napunta)** — *Intent: where the money went, calmly.* Donut + total (tabular teal), category bars (banig texture, category colors), one Kai insight callout, 7-day bar strip. Hairline baselines allowed on charts.
Copy: *"Pinakamalaki ngayong buwan: Paninda, ₱18,400. Tumaas ng 18% kaysa noong nakaraang buwan."*

**BIR Deadlines (Deadline Watcher)** — *Intent: anxiety → control.* Date-chip list; next-due card highlighted; `concerned` Kai + warm-amber (not red) urgency ≤3 days; footer "I-prepare natin." Persistent disclaimer.
Copy: *"3 araw na lang bago ang 2551Q mo. Wag kang mag-alala — i-prepare natin ngayon ang numero mo."*

**Onboarding (Kilala Kita, 5-step)** — *Intent: a guided kumustahan.* KaiSitting up to 160px, `waving`→`happy`. One question per step, big tappable cards, DoodleArrow coachmarks allowed here only. Progress dots in honey.
Copy: *"Kumusta! Ako si Kai. Bago tayo magsimula — anong klaseng negosyo meron ka?"*

**Login** — *Intent: warm, trustworthy entry.* Cream page, centered Kai mark + wordmark, single honey-gradient CTA, OTP/magic-link. CapizPattern ≤6% behind logo.
Copy: *"I-type mo lang ang number mo — padadalhan kita ng code."*

**Paywall / Subscription** — *Intent: clear value, no pressure.* `celebrating` Kai small; 3 tier cards, Pro highlighted with honey border + status tag; numbers tabular; benefits as teal-check list.
Copy: *"Sa Pro, walang limit ang pag-scan ng resibo — para hindi ka na mag-isip kung ilan pa."*

**Morning Briefing card** — *Intent: proactive daily truth.* (Card spec §8.) Appears top of home each morning; count-up on KPIs; one CTA.
Copy: *"Eto ang umaga mo: ₱2,300 ang benta kahapon, at may 1 deadline ngayong linggo."*

**Empty / Loading / Error states** —
- *Empty:* 120px Kai (context expression) + one-line invite + one CTA. No data chrome.
  Copy (no expenses yet): *"Wala pa tayong na-track na gastos. I-scan natin ang unang resibo mo?"*
- *Loading:* skeleton cards in `surface-container-low`; `working` Kai for waits >800ms; shimmer ≤1 sweep/1.5s.
  Copy: *"Sandali lang, tinitingnan ko ang mga numero mo…"*
- *Error:* `concerned` Kai, plain-language cause + recovery CTA, never a code.
  Copy: *"May nangyaring mali sa pag-save. Wag kang mag-alala — subukan nating ulit."*

---

## 11. Component Specs

**Primary CTA (honey).** Gradient `#f5b347→#d97706`, label `on-primary` white ≥16px/700, height 52px, radius 16px, full-width on mobile. States: rest (gradient) · press (scale 0.98 + darken 6%) · disabled (`surface-container-highest`, on-surface-variant @50%) · loading (inline working-Kai 20px + label). Haptic `impactLight`.

**Secondary button.** `surface-container-high` fill, `on-surface` label 16px/600, no border, 52px, radius 16px. Press → `surface-container-highest`.

**Text button.** `primary` #855300 label, 15/600, 44px touch min, no fill.

**Pills / chips.** Height 32px, radius 999px, 13/600, 6×12 padding. Filter chip active = honey fill + white; inactive = surface-container-high + on-surface-variant. Suggested-question chip = surface-container-lowest + outline-variant @24% hairline.

**Cards.** §8. 16px radius, `surface-container`, 16px padding, no rest shadow, Level 2 on press.

**Bottom nav.** Glass (`surface-container-lowest @82%` + blur 20px), height 56px + safe-area inset, 4 items (Umaga / Kausap / Pera / Iba pa) + optional center scan FAB. Active = honey mark + label; inactive = on-surface-variant. Labels 11/700.

**Bottom sheet / drawer.** Solid `surface-container-lowest`, 28px top radius, Level 3 shadow, drag handle (32×4, outline-variant), `ink-scrim` behind. Drag-to-dismiss + rubber-band.

**Inputs.** `surface-container-low` fill, **bottom hairline `outline-variant @32%`** (permitted exception), 15px text, 52px height, radius 12px. Focus = honey 2px bottom border + `secondary-container` tint. Label 11/700 uppercase above. Error = error #c0392b hairline + helper text.

**Status tags.** §8 table. 11/700, 0.04em, 2×8 padding, radius 999px.

**Charts (financial viz).** Banig-textured bars: base honey-light `#f0c878`, peak `#f5b347→#d97706` + sampaguita marker. Baseline = outline-variant hairline (permitted). Y-labels tabular 11px on-surface-variant. Donut: 20px stroke, category colors, total in center (Number-lg teal). All chart numbers tabular. Bars animate height 0→value 500ms ease-standard (instant under reduced-motion).

---

## 12. Accessibility

- **Contrast:** all text pairings verified §3. Hard rules: honey #f59e0b never used for text (use `primary` #855300); error text uses #c0392b not #F87171; white CTA labels sit on the gradient's darker stop and are ≥16px/700.
- **Touch targets:** 44×44px minimum everywhere; nav items 48×56; swipe actions also exposed as buttons for motor accessibility.
- **Reduced motion:** every motion row in §6 has a fallback; petals/sunburst/count-up/parallax all disable; transitions degrade to ≤160ms fades.
- **Screen reader / aria:**
  - Financial amounts get an `aria-label` spelling out the value and meaning: `aria-label="Kita: 18,400 piso"` (not just "₱18,400") so VoiceOver/TalkBack read it naturally.
  - Cards are a single focusable group with an accessible name from the header; footer actions are separately focusable buttons.
  - Status tags include text, never color-only — overdue says "Overdue," not just red.
  - Kai decorative imagery is `aria-hidden`; Kai's chat messages are real text in the a11y tree.
  - Live regions: new Kai chat bubbles + toast use `aria-live="polite"`; errors `assertive`.
- **Dynamic type:** layouts reflow to ≥130% font scale without truncation on cards and KPIs.

---

## 13. What Changed vs "Art of Warmth" — Migration Notes

**Retuned tokens (old → new), light:** background #fdf9f2→#fdfaf4 · surface-container #f1ede7→#f2ede4 · surface-container-high #ebe8e1→#ece7dd · surface-container-low #f7f3ec→#f8f4ec · surface-container-highest #e6e2db→#e7e1d6 · on-surface-variant #534434→#5b4a38 · error #F87171→#c0392b (text; fills keep #F87171). **Dark:** all surfaces move from blue-ink to warm-near-black (#07101e→#0a0f08 etc.). **Additive tokens:** on-primary, secondary-container, tertiary-container, sampaguita, ink-scrim.
→ *Breaking-ish:* dark-mode surface shift is visible app-wide; error-text change touches error styles. *Additive:* new tokens.

**Principles:** No-Line now allows surgical hairlines (inputs/rows/charts) · Ambient Shadow → two-layer Daylight Elevation on floating material only · Glass restricted to nav + scan · Editorial-800 → Data-Confident tabular numbers · added Principle 7 (quiet-so-Kai/numbers-lead).

**Typography:** Display/H1 drop 800→600 and downsize slightly; **new Number-lg/md/sm tabular styles** (touches every KPI/amount); Chat 14→15.

**Components — new/changed:** new elevation Level 3 shadow recipe; new status-tag system; chat bubbles gain hairline; inputs gain bottom hairline + focus tint; charts gain tabular labels + hairline baseline. **Removed/demoted:** sampaguita garland divider (removed), per-heading squiggles (now one per screen), tile corner motifs (removed), SwayingLeaf/DoodleArrow demoted to hero/onboarding only, full-sheet glass (removed).

**Files likely touched broadly:** the Tailwind/CSS variable theme (token retune), any number-rendering component (tabular styles), dark-mode theme, card + chat-bubble components, chart component, bottom sheet/nav. Flag the dark-mode + number-style changes as the two highest-blast-radius edits.

---

## 14. Open Questions / Decisions for Anton

1. **Dark-mode reroot (blue→warm-black):** biggest visible change. Ship now or stage behind a flag? I recommend now — the old blue contradicted the brand.
2. **Error red retune (#F87171→#c0392b for text):** confirm OK to keep #F87171 for icons/fills while text uses the darker AA-passing red.
3. **Scan tab vs FAB:** desktop sidebar has 5 items incl. Scan; mobile nav I spec'd at 4 + center scan FAB. Confirm Scan should be a FAB on mobile, not a 5th tab.
4. **Kai asset pipeline:** hero moments assume transparent-bg raster expressions at ≥3× for 120–160px. Do we have all six expressions + KaiSitting at that resolution, or do some need re-rendering?
5. **Count-up on KPIs:** nice for "data feels alive," but is it too playful for "fintech-serious"? I lean keep-but-subtle (600ms, once). Your call.
6. **Tagalog day labels:** charts currently use M/T/W/Th/F/Sa/Su per earlier feedback. Confirm we keep English day initials app-wide (vs Lun/Mar/etc.).
7. **Battery-saver detection** for disabling ambient motion — acceptable to use a heuristic (reduced-motion + low-end device hint) since web battery API is unreliable on iOS?
