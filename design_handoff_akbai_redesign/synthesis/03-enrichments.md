# Phase 2.3 — Enrichments from Phase 1 + 1.5 Research

**Date:** 2026-04-26
**Lead:** build-ux
**Status:** Locked in. References [`02-decisions.md`](./02-decisions.md). Each pattern below is **named** so any later phase can invoke it by name.

These are *not* new decisions — they're the layer that turns the verdicts in 02-decisions.md into operational rules. Each pattern has (a) a name, (b) the rule, (c) where it applies, (d) the research basis (Phase 1 / Phase 1.5 / both).

**Source documents:**
- [`skills/ux-designer/references/ui-ux-principles-akbai.md`](../../akbai-delivery/skills/ux-designer/references/ui-ux-principles-akbai.md)
- [`skills/ux-designer/references/mobile-first.md`](../../akbai-delivery/skills/ux-designer/references/mobile-first.md)
- [`skills/ux-designer/references/conversational-filipino-manual.md`](../../akbai-delivery/skills/ux-designer/references/conversational-filipino-manual.md)
- [`shared/brand-context.md`](../../akbai-delivery/shared/brand-context.md)
- [`research-sources/phase-1.5/RAW.md`](../../akbai-delivery/skills/ux-designer/references/research-sources/phase-1.5/RAW.md)

---

## Naming convention

Each pattern is named in `lower-kebab-case` and prefixed with `pattern:` when referenced from per-screen specs (e.g., `pattern:endowed-progress-streaks`).

---

## Patterns

### 1. `endowed-progress-streaks`

**Rule:** Streak counters use the framing **"Pang-X araw na natin"** (literally "our X-th day"), not "Day X" or numeric counters. The "natin" (us / together) frames the streak as a shared ritual between Kai and the user, not a solo achievement.

**Where it applies:** Home check-in note (primary), Daily Check-in modal (in-line), profile streak summary, Linggong Kuwento KPI grid streak field.

**Research basis:** Phase 1 — Goal-Gradient Effect ("artificial progress towards a goal will help to ensure users are more likely to have the motivation to complete that task"). Phase 1.5 Q1 (UI/UX) — daily streaks → 45% engagement lift, check-in calendars → 2× login frequency across cross-app emerging-market fintech corpus.

**Reset behavior:** A gap of ≥ 2 days resets the streak. Reset copy: *"Balik tayo, [Name]. Pang-1 araw ulit natin."* Never shaming.

---

### 2. `peak-end-weekly-close`

**Rule:** Linggong Kuwento (Sunday Story) is the engineered emotional climax of the week. Auto-opens once Sunday 8–11 AM Manila. The takeaway always lands warm — even on negative-revenue weeks. The "I-share sa family" CTA stays regardless of week sentiment.

**Where it applies:** `/kuwento` route (Phase 10), Sunday-morning push notification, post-Kuwento share modal.

**Research basis:** Phase 1 — Peak-End Rule. Phase 1.5 Q4 (UI/UX) — share-CTA timing must follow the highest-friction task; Khatabook 40× growth via WhatsApp integration.

**Override from A10:** REJECT the dark inverted palette (Anton override). Kuwento stays on the same honey-cream scheme as the rest. Visual ritual differentiation comes from layout (narrative paragraphs + serif emphasis + KPI grid + banig chart), not palette inversion.

---

### 3. `hicks-law-five-tiles`

**Rule:** Home action grid ships **exactly 5 tiles**. Resist adding a 6th in any later sprint. If a feature needs prominence on home, it replaces a tile — it doesn't add to the grid.

**Where it applies:** `/dashboard` action grid only. Other screens use lists, not grids.

**Research basis:** Phase 1 — Hick's Law. Plus PostHog tile-click distribution validation (Phase 12 retention validation).

---

### 4. `loss-aversion-deadlines`

**Rule:** BIR deadline urgency uses **"Huling X araw"** (last X days) framing, not "X days remaining" or "Due in X days." Filipinos respond strongly to the loss-aversion frame in BIR contexts. Combine with ⚠ visual + Kai paper-note callout for ≤ 7 days.

**Where it applies:** `/deadlines` row counters, home morning briefing deadline mention, Kai pre-deadline callout copy.

**Research basis:** Phase 1 — Loss aversion under tax-anxiety (BCG MSME / Phase 1 Filipino-context corpus): 56% manual record-keeping, BIR fear is structural. Phase 1.5 Q2 — compliance procrastination cycle (confused → anxious → avoid → deadline → penalty).

**Tonal calibration:** Always paired with reassuring action copy — *"Huling 5 araw para sa 2551Q. I-prepare ko na ang numero?"* — never alarmist alone.

---

### 5. `filipino-mobile-data-resilience`

