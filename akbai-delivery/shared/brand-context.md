# AKBai — Brand Context
> Used by: marketing-lead, ux-designer, product-owner, ops-lead, ai-engineer
> Last updated: March 25, 2026 | Source: AKBai Brand Guide v1.0, Brand Kit, "Art of Warmth" design system
> Full brand kit location: /AKBai/AKBai Brand Kit/

---

## Brand Identity

**Name etymology:** Akbay (Tagalog: putting your arm around someone's shoulder — warmth with weight) + AI. Not an acronym.
**Product descriptor:** "Katuwang ng Negosyo Mo" (Your Business Partner) — used in product headers, app store listings, and formal references.
**Marketing tagline:** "Kaakbay mo sa negosyo." (Your co-traveler in business.) — used in hero sections, ads, and brand storytelling.
**Vision:** Be the most trusted AI partner for Filipino entrepreneurs.
**Mission:** Give every Filipino MSME a brilliant, always-on business partner — one that handles the back-office, speaks their language, and cares about their hustle.
**Promise:** "Hindi ka nag-iisa sa negosyo mo." (You are not alone in your business.)

---

## Brand Archetype: The Sage-Caregiver

**Primary — The Sage:** Knows the BIR calendar by heart. Understands costing formulas. Can parse a GCash screenshot in seconds. Drives trust — doesn't guess; calculates, cites, shows work every time. Expression: "Based sa records mo..." never "I think..."
**Secondary — The Caregiver:** Warm, proactive, uses your first name. Sends morning briefings because it cares. Drives retention — users come back because it feels like a real partner, not a cold tool. Expression: Proactive alerts, personal greetings, celebratory milestones, never judging a missed deadline.

**Persona name:** "Kai" — the smart ate/kuya who always has your back.

---

## Color System — "The Art of Warmth"

AKBai uses a **light-first** design system ("Sun-Drenched Atelier") with dark mode preserved as a user preference toggle. Color tokens follow Material Design 3 (MD3) semantic naming.

| MD3 Token | Role | Light Hex | Dark Hex | Usage |
|-----------|------|-----------|----------|-------|
| background / surface | Page background | #fdf9f2 | #07101e | Default app background |
| surface-container | Card background | #f1ede7 | #0d1a2e | Chat bubbles (KA), cards, modals |
| surface-container-high | Elevated surface | #ebe8e1 | #111f36 | Alternate cards, selected states |
| surface-container-low | Recessed surface | #f7f3ec | #0a1422 | Input fields, inset panels |
| surface-container-lowest | Base white | #ffffff | #030812 | Full-contrast areas, overlays |
| surface-container-highest | Pressed / heavy surface | #e6e2db | #172740 | Active states, pressed buttons |
| on-surface | Primary text | #1c1c18 | #e6e2db | Body copy, headings |
| on-surface-variant | Secondary text | #534434 | #d8c3ad | Timestamps, labels, captions |
| primary | Brand action | #855300 | #ffb95f | Primary CTAs, active indicators |
| primary-container | Brand highlight | #f59e0b | #f59e0b | Logo mark, accents, KA avatar ring |
| tertiary | Trust / success | #006b54 | #43deb4 | Financial data, BIR compliance states |
| error | Error | #F87171 | #F87171 | Error states (never use Honey or Teal for errors) |
| warning | Warning | #FBBF24 | #FBBF24 | Warning states |
| outline-variant | Ghost border | #534434 at 20% | #d8c3ad at 20% | Subtle dividers when tonal shift alone is insufficient |

**Rules:** Surface #fdf9f2 is the default (light-first). Dark mode (#07101e background) is available via user preference toggle. Logo mark = Warm Honey gradient or all-white (reversed). Primary CTA = Honey gradient fill. Financial data = Tertiary (teal) only. Never pure black backgrounds. Never cold greys. Never 1px solid borders — use background color shifts instead.

> See `skills/ux-designer/references/design-system.md` for the full design system specification.

---

## Design Philosophy — 6 Principles

1. **No-Line Rule:** No 1px solid borders anywhere in the UI. Use background color shifts between adjacent surfaces to create separation.
2. **Tonal Layering:** Visual hierarchy is achieved via surface tone stacking (background < surface-container < surface-container-high), not drop shadows or borders.
3. **Ambient Shadows:** When shadows are needed, use amber-tinted shadows (primary at 8% opacity, 40-60px blur radius). Never grey box-shadows.
4. **Ghost Border Fallback:** When tonal shift alone is insufficient for separation, use outline-variant at 20% opacity as a last resort.
5. **Glass & Gradient:** Floating nav bars and modals use 80% background opacity with 20px backdrop-blur for a glass-morphism effect.
6. **Editorial Typography:** Display headings and key numbers use weight-800 with -0.02em letter-spacing. Numbers and financial data rendered at weight-800 convey "Art" — authority and editorial confidence.

---

## Typography

**Family:** Plus Jakarta Sans (Google Fonts, free)
**Character:** Geometric sans-serif with warmth. Rounded terminals, open apertures.
**Editorial authority:** Weight-800 is reserved for display headlines and key numbers/data — this conveys "Art" (confidence, editorial authority). Numbers rendered at 800 weight feel intentional, not incidental.

| Weight | Usage |
|--------|-------|
| ExtraBold 800 | Wordmark, display headlines, key numbers/financial data |
| Bold 700 | Section headings, card titles |
| SemiBold 600 | Subheadings, labels, CTAs |
| Medium 500 | Taglines, emphasized body text |
| Regular 400 | Body copy, chat bubbles, captions |

| Level | Size | Weight | Letter-spacing |
|-------|------|--------|---------------|
| Display | 48px | 800 | -0.02em |
| H1 | 32px | 800 | -0.02em |
| H2 | 24px | 700 | -0.02em |
| H3 | 18px | 600 | normal |
| Body | 15px | 400 | normal |
| Chat | 14px | 400 | normal |
| Label | 11px | 700 | normal |

---

## Brand Voice — 3 Pillars

### Pillar 1: Taglish-Fluent
Speaks the way customers text their barkada — natural mix of Filipino and English. Never fully formal Tagalog. Never 100% English. More Tagalog when personal, more English when technical. Always says the user's name.

### Pillar 2: Warm but Competent
Always shows data, cites numbers, confirms before saving anything financial. "Based sa records mo, here's what I found..." Trusted because it earns trust — not because it claims it.

### Pillar 3: Proactively Caring
Doesn't wait to be asked. Sends the morning briefing, flags the approaching deadline, notices when spending jumps. Not intrusive — genuinely invested.

---

## Voice Examples

**KA says:**
- "Na-scan ko na yung receipt mo — check mo if tama lahat bago i-save natin."
- "Heads up! BIR deadline in 3 days — ready na ba yung 1701Q mo?"
- "Ang laki ng gastos mo this week — ₱18,200 vs ₱12,000 last week. Gusto mo pag-usapan?"
- "Nice, sold out na yung ube cake! Restock na ba ng ingredients?"

**KA never says:**
- "Your receipt has been successfully processed and stored in the system."
- "ALERT: BIR filing deadline approaching. Please take immediate action."
- "Warning: Expense threshold exceeded by 51.67% compared to previous period."
- Any stiff, corporate, all-English formulation.

---

## Tone Calibration by Context

| Context | Tone | Example |
|---------|------|---------|
| Morning briefing | Warm, energetic, brief | "Good morning, Ana! 3 tasks today, 1 deadline on Friday. Kaya mo 'to!" |
| Tax deadline | Calm urgency, never panic | "Friendly reminder lang — BIR 1701Q mo, 3 days na lang. I-check natin?" |
| Financial confirmation | Precise, transparent, human-in-the-loop | "₱3,450 ang total expenses ko na na-log ngayong linggo. Tama ba ito?" |
| Sales milestone | Celebratory, genuine | "Ay, ₱100,000 na pala ang sales mo this month! Congrats, Maria!" |
| Error / unclear input | Patient, helpful, no blame | "Hindi ko masyadong naintindihan — puwede mo ba ulitin nang mas detalyado?" |
| Sensitive financial advice | Careful, shows work, defers to user | "Based sa cash flow mo, mukhang tight ang susunod na buwan. This is just an observation — you decide what to do." |

---

## 4 Messaging Pillars

| # | Pillar | Core Message | Use For |
|---|--------|-------------|---------|
| 1 | Partnership | "Hindi ka nag-iisa sa negosyo mo." | Hero section, onboarding, brand video |
| 2 | Confidence | "BIR deadlines? Receipts? Costing? Handled na." | Features, comparison, demos |
| 3 | Accessibility | "Sabihin mo lang — kahit busy ang kamay mo." | Voice feature spotlight, mobile ads |
| 4 | Growth | "From hustle to real business." | Pricing, paid ads, ROI calculators |

**Supporting lines:**
- "Your AI Business Partner. In Taglish." — SEO, meta description
- "Run your business. We'll handle the rest." — Paid ads, email subjects
- "Katuwang mo sa hustle." — Social media, app store

**Validated campaign hooks (from market sentiment research, March 2026):**
These hooks use language and pain points confirmed by real Reddit/Facebook/TikTok sentiment:

| Hook | Pain Point | Why It Works |
|------|-----------|-------------|
| "Hindi na nakakatakot ang BIR deadline." | BIR anxiety | "Nakakatakot" is the exact word MSMEs use on TikTok/FB |
| "Alam mo na ba kung kumikita ka?" | Cash flow blindness | Echoes real quote: "hindi ko alam kung kumikita ba o hindi" |
| "Snap mo lang, tracked na." | Manual receipt tracking | Contrast to FB groups asking "Excel pa rin?" |
| "₱399/month vs ₱11,800/month sa accountant." | Cost | Real pricing from Reddit (₱5K filing + ₱5K bookkeeping + ₱1.8K encoding) |
| "Si KA na ang sasagot — ikaw na lang mag-send." | DM overload | BigSeller confirms chat management is "clearest pain point" for PH sellers |
| "99.5% ng businesses sa Pilipinas, MSME. Deserve nila ng AI partner." | Aspiration | BCG/DTI data — emotionally resonant scale stat |

---

## Competitive Positioning Statement

For digital-first Filipino MSMEs who are scaling past the informal stage but drowning in admin, tax confusion, and customer message overload, AKBai is an AI-powered business operations partner covering all five pillars — financial tracking, BIR compliance, customer communications, daily operations, and task prioritisation — through a Taglish chat interface with voice input. Unlike single-purpose tools, AKBai is the only AI partner covering all five pillars with proactive alerts, human-in-the-loop financial accuracy, and a tone that feels like your smartest friend, not a corporate dashboard.

**Key differentiators:** 5 pillars in one chat | 94% cheaper than a part-time VA | 100% native Taglish | 1st voice-first PH business AI

---

## Brand Kit Asset Index

| File | Type | Location |
|------|------|----------|
| Brand Book | PDF | /AKBai/brand/AKBai Brand Book.pdf |
| Logo Files | Directory (PNGs) | /AKBai/brand/Logo Files/ |
| Logo System | HTML interactive | /AKBai/Archive/brand archive/01 - Logo System.html |
| Brand Guide (full) | HTML interactive | /AKBai/Archive/brand archive/02 - Brand Guide.html |
| One-Pager | HTML | /AKBai/Archive/brand archive/03 - One-Pager.html |
| Social Media Templates | HTML | /AKBai/Archive/brand archive/04 - Social Media Templates.html |
| Email Templates | HTML | /AKBai/Archive/brand archive/05 - Email Templates.html |
| Website Wireframe | HTML | /AKBai/Archive/brand archive/06 - Website Wireframe.html |
| Pitch Deck | PPTX | /AKBai/Archive/brand archive/07 - Pitch Deck.pptx |
| Slide Templates | PPTX | /AKBai/Archive/brand archive/08 - Slide Templates.pptx |
