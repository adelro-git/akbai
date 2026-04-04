# AKBai — Gemini Prompt Library (Nano Banana Style)

Last updated: 2026-04-04

## How to Use

1. Copy the **Master Style Prompt** below
2. Append the **persona block** for the character type you need (see Persona Archetypes)
3. Append the **scene-specific prompt** for the image
4. Paste the combined prompt into Gemini (2.0 Flash or Imagen 3)
5. Select "Nano Banana" style preset if available
6. Set the aspect ratio in both the prompt AND Gemini's settings
7. Generate 3-4 variants, pick the most consistent with existing images
8. Export at 2x resolution, convert to WebP at 80% quality

---

## Complete Image Inventory (37 files)

> **Source PNGs:** `frontend/src/components/illustrations/vector-images/`
> **Deployed WebPs:** `frontend/public/illustrations/{category}/`

### Hero (v1)

| Inv# | WebP Path | Source PNG | Scene | Persona |
|------|-----------|-----------|-------|---------|
| #1 | `hero/hero-pain.webp` | `hero-pain.png` | Stressed owner, receipt piles, clock, sari-sari bg | F (v1) |
| #2 | `hero/hero-organize.webp` | `hero-organize.png` | Owner with tablet + Kai, dashboard UI, messy desk | F (v1) |
| #3 | `hero/hero-team.webp` | `hero-team.png` | 4 owners standing, floating charts, Manila skyline | Group (v1) |

### Onboarding

| Inv# | WebP Path | Source PNG | Scene | Persona |
|------|-----------|-----------|-------|---------|
| #5 | `onboarding/welcome.webp` | `welcome.png` | Owners around table with phone, Kai, floating UI cards | Group |
| #6 | `onboarding/business-type.webp` | `business-type.png` | 4-quadrant montage: baker, seller, sari-sari, freelancer | All four |
| #7 | `onboarding/pain-point.webp` | `pain-point.png` | Split: stressed Jose → organized Jose with Kai | Jose |
| #8 | `onboarding/ready.webp` | `ready.png` | Maya fist-pump, setup checklist, Kai celebrating | Maya |

### Empty States

| Inv# | WebP Path | Source PNG | Scene | Persona |
|------|-----------|-----------|-------|---------|
| #9 | `empty-states/no-expenses.webp` | `no-expenses.png` | Kai peeking from wallet, scattered coins | Kai only |
| #10 | `empty-states/no-deadlines.webp` | `no-deadlines.png` | Kai sitting on calendar, coffee cup | Kai only |
| #11 | `empty-states/no-replies.webp` | `no-replies.png` | Kai next to phone with empty chat | Kai only |
| #12 | `empty-states/no-chat.webp` | `no-chat.png` | Kai centered, sunburst glow, welcoming | Kai only |
| #13 | `empty-states/first-scan.webp` | `first-scan.png` | Nena's hands scanning receipt, teal brackets | Nena |
| #25 | `empty-states/costing-empty.webp` | `costing-empty.png` | Kai on kitchen scale, bakery bg, eggs, flour | Kai only |
| #26 | `empty-states/invoice-empty.webp` | `invoice-empty.png` | Kai leaning on clipboard with invoice, coins, pen | Kai only |

### Status

| Inv# | WebP Path | Source PNG | Scene | Persona |
|------|-----------|-----------|-------|---------|
| #14 | `status/offline.webp` | `offline.png` | Kai on bench, wifi X, rain, clock | Kai only |
| #15 | `status/error.webp` | `error.png` | Kai apologetic, broken gear, plug | Kai only |
| #16 | `status/session-expired.webp` | `session-expired.png` | Clock/hourglass, Kai gesturing to login | Kai only |

### Celebrations

| Inv# | WebP Path | Source PNG | Scene | Persona |
|------|-----------|-----------|-------|---------|
| #17 | `celebrations/first-expense.webp` | `first-expense.png` | Nena with phone checkmark, Kai celebrating | Nena |
| #18 | `celebrations/revenue-milestone.webp` | `revenue-milestone.png` | Kuya Rico arms raised, revenue goal, peso confetti | Kuya Rico |
| #19 | `celebrations/streak.webp` | `streak.png` | Jose walking with phone, Kai running, flame icon | Jose |

