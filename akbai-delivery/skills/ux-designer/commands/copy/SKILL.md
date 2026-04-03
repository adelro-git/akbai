---
name: /copy
description: >
  Write Taglish UI copy for specified context — chat bubbles, labels, error messages,
  CTAs, notifications, empty states, onboarding text. Generates 2–3 tone variants per
  element with character counts and persona appropriateness checks. Triggers: "write copy",
  "button text", "error message", "notification", "empty state", "CTA", "chat bubble",
  "label", "placeholder", "microcopy", "Taglish copy", "help text".
---

# /copy — Write Taglish UI Copy

Generate Taglish UI copy for chat bubbles, buttons, notifications, error messages, empty states, and all user-facing text in AKBai.

## Before Starting

Read these shared context files:
- `/AKBai/akbai-delivery/shared/brand-context.md` — Voice pillars, tone calibration by context, Kai says/never says
- `/AKBai/akbai-delivery/shared/glossary.md` — Taglish terms, product names (Resibo Scanner, Saan Napunta, etc.)
- `/AKBai/akbai-delivery/shared/project-context.md` — Personas (Maria, Jose, Ana, Andoy), BIR disclaimer requirement
- `../references/taglish-manual.md` — **Authoritative source** for how Kai speaks. Real-world Taglish examples. Use this first.
- `../references/taglish-copy-guide.md` — Fallback if manual not available. Tone patterns and do/don't examples.

Also read: `/AKBai/akbai-delivery/skills/ux-designer/SKILL.md` (Chat + Card patterns, microcopy constraints).

## Workflow

### 1. Identify the Copy Context

Ask or infer:
- **What screen/flow?** (Onboarding, Dashboard, receipt scan confirmation, error state, empty state, notification, etc.)
- **What element?** (Chat bubble, button label, field placeholder, error message, status tag, empty state, notification text, etc.)
- **What's the user's emotional state?** (Frustrated? Confident? Confused? Celebrating?)
- **Who's the persona?** (Maria, Jose, Ana, or Andoy? Different personas need different tone.)
- **Is it financial/BIR-related?** (Requires disclaimer + "po" usage)
- **Does it need a CTA?** (Button text? Link text?)

### 2. Read Taglish References

1. **First:** `taglish-manual.md` — Look for examples matching your use case. If found, follow the pattern exactly.
2. **Fallback:** `taglish-copy-guide.md` — Use tone calibration table + do/don't examples.
3. **Last resort:** `brand-context.md` §8 Voice Examples — Study Kai says/never says.

### 3. Generate 2–3 Copy Variants

For each element, write 2–3 variants with slightly different tone:

**Variant A:** Casual + warm (more Filipino, emotive)
- When: Personal milestones, celebrations, morning briefings
- Tone: Like texting a friend who cares

**Variant B:** Balanced + professional (mix of Filipino and English, neutral emotion)
- When: Most transactional copy — confirmations, status updates, deadlines
- Tone: Smart partner, not condescending

**Variant C:** Urgent + careful (formal-ish, respectful, clear)
- When: Errors, security issues, BIR deadlines, things users might miss
- Tone: Respectful alarm, not panic

### 4. Annotate Each Variant

For each variant, provide:

```
**Variant A (CASUAL):**
"Ay! ₱100,000 na pala ang sales mo this month! 🎉"
- **Character count:** 52 (fits in 1 chat bubble, ~14 max)
- **Tone notes:** Celebratory, personal, uses "Ay!" (Filipino exclamation)
- **Persona fit:** Perfect for Maria (home baker), Jose (online seller). NOT condescending for Andoy.
- **Device fit:** Mobile-first, emoji allowed for celebration moments
- **BIR/Financial:** N/A

**Variant B (BALANCED):**
"Ang sales mo this month: ₱100,000. Magaling!"
- **Character count:** 41
- **Tone notes:** Warm acknowledgement, restrained emoji use, uses Filipino verb + English noun
- **Persona fit:** All personas. Appropriate for formal contexts.
- **Device fit:** 1 bubble, clear on small screens
- **BIR/Financial:** N/A

**Variant C (URGENT/FORMAL):**
"Your sales this month: ₱100,000."
- **Character count:** 35
- **Tone notes:** Clear, numeric, professional. Use ONLY if paired with analytical next message.
- **Persona fit:** Works but risks feeling cold. Reserve for technical contexts only.
- **Device fit:** Works as part of dashboard card (not chat bubble)
- **BIR/Financial:** N/A
```

### 5. Apply Taglish Rules Rigorously

**Every variant must pass these checks:**

✓ **More Filipino when personal/emotional, more English when technical**
  - Personal: "Maganda ang gastos mo ngayong buwan." (Filipino emphasis)
  - Technical: "Expense category detected: Supplies." (English clarity)

