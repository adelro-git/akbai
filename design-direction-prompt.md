You are a senior product designer creating a **design direction specification** for AKBai, a native mobile app. Your output is a single Markdown document (`design.md`) that my engineering team will implement directly. You do NOT have access to the codebase — everything you need is in this prompt. Do not produce HTML mockups or images; produce a precise, implementable written spec with concrete tokens, values, and component rules.

---

## 1. WHAT AKBai IS

AKBai ("Katuwang ng Negosyo Mo" — Your Business Partner) is a **native mobile app (iOS + Android, built with Capacitor wrapping a Next.js 16 + Tailwind + Shadcn/UI web app)**. It is an AI business partner for Filipino micro & small business owners (MSMEs) — receipt scanning, expense tracking, BIR tax-deadline monitoring, cash-flow insight, and customer-reply drafting.

The AI persona is **"Kai"** — a warm, proactive "smart ate/kuya" who speaks first, cites real numbers, and feels like a trusted kababayan colleague, not a corporate dashboard. Primary user: **Maria**, a home-based food seller (35–45), earns ₱80K–₱250K/mo, manages everything on her phone, is anxious about BIR, comfortable with GCash. Device reality: **mid-range Android, ~35 Mbps median connectivity, prepaid-data-aware**. Performance and battery matter.

The app is heading into **App Store / Google Play launch**. It must feel like a premium, trustworthy *native* app — not a wrapped website.

---

## 2. THE CURRENT DESIGN SYSTEM (what you are evolving FROM)

The current system is called **"The Art of Warmth" / "Sun-Drenched Atelier."** It is **light-first** with dark mode preserved as a toggle. You must preserve this warm identity as your anchor — refine and add sophistication, never abandon it.

**Color tokens (MD3 semantic naming — you MUST keep these token names so our existing CSS-variable/Tailwind pipeline works; you may retune the hex values):**

| Token | Role | Light | Dark |
|---|---|---|---|
| background / surface | Page background | #fdf9f2 | #07101e |
| surface-container | Card background | #f1ede7 | #0d1a2e |
| surface-container-high | Elevated surface | #ebe8e1 | #111f36 |
| surface-container-low | Recessed / inputs | #f7f3ec | #0a1422 |
| surface-container-lowest | Base white | #ffffff | #030812 |
| surface-container-highest | Pressed / heavy | #e6e2db | #172740 |
| on-surface | Primary text | #1c1c18 | #e6e2db |
| on-surface-variant | Secondary text | #534434 | #d8c3ad |
| primary | Brand action (text/CTA) | #855300 | #ffb95f |
| primary-container | Brand highlight (honey) | #f59e0b | #f59e0b |
| tertiary | Trust / success / **financial data** | #006b54 | #43deb4 |
| error | Error only | #F87171 | #F87171 |
| warning | Warning | #FBBF24 | #FBBF24 |
| outline-variant | Ghost border | #534434 @20% | #d8c3ad @20% |

**Typography:** Plus Jakarta Sans (UI, geometric sans) + **Fraunces** (serif, used for display/editorial headlines and greetings). Scale: Display 48/800/-0.02em, H1 32/800, H2 24/700, H3 18/600, Body 15/400, Chat 14/400, Label 11/700. Weight-800 is reserved for display headlines and **key numbers/financial data** (numbers feel intentional and authoritative).

**Current 6 design principles (you will evolve these — keep what serves the new direction):**
1. **No-Line Rule** — no 1px solid borders; separate surfaces by background-tone shifts.
2. **Tonal Layering** — hierarchy from stacked surface tones, not shadows/borders.
3. **Ambient Shadows** — when used, amber-tinted (primary @8%, 40–60px blur). Never grey shadows.
4. **Ghost Border Fallback** — outline-variant @20% only as a last resort.
5. **Glass & Gradient** — floating nav/modals use 80% bg opacity + 20px backdrop-blur.
6. **Editorial Typography** — display headings and key numbers at weight-800, -0.02em.

