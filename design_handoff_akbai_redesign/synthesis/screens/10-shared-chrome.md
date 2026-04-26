# Screen 10 — Sidebar + Bottom Nav (Shared Chrome)

**Verdict:** HYBRIDIZE (per Section C of [02-decisions.md](../02-decisions.md#c-chrome-verdicts-proposed--awaiting-anton-sign-off))
**Visual reference:** [current sidebar-nav.tsx](../../../../frontend/src/components/dashboard/sidebar-nav.tsx) · [handoff](../../screenshots/01-home-honey-andoy-fil.png)

## 1. Comparison summary

Current chrome ships a functional 5-tab bottom nav and sidebar, but lacks the persona pill, language toggle, and handoff's honey-gradient active states that make the app feel personal. The handoff drops Scan from the bottom nav (4 tabs only) — rejected in favour of keeping 5 tabs (Scan is highest-frequency). The reuse rule is strict: re-skin `sidebar-nav.tsx` and `bottom-nav.tsx` in place; do not replace them with parallel implementations. Sprint 5 lesson.

## 2. Synthesized layout

### Sidebar (≥ 860px breakpoint — per C3 ADOPT HANDOFF)

Component: `frontend/src/components/dashboard/sidebar-nav.tsx` — **re-skin, do not replace**. Current API preserved.

Top → bottom in fixed left rail (~240px):

1. **Brand lockup** — AKBai wordmark: "AKB" in ink + "ai" in honey-deep italic (PJS ExtraBold 800). Kai mark PNG at 22px (`mark-honey.png`, circular clip). Same structure as current; updated color tokens.
2. **Persona pill** — rounded `surface-container-lowest` card, `p-3`, amber ambient shadow. Initials circle (honey-deep, 40px) + business name (PJS 14px/600, ink) + tagline (12px/400, ink-soft). Tap → navigates to `/profile` (single-user, no multi-account switcher per C4).
3. **Nav items** (5) — "Home" / "Chat" / "Scan" / "Pera" / "Higit pa...". Each: icon (lucide, 18px) + label (PJS 14px/400). Active state: honey-deep gradient pill background, white label + icon. Inactive: transparent bg, ink text, hover = `surface-container` tint. Active pill: `border-radius: 999px`, `padding: 8px 14px`. Touch target: 44px height minimum.
4. **"Higit pa..." item** — opens Vaul drawer (already installed). Drawer contents: BIR Deadlines / Tamang Presyo / Mga Invoice / Mga Draft / Daily Check-in (history) / Linggong Kuwento. Each drawer row: small icon + label + one-line description. Per C7 ADOPT HANDOFF.
5. **Language toggle** — bottom of sidebar. Two adjacent pills: "Filipino" / "English". Active: honey-deep fill, white text. Inactive: `surface-container` fill, ink-soft text. Functional from Phase 5 (`next-intl` cookie-based). Per C5 ADOPT HANDOFF.

Nav item label mapping:
| Current label | New label | Route |
|---|---|---|
| Dashboard | Home | `/dashboard` |
| Saan Napunta? | Pera | `/expenses` |
| Chat with Kai | Chat | `/chat` |
| Resibo | Scan | `/scan` |
| Profile | (moved to persona pill) | `/profile` |

### Bottom nav (< 860px breakpoint)

Component: `frontend/src/components/dashboard/bottom-nav.tsx` — **re-skin, do not replace**.

5 tabs (KEEP CURRENT structure — C2 HYBRIDIZE):

| Tab | Icon | Label | Route |
|---|---|---|---|
| Home | lucide `Home` | Home | `/dashboard` |
| Chat | lucide `MessageCircle` | Chat | `/chat` |
| Scan | lucide `Camera` | Scan | `/scan` |
| Pera | lucide `Wallet` | Pera | `/expenses` |
| More | lucide `MoreHorizontal` | More | Vaul drawer |

Active state: honey-deep icon + label (replaces current `primary-container` amber). Inactive: ink-faint. Glass blur preserved: `bg-surface-container-lowest/80 backdrop-blur-[20px]` + amber ambient shadow. Height: 56px + `env(safe-area-inset-bottom)`. All tabs: 44×56px touch area minimum (equal distribution).

"More" tab opens same Vaul drawer as sidebar "Higit pa..." (same component, reused).

### Breakpoint

860px (C3 ADOPT HANDOFF). Below 860px: bottom nav + content fills full width. At and above 860px: sidebar visible, bottom nav hidden, content area has `ml-[240px]`.

## 3. Decisions table

| Verdict ID | Dimension | Verdict | Rationale |
|---|---|---|---|
| C1 | Sidebar | HYBRIDIZE | Handoff structure + persona pill + language toggle; reuse current API |
| C2 | Bottom nav | HYBRIDIZE | Keep 5 tabs + Scan; adopt handoff honey-gradient active state |
| C3 | Breakpoint | ADOPT HANDOFF | 860px (was 768px) |
| C4 | Persona pill | ADOPT HANDOFF | Business name + tagline; taps to `/profile` |
| C5 | Language toggle | ADOPT HANDOFF | FIL/EN pills; functional Phase 5 |
| C6 | Glass nav blur | KEEP CURRENT | Already shipped, well-loved |
| C7 | "More" drawer contents | ADOPT HANDOFF | Vaul drawer with BIR / Costing / Invoices / Drafts / Check-in / Kuwento |

## 4. Enrichments applied

- `pattern:one-handed-cta-thumb-zone` — bottom nav fixed in easy zone; primary feature access ≤ 1 tap
- `pattern:filipino-mobile-data-resilience` — pending sync dots on bottom nav items that have queued mutations; same as current implementation
- `pattern:varying-kai-expression-by-context` — no Kai mark in bottom nav (keeps chrome clean); Kai mark only in sidebar brand lockup

## 5. Reuse map

| Component needed | Source | Notes |
|---|---|---|
| `sidebar-nav.tsx` | Current — re-skin | New label map + persona pill + language toggle + honey tokens |
| `bottom-nav.tsx` | Current — re-skin | 5 tabs preserved; honey active state |
| Vaul drawer | Library — already installed | "More" / "Higit pa..." contents |
| Persona pill | New inline addition to sidebar | Not a separate component |
| Language toggle pills | New inline addition to sidebar | Phase 5 functional |

Full table: [`04-reuse-audit.md`](../04-reuse-audit.md)

## 6. Open questions

1. **860px breakpoint migration**: current code uses `md:` (768px) Tailwind breakpoint. A custom 860px breakpoint requires either a Tailwind config extension or a CSS media query override. Confirm approach with engineer before Phase 3 to avoid breakpoint inconsistency across the app.
2. **Persona pill data source**: the sidebar persona pill shows business name + tagline. On profile update, does the sidebar re-fetch the data, or is it populated at app-shell level from a context provider? Needs data-flow decision.
3. **"Higit pa..." vs "More" drawer contents post Phase 10**: once `/kuwento` is built (Phase 10), confirm the drawer link is active. Phase 3–9 can leave it as a disabled row with "Sa lalong madaling panahon" label.

## 7. Acceptance signal

- Sidebar visible at ≥ 860px; bottom nav visible at < 860px; no overlap
- Active tab / nav item shows honey-deep state correctly on all 5 items
- Persona pill shows business name and tagline from user profile
- "More" / "Higit pa..." drawer opens with all 6 items (BIR / Costing / Invoices / Drafts / Check-in / Kuwento)
- Language toggle renders (non-functional until Phase 5; clicking shows no error)
- Glass blur preserved on bottom nav
- All touch targets ≥ 44×44px
- Reduced-motion: no animation on nav transitions beyond instant color change
- Both FIL and EN locale: nav labels render in selected locale
