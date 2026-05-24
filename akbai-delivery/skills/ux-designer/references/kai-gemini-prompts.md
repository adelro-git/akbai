# Kai Character — Gemini Image Prompt Library

> **Status:** Draft v1 (2026-05-24, Sprint 13). Iterate during Sprint 14.
> **Used by:** Anton (solo, iterating in Gemini), ux-designer skill, marketing-lead skill
> **Replaces:** Earlier human-illustrator brief (deprecated 2026-05-24 — Anton uses Gemini for image generation)
> **Output target:** 8 PNG poses at 512×512 minimum, saved to `frontend/public/icons/kai/kai-{pose}-{variant}.png`

---

## How to Use This Document

1. **Copy the "Character DNA preamble" (Section 1) into every Gemini prompt, unchanged.** This is what keeps Kai looking like Kai across all 8 poses. Even a small variation in this preamble causes character drift.
2. **Append one pose-specific prompt block (Section 2-9) per generation.** Each block defines pose, scenario, framing.
3. **Append the negative prompt block (Section 10) to every generation.** This cuts the failure modes Gemini defaults to (realistic photo, anime, kitsch).
4. **Generate pose 1 first. Iterate until it reads as Kai.** Then move to pose 2, using pose 1 as visual reference if Gemini's UI supports image-input. Don't generate all 8 at once — drift accumulates.
5. **If a pose won't converge after ~5 iterations, fall back to the existing `kai-mark.png` for that surface and document the failure here for future iteration.**
6. **Save outputs to `frontend/public/icons/kai/kai-{pose}-01.png`.** If you generate multiple acceptable variants, use `-02`, `-03`. Section 18 integration picks one variant per surface.

---

## Section 1 — Character DNA Preamble (PASTE IDENTICALLY INTO EVERY PROMPT)

```
Generate a 2D illustrated character named "Kai" — a friendly AI business companion for Filipino entrepreneurs. Character design specifications (MUST be consistent across all generations):

HEAD: A perfectly round circle, like a yin-yang inspired form, in warm honey-gold gradient (deep amber #f59e0b at the bottom blending to lighter honey #ffb95f at the top). The head is the most prominent feature.

FACE: Two curved happy closed eyes shaped like upward-arching crescents (like ")(" or smiling crescent moons), and a gentle smile arc below the eyes. Eyes and smile are rendered in solid bright amber-orange (#f59e0b). No other facial features — no nose, no eyebrows, no ears, no separate mouth detail.

BODY: Soft rounded body shape below the head, in matching warm honey gradient. Body is smaller than the head (head:body ratio about 1:0.8) for a friendly, slightly chibi appearance. Two soft rounded arms emerge from the body — arms are short and tube-shaped, ending in simple rounded mitten-like hands (no fingers).

STYLE: 2D flat illustration, soft cel-shaded, ambient warm-amber tinted glow shadows (never grey or black shadows). No outlines, no line art — forms are defined by color shifts only ("no-line rule"). Soft rounded edges everywhere; never sharp or angular.

COLOR PALETTE: Background is warm cream #fdf9f2 (sun-drenched, never pure white). Kai's body uses warm honey gradient (#f59e0b to #ffb95f). Eyes and smile are bright primary amber #f59e0b. Subtle ambient amber glow surrounds the character (never grey drop shadows).

PERSONALITY (must read visually): warm, approachable, knowledgeable, calm. Like a gentle older sibling who knows what they're doing. Never childish, never corporate, never anime-styled.

CULTURAL CONTEXT: Filipino brand mascot (for an AI business app), but NOT visually stereotypical Filipino. No barong, no jeepney, no Filipino flag colors. The Filipino-ness is in the warmth and approachability, not in costume.

Now render Kai in this specific pose:
```

---

## Section 2 — Pose 1: Idle / Warm Greeting

**Append to Character DNA preamble:**

```
POSE: Kai stands facing forward, body slightly tilted to one side in a relaxed pose. One arm gently raised in a small waving gesture, hand at about shoulder height. The other arm rests at the side. Smile is gentle and warm. Eyes are softly curved upward (happy).

FRAMING: Full body visible, centered in frame. Background is solid warm cream #fdf9f2 with a subtle ambient amber glow behind Kai. No other elements in the scene.

USE: This is Kai's default greeting pose, used in onboarding screens, morning briefings, and the home dashboard.

OUTPUT: 512×512 PNG, character centered, ample whitespace around the figure.
```

