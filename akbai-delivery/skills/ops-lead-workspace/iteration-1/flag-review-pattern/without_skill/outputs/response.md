# Receipt Scanning Flag Analysis: 3 Wrong Amount Reports

## Immediate Assessment

You've received 3 "Flag as Wrong" reports this week—all for **incorrect amounts**. This is a quality signal that warrants immediate investigation because:

1. **Amount accuracy is mission-critical** for a finance/receipt tool. Users trust this for their books.
2. **Pattern clustering** (same error type across 3 separate users) suggests a systemic issue, not random edge cases.
3. **Cost impact**: At ₱0.16/scan, false outputs are expensive failures even if the scan succeeds technically.

---

## Root Cause Investigation

Before fixing, you need to understand *why* amounts are wrong. Common causes:

### Vision API issues
- **Poor image quality**: Blurry, angled, or low-light receipt photos → OCR misreads numbers
- **Receipt format confusion**: Multi-currency, handwritten amounts, or unclear formatting
- **Decimal separator confusion**: Some receipts use comma (1.234,56) vs period (1,234.56)
- **Multiple amounts**: Sub-totals, discounts, taxes—API extracts wrong line

### Logic/parsing issues
- **Prompt engineering**: Your Claude Haiku prompt may not be explicit enough about which amount to extract (gross, net, tax-inclusive, etc.)
- **Post-processing**: If you're doing any calculation or rounding after OCR, that could introduce errors
- **Currency handling**: If users upload receipts in different currencies, is conversion being applied correctly?

### User input issues
- **Wrong receipt photo**: User uploaded a different receipt than they thought
- **Cropped/partial image**: Only part of the receipt visible, missing context

---

## Investigation Steps (This Week)

### 1. **Collect the raw data** (30 min)
   - Reach out to the 3 users who flagged
   - Ask them to re-upload the same receipt image OR send you a copy
   - Record: what amount they got vs. what was correct
   - Ask about the receipt type (official POS, handwritten, foreign, etc.)

### 2. **Reproduce the errors** (30 min)
   - Run those 3 receipt images through your Resibo Scanner yourself
   - Note the exact amounts your system extracted
   - Compare to user-reported correct amounts
   - **Document the delta** (e.g., "extracted ₱1,500 but should be ₱1,250")

### 3. **Analyze the pattern** (20 min)
   - Are the errors in the same direction? (all too high, all too low, random)
   - Are they off by consistent amounts? (e.g., always off by 1 digit, missing tax, etc.)
   - Do all 3 receipt types share something in common? (e.g., handwritten amounts, multiple totals)

---

## Quick Fixes (Based on Root Cause)

### If it's image quality
- Add input validation: reject blurry/low-contrast photos before sending to Claude
- Suggest to users: "Use good lighting and steady hands when photographing"
- Add a preview before processing: let user confirm they're capturing the right receipt area

### If it's prompt engineering
- Make your Claude Haiku prompt **more explicit**:
  - "Extract the FINAL TOTAL AMOUNT (tax-inclusive, in Philippine Pesos)"
  - Provide examples of what correct extraction looks like
  - Add a constraint: "Return only one amount. If multiple amounts present, extract the largest/final one"

### If it's post-processing logic
- Add a sanity check: Does the extracted amount match the format of the receipt? (e.g., if receipt shows ₱2,345.67, is your output exactly that?)
- Avoid rounding unless absolutely necessary

### If it's user error
- Add clearer UI guidance: "Capture the entire receipt" or "Frame the total amount in the center"

---

## Metrics to Track Going Forward

Once you've fixed the issue, set up these monitoring points:

1. **Flag rate**: Track what % of scans get flagged each week (establish a baseline)
2. **Flag types**: Categorize—is it amounts, item names, dates, or something else?
3. **User cohort**: Are certain user groups flagging more? (e.g., users scanning handwritten vs. POS receipts)
4. **Time to flag**: How quickly after scanning do users flag? (Same day = they catch it immediately; later = they discovered it during reconciliation)

---

## Recommended Next Action

**This week**: Contact those 3 users, collect their receipt images, and reproduce the errors. Once you have the raw data, you'll know if this is a systematic prompt problem, an image quality issue, or something else entirely.

**Do not assume it's a Claude vision API failure** just yet—often it's how we're asking the API or how we're processing its response.
