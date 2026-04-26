# Screen 04 — BIR Deadlines (`/deadlines`)

**Verdict:** ADOPT HANDOFF (per [A5](../02-decisions.md#a-per-screen-verdicts-locked))
**Visual reference:** [current](../screenshots/04-deadlines/current-mobile-chrome.png) · [handoff](../../screenshots/09-deadlines-honey-fil.png)

## 1. Comparison summary

Current deadlines screen has solid information density — days-left counters, status grouping — but lacks visual distinctiveness and the companionship moment that converts BIR anxiety into confidence. The handoff's serif H1 "Hindi ka mahuhuli kay Kai." + 56×56 date chips + form-code prominence + Kai pre-deadline paper-note callout delivers that transformation. This is a full layout replacement; current data logic (BIR deadline records, status fields) is the data-layer that powers the new layout.

## 2. Synthesized layout

Palette context: `honey`. Route: `/deadlines`. Reference: `prototype/components/screen-scan-deadlines.jsx` (`DeadlinesScreen`).

Top → bottom:

1. **Screen header** — `IconKalendaryo` (28px, pending B4 approval; lucide `Calendar` fallback) + eyebrow "BIR DEADLINES" (10px/800, honey-deep) + Fraunces serif H1 "Hindi ka mahuhuli kay Kai." (28px/500) + caption "Automatic na paalala bago ang due date." (13px/400, ink-soft).
2. **Kai pre-deadline callout** — visible only when at least one deadline is ≤ 7 days away. `<PaperNote>` (`pattern:paper-note-asymmetric-corners`) with mini Kai avatar (`concerned`, `pattern:varying-kai-expression-by-context`) + dynamic copy following `pattern:loss-aversion-deadlines`. Example: "Paparating na ang 2551Q sa Nov 25. Nandiyan pa ang 5 araw — i-prepare ko na ang numero mo?" Tap → opens Kai chat pre-seeded with the deadline context.
3. **Deadline list** — each row is a full-width card (`surface-container-lowest`, `rounded-xl`, `shadow-soft`):
   - Left: **56×56 date chip** — cream-honey fill (`surface-container`), month abbreviation (10px/800, ink-faint) + day number (Fraunces 22px/600, ink). Urgent (≤ 7 days): honey-deep fill variant.
   - Center stack: form-code pill (`2551Q`, `rounded-full`, honey-pale fill, 12px/800, honey-deep) + days-left counter ("Huling 5 araw", honey-deep when urgent) + form name (Fraunces 16px/500) + description caption (13px/400, ink-soft).
   - Right: chevron (lucide, ink-faint, 16px).
   - **First (next-due) row**: 2px honey-deep border highlight. Subsequent rows: no border (No-Line Rule — color-shift only per design system).
4. **BIR disclaimer banner** — restyled to conversational Filipino: "Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo." Voice manual §3 canonical. Honey-pale background, ink-faint text, 11px.

**Days-left copy rule** (`pattern:loss-aversion-deadlines`): "Huling X araw" not "X days remaining". Urgent ≤ 7 days. Overdue: "Lipas na" in error color (`#F87171`).

**Empty state** (no BIR deadlines configured): "Wala pang BIR deadlines na naka-set up. I-setup natin batay sa business type mo?" — voice manual §5, action-oriented CTA opens business-type setup flow.

## 3. Decisions table

| Verdict ID | Dimension | Verdict | Rationale |
|---|---|---|---|
| A5 | Deadlines layout | ADOPT HANDOFF | Full replace; data logic reused |
| B1 | Palette | honey | Non-home screen |
| B2 | Typography | Fraunces | Serif H1 + date chip day number |
| B4 | Icons | DEFER | `IconKalendaryo` pending repo approval; `lucide:Calendar` fallback |
| B7 | Border treatment | HYBRIDIZE | Paper-note corners on callout only; normal cards no-border |
| D1 | Kai copy | KEEP CURRENT | Voice manual overrides handoff strings |
| D3 | Error states | KEEP CURRENT | Overdue status uses `#F87171`, not honey |

## 4. Enrichments applied

- `pattern:loss-aversion-deadlines` — "Huling X araw" framing on all days-left counters; ⚠ visual on ≤ 7-day rows; combined with reassuring action copy, never alarmist alone
- `pattern:paper-note-asymmetric-corners` — Kai pre-deadline callout uses `PaperNote` primitive
- `pattern:varying-kai-expression-by-context` — Kai avatar: `concerned` on ≤ 7 days; `happy` when all deadlines are > 30 days out
- `pattern:po-register-calibration` — "po" in BIR callout copy (BIR is a formal topic)
- `pattern:sage-caregiver-trust-recovery` — if deadline data fails to load: "Hindi ko ma-load ang deadlines, boss. I-try mo ulit?" — no blank screen
- `pattern:one-handed-cta-thumb-zone` — Kai callout CTA and first deadline row in upper-center of screen; no destructive actions in thumb zone

## 5. Reuse map

| Component needed | Source | Notes |
|---|---|---|
| BIR deadline data logic | Current — no change | Status, due-date, form-code fields reused |
| `PaperNote` | New build Phase 4 | `frontend/src/components/ui/paper-note.tsx` |
| Date chip | New build | 56×56, Fraunces day number |
| Form-code pill | New build | Reuse pill primitive with honey-pale fill |
| Disclaimer banner | Current — copy update | Reskin to honey-pale + conversational FIL copy |

Full table: [`04-reuse-audit.md`](../04-reuse-audit.md)

## 6. Open questions

1. **Date chip localization**: month abbreviation (e.g., "NOB" for Noviembre) — does this come from a FIL locale date formatter or a hardcoded lookup table? Needs decision before Phase 3 data layer.
2. **Kai callout tap action**: tapping the pre-deadline callout opens Kai chat pre-seeded. Does this pass the form code as a URL param, or does it rely on the Kai session context? Needs AI engineer + architect alignment.

## 7. Acceptance signal

- Visual parity vs `screenshots/09-deadlines-honey-fil.png` — pixel diff ≤ 0.5% mobile-chrome
- Lighthouse perf ≥ 85 mobile
- FIL and EN locale: H1, days-left copy, disclaimer all render in correct locale
- Urgency state: ≤ 7 days triggers honey-deep date chip + paper-note callout; > 30 days no callout visible
- Overdue row: "Lipas na" in error red (`#F87171`), not honey
- Reduced-motion: no animation regressions; callout is a static paper-note, no animation
- BIR disclaimer present on page; wording matches voice manual §3 exactly
