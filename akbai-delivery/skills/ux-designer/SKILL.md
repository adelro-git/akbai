---
name: ux-designer
description: >
  AKBai's UX design system — Chat + Card hybrid UI, Taglish copywriting, mobile-first PWA
  patterns, accessibility, and user flow design. MUST read before: designing screens or flows,
  writing KA chat bubble copy, creating empty states or error messages, specifying card layouts,
  designing onboarding, building wireframes, specifying touch targets or gestures, writing
  Taglish microcopy, designing offline behavior, or planning camera integration. Triggers:
  "UX", "wireframe", "copy", "Taglish copy", "user flow", "empty state", "error message",
  "design", "mobile design", "card layout", "chat bubble", "onboarding flow", "swipe",
  "touch target", "screen", "mockup", "navigation", "bottom nav", "accessibility", "WCAG",
  "offline UI", "loading state", "KA says", "microcopy", "CTA text", "button label".
  If the task involves what users see, tap, or read in AKBai's interface, use this skill.
---

# UX Designer — AKBai

You design every screen, flow, card, chat bubble, and interaction in AKBai. The product is a Chat + Card hybrid — not a traditional CRUD app with forms and tables. KA ("Katuwang") speaks in chat bubbles; structured data lives in Cards. Your job is to make the interface feel like texting a brilliant business partner who also hands you beautifully organized paperwork when you need it.

## Before Designing Anything

**1. Read the shared context.** These files at `/AKBai/akbai-delivery/shared/` are the ground truth:
- `project-context.md` — Feature list (§5), KA persona rules (§8), personas (§2), tier structure (§4)
- `brand-context.md` — Color system, typography scale, voice pillars, tone calibration, KA says/never says
- `tech-stack.md` — Frontend stack (Next.js 14, Tailwind, Shadcn/UI), file conventions, PWA setup
- `glossary.md` — Product terms (every feature has a Filipino name), Taglish vocabulary
- `gap-registry.md` — Design gates and pre-launch requirements

**2. Read the relevant reference file** from this skill's `references/` folder:
- `references/ux-flows.md` — 8 core UX flows from onboarding through reply drafting, with screen-by-screen specs
- `references/taglish-copy-guide.md` — KA voice rules, 10 do/don't examples, tone calibration by context, microcopy patterns
- `references/taglish-manual.md` — **The authoritative Taglish do's and don'ts manual.** Curated real-world examples of natural Taglish vs awkward/wrong Taglish. This is the single source of truth for how KA speaks — when it exists, it overrides any conflicting guidance in other files. If this file is missing or empty, fall back to `taglish-copy-guide.md` and the shared `brand-context.md`.
- `references/mobile-first.md` — PWA constraints, touch targets, card layout system, offline behavior, camera integration
- `references/screen-mockups.html` — **7 static HTML/Tailwind prototypes** (Chat, Login, Deadline Watcher, Saan Napunta Dashboard, Main Dashboard, Kilala Kita Steps 1 & 3). Visual source of truth for color system, layout patterns, component styling, and Taglish copy in context.
- `references/design-system.md` — **The authoritative design system specification.** Creative north star ("Sun-Drenched Atelier"), color token system, elevation rules (No-Line Rule, Tonal Layering, Ambient Shadows), component guidelines. This is the visual source of truth for how AKBai looks and feels.

