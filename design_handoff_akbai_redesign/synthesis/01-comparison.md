# Phase 2.1 — Side-by-Side Comparison

**Date:** 2026-04-26
**Visual evidence:** [`index.html`](./index.html) (open in browser) — Playwright captures of 8 current routes × 2 viewports paired with the 12 handoff PNGs.
**Lead:** build-ux

This is the **evidence layer**. No verdicts — just observed differences along each dimension. Verdicts live in [`02-decisions.md`](./02-decisions.md).

For each dimension: **Current (what AKBai ships today) | Handoff (what the redesign proposes) | Strengths of each | Risks of each.**

---

## 1. Foundations

### 1.1 Color palette

- **Current:** Cream `#fdf9f2` background, MD3 6-level surface scale (`--surface-low`, `--surface-container`, `--surface-container-high`, etc.), amber accents at 8% opacity for ambient shadow. Light theme default with dark-mode parity. Visible in Home / Expenses / Deadlines / Costing / Invoices captures.
- **Handoff:** Honey-cream `#fef4dd` background, honey-deep `#a1620e` ink/CTA, sage tertiaries, capiz-shell pattern at 0.18 opacity overlay. 3-level surface hierarchy (bg / surface / surface-low). Visible across all handoff PNGs except 04-home-dawn-fil (alternate "dawn" palette).
- **Strengths — current:** MD3 6-level scale gives precise contrast between chat-bubble / card / nav-bar / overlay. Verified WCAG AA on every pairing. Light/dark mode orthogonal. Works on every surface type AKBai ships.
- **Strengths — handoff:** Warmer first-impression. Honey palette signals "Filipino home" rather than "fintech". Aesthetic-Usability effect — perceived competence ↑.
- **Risks — current:** Ships polished but reads as "another business app." Doesn't deliver the visceral warmth Phase 1 Don Norman analysis prescribes.
- **Risks — handoff:** 3-level scale insufficient for chat vs card vs nav contrast. Some honey-deep × cream pairings (e.g., 18px body on `#fef4dd`) need contrast verification — not pre-tested in handoff.

### 1.2 Typography

- **Current:** Plus Jakarta Sans only (weights 400/600/700/800), `--font-sans`, used for everything from tiny chip labels to greetings.
- **Handoff:** Plus Jakarta Sans body + Fraunces serif display (weights 500/600). Greetings, narrative paragraphs (Linggong Kuwento), KPI labels, occasional italic emphasis ("ang nakaraang linggo") use Fraunces.
- **Strengths — current:** One font = smaller bundle, simpler CSS, faster LCP.
- **Strengths — handoff:** Two-font system creates visual rhythm. Serif italic on the greeting ("Andoy, kumusta ka?") immediately reads as warm + personal — sans-only can't replicate that.
- **Risks — current:** "Brand voice is conversational Filipino" but the type system doesn't reinforce it.
- **Risks — handoff:** Fraunces adds ~30KB even subset to Latin. Must verify against the 500KB page-weight budget.

### 1.3 Surface hierarchy

- **Current:** MD3 elevation tokens (`--surface`, `--surface-low`, `--surface-container`, `--surface-container-low`, `--surface-container-high`, `--surface-container-highest`). Each ships with light/dark variant.
- **Handoff:** Three contexts (bg / surface / surface-low). Tilt + asymmetric corners + tape strip do the lifting that elevation tokens do in current.
- **Strengths — current:** Precision. Card vs nav vs modal vs overlay all have distinct surface tokens.
- **Strengths — handoff:** Less abstract. Each surface has a job, not a name.
- **Risks — handoff:** Loses the layering precision. Chat bubble vs card on the same surface can blur visually.

### 1.4 Shadows / depth

- **Current:** Amber ambient shadow at 8% opacity, 40px blur on elevated cards. No grey shadows.
- **Handoff:** Layered paper-note shadows — soft offset (0 2px 4px) + secondary spread (0 8px 16px). Tilt creates implied depth.
- **Strengths — current:** Subtle, never feels heavy.
- **Strengths — handoff:** Tactile — paper-on-table feel. The asymmetric shadow + `rotate(-1.2deg)` makes the daily check-in note read as a physical taped index card.

### 1.5 Motion

- **Current:** Existing `slide-up` (translateY 8px → 0, 400ms cubic-bezier), landing `fade-in`/`float`. All gated on `prefers-reduced-motion`.
- **Handoff:** `kai-bob` (3s ease-in-out infinite, ±3px translateY on the Kai mark), `petal-drift` (14–22s linear, randomized delay, translateY-20 → 100vh + rotate 0–360), `squish` (120ms cubic-bezier scale 1 → 0.96 → 1 on tile press), refined `slide-up` (cubic-bezier(0.16, 1, 0.3, 1)).
- **Strengths — current:** Minimal, performant, no perceived load impact.
- **Strengths — handoff:** Visceral warmth — Kai bobs gently on the home hero, petals drift in the background. Pre-cognitive Don Norman layer that current entirely lacks.
- **Risks — handoff:** `petal-drift` needs strict frame budgeting on Snapdragon 4xx. `transform` + `opacity` only; no layout-impacting properties. Reduced-motion gating must be airtight or it'll burn battery on background tabs.

