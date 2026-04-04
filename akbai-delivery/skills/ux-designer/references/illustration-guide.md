# AKBai Illustration Library — Style Guide

Last updated: 2026-04-04

## Overview
AKBai uses two types of visual assets:
1. **AI-generated raster images (WebP)** — complex character scenes for hero, onboarding, empty states, marketing
2. **SVG React components** — themeable icons for selection UIs, feature cards, expense categories, status indicators

---

## Visual Style (Derived from Sample Images)

| Attribute | Rule |
|-----------|------|
| **Style** | Flat vector illustration, clean lines, no gradients/3D, minimal shading |
| **Backgrounds** | Cream (#fdf9f2) with soft amber (#f59e0b) swoosh/arc decorative elements |
| **Characters** | Filipino MSME owners — diverse ages (20s-50s), body types (petite to stocky to plump), skin tones (light kayumanggi to deep morena/moreno). Clothing varies by persona: house dress, sando + button-up, casual t-shirt, polo shirt, baker's apron. See [gemini-prompt-library.md](gemini-prompt-library.md) §Persona Archetypes for 6 named character templates. |
| **Color palette** | Cream bg, honey/amber accents, teal for financial data. Character clothing varies per persona — NOT all navy aprons. |
| **Kai mascot** | Yin-yang inspired circular mark — amber/gold left half embracing silver/grey right half, warm cream face at center with squinted happy eyes and curved smile, soft golden glow. Reflects "akbay" (arm around shoulder). Floating companion in scenes. |
| **UI elements** | App screens, data cards, charts floating in scene (not framed) |
| **Narrative** | Before/after — stressed with receipts vs. organized with AKBai |
| **Decorative** | Potted tropical plants, Manila skyline silhouettes, hanging lamps, sari-sari store elements |
| **Mood** | Warm, optimistic, culturally authentic Filipino MSME context |

---

## Color Reference

### Theming Colors (CSS Custom Properties — auto light/dark)
| Token | CSS Variable | Light | Dark |
|-------|-------------|-------|------|
| Primary Container | `hsl(var(--primary-container))` | #f59e0b | #653e00 |
| On Surface | `hsl(var(--on-surface))` | #1c1c18 | #eef1f7 |
| Tertiary | `hsl(var(--tertiary))` | #006b54 | #43deb4 |
| Surface | `hsl(var(--surface))` | #fdf9f2 | #0b1525 |
| Surface Container | `hsl(var(--surface-container))` | #f1ede7 | #141f32 |

### Hardcoded Colors (used in SVGs where theming isn't needed)
| Purpose | Hex | Usage |
|---------|-----|-------|
| Kai mascot amber/gold | #f59e0b | Kai mascot left half, warm accent |
| Kai mascot shading | #d97706 | Kai mascot depth/shadow on gold half |
| Kai mascot silver | #c0c0c0 | Kai mascot right half |
| Kai face cream | #fdf5e6 | Kai mascot center face |
| Amber accent | #f59e0b | Decorative swooshes |
| Terracotta pot | #c2703e | Plant pots |
| Warm red (error) | #F87171 | Error status icon |
| Caution amber | #d97706 | Warning/decline indicators |

---

## AI Image Generation — Prompt Template

> **Full prompt library:** See [gemini-prompt-library.md](gemini-prompt-library.md) for ready-to-use prompts for all 15 TO GENERATE images + 6 marketing extras.

Base prompt for all AI-generated illustrations (Gemini Nano Banana style):

```
Flat vector illustration style, clean lines, no gradients, minimal shading.
Warm cream background (#fdf9f2). Honey amber (#f59e0b) and teal (#006b54)
accent colors. Decorative amber swoosh curves in background. Soft city
skyline silhouette. Potted tropical plants.
A cute yin-yang shaped mascot character — circular form with an amber/gold
left half and silver/grey right half embracing each other, a warm cream
smiling face at the center with squinted happy eyes, soft golden glow behind it.
[PERSONA DESCRIPTION — use a named persona from gemini-prompt-library.md.
Specify age, build, skin tone, hair, and clothing. Do NOT default to
"white shirt + navy apron" for every character.]
[SPECIFIC SCENE DESCRIPTION]. Modern, optimistic, culturally authentic
Filipino MSME context. No text in image.
```

### Rules
1. **No text in images** — AI-generated text has artifacts. Add text as HTML/CSS overlays.
2. **Diverse characters** — Use the 6 named persona archetypes (Nena, Jose, Maya, Ben, Tita Rosa, Kuya Rico) from the prompt library. Vary age, build, skin tone, and clothing. Never default to "white shirt + navy apron" for everyone.
3. **Kai mascot** — Include the yin-yang style mascot (amber/gold + silver/grey halves embracing a warm smiling face) as floating companion where appropriate.
4. **Aspect ratios:** Hero 16:9, Empty states 4:3, Onboarding 1:1 or 4:3.
5. **Export at 2x** — Hero: 1200x675px, Empty states: 600x450px, Onboarding: 600x600px.
6. **Format: WebP** at 80% quality.

---

## AI Image Inventory

> Full inventory with WebP paths and persona assignments: see [gemini-prompt-library.md](gemini-prompt-library.md) §Complete Image Inventory
> **Source PNGs:** `frontend/src/components/illustrations/vector-images/` (descriptive names)
> **Deployed WebPs:** `frontend/public/illustrations/{category}/` (ready for `<IllustrationWrapper>`)

### Hero (v1)
| # | WebP Path | Description | Status |
|---|-----------|-------------|--------|
| 1 | `hero/hero-team.webp` | Business owners with tablets, growth charts | EXISTS |
| 2 | `hero/hero-organize.webp` | Owner organizing with Kai help | EXISTS |
| 3 | `hero/hero-pain.webp` | Stressed owner with receipt piles | EXISTS |

### Onboarding
| # | WebP Path | Description | Persona | Status |
|---|-----------|-------------|---------|--------|
| 5 | `onboarding/welcome.webp` | Owners around table with phone, Kai, floating UI cards | Group | EXISTS |
| 6 | `onboarding/business-type.webp` | 4-quadrant montage: baker, seller, sari-sari, freelancer | All four | EXISTS |
| 7 | `onboarding/pain-point.webp` | Split: stressed → organized with Kai | Jose | EXISTS |
| 8 | `onboarding/ready.webp` | Fist-pump celebration, setup checklist complete | Maya | EXISTS |

### Empty States
| # | WebP Path | Description | Persona | Status |
|---|-----------|-------------|---------|--------|
| 9 | `empty-states/no-expenses.webp` | Kai peeking from wallet, scattered coins | Kai only | EXISTS |
| 10 | `empty-states/no-deadlines.webp` | Kai sitting on calendar, coffee cup | Kai only | EXISTS |
| 11 | `empty-states/no-replies.webp` | Kai next to phone with empty chat | Kai only | EXISTS |
| 12 | `empty-states/no-chat.webp` | Kai centered, sunburst glow, welcoming | Kai only | EXISTS |
| 13 | `empty-states/first-scan.webp` | Hands scanning receipt, Kai peeking, teal brackets | Nena | EXISTS |
| 25 | `empty-states/costing-empty.webp` | Kai on kitchen scale, bakery bg, eggs, flour | Kai only | EXISTS |
| 26 | `empty-states/invoice-empty.webp` | Kai leaning on clipboard with invoice, coins, pen | Kai only | EXISTS |

### Status
| # | WebP Path | Description | Persona | Status |
|---|-----------|-------------|---------|--------|
| 14 | `status/offline.webp` | Kai on bench, wifi X, rain, clock | Kai only | EXISTS |
| 15 | `status/error.webp` | Kai apologetic, broken gear, plug | Kai only | EXISTS |
| 16 | `status/session-expired.webp` | Clock/hourglass, Kai gesturing to login | Kai only | EXISTS |

### Celebrations
| # | WebP Path | Description | Persona | Status |
|---|-----------|-------------|---------|--------|
| 17 | `celebrations/first-expense.webp` | Nena with phone checkmark, Kai celebrating | Nena | EXISTS |
| 18 | `celebrations/revenue-milestone.webp` | Kuya Rico arms raised, revenue goal, peso confetti | Kuya Rico | EXISTS |
| 19 | `celebrations/streak.webp` | Jose walking with phone, Kai running, flame icon | Jose | EXISTS |

### Features
| # | WebP Path | Description | Persona | Status |
|---|-----------|-------------|---------|--------|
| 20 | `features/scan-in-progress.webp` | Nena scanning receipt, teal brackets, Kai watching | Nena | EXISTS |
| 21 | `features/scan-success.webp` | Maya with captured receipt + peso cards, Kai thumbs-up | Maya | EXISTS |
| 22 | `features/paywall-upgrade.webp` | Split: Free vs Pro features, PRO badge | Kai only | EXISTS |
| 23 | `features/payment-success.webp` | Ben with teal checkmark, PRO badge, Kai celebrating | Ben | EXISTS |
| 24 | `features/pwa-install-guide.webp` | Phone share menu + Save, Kai pointing | Kai only | EXISTS |

### Marketing
| # | WebP Path | Description | Persona | Status |
|---|-----------|-------------|---------|--------|
| M1 | `marketing/facebook-hero.webp` | Nena at sari-sari counter with phone + Kai | Nena | EXISTS |
| M2 | `marketing/bir-stress.webp` | Tita Rosa stressed with BIR forms, no mascot | Tita Rosa | EXISTS |
| M3 | `marketing/receipt-scanning.webp` | Hands scanning receipt, laptop with expenses | Ben | EXISTS |
| M4 | `marketing/morning-briefing.webp` | Kuya Rico with tablet, morning briefing, Manila skyline | Kuya Rico | EXISTS |
| M5 | `marketing/sari-sari-digital.webp` | Jose behind sari-sari counter with phone + Kai | Jose | EXISTS |
| M6 | `marketing/multi-feature.webp` | Maya surrounded by floating feature cards + Kai | Maya | EXISTS |
| 27 | `marketing/blog-header-cashflow.webp` | Kuya Rico pointing at Cash In/Cash Out chart | Kuya Rico | EXISTS |

**Summary: All 33 images exist. Full coverage achieved.**

---

## SVG Component Library

### Architecture
All SVG components are in `frontend/src/components/illustrations/svg/` and follow this interface:
```tsx
interface IllustrationProps {
  size?: number;
  className?: string;
}
```

### Categories & Components (45 total)

| Category | Count | Default Size | Components |
|----------|-------|-------------|------------|
| business-types | 4 | 48x48 | FoodBaking, OnlineSelling, Freelance, RetailSariSari |
| pain-points | 4 | 48x48 | ReceiptTracking, BirCompliance, CustomerMessages, KnowingEarnings |
| features | 5 | 64x64 | ResiboScanner, CashFlow, BirDeadlines, ReplyDrafter, MorningBriefing |
| expense-categories | 10 | 40x40 | ExpenseFood, ExpenseTransport, ExpenseUtilities, ExpenseSupplies, ExpenseRent, ExpenseSalary, ExpenseMarketing, ExpenseInventory, ExpenseEquipment, ExpenseMisc |
| financial | 6 | 40x40 | RevenueUp, RevenueDown, ProfitBadge, SavingsGoal, BudgetMeter, PesoSign |
| ka-expressions | 6 | 48x48 | KaHappy, KaThinking, KaCelebrating, KaConcerned, KaWaving, KaWorking |
| status | 6 | 40x40 | StatusSuccess, StatusWarning, StatusError, StatusPending, StatusOffline, StatusEmpty |
| decorative | 4 | varies | AmberSwoosh, PottedPlant, CitylineSilhouette, SparkleAccent |

### SVG Design Rules
- Use CSS custom properties for theme colors (`hsl(var(--primary-container))`)
- Use hardcoded colors only for decorative elements that don't change with theme
- Every functional SVG has `role="img"` + `aria-label`
- Decorative SVGs use `aria-hidden="true"`
- Flat fills preferred over strokes
- Named exports, not default exports

---

## Dark Mode Strategy

### Raster Images (WebP)
CSS filter applied via IllustrationWrapper component:
```css
.dark .illustration { filter: brightness(0.85) saturate(0.9); }
```

### SVG Components
Automatic via CSS custom properties — colors switch with `.dark` class on `<html>`.

---

## File Structure

```
frontend/public/illustrations/
├── hero/           # Marketing hero images (AI-generated, WebP)
├── onboarding/     # Onboarding step illustrations
├── empty-states/   # In-app empty states
├── status/         # Error, offline, loading
└── celebrations/   # Milestone moments

frontend/src/components/illustrations/
├── svg/
│   ├── business-types/
│   ├── pain-points/
│   ├── features/
│   ├── expense-categories/
│   ├── financial/
│   ├── ka-expressions/
│   ├── status/
│   ├── decorative/
│   └── index.ts      # Barrel export
└── IllustrationWrapper.tsx
```

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Raster files | kebab-case.webp | `hero-vendor.webp` |
| SVG components | PascalCase.tsx | `FoodBaking.tsx` |
| Exports | Named PascalCase | `export function FoodBaking()` |
| Directories | kebab-case | `expense-categories/` |
