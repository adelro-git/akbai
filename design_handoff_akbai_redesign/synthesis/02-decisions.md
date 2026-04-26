# Phase 2.2 — Synthesis Decisions

**Date:** 2026-04-26
**Lead:** build-ux (synthesized with Anton's per-screen verdicts from the 2.1 visual side-by-side at [`index.html`](./index.html))
**Status:** **LOCKED.** All sections (A–F) signed off by Anton 2026-04-26. B4 / B5 / B6 review repos approved. Phase 3 (Foundations) authorized.

Each row is a verdict. Verdicts:

- **KEEP CURRENT** — the existing implementation is better; the handoff version doesn't ship.
- **ADOPT HANDOFF** — the handoff version is better; replace current.
- **HYBRIDIZE** — take parts of both. What from each is specified.
- **DEFER** — neither is ready; design later or ship a placeholder.
- **REJECT BOTH** — both versions are wrong; specify replacement.

Each row also includes the Phase 1.5 / Phase 1 research basis where applicable.

---

## A. Per-screen verdicts (LOCKED — Anton signed off 2026-04-26)

| # | Screen | Verdict | What from each |
|---|---|---|---|
| A1 | **Home (`/dashboard`)** | **HYBRIDIZE** | Layout structure + daily-check-in positioning + Kai hero presence: **ADOPT HANDOFF.** Background palette: **KEEP CURRENT (white / `#fdf9f2`)** — reject honey-cream as the home background. Nav label: **REJECT BOTH** — use literal **"Home"** instead of current "Dashboard" or handoff "Umaga Mo". |
| A2 | **Chat / Kausap (`/chat`)** | **HYBRIDIZE** | Overall look: **ADOPT HANDOFF.** Branded "Chat with Kai" framing/header: **KEEP CURRENT.** Kai's chat-side avatar/image: **KEEP CURRENT** (preserve the existing Kai illustration treatment in chat bubbles). |
| A3 | **Expenses / Saan napunta (`/expenses`)** | **ADOPT HANDOFF** | Replace current expense layout with handoff's Saan card stack — total card + donut, category breakdown rows with progress bars, banig-textured 7-day daily chart, Kai callout paper-note. Keep current's month picker logic (data-layer only). |
| A4 | **Resibo Scanner (`/scan`)** | **KEEP CURRENT** | Camera UI, viewfinder, capture flow, post-scan card slide-in stay as-is. Handoff's dark-bleed scan UI is rejected for the redesign — current already feels right. |
| A5 | **BIR Deadlines (`/deadlines`)** | **ADOPT HANDOFF** | Replace with handoff's serif H1 + 56×56 date chip rows + days-left counter + Kai pre-deadline paper-note callout. Form-code prominence comes for free. |
| A6 | **Costing / Tamang Presyo (`/costing`)** | **HYBRIDIZE** | Layout + slider treatment + recommended-price card + Kai callout: **ADOPT HANDOFF.** Existing illustration on the empty/intro state: **KEEP CURRENT** — port the current's costing illustration into the handoff layout. |
| A7 | **Invoices / Mga Invoice (`/invoices`)** | **HYBRIDIZE** | Same pattern as Costing. Layout + summary tiles + status pills + serif H1: **ADOPT HANDOFF.** Existing invoice illustration on empty state: **KEEP CURRENT** — port into handoff layout. |
| A8 | **Profile (`/profile`)** | **HYBRIDIZE** | Structure + content density: **KEEP CURRENT.** Visual chrome (typography, spacing, paper-note treatments where appropriate): **ADOPT HANDOFF elements.** This is a "current with sprinkled handoff polish" treatment — not a full re-skin. |
| A9 | **Daily Check-in (modal on `/dashboard`)** | **KEEP CURRENT placement** | Daily Check-in **stays as the existing modal/inline component on the home page**, similar to how it works today. Do **not** extract to a separate `/checkin` route. The handoff's full-screen check-in is rejected. <br><br>**This overrides the original plan's Phase 10 §10.4** — see "Plan reconciliation" below. The Phase 1.5 schema enrichment (`energy_level INT`, `note TEXT` on `daily_check_in`) still applies; just inline within the existing modal. |
| A10 | **Linggong Kuwento (Sunday Story)** | **HYBRIDIZE** | New route `/kuwento` (per Phase 10). **REJECT** the handoff's dark inverted palette — Kuwento stays on the same honey-cream color scheme as the rest of the redesign (Anton override 2026-04-26). **ADOPT** the handoff's narrative paragraph structure with honey-deep highlights, 2×2 KPI grid, banig chart, and "I-share sa family" CTA. Full Phase 10 build will refine. |

---

## B. Foundation verdicts (SIGNED OFF — Anton, 2026-04-26)

These are foundation-level decisions. **B1–B3, B7 signed off as proposed.** **B4 (icons), B5 (motifs), B6 (animations) repos approved** — see "Repo approvals" below.

| # | Dimension | Verdict | Rationale |
|---|---|---|---|
| B1 | **Color palette — global default** | **HYBRIDIZE** | Two-palette strategy. **Home stays on current white (`#fdf9f2`)** per Anton's A1 call. All other surfaces (Chat, Saan, Deadlines, Costing, Invoices, Kuwento, Profile) use **honey-cream `#fef4dd`** from the handoff. **No dark inverted palette anywhere** (Kuwento stays light per A10 override). Implementation: a `palette` context (`cream` / `honey`) selected per route, defaulting to `honey` for non-home screens. |
| B2 | **Typography** | **HYBRIDIZE** | **Plus Jakarta Sans** retained as `--font-sans` (existing brand sans, no change). **Add Fraunces** as `--font-serif` for display headings (greetings, narrative paragraphs in Kuwento, Saan KPI labels). Body remains PJS. Per Phase 1 aesthetic-usability rule: the warmth comes from Fraunces + palette, not from a sans swap. |
| B3 | **Surface hierarchy** | **HYBRIDIZE** | Keep current's Material Design 3 6-level surface tokens (`--surface`, `--surface-low`, `--surface-container`, etc.) as the underlying contrast system. Override only the top-level `--bg` / `--surface` values per active palette context. Handoff's 3-level scale is too coarse for chat-bubble vs card vs nav contrast. |
| B4 | **Iconography** | **DEFER — build icon repository first** | Anton override 2026-04-26: rather than blindly porting the handoff's 7 brand icons, **first build a reviewable icon repository** at [`synthesis/repos/icons.html`](./repos/icons.html) showing each candidate icon at multiple sizes / backgrounds / weights, alongside the existing AKBai illustrations for style consistency check. Once Anton approves the repo, the approved set becomes the canonical brand-icon library; rejected ones drop out. `lucide-react` retained for utility roles (close, chevron, settings, search, filter) regardless. |
| B5 | **Decorative motifs (capiz, petals, woven)** | **DEFER — build motif repository first** | Anton override 2026-04-26: build a reviewable motif repository at [`synthesis/repos/motifs.html`](./repos/motifs.html) showing each candidate motif (`CapizPattern`, `FloatingPetals`, `WovenDivider`, `Squiggle`, `TapeStrip`) in isolation + against the home-white and honey-cream backgrounds + at scale + with annotated "where used." Once approved, motifs are inlined as SVG with strict reduced-motion gating and image budget ≤ 200KB cold home load (Phase 1.5 perf budget). |
| B6 | **Animation library** | **DEFER — build animation repository first** | Anton override 2026-04-26: animations must "stay true to the images we want to showcase" — build a reviewable animation repository at [`synthesis/repos/animations.html`](./repos/animations.html) where each candidate keyframe (`kai-bob`, `petal-drift`, `squish`, refined `slide-up`, `fade-in`) is demoed in isolation **paired with the actual image/element it'll be applied to** (Kai mark, petal layer, tile press, card entry, page entry). Anton reviews each animation in context before it ships. All approved keyframes gated on `prefers-reduced-motion`. |
| B7 | **Border treatment** | **HYBRIDIZE** | Keep current's "No-Line Rule" (color-shift over hairline borders) for cards and chips. **Adopt** handoff's asymmetric `4px 12px 4px 12px` radius + `rotate(-1.2deg)` tilt on the **paper-note primitive only** — used for daily check-in invite, Kai callouts, and the Kuwento takeaway. Asymmetric corners are intentional warmth, not a replacement for normal cards. |

## C. Chrome verdicts (SIGNED OFF — Anton, 2026-04-26)

| # | Dimension | Verdict | Rationale |
|---|---|---|---|
| C1 | **Sidebar (≥ 860px)** | **HYBRIDIZE** | Adopt handoff's structure: AKBai wordmark + Kai sitting mark, persona pill, nav items, language toggle pills at bottom. **Reuse current `sidebar-nav.tsx` API** (don't replace) — re-skin it. |
| C2 | **Bottom nav (< 860px)** | **HYBRIDIZE — keep 5 tabs, adopt handoff styling** | Removing the Scan tab (handoff drops it to 4) would hurt the highest-frequency action. Keep current 5-tab structure (Home / Chat / Scan / Pera / More). Adopt handoff's honey-gradient active-state styling. Glass blur preserved. <br><br>**Confirm with PostHog post-launch:** if Scan tab clicks <10% of total nav clicks for 30 days, revisit. |
| C3 | **Mobile breakpoint** | **ADOPT HANDOFF (860px)** | Action grid needs 4 cols on tablets. One extra breakpoint is cheap. Current uses 768px; switch to 860px. |
| C4 | **Persona pill in sidebar** | **ADOPT HANDOFF** | Display business name + tagline. Tap opens **profile screen** (single-user — no multi-account switcher). Per scope decision in plan. |
| C5 | **Language toggle (FIL / EN)** | **ADOPT HANDOFF** | Pills in sidebar bottom + compact mobile affordance in "More" drawer. Functional from Phase 5 — `next-intl` cookie-based locale resolution. Both FIL and EN catalogs ship with every Phase 4–10 string. |
| C6 | **Glass nav blur** | **KEEP CURRENT** | Current `backdrop-blur` already shipped, well-loved, good on Android Chrome + iOS Safari. Handoff doesn't change this — just confirming we keep it. |
| C7 | **"More" drawer contents** | **ADOPT HANDOFF** | BIR Deadlines, Tamang Presyo, Mga Invoice, Mga Draft, Daily Check-in (history), Linggong Kuwento. Vaul drawer (already installed). |