### 1.6 Iconography

- **Current:** `lucide-react` line icons throughout (utility + brand-load-bearing roles). Tree-shaken bundle.
- **Handoff:** ~7 custom hand-drawn warm SVGs for brand roles (`IconResibo`, `IconUsap`, `IconKalendaryo`, `IconPrecio`, `IconInvoice`, `IconPera`, `IconSampaguita`). `lucide-react` retained for utility (close, chevron, settings).
- **Strengths — current:** Universal recognition. lucide is well-tested across all icon families.
- **Strengths — handoff:** The 7 brand-role icons feel hand-drawn — extension of the warm-paper aesthetic. Differentiates AKBai from generic business apps.
- **Risks — handoff:** Custom icon family must be maintained as the icon set grows. lucide gives us hundreds of utility icons for free; custom gives us 7.

### 1.7 Border treatment

- **Current:** "No-Line Rule" — color-shift only, no hairline borders on cards. Pills/chips use rounded full-width fills.
- **Handoff:** Hairline `--outline` borders + asymmetric `4px 12px 4px 12px` corner radius + `rotate(-1.2deg)` tilt on the **paper-note primitive**. Standard cards still no-line.
- **Strengths — current:** Clean, modern, reads as designed.
- **Strengths — handoff:** The asymmetric paper-note evokes a real taped index card on a fridge — a design-research metaphor explicitly tied to Filipino home-business note-taking habits.

---

## 2. Chrome & Navigation

### 2.1 Sidebar (≥ desktop breakpoint)

- **Current:** 5 items (Home / Chat / Scan / Pera / More), MD3 pill active state, 768px breakpoint, no persona pill, no language toggle.
- **Handoff:** AKBai wordmark + Kai sitting mark at top, persona pill (business name + tagline), 5 nav items, honey-gradient active pill, language toggle (FIL/EN) at bottom, 860px breakpoint.
- **Strengths — current:** Already shipped, well-tested across viewports.
- **Strengths — handoff:** Brand affordance (Kai mark in chrome reinforces the persona). Persona pill makes the single-user app feel personal. Language toggle is a key Filipino MSME UX requirement.

### 2.2 Bottom nav (< desktop breakpoint)