---

## Section 3 — Pose 2: Excited / Celebrating

**Append to Character DNA preamble:**

```
POSE: Kai with both arms raised joyfully above the head in a celebration gesture, like cheering. Body is in a slight upward bouncing pose (suggesting a small jump). Eyes are squeezed into happy upward crescents (more pronounced curve than idle). Smile is wider — fuller arc.

FRAMING: Full body visible, centered. A few small celebratory motion lines or sparkles around Kai (subtle, in warm amber tone, never sharp or harsh).

USE: Sales milestones, deadline-met confirmations, achievement moments.

OUTPUT: 512×512 PNG, character centered, ample whitespace.
```

---

## Section 4 — Pose 3: Thinking

**Append to Character DNA preamble:**

```
POSE: Kai with one hand raised to the side of the head (like a "hmm, let me think" gesture). Body is slightly tilted to the side. Eyes are still curved but slightly less pronounced (more contemplative). Smile is smaller, more subtle.

FRAMING: Full body visible, centered. Optional: a single soft amber thought bubble or question-mark shape floating above Kai (very subtle, in warm honey tone). Background warm cream with ambient amber glow.

USE: Loading states, AI processing ("Nag-iisip si Kai..."), moments where Kai is calculating.

OUTPUT: 512×512 PNG, character centered, ample whitespace.
```

---

## Section 5 — Pose 4: Concerned (Supportive, Not Panicked)

**Append to Character DNA preamble:**

```
POSE: Kai with hands clasped softly in front of the body in a concerned-but-supportive gesture (like "I'm here for you"). Body is slightly leaning forward (engaged, attentive). Eyes are gently curved but more level (less upward-arch — softer concern, not alarm). Smile is smaller, more reassuring than joyful.

FRAMING: Full body visible, centered. NO alarming visual elements (no red, no exclamation marks, no panic indicators). Background warm cream with subtle ambient amber glow.

USE: Cash flow warnings, missed deadlines, supportive moments where Kai needs to flag a concern without scaring the user.

OUTPUT: 512×512 PNG, character centered, ample whitespace. Mood: gentle concern, never alarm.
```

---

## Section 6 — Pose 5: Proud

**Append to Character DNA preamble:**

```
POSE: Kai standing tall and confident, chest slightly puffed, both hands resting on the hips in a "look at what we did" stance. Eyes are warmly curved (happy + proud). Smile is gentle, satisfied — not boastful, but genuinely pleased.

FRAMING: Full body visible, centered. Optional: a soft amber glow halo behind Kai (a bit brighter than the default ambient glow). Background warm cream.

USE: Weekly story (Kuwento), monthly milestones, completion celebrations.

OUTPUT: 512×512 PNG, character centered, ample whitespace.
```

---

## Section 7 — Pose 6: Akbay (Arm Around)

**Append to Character DNA preamble:**

```
POSE: Kai with one arm extended outward and slightly upward, as if putting an arm around someone's shoulder ("akbay" — the Filipino gesture of warm companionship that gives Kai its name). The arm reaches toward the right edge of the frame. The other arm rests at the side. Body is angled toward where the arm extends (slight turn, suggesting genuine engagement with whoever is beside Kai). Eyes warmly curved, smile gentle.

FRAMING: Full body visible, slightly off-center to the left so the extended arm has room to reach right. Background warm cream. The empty space to the right of Kai is intentional — it suggests the place where the user "stands."

USE: First-run welcome screens, support contexts, "you're not alone" moments. This is Kai's most brand-defining pose.

OUTPUT: 512×512 PNG, Kai positioned slightly left-of-center.
```

---

## Section 8 — Pose 7: Pointing

**Append to Character DNA preamble:**

