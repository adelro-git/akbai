# Warm Precision — Implementation Plan (build intake)

> Source spec: `design.md` ("Warm Precision", evolves "Art of Warmth")
> Status: **PLAN ONLY — no code applied.** Awaiting timing/path decision.
> Validated against codebase 2026-05-29. This plan is the authoritative build brief; where it
> contradicts the incoming `design.md`, **this plan wins** (the spec was authored without repo access).

---

## 0. How to read this

The work is decomposed into independent **workstreams (W1–W12)**. §3 maps each adoption path
(safe-subset / dedicated sprint / deferred) to the workstreams it pulls, so you can pick timing later
and hand the relevant slice to `/build` without re-planning. Estimates use **Agent Size** (agent
effort: S ≈ ½ day, M ≈ 1 day, L ≈ 2+ days of agent work) + **Anton Time** (your review minutes),
per our multi-agent workflow convention.

---

## 0.5 Handoff reconciliation (2026-05-30 — decisions locked)

Claude Design delivered a high-fidelity prototype — now the **visual source of truth**:
`design_handoff_akbai_redesign/design_handoff_akbai_warm_precision/`.
- **W1 token source:** `prototype/app.css` `:root` — exact light-mode hex (convert to HSL into `globals.css`).
- **W2 reference:** `prototype/app/ui.jsx` `PesoNum` (tabular, teal, 600ms cubic count-up, reduced-motion-gated).
- **Layout/behavior reference:** 5 screen JSX (home/chat/scan/expenses/deadlines) + README implementation notes.

**Anton's decisions (locked):**
- **Kai:** use **current available assets** (vector SVG expressions + `KaiSitting` raster) in the placeholder slots — do NOT gate on the Gemini-evolved set. Hero sizes (96–120px) use scaled current art for now.
- **Nav:** **adopt 4-tab + center Scan FAB** (Umaga·Kai·Pera·Iba pa + FAB). Replaces the current 5-tab Scan-as-tab; reshapes the More drawer. **(Supersedes §1 item 5.)**
- **Error red:** keep `#ba1a1a` (already AA, already wired) — do NOT adopt the prototype's `#c0392b`. (Confirms §1 item 7.)
- **Count-up:** keep on, subtle (600ms once, reduced-motion-aware).
- **Scope:** **light-mode only** this sweep — dark reroot is a separate workstream. Voice locked (copy from repo i18n, never prototype strings).
- Only 5 of ~12 surfaces are prototyped; the rest (onboarding/login/profile/paywall/costing/invoices/checkin/kuwento) are **extrapolated from the system**, not pixel-matched.

---

## 1. Corrections the build MUST apply over `design.md`

These override the spec. The spec author guessed these wrong (no repo access):

1. **Tokens are HSL CSS variables**, not hex — defined in `frontend/src/app/globals.css` (`:root` + `.dark`),
   referenced via `hsl(var(--token))` in `tailwind.config.js`. Every retuned hex must be converted to HSL
   and written to globals.css. Tailwind config needs no edits (it only references vars).
2. **Dark background is already `#0b1525`** (`220 45% 9%`), not `#07101e`. The blue→warm-black move is still
   valid, just smaller than the spec claims. (Our own `design-system.md` is also stale here — see §6.)
3. **Error stays `#ba1a1a`** (`--destructive`, already AA ~6.4:1). Do **not** introduce `#c0392b`. The real
   work is two bug fixes (W10).
4. **Day-of-week labels stay Filipino** (`Lun/Mar/Miy/Hue/Bie/Sab/Lin`, `lib/weekly-story/week-bounds.ts`).
   The spec's Open Q6 was inverted. CLAUDE.md rule #5 requires Filipino.
5. **Nav stays 5-item** (Home/Chat/Scan/Pera + More-drawer); **Scan is a tab, no FAB**, unless Anton opts in.
   Do not implement the spec's "4 + center FAB" by default.
6. **`secondary-container` and `tertiary-container` already exist** (currently `#fe932c` orange / `#1ec89f`).
   The spec treats them as NEW with very different values/roles (`#fef3d9` pale honey / `#cdeee2`). These are
   **RETUNE + ROLE-CHANGE** — audit every existing consumer before flipping, not additive.