**Decorative motif vocabulary (Filipino, warm, NOT kitsch):** IN — banig (woven pattern), capiz (shell/window light), sampaguita (flower). OUT — bahay-kubo, fiesta, saint/religious imagery. Existing motif components: CapizPattern, FloatingPetals, WovenDivider, Squiggle, TapeStrip, SwayingLeaf, Sunburst, DoodleArrow, plus a "paper-note" card shape with tape.

**Kai character:** an illustrated character (recently re-rendered via image generation) with expressions — happy / concerned / thinking / celebrating / waving / working — and a seated "KaiSitting" variant. Kai appears as a chat avatar, an onboarding guide, and a hero element on the home screen.

**Defining UI pattern — the Chat + Card Hybrid:** Kai speaks in **chat bubbles** (greetings, questions, confirmations, errors — max 2 lines each). Structured data lives in **Cards** (expense, morning briefing, BIR deadline, invoice, costing). Pattern: Kai introduces context in a bubble → a Card appears → user acts on the Card (tap/swipe/long-press) → Kai confirms in a follow-up bubble. Card anatomy = header (icon + title + status tag) / body (large scannable primary data) / footer (primary + secondary action). Financial amounts always render in `tertiary` (teal), always formatted (₱18,400), peso sign first.

---

## 3. THE NEW DIRECTION (what you are evolving TO)

Synthesize these **three vectors** into one coherent direction:

**A. Premium native polish.** It must feel like a top-tier native iOS/Android app, not a wrapped web view. That means: real depth and material quality; smooth, intentional **motion** (screen transitions, card enter/exit, list reordering); **native interaction patterns** (bottom sheets/drawers, swipe gestures, pull-to-refresh, contextual long-press, **haptic feedback** on key actions); respect for **safe areas / notches / home indicators**; 60fps targets; and platform-appropriate feel. Specify motion timing/easing and haptic moments concretely. Keep it performant on mid-range Android.

**B. Calmer & more data-confident.** Quieter, more "fintech-serious," trust-through-clarity. Numbers and financial confidence lead. **Reduce decorative density** — motifs become restrained and purposeful (accent moments, not wallpaper). More whitespace, stronger typographic hierarchy, cleaner cards. The user should feel the app is precise and trustworthy with their money.

**C. Kai-character forward.** The evolved Kai character is a centerpiece — more personality, expression, and presence — at **hero moments** (home greeting, onboarding, empty states, celebrations, milestones, error recovery). 

**Resolve the built-in tension between B and C explicitly:** "calmer/less decoration" and "Kai more present" are reconciled by making **Kai's presence come from character quality and a few well-chosen hero moments — never from scattered clutter.** Decorative motifs get quieter so Kai and the numbers can lead. State this resolution as a principle in the doc.

---

## 4. CONSTRAINTS (non-negotiable — voice locked, visuals open)

**LOCKED — do not change:**
- **Conversational Filipino voice** — Kai speaks in a genuine Filipino syntactic frame (VSO word order, second-position enclitics like ko/mo/natin, Filipino conjunctions kung/bago/kasi, Filipino time adverbs), with English retained only for BIR/financial terms, Filipinized verbs (i-save, i-scan, na-scan), brand names, and numbers. NOT English-with-Filipino-words. Any sample copy you write must obey this. Never corporate, never formal Tagalog, never chatbot-speak ("I'd be happy to help!").
- **The Chat + Card Hybrid pattern** — its *structure* stays; its *visual styling* may evolve.
- **Kai as the persona** — Kai stays; Kai's visual treatment may be elevated.
- **MD3 semantic token NAMES** (you may retune hex values, not rename tokens).
- **Light-first default**, dark mode preserved.
- **WCAG 2.1 AA**, 44×44px minimum touch targets, `prefers-reduced-motion` support.
- The warm light-first identity is the anchor — refine, never abandon.

