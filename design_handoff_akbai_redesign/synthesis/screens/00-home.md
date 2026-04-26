# Screen 00 — Home (`/dashboard`)

**Verdict:** HYBRIDIZE (per [A1](../02-decisions.md#a-per-screen-verdicts-locked))
**Visual reference:** [current](../screenshots/00-home/current-mobile-chrome.png) · [handoff](../../screenshots/02-home-honey-fil-mobile.png)

## 1. Comparison summary

Current home is functional: time-aware greeting, 4-card grid, check-in section, morning briefing. It reads as a clean fintech dashboard but lacks the visceral warmth Phase 1 Don Norman analysis prescribes — no Kai hero presence, no streak visibility, no weekly narrative. Handoff's Kumustahan hero (168px Kai mark + Fraunces serif + paper-note check-in) and Kuwento ng Linggo card deliver that warmth directly. The handoff background (`#fef4dd` honey-cream) is rejected in favour of the current `#fdf9f2` cream per Anton's A1 call.

## 2. Synthesized layout

Palette context: `cream` (see `pattern:palette-context-per-route`). Route: `/dashboard`. Tab label: **"Home"** (not "Dashboard" or "Umaga Mo").

Top → bottom within a single scrollable column (`max-w-[760px]`, `mx-auto`, `px-5 py-6 pb-24`, `gap-[18px]`):

1. **Kumustahan hero** — `KaiSitting` (168px, circular clip, `pattern:varying-kai-expression-by-context` expression = `happy`, `kai-bob` animation pending repo approval B6) + greeting block (time-of-day pill, Fraunces name line 30px/500, Fraunces italic question line 26px/500 with single `<Squiggle>` underline pending B5 approval). Background: `<CapizPattern>` at 0.18 opacity, pending B5 approval.
2. **Paper-note check-in invite** — `<PaperNote>` component (`pattern:paper-note-asymmetric-corners`, `frontend/src/components/ui/paper-note.tsx` Phase 4). Contains streak copy per `pattern:endowed-progress-streaks` ("Ready ka na bang mag-check-in? Pang-{streak} araw na natin"). Tap opens `<CheckInModal>` (per A9 — no separate route).
3. **Action grid header** — Fraunces serif 18px/600 "Anong gagawin natin?" — no squiggle (one squiggle only rule per handoff reviewer feedback).
4. **5-tile action grid** — `grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))`, gap 12px. Tiles in order: Scan resibo / Kausap si Kai / BIR paalala / Tamang presyo / Mga invoice. Each is a re-skinned `feature-tile.tsx` (see `04-reuse-audit.md`). `pattern:hicks-law-five-tiles` — exactly 5, no additions.
5. **`<WovenDivider>`** — banig zig-zag, `aria-hidden`, pending B5 approval.
6. **Kuwento ng Linggo card** — `home-card` (re-skinned `dashboard-card.tsx`). Header: `IconPera` + "Kuwento ng Linggo" label + serif H1. Narrative line (Fraunces 19px/500). 3-column KPI grid (Kita / Gastos / Tubo). Banig 7-day bar chart with peak-day sampaguita marker. Kai takeaway paper-note. "Buksan ang detalye →" footer link to `/expenses`.
7. **Closing** — centered Fraunces italic 13px `— Kai`.
8. **`<FloatingPetals>`** ambient layer — home-screen only, absolutely positioned, `pointer-events: none`, pending B6 approval.

## 3. Decisions table

| Verdict ID | Dimension | Verdict | Rationale |
|---|---|---|---|
| A1 | Home layout | HYBRIDIZE | Kumustahan hero + 5 tiles + Kuwento card from handoff; `#fdf9f2` cream background retained |
| A9 | Check-in placement | KEEP CURRENT | Modal on home, no `/checkin` route |
| B1 | Palette | HYBRIDIZE | `/dashboard` uses `cream` context; all others use `honey` |
| B2 | Typography | HYBRIDIZE | PJS body + Fraunces display |
| B5 | Motifs | DEFER | `CapizPattern`, `WovenDivider`, `FloatingPetals` pending repo approval |
| B6 | Animations | DEFER | `kai-bob`, `petal-drift`, `squish` pending repo approval |
| C2 | Bottom nav | HYBRIDIZE | 5 tabs retained (Home / Chat / Scan / Pera / More) |
| D4 | Streak framing | ADOPT HANDOFF | "Pang-X araw na natin" |
| F4 | Perf budget | TIGHTEN | LCP ≤ 2.5s; defer petals/capiz until after LCP |

## 4. Enrichments applied

- `pattern:endowed-progress-streaks` — check-in note shows streak as "Pang-{n} araw na natin"; first-time copy "Subukan natin ang unang check-in mo!"
- `pattern:hicks-law-five-tiles` — grid locked at 5 tiles; no 6th regardless of future feature additions
- `pattern:paper-note-asymmetric-corners` — check-in invite and Kuwento takeaway use `PaperNote` primitive
- `pattern:peak-end-weekly-close` — Kuwento card is the home-screen preview that sets up Sunday auto-open
- `pattern:hooked-variance-coach-not-casino` — Kai takeaway sentence in Kuwento card is server-generated, tonal rotation daily
- `pattern:varying-kai-expression-by-context` — KaiSitting uses `happy` on home default; `celebrating` on milestone day
- `pattern:palette-context-per-route` — `/dashboard` gets `cream` (`#fdf9f2`), not `honey`
- `pattern:reduced-motion-respect` — `kai-bob`, `petal-drift`, `squish` all gated on `prefers-reduced-motion: no-preference`
- `pattern:media-hand-me-down-baseline` — greeting + Kai mark render from local clock immediately; chart skeleton fills in; defer petals until after LCP
- `pattern:streak-resilience-no-shame` — streak reset copy "Balik tayo, [Name]. Pang-1 araw ulit natin."
- `pattern:one-handed-cta-thumb-zone` — paper-note check-in CTA and grid tiles land in bottom 60% of visible viewport on first load

## 5. Reuse map

| Component needed | Source | Notes |
|---|---|---|
| `KaiSitting` mark | Current — wrap `mark-honey.png` | Circular clip via `border-radius:50%` |
| `feature-tile.tsx` | Current `dashboard-card.tsx` re-skin | Preserve API, swap visual chrome |
| `check-in-modal.tsx` | Current — extend in place | Add energy slider + note textarea per A9 |
| `PaperNote` | New build (Phase 4) | `frontend/src/components/ui/paper-note.tsx` |
| `BanigBarChart` | New build | Recharts custom `<Bar>` shape |
| `WovenDivider` | Handoff port | Pending B5 approval |
| `CapizPattern` | Handoff port | Pending B5 approval |

Full table: [`04-reuse-audit.md`](../04-reuse-audit.md)

## 6. Open questions

1. **Kuwento ng Linggo data endpoint on home**: does the home page call the same weekly-summary endpoint as `/kuwento`, or does it get a condensed version? Needs API contract decision before Phase 3 data layer.
2. **`FloatingPetals` perf gate**: if `petal-drift` can't reliably hit the 200KB/Slow-3G budget with petals present, should the petal layer be removed from home on first visit and introduced only after week 1 of active use?
3. **`cream` vs `honey` palette on home**: the 5-tile backgrounds use literal hex tints (`#fef3d9`, `#fde9d4`, etc.) — these are palette-independent. Confirm the tints work on `#fdf9f2` cream background as well as they do on `#fef4dd` honey.

## 7. Acceptance signal

- Visual parity vs `screenshots/02-home-honey-fil-mobile.png` adapted to cream bg — pixel diff ≤ 0.5% at 390×844
- Lighthouse perf ≥ 85 mobile (Slow 3G + mid-range Android emulation)
- Both FIL and EN render correctly via cookie locale toggle (greeting copy, tile subtitles, Kuwento narrative)
- Reduced-motion: Kai mark static, petals absent, tiles render without squish animation; layout identical
- `kai-bob`, `petal-drift`, `CapizPattern` absent until B5/B6 repos approved
- Streak counter reflects real `daily_check_in` data; first-visit empty state shows onboarding copy variant
- Morning briefing Kuwento card shows skeleton while data loads — no blank card