---

## D. Voice & copy verdicts (SIGNED OFF — Anton, 2026-04-26)

| # | Dimension | Verdict | Rationale |
|---|---|---|---|
| D1 | **Kai voice (Filipino + naturalized English)** | **KEEP CURRENT** | The full conversational-Filipino manual + copy guide already documents 8 anti-patterns + 10 do/don't categories + the Phase 1.5 §11 regional-language rule. Handoff strings are illustrative only — the canonical voice docs win in any conflict. |
| D2 | **Empty states** | **KEEP CURRENT** | The "Wala ka pang gastos. I-try mo ang Resibo Scanner?" pattern is canonical (Phase 1 Hiya rule, action-oriented). Handoff defaults are illustrative only. |
| D3 | **Error states** | **KEEP CURRENT** | "Hindi ko ma-scan, boss…" pattern is canonical (Trust Recovery Pattern). Handoff defaults are illustrative only. |
| D4 | **Streak counter framing** | **ADOPT HANDOFF** | "Pang-12 araw na natin" framing. Goal-Gradient + Phase 1 togetherness rule. Beats current "Day 12" or numeric counter. |
| D5 | **Streak + BIR-cert share copy** (formerly Linggong Kuwento share copy) | **HYBRIDIZE — persona-calibrated** | **Q12 pivot 2026-04-26: Linggong Kuwento itself is now private; share surfaces moved to streak + BIR-completion cards.** D5 now governs copy on those two cards: (1) **Streak card** caption: "Pang-30 araw na sa AKBai — tulong sa negosyo, gumagana :)" — same for all personas. (2) **BIR-cert card** caption: "Tapos na ang [form_code] ko! Hindi nahuli kay Kai." — same for all personas. **No peso amounts on either card.** Persona-calibration still applies INTERNALLY in Linggong Kuwento private weekly review — sari-sari + home-baking get warmer "ginalingan mo pa rin" framing on flat/negative weeks; platform sellers (Jose) get direct "Flat ang sales this week" framing. But this is internal-only (the user reads it themselves), not shareable. Channel for shares: Messenger / Viber / FB / SMS via Web Share API. |
| D6 | **Variable reward variance for daily takeaway** | **ADOPT HANDOFF + PHASE 1.5 RULE** | Server-generated, varies day-to-day. Rotate across 3 tonal calibrations: Energetic / Observant / Celebratory. High variance in content, low variance in reliability. (Phase 1.5 Hooked rule.) |

