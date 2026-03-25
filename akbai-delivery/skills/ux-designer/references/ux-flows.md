# AKBai — Core UX Flows
> 8 flows from onboarding through reply drafting. Each flow is screen-by-screen with KA copy, card specs, decision points, and error branches.
> Last updated: March 2026 | Source: Roadmap v14, Ops Playbook v7

---

## Table of Contents

1. [Kilala Kita — Onboarding](#1-kilala-kita--onboarding)
2. [Ang Umaga Mo — Morning Briefing](#2-ang-umaga-mo--morning-briefing)
3. [Resibo Scanner — Receipt Capture](#3-resibo-scanner--receipt-capture)
4. [Saan Napunta — Expense Dashboard](#4-saan-napunta--expense-dashboard)
5. [Deadline Watcher — BIR Compliance](#5-deadline-watcher--bir-compliance)
6. [Daily Check-In — Evening Entry](#6-daily-check-in--evening-entry)
7. [Costing & Invoice Cards](#7-costing--invoice-cards)
8. [Reply Drafter — Customer Communication](#8-reply-drafter--customer-communication)

---

## 1. Kilala Kita — Onboarding

**Purpose**: 5-step hybrid onboarding. Sets business type, income range, primary pain, BIR consent, data bootstrap. Powers all KA personalization. No features are accessible until Kilala Kita is complete.

**Design philosophy**: This is the user's first encounter with KA. It must feel like a conversation, not a government form. KA asks one question at a time through chat bubbles, and the user answers by tapping cards or quick-reply chips — minimal typing.

### Step 1: Welcome + Name
**Screen**: Full-screen surface background (#fdf9f2 light / #07101e dark), AKBai logo centered top, KA chat bubble appears with typing animation.

**KA bubble**: "Kumusta! Ako si Kai, ang business partner mo. Ano ang pangalan mo?"

**Input**: Single text field, bottom of screen, auto-focused. Placeholder: "Pangalan mo..." Submit via keyboard return or Honey CTA button ("Tara!").

**After submit**: KA responds: "Nice to meet you, [Name]! Tara, kilalanin kita nang kaunti."

### Step 2: Business Type
**KA bubble**: "Anong klaseng negosyo mo, [Name]?"

**Input**: 4 tappable cards (not a dropdown):
- 🍰 Food / Baking
- 🛒 Online Selling (Shopee/Lazada)
- 🎨 Freelance / Creative
- 🏪 Retail / Sari-sari

Each card is 44px tall minimum. Tap highlights with Honey border. Single-select.

**After select**: KA confirms: "Ah, [type] — marami akong kakilala diyan! Next question..."

### Step 3: Monthly Income Range
**KA bubble**: "Mga magkano ang monthly income ng negosyo mo? Ballpark lang okay na."

**Input**: 4 tappable chips (horizontal scroll if needed):
- Below ₱50K
- ₱50K–₱150K
- ₱150K–₱500K
- Above ₱500K

**Design note**: Use range chips, not a text input. Nobody knows their exact income. The ranges map to BIR tax brackets and feature personalization.

### Step 4: Biggest Pain Point
**KA bubble**: "Saan ka pinaka-nahihirapan sa negosyo mo?"

**Input**: 4 tappable cards:
- 📱 Receipt tracking / expenses
- 📋 BIR deadlines / compliance
- 💬 Replying to customer messages
- 💰 Knowing if I'm actually earning

Single-select. This drives which feature KA highlights first in the Morning Briefing.

### Step 5: BIR Data Consent + Finish
**KA bubble**: "Last question — okay lang ba na i-track ko ang BIR deadlines mo? Kailangan ko ng basic info about your business type para ma-compute ang mga due dates."

**Input**: Two-button layout:
- Primary (Honey): "Sige, track mo" → enables Deadline Watcher
- Secondary (ghost): "Skip muna" → Deadline Watcher disabled, can enable later in settings

**Completion screen**: KA bubble: "All set, [Name]! Welcome sa AKBai. Check mo ang Morning Briefing mo — doon lahat ng important updates."

Transition: Smooth scroll down to the Dashboard (Ang Umaga Mo).

### Error Branches
- **Empty name**: KA says "Kailangan ko ng pangalan mo para ma-personalize ko ang experience mo." CTA stays disabled.
- **Back navigation**: Each step remembers previous answers. Back arrow in top-left returns to previous step without losing data.
- **Network error during save**: Profile queued for sync. KA says "Saved na sa phone mo — i-sync ko pag may internet." User proceeds to Dashboard.

---

## 2. Ang Umaga Mo — Morning Briefing

**Purpose**: KA's proactive daily summary. Shows yesterday's income, today's BIR deadlines, cash position, and task list. This is the home screen — the first thing users see when they open AKBai.

**Trigger**: Auto-generated daily at 6AM local time. Cached via TanStack Query Persister for offline access.

### Screen Layout

```
┌─ Status Bar ──────────────────────┐
│                                    │
│  KA Chat Bubble:                   │
│  "Magandang umaga, [Name]!         │
│   Eto ang update mo ngayon."       │
│                                    │
│  ┌─ Morning Briefing Card ───────┐ │
│  │ 📊 Ang Umaga Mo • Today       │ │
│  │                                │ │
│  │  Yesterday's Sales:  ₱12,300  │ │
│  │  Today's Expenses:   ₱4,200   │ │
│  │  Net Position:       ₱8,100   │ │
│  │                                │ │
│  │  🔴 BIR 2551Q due in 3 days   │ │
│  │  ✅ 2 receipts scanned         │ │
│  │                                │ │
│  │  [View Details]                │ │
│  └────────────────────────────────┘ │
│                                    │
│  ┌─ Task Card ───────────────────┐ │
│  │ Today's Tasks (2)              │ │
│  │ ○ Log yesterday's GCash income │ │
│  │ ○ Review scanned receipts      │ │
│  └────────────────────────────────┘ │
│                                    │
│  ┌─ Bottom Nav ──────────────────┐ │
│  │ 🏠 Home │ 💬 Chat │ 📷 Scan │ ⋯│ │
│  └────────────────────────────────┘ │
└────────────────────────────────────┘
```

### Sections (tap to expand/drill down)
- **Financial summary**: Yesterday's sales, expenses, net. Teal for positive net, Red for negative. Tap → Saan Napunta expense dashboard.
- **BIR alerts**: Upcoming deadlines sorted by urgency. Red badge for ≤3 days. Tap → Deadline Watcher detail.
- **Activity summary**: Receipts scanned, invoices sent, etc. Social proof that the user is "using the system."
- **Tasks**: Auto-generated based on missing data (e.g., "Log yesterday's GCash income" if no daily check-in recorded).

### Empty State (New User, Day 1)
**KA bubble**: "Ito ang magiging Morning Briefing mo — every morning, dito mo makikita ang status ng negosyo mo. Wala pa tayong data ngayon, so tara, mag-start tayo!"

**Card**: Single card with 3 suggested actions:
- 📷 "Scan your first receipt"
- ✏️ "Log today's sales"
- 📋 "Set up BIR deadlines"

### Offline Behavior
If no internet:
- Show cached briefing from last successful fetch
- Top banner: "Offline — last updated [time ago]" in muted text
- All cards are still tappable (cached data). New data entry is queued.

### Free Tier Teaser
Free tier users see an abbreviated Morning Briefing:
- Financial summary shows only total (not breakdown)
- BIR section shows next deadline only (not full calendar)
- Subtle CTA: "Gusto mo ng full breakdown? [Try Pro →]"

---

## 3. Resibo Scanner — Receipt Capture

**Purpose**: Camera → Claude Haiku Vision → structured Expense Card. The flagship feature that replaces notebook logging.

### Flow

**Step 1: Open Camera**
User taps 📷 Scan in bottom nav. Native camera opens within the app (no redirect to Camera app). Viewfinder shows:
- Semi-transparent receipt alignment guide (white dashed rectangle, 80% width)
- Flash toggle (top-right, 44×44px)
- Capture button (bottom-center, 60×60px, Honey gradient, circular)
- Cancel (X) top-left

**Step 2: Capture + Processing**
On capture:
- Camera freezes on captured image
- KA typing indicator appears below: "Bina-basa ko ang resibo mo..."
- Processing takes 2–4 seconds (Haiku Vision API)
- Progress indicator: pulsing Honey ring around the frozen image

**Step 3: Result — Expense Card**
KA bubble: "Na-scan ko na — check mo kung tama lahat."

```
┌─ Expense Card (Editable) ────────┐
│ 🧾 Expense • Just now      [Edit]│
│                                   │
│  Store:     Puregold              │
│  Amount:    ₱3,450                │
│  Category:  Ingredients           │
│  Date:      March 15, 2026        │
│                                   │
│  [📷 View Receipt]               │
│                                   │
│  [✓ Save]          [✗ Discard]   │
└───────────────────────────────────┘
```

- All fields are editable. Tap any field → inline edit with keyboard.
- Category is auto-suggested but user can change via dropdown.
- Receipt thumbnail is tappable → full-size image viewer.

**Step 4: Confirmation**
User taps "Save". KA bubble: "Saved! ₱3,450 na-log sa Ingredients ngayong March 15."

### Error Branches

**OCR uncertain (confidence < 80%)**:
KA bubble: "Medyo malabo yung resibo — ito ang na-read ko. Paki-check kung tama:"
Card shows with uncertain fields highlighted in Honey border + "?" icon. User must confirm or correct before saving.

**OCR failed completely**:
KA bubble: "Hindi ko ma-scan ang resibo, boss. Baka malabo o may nakatakip. Puwede mong i-try ulit o i-type manually?"
Two CTAs: "📷 Try ulit" | "✏️ Type manually"
Manual entry opens a simple form: Amount → Store → Category → Date.

**Camera permission denied**:
KA bubble: "Kailangan ko ng access sa camera mo para ma-scan ang receipts. Paki-enable sa Settings ng phone mo."
CTA: "Open Settings" (deep link to app settings).

**Scan limit reached (Pro/Business)**:
KA bubble: "Naubos na ang scans mo for this month (50/50). Mag-rerenew sa [date]. Sa ngayon, puwede ka mag-log manually."

---

## 4. Saan Napunta — Expense Dashboard

**Purpose**: Categorized spend view. Monthly trends, cash flow visibility, spend breakdown by category.

### Screen Layout
**KA bubble** (contextual, appears first time or on notable changes): "Eto ang breakdown ng gastos mo this month."

**Filter bar** (horizontal chips, top of content area): This Month | Last Month | Custom Range

**Category breakdown**: Horizontal stacked bar chart (Shadcn/UI chart). Categories color-coded with AKBai palette. Tap a category → filtered expense card list below.

**Expense card list**: Reverse-chronological stack of Expense Cards. Each card shows: amount (teal, bold), category icon, store name, date. Swipe left → soft delete with undo toast.

**Summary footer** (sticky above bottom nav):
```
Total Expenses: ₱24,800  |  vs Last Month: ↑12%
```

### Empty State
KA bubble: "Wala ka pang naka-log na gastos this month. I-try mo yung Resibo Scanner para automatic!"
Single CTA card: "📷 Scan your first receipt"

---

## 5. Deadline Watcher — BIR Compliance

**Purpose**: BIR compliance calendar personalized to business type. Push notification sequence: 7 days → 3 days → 1 day before deadline (Pro/Business).

### Screen Layout
**KA bubble** (contextual): "Eto ang mga BIR deadlines mo based sa [business type] registration mo."

**Upcoming deadlines**: Vertical stack of Deadline Cards, sorted by due date.

```
┌─ Deadline Card ──────────────────┐
│ 📋 BIR 1701Q          ⏰ 3 days │
│                                   │
│  Quarterly Income Tax Return      │
│  Due: March 20, 2026              │
│                                   │
│  [View Checklist]                 │
└───────────────────────────────────┘
```

- Countdown badge: Teal (>7 days), Honey (3–7 days), Red (≤3 days)
- Tap → Filing checklist (step-by-step, checkable)
- Swipe right → "Mark as Filed" (confirms with "Na-file mo na? ✓")

**BIR Disclaimer** (persistent, bottom of deadline list):
"Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo."

### Filing Checklist (Expanded)
KA bubble: "Eto ang checklist para sa [form name]. I-check mo habang ginagawa."

Checkable list:
- ☐ Prepare quarterly income summary
- ☐ Compute tax due (KA can estimate)
- ☐ Fill out BIR [form number]
- ☐ Pay via eFPS or accredited bank
- ☐ Keep confirmation number

### Notification Sequence (Pro/Business)
| Days Before | Notification | In-App |
|-------------|-------------|--------|
| 7 | Push: "Heads up — BIR [form] due in 1 week" | Deadline Card appears in Morning Briefing |
| 3 | Push: "3 days na lang, [Name]! BIR [form] — ready ka na ba?" | Card turns Honey |
| 1 | Push: "Bukas na ang deadline! I-file na natin today." | Card turns Red |
| 0 (missed) | — | Card shows "Overdue" Red badge. KA: "Lagpas na ang deadline — don't worry, i-file pa rin ASAP." |

### Free Tier
One reminder per filing only (not the full 7/3/1 sequence). KA bubble: "Isang reminder lang per deadline sa Free tier. Gusto mo ng full sequence? [Try Pro →]"

---

## 6. Daily Check-In — Evening Entry

**Purpose**: 60-second habit. Every evening (default 8PM), capture daily sales + expenses. Builds the data foundation for all financial features.

### Trigger
Push notification at 8PM: "Kumusta ang araw mo, [Name]? Quick check-in lang — 60 seconds."

### Flow
**Screen**: Modal overlay (slides up from bottom, 85% screen height). Dark background, single-step focus.

**KA bubble**: "Magkano ang benta mo today?"

**Input**: Large numeric keypad (custom, optimized for peso amounts). ₱ prefix auto-shown. Decimal point available but optional. "Done" button (Honey).

**Next**: "Magkano naman ang gastos?" Same numeric input.

**Confirmation card**:
```
┌─ Daily Summary ──────────────────┐
│ 📅 March 15, 2026                │
│                                   │
│  Sales:    ₱12,300               │
│  Expenses: ₱4,200                │
│  Net:      ₱8,100 ✓             │
│                                   │
│  [✓ Looks Good]    [✏️ Edit]     │
└───────────────────────────────────┘
```

**KA bubble after save**: "Nice! Na-log na. See you bukas, [Name]!"

### Skip / Missed Days
If user dismisses or misses check-in:
- Next morning, Morning Briefing shows: "Walang data kahapon — gusto mong i-fill in?"
- Weekly Reconciliation (Friday 9AM) surfaces all missing days for batch fill.

---

## 7. Costing & Invoice Cards

### Costing Card
**Purpose**: Ingredient costing and margin calculator for food sellers (Maria persona primary).

**Creation flow**: KA bubble: "Anong product ang gusto mong i-cost?" → User types product name → KA: "Isa-isahin natin ang ingredients."

**Ingredient entry**: Repeatable row: [Ingredient name] [Amount] [₱ Cost]. Add more rows with "+" button. Running total shown live.

**Result card**:
```
┌─ Costing Card ───────────────────┐
│ 🍰 Ube Cake                      │
│                                   │
│  Ingredients:  ₱850              │
│  Selling Price: ₱1,500           │
│  Margin:       ₱650 (43%)        │
│                                   │
│  [Edit Ingredients]  [Create Invoice]│
└───────────────────────────────────┘
```

### Invoice Card
**Creation**: From Costing Card "Create Invoice" or standalone via Chat ("KA, gumawa ka ng invoice for [client]").

**Fields**: Client name, items (auto-filled from Costing Card if linked), amounts, due date, notes.

**Card states**: Draft → Sent → Viewed → Paid → Overdue

**KA follow-ups**: If invoice is unpaid 3 days past due: "May unpaid invoice si [Client] — ₱1,500, 3 days overdue. Gusto mong mag-send ng follow-up?"

---

## 8. Reply Drafter — Customer Communication

**Purpose**: KA drafts customer DM replies. Phase 1 is manual copy-paste; Phase 2 integrates Meta Messenger API.

### Phase 1 Flow
**User**: Pastes customer message into chat: "Eto yung message ng customer ko: [message]"

**KA**: Analyzes message, drafts reply in appropriate tone.
KA bubble: "Eto ang draft ko — i-edit mo if may gusto kang baguhin:"

```
┌─ Reply Draft Card ───────────────┐
│ 💬 Draft Reply                    │
│                                   │
│  "Hi [Customer]! Yes po, available│
│   pa ang ube cake namin. ₱1,500  │
│   po ang price — puwede i-deliver │
│   bukas ng hapon. Order na po?"  │
│                                   │
│  [📋 Copy]  [✏️ Edit]  [🔄 Redraft]│
└───────────────────────────────────┘
```

**Actions**:
- Copy → copies text to clipboard. KA: "Copied! I-paste mo na lang sa messenger mo."
- Edit → inline text editing within the card
- Redraft → KA generates a new version with different tone

### Tone Options (on Redraft)
Chips: "Friendly" | "Professional" | "Urgent" | "Firm (overdue payment)"

### Context Awareness
KA uses business context for drafts:
- Product prices from Costing Cards
- Client history from Invoice Cards
- Business type from onboarding profile

If KA lacks context: "Hindi ko sure ang price — paki-confirm muna bago i-send: ₱___?"
