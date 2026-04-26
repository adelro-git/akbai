# Screen 01 — Chat / Kausap (`/chat`)

**Verdict:** HYBRIDIZE (per [A2](../02-decisions.md#a-per-screen-verdicts-locked))
**Visual reference:** [current](../screenshots/01-chat/current-mobile-chrome.png) · [handoff](../../screenshots/06-chat-honey-fil.png)

## 1. Comparison summary

Current chat delivers the "Chat with Kai" brand experience with the existing Kai illustration in bubbles. It lacks suggested-question chips (cold-start barrier for new users) and the warmth-loaded "Nandito ako para sa'yo" status micro-moment. Handoff adds both but drops the established "Chat with Kai" header branding and illustration — those are load-bearing brand identifiers that must be preserved.

## 2. Synthesized layout

Palette context: `honey`. Route: `/chat`.

Top → bottom:

1. **Top bar** — back chevron (left) + round Kai avatar 32px (`pattern:varying-kai-expression-by-context` expression = `happy`) + "Kai" in Fraunces 18px/600 on top of sage-green dot + "Nandito ako para sa'yo" 12px caption (ADOPT HANDOFF). Right: kebab menu. **"Chat with Kai" header text kept** (KEEP CURRENT) — rendered as the page `<h1>` visible only to screen readers (`sr-only`); visual identity carried by the Kai avatar + name combo in the top bar.
2. **Message thread** — full-height scrollable. User bubbles: honey-deep fill, white text, right-aligned, 75% max-width, `border-radius: 14px 14px 4px 14px`. Kai bubbles: `surface-container` (cream-tinted on honey bg) with thin honey outline, ink text, left-aligned, `border-radius: 14px 14px 14px 4px`. Existing Kai illustration treatment in first Kai bubble of each session (KEEP CURRENT). 8px gap same-speaker; 16px gap speaker turn. Avatar (24px) on first Kai message per turn.
3. **Suggested-question chips** — horizontal scrollable row above composer (ADOPT HANDOFF). `surface-container-low` pill, thin honey outline, 13px/600, `px-3 py-1.5`. 4 chips minimum: "Saan napunta ang pera ko?", "Kailan ang BIR deadline?", "Magkano dapat presyo?", "I-record ang gastos". Tap inserts + sends. Chips scroll off when composer is focused.
4. **Composer** — camera/attach icon left; `useRef` text input (placeholder "Magtanong kay Kai...") per `pattern:filipino-mobile-data-resilience` auto-save; honey-deep send button right (44×44px minimum). Multi-line, grows to 4 lines.
5. **Empty state** — chips + composer always visible. No blank-state message; chips themselves are the first-use prompt.

## 3. Decisions table

| Verdict ID | Dimension | Verdict | Rationale |
|---|---|---|---|
| A2 | Chat layout | HYBRIDIZE | Top-bar status + chips ADOPT; "Chat with Kai" header + illustration KEEP |
| B1 | Palette | honey | Non-home screen |
| D1 | Kai voice | KEEP CURRENT | Voice manual overrides all handoff strings |
| D2 | Empty states | KEEP CURRENT | No "no messages" message; chips are the call-to-action |
| E1 | Forms | KEEP CURRENT | `useRef` + `onClick` (React 19 rule) |
| F1 | Touch targets | KEEP CURRENT | 44×44px minimum on all tap targets |
| F5 | Offline | EXTEND | Composer queues offline; "Kailangan ko ng internet para makapag-usap" Kai bubble on send attempt |

## 4. Enrichments applied

- `pattern:varying-kai-expression-by-context` — 32px top-bar avatar uses `happy` by default; `thinking` during streaming response; `concerned` when Kai flags a financial risk
- `pattern:filipino-mobile-data-resilience` — composer auto-saves draft on each keystroke; offline send queues mutation with "Na-save ko muna — i-send ko pag may connection" toast
- `pattern:po-register-calibration` — "po" in Kai replies only on BIR topics, confirmations, permission asks — not in casual chat turns
- `pattern:regional-language-comprehension` — Kai comprehends Bisaya/Cebuano input, responds in standard conversational Filipino
- `pattern:sage-caregiver-trust-recovery` — Kai error copy follows "Ay, mali pala..." trust recovery pattern
- `pattern:one-handed-cta-thumb-zone` — composer and send button fixed at bottom; destructive actions (clear history) behind long-press only

## 5. Reuse map

| Component needed | Source | Notes |
|---|---|---|
| Chat bubble (user) | Current — re-skin color tokens | Honey-deep fill replaces current primary |
| Chat bubble (Kai) | Current — re-skin | Surface-container on honey bg |
| Kai avatar (top bar) | Current `ka-expressions/` SVG wrap | `<Kai expression="happy" size={32}>` |
| Suggested chips | New build | Horizontal scroll row; re-use pill primitive |
| Composer | Current — keep as-is | Already `useRef` pattern |

Full table: [`04-reuse-audit.md`](../04-reuse-audit.md)

## 6. Open questions

1. **Suggested chips data source**: are chips static (4 hardcoded), server-personalized (based on recent activity), or a mix? Needs AI engineer decision before Phase 3.
2. **Kai illustration in chat bubble**: the existing Kai illustration is a different SVG from the `ka-expressions/` set. Confirm which asset path the re-skinned bubble uses so Phase 4 doesn't create a parallel illustration.

## 7. Acceptance signal

- Visual parity vs `screenshots/06-chat-honey-fil.png` with current Kai illustration preserved — pixel diff ≤ 0.5%
- Lighthouse perf ≥ 85 mobile
- FIL and EN locale: chip text renders in correct locale; Kai replies follow voice manual
- Reduced-motion: no animation regressions; `thinking` expression is a static swap, not an animated GIF
- Composer queues message when offline; shows warm Kai bubble not a generic error
- Suggested chips have 44×36px touch target minimum (per mobile-first.md §2 quick-reply chip spec)
