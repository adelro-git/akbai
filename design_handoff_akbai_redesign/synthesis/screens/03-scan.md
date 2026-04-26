# Screen 03 — Resibo Scanner (`/scan`)

**Verdict:** KEEP CURRENT (per [A4](../02-decisions.md#a-per-screen-verdicts-locked))
**Visual reference:** [current](../screenshots/03-scan/current-mobile-chrome.png) · [handoff](../../screenshots/08-scan-honey-fil.png)

## 1. Comparison summary

Current scanner is already polished and well-loved: custom camera UI with viewfinder, 60×60px honey-gradient capture button, tested pre-permission screen, batch-scan flow. The handoff proposes a full-bleed dark UI with honey-deep corner brackets — a familiar mobile-camera convention but a significant implementation departure from what ships and works. The verdict is KEEP CURRENT: do not touch camera UI, viewfinder, capture flow, or post-scan card slide-in.

## 2. Synthesized layout

No layout changes. The only redesign-phase change is surface-level re-skin to align with the new palette system — no structural or interaction changes.

Changes permitted:

1. **Palette token update only** — if the capture button currently uses a hardcoded hex, migrate to `primary-container` (`#f59e0b`) token. No visual change, just token hygiene.
2. **Pre-permission screen copy** — verify it follows voice manual §5 ("Para ma-scan ni Kai ang mga resibo mo, kailangan ng camera access."). No redesign; just copy audit.
3. **Post-scan Kai bubble copy** — verify OCR-processing and result messages follow voice manual §4 ("Bina-basa ko ang resibo mo..." / "Hindi ko ma-scan, boss. Baka malabo — i-try mo ulit?"). No redesign.

Everything else: DO NOT CHANGE.

- Camera viewfinder: unchanged
- Capture button size (60×60px): unchanged
- Batch-scan "May iba pa bang resibo?" flow: unchanged
- Permission grant-rate pre-screen: unchanged
- Dark background during scan (`#1a1410`): the handoff dark UI is rejected, but the current camera feed naturally appears on a dark background — this is fine as a camera convention, not a palette context
- Post-scan card slide-in: unchanged

## 3. Decisions table

| Verdict ID | Dimension | Verdict | Rationale |
|---|---|---|---|
| A4 | Scan layout | KEEP CURRENT | Current already polished; handoff dark-bleed UI rejected |
| B4 | Icons | N/A | No icon changes on this screen |
| E2 | Card swipe | KEEP CURRENT | Post-scan card swipe-to-archive preserved |
| F1 | Touch targets | VERIFY | Confirm capture button is 60×60 (already over 44×44 minimum) |
| F5 | Offline | KEEP CURRENT | "Kailangan ko ng internet para ma-scan ang resibo" Kai bubble |

## 4. Enrichments applied

- `pattern:sage-caregiver-trust-recovery` — OCR failure copy "Hindi ko ma-scan ang resibo, boss. Baka malabo — i-try mo ulit o i-type mo manually?" stays canonical
- `pattern:filipino-mobile-data-resilience` — scanner explicitly requires internet; warm Kai bubble explains, never shows a generic error screen
- `pattern:media-hand-me-down-baseline` — scan UI already optimized for mid-range Android; no changes needed
- `pattern:one-handed-cta-thumb-zone` — 60×60px capture button at bottom center already in easy zone

## 5. Reuse map

| Component needed | Source | Notes |
|---|---|---|
| Camera viewfinder | Current — no change | Do not re-implement |
| Capture button | Current — token hygiene only | `primary-container` token if hardcoded |
| Pre-permission screen | Current — copy audit only | Follow voice manual §5 |
| Post-scan card | Current — no change | Slide-in preserved |

Full table: [`04-reuse-audit.md`](../04-reuse-audit.md)

## 6. Open questions

1. **Capture button token**: is the honey gradient on the capture button currently using the `primary-container` token or a hardcoded `#f59e0b`? If hardcoded, token migration is the only Phase 3 action needed.
2. **Bottom nav visibility during scan**: does the bottom nav hide or stay visible when the camera is active? Confirm the current behavior is preserved — bottom nav should hide during active capture to maximize viewfinder area.

## 7. Acceptance signal

- No visual regression vs current scan screen in both pre-permission and active-capture states
- Lighthouse perf ≥ 85 mobile (scan page itself — camera stream not counted in page weight)
- OCR failure shows warm Kai bubble per voice manual §4; no generic error screen
- Camera permission denied shows actionable copy: "I-enable mo sa Settings"
- Capture button touch area ≥ 44×44px (60px already exceeds this)
- Reduced-motion: no impact (no decorative animations on this screen)