```
POSE: Kai with one arm extended forward and slightly upward, hand pointing (mitten-shape with subtle direction indication — no individual fingers needed, but the hand shape clearly suggests "look here"). The other arm rests at the side. Body is in a "showing you" stance — slightly leaning toward the pointing direction. Eyes warmly curved, smile gentle and encouraging.

FRAMING: Full body visible, slightly off-center (opposite to the pointing direction — so if pointing right, Kai is positioned left). Background warm cream.

USE: Tutorial steps, feature highlights, "heto na ang gagawin mo" (here's what you do) moments.

OUTPUT: 512×512 PNG, Kai positioned to give space for the pointing direction.
```

---

## Section 9 — Pose 8: Resting / Asleep

**Append to Character DNA preamble:**

```
POSE: Kai in a sitting or curled-up resting pose, eyes fully closed (gentle horizontal crescents, like sleeping eyes — slightly downward curve). A small soft "Z" or sleep symbol floats above the head (in subtle warm amber, very small). Body is relaxed, arms tucked in or wrapped softly around the body.

FRAMING: Full body visible, centered. Background warm cream with very soft ambient amber glow (slightly dimmer than other poses — suggesting a quieter moment).

USE: Quiet hours, "Kai is recharging" empty states, off-hour interactions, low-activity dashboards.

OUTPUT: 512×512 PNG, character centered, ample whitespace, slightly dimmer overall lighting.
```

---

## Section 10 — Negative Prompt Block (APPEND TO EVERY GENERATION)

```
NEGATIVE PROMPT (do NOT generate any of these):
- photorealistic style, realistic photo, 3D render
- anime, manga, chibi-anime, big sparkly anime eyes
- western cartoon style (Looney Tunes, Disney early-2000s)
- sharp angular shapes, geometric polygons, low-poly
- line art, outlined illustration, sketchy linework, ink lines, black outlines
- grey shadows, hard drop shadows, harsh shadows
- gendered features (no eyelashes, no beard, no traditionally feminine/masculine clothing)
- Filipino visual stereotypes (no barong, no jeepney, no Filipino flag, no rice hat)
- aggressive expression, neutral/blank expression, angry expression
- text in the image, watermarks, signatures
- multiple characters in frame (single Kai only, unless explicitly hero shot)
- backgrounds with detail (keep background simple warm cream + ambient glow)
- bright/saturated non-amber colors (no blues, greens, purples, reds dominant)
- realistic human features (no nose, no separated mouth, no ears, no hair)
```

---

## Section 11 — Hero Shot Prompt (for store listings + landing page)

**This is a more complex prompt with two characters. Generate after locking the 8 base poses.**

```
[Paste Character DNA preamble from Section 1]

POSE: Kai (matching the locked character design) is sitting beside a Filipino MSME owner (a 35-year-old woman with warm friendly features, simple casual modern clothes — t-shirt and jeans, NOT in barong or formal Filipiniana attire — gentle smile, holding a smartphone in her hands). Kai has one arm extended in the akbay gesture, resting on the woman's shoulder. Both are looking together at the phone screen with engagement. The woman's expression is calm, slightly hopeful, content — like she just understood something useful.

SCENE: They are seated together at a simple wooden desk or small kitchen counter (suggesting a home-based business setting). Background includes a subtle hint of a Filipino sari-sari store or freelance workspace (very subtle, not the focus — could be a small shelf with a few products, or papers on the desk). Lighting is warm afternoon sun (consistent with the warm cream + honey amber color palette). Background warm cream with golden-hour ambient lighting.

FRAMING: Both characters visible from waist up, centered in frame. The phone in the woman's hands is visible but the screen content is intentionally non-specific (subtle warm-colored UI suggestion, no readable text).

MOOD: Quiet confidence, partnership, "I'm not alone in this business" feeling. Warm, intimate, hopeful.

NEGATIVE PROMPT (do NOT generate):
- photorealistic style, 3D render
- anime, manga
- Filipino visual stereotypes (no barong on the woman, no jeepney background, no rice hat)
- harsh lighting, dramatic shadows, bright/saturated non-warm colors
- text in the image, app screenshots with visible UI elements
- aggressive or dramatic poses
- corporate office settings, suits, formal business attire on the woman
- multiple women or men around them

OUTPUT: 1024×1024 PNG (higher resolution for store listing use), warm honey-cream palette, centered composition.
```

---