---

## E. Interaction patterns (SIGNED OFF — Anton, 2026-04-26)

| # | Dimension | Verdict | Rationale |
|---|---|---|---|
| E1 | **Forms — useRef + onClick** | **KEEP CURRENT** | React 19 controlled-input bug means useRef + onClick is canonical (per CLAUDE.md). Handoff implicit-controlled patterns are unsafe in our stack. |
| E2 | **Card swipe gestures (40% threshold)** | **KEEP CURRENT** | Already-learned interaction in archive/complete flows. Removing would frustrate current users. Handoff has none — that's its omission, not its preference. |
| E3 | **Long-press menus / context actions** | **KEEP CURRENT** | Existing pattern preserved. |
| E4 | **Pull-to-refresh** | **KEEP CURRENT** | Existing native PWA gesture preserved. |

---

## F. A11y / Performance (SIGNED OFF — Anton, 2026-04-26)

| # | Dimension | Verdict | Rationale |
|---|---|---|---|
| F1 | **Touch target floor (44×44 minimum)** | **KEEP CURRENT** | WCAG 2.1 AAA + project rule. Strict on all new components. |
| F2 | **Reduced-motion gating** | **EXTEND** | Current respects `prefers-reduced-motion`. Extend to all new motifs (`kai-bob`, `petal-drift`, `squish`). Layout intact when motion off. |
| F3 | **Contrast (WCAG AA)** | **VERIFY** | Verify every new honey-deep × honey-cream pairing in Phase 3 token addition. Current MD3 surface set is already verified. |
| F4 | **Performance budget** | **TIGHTEN to Phase 1.5 numbers** | LCP ≤ 2.5s / FCP < 1.5s / TTI < 3.5s on Slow 3G + mid-range Android. Page weight < 500KB initial; JS < 200KB gzipped; image budget ≤ 200KB cold home load. (Phase 1.5 PWA-perf rule.) |
| F5 | **Offline-first architecture** | **KEEP CURRENT + EXTEND** | `next-pwa` + TanStack Query + Persister already shipped. Extend per Phase 1.5 Q2: daily/stale-while-revalidate for morning briefing, incremental foreground update for heavy lists, queued mutations with "Synced ✓" toast. Reassuring microcopy: *"Walang internet ngayon — na-save ko muna sa phone mo. I-sync ko pag may connection."* |