Read the specific reference file that matches your task. If designing an onboarding screen, start with `ux-flows.md`. If writing error messages or any user-facing copy, **always** start with `taglish-manual.md` (falling back to `taglish-copy-guide.md` if the manual isn't ready yet). If specifying layout or interactions, start with `mobile-first.md`.

---

## The Chat + Card Hybrid UI

This is AKBai's defining design pattern. Understanding it deeply is the difference between building "another business app" and building something users genuinely want to open every morning.

### Why Chat + Card (Not Traditional CRUD)

Filipino MSMEs don't want dashboards. They want a partner they can talk to. Maria doesn't want to navigate to Settings > Expenses > Add New — she wants to snap a photo of a receipt and have KA say "Na-scan ko na — ₱3,450 sa ingredients. I-save ko ba?"

But pure chat is terrible for structured data. You can't scan a wall of text bubbles to find last week's expenses. That's where Cards come in — they're the structured, glanceable, actionable layer that chat alone can't provide.

### How Chat and Cards Work Together

**Chat bubbles** are KA's voice. They carry:
- Greetings and proactive updates ("Good morning, Maria! Eto ang update mo...")
- Questions and confirmations ("I-save ko ba 'to?")
- Explanations and context ("Medyo mataas ang gastos mo this week because...")
- Errors and recovery ("Hindi ko ma-scan ang resibo — puwede mo bang i-type manually?")

**Cards** are structured data containers. They carry:
- Financial data (Expense Card, Invoice Card, Costing Card)
- Summaries (Morning Briefing Card, Weekly Recap Card)
- Deadlines (BIR Deadline Card with countdown)
- Actionable items (with tap, swipe, and long-press gestures)

**The pattern in practice:** KA sends a chat bubble introducing context → a Card appears with the data → the user acts on the Card (tap to expand, swipe to dismiss, long-press for options) → KA confirms the action in a follow-up chat bubble.

### Card Anatomy

Every Card follows this structure:

```
┌─────────────────────────────────┐
│ [Icon] Card Title        [Tag]  │  ← Header: category icon + title + status tag
│                                 │
│  Primary data / amount          │  ← Body: the key information, large and scannable
│  Supporting detail line         │
│                                 │
│  [Action Button]  [Secondary]   │  ← Footer: primary CTA + secondary action
└─────────────────────────────────┘
```

- **Background**: surface-container (#f1ede7 light / #0d1a2e dark) or surface-container-high (#ebe8e1 light / #111f36 dark) on surface (#fdf9f2 light / #07101e dark)
- **Primary data**: Plus Jakarta Sans Bold 700, large enough to scan at arm's length
- **Financial amounts**: Always tertiary (#006b54 light / #43deb4 dark). Always ₱ + digits. Always formatted (₱18,400 not ₱18400)
- **Status tags**: Small pill badges — Teal for success/complete, primary-container (#f59e0b) for pending, Red (#F87171) for overdue/error
- **Touch targets**: Every interactive element is minimum 44×44px

### Card Types

| Card | Content | Primary Action | Swipe Action |
|------|---------|---------------|--------------|
| Expense Card | Amount, category, date, receipt thumbnail | Tap → expand details | Swipe left → delete (soft) |
| Morning Briefing | Yesterday's sales, today's tasks, BIR alerts | Tap section → drill down | — |
| Deadline Card | BIR form, due date, countdown, status | Tap → filing checklist | Swipe right → mark done |
| Invoice Card | Client, amount, status, date sent | Tap → full invoice | Swipe left → send reminder |
| Costing Card | Product, ingredients, cost, margin | Tap → edit ingredients | — |

### Card Interactions

- **Tap**: Primary action (expand, navigate, confirm)
- **Swipe left**: Destructive/secondary action (delete, archive). Always requires confirmation.
- **Swipe right**: Positive action (mark complete, approve). Immediate with undo toast.
- **Long-press**: Context menu (edit, share, flag as wrong). Haptic feedback on trigger.

---

## Taglish Copy — The Quick Rules

**Always check `references/taglish-manual.md` first** — it contains the curated do's and don'ts with real examples. If that file isn't available yet, use `references/taglish-copy-guide.md` as the fallback. Here are the rules you need for every design decision:

**Default language is Taglish.** Not English with Filipino sprinkled in — genuine Taglish the way Maria texts her barkada.

**"Po" usage**: Natural, not mechanical. Use on BIR topics, when delivering financial confirmations, and when KA is asking permission. Never use it on every sentence — that sounds like a government hotline.

**Max 2 lines per chat bubble.** If KA needs more, break into multiple bubbles or use a Card. Two lines keeps the conversational rhythm and prevents walls of text.

**Numbers in digits, always.** ₱18,400 — never "eighteen thousand." Never "PHP." Never "Php." The peso sign (₱) is always first.

**Empty states tell the user what to do.** An empty expense list doesn't say "No data" — it says "Wala ka pang naka-log na gastos. I-try mo yung Resibo Scanner?" KA is encouraging action, not reporting emptiness.

**Errors are warm and actionable.** "Hindi ko ma-scan ang resibo, boss. Puwede mo bang i-try ulit nang mas maliwanag?" — never "Error: OCR processing failed. Code 422."

### Copy Anti-Patterns — Things That Kill Trust

These mistakes come up repeatedly and each one pushes users away. The Taglish manual (`references/taglish-manual.md`) has the full list with examples, but here are the ones that matter most for UX decisions:

**Never mention BIR penalties or fines in KA's voice.** KA is a partner, not the BIR. Mentioning "₱1,500 penalty" or "you might get fined" makes KA feel like a threat. Instead, focus on the positive action: "I-file na natin bago mag-deadline?" KA motivates through encouragement, never fear.

**Never use chatbot-speak.** "I'd be happy to help!", "Certainly!", "Thank you for your query!", "As an AI..." — these instantly break the kababayan illusion. KA sounds like a text from a friend, not a support ticket.

**Never translate English idioms literally into Tagalog.** "Kunin ang bola at tumakbo" (take the ball and run) means nothing. Use Filipino expressions naturally: "Go na natin 'to!" or "Push na!"

**Never write formal Filipino.** "Maaari po ba ninyong i-verify ang inyong..." sounds like a government form. "I-check mo lang ito" sounds like a friend.

**Never front-load Filipino if the concept is clearer in English.** "Receipt" is clearer than "resibo" for some users — but "resibo" is what people actually say. Use what sounds natural in the Taglish mix, not what's technically correct in either language. When in doubt, check the manual.

---

## Mobile-First Design — The Quick Rules

The full spec lives in `references/mobile-first.md`. Here are the essentials:

**Touch targets: 44×44px minimum.** No exceptions. This is WCAG 2.1 AA and also just good sense for users tapping with one hand while holding a bag of ube ingredients with the other.

**Bottom navigation: 4 items max.** Home (Ang Umaga Mo), Chat (KA), Scan (Resibo), More. Thumb-reachable on phones up to 6.7". Fixed at viewport bottom, always visible.

**Card stack layout.** The main content area is a vertical scroll of Cards, interspersed with KA chat bubbles. Cards have 12px vertical gap. No horizontal scrolling for primary content.

**Thumb-zone optimization.** Primary actions (CTAs, nav items) live in the bottom 40% of the screen. Destructive actions and settings live in the top 20% or behind a deliberate gesture (long-press).

**Camera integration.** Resibo Scanner opens native camera in-app via `getUserMedia`. Viewfinder has receipt alignment guide. Flash toggle. Capture button centered bottom (60×60px, Honey gradient fill). Results appear as an Expense Card immediately below the camera view.

**Offline-first.** Morning Briefing caches via TanStack Query Persister. If the user opens AKBai with no connection, they still see yesterday's briefing with an "Offline — last updated [time]" banner. Queued mutations (expense edits, daily check-in) sync when connectivity returns with a "Synced ✓" toast.

---

## Accessibility Requirements

AKBai targets WCAG 2.1 AA compliance. This matters because the product serves users across a wide range of digital literacy, and accessibility is just good design.

### Color Contrast
- **Watch the orange-on-white combination.** Warm Honey (#F59E0B) on white (#FFFFFF) fails AA for normal text. Use Warm Honey Deep (#D97706) for text on light backgrounds, or flip to white text on Honey background for CTAs.
- **Teal on dark**: Teal Light (#20C9A0) on Card (#0d1a2e) passes AA for both normal and large text. Safe to use for financial amounts.
- **Error red on dark**: #F87171 on #0d1a2e passes AA. Safe for error states.
- All text on Ink (#07101e) must be at minimum #9CA3AF for body text (4.5:1 ratio).
- **Watch Honey on cream.** primary-container (#F59E0B) on surface (#fdf9f2) fails AA for normal text. Use primary (#855300) for text on light surfaces. White text on primary-container CTAs passes AA.
- **Tertiary on light**: tertiary (#006b54) on surface (#fdf9f2) passes AA for both normal and large text. Safe for financial amounts.
- **on-surface-variant**: #534434 on surface (#fdf9f2) passes AA. Safe for secondary text, labels, timestamps.

### Screen Reader Labels
- Every Card gets an `aria-label` describing its content: "Expense Card: ₱3,450, Ingredients, March 15"
- Swipe actions need `aria-description`: "Swipe left to delete, swipe right to mark complete"
- Financial amounts use `aria-label` with spelled-out values: aria-label="3,450 pesos"
- Status tags include state: aria-label="Status: overdue"
- Bottom nav items use `aria-current="page"` for the active tab

### Receipt Images
- Every scanned receipt gets alt text generated from the OCR output: "Receipt from Puregold, ₱3,450, March 15, 2026"
- If OCR fails, alt text is "Scanned receipt — details not yet extracted"

### Motion and Animation
- Card transitions respect `prefers-reduced-motion`. Swipe animations become instant state changes.
- Loading skeletons pulse gently (not aggressively) — 1s cycle, ease-in-out

---

## Design Deliverable Format

When you produce UX work, deliver it in one of these formats depending on what's asked:

**User flow**: Numbered steps with screen descriptions. Include decision points, error branches, and the KA chat bubble copy at each step. Reference `references/ux-flows.md` for the 8 core flows.

**Wireframe/mockup description**: ASCII art or structured text layout showing element placement, card structure, and copy. Include dimensions for touch targets and spacing.

**Copy deck**: All microcopy for a feature — chat bubbles, card titles, button labels, empty states, error messages, success confirmations, tooltips. Delivered as a table with context column. Reference `references/taglish-copy-guide.md` for voice rules.

**Interaction spec**: What happens on tap, swipe, long-press. Include animation behavior, state transitions, and accessibility labels. Reference `references/mobile-first.md` for constraints.

---

## Working With Other Skills

- **ai-engineer**: Owns KA's system prompt voice. If you write copy, the ai-engineer implements it in the prompt. Coordinate on tone — your copy guide defines what KA says; their prompt library defines how Claude generates it.
- **fullstack-engineer**: Builds your designs. Specify Tailwind classes when possible (they use Tailwind only, no CSS modules). Shadcn/UI components are the building blocks.
- **product-owner**: Owns feature scope and prioritization. Check with them before adding new card types or gestures that aren't in the roadmap.
- **solutions-architect**: Owns the data model. If your card design needs data that doesn't exist in the schema, flag it early.
