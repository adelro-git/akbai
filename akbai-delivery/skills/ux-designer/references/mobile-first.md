# AKBai — Mobile-First Design Reference
> PWA constraints, touch targets, card layout system, offline behavior, camera integration, and bottom navigation.
> Last updated: March 2026 | Source: Roadmap v14, Tech Stack, Operations Playbook v7

---

## Table of Contents

1. [PWA Constraints](#1-pwa-constraints)
2. [Touch Targets and Hit Areas](#2-touch-targets-and-hit-areas)
3. [Card Layout System](#3-card-layout-system)
4. [Bottom Navigation](#4-bottom-navigation)
5. [Thumb-Zone Optimization](#5-thumb-zone-optimization)
6. [Camera Integration — Resibo Scanner](#6-camera-integration--resibo-scanner)
7. [Offline-First Behavior](#7-offline-first-behavior)
8. [Loading States and Skeletons](#8-loading-states-and-skeletons)
9. [Responsive Breakpoints](#9-responsive-breakpoints)
10. [Performance Budget](#10-performance-budget)

---

## 1. PWA Constraints

AKBai is a Progressive Web App — not a native app. This has specific implications for UX design:

**What works well:**
- Home screen installation ("Add to Home Screen") — users experience it like a native app
- Offline caching via Service Worker (next-pwa) and TanStack Query Persister
- Camera access via `getUserMedia` (Resibo Scanner)
- Push notifications (via Web Push API, requires HTTPS)
- Full-screen mode (standalone display mode in manifest)

**What doesn't work / works differently:**
- No App Store presence — distribution is via direct link + "Add to Home Screen" prompt
- Push notification permission requires user opt-in (design the ask carefully — see §7)
- Background sync is limited compared to native — queued mutations sync on next foreground session
- No access to native contacts, SMS, or phone dialer
- File system access is limited — receipts are captured via camera, not file picker
- Haptic feedback (long-press context menu) depends on browser support — design must work without it

**Manifest essentials:**
```json
{
  "name": "AKBai — Katuwang ng Negosyo Mo",
  "short_name": "AKBai",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#fdf9f2",
  "background_color": "#fdf9f2"
}
```

### Filipino Connectivity & Device Baseline (design assumptions)
<!-- Phase 1 research, 2026-04-25. Sources: DataReportal "Digital 2025: Philippines"; BCG MSME report; community sources via NotebookLM (8ee05ad7). -->

Design and performance budgets assume the following baseline. Re-validate against AKBai's own PostHog data once it's flowing; until then, design for the lower end of the range.

| Dimension | Baseline assumption | Source / rationale |
|---|---|---|
| **Median mobile internet speed** | ~35 Mbps cellular download (Philippines, early 2025) | DataReportal Digital 2025 PH. Real-world MSME experience is much patchier — corpus describes inventory syncs taking *hours*, real-time payment failures. |
| **Connectivity reliability** | Patchy / drop-prone, especially rural | BCG + Rest of World sari-sari article. "Lack of stable internet" cited as a primary barrier to digital tools. Many micro-businesses operate offline-default. |
| **Device tier** | Mid-range Android (Snapdragon 4xx–6xx, Android 11–13) — design target. Sub-$100 Transsion (TECNO, Infinix) dominant in provincial. Many older sari-sari owners use **hand-me-down devices from their kids** — assume budget hardware. <!-- Phase 1.5 expansion, 2026-04-26 --> | Phase 1.5 NotebookLM Q4+Q5; community sources on intergenerational digital adoption (Jason Endaya / Packworks case). |
| **OS share** | Android-dominant in PH MSME segment | DataReportal (Android leads PH market share by wide margin). iOS-only patterns will exclude most users. |
| **Data behavior** | Sachet-economy + prepaid-cap-aware. Users stack short-lived promos (Globe Go+149, Smart PowerAll/Magic Data, DITO ₱10/day Data Sachets), carry **dual-SIM and switch networks** based on best promo/signal, and **defer cellular data**, relying on home/office Wi-Fi for heavy usage. <!-- Phase 1.5 expansion, 2026-04-26 --> | Phase 1.5 NotebookLM Q1; corpus on sachet economy + telco promo cycles. |
| **Peak-hour load** | Paydays (15th and 30th) flood DM channels and payment platforms. Mega campaigns (9.9, 11.11) drive 3–10× normal daily volume for platform-seller MSMEs. <!-- Phase 1.5 expansion, 2026-04-26 --> | Community sources + BCG. Implication: AKBai's morning-briefing and weekly-story endpoints should never degrade on those dates. |
| **Regional split (NCR vs provincial)** <!-- Phase 1.5 expansion, 2026-04-26 --> | NCR: 68.7% home internet, 79.3% individuals online, 6.1 hr/day online (highest in country). Provincial: BARMM 27.7% home internet; Cagayan Valley 3.4 hr/day online (lowest). Patchy rural internet — inventory syncs take hours, digital payments fail outright. | Phase 1.5 NotebookLM Q5; DataReportal regional breakdowns. |

**Design implications baked into the rest of this doc:**
- **Performance budget § 10**: First Contentful Paint < 1.5s on emulated Slow 3G + mid-range Android; LCP ≤ 2.5s; TTI < 3.5s. Inline decorative SVGs (no extra requests). Image budget ≤ 200KB on cold home load. Page weight < 500KB initial; JS < 200KB gzipped.
- **Offline-first behavior § 7**: Service Worker (`next-pwa`) + **TanStack Query + Persister** as the validated stack. Cache morning briefing daily / stale-while-revalidate. Heavy lists cached on first load + incrementally updated on foreground. Setup-level data (profile, BIR deadlines) cached indefinitely until version change. Offline mutations queue → auto-sync on next foreground connection → brief "Synced ✓" toast. Reassuring microcopy on no-connection states: *"Walang internet ngayon — na-save ko muna sa phone mo. I-sync ko pag may connection."* <!-- Phase 1.5 expansion, 2026-04-26: validated stack details from NotebookLM Q2 + Q1 corpus -->
- **Touch target sizing § 2**: Mid-range Android screens (5.5"–6.5") with imperfect touch accuracy — keep 44×44px minimum strict.

> **Open questions still unvalidated by the corpus:** explicit "image avoidance when data is exhausted" behavior, and PH-specific retail/sari-sari one-handed thumb-zone evidence (Phase 1.5 Q6 timed out twice — corpus lacks this). Validate via AKBai's own analytics post-launch (Phase 12). Until then, design conservatively to the lower end of the range.

---

## 2. Touch Targets and Hit Areas

**Minimum touch target: 44×44px.** This is WCAG 2.1 AA (Success Criterion 2.5.8) and a practical necessity for users tapping on small phone screens.

| Element | Minimum Size | Recommended Size | Notes |
|---------|-------------|-----------------|-------|
| Primary CTA button | 44×48px | 48×48px | Full-width on mobile when possible |
| Bottom nav item | 44×44px | 48×56px | Include icon + label within touch area |
| Card (tappable) | Full card width × 72px min | — | Entire card surface is the tap target |
| List item | Full width × 56px min | — | Enough room for thumb tap |
| Icon button | 44×44px | 48×48px | Visible icon can be smaller if touch area is padded |
| Quick-reply chip | 44×36px | — | Horizontal scrollable, 8px gap |
| Close/dismiss (X) | 44×44px | — | Even if icon is 24×24px, pad the touch area |

**Spacing between targets:**
- Minimum 8px gap between adjacent tappable elements
- On Card footers with multiple buttons: 12px gap minimum between buttons
- Bottom nav items: equal distribution across viewport width

**Common mistake to avoid:** Making the visual element match the touch target. An icon can be 24×24px visually — its touch area must still be 44×44px. Use padding, not visible size.

---

## 3. Card Layout System

Cards are the primary data container in AKBai. They sit in a vertical scroll alongside Kai's chat bubbles.

### Card Structure

```
┌─ Card ───────────────────────────────────────┐
│ padding: 16px                                 │
│                                               │
│  ┌─ Header ────────────────────────────────┐ │
│  │ [Icon 20px] Title (Bold 700)  [Tag/Badge]│ │
│  │ height: 24px                             │ │
│  └──────────────────────────────────────────┘ │
│  margin-bottom: 12px                          │
│                                               │
│  ┌─ Body ──────────────────────────────────┐ │
│  │ Primary data (varies by card type)       │ │
│  │ Financial amounts: Bold 700, Teal        │ │
│  │ Supporting text: Regular 400, #9CA3AF    │ │
│  └──────────────────────────────────────────┘ │
│  margin-bottom: 12px                          │
│                                               │
│  ┌─ Footer ────────────────────────────────┐ │
│  │ [Primary CTA]          [Secondary CTA]   │ │
│  │ min-height: 44px                         │ │
│  └──────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘
```

### Card Styling

| Property | Value | Tailwind Class |
|----------|-------|---------------|
| Background | surface-container (light: #f1ede7, dark: #0d1a2e) or surface-container-high (light: #ebe8e1, dark: #111f36) | `bg-surface-container` |
| Border radius | 12px | `rounded-xl` |
| Padding | 16px | `p-4` |
| Shadow | Amber ambient shadow (primary at 8% opacity, 40px blur) on elevated cards. No grey shadows. | — |
| Vertical gap between cards | 12px | `gap-3` or `space-y-3` |
| Max width | 100% of content area (minus 16px side padding) | `mx-4` |

### Card + Chat Bubble Interleaving

The main content area alternates between Kai chat bubbles and Cards:

```
[Kai bubble: "Good morning, Maria!"]
    12px gap
[Morning Briefing Card]
    12px gap
[Kai bubble: "May isang deadline this week."]
    12px gap
[Deadline Card]
    12px gap
[Kai bubble: "At eto ang gastos mo kahapon."]
    12px gap
[Expense Card]
[Expense Card]
[Expense Card]
```

Chat bubbles are left-aligned with a max-width of 85% of the content area. Cards are full-width (minus side padding).

### Swipe Gestures on Cards

- **Swipe threshold**: 40% of card width to trigger action
- **Visual feedback**: Card shifts with finger, reveals action color behind:
  - Swipe left: Red background (#F87171) + delete/archive icon
  - Swipe right: Teal background (#20C9A0) + check icon
- **Spring-back**: If swipe doesn't reach threshold, card springs back
- **Confirmation**: Destructive swipes (left) always show confirmation dialog. Positive swipes (right) execute immediately with undo toast (3 seconds).
- **Accessibility fallback**: For users who can't swipe (screen readers, motor difficulties), long-press opens a context menu with the same actions.

---

## 4. Bottom Navigation

Fixed at viewport bottom. 4 items maximum (Fitts's Law — fewer targets = faster navigation). Always visible, never scrolls away.

### Layout

```
┌─────────────────────────────────────────────┐
│  🏠 Home   │  💬 Chat   │  📷 Scan  │  ⋯ More │
│  (active)  │            │           │         │
└─────────────────────────────────────────────┘
```

### Specifications

| Property | Value |
|----------|-------|
| Height | 56px (plus safe area inset on notched phones) |
| Background | Glassmorphism — surface-container-lowest (#ffffff light / #030812 dark) at 80% opacity with 20px backdrop-blur, amber ambient shadow |
| Item layout | Icon (24px) above label (11px, SemiBold 600) |
| Active state | primary-container (#f59e0b) icon + label |
| Inactive state | on-surface-variant (#534434 light / #d8c3ad dark) |
| Touch area per item | Equal distribution, minimum 44×56px each |
| Safe area | `padding-bottom: env(safe-area-inset-bottom)` for iPhone notch |

### Tab Definitions

| Tab | Icon | Label | Destination |
|-----|------|-------|-------------|
| Home | 🏠 | Home | Morning Briefing (Ang Umaga Mo) |
| Chat | 💬 | Chat | Kai conversation thread |
| Scan | 📷 | Scan | Resibo Scanner camera |
| More | ⋯ | More | Settings, Saan Napunta, Deadline Watcher, Invoices, Costing |

**"Scan" tab behavior**: Tapping opens camera directly — no intermediate screen. The camera viewfinder appears immediately (assuming permission was previously granted). This keeps the scan flow under 3 seconds from tap to capture.

**"More" tab**: Opens a slide-up panel (not a new page) listing secondary features. This keeps the bottom nav to 4 items while providing access to everything.

---

## 5. Thumb-Zone Optimization

On phones held one-handed (which is most of the time for busy MSME owners), the thumb naturally reaches certain areas more easily than others.

### Zone Map (portrait, right-handed — mirror for left)

```
┌──────────────────────────┐
│       HARD TO REACH      │ ← Settings, profile, non-critical actions
│       (top 20%)          │
│                          │
│      REACHABLE           │ ← Content viewing, scrolling
│      (middle 40%)        │
│                          │
│      EASY / NATURAL      │ ← Primary CTAs, bottom nav, confirm buttons
│      (bottom 40%)        │
└──────────────────────────┘
```

### Design Rules

- **Primary CTAs**: Bottom 40% of screen. "Save", "Confirm", "Scan" buttons live here.
- **Bottom nav**: Fixed bottom — always in the easy zone.
- **Destructive actions**: Top 20% or behind deliberate gestures (long-press). Never put "Delete" in the thumb zone.
- **Sheet modals**: Slide up from bottom, content starts in the easy zone. Pull-down to dismiss.
- **Daily Check-In numeric keypad**: Custom bottom-anchored keypad. Large keys (minimum 48×48px). ₱ symbol auto-shown.

---

## 6. Camera Integration — Resibo Scanner

The receipt scanner is the most interaction-heavy feature. It must feel instant and reliable.

### Camera Viewfinder

```
┌──────────────────────────────┐
│  [✕]                   [⚡]  │  ← Close (top-left), Flash (top-right)
│                              │
│    ┌──────────────────┐      │
│    │                  │      │
│    │   (receipt area)  │      │  ← Dashed white rectangle, 80% width
│    │                  │      │
│    │                  │      │
│    └──────────────────┘      │
│                              │
│  "I-align ang resibo sa box" │  ← Hint text, fades after 3 seconds
│                              │
│         ( ● )                │  ← Capture button: 60×60px, Honey gradient
└──────────────────────────────┘
```

### Capture Flow Timing

| Step | Duration | UI Feedback |
|------|----------|-------------|
| Tap capture | 0ms | Button press animation (scale down 0.95x) |
| Camera freeze | ~100ms | Image frozen, button becomes disabled |
| Upload + OCR | 2–4s | Kai typing indicator below image: "Bina-basa ko ang resibo mo..." |
| Result display | 0ms after OCR | Camera view slides up, Expense Card slides in below |

### Camera Permissions

**First-time request** (triggered when user first taps Scan tab):
- System permission dialog appears (browser-native, can't be customized)
- Before the system dialog, show a pre-permission screen explaining why:

```
┌──────────────────────────────┐
│                              │
│       📷                     │
│                              │
│  "Para ma-scan ni Kai ang    │
│   mga resibo mo, kailangan   │
│   ng camera access."         │
│                              │
│  [Allow Camera Access]       │  ← Honey CTA, triggers system dialog
│  [Skip muna]                 │  ← Ghost CTA, goes back
└──────────────────────────────┘
```

This pre-permission screen improves grant rates because users understand the why before seeing the system prompt.

### Multi-Receipt Batch

After scanning one receipt, Kai asks: "May iba pa bang resibo? [📷 Scan another] [Done]"

This enables batch scanning (common use case: Maria has 5 receipts from a Puregold run).

---

## 7. Offline-First Behavior

AKBai users include Maria packing orders in a bodega with intermittent LTE, and Andoy in a sari-sari store with spotty WiFi. Offline support is not a nice-to-have — it's a core requirement.

### What Works Offline

| Feature | Offline Behavior | Data Source |
|---------|-----------------|-------------|
| Morning Briefing | Shows last cached version | TanStack Query Persister |
| Expense list | All previously loaded expenses viewable | Persisted cache |
| Daily Check-In | Full flow works — queued for sync | Local mutation queue |
| BIR Deadlines | All deadlines viewable (static after initial load) | Persisted cache |
| Costing Cards | Viewable and editable | Persisted cache + local queue |
| Resibo Scanner | ❌ Requires internet (Haiku Vision API) | — |
| Reply Drafter | ❌ Requires internet (Sonnet API) | — |
| Kai Chat | ❌ New queries require internet | — |

### Offline UI Indicators

**Top banner** (when offline):
```
┌──────────────────────────────────────┐
│ 📡 Offline — last updated 2 hrs ago │
└──────────────────────────────────────┘
```
- Background: surface-container-high (#ebe8e1 light / #172740 dark)
- Text: on-surface-variant, 12px
- Persists until connectivity returns

**Queued mutation badge**: Small dot indicator on bottom nav items that have pending syncs.

**Sync toast** (when connectivity returns):
"Synced ✓ — 3 items na-update." (Teal toast, auto-dismisses after 3 seconds)

### Features That Need Internet

When a user tries to use Resibo Scanner or Reply Drafter offline:
Kai bubble: "Kailangan ko ng internet para ma-[scan ang resibo / draft ang reply]. I-try mo ulit pag may connection."

No error screen. No blocking modal. Just a Kai message explaining the situation with warmth.

### Cache Strategy

- **Morning Briefing**: Cached daily. Stale after 24 hours. Shows stale data with "Last updated" indicator rather than empty state.
- **Expense list**: Full list cached on first load. Updated incrementally on each app foreground.
- **BIR Deadlines**: Cached on setup. Only changes when user modifies business type (rare).
- **Profile data**: Always cached. Updated on profile version change.

---

## 8. Loading States and Skeletons

Never show a blank screen while data loads. Use skeleton screens that mirror the final layout.

### Skeleton Rules

- **Shape**: Match the content shape. Card skeletons are card-shaped. Text lines are 16px-high rounded rectangles.
- **Animation**: Gentle pulse (opacity 0.3 → 0.6 → 0.3), 1.5s cycle, ease-in-out. Respect `prefers-reduced-motion` — no animation, show static grey.
- **Color**: surface-container-high on surface background (subtle contrast, not distracting)
- **Duration**: If loading takes >3 seconds, add Kai typing indicator: "Saglit lang..."

### Skeleton Patterns

**Morning Briefing skeleton:**
```
┌─ Card Skeleton ──────────────────┐
│ [░░░░░░░░░] [░░░]              │
│                                  │
│  [░░░░░░░░░░░░░░░░░]           │
│  [░░░░░░░░░░░░░]               │
│  [░░░░░░░░░░░░░░░]             │
│                                  │
│  [░░░░░░░░]                     │
└──────────────────────────────────┘
```

**Expense Card skeleton:**
```
┌─ Card Skeleton ──────────────────┐
│ [░░] [░░░░░░░░]        [░░░░]  │
│      [░░░░░░░░░░░]             │
└──────────────────────────────────┘
```

### Transition from Skeleton to Content
Content fades in (opacity 0 → 1, 200ms ease-out). No jarring layout shift — skeleton dimensions must match final content dimensions.

---

## 9. Responsive Breakpoints

AKBai is mobile-first. Tablet and desktop are secondary but should not break.

| Breakpoint | Width | Layout Behavior |
|-----------|-------|-----------------|
| Mobile (primary) | 320–428px | Single column. Cards full-width. Bottom nav. |
| Large mobile | 429–768px | Same as mobile. Slightly wider cards. |
| Tablet | 769–1024px | Max-width container (480px) centered. Bottom nav becomes side nav. |
| Desktop | 1025px+ | Max-width container (480px) centered. Side nav. Feels like a phone simulator. |

**Design principle**: Don't try to make AKBai a full desktop app. It's a mobile app that happens to work on larger screens. The 480px max-width container on tablet/desktop keeps the intimate, phone-like feel.

---

## 10. Performance Budget

Users are on Philippine mobile networks (4G LTE, sometimes 3G). Every millisecond of load time matters.

| Metric | Budget | Why |
|--------|--------|-----|
| First Contentful Paint | <1.5s | Morning Briefing must appear fast |
| Largest Contentful Paint | <2.5s | Main card stack visible quickly |
| Time to Interactive | <3.5s | User can tap within 3.5s of opening |
| Total JS bundle | <200KB gzipped | 3G-friendly |
| Total page weight | <500KB initial | Including fonts, icons |
| Image per receipt | <200KB | Compressed before upload |

### Font Loading Strategy
Plus Jakarta Sans loaded via Google Fonts with `font-display: swap`. Only load weights actually used (400, 600, 700, 800). Subset to Latin + Latin Extended (covers Filipino diacritics).

### Image Optimization
- Receipt photos: compressed to 80% JPEG quality before upload
- UI icons: SVG sprites or Lucide React icons (tree-shaken)
- No decorative images — the UI is cards and text, not photos