---

## Plan reconciliation (driven by Anton's A9 verdict)

The original plan ([`i-created-design-framework-harmonic-shamir.md`](../../C:/Users/Anton del Rosario/.claude/plans/i-created-design-framework-harmonic-shamir.md)) Phase 10 §10.4 calls for extracting Daily Check-in into `/(app)/checkin/page.tsx`. **Override:** keep the existing modal/inline pattern on `/dashboard`. The Phase 1.5 schema enrichment (`energy_level INT`, `note TEXT`) still applies — just adds the energy slider + note field to the existing check-in modal, not a new screen.

**Action item for Phase 3 onward:** when the plan references `/checkin` as a new route, treat as deprecated; the work moves into the existing `check-in-modal.tsx` component instead.

---

## Open-question resolutions (locked by Anton, 2026-04-26)

These are resolutions to the 13 open questions surfaced by build-ux during per-screen spec writing. Each resolution is binding for Phase 3+.

| Q | Topic | Resolution |
|---|---|---|
| Q1 | Home Kuwento card data endpoint | **Same endpoint as `/kuwento`.** `/api/weekly-story` returns full payload. Home renders KPI grid + chart + takeaway only; `/kuwento` renders everything (incl. narrative paragraphs). One source of truth, idempotent within calendar week, cached 7 days. |
| Q10 | Linggong Kuwento generation trigger | **Pre-generate Sunday 6 AM via Vercel Cron.** Cron runs every Sunday at 6 AM Manila for all active users. Stores generated narrative in a new `weekly_stories` table keyed by `(user_id, week_start)`. When user opens `/kuwento` between 8–11 AM, loads from DB instantly. No LLM latency at the emotional peak. Schema migration required in Phase 10. |
| Q11 | "NA-SAVE SA ORAS" KPI calculation | **Defer the metric.** Replace with a different KPI for now (e.g., "Pinakamahabang streak" or "Receipts na-process"). Time-saved-vs-Excel is hard to defend honestly without baseline data. Re-introduce in Phase 12 if PostHog produces real comparable behavior. |
| Q2 | FloatingPetals perf gate | **Defer petals + show static sampaguita constellation instead.** First visit: no animated petals (LCP-critical path stays clean), but render 4–6 small static sampaguita decorations in hero corners — visceral warmth at day 0 without the JS/keyframe overhead. Day-2+ (or once SW cache is primed): animated petals replace the static decorations. Best of both. |
| Q3 | Tile background tints on cream home bg | **Re-derive tints for cream background.** Phase 3 token work generates new tint values that hit ≥ 3:1 contrast against `#fdf9f2`. Same warm honey hue family as handoff, darker shades. Each tile keeps its identity but reads cleanly on cream. ~1–2 hrs of token tuning in Phase 3. |
| Q13 | 860px breakpoint implementation | **Extend Tailwind config with custom screen `tablet: '860px'`.** Add to `tailwind.config.js` `screens` (after default `md`) so `tablet:` prefix is available without overriding existing `md:` usages. ADR in Phase 3 captures rationale. Keeps Tailwind ergonomics + greppable + explicit. |
| Q4 | Chat suggested-question chips data source | **Rule-based personalized + 1 evergreen.** `/api/chat/suggestions` runs DB queries (no LLM): IF receipts ≥ 3 last 24h → "I-summarize ang gastos this week"; IF deadline ≤ 7d → "Ano ang [form_code]?"; IF invoice overdue → "Sinong may utang pa?"; ELSE evergreen "Magkano dapat presyo ng…?". Cached 30 min. Cost: ~$0/month at any scale (Supabase queries only, no LLM). |
| Q7 | BIR Deadlines callout tap action | **Open chat with form-code in URL param + system-prompt context.** Tap navigates to `/chat?topic=[form_code]&context=deadline-[N]d`. Chat page reads params, injects system message into Kai's context: "User is asking about [form_code] with [N] days until deadline." Kai responds with form-specific guidance + "I-prepare ko na?" CTA. Deep-linkable, PostHog-trackable. |
| Q12 | Share surface — moved off Linggong Kuwento | **PIVOTED.** Anton flagged earnings-disclosure hiya. Linggong Kuwento now stays **private** (internal weekly review only — no public share button on it). Share surface moves to two privacy-safe moments: (1) **streak achievement card** triggered at 7d / 30d / 100d / 365d ("Pang-30 araw na sa AKBai!" + Kai mark + sampaguita); (2) **BIR-completion certificate card** triggered after a successful BIR form filing ("I just filed my [form_code] with AKBai — hindi mahuhuli kay Kai!" + Kai mark + form-code badge). Both shared via Web Share API → Messenger / Viber / FB. No peso amounts visible on either card. Pattern parallels Duolingo (streak), Cred (tier), Strava (activity), MoneyLion Achievement. <br><br>**Cascading change:** D5 + `pattern:family-economic-share` rewritten to reflect that Linggong Kuwento is private; share surfaces are streak + cert. |
| Q5 | Saan napunta category colors | **Add `color` field to EXPENSE_CATEGORIES registry** (`lib/expenses/categories.ts`). HSL values per category derived from warm palette, ≥ 3:1 contrast on cream + honey-cream backgrounds. Phase 3 token work, ~30 min eng. |
| Q6 | BIR Deadline date chip month abbreviation | **Keep English month abbreviations** (NOV, DEC, JAN). Filipinos universally understand English temporal abbreviations. Aligns with conversational-filipino-manual.md rule (English retained for universally-understood terms). No FIL lookup table needed. Use `Intl.DateTimeFormat('en-US', { month: 'short' })` or `Intl.DateTimeFormat('en-PH')` — trivial. |
| Q8 | Costing competitor price data source | **Omit when unavailable.** Phase 0A scope: skip competitor pricing. The Kai callout on `/costing` shows OTHER context-relevant insights instead — receipt-history-derived (e.g., "Tumaas ang kapalit ngayong buwan") or user-history-derived (e.g., "Mas mababa ang markup mo vs nakaraang weeks"). Competitor pricing returns as a Phase 11+ feature once we have aggregate data from a critical mass of MSMEs. Honest about data we have on day 0; no LLM hallucinations risked. |
| Q9 | Mga Invoice "Late na" tile tap | **Filter list to overdue-only.** Tile acts as a filter chip — tap to apply (highlights tile, list filters), tap again or tap "Hinihintay" to clear. Standard pattern from Lazada/Shopee/email apps. Discoverable + reversible. |