✓ **"Po" usage — natural, not mechanical**
  - BIR topics: "Ang 1701Q mo po, due na sa Friday."
  - Sensitive data: "Gusto mo po i-verify ang receipt?"
  - Older personas (Andoy, Maria): More "po"
  - Gen-Z personas (Ana, Jose): Less "po"
  - **Never:** "Po" at the end of every sentence (sounds robotic)
  - **Always:** "Po" when being respectful about compliance/money/privacy

✓ **Numbers: Always digits with ₱ symbol**
  - ✓ "₱18,400" (formatted, peso sign, no spaces)
  - ✗ "eighteen thousand four hundred pesos"
  - ✗ "PHP 18400" (use ₱, not PHP; use comma separator)
  - ✗ "$18,400" (use ₱, never $)

✓ **Max 2 lines per chat bubble**
  - One long sentence or two short sentences, not three
  - Reason: Mobile screen real estate, readability, Kai feels conversational

✓ **No corporate filler**
  - ✗ "Certainly!" / "As an AI..." / "I'd be happy to..." / "I understand you want..." / "Please find attached..."
  - ✓ "Sure, saving na." / "Got it." / "Check the link above."

✓ **Use first name when available**
  - "Good morning, Maria!" (not "Good morning" or "Magandang umaga")
  - Only if name is known; don't assume

✓ **Condescension check**
  - For Andoy (sari-sari store owner, 40–55, traditional retail):
    - ✗ "Let me explain how receipts work..." (talks down)
    - ✓ "Naka-save na ang receipt mo sa Supplies category." (factual, respectful)
  - For Maria (home baker, 35–45, GCash savvy):
    - ✗ "This might be confusing, but..." (underestimates)
    - ✓ "Receipt scan: ₱3,450 sa flour. OK na ba?" (trusts her judgment)

✓ **Consistency with Kai brand**
  - Does it match the Kai Says examples in brand-context.md?
  - Does it avoid the Kai Never Says?

### 6. Check Persona Appropriateness

For each variant, rate fit for all 4 personas:

| Persona | Fit | Notes |
|---------|-----|-------|
| Maria (home baker, 35–45) | ✓ Good | [reason] |
| Jose (online seller, 28–35) | ✓ Good | [reason] |
| Ana (freelancer, 25–30) | ✓ Good | [reason] |
| Andoy (sari-sari owner, 40–55) | ⚠ Caution | [reason — does it sound condescending? unfamiliar?] |

### 7. BIR/Financial Disclaimer Requirement

**If copy involves:**
- Tax calculations
- BIR deadlines
- Fileable forms (1701Q, 1701, etc.)
- Official Receipt generation
- Tax advice or guidance

**Then include disclaimer (in same bubble or following):**
"Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo."

**Position:** After the main message, in a smaller text or separate note. Never buries the key info.

### 8. Mobile-First Constraints

- **Max width:** 90vw (4–5px margin on mobile)
- **Line height:** 1.5 (readable on small screens)
- **Emoji:** Sparingly (celebrations, milestones only — not every message)
- **Special characters:** Test on Android (different fonts). Avoid fancy quotes, dashes.
- **Button labels:** 2–3 words max, action-oriented
  - ✓ "I-save na" / "Mag-upload" / "I-confirm"
  - ✗ "Please proceed to save this record" / "Process"

### 9. Output Format

Present copy variants in a table structure for clarity:

```markdown
## [Context: e.g., "Morning Briefing Opening Message"]

### Element: [Chat Bubble / Button Label / Error Message / etc.]

| Variant | Copy | Characters | Tone | Personas | Notes |
|---------|------|-----------|------|----------|-------|
| A (Casual) | "Magandang umaga, Maria! ₱18,400 ang net mo yesterday. Kumikita!" | 65 | Warm, celebratory | ✓ All | Use when user had a great day |
| B (Balanced) | "Good morning, Maria! Yesterday you earned ₱18,400 net. Nice!" | 62 | Warm, professional | ✓ All | Balanced default |
| C (Formal) | "Earnings summary — yesterday: ₱18,400 net." | 41 | Clear, minimal | ⚠ Use sparingly | Technical context only |

**Recommendation:** Use Variant B (Balanced) as default for most contexts. Variant A for celebrations/milestones. Variant C for errors or when space is critical.

**BIR/Financial:** This is earnings data; NO disclaimer needed here (data reporting, not advice).

**Mobile fit:** All variants fit in 1–2 bubbles on iPhone 12 mini (375px). ✓ Approved.
```

## Examples

### Example 1: Receipt Scan Confirmation (Maria, home baker)

**Context:** User just scanned a receipt for flour. Kai shows the parsed data and asks for confirmation before saving.