7. **Kai's 6 expressions are vector** (`components/illustrations/svg/ka-expressions/`, 48×48 viewBox) — they
   scale to any hero size for free, no re-render. Only **KaiSitting** is raster (`/icons/kai-mark.png`, ~435KB,
   single resolution) and needs a ≥3× export for 120–160px heroes — fold into Sprint 18 **G6 Kai integration**.
   Note: the expression SVGs hardcode hex (`#f59e0b`, `#92400e`, …) so a token reroot won't flow into them
   automatically — minor manual touch-up if we want Kai to track the palette.
8. **Three light palette variants exist** (`cream`/`honey`/`dawn` via `PaletteProvider`, `data-palette` attr).
   Token retunes must be decided per-variant or applied to the default only — the spec assumed one light theme.

---

## 2. Workstreams

| ID | Workstream | Scope | Key files / blast radius | Risk | Agent Size | Anton Time |
|----|-----------|-------|--------------------------|------|-----------|-----------|
| **W1** | **Color token reroot** | Light surface retune (¼-step), dark blue→warm-black, formalize/ retune `on-primary`, `secondary-container`, `tertiary-container`, add `sampaguita`/`ink-scrim`. Convert all to HSL. | `globals.css` (`:root`, `.dark`, ×3 palette variants), `tailwind.config.js` (add only genuinely-new aliases). Audit existing `secondary-container`/`tertiary-container` consumers (~8 each). | Low (one file, reversible) — but dark reroot is app-wide *visible* | M | 20m (eyeball light + dark on device) |
| **W2** | **Data-confident number system** | `tabular-nums`, weight-700, teal, peso-first, via a `<Money>`/number primitive + `centavosToPeso`. | `lib/utils/money.ts` + new component; ~14 render sites (`expenses-donut`, `kuwento-card`, `transaction-list`, `invoice-*`, `costing-*`, `check-in-section`, `scan-results`, `mrr-card`, `admin-stats`). | Medium (high reach) — centralize to avoid drift | M | 15m |
| **W3** | **Typography retune** | Display/H1 800→600 + downsize, add Number-lg/md/sm + Body-strong, Chat 14→15. | `globals.css` type tokens / Tailwind theme; touches headings + chat. | Low–Med | S–M | 15m |
| **W4** | **Depth / elevation / glass** | 3-level system, two-layer warm shadow (floating only), glass → nav + scan only, solid sheets, scale+tone press. | shadow tokens, card/sheet/nav components. | Medium | M | 15m |
| **W5** | **Motion & interaction** | Easing tokens, screen transitions, gestures (swipe/pull-to-refresh/long-press), **Capacitor Haptics**, reduced-motion fallbacks, battery heuristic. | global; native-sensitive; perf-sensitive. | **High** (native + perf; on-device validation deferred to end-of-pivot wave per testing cadence) | L | 30m + device session |
| **W6** | **Chat + Card restyle** | Bubble hairline + notch + gradient user bubble; card header/body/footer; **status-tag system** (4 states). | chat bubble + all card components + new StatusTag. | Medium | M | 15m |
| **W7** | **Motif dial-down** | Enforce "one personality element per screen"; demote SwayingLeaf/DoodleArrow; remove sampaguita garland, per-heading squiggles, tile corner motifs. | motif usages across screens. | Low–Med | S–M | 15m |
| **W8** | **Kai visual treatment** | Expression↔context map, sizing per context, hero glow; **KaiSitting hi-res export (G6)**. | Kai components + asset export. | Medium (asset dependency) | M | 20m + asset call |
| **W9** | **Per-screen application** | Apply W1–W8 to Home/Chat/Scan/Expenses/Deadlines/Onboarding/Login/Paywall/Briefing + empty/loading/error. | every screen. | Medium (depends on all above) | L | 30m |
| **W10** | **Bug fixes (adoption-independent)** | Fix `text-error` no-op (`free-tier-banner.tsx` → `text-destructive`), hardcoded `#F87171` (`deadline-row.tsx:87`), `BanigBarChart` hardcoded `#fdf9f2` stripe (breaks dark mode). | 3 files. | None — pure correctness | S | 5m |
| **W11** | **Accessibility re-verification** | Re-verify AA against our **actual** final tokens (spec's AA table used hex that differ from ours, e.g. it tested `#c0392b`/`#fdfaf4` not our `#ba1a1a`/chosen surface), dynamic-type ≥130%, aria for `<Money>`. | tokens + components. | Low | S | 10m |
| **W12** | **Doc reconciliation** | Update `design-system.md` + `brand-context.md` to Warm Precision + fix stale drift (§6); add ADR-020 "Warm Precision adoption". | 3 docs. | None | S | 15m |

---

## 3. Suggested slicing per adoption path

- **Safe subset → Sprint 18:** **W1 + W2 + W6 (status tags + card body only) + W10 + W11** + the W12 stale-drift fix.
  Captures the brand-defining wins (warm dark, confident numbers, clean cards, bug fixes) with low launch risk.
  Defer W4/W5/W7/W8/W9 motion + per-screen rework to post-launch.
- **Dedicated redesign sprint:** **W1→W9 + W11 + W12** as one sprint; pushes Sprint 19 by ~1 sprint.
  W5 native haptics validated in the end-of-pivot device wave, not in-sprint.
- **Defer all to post-launch:** ship now only **W10** (bugs) + W12 stale-drift fix; full W1–W9 lands in Phase 1
  once real users are giving feedback.

---

## 4. Agent team (per `/build`)

- **build-architect** — token + component architecture, ADR-020, the `<Money>` primitive contract.
- **build-engineer** — implementation (core).
- **build-ux** — **critical here**: design-system compliance review (the Sprint 5 "17 violations slipped past" precedent). Owns the motif dial-down + per-screen review.
- **build-qa** — re-baseline the visual-parity Playwright snapshots (see §5) + a11y checks.
- *No* build-ai / review-security / build-data needed (no prompts, no auth/PII, no schema).

---

## 5. Cross-cutting risks & sequencing

1. **W1 first** — everything else reads the tokens. Land color before numbers/components.
2. **Visual-parity snapshots will all need re-baselining.** Existing `e2e/synthesis/*.spec.ts-snapshots`
   (home, chat, expenses, scan, deadlines) compare at `maxDiffPixelRatio: 0.005` — a token reroot fails all of
   them by design. Re-baselining is expected churn + an Anton eyeball on the new baselines, not a regression.
3. **W5 native motion/haptics** can't be fully validated until the **end-of-pivot device wave** (per our testing
   cadence — Sprints 15–19 defer on-device smoke). Plan haptics behind `Capacitor.isNativePlatform()` and verify
   in that wave; web build degrades gracefully.
