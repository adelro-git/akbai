# UI/UX Principles — Applied to AKBai

Distilled from a NotebookLM corpus of 14 sources (Laws of UX × 7, NN/g Mobile UX, Don Norman emotional design, Hooked, WCAG 2.1, web.dev reduced-motion + LCP). Raw Q&A at [`research-sources/ui-ux-principles-akbai-RAW.md`](research-sources/ui-ux-principles-akbai-RAW.md). Notebook: `0127f12f-8da7-4932-833b-9a3b195cce94`.

Every principle below has (a) the canonical statement, (b) a source-anchored quote, and (c) a concrete AKBai screen rule. Use these as design-review checkpoints in Phase 2 synthesis and every build phase.

---

## The 10 principles that shape AKBai

**1. Hick's Law — fewer choices, faster decisions**
> "Break complex tasks into smaller steps in order to decrease cognitive load." (Laws of UX)
*AKBai rule:* Home screen ships **5 tiles, not 6+.** Onboarding ships **one question per screen.** Resist adding "just one more" tile in any later sprint.

**2. Fitts's Law — large targets, bottom-thumb zone**
> "Touch targets should be large enough for users to accurately select them." (Laws of UX)
*AKBai rule:* Primary CTAs ≥ 44 × 44 CSS px (WCAG 2.1 AAA), placed in the bottom thumb zone on every screen. Honey-deep filled, oversized in the action grid.

**3. Jakob's Law — borrow learned patterns**
> "Users will transfer expectations they have built around one familiar product to another that appears similar." (Laws of UX)
*AKBai rule:* Bottom nav, swipe-to-archive, FB-Messenger-style chat bubbles, lucide utility icons. Don't invent novel chrome — Filipino MSMEs learned mobile UI from FB/Lazada/GCash; transfer that fluency.

**4. Tesler's Law — move complexity to the system**
> "Ensure as much as possible of the burden is lifted from users by dealing with inherent complexity during design and development." (Laws of UX)
*AKBai rule:* Receipt OCR auto-categorizes; Kai writes the morning briefing; the costing slider computes margins live. The user never sees a category dropdown if Kai can infer it.

**5. Goal-Gradient — show artificial progress**
> "Providing artificial progress towards a goal will help to ensure users are more likely to have the motivation to complete that task." (Laws of UX)
*AKBai rule:* Onboarding shows 5 sampaguita dots filled honey-deep as steps complete. Streak counter on the check-in note uses *"Pang-12 araw na natin"* framing.

**6. Peak-End Rule — engineer the emotional climax**
> "Identify the moments when your product is most helpful, valuable, or entertaining and design to delight the end user." (Laws of UX)
*AKBai rule:* Linggong Kuwento (Sunday Story) is the weekly *end* — celebratory tone, share button, dark inverted palette signals ritual. Negative-week takeaways flip language to *"ginalingan mo pa rin"* — never "you lost".

<!-- Phase 1.5 expansion, 2026-04-26: family-share UX rules grounded in NotebookLM Q4 (UI/UX) -->
*Family-share execution (load-bearing for both retention and viral growth):*
- **Image format.** Not a spreadsheet — a ritual celebration. Dark inverted palette + banig-textured chart + bite-sized KPI victories ("peak day," "record receipts scanned"). Visually distinct from everyday data entry.
- **Message preview.** Pre-drafted conversational Filipino in the user's voice (VSO + natural particles), not a bot. Example: *"Isang linggo ng tubo at pag-asa."* Pre-drafting removes the *hiya* of bragging about money.
- **Channel.** Build for "dark social" — deep-link directly into **Facebook Messenger and Viber family group chats.** SMS for basic alerts only. Khatabook achieved 40× growth largely via WhatsApp daily-comm integration; the Filipino analogue is Messenger/Viber.
- **Timing.** Trigger only at week-end after the highest-friction task (Friday/Saturday reconciliation). Never mid-task. Concluding a stressful week with celebratory recap + immediate share prompt transforms solitary admin burden into collective family celebration.

**7. Aesthetic-Usability Effect — warmth = perceived competence**
> "People are more tolerant of minor usability issues when the design of a product or service is aesthetically pleasing." (Laws of UX) Norman: positive affect "broadens thought processes and makes people more flexible and creative."
*AKBai rule:* Honey palette + Fraunces serif + paper-note tilt + petal/banig motifs are not decoration — they buy us forgiveness for legitimate first-month friction (slow OCR confidence, missing categories, etc.).

**8. The Hooked Model — triggers + simple actions + variable rewards**
> "Identify and utilize external and internal triggers to prompt user action, ensuring your product becomes a regular part of users' routines." Plus: "explore how to use variable rewards to keep users engaged." (Nir Eyal)
*AKBai rule:* Daily push at typical store-closing time deep-links to a one-tap "Record Today's Sales". Kai's morning takeaway sentence is server-generated and varies day-to-day. Predictability kills retention; warm unpredictability builds it.

