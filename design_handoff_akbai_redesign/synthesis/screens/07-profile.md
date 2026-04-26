# Screen 07 — Profile (`/profile`)

**Verdict:** HYBRIDIZE (per [A8](../02-decisions.md#a-per-screen-verdicts-locked))
**Visual reference:** [current](../screenshots/07-profile/current-mobile-chrome.png) · [handoff — not redesigned in prototype](../../README.md)

## 1. Comparison summary

The handoff prototype did not specifically redesign Profile — it focused on home/chat/expenses/scan/deadlines/costing/invoices/check-in/Kuwento. Profile is therefore a "current with sprinkled handoff polish" treatment. The current structure and content density are adequate and tested. What it needs is: Fraunces typography on the persona name, honey-cream palette context, paper-note treatment on the persona pill where appropriate, and spacing/shadow tokens aligned with the redesigned system.

## 2. Synthesized layout

Palette context: `honey`. Route: `/profile`. Current `frontend/src/app/(app)/profile/page.tsx` is the primary reference.

No structural changes. Visual chrome updates only:

1. **Page header** — current "Profile" H1 re-skinned: Fraunces 28px/500 "Ang Profile Mo" in ink. Below: business name in Fraunces 18px/500, honey-deep.
2. **Persona / business pill** — re-skin into a `<PaperNote>`-adjacent treatment: `surface-container-lowest`, `rounded-xl`, `p-4`, amber ambient shadow. Contains: avatar initials circle (honey-deep fill, white text, 48px), business name (Fraunces 18px/600, ink), business type tag (12px/600, honey-pale fill pill), tagline / primary pain (13px/400, ink-soft). NOT a full `PaperNote` (no tilt, no tape strip) — just visual warmth matching the system.
3. **Settings rows** — current list rows kept. Re-skin: `surface-container-lowest` cards, `rounded-xl`, no borders (No-Line Rule). Lucide icons (16px, ink-faint) on left; chevron right. Row min-height 56px.
4. **Section labels** — current section labels (e.g., "Account", "BIR", "Preferences") re-skinned: 10px/800, honey-deep, letter-spacing 0.08em, uppercase — matching the eyebrow treatment across all redesigned screens.
5. **Language toggle** — re-skin into the handoff FIL/EN pill design (two adjacent pills, honey-deep active). Per C5 ADOPT HANDOFF. Functional from Phase 5.
6. **Tier badge** — current tier indicator re-skinned with honey-deep border + Fraunces weight for the tier name.
7. **Danger zone** (delete account / logout) — keep in top 20% of the section, never in the primary thumb zone. Destructive actions stay behind explicit confirmation per F1.

## 3. Decisions table

| Verdict ID | Dimension | Verdict | Rationale |
|---|---|---|---|
| A8 | Profile layout | HYBRIDIZE | Structure + density KEEP; visual chrome ADOPT HANDOFF elements |
| B1 | Palette | honey | Non-home screen |
| B2 | Typography | Fraunces | Persona name + business name get serif treatment |
| C4 | Persona pill | ADOPT HANDOFF | Business name + tagline; taps to this profile page (single-user) |
| C5 | Language toggle | ADOPT HANDOFF | FIL/EN pills; functional Phase 5 |
| F1 | Touch targets | VERIFY | All settings rows ≥ 56px height |

## 4. Enrichments applied

- `pattern:palette-context-per-route` — profile uses `honey` context
- `pattern:one-handed-cta-thumb-zone` — logout and danger zone in lower section, not floating at top where accidental taps are likely; kept behind explicit confirmation
- `pattern:po-register-calibration` — profile page settings are not conversational; "po" only in any Kai guidance copy that appears inline (e.g., BIR setup guidance)
- `pattern:media-hand-me-down-baseline` — profile page is mostly static; no perf concerns beyond token alignment

## 5. Reuse map

| Component needed | Source | Notes |
|---|---|---|
| Profile page structure | Current — keep | No structural changes |
| Settings row component | Current — re-skin | Honey palette tokens, no-border |
| Persona pill | Current — re-skin | Visual upgrade; not a `PaperNote` |
| Language toggle | New build Phase 5 | FIL/EN pill design from handoff sidebar |
| Section eyebrow labels | New style token | 10px/800, honey-deep, uppercase |

Full table: [`04-reuse-audit.md`](../04-reuse-audit.md)

## 6. Open questions

1. **Avatar initials vs photo**: does the current profile support avatar photo upload, or is it always initials? If photo is planned, the 48px circle container needs to handle both states consistently.
2. **Fraunces on business name**: Fraunces is a display serif — verify it renders correctly at 18px on Android WebView (some versions have Fraunces ligature rendering issues at small sizes).

## 7. Acceptance signal

- No structural regression vs current profile screen
- Lighthouse perf ≥ 85 mobile
- All settings rows ≥ 56px minimum height
- Business name renders in Fraunces; section labels render as honey-deep eyebrows
- Language toggle pills render (even if non-functional until Phase 5)
- FIL and EN locale: all labels render correctly
- Reduced-motion: no impact (profile has no animations)
- No borders on settings rows (No-Line Rule); tonal contrast between row and page background