---

## Canonical Kai mark (locked by Anton, 2026-04-26)

The Kai mark is the **akbay-and-companion crescent pair** described in [`03-enrichments.md` §19 `canonical-kai-mark`](./03-enrichments.md#19-canonical-kai-mark----anton-locked-2026-04-26-). Path: `design_handoff_akbai_redesign/prototype/assets/kai-mark.png` (synthesis) → `frontend/public/icons/kai-mark.png` (Phase 4). Supersedes any prior handoff mark.

---

## Sign-off

- [x] Section A (per-screen verdicts) — Anton, 2026-04-26 (verbatim from visual review)
- [x] Section B (foundation verdicts) — Anton, 2026-04-26
- [x] Section C (chrome verdicts) — Anton, 2026-04-26
- [x] Section D (voice & copy verdicts) — Anton, 2026-04-26
- [x] Section E (interaction patterns) — Anton, 2026-04-26
- [x] Section F (a11y / perf) — Anton, 2026-04-26

## Repo approvals (Anton, 2026-04-26)

- [x] **B4 — Icon repository** ([`repos/icons.html`](./repos/icons.html)) approved. The 9 brand icons (Resibo, Usap, Pera, Kalendaryo, Precio, Invoice, Checkin, SundayStory, Drafts), 5 nav icons, Sampaguita motif, 10 expense-category icons, 6 financial icons, 4 business-type icons, and 6 Kai expressions are the canonical brand-icon library. `lucide-react` retained for utility roles only.
- [x] **B5 — Motif repository** ([`repos/motifs.html`](./repos/motifs.html)) approved. CapizPattern, FloatingPetals, WovenDivider, Squiggle, TapeStrip, SwayingLeaf, Sunburst, DoodleArrow ship. SampaguitaGarland rejected. Motifs gated on `prefers-reduced-motion` in production; image budget ≤ 200KB cold home load.
- [x] **B6 — Animation repository** ([`repos/animations.html`](./repos/animations.html)) approved. 16 keyframes (kai-bob, kai-breathe, pandesal-squish, slide-up, fade-in, pop-in, typing-bounce, steam-rise, leaf-sway, sun-slow, gentle-float, wobble, flame-flicker, check-pop, bounce-in, plus refined slide-up) ship. All gated on `prefers-reduced-motion: no-preference` in production.

**Phase 2 LOCKED.** Phase 3 (Foundations) authorized 2026-04-26.