<!-- Phase 1.5 expansion, 2026-04-26: variance calibration rule grounded in NotebookLM Q3 (UI/UX) -->
*Variance calibration — "coach, not casino":*
- **High variance in CONTENT, low variance in RELIABILITY/empathy.** Vary the specific insight day-to-day; never vary the warmth or the certainty that Kai will deliver something useful. Service apps (vs. Instagram) cannot use *failure* as variance — failure-as-variance only works for entertainment products. Risky for fintech: extreme variable schedules blur into manipulation (compulsive behavior, risky trading).
- **Three tonal calibrations to rotate.** The takeaway sentence should rotate across these registers based on data context — not at random:
  - **Energetic / Encouraging** — for morning briefings: *"3 tasks today, 1 deadline on Friday. Kaya mo 'to!"*
  - **Observant / Careful** — for sensitive financial advice: *"Ayon sa cash flow mo, mukhang tight ang susunod na buwan."*
  - **Celebratory / Playful** — for sales milestones: *"Ay, ₱100,000 na pala ang sales mo this month!"*
- The user doesn't know *which* version of Kai they'll get today — that's the dopamine of variable reward — but they always know it'll be supportive.

**9. Design for Interruptions — auto-save state always**
> "The mobile app or website must save state at all times and be prepared for such interruptions… mobile sessions average just 72 seconds." (NN/g)
*AKBai rule:* Composer in Kausap queues offline. Costing slider, expense form, check-in mood — all auto-save on each interaction. No data ever lost when a customer walks in mid-entry.

**10. Largest Contentful Paint — < 2.5s mobile**
> "To provide a good user experience, sites should strive to have Largest Contentful Paint of 2.5 seconds or less." (web.dev Core Web Vitals)
*AKBai rule:* Greeting + Kai mark render from local clock immediately; weekly chart skeleton fills in. Defer petals/capiz/heavier illustrations until after LCP. Inline SVGs (no extra requests). On Slow 3G + mid-range Snapdragon target.

---

## Accessibility & performance non-negotiables

Distilled from WCAG 2.1 AA quickref + web.dev:

- **Contrast.** 4.5:1 body, 3:1 large text (≥ 18px), 3:1 non-text UI elements (icons, focus rings). Verify every honey-deep × cream pairing in Phase 3.
- **Reduced motion.** `prefers-reduced-motion: reduce` disables `kai-bob`, `petal-drift`, `slide-up`. Layout intact; warmth via palette + paper notes still lands.
- **Reflow.** Content reflows to 320 CSS px width without horizontal scroll. No locked orientation.
- **Pointer gestures.** Single-tap-only paths for every action. Action fires on up-event, not down-event, so users can drag-cancel.
- **Error prevention.** Financial entries (transactions, invoices, costing saves) require either review-and-confirm step or full reversibility.
- **Single-window self-sufficiency.** Built-in calculators on transaction screens. No "switch to GCash to copy a number" friction.

---

## Onboarding rules (Q5 distilled)

For low-digital-literacy first-time users:

1. **Single-question-per-screen.** Hick + interruption design: one question, one CTA, large target. Resume cleanly if interrupted.
2. **Honey-deep error recovery copy that names the problem and offers a specific suggestion.** WCAG: "Provide specific suggestions to the user." Tone: warm, never alarmist (see [`conversational-filipino-manual.md`](conversational-filipino-manual.md) §4-§5).
3. **Sampaguita progress dots filled as steps complete.** Goal-Gradient: artificial progress drives completion. The 5-step wizard's progress is visible at all times.

---

## The 3 highest-leverage retention investments

Per Q6 — based ONLY on what the corpus supports:

1. **Engineering external triggers (Hooked).** Daily contextual push at store-closing time → one-tap "Record Today's Sales". Habit must take root in week 1 or it doesn't take root.
2. **Artificial progress for onboarding (Goal-Gradient).** The 5-step wizard ships pre-filled to ~40% the moment they hit Step 1 (account exists, locale set, time-of-day greeting captured). Most churn happens at the setup cliff — flatten it.
3. **Optimizing the emotional climax (Peak-End).** Replace every utilitarian "saved" toast with a warm closing — celebratory animation, Kai takeaway, "tara, [name]!" Never let the last impression be a sterile snackbar.

<!-- Phase 1.5 expansion, 2026-04-26: hard retention metrics from NotebookLM Q1 (UI/UX) -->
**Evidence-anchor (cross-app emerging-market fintech metrics):**
- **Daily streaks → +45% user engagement.** Check-in calendars → 2× app login frequency. (Across Khatabook, ZA Bank, Moniepoint analyses.)
- **Khatabook** automated WhatsApp/SMS reminders → merchants get paid up to **3× faster**. The reminder loop is itself a retention mechanism (the merchant comes back to confirm).
- **Moniepoint** weekly-resetting streak system → tier protection forces daily-volume habit (lose tier if you skip a day during the week).
- **Flourish Fi × Banco Carrefour, BancoSol** variable-reward flows → **+32% deposit value, 2× login frequency, ~$600 saved over 6–8 months** for users who'd previously saved nothing.
- These are the closest cross-app benchmarks AKBai's PostHog should be evaluated against in Phase 12 retention validation.

---

## Don Norman, in three lines

- **Visceral** (pre-cognitive): honey palette + Kai mark + paper-note tilt make accounting *not feel like* accounting in the first 200ms.
- **Behavioral** (in-task): aesthetic appeal "increases tolerance for minor difficulties and blockages" — buys forgiveness for OCR misses, slow networks, missing categories.
- **Reflective** (long-term): localized warmth lets the user form a positive attachment to the tool. They don't *tolerate* AKBai; they *like* it. Retention.

---

**Cross-phase use:** This doc is loaded by the `build-ux` agent on every UI build. When a screen review needs deeper grounding than is here, re-query the NotebookLM notebook (URL in [`research-sources/README.md`](research-sources/README.md)) and append findings.