**Rule:** Treat the user's data connection as patchy by default. PWA architecture: `next-pwa` + TanStack Query + Persister. Morning briefing on stale-while-revalidate (cache 24h). Heavy lists cached on first load + incrementally updated on foreground. Setup-level data (profile, BIR deadlines) cached indefinitely until version change. Offline mutations queue → auto-sync on reconnect → "Synced ✓" toast.

**Where it applies:** Every screen that fetches data. Composer in `/chat`, expense form, costing slider, check-in modal — all auto-save on each interaction. No data ever lost when a customer walks in mid-entry.

**Reassuring microcopy on offline:** *"Walang internet ngayon — na-save ko muna sa phone mo. I-sync ko pag may connection."*

**Research basis:** Phase 1 mobile-first.md baseline + Phase 1.5 Q1 (Filipino) — sachet economy + dual-SIM mix-and-match + Wi-Fi deferral + GoSurf/PowerAll/DITO Data Sachets. Phase 1.5 Q2 (UI/UX) — validated SW caching stack with concrete budget targets.

---

### 6. `po-register-calibration`

**Rule:** **"Po"** appears on confirmations, BIR topics, and asking permission — NOT on celebrations or casual chat. The register flexes by context, never blanket-applied. Already in [`conversational-filipino-manual.md`](../../akbai-delivery/skills/ux-designer/references/conversational-filipino-manual.md) §1, §3, §4, §5.

**Where it applies:** Every Kai utterance.

**Research basis:** Phase 1 — voice docs corpus.

---

### 7. `reduced-motion-respect`

**Rule:** Petal-drift, kai-bob, squish, leaf-sway, sun-slow, pandesal-squish, gentle-float, wobble — all decorative animations are **gated on `prefers-reduced-motion: no-preference`**. With motion off, layouts remain intact and warmth lands via palette + paper notes alone. The repo's [`repos/animations.html`](./repos/animations.html) intentionally bypasses this gate for review purposes; production code keeps the gate strict.

**Where it applies:** Every component that introduces motion.

**Research basis:** Phase 1 WCAG 2.1 AA compliance + Phase 1.5 Q2 (UI/UX) — perf budget rule.

---

### 8. `streak-resilience-no-shame`

**Rule:** Streak gaps don't shame. After ≥ 2 days missing, the streak counter resets to 0 with re-invite copy: *"Balik tayo, [Name]. Pang-1 araw ulit natin."* No "you broke your streak" or guilt language. Same Sage-Caregiver tone that applies to flat/negative weeks.

**Where it applies:** Home check-in note, daily check-in modal post-submit confirmation.

**Research basis:** Phase 1 brand voice (Sage-Caregiver). Phase 1.5 Q2 (Filipino) — hiya / shame-avoidance research.

---

### 9. `privacy-safe-viral-share` (Q12 pivot 2026-04-26 — replaces former `family-economic-share`)

**Rule:** Sharing surfaces target **achievement moments**, not earnings. Two surfaces:

1. **Streak achievement card** — auto-suggested when streak hits 7d / 30d / 100d / 365d. Card composition: Kai mark (canonical akbay+companion form per `pattern:canonical-kai-mark`) + serif "Pang-30 araw na sa AKBai!" + sampaguita decoration + AKBai wordmark watermark. Caption pre-drafted: *"Tulong sa negosyo, gumagana :)"*. **No peso amounts visible.**

2. **BIR-completion certificate card** — auto-suggested after a successful BIR form filing via AKBai. Card composition: Kai mark + serif "Tapos na ang [form_code] ko!" + form-code badge + completion date + AKBai wordmark. Caption pre-drafted: *"Hindi nahuli kay Kai. Tulong sa BIR — gumagana."*. **No peso amounts visible.**

Both cards share via Web Share API → Messenger / Viber / FB / SMS. Privacy-safe. Pride-of-progress (Duolingo / Cred / Strava model), not income disclosure.

**Linggong Kuwento itself stays private** — internal weekly review only, no public share button. Persona-calibrated tone (sari-sari/baking warm; platform-seller direct) still applies INSIDE Kuwento for the user's own reading, not for sharing.

**Where it applies:** Streak share triggered from home check-in note + profile streak section + post-streak-milestone toast. BIR-cert share triggered from `/deadlines` post-filing-success modal.

**Research basis:** Phase 1.5 Q2 (Filipino) — hiya around money disclosure (42% MSMEs avoid loans for fear of debt; sari-sari avoid utang collection out of embarrassment). Cross-app fintech retention patterns — Duolingo streaks (massive viral surface, no money), MoneyLion Achievement, Moniepoint streak system, Cred tiers, Strava activity shares. Q12 Anton override 2026-04-26: privacy-safe shares preserve cultural pride without violating earnings-disclosure discomfort.

---

### 10. `one-handed-cta-thumb-zone`