## Section 12 — Iteration Guide

If a generation isn't quite right, vary these levers in this order:

| If the issue is... | Vary this in your prompt |
|---|---|
| Kai's head shape is wrong (oval, square, etc.) | Strengthen "perfectly round circle" in DNA preamble; add "the head must be a perfect circle" to the pose-specific prompt |
| Eyes/smile rendering as actual eye + mouth | Strengthen "curved crescents, no other facial features" and add "stylized abstract face — eyes are simple closed crescents, mouth is a single smile arc, no realistic features" |
| Body is too realistic / too anime | Strengthen the "2D flat cel-shaded illustration, never anime, never realistic" line in DNA preamble; add "simple flat illustrated body, like a corporate brand mascot, not character art" |
| Colors are off (too saturated, too dark, too cool) | Be more explicit about hex codes; add "exact color: warm honey amber #f59e0b" |
| Background is too detailed | Add "background must be completely empty warm cream color #fdf9f2 with only a subtle ambient amber glow — no other details, no objects, no patterns" |
| Character doesn't read as Kai across generations | Drop in the previous successful pose as a reference image (if Gemini UI supports image input); strengthen the DNA preamble |
| Kai has fingers / shoes / outfit | Add explicit negative: "no fingers, no shoes, no clothing, no outfit — Kai is a pure illustrated character with no garments or accessories" |
| Pose doesn't read clearly | Be more cinematographically explicit: describe what each arm/leg is doing, body angle, head tilt, eye direction |
| Output is wrong aspect ratio | Add at the end: "Square 1:1 aspect ratio, 512×512 pixels" |

---

## Section 13 — Consistency Tactics

**Most important: keep the Character DNA preamble (Section 1) byte-for-byte identical across every generation.** Even small wording changes can shift the model's interpretation enough to break consistency.

**Tactic 1 — Reference image input:** If Gemini's UI supports uploading a reference image with your prompt, upload `frontend/public/icons/kai-mark.png` (the existing 512×512 mark) every time. This anchors Kai's eyes + smile rendering. After locking pose 1, use the pose 1 output as the reference for pose 2, and so on.

**Tactic 2 — Same session:** Generate all 8 poses in the same Gemini conversation/session if possible. Models often maintain better consistency within a single session than across new sessions.

**Tactic 3 — Seed reuse:** If Gemini exposes generation seeds (some versions do), use the same seed across pose generations. This locks style coherence even if pose varies.

**Tactic 4 — One pose at a time:** Don't try to batch-generate. Lock pose 1 first. Then pose 2. Iterate per-pose to convergence before moving on.

**Tactic 5 — Pose 7 (akbay) is the hardest to keep consistent** because it's compositionally the most unusual. Save it for after you have 4-5 other poses locked in — by then your iteration intuition for Kai will be sharper.

**Tactic 6 — Reject + regenerate quickly.** Gemini is fast and free at this scale. If a generation is 70% there but the eyes are slightly wrong, regenerate rather than accepting drift. Three rounds of regeneration is usually enough.

---

## Section 14 — Output Saving Convention

Save final accepted generations to:

```
frontend/public/icons/kai/
├── kai-idle-01.png             # Section 2
├── kai-excited-01.png          # Section 3
├── kai-thinking-01.png         # Section 4
├── kai-concerned-01.png        # Section 5
├── kai-proud-01.png            # Section 6
├── kai-akbay-01.png            # Section 7
├── kai-pointing-01.png         # Section 8
├── kai-resting-01.png          # Section 9
└── kai-hero-msme-01.png        # Section 11 (1024×1024)
```

If you generate multiple acceptable variants of a pose, use `-02`, `-03` suffixes. Sprint 18 integration work picks the best variant per surface.

---

## Section 15 — Failure Log

> Empty. Populate during Sprint 14 iteration with any poses that fail to converge after 5+ regeneration attempts.

Format:
```
### Pose X (date) — failure notes
- What went wrong: …
- What was tried: …
- Decision: fall back to existing `kai-mark.png` for this surface; revisit in Sprint Y
```

---

*Document prepared 2026-05-24 by Claude Code under Anton's direction. Iterate freely; this is a working artifact, not a fixed spec.*