4. **Dark-mode reroot is the highest-blast-radius *visible* change** — single `.dark{}` block to edit, but it
   touches every screen's appearance. Easy to gate/rollback; worth an explicit on-device look.
5. **Number system is highest-reach** — must go through one primitive or it drifts across 14 sites.
6. **ADR-020 required** (architecture-decisions.md) per Session Learning Protocol before W1 merges.

---

## 6. Doc reconciliation detail (stale drift to fix regardless of Warm Precision)

`design-system.md` and `brand-context.md` have drifted from the actual code **independent of this redesign**:

| Doc claim | Actual code | Note |
|---|---|---|
| `design-system.md`: dark surface `#07101e` | `#0b1525` | Stale; both docs wrong. |
| `design-system.md`: dark surface-container `#0d1a2e` etc. | `#141f32` etc. (lifted) | Whole dark column stale. |
| `design-system.md`: `secondary-container #fe932c` / dark `#663500` | code has `secondary-container` (verify exact) | Warm Precision repurposes this token entirely — reconcile carefully. |
| `design-system.md`: `tertiary-container #1ec89f` | code value differs | Warm Precision → `#cdeee2`. |
| `design-system.md` §3 Typography: "numbers always weight-800" | — | Warm Precision moves number emphasis to **tabular-700-teal**; 800 leaves the spec. |
| `brand-context.md` color table: dark `#07101e` | `#0b1525` | Same stale dark value. |
| `brand-context.md`: `on-surface` dark `#e6e2db` | `#eef1f7` (code) | Minor drift. |

**Two-stage doc update when a path is chosen:** (a) correct the stale factual values (adoption-independent — safe
to do anytime); (b) overlay the Warm Precision direction (only once adoption is committed, so the authoritative
design doc doesn't declare a redesign you haven't greenlit).

---

## 7. Still needs an Anton decision

- **Timing/path** (§3) — pending; drives whether/when W-slices go to `/build`.
- **Q3 Scan FAB** — keep tab (default) or switch to FAB?
- **Q5 count-up on KPIs** — keep (subtle, 600ms once) or cut as too playful?
- **Q7 battery-saver heuristic** — OK to use reduced-motion + low-end-device hint (no reliable web Battery API)?
- **G6 KaiSitting hi-res export** — source via the Gemini pipeline; needed for 120–160px heroes.