```markdown
## Receipt Scan — Ingredient Expense

### Element: Confirmation Chat Bubble

| Variant | Copy | Char | Tone | Personas | Notes |
|---------|------|------|------|----------|-------|
| A (Casual) | "Got it! ₱3,450 sa flour — tama ba? I-save ko na after you confirm." | 72 | Friendly, action-ready | ✓ Maria, Jose, Ana; ⚠ Andoy | Conversational, shows trust |
| B (Balanced) | "Scanned: ₱3,450 Supplies (flour). Save okay?" | 45 | Efficient, clear | ✓ All | Shorter, still warm |
| C (Urgent) | "Expense logged: ₱3,450 Supplies. Confirm?" | 42 | Very direct | ⚠ Use if scanning rapidly | Terse, may feel robotic |

**Recommendation:** A or B. A feels more partnered; B is faster for high-volume scanners.

**Mobile fit:** All fit 1 bubble ✓

**BIR/Financial:** Expense categorization, NOT tax advice; NO disclaimer.
```

### Example 2: BIR Deadline Alert (All personas)

**Context:** User has a BIR 1701Q filing due in 3 days. Push notification or in-app reminder.

```markdown
## BIR Deadline Notification

### Element: Push Notification + Follow-up Chat Bubble

| Variant | Copy | Char | Tone | Personas | Notes |
|---------|------|------|------|----------|-------|
| A (Casual) | "Heads up! BIR 1701Q mo, 3 days na lang. Ready na ba? Tara, i-check natin." | 75 | Urgent but encouraging | ✓ All | Taglish with action verb "tara" |
| B (Balanced) | "Reminder: BIR 1701Q due in 3 days. Check your filing checklist here." | 68 | Professional, actionable | ✓ All | Clear, link-ready |
| C (Formal) | "Action required: BIR 1701Q filing due 22 March. Review requirements po." | 70 | Urgent, respectful | ✓ Andoy, Maria | "Po" for respect on compliance |

**Recommendation:** A (shows care) or B (most professional).

**Mobile fit:** All fit 1 bubble ✓

**BIR/Financial:** YES — add disclaimer after the main message.

**Disclaimer version:**
"Ito ay reminder lamang. Kumonsulta sa CPA mo para sa filing requirements at deadline confirmation po."
```

### Example 3: Error State (Receipt Not Clear Enough)

**Context:** User tried to scan a receipt but the image is too blurry. Kai can't parse it and asks for a manual entry.

```markdown
## Receipt Scan — Failed OCR

### Element: Error Message + Recovery Path

| Variant | Copy | Char | Tone | Personas | Notes |
|---------|------|------|------|----------|-------|
| A (Patient) | "Medyo blurry ang receipt, sorry! Puwede mo ba i-type ang amount and date? I-set mo lang." | 86 | Apologetic, helpful, not blaming | ✓ All | "Sorry" = takes responsibility |
| B (Direct) | "Can't read this receipt clearly. Try: 1) Take a new photo in better light, or 2) Enter manually." | 95 | Efficient, offers two paths | ✓ Jose, Ana; ⚠ Andoy | Clear options, English-forward |
| C (Gentle) | "Receipt namin ay hindi malinaw po. Can you retake the photo with better lighting?" | 76 | Respectful, specific ask | ✓ Andoy, Maria | "Po" softens the bad news |

**Recommendation:** A (warmest, no blame) or C (respectful).

**Mobile fit:** All fit 1–2 bubbles ✓

**BIR/Financial:** N/A (user is fixing data, not receiving advice).

**Mobile consideration:** Variant B is longest; may wrap to 3 lines on small phone. Consider breaking into two bubbles:
- First: "Can't read this receipt clearly."
- Second: "Try: (1) Better lighting, or (2) Type manually."
```

## Tips for Success

1. **Read taglish-manual.md first.** If it exists, use it as the primary source for tone and phrasing.
2. **Test persona fit.** Read each variant aloud as if you're Andoy (40–55, traditional retail mindset). Would he feel talked down to?
3. **Mobile-first always.** If copy looks long, break into 2 bubbles instead of 1 long wall of text.
4. **"Po" is a respect marker, not filler.** Use it strategically on BIR topics, when asking for personal data, or when addressing older personas.
5. **Numbers tell the story.** ₱18,400 is more concrete than "high earnings." Always show the ₱ and use comma separators.
6. **Avoid corporate filler.** If you find yourself typing "I understand" or "Certainly," delete it and start over.
7. **When in doubt, ask:** Does this copy sound like a text from a smart friend? Or a corporate chatbot? If the latter, rewrite.
8. **BIR disclaimer is non-negotiable.** If the copy involves taxes, deadlines, or filings, include the disclaimer. Never omit.

## Cross-Skill Handoffs

If you need:
- **UI/UX layout or mobile constraints?** Delegate to `/ux-designer` skill.
- **Compliance review on BIR language?** Delegate to `/compliance` command in security-compliance skill.
- **Tone check against brand voice?** Delegate to `marketing-lead` skill.

Otherwise, own the copy generation end-to-end.