### Features

| Inv# | WebP Path | Source PNG | Scene | Persona |
|------|-----------|-----------|-------|---------|
| #20 | `features/scan-in-progress.webp` | `scan-in-progress.png` | Nena scanning receipt, teal brackets, Kai watching | Nena |
| #21 | `features/scan-success.webp` | `scan-success.png` | Maya phone with captured receipt + peso cards, Kai thumbs-up | Maya |
| #22 | `features/paywall-upgrade.webp` | `paywall-upgrade.png` | Split: Free (greyed) vs Pro (full features, PRO badge) | Kai only |
| #23 | `features/payment-success.webp` | `payment-success.png` | Ben with phone teal checkmark, PRO badge, Kai celebrating | Ben |
| #24 | `features/pwa-install-guide.webp` | `pwa-install-guide.png` | Phone share menu + Save, Kai pointing, app icons | Kai only |
| — | `features/feature-dashboard.webp` | `feature-dashboard.png` | Group at cash flow dashboard (v1 reference) | Group (v1) |
| — | `features/feature-bir-reminder.webp` | `feature-bir-reminder.png` | Woman at laptop, BIR notification (v1 reference) | F (v1) |
| — | `features/feature-resibo-scanner-v1.webp` | `feature-resibo-scanner-v1.png` | Hand scanning receipt close-up (v1 reference) | Hand (v1) |
| — | `features/feature-vendor-v1.webp` | `feature-vendor-v1.png` | Woman with sari-sari cart (v1 reference) | F (v1) |
| — | `features/feature-morning-briefing-v1.webp` | `feature-morning-briefing-v1.png` | Man at cafe, morning briefing (v1 reference) | M (v1) |

### Marketing

| Inv# | WebP Path | Source PNG | Scene | Persona |
|------|-----------|-----------|-------|---------|
| M1 | `marketing/facebook-hero.webp` | `facebook-hero.png` | Nena at sari-sari counter with phone + Kai | Nena |
| M2 | `marketing/bir-stress.webp` | `bir-stress.png` | Tita Rosa stressed with BIR forms, no mascot | Tita Rosa |
| M3 | `marketing/receipt-scanning.webp` | `receipt-scanning.png` | Hands scanning receipt, laptop with expenses | Ben |
| M4 | `marketing/morning-briefing.webp` | `morning-briefing.png` | Kuya Rico with tablet, morning briefing, Manila skyline | Kuya Rico |
| M5 | `marketing/sari-sari-digital.webp` | `sari-sari-digital.png` | Jose behind sari-sari counter with phone + Kai | Jose |
| M6 | `marketing/multi-feature.webp` | `multi-feature.png` | Maya surrounded by floating feature cards + Kai | Maya |
| #27 | `marketing/blog-header-cashflow.webp` | `blog-header-cashflow.png` | Kuya Rico pointing at Cash In/Cash Out chart | Kuya Rico |

**All 37 files renamed, converted to WebP (80% quality), and deployed to `public/illustrations/`.**

---

## Kai Mascot — Reference Description

The Kai mascot is NOT a simple "C" shape. It is a **yin-yang inspired circular character**:

- **Shape:** Circular yin-yang form — two halves embracing each other
- **Left/top half:** Warm amber/gold (#f59e0b) with deeper amber (#d97706) shading
- **Right/bottom half:** Soft silver/grey (#c0c0c0)
- **Center face:** Warm cream (#fdf5e6) with squinted happy eyes (curved lines, not dots) and a gentle curved smile
- **Glow:** Soft golden halo/radiance behind the mark
- **Symbolism:** The two halves embracing represents "akbay" — putting your arm around someone's shoulder
- **In scenes:** Floats as a friendly companion with sparkle accents nearby

**Prompt shorthand for Gemini:**
```
A cute yin-yang shaped mascot character — circular form with an amber/gold left half and silver/grey right half embracing each other. A warm cream smiling face at the center with squinted happy eyes and a gentle curved smile. Soft golden glow behind it. Small sparkle accents nearby.
```

---

## Persona Archetypes

Each persona represents a real Filipino MSME segment. **Always specify the persona** in your prompt to avoid the "same person every time" problem. Mix genders across images.

### NENA — The Sari-Sari / Karinderya Owner
```
Character: Filipino woman in her late 40s, round/stocky build, warm dark morena skin,
hair pulled back in a messy bun with a few grey streaks, wearing a faded floral house
dress (daster) with a small towel over one shoulder. Warm maternal smile, laugh lines
around eyes. Hands that show years of work.
```

### JOSE — The Market Vendor / Food Seller
```
Character: Filipino man in his 50s, stocky muscular build, deep brown weathered skin,
short greying hair, wearing a plain white sando (tank top) under an open short-sleeve
button-up shirt, cargo shorts or worn jeans. Wide friendly grin, crow's feet around eyes.
Thick forearms from years of manual work.
```

### MAYA — The Online Seller / Reseller
```
Character: Young Filipina in her early 20s, petite and energetic, medium brown skin,
shoulder-length wavy hair (slightly dyed brown at tips), wearing a casual oversized
graphic t-shirt and jeans — no apron. Bright eager expression, phone always nearby.
Surrounded by shipping boxes and packing tape.
```

### BEN — The Freelancer / Service Provider
```
Character: Filipino man in his early 30s, lean average build, light-medium kayumanggi
skin, neat short fade haircut, wearing a clean polo shirt (not white — try olive or
navy) and chinos, thin-framed glasses. Focused calm expression. Working from a laptop
at a cafe or co-working space.
```

### TITA ROSA — The Bakery / Food Business Owner
```
Character: Filipino woman in her mid-40s, plump/curvy build, warm brown skin, hair in
a neat bun under a baker's cap or hairnet, wearing a flour-dusted apron over a plain
colored t-shirt. Proud confident smile, rosy cheeks from the oven heat. Flour on hands.
```

### KUYA RICO — The Retail / Hardware Store Owner
```
Character: Filipino man in his late 40s, tall and broad-shouldered, dark moreno skin,
receding hairline with salt-and-pepper hair, wearing a tucked-in polo shirt with a
ballpen in the pocket, dark pants. Serious but kind expression. Standing behind a
counter with inventory visible.
```

**Usage rule:** When a prompt calls for "a Filipino business owner," ALWAYS replace it with one of these named personas. Rotate personas across the image set — never use the same one twice in a row.

---

## Master Style Prompt

Copy this prefix for EVERY prompt — it ensures visual consistency across all images:

```
Flat vector illustration, clean outlines, minimal shading, no 3D or gradients.
Warm cream background (#fdf9f2). Decorative amber (#f59e0b) swoosh curves in background.
Soft grey Manila city skyline silhouette. Potted tropical plants (monstera, snake plant).
A cute yin-yang shaped mascot character floating nearby — circular form with an amber/gold
left half and silver/grey right half embracing each other, a warm cream smiling face at
the center with squinted happy eyes, soft golden glow behind it, small sparkle accents.
App UI cards and screens float in the scene (not framed/boxed).
Color palette: cream bg, honey amber accents, teal (#006b54) for data/charts.
Modern, optimistic, culturally authentic Filipino MSME context. No text in image.
```

> **NOTE:** The master prompt deliberately does NOT specify character clothing or body type.
> Each scene prompt includes its own persona description. This prevents the "everyone
> looks the same" problem.

---

## App Images (15 — from illustration-guide.md)

### Onboarding (1:1 or 4:3, 600x600px or 600x450px)

#### #5 — welcome.webp | Kai greeting new user

```
[MASTER STYLE PROMPT]
Scene: The yin-yang mascot (amber-gold and silver-grey halves, cream smiling face)
floating large at center with sparkle accents, as if opening its arms in a welcoming
gesture. Warm morning light from a window. A smartphone resting on a table showing a
clean app home screen. Cozy Filipino cafe/shop interior background. Warm, inviting,
first-time experience mood. No human character — this is Kai's moment. Square (1:1).
```

#### #6 — business-type.webp | Montage of 4 business types

```
[MASTER STYLE PROMPT]
Scene: Four-quadrant composition showing four VISUALLY DISTINCT Filipino business owners:

Top-left — TITA ROSA: plump woman in her mid-40s, warm brown skin, hair in bun under
baker's cap, flour-dusted apron, standing beside pan de sal and oven.

Top-right — MAYA: young petite woman in her early 20s, medium brown skin, wavy
shoulder-length hair with brown tips, casual oversized t-shirt (no apron), surrounded
by shipping boxes and a laptop.

Bottom-left — NENA: stocky woman in her late 40s, dark morena skin, messy bun with grey
streaks, floral house dress (daster), standing behind wooden sari-sari counter with
hanging sachets.

Bottom-right — BEN: lean man in his early 30s, light-medium skin, neat fade haircut,
thin glasses, olive polo shirt, working at a laptop at a cafe table.

Each quadrant separated by thin amber swoosh lines. Each character smiling confidently.
Characters must look distinctly different — different ages, body types, skin tones,
and clothing. The yin-yang mascot small in the center where quadrants meet. 4:3 landscape.
```

#### #7 — pain-point.webp | Split: messy to organized

```
[MASTER STYLE PROMPT]
[JOSE PERSONA]
Scene: Split composition with a diagonal amber swoosh divider.
LEFT side: Jose — stocky man in his 50s, deep brown skin, greying hair, plain white
sando under open button-up — overwhelmed, surrounded by scattered receipts, crumpled
papers, calculator, messy desk. Worried expression, hand rubbing forehead.
Muted/desaturated colors. No mascot.
RIGHT side: Same Jose now smiling, clean organized desk, tablet showing neat dashboard
with charts, the yin-yang mascot floating helpfully nearby, vibrant warm colors.
Before/after transformation. 4:3 landscape.
```

#### #8 — ready.webp | Completion celebration

```
[MASTER STYLE PROMPT]
[MAYA PERSONA]
Scene: Maya — young petite Filipina in her early 20s, wavy hair, casual t-shirt —
standing confidently with one fist pumped in the air. The yin-yang mascot celebrating
beside her with confetti and sparkle accents, golden glow intensified. A smartphone
held up showing a completed setup checklist with green checkmarks. Amber swoosh curves
framing the scene. Celebratory, empowering mood. Confetti in amber and teal. 1:1 square.
```

---

### Empty States (4:3, 600x450px)

#### #9 — no-expenses.webp | Empty wallet + Kai peeking

```
[MASTER STYLE PROMPT]
Scene: An open empty wallet/folder on a clean desk. The yin-yang mascot peeking from
behind it with curious friendly expression. A few peso coin outlines scattered lightly.
Clean, uncluttered composition. Gentle, encouraging mood — not sad, just waiting.
Soft amber background swoosh. No human character. 4:3 landscape.
```

#### #10 — no-deadlines.webp | Clean calendar + Kai

```
[MASTER STYLE PROMPT]
Scene: A clean wall calendar or planner with empty date squares. The yin-yang mascot
sitting on top of the calendar, relaxed pose, its cream face smiling gently. A cup of
coffee nearby. Potted plant in corner. Calm, peaceful mood — everything is handled.
Soft morning light. No human character. 4:3 landscape.
```

#### #11 — no-replies.webp | Empty chat + Kai ready

```
[MASTER STYLE PROMPT]
Scene: A smartphone showing an empty chat/message interface with no messages. The
yin-yang mascot standing next to the phone, as if ready and eager to help. A speech
bubble outline (empty) floating above. Warm, inviting, anticipatory mood.
No human character. 4:3 landscape.
```

#### #12 — no-chat.webp | Kai waving

```
[MASTER STYLE PROMPT]
Scene: The yin-yang mascot at center, large and prominent — circular form with
amber/gold left half and silver/grey right half embracing, warm cream face with
squinted happy eyes and curved smile. Sparkle accents around. Soft golden glow behind.
Warm cream background with gentle amber swoosh. Simple, friendly, welcoming.
Minimal background elements — focus entirely on the mascot character. 4:3 landscape.
```

#### #13 — first-scan.webp | Phone with receipt camera

```
[MASTER STYLE PROMPT]
[NENA PERSONA]
Scene: Nena's hands — a stocky older woman's hands with worn skin — holding a
smartphone with camera viewfinder active, pointed at a Filipino official receipt (OR)
on a wooden sari-sari counter. Scan line or corner brackets visible on phone screen.
The yin-yang mascot peeking excitedly from behind the phone. A few other receipts
on the counter. Teal accent on scan UI elements. Encouraging first-time mood.
4:3 landscape.
```

---

### Status (4:3, 600x450px)

#### #14 — offline.webp | No signal, warm patient tone

```
[MASTER STYLE PROMPT]
Scene: The yin-yang mascot sitting patiently on a bench or chair, looking up at a
wifi symbol with an X through it. A window showing rain outside. Warm interior setting.
The mascot's face shows a calm, patient expression — not worried. Muted but still warm
color tones. A clock on the wall suggesting waiting. No human character. 4:3 landscape.
```

#### #15 — error.webp | Kai apologetic

```
[MASTER STYLE PROMPT]
Scene: The yin-yang mascot with an apologetic expression on its cream face — slight
frown, the amber and grey halves slightly drooped. A small broken gear or disconnected
plug icon nearby. Soft amber background. The mascot looks genuinely sorry but reassuring.
Warm tones maintained. No human character. 4:3 landscape.
```

#### #16 — session-expired.webp | Clock/timeout

```
[MASTER STYLE PROMPT]
Scene: A large circular clock showing 12 o'clock, with amber-colored sand falling like
an hourglass effect. The yin-yang mascot standing beside it, gesturing toward a door or
login screen. Warm but slightly faded colors suggesting passage of time. Gentle, not
alarming. No human character. 4:3 landscape.
```

---

### Celebrations (4:3, 600x450px)

#### #17 — first-expense.webp | First entry celebration

```
[MASTER STYLE PROMPT]
[NENA PERSONA]
Scene: Nena — stocky Filipina in her late 40s, dark morena skin, messy bun with grey
streaks, floral house dress — excitedly looking at her phone which shows a single
expense entry with a green checkmark. The yin-yang mascot beside her, golden glow
intensified, celebrating with tiny confetti bursts. A single receipt on the wooden
counter — neatly placed. Amber and teal confetti particles. Proud milestone moment.
4:3 landscape.
```

#### #18 — revenue-milestone.webp | Revenue goal + confetti

```
[MASTER STYLE PROMPT]
[KUYA RICO PERSONA]
Scene: Kuya Rico — tall broad-shouldered Filipino man in his late 40s, dark moreno skin,
receding salt-and-pepper hair, tucked-in polo shirt — arms raised in celebration.
Behind him a large dashboard screen showing an upward revenue chart reaching a goal line
marked with a star. The yin-yang mascot doing a jump celebration, golden glow bright.
Abundant confetti in amber, teal, and cream. Peso signs floating. Triumphant joy.
4:3 landscape.
```

#### #19 — streak.webp | Usage streak

```
[MASTER STYLE PROMPT]
[JOSE PERSONA]
Scene: Jose — stocky man in his 50s, deep brown skin, greying hair, open button-up
shirt — walking forward with determination, smartphone in hand. A flame/streak icon
made of amber/honey gradient alongside him. The yin-yang mascot running energetically
beside him, sparkle trail behind. A row of calendar days below showing checkmarks in a
streak pattern. Dynamic, motivating mood — momentum and consistency. 4:3 landscape.
```

---

## Marketing Images (6 extras)

### M1 — Facebook hero: "Hindi ka nag-iisa" | 16:9, 1200x675px

```
[MASTER STYLE PROMPT]
[NENA PERSONA]
Scene: Nena — stocky Filipina in late 40s, dark morena skin, messy bun, floral house
dress, towel over shoulder — leaning on her wooden sari-sari counter, looking at phone
with a relieved smile. The yin-yang mascot on the counter beside her, leaning in like
a trusted friend, golden glow soft and intimate. Store shelves with colorful sachets
and products behind. Warm morning light streaming through awning. Intimate, partnership
moment. 16:9 landscape.
```

### M2 — Blog header: BIR deadline stress | 16:9, 1200x675px

```
[MASTER STYLE PROMPT]
[TITA ROSA PERSONA]
Scene: Tita Rosa — plump Filipina in her mid-40s, warm brown skin, hair in bun, still
wearing her flour-dusted bakery apron — at a messy desk surrounded by BIR forms (1701Q,
2551Q) and a calculator. Clock on wall showing late evening. Stressed expression, hand
on forehead. Receipts piled up, some crumpled. No mascot in this scene — this is the
"before" pain state. Slightly desaturated warm tones. 16:9 landscape.
```

### M3 — Blog header: Receipt scanning solution | 16:9, 1200x675px

```
[MASTER STYLE PROMPT]
[BEN PERSONA]
Scene: Ben's hands — a young professional's hands — holding a smartphone scanning a
receipt. Phone screen shows the receipt being captured with teal scan line. Organized
desk with a laptop showing categorized expenses. The yin-yang mascot visible on the
laptop screen as an app icon. A coffee cup nearby, cafe setting. Clean, modern,
solution-focused. 16:9 landscape.
```

### M4 — Social: Morning briefing | 1:1, 600x600px

```
[MASTER STYLE PROMPT]
[KUYA RICO PERSONA]
Scene: Kuya Rico — tall broad Filipino man in his late 40s, dark moreno skin,
salt-and-pepper hair, tucked-in polo shirt — sitting at a small table in his store,
holding a tablet. On the tablet screen: a morning briefing card showing a greeting,
cash flow chart, and task list. Steam rising from a coffee cup. The yin-yang mascot
floating near the tablet with soft golden glow. Manila skyline through window. Calm,
productive morning mood. Golden hour lighting. 1:1 square.
```

### M5 — Social: Sari-sari store digital transformation | 1:1, 600x600px

```
[MASTER STYLE PROMPT]
[JOSE PERSONA]
Scene: Jose — stocky man in his 50s, deep brown skin, greying hair, white sando under
open button-up — standing proudly in front of his sari-sari store with traditional
wooden counter and hanging sachets. Holding a smartphone showing the AKBai app with
real-time cash flow. Boxes and products neatly arranged. The yin-yang mascot perched
on a product shelf, glowing warmly. Blend of traditional and digital. 1:1 square.
```

### M6 — Ad creative: Multi-feature showcase | 4:5, 600x750px

```
[MASTER STYLE PROMPT]
[MAYA PERSONA]
Scene: Maya — young petite Filipina in her early 20s, wavy hair with brown tips, casual
oversized t-shirt — at center surrounded by floating app feature cards arranged in a
circle: receipt scanner, cash flow chart, BIR calendar, chat messages, morning briefing
notification. Shipping boxes at her feet. The yin-yang mascot at her shoulder with
golden glow. Amber swoosh curves connecting the cards. Dynamic, feature-rich. 4:5 portrait.
```

---

## Future Build Images (8 — Builds 3, 8, Phase 1 launch)

### Resibo Scanner Flow (Build 3)

#### #20 — scan-in-progress.webp | Active scanning

```
[MASTER STYLE PROMPT]
[NENA PERSONA]
Scene: Nena — stocky Filipina in her late 40s, dark morena skin, messy bun, floral
house dress — holding her phone over a receipt on a wooden counter. Phone screen shows
the camera viewfinder with a teal scan line sweeping downward and corner brackets
framing the receipt. Small loading dots or progress indicator. The yin-yang mascot
floating beside the phone, leaning in to look at the screen with a focused expression.
Ambient glow from the phone screen. Anticipatory, "working on it" mood. 4:3 landscape.
```

#### #21 — scan-success.webp | Receipt captured successfully

```
[MASTER STYLE PROMPT]
[MAYA PERSONA]
Scene: Maya — young petite Filipina in her early 20s, wavy hair, casual t-shirt —
smiling at her phone which shows a green checkmark over a captured receipt image. Next
to the phone, a floating expense card is materializing (merchant name, amount in pesos,
category icon). The yin-yang mascot giving a thumbs-up gesture with sparkle accents.
Teal checkmark and card border. Clean, satisfying "success" moment. 4:3 landscape.
```

### Payment & Upgrade (Build 8)

#### #22 — paywall-upgrade.webp | Free vs Pro comparison

```
[MASTER STYLE PROMPT]
Scene: Split composition with an amber swoosh divider. LEFT side: a basic phone screen
showing limited features (greyed-out cards, a "10 queries/day" counter, no receipt
scanner), muted colors, the yin-yang mascot looking small and constrained. RIGHT side:
a vibrant phone screen showing the full AKBai dashboard with all features lit up
(receipt scanner, morning briefing, deadlines, reply drafter), bright warm colors, the
yin-yang mascot large and glowing with sparkle accents. A golden "PRO" badge floating.
Aspirational, "unlock your potential" mood. No human character. 4:3 landscape.
```

#### #23 — payment-success.webp | Subscription activated

```
[MASTER STYLE PROMPT]
[BEN PERSONA]
Scene: Ben — lean Filipino man in his early 30s, light-medium skin, fade haircut,
glasses, olive polo — looking at his phone with a relieved smile. Phone screen shows
a teal checkmark and "Pro Activated" message. The yin-yang mascot beside him doing a
small celebration with confetti. A GCash logo subtly visible. Golden "PRO" badge
floating above with sparkle accents. Satisfied, confident mood. 4:3 landscape.
```

### PWA Installation (Phase 1 Launch — Gap B7/D9)

#### #24 — pwa-install-guide.webp | Add to Home Screen

```
[MASTER STYLE PROMPT]
Scene: A smartphone being held at a slight angle, screen showing a browser share menu
with "Add to Home Screen" option highlighted in amber. An arrow pointing from the share
icon to the option. Below, the phone's home screen showing the AKBai app icon (yin-yang
mascot) newly placed among other app icons. The yin-yang mascot floating beside the
phone, pointing at the highlighted option encouragingly. Simple, instructional, step-by-
step mood. No human character — focus on the phone interaction. 4:3 landscape.
```

### Costing & Invoicing (Build 8)

#### #25 — costing-empty.webp | No costing cards yet

```
[MASTER STYLE PROMPT]
Scene: A clean kitchen scale or calculator on a counter, with a blank recipe card
beside it. A few ingredient items (eggs, flour bag, sugar) arranged neatly but unused.
The yin-yang mascot sitting on the scale, looking eager and ready with a small notepad.
Clean, uncluttered. Gentle encouraging mood — "let's figure out your margins." Warm
kitchen/bakery background. No human character. 4:3 landscape.
```

#### #26 — invoice-empty.webp | No invoices yet

```
[MASTER STYLE PROMPT]
Scene: A blank invoice template on a clipboard, sitting on a clean desk. A pen beside
it. The yin-yang mascot leaning against the clipboard, looking up with an encouraging
expression as if saying "ready when you are." A few peso coins nearby. Clean, minimal,
professional mood. Warm cream background with soft amber swoosh. No human character.
4:3 landscape.
```

### Marketing — Blog (Phase 0B)

#### #27 — blog-header-cashflow.webp | Cash flow visibility article

```
[MASTER STYLE PROMPT]
[KUYA RICO PERSONA]
Scene: Kuya Rico — tall broad Filipino man in his late 40s, dark moreno skin,
salt-and-pepper hair, tucked-in polo — standing in front of a large screen showing a
cash flow chart with clear "Cash In" (teal) and "Cash Out" (amber) lines over 6 months.
He's pointing at the chart with one hand, other hand holding a tablet. The yin-yang
mascot floating near the screen, also looking at the data. Background: his retail store
interior, shelves visible. Confident, informed mood. 16:9 landscape.
```

---

## Persona Rotation Guide

To ensure diversity across your full image set, track which persona you've used:

| Image | Persona | Gender | Age | Build | Status |
|-------|---------|--------|-----|-------|--------|
| #5 welcome | Group | Mixed | — | — | EXISTS |
| #6 business-type | ALL FOUR | Mixed | 20s-40s | Mixed | EXISTS |
| #7 pain-point | JOSE | M | 50s | Stocky | EXISTS |
| #8 ready | MAYA | F | 20s | Petite | EXISTS |
| #9-12 empty states | Kai only | — | — | — | EXISTS |
| #13 first-scan | NENA | F | 40s | Stocky | EXISTS |
| #14-16 status | Kai only | — | — | — | EXISTS |
| #17 first-expense | NENA | F | 40s | Stocky | EXISTS |
| #18 revenue-milestone | KUYA RICO | M | 40s | Tall/broad | EXISTS |
| #19 streak | JOSE | M | 50s | Stocky | EXISTS |
| #20 scan-in-progress | NENA | F | 40s | Stocky | EXISTS |
| #21 scan-success | MAYA | F | 20s | Petite | EXISTS |
| #22 paywall-upgrade | Kai only | — | — | — | EXISTS |
| #23 payment-success | BEN | M | 30s | Lean | EXISTS |
| #24 pwa-install-guide | Kai only | — | — | — | EXISTS |
| #25 costing-empty | Kai only | — | — | — | EXISTS |
| #26 invoice-empty | Kai only | — | — | — | EXISTS |
| #27 blog-cashflow | KUYA RICO | M | 40s | Tall/broad | EXISTS |
| M1 facebook | NENA | F | 40s | Stocky | EXISTS |
| M2 BIR stress | TITA ROSA | F | 40s | Plump | EXISTS |
| M3 scanning | BEN | M | 30s | Lean | EXISTS |
| M4 morning | KUYA RICO | M | 40s | Tall/broad | EXISTS |
| M5 sari-sari | JOSE | M | 50s | Stocky | EXISTS |
| M6 multi-feature | MAYA | F | 20s | Petite | EXISTS |

**All 33 images exist.** Full coverage across all builds and marketing.

---

## Tips for Consistency

| Issue | Fix |
|-------|-----|
| Gemini adds text/words in image | Regenerate, or add "absolutely no text, no words, no letters, no labels" to prompt |
| Kai mascot looks wrong | Use full description: "a yin-yang shaped circular character with amber/gold left half and silver/grey right half embracing each other, warm cream face at center with squinted happy eyes (curved lines not dots) and gentle curved smile, soft golden glow behind it" |
| Mascot looks like a simple smiley | Add "the two halves wrap around each other like a yin-yang symbol, representing an embrace" |
| Mascot missing silver/grey half | Emphasize "TWO-TONED: amber/gold on left, silver/grey on right, both halves visible" |
| Characters all look the same | Always include specific age, build, skin tone, hair, and clothing from the persona block — never say just "Filipino business owner" |
| Everyone wearing aprons | Only Tita Rosa wears an apron (baker). Others wear their persona-specific clothing |
| Body types too similar | Explicitly state build: "stocky," "petite," "plump," "tall and broad-shouldered," "lean" |
| Skin tones too uniform | Specify: "deep dark morena," "light-medium kayumanggi," "warm brown," etc. |
| Ages all look 25-35 | Specify exact age + physical markers: "grey streaks," "laugh lines," "crow's feet," "receding hairline" |
| Colors too saturated | Add "soft, muted warm tones, pastel-adjacent" |
| Too much detail/realism | Add "simple flat shapes, minimal detail, icon-like simplicity" |
| Background too busy | Add "clean negative space, minimal background elements" |

## Post-Processing Checklist

- [ ] Exported at 2x resolution (e.g., 1200x900 for 600x450 target)
- [ ] Converted to WebP at 80% quality
- [ ] No text artifacts in image (regenerate if present)
- [ ] Kai mascot is recognizable (yin-yang shape, two-toned, smiling face)
- [ ] Character matches assigned persona (check age, build, clothing, skin tone)
- [ ] Character is visually distinct from other images in the set
- [ ] Color palette matches existing images (cream bg, amber, teal)
- [ ] Saved to correct directory: `frontend/public/illustrations/{category}/`
- [ ] Updated `illustration-guide.md` status from "TO GENERATE" to "EXISTS"
