# AKBai Illustration Library — Style Guide

Last updated: 2026-04-03

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

| # | Filename | Location | Description | Status |
|---|----------|----------|-------------|--------|
| 1 | hero-team.webp | hero/ | Business owners with tablets, growth charts | EXISTS (sample) |
| 2 | hero-vendor.webp | hero/ | Vendor with phone + sari-sari cart | EXISTS (sample) |
| 3 | hero-organize.webp | hero/ | Owner organizing with KA help | EXISTS (sample) |
| 4 | hero-pain.webp | hero/ | Stressed owner with receipt piles | EXISTS (sample) |
| 5 | welcome.webp | onboarding/ | KA greeting new user | TO GENERATE |
| 6 | business-type.webp | onboarding/ | Montage of 4 business types | TO GENERATE |
| 7 | pain-point.webp | onboarding/ | Split: messy → organized | TO GENERATE |
| 8 | ready.webp | onboarding/ | Completion celebration | TO GENERATE |
| 9 | no-expenses.webp | empty-states/ | Empty wallet + KA peeking | TO GENERATE |
| 10 | no-deadlines.webp | empty-states/ | Clean calendar + KA | TO GENERATE |
| 11 | no-replies.webp | empty-states/ | Empty chat + KA ready | TO GENERATE |
| 12 | no-chat.webp | empty-states/ | KA waving "Kumusta!" | TO GENERATE |
| 13 | first-scan.webp | empty-states/ | Phone with receipt camera | TO GENERATE |
| 14 | offline.webp | status/ | No signal, warm patient tone | TO GENERATE |
| 15 | error.webp | status/ | KA apologetic | TO GENERATE |
| 16 | session-expired.webp | status/ | Clock/timeout | TO GENERATE |
| 17 | first-expense.webp | celebrations/ | First entry celebration | TO GENERATE |
| 18 | revenue-milestone.webp | celebrations/ | Revenue goal + confetti | TO GENERATE |
| 19 | streak.webp | celebrations/ | Usage streak | TO GENERATE |

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
