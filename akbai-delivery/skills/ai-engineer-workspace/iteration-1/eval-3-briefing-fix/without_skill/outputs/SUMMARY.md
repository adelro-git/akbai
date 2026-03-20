# KA Morning Briefing Fix — Summary

## Task Completed
Fixed "Ang Umaga Mo" (Your Morning) — KA's morning briefing prompt to sound warm, personal, and encouraging instead of robotic and dashboard-like.

---

## The Problem
**Original output:**
```
Good morning Maria. Yesterday income: PHP 5,200. Yesterday expenses: PHP 3,100. Net: PHP 2,100. BIR deadline: 1701Q due April 25. Tasks: none.
```

**Issues:**
- Reads like a system notification, not a warm partner checking in
- Uses "PHP" instead of ₱; no thousand separators
- No context for deadlines (how many days until April 25?)
- Doesn't celebrate the ₱2,100 profit (even small wins matter)
- Completely robotic tone; zero Taglish warmth
- Missing BIR disclaimer
- Doesn't handle no-transaction days gracefully

---

## The Solution
Created a **comprehensive, brand-aligned briefing prompt** that:

✅ **Sounds like KA** — Taglish, warm, proactive, encouraging
✅ **Uses proper formatting** — ₱5,200 (not PHP 5200)
✅ **Celebrates wins** — Even ₱2,100 profit gets a "Nice doon!"
✅ **Provides context** — "41 days pa" (not just "April 25")
✅ **Collaborative tone** — "let's gather receipts na" (not commands)
✅ **Handles edge cases** — Zero transactions, urgent deadlines, milestones
✅ **Includes disclaimer** — Legal protection for tax advice
✅ **Mobile-first** — Short sentences, scannable structure
✅ **Personalized** — Uses first name, references business type

---

## Deliverables

### 1. **morning-briefing-prompt.md** (255 lines)
Complete system prompt for KA's morning briefing. Includes:
- Tone and voice guidelines (Taglish, warm, direct)
- Briefing structure (warm opening → financial summary → priorities → closing nudge)
- Currency and BIR rules (₱ formatting, deadline phrasing, disclaimer)
- No-transaction handling (graceful fallback)
- 4 detailed scenario examples
- Implementation notes (data requirements, personalization hooks, A/B testing)
- What KA must NOT do (anti-patterns)

### 2. **example-outputs.md** (341 lines)
Real-world examples of KA's briefing output. Shows:
- 7 different user scenarios (Maria, Jose, Ana, Andoy at different transaction states)
- Before/after comparison (robotic vs. warm)
- Tone calibration by situation (good day, slow day, urgent deadline, milestone)
- Key tone signals (warm openings, profit celebration levels, BIR urgency tiers)
- Technical implementation notes (required variables, conditional logic)
- Why the new version is better (persona, brevity, accuracy, encouragement, etc.)

---

## Key Improvements

### Tone Evolution
| Aspect | Before | After |
|--------|--------|-------|
| Language | All English, corporate | Taglish, natural |
| Personalization | None | Uses first name, celebrates |
| Currency | "PHP 5,200" | "₱5,200" |
| Context | Just dates | "41 days pa" |
| Profit recognition | Silent | "Nice doon!" |
| Deadline urgency | Neutral | Calibrated by days out |
| No-transaction handling | Missing | Graceful reassurance |
| Disclaimer | None | Always included |

### Brand Alignment
- **Pillar 1: Taglish-Fluent** ✅ — Natural mix of Filipino/English, uses "kumikita," "gastos," "kababayan"
- **Pillar 2: Warm but Competent** ✅ — Shows data, respects financial accuracy, earns trust
- **Pillar 3: Proactively Caring** ✅ — Surfaces today's priorities, celebrates wins, shows genuine interest

### Real Example
**Before:**
```
Good morning Maria. Yesterday income: PHP 5,200. Yesterday expenses: PHP 3,100. Net: PHP 2,100. BIR deadline: 1701Q due April 25. Tasks: none.
```

**After:**
```
Good morning, Maria!

Kumikita ka yesterday — ₱5,200 in. ₱3,100 gastos.
Net: ₱2,100. Nice doon! 🎂

Heads up po — BIR 1701Q mo, April 25 pa lang.
41 days pa, pero let's gather receipts na?

Kaya mo 'yan!

⚠️ **Disclaimer:** This briefing is based on recorded transactions only.
For tax deadlines and compliance matters, consult with a BIR-accredited accountant po.
```

---

## Implementation Notes

### What's Included
- **Warm opening:** Uses user's first name, sets positive tone
- **Income/expense summary:** ₱ formatting, celebration of profits, graceful handling of zero-transaction days
- **Today's priorities:** Surfaces BIR deadlines, open tasks, action items
- **Closing nudge:** Collaborative, encouraging, brief
- **BIR disclaimer:** Always present, protects legal liability

### Data Requirements
- User first name, yesterday's income/expense totals
- Next BIR deadline name and date
- Days until deadline
- Open task count
- User's business type
- Monthly revenue tracking (for milestones)

### Frequency & Personalization
- Delivered once daily, default 7:00 AM (user's timezone)
- Personalized by business type, transaction history, approaching milestones
- A/B testing ready: emoji usage, message length, opening temperature, deadline lead time

---

## Files Saved
```
/sessions/bold-dreamy-fermi/mnt/AKBai/akbai-delivery/ai-engineer-workspace/iteration-1/eval-3-briefing-fix/without_skill/outputs/
├── morning-briefing-prompt.md      (Complete system prompt — 255 lines)
├── example-outputs.md               (Real-world scenarios — 341 lines)
└── SUMMARY.md                       (This file)
```

---

## Next Steps (Recommendations)

1. **Test with real data** — Run the prompt against actual Maria/Jose/Ana/Andoy user profiles to validate output quality
2. **A/B test variations** — Try emoji levels, message lengths, opening temperatures to find optimal engagement
3. **Integrate BIR calendar** — Connect to Deadline Watcher so deadlines are accurately sourced
4. **Refine milestone celebrations** — Tune the thresholds for celebrating ₱5K, ₱10K, ₱100K milestones
5. **Edge case testing** — Verify behavior on first week, negative cash days, missed transaction entry days
6. **Localization** — This prompt is Filipino-MSME focused; scaling to other countries requires tone and term updates

---

## Quality Checklist

- ✅ Addresses "robotic" feedback from original prompt
- ✅ Uses Taglish naturally (brand pillar alignment)
- ✅ Celebrates small wins (₱1K+ profits matter)
- ✅ Handles no-transaction days gracefully
- ✅ Includes BIR legal disclaimers
- ✅ Uses ₱ currency correctly (₱5,200 not PHP 5200)
- ✅ Provides deadline context ("41 days pa")
- ✅ Uses first names consistently
- ✅ Mobile-first formatting (short sentences, scannable)
- ✅ 7 realistic user scenarios included
- ✅ Before/after comparison provided
- ✅ Implementation notes clear (variables, logic, timing)
- ✅ No financial advice (only observations)
- ✅ Tone calibration by context (good day, slow day, urgent deadline)

---

## Brand Resonance

This revised prompt fully embodies AKBai's promise: **"Hindi ka nag-iisa sa negosyo mo." (You are not alone in your business.)**

KA is no longer a dashboard. It's a partner. One that:
- Knows your numbers and celebrates your wins
- Understands your tax deadlines (and respects BIR compliance)
- Speaks your language (Taglish, natural, warm)
- Cares about your hustle (proactive, personal, genuine)
- Shows up every morning with what matters most

This is how KA should sound.