**Rule:** Primary CTAs live in the **bottom 40% of the screen** on every screen below the fold. Bottom nav fixed. Destructive actions in top 20% or behind deliberate gestures (long-press) — never in the thumb zone.

**Where it applies:** Every screen.

**Research basis:** Phase 1 — Fitts's Law + NN/g mobile thumb-zone heatmap. Phase 1.5 — open question on PH-specific retail thumb zones (corpus didn't surface explicit evidence; defer to general rules until PostHog tap heatmaps validate).

---

### 11. `energy-slider-emoji-ticks`

**Rule:** Daily Check-in energy slider has **5 emoji ticks** above the slider track (😴 😪 😐 😊 ⚡) for at-a-glance reads. FB-reactions pattern. Slider uses Radix slider primitive themed honey-deep on cream. Inline component in the existing check-in modal (per A9 — modal stays on `/dashboard`, no `/checkin` route).

**Where it applies:** Existing check-in modal on home. Schema migration: `energy_level INT` + `note TEXT` columns nullable on `daily_check_in` table.

**Research basis:** Phase 1.5 schema enrichment (deferred from Phase 10 §10.4 to inline modal).

---

### 12. `hooked-variance-coach-not-casino`

**Rule:** Kai's morning takeaway sentence varies day-to-day in CONTENT, never in RELIABILITY/empathy. Three tonal calibrations rotate based on data context:
- **Energetic / Encouraging** — for morning briefings: *"3 tasks today, 1 deadline on Friday. Kaya mo 'to!"*
- **Observant / Careful** — for sensitive financial advice: *"Ayon sa cash flow mo, mukhang tight ang susunod na buwan."*
- **Celebratory / Playful** — for sales milestones: *"Ay, ₱100,000 na pala ang sales mo this month!"*

The user doesn't know which version of Kai they'll get today (variable reward dopamine) — but it's always supportive (no failure variance like Instagram).

**Where it applies:** Morning Briefing endpoint, Linggong Kuwento takeaway sentence generator, AI-driven empty/error state copy.

**Research basis:** Phase 1.5 Q3 (UI/UX) — Hooked variance rule, "coach not casino" framing.

---

### 13. `regional-language-comprehension`

**Rule:** Kai **understands** Bisaya/Cebuano/Hiligaynon input (greetings: "maayong buntag"; address terms: "bai", "dong", "day"; "pila/tagpila" for "magkano") but **responds in standard conversational Filipino**, regardless of which regional language the user used. Never echo a regional phrase back unless the user repeats it across multiple turns AND the response would feel forced without it.

**Where it applies:** Kai system prompt (every AI feature). All AI-driven Filipino input handling.

**Research basis:** Phase 1.5 Q5 (Filipino) — NCR vs provincial. Cebuano/Bisaya speakers are bilingual in regional + Filipino; forced regional output feels patronizing. Phase 1.5 §11 in [`conversational-filipino-manual.md`](../../akbai-delivery/skills/ux-designer/references/conversational-filipino-manual.md) is canonical.

---

### 14. `sage-caregiver-trust-recovery`

**Rule:** When Kai errs, it owns the mistake gracefully and offers a fix without deflection. Pattern: *"Ay, mali pala ang amount kanina... Na-correct ko na. Sorry po!"* Reduces user's own *hiya* about business mistakes by modeling that mistakes are okay.

**Where it applies:** AI error states (OCR misclass, math error, low-confidence response). Per [`prompt-library.md`](../../akbai-delivery/skills/ai-engineer/references/prompt-library.md) Trust Recovery Pattern.

**Research basis:** Phase 1 — Sage-Caregiver brand archetype. Phase 1.5 Q2 (Filipino) — hiya design framings + observation-over-judgment rule.

---

### 15. `paper-note-asymmetric-corners`

**Rule:** The paper-note primitive uses asymmetric corner radius **`4px 12px 4px 12px`** + a `rotate(-1.2deg)` to `rotate(1.5deg)` tilt + an optional `<TapeStrip>` at the top. References Filipino home-business habit of taping receipts and notes to walls/fridges. Standard cards do NOT get asymmetric corners — keep the No-Line Rule for normal data containers.

**Where it applies:**
- Home check-in invite (always)
- Kai callouts (Saan, Costing, Deadlines, Invoices, Kuwento)
- Daily Check-in modal wrapper
- Onboarding step containers (Phase 6)

**Research basis:** Phase 1 design-system §6 — decorative motif vocabulary + paper-note metaphor.

---

### 16. `media-hand-me-down-baseline`

**Rule:** Design + perf budgets target **mid-range Android (Snapdragon 4xx-6xx, Android 11-13)** because older sari-sari owners frequently use **hand-me-down phones from their kids**. Sub-$100 Transsion (TECNO, Infinix) is dominant in provincial. Specific budgets: LCP ≤ 2.5s, FCP < 1.5s, TTI < 3.5s on Slow 3G + mid-range Android. Page weight < 500KB initial, JS < 200KB gzipped, image budget ≤ 200KB cold home load.