- **Current:** 5 tabs (Home / Chat / Scan / Pera / More). 56px height + safe-area-inset-bottom. Glassmorphism (80% opacity + 20px backdrop-blur, amber ambient shadow).
- **Handoff:** 4 tabs (Umaga / Kai / Pera / Iba pa) — Scan moved to a home tile + FAB.
- **Strengths — current:** 5 tabs gives Scan the prominence it deserves (highest-traffic capture action). Existing glass blur preserved.
- **Strengths — handoff:** 4 tabs reduces cognitive load (Hick's Law). Bigger tap targets per tab.
- **Risks — handoff:** Removing Scan from the persistent nav means an extra tap from any non-Home screen — this could meaningfully reduce capture frequency. Worth A/B testing post-launch.

### 2.3 Persona / tone affordance

- **Current:** No persona pill in chrome. Persona context is server-side only.
- **Handoff:** Persona pill in sidebar shows business name + tagline, taps to profile.
- **Strengths — handoff:** Makes the single-user app feel like *this user's* app, not a generic dashboard.

### 2.4 Language toggle (FIL / EN)

- **Current:** Not implemented. App ships FIL only.
- **Handoff:** FIL/EN pills in sidebar bottom + compact mobile affordance.
- **Strengths — handoff:** Phase 12 retention can split by locale to validate the FIL/EN investment. Removing it leaves a dimension we can't measure.

---

## 3. Per-Screen

### 3.1 Home (`/dashboard` ↔ handoff Umaga Mo)

- **Current:** Server-time greeting, dashboard cards (4-card grid: Quick Chat, Calendar, Scan, Pera), check-in section (CTA or summary), morning briefing card. Cream background.
- **Handoff:** Full kumustahan hero (`<KaiSitting>` 168×168 + Fraunces serif name with squiggle + serif greeting + `<Squiggle>` underline). 5 illustrated tiles (Resibo / Usap / Kalendaryo / Precio / Pera). Permanent paper-note check-in invite with streak counter. `<WovenDivider>` separator. Weekly story card (KPI grid + banig 7-day chart + Kai takeaway paper-note). Closing serif italic "— Kai." Honey-cream background, ambient `<CapizPattern>` + `<FloatingPetals>`.
- **Strengths — current:** Dashboard cards are functional and well-tested. Check-in modal pattern works for current users. Morning briefing card has an established API contract.
- **Strengths — handoff:** Dramatically warmer first impression. Streak counter is visible without an extra tap. Weekly story integrated into home reduces the "where do I look for my numbers" question. Filipino motifs make it feel like a partner not a form.

### 3.2 Chat / Kausap (`/chat`)

- **Current:** Top bar, message thread, composer with send button. Branded "Chat with Kai" experience. Existing Kai illustration in bubbles/header.
- **Handoff:** Top bar with Kai avatar (32px, animated) + "● Nandito ako para sa'yo". Honey-deep filled (user) / cream-tinted (Kai) bubbles. Suggested-question chips above composer (4 chips, scrollable horizontally). Paper-note CTA composer. Disclaimer banner restyled.
- **Strengths — current:** Chat with Kai branding + existing Kai illustration are core to the persona — losing them would weaken brand identity. Composer is reliable.
- **Strengths — handoff:** Suggested-question chips lower the cold-start barrier (Filipino MSMEs new to AI assistants don't know what to ask). "● Nandito ako para sa'yo" status is a warmth-loaded micro-moment current lacks.

### 3.3 Saan napunta / Expenses (`/expenses`)

- **Current:** Time-range pills, expense list, basic chart. Functional, MD3-clean, but reads as a budgeting form.
- **Handoff:** Time-range pills (Linggo / Buwan / Buong Taon). Total card with new donut + delta line. Category breakdown rows with color-coded progress bars. Kai callout paper-note with insight question. 7-day daily bars, banig-textured. Peak-day sampaguita marker.
- **Strengths — current:** Month picker logic is solid; categories work.
- **Strengths — handoff:** Far more legible at a glance — the donut + progress bars communicate "where my money went" in <2s. Banig texture on the 7-day chart is a Filipino-grounded visual that reads as warm rather than clinical. Kai callout question turns the screen from passive report to active reflection.

### 3.4 Resibo Scanner (`/scan`)

- **Current:** Custom camera UI with viewfinder, capture button (60×60px honey gradient), pre-permission screen, batch-scan flow. Already polished.
- **Handoff:** Full-bleed dark UI (`#1a1410` background, status bar dimmed). Honey-deep corner brackets framing center 70%. 3-phase state machine (aim → scanning → result). 80px shutter, white inner ring. "Cancel" / "🖼 Album" labels.
- **Strengths — current:** Already shipped, working, well-loved. Pre-permission screen has a tested grant-rate. Batch flow is smooth.
- **Strengths — handoff:** Dark scan UI is a familiar mobile-camera convention — feels like a real camera app rather than a web overlay.

### 3.5 BIR Deadlines (`/deadlines`)

- **Current:** Deadline list with days-left counters, status grouping. Good information density, less polished visually.
- **Handoff:** Serif H1 "Hindi ka mahuhuli kay Kai." Kai pre-deadline paper-note callout for urgent items (≤ 7 days). Each row: 56×56 date chip (NOB / 25), form-code pill (1701Q), days-left counter, form name, description. Next-due card highlighted with 2px honey-deep border. BIR disclaimer banner restyled.
- **Strengths — current:** All deadlines and status are functional.
- **Strengths — handoff:** Form-code prominence (1701Q / 2551Q) is what users actually search for. The serif headline + Kai callout converts BIR-anxiety into companionship — a load-bearing moment for Filipino MSME retention.

### 3.6 Tamang Presyo / Costing (`/costing`)

- **Current:** Functional costing form with markup calculation. Shipped illustration on empty/intro state — meaningful brand moment.
- **Handoff:** Inputs card (produkto / kapalit / markup slider). Recommended price card with 56px serif amount + "Kita bawat isa" caption. Kai competitor paper-note callout.
- **Strengths — current:** Empty-state illustration is established brand vocabulary; should be preserved.
- **Strengths — handoff:** Slider treatment + serif amount + "Kita bawat isa" framing turn pricing from a calculation into a coaching moment. Kai competitor callout positions Kai as advisor, not just calculator.

### 3.7 Mga Invoice (`/invoices`)

- **Current:** Invoice list with status grouping, basic chrome. Shipped illustration on empty state.
- **Handoff:** Two summary tiles (Hinihintay / Late na). List rows with status pill variants. Header serif H1 "Sinong may utang pa sa'yo?"
- **Strengths — current:** Empty-state illustration is brand-consistent.
- **Strengths — handoff:** "Sinong may utang pa sa'yo?" headline is the question MSMEs actually ask themselves — directly addresses the Phase 1.5 Q3 finding (uncollected utang due to embarrassment).

### 3.8 Profile (`/profile`)

- **Current:** Functional profile screen with persona/business-type, tier, settings. Adequate density.
- **Handoff:** Not specifically redesigned in the prototype — handoff focuses on home/chat/expenses/scan/deadlines/costing/invoices/check-in/Kuwento.
- **Strengths — current:** Already shipped, content density appropriate. Personally-meaningful page (Persona pill in sidebar links here).

### 3.9 Daily Check-in (currently a modal on `/dashboard`)

- **Current:** Modal triggered from home check-in section. Mood + simple submit. Lightweight, in-place.
- **Handoff:** Full-screen `/checkin` route with paper-note wrapper, mood tiles + energy slider (5 emoji ticks 😴😪😐😊⚡) + freeform note textarea + "Sabihin kay Kai" CTA.
- **Strengths — current:** Modal preserves home context; user doesn't lose their place. Lower friction (60-second commitment).
- **Strengths — handoff:** More expressive (energy + note = better data for Linggong Kuwento narrative). Paper-note wrapper visually anchors as ritual.

### 3.10 Linggong Kuwento (Sunday Story)

- **Current:** Not implemented (new in Phase 10).
- **Handoff:** New `/kuwento` route. Inverted dark palette (`#1a1410` bg). Serif H1 narrative + 4 paragraphs with inline honey-deep highlights. 2×2 KPI grid (pinaka-mabentang araw, resibo na-scan, na-save sa oras, araw na may tubo). Honey-deep "I-share sa family" CTA. Closing "— Kai" centered serif italic.
- **Strengths — handoff:** This IS the bet — peak-end weekly ritual, family-share viral surface, inverted palette signals that this is different from everyday data entry. No current to compare against.

---

## 4. Voice & Copy

### 4.1 Filipino voice register

- **Current:** Documented in `conversational-filipino-copy-guide.md` + `conversational-filipino-manual.md` (canonical voice docs, recently extended in Phase 1.5 with §11 regional-language rule). Anti-patterns + do/don't tables exhaustive.
- **Handoff:** FIL strings for hero greeting, weekly story narrative, Kai callouts, CTAs, error states.
- **Strengths — current:** Authoritative — the manual overrides any conflicting copy in handoff.
- **Strengths — handoff:** Fresh examples ("Andoy, kumusta ka?", "katumbas ng buwanang tuition ni Junior", "ginalingan mo pa rin", "I-share sa family") that exemplify the manual's rules well.

### 4.2 Empty / error states

- **Current:** "Wala ka pang gastos. I-try mo ang Resibo Scanner?" pattern (action-oriented, never blame). "Hindi ko ma-scan, boss…" Trust Recovery Pattern. Canonical.
- **Handoff:** Defaults less polished; sometimes English-leaning.

---

## 5. Interaction patterns

### 5.1 Forms

- **Current:** `useRef` + `onClick` due to React 19 controlled-input bug (CLAUDE.md project rule). Required.
- **Handoff:** Implicit-controlled.

### 5.2 Card swipe

- **Current:** 40% threshold for archive/complete. Spring-back if not crossed. Confirmation on destructive swipes. Already-learned interaction.
- **Handoff:** None.

### 5.3 Long-press menus / pull-to-refresh

- **Current:** Implemented across multiple screens.
- **Handoff:** None.

---

## 6. A11y / Performance

### 6.1 Touch targets

- **Current:** 44×44px minimum, WCAG AAA. Project rule.
- **Handoff:** Implicit but smaller in places (some inline FAB-like CTAs).

### 6.2 Reduced-motion

- **Current:** Respects `prefers-reduced-motion` on `slide-up`, `fade-in`.
- **Handoff:** Silent — no explicit `kai-bob` / `petal-drift` gating documented.

### 6.3 Contrast

- **Current:** MD3 surface set verified WCAG AA across light/dark.
- **Handoff:** `honey-deep` (`#a1620e`) on `honey-cream` (`#fef4dd`) — needs verification at 14px (Fraunces italic). Other pairings need pre-build verification.

### 6.4 Bundle / network

- **Current:** Lucide tree-shaken, Plus Jakarta Sans subset Latin. Mobile-first budget verified shipped.
- **Handoff:** +Fraunces (~30KB), +decorative SVGs (inline, low single-digit KB), +banig chart (Recharts custom Bar shape — already installed).

---

**Cross-reference:** Decisions per dimension in [`02-decisions.md`](./02-decisions.md). Per-screen synthesized specs in [`screens/`](./screens/) (Phase 2.4). Component-level reuse map in [`04-reuse-audit.md`](./04-reuse-audit.md) (Phase 2.5).
