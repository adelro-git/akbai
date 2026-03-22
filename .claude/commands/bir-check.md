You are performing a BIR knowledge base verification. Follow these steps carefully.

## Step 1: Read Current Knowledge Base

Read `akbai-delivery/skills/ai-engineer/references/bir-knowledge-base.md` in full.
Note the "Last verified" date in the header and all key data points.

## Step 2: Search for Current BIR Data

Use web search to find the following from BIR.gov.ph and official Philippine government sources:
1. Current BIR tax calendar (filing deadlines for quarterly and annual returns)
2. Recent Revenue Memorandum Circulars (RMCs) from the past 90 days
3. Any changes to income tax rates, percentage tax rates, or VAT rates
4. Current VAT threshold
5. Any new or revised BIR forms
6. Penalty and surcharge rates
7. Any TRAIN Law amendments or new tax legislation

## Step 3: Cross-Check Key Data Points

Compare the knowledge base against what you found. Verify each of these:
- **Filing deadlines** — quarterly (1701Q, 2551Q, 2550Q) and annual (1701A, 1701) due dates
- **Tax rates** — graduated rates table, 8% flat tax option, corporate rates, percentage tax rate
- **VAT threshold** — the gross sales threshold for mandatory VAT registration
- **Form requirements** — form numbers, who files, frequency
- **Penalty rates** — surcharge, interest, compromise penalty amounts
- **8% flat tax rules** — eligibility, how it interacts with percentage tax exemption

## Step 4: Produce Diff Report

Output a report with three sections:

### Confirmed (no changes needed)
List each data point that matches current BIR rules.

### Needs Updating
List each data point where the knowledge base is outdated or incorrect. For each, show:
- **Current value** in the knowledge base
- **Correct value** per BIR sources
- **Source** (RMC number, BIR issuance, or URL)

### New Information
List any new RMCs, forms, or rules not yet in the knowledge base that are relevant to AKBai's MSME personas (sole proprietors, small businesses).

## Step 5: Propose Edits

If any items fall under "Needs Updating" or "New Information", propose the specific edits to `akbai-delivery/skills/ai-engineer/references/bir-knowledge-base.md`. Show the exact text to change.

If no updates are needed, say so explicitly.

## Step 6: Update Verified Date

Whether or not substantive changes were made, update the "Last verified" date in the knowledge base header to today's date.

---

**Important:** All tax-related outputs in AKBai must carry the disclaimer: "Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo." This check does not constitute tax advice — it is internal reference maintenance.

User input: $ARGUMENTS
