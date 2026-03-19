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
  "theme_color": "#07101e",
  "background_color": "#07101e"
}
```

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

Cards are the primary data container in AKBai. They sit in a vertical scroll alongside KA's chat bubbles.

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
| Background | #0d1a2e (Card) or #111f36 (Card Alt) | `bg-[#0d1a2e]` |
| Border radius | 12px | `rounded-xl` |
| Padding | 16px | `p-4` |
| Shadow | None on dark mode; subtle on light mode | — |
| Vertical gap between cards | 12px | `gap-3` or `space-y-3` |
| Max width | 100% of content area (minus 16px side padding) | `mx-4` |

### Card + Chat Bubble Interleaving

The main content area alternates between KA chat bubbles and Cards:

```
[KA bubble: "Good morning, Maria!"]
    12px gap
[Morning Briefing Card]
    12px gap
[KA bubble: "May isang deadline this week."]
    12px gap
[Deadline Card]
    12px gap
[KA bubble: "At eto ang gastos mo kahapon."]
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
| Background | #0d1a2e with 95% opacity (slight blur for content scrolling behind) |
| Item layout | Icon (24px) above label (11px, SemiBold 600) |
| Active state | Honey (#F59E0B) icon + label |
| Inactive state | #6B7280 icon + label |
| Touch area per item | Equal distribution, minimum 44×56px each |
| Safe area | `padding-bottom: env(safe-area-inset-bottom)` for iPhone notch |

### Tab Definitions

| Tab | Icon | Label | Destination |
|-----|------|-------|-------------|
| Home | 🏠 | Home | Morning Briefing (Ang Umaga Mo) |
| Chat | 💬 | Chat | KA conversation thread |
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
| Upload + OCR | 2–4s | KA typing indicator below image: "Bina-basa ko ang resibo mo..." |
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

After scanning one receipt, KA asks: "May iba pa bang resibo? [📷 Scan another] [Done]"

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
| KA Chat | ❌ New queries require internet | — |

### Offline UI Indicators

**Top banner** (when offline):
```
┌──────────────────────────────────────┐
│ 📡 Offline — last updated 2 hrs ago │
└──────────────────────────────────────┘
```
- Background: #1F2937 (subtle, not alarming)
- Text: #9CA3AF, 12px
- Persists until connectivity returns

**Queued mutation badge**: Small dot indicator on bottom nav items that have pending syncs.

**Sync toast** (when connectivity returns):
"Synced ✓ — 3 items na-update." (Teal toast, auto-dismisses after 3 seconds)

### Features That Need Internet

When a user tries to use Resibo Scanner or Reply Drafter offline:
KA bubble: "Kailangan ko ng internet para ma-[scan ang resibo / draft ang reply]. I-try mo ulit pag may connection."

No error screen. No blocking modal. Just a KA message explaining the situation with warmth.

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
- **Color**: #1F2937 on #07101e background (subtle contrast, not distracting)
- **Duration**: If loading takes >3 seconds, add KA typing indicator: "Saglit lang..."

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
