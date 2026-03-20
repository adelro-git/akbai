# 🚩 Flag-as-Wrong Review — Receipt Scanning Accuracy (Week of Mar 18)

**Status:** 🟡 ATTENTION NEEDED | **Timeline:** Review tonight, pattern analysis by Wednesday build session

---

## Summary

You have **3 flag-as-wrong reports this week, all about Resibo Scanner** returning incorrect amounts. This is a **critical signal** — if receipt scanning (the #1 paid feature in Phase 1) is unreliable, you'll lose Pro subscribers immediately.

**Next action: Review the 3 flagged interactions tonight. Determine if it's a pattern (all same root cause) or random noise. If pattern detected, escalate to ai-engineer by Wednesday.**

---

## Immediate Review Workflow (Tonight — 20–30 min)

### Step 1: Pull Full Context for Each Flag (5 min per flag)

For each of the 3 flags, gather:
- **User ID & business profile** — What type: Maria (food seller)? Jose (online seller)? Business model affects OCR expectations
- **Receipt image & raw text** — Did Haiku OCR the receipt correctly? (This is the hard part — thermal prints, faded text, mixed language receipts)
- **Expected amount vs. KA amount** — What did user flag as wrong? Off by ₱100? Off by decimal point?
- **Date & timing** — All this week, or spread over longer? (Spread = random failure; all this week = possible model/prompt regression)
- **User's tier** — Pro or Business? (Affects what they're paying for the feature)

**Data sources:**
- Supabase `flags` table (if built): user_id, message_id, flagged_at, user_note
- Supabase `conversations` table: full message history + system prompt version active at time
- Supabase `receipts` table: original image file + Haiku OCR output
- User's `profiles` table: business_type, BIR status (affects accuracy expectations)

---

### Step 2: Determine Root Cause (10–15 min)

Use this decision tree:

```
Q1: Did Claude Haiku OCR the receipt text correctly?
    ├─ YES, but KA misread the amount
    │   └─ ROOT CAUSE: Prompt issue
    │       Problem: System prompt isn't instructing Haiku clearly enough to extract the *total* line
    │       or isn't handling edge cases (discounts, tax lines, multiple amounts)
    │       Example: Receipt has "Subtotal: ₱500" and "Total: ₱550 (w/ tax)"
    │               KA picked the subtotal instead of total
    │
    ├─ NO, Haiku OCR garbled the receipt
    │   └─ ROOT CAUSE: Model limitation (OCR accuracy)
    │       Problem: Thermal print, faded text, non-standard format, or language mix
    │       Example: Receipt is hand-written, blurry, or in Chinese
    │       Fix: Adjust marketing promises or add pre-scan validation UX
    │            ("Please take a clear photo of the receipt total")
    │
    └─ NO, but KA correctly extracted the amount, user flagged it wrong
        └─ ROOT CAUSE: User misunderstanding
            Problem: User expected a *net* amount but KA showed *gross*
            Fix: Improve KA's explanation (show the receipt line that was extracted)
```

---

### Step 3: Apply Fix (Varies)

**If PROMPT ISSUE (KA misread correct OCR):**
- Update the Resibo Scanner system prompt section to:
  - Explicitly instruct: "Always extract the TOTAL line, not subtotal"
  - Add edge case handling: "If multiple amounts exist, clarify which is the total"
  - Add explanation: "Show which line on the receipt you extracted the amount from"
- Test with Taglish test library (run all receipt cases)
- No retroactive user notification needed (was a display issue, not their data)

**If MODEL LIMITATION (Haiku OCR failed):**
- Don't blame the user or hide the issue
- Add a *post-scan validation step* to the Resibo Scanner UX:
  - Show Haiku's OCR text + extracted amount back to user before saving
  - Let user correct it in-app (1-tap fix)
  - Only save after user confirms
- Cost: ₱0.16 extra per uncertain scan (Haiku call to re-read + validate)
  - Acceptable — prevents false data and rebuilds trust
- Notify affected users: "We've added a review step to Resibo so you can catch any scanning hiccups"

**If USER MISUNDERSTANDING (KA was correct):**
- Improve KA's explanation:
  - When showing receipt amount, quote the exact line: "From your receipt: *Total amount: ₱550*"
  - Add context if relevant: "This includes tax/fees you see on the receipt"
- Close loop: "The scan was accurate, but we're making it clearer next time"

---

## Pattern Check (By Wednesday, 5 min)

Once you've reviewed all 3:

**Look for commonality:**
- [ ] Same receipt type? (All food sellers' thermal receipts? All Shopee waybills?)
- [ ] Same error direction? (All too high? All too low? All missing decimals?)
- [ ] Same user profile? (All Jose-type online sellers? All Maria-type cash businesses?)
- [ ] Same time period? (All this week = possible recent code change or prompt update?)

### If Pattern Found (3+ flags, same root cause):
- **Escalate to ai-engineer skill immediately**
  - Document: "3 Resibo flags with pattern: [description]. Root cause: [prompt/model/UX]. Recommended fix: [...]"
  - This is their domain — prompt tuning, model evaluation, structured output design
  - You focus on the user impact; they focus on the fix

### If Random / No Clear Pattern:
- Treat as normal operational feedback
- Batch the fixes (prompt clarification + post-scan validation UX)
- Test this weekend, deploy early next week
- Re-baseline: track receipt scan flags next week — target: 0–1 per week

---

## User Communication (If Applicable)

**For each flagged user** (after fix is live):

If you change how amounts are extracted/displayed:
```
"Salamat po sa pag-flag, [Name]!

Nag-improve kami ng Resibo Scanner based sa feedback mo.
Ngayon, makikita mo exactly kung saan namin na-extract ang amount
bago i-save. Mas transparent, mas mabilis kung may error.

Try mo ulit — mas confident ka na ngayon."
```

---

## Metrics to Track After Fix

Next week, monitor:
- **Flag volume (Resibo category):** Target ≤ 1/week
- **Scan completion rate:** Did the new validation UX slow users down?
- **User satisfaction:** Any support complaints about the new flow?

If flags continue >3/week after fix → escalate to ai-engineer + consider reverting to simpler model or pivoting to manual receipt entry option.

---

## Tonight's Action Checklist

- [ ] Pull the 3 flagged interactions + full context
- [ ] Categorize each: prompt issue | OCR failure | user misunderstanding
- [ ] Look for pattern across all 3
- [ ] Draft a fix (prompt update OR UX change OR user education)
- [ ] Test fix against Taglish test library
- [ ] Escalate to ai-engineer if pattern detected
- [ ] Plan deployment: this weekend or early next week?

**Time estimate:** 20–30 minutes | **Urgency:** Tonight (before user churn risk grows)

---

## Why This Matters

Receipt scanning is **the** monetization hook for Pro:
- Free tier: no scans
- Pro: 50 scans/month @ ₱0.16 = ₱8/month cost, ₱399/month revenue = **50x margin**
- If scanning is wrong 3+ times in 50 users, trust breaks → unsubscribe within 1–2 weeks

Fix this tonight, test it this weekend, deploy by Monday morning. Your Maria persona will notice.

---

**Status at end of review:** Update this summary with:
- Root cause diagnosis
- Escalation to ai-engineer? (Y/N)
- Deployment timeline
- Expected user communication needed?