**Where it applies:** Every screen's Lighthouse budget. CI perf budget gate (Phase 11).

**Research basis:** Phase 1.5 Q1 + Q4 (Filipino) — "Child as Digital Bridge" + "Hand-Me-Down Hardware" patterns. Phase 1.5 Q2 (UI/UX) — concrete budget targets.

---

### 17. `palette-context-per-route`

**Rule:** Two-palette strategy implemented as a `palette` context (`cream` for home, `honey` for everything else). No dark inverted palette anywhere (per A10 override). Implementation in `frontend/src/lib/palette/palette-context.tsx` (Phase 3).

**Per-route default:**
| Route | Palette |
|---|---|
| `/dashboard` (home) | `cream` (white `#fdf9f2`) |
| `/chat` | `honey` |
| `/expenses` | `honey` |
| `/scan` | (existing — not changed by redesign) |
| `/deadlines` | `honey` |
| `/costing` | `honey` |
| `/invoices` | `honey` |
| `/profile` | `honey` (with current structure preserved) |
| `/kuwento` | `honey` (NOT dark per A10) |
| `/login`, `/onboarding` | `honey` |

**Research basis:** A1 + A10 + B1 verdicts in 02-decisions.md.

---

### 18. `varying-kai-expression-by-context`

**Rule:** The Kai expression component takes an `expression` prop (`waving | thinking | happy | celebrating | concerned | working`) that maps to the existing AKBai SVG variants at `frontend/src/components/illustrations/svg/ka-expressions/`. Different contexts get different expressions:

| Context | Expression |
|---|---|
| Onboarding step 1 (greeting) | `waving` |
| Wait state ("let me check…") | `thinking` |
| Default home / chat header | `happy` |
| Milestone / streak hit / Linggong Kuwento opens | `celebrating` |
| Tight cash flow alert / pre-deadline | `concerned` |
| OCR processing / sync in progress | `working` |

**Where it applies:** Every Kai mark instance after Phase 4.

**Research basis:** Existing AKBai vocabulary preserved (see icons repo Kai expressions section). Phase 1 brand pillars — proactively caring.

---

### 19. `canonical-kai-mark` <!-- Anton-locked, 2026-04-26 -->

**Rule:** The canonical Kai mark is the **akbay-and-companion crescent pair** — a hand-illustrated form composed of three layered elements:

1. **Honey/amber akbay crescent** on the left — the warm embracing arc (`#c87b14` → `#e89b2f` painterly gradient, soft fabric texture). Represents the "kuya / ate" supportive partner role.
2. **Grey crescent** on the right (`#a8a8a8` → `#c8c8c8`) — the AI companion arc, intentionally cooler/grounded. Represents Kai-as-AI without leaning into "robot" or "tech" tropes.
3. **Cream-yellow face** centered (`#fffbf0` → `#f0d99a` radial gradient) with soft eye-arches and a warm smile. Honey-deep stroke on the smile (`#a1620e`). The face is the focal point — pre-cognitive Don Norman visceral layer.
4. **Soft honey glow halo** behind the form — the "Sun-Drenched Atelier" brand anchor.

**Form metaphor:** akbay (embrace) + AI = AKBai. The dual-crescent encoding is the brand thesis embodied in form.

**Asset path:** `design_handoff_akbai_redesign/prototype/assets/kai-mark.png` (synthesis stage) → `frontend/public/icons/kai-mark.png` (Phase 4 production).

**Where it applies:**
- Home Kumustahan hero (168px circular clip, `kai-bob` animation pending B6)
- Chat top bar (32px, animated)
- Login + onboarding hero (`kai-breathe` animation pending B6)
- Sunburst behind Kai (sun-slow animation pending B6)
- All `<KaiSitting>` and `<Kai expression>` component renderings

**Expression variants** (Phase 4 deliverable): the 6 KaXxx.tsx variants at `frontend/src/components/illustrations/svg/ka-expressions/` swap eyes / eyebrows / mouth on this base form. The akbay+companion crescents stay constant; only the face expression changes.

**Research basis:** Anton-locked direct preference. Reinforces Phase 1 design-system §1 "Why warmth is load-bearing" (Don Norman three layers — visceral pre-cognitive warmth) and Phase 1 brand-context.md (Sage-Caregiver archetype).

**Override:** This rule supersedes any prior Kai mark reference in the handoff prototype or canonical docs. Phase 4's Kai component must render this form, not the prior handoff mark.

---

## Cross-reference

Per-screen specs in [`screens/`](./screens/) reference these patterns by name. Reuse audit in [`04-reuse-audit.md`](./04-reuse-audit.md) lists which existing components implement each pattern.
