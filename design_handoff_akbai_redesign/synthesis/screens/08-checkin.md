# Screen 08 — Daily Check-in (modal on `/dashboard`)

**Verdict:** KEEP CURRENT placement (per [A9](../02-decisions.md#a-per-screen-verdicts-locked))
**Visual reference:** [current check-in-modal.tsx](../../../../frontend/src/components/dashboard/check-in-modal.tsx) · [handoff](../../screenshots/12-checkin-honey-fil.png)

## 1. Comparison summary

The handoff proposes a full-screen `/checkin` route with paper-note wrapper, emoji mood tiles, energy slider, and freeform note textarea. Anton's A9 verdict keeps the modal-on-home pattern (lower friction, preserves home context) and explicitly deprecates the `/checkin` route plan. The Phase 1.5 schema enrichment (`energy_level INT`, `note TEXT` on `daily_check_in`) still applies — added inline to the existing `check-in-modal.tsx`, not in a new screen. This overrides `i-created-design-framework-harmonic-shamir.md` Phase 10 §10.4.

## 2. Synthesized layout

Modal stays on `/dashboard`. Component: `frontend/src/components/dashboard/check-in-modal.tsx` — **extend in place**, do not replace.

**Step 1 — Kumusta + Energy + Mood** (extend current Step 1):

1. **Modal wrapper** — existing `<PaperNote>`-adjacent styling: `surface-container-lowest` background, `rounded-2xl`, ambient shadow. NOT tilted (modal is centered dialog, not a taped note — tilt belongs on the home invite, not the modal itself).
2. **Header** — keep current "Kumusta ang araw mo?" (voice manual §1).
3. **Mood selector** — current 5 Kai expression buttons (Bongga / Okay / Steady / Hirap / Grabe). KEEP AS-IS (these map to the existing Kai SVG expression set).
4. **Energy slider** — NEW. `pattern:energy-slider-emoji-ticks`: 5 emoji ticks above the Radix slider track (😴 😪 😐 😊 ⚡), labeled "Pagod" left / "Sagad" right. Slider: honey-deep fill on honey-pale track, 20px thumb (44×44px touch area via padding). Value stored in `energy_level INT (1–5)` — new column (nullable, Phase 3 migration).
5. **Note textarea** — NEW. Label "May gusto kang ikwento? (optional)". Placeholder "Halimbawa: 'Mabagal ang benta kanina...'" (voice manual §5 style). 3 visible rows. Stored in `note TEXT` — new column (nullable, Phase 3 migration). `useRef` per E1.
6. **Sales + Expenses inputs** — keep current ₱ inputs (they remain Step 1). Reorder: Mood → Energy → Note → Sales → Expenses.
7. **CTA** — current "Next" / "I-save" flow preserved. CTA label updates: Step 1 primary: "Susunod" when expenses entered; "Sabihin kay Kai" when no expenses.

**Step 2** (category picker) — unchanged.

**Streak display** — below the header, before mood selector: Fraunces italic 13px streak copy per `pattern:endowed-progress-streaks`. "Pang-{streak} araw na natin." Bold streak number. On first visit (streak = 0): "Subukan natin ang unang check-in mo!" Reset copy: "Balik tayo, [Name]. Pang-1 araw ulit natin." per `pattern:streak-resilience-no-shame`.

**Schema migration** (Phase 3):
```sql
ALTER TABLE daily_check_in ADD COLUMN energy_level INT NULL CHECK (energy_level BETWEEN 1 AND 5);
ALTER TABLE daily_check_in ADD COLUMN note TEXT NULL;
```
Both nullable — existing check-in rows are not affected.

## 3. Decisions table

| Verdict ID | Dimension | Verdict | Rationale |
|---|---|---|---|
| A9 | Check-in placement | KEEP CURRENT | Modal on home; `/checkin` route deprecated |
| B7 | Border treatment | N/A | Modal is centered dialog, not a tilted paper-note |
| D4 | Streak framing | ADOPT HANDOFF | "Pang-X araw na natin" in modal header |
| E1 | Forms | KEEP CURRENT | `useRef` + `onClick` on all inputs including note textarea |
| F1 | Touch targets | VERIFY | Energy slider thumb 44×44px via padding; mood buttons 56×56px |

## 4. Enrichments applied

- `pattern:energy-slider-emoji-ticks` — 5 emoji ticks above Radix slider; stores `energy_level INT (1–5)`; Phase 1.5 schema enrichment
- `pattern:endowed-progress-streaks` — streak line "Pang-X araw na natin" in modal; first-visit onboarding variant
- `pattern:streak-resilience-no-shame` — reset copy never shames; "Balik tayo, [Name]." warm re-invite
- `pattern:one-handed-cta-thumb-zone` — "Sabihin kay Kai" / "Susunod" CTA at modal bottom; sheet slides up from bottom
- `pattern:filipino-mobile-data-resilience` — check-in data queues offline; submits on next connection; "Na-save ko muna sa phone mo" toast
- `pattern:hooked-variance-coach-not-casino` — post-submit Kai confirmation copy varies (Energetic / Celebratory / Observant) based on mood + streak context

## 5. Reuse map

| Component needed | Source | Notes |
|---|---|---|
| `check-in-modal.tsx` | Current — extend in place | Add energy slider + note textarea; do not replace |
| Radix slider | Library — already installed | Theme to honey tokens (same as costing slider) |
| Mood buttons | Current — keep | Kai expression SVGs preserved |
| Streak display | New inline addition | Fraunces italic, reads from `daily_check_in` streak calc |

Full table: [`04-reuse-audit.md`](../04-reuse-audit.md)

## 6. Open questions

1. **Streak calculation**: is the current streak computed client-side from `daily_check_in` rows, or is it a stored field? If computed, confirm the ≥ 2-day gap reset rule is implemented server-side.
2. **Note field character limit**: should `note TEXT` have a UI character limit (e.g., 500 chars) to prevent overlong Kuwento context? Needs AI engineer alignment (note feeds into weekly story generation).

## 7. Acceptance signal

- Existing check-in modal passes all current tests after energy slider + note are added
- Energy slider stores `energy_level` in DB; note textarea stores `note` in DB
- Streak copy renders correctly for streak = 0, 1, 12, and gap-reset scenarios
- Emoji ticks visible above slider on all mobile widths (320px–428px)
- Slider thumb touch area ≥ 44×44px
- `useRef` used for note textarea (not controlled input)
- Reduced-motion: slider still functional; no animation on mood button selection beyond color change
- Both FIL and EN locale render (header, streak copy, placeholder text, CTA labels)