**OPEN — you may freely evolve:** palette hex values (within the warm identity), typography emphasis, depth/elevation/material language, motion & gesture language, decorative motif usage, card and chat-bubble styling, component design, screen layouts, and the design principles themselves.

---

## 5. WHAT TO PRODUCE — `design.md`

A single Markdown document with these sections, in order. Be concrete and implementable (give hex values, px, ms, easing curves, weights). Where you change something, **say what it was and what it becomes** so engineers can diff. Write any sample copy in correct conversational Filipino.

1. **Direction Summary** — the north star in 3–5 sentences. Name the evolved system if a new name helps.
2. **Design Principles (evolved)** — revise the current 6. For each: KEEP / CHANGE / ADD, with rationale. Include the explicit B↔C tension resolution as a principle.
3. **Color System** — full token table (light + dark), each row marked SAME / RETUNED / NEW with the old value where retuned. Usage rules. Confirm AA contrast for text pairings (call out risky ones like honey-on-cream).
4. **Typography** — scale + weights + usage; any changes from current. How "data-confident" shows up in number styling.
5. **Depth, Elevation & Material** — the new depth language (shadows, glass, native material feel) reconciled with the No-Line / Tonal-Layering heritage.
6. **Motion & Interaction** — screen transitions, card enter/exit, gestures (swipe/long-press/pull-to-refresh), **haptic moments**, timing + easing values, and the `prefers-reduced-motion` fallback for each.
7. **Kai Visual Treatment** — how/where Kai appears, sizing per context, expression-to-context mapping, the specific hero moments, and how "Kai-forward" coexists with "calmer." (Persona/voice unchanged.)
8. **Chat + Card Evolution** — evolved chat-bubble styling and card anatomy/styling. Keep the pattern; modernize the look. Include the updated Card types (Expense, Morning Briefing, BIR Deadline, Invoice, Costing) and status-tag styling.
9. **Decorative Motif Vocabulary** — which motifs survive, how restrained, exactly where they're allowed vs. forbidden (enforce the "quieter so Kai/numbers lead" rule).
10. **Screen-by-Screen Direction** — for each: **Home** (Kumustahan greeting + action grid + Kuwento/weekly-story card), **Chat (Kausap si Kai)**, **Resibo Scanner (camera/scan)**, **Expenses (Saan Napunta)**, **BIR Deadlines (Deadline Watcher)**, **Onboarding (Kilala Kita, 5-step)**, **Login**, **Paywall/Subscription**, **Morning Briefing card**, plus **empty / loading / error states**. Per screen: intent in one line + the key visual changes + one short conversational-Filipino copy sample.
11. **Component Specs** — buttons (primary honey-gradient CTA + secondary), pills/chips, cards, bottom nav (4–5 items, glass), bottom sheets/drawers, inputs, status tags, and charts (financial data viz, banig-styled bars). Give sizes, states, tokens.
12. **Accessibility** — AA contrast results for new pairings, touch targets, reduced-motion behaviors, screen-reader/aria expectations for cards and financial amounts.
13. **What Changed vs "Art of Warmth" — Migration Notes** — an explicit, engineer-facing diff: retuned tokens (old→new), changed principles, new/removed components, and anything that will touch many files. Flag breaking vs. additive changes.
14. **Open Questions / Decisions for Anton** — anything you had to assume or that needs a founder call.

---

## 6. QUALITY BAR
- Concrete and implementable — a Tailwind + Shadcn engineer should be able to build from it without guessing.
- Internally coherent — the three vectors read as ONE direction, not three bolted together.
- Honest about trade-offs — surface the B↔C tension and any AA-contrast or performance risks.
- Respects every LOCKED constraint. Sample copy is correct conversational Filipino.
- Output **only** the `design.md` content (Markdown). No preamble, no HTML, no images.
