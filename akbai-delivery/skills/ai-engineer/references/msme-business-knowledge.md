# AKBai — MSME Business Knowledge Base
> Used by: ai-engineer, product-owner, ux-designer, marketing-lead
> Source: Market Research v1.1, Philippine MSME data, AKBai persona research
> Last updated: 2026-04-02
> **This file is reference material for KA's business domain knowledge. It feeds into system prompt assembly and personalization logic but is not loaded at runtime directly.**

---

## 1. Food/Baking Business Profile (Maria Persona)

### Overview
| Attribute | Value |
|-----------|-------|
| Typical monthly revenue | ₱80,000–₱250,000 |
| Typical net margin | 25–35% (after ingredients, packaging, delivery) |
| Primary sales channels | Facebook, Instagram, word of mouth, Viber groups |
| Primary payment methods | GCash (60–70%), bank transfer (20%), COD (10%) |
| Business model | Order-based (made-to-order or batch production) |
| Employees | Usually solo or family-assisted (spouse, children, katulong) |

### Cost Structure

| Category | % of Revenue | Notes |
|----------|-------------|-------|
| Ingredients | 40–50% | Largest cost. Prices fluctuate (eggs, butter, flour). Bought from palengke, S&R, or Shopee wholesale. |
| Packaging | 5–10% | Boxes, ribbons, stickers, cake boards. Often underestimated. |
| Delivery | 10–15% | Lalamove, Grab, or personal delivery. Distance-based. Often absorbed to stay competitive. |
| Utilities | 3–5% | Electricity (oven, mixer, ref), water, internet |
| Equipment depreciation | 2–5% | Oven, mixer, ref, molds — usually one-time purchases amortized informally |
| Marketing | 1–3% | Mostly free (Facebook posts), occasional boosted posts (₱200–₱500/week) |

### Revenue Patterns
- **Order-based**: Income arrives per order, not on a schedule
- **Seasonal peaks**: Christmas (Oct–Dec, biggest), Valentine's Day, graduation season (March–April), fiesta season (varies by barangay), Mother's Day
- **Weekly pattern**: Orders spike Thu–Sat (weekend events, birthday parties)
- **Slow months**: January (post-holiday), August–September (rainy season, back-to-school spend)

### Cash Flow Pattern
```
Buy ingredients (cash out) → Cook/Bake → Package → Deliver → Collect payment (cash in)
```
- **Cash out happens BEFORE cash in** — this is the #1 cash flow stress
- Typical lead time: 1–3 days from order to delivery
- GCash payments usually collected at order confirmation (50% deposit) or on delivery
- Large orders (corporate, weddings) may require 50% deposit, 50% on delivery

### Common Expense Categories (for KA categorization)
| Category | Examples |
|----------|----------|
| Ingredients | Flour, sugar, eggs, butter, cream, chocolate, fruits |
| Packaging | Boxes, containers, cake boards, stickers, ribbons, bags |
| Delivery | Lalamove, Grab Express, gas for personal delivery |
| Utilities | Electric bill, water bill, internet/WiFi |
| Equipment | Oven, mixer, ref, molds, piping tips (usually one-time) |
| Marketing | Facebook ads, printed flyers, business cards |
| Supplies | Cling wrap, foil, parchment paper, cleaning supplies |

### Common Financial Blind Spots
1. **Not tracking delivery costs** — absorbed as "free delivery" but eats 10–15% of revenue
2. **Underpricing for ingredient inflation** — egg prices can swing ₱2–₱5/piece across months; pricing doesn't adjust
3. **Not separating personal and business GCash** — all money in one wallet, no visibility into actual profit
4. **Ignoring packaging costs** — "it's just a box" but adds up to 5–10% of revenue
5. **No costing per product** — knows total sales but not which products are profitable
6. **Not tracking utang** — friends/family orders on credit, never collected

### Pain Timing
| When | Pain |
|------|------|
| Daily | Receipt chaos — palengke receipts are faded thermal paper, sometimes handwritten |
| Weekly | DM overload — 20–50 customer messages to manage orders |
| Monthly | BIR anxiety — which form? When? How much do I owe? |
| Peak season | Everything at once — high volume, ingredient shortages, delivery logistics |

---

## 2. Online Selling Business Profile (Jose Persona)

### Overview
| Attribute | Value |
|-----------|-------|
| Typical monthly revenue | ₱100,000–₱500,000 (gross sales on platform) |
| Typical net margin | 15–30% (after platform fees, shipping, COGS) |
| Primary sales channels | Shopee, Lazada, TikTok Shop, Facebook Marketplace |
| Primary payment methods | Platform settlements (GCash, bank), COD |
| Business model | Inventory-based (buy wholesale, sell retail) or dropship |
| Employees | Solo or 1–2 assistants (packing, shipping) |

### Platform Fee Structures (Updated April 2026)

| Platform | Commission | Transaction Fee | Shipping Fee | Other Fees | Total Effective Deduction | Settlement |
|----------|-----------|----------------|-------------|------------|--------------------------|------------|
| Shopee (Marketplace) | 1–6% (category-based) | 2.24% | 5.6% (capped ₱100/item) | Programs: MDV 4%, BIR CWT 0.5% | **10–18%** (mandatory + programs) | 3–7 days after delivery |
| Shopee (Mall) | 6–11% | 2.24% | 4.48% | Programs: MDV 4%, BIR CWT 0.5% | **13–20%** | 3–7 days after delivery |
| Lazada (Marketplace) | 4–8% (after +3% increase, Feb 2026) | ~2.24% | Varies | Processing: 2% | **8–13%** | 7–14 days after delivery |
| Lazada (LazMall) | ~14%+ (after +3% increase, Feb 2026) | ~2.24% | Varies | Processing: 2% | **18–21%** | 7–14 days after delivery |
| TikTok Shop | Category-based | 2.24% | 5–5.5% (capped ₱100) | ₱3/order processing | **12–16%** | 7–15 days |
| Facebook Marketplace | 0% (direct) | 0% | None (seller arranges) | None | **0%** | Immediate (GCash/bank) |

**Key changes since 2025:**
- Shopee added sustainability fee (₱5/order), pre-order service fee (2%), and SPayLater surcharge (+3–6% on installment orders)
- Lazada implemented a uniform +3% commission increase (Feb 9, 2026) for both Marketplace and LazMall
- TikTok Shop added ₱3/order processing fee for local sellers
- New Marketplace sellers on Shopee and TikTok Shop get **90-day commission exemption**
- Shopee's "total deduction" complaints in seller communities cite 20–26% — this includes voluntary program fees (MDV, Coins Cashback, Live Xtra) on top of mandatory fees

**Shopee Mandatory Fee Breakdown (example: ₱1,000 sale, Fashion category):**
| Component | Amount | % |
|-----------|--------|---|
| Commission (~4%) | ₱40 | 4.0% |
| Transaction fee | ₱22.40 | 2.24% |
| Shipping fee (5.6%, capped) | ₱44.80 | 4.48% |
| **Mandatory subtotal** | **₱107.20** | **~10.7%** |
| + MDV program (4%) | ₱40 | 4.0% |
| + Sustainability fee | ₱5 | 0.5% |
| **Total with programs** | **₱152.20** | **~15.2%** |

### Revenue Patterns
- **Campaign spikes**: 9.9, 10.10, 11.11, 12.12 — can be 3–10x normal daily sales
- **Payday spikes**: 15th and 30th of each month (Philippine payday cycle)
- **Baseline**: Steady daily orders between campaigns
- **Slow periods**: January (post-holiday), typhoon season (shipping delays reduce orders)

### Cash Flow Pattern
```
Buy inventory (cash out) → List on platform → Customer orders → Ship →
Customer confirms delivery → Platform settlement (cash in, 3–14 days later)
```
- **Settlement delay is the #1 cash flow problem** — money is "in the platform" for days/weeks
- COD orders add another layer: rider collects cash → remitted to platform → settled to seller
- Returns/refunds: 3–10% return rate, refunds deducted from next settlement
- Multiple platforms = multiple settlement schedules = reconciliation nightmare

### Common Expense Categories
| Category | Examples |
|----------|----------|
| COGS (Cost of Goods Sold) | Wholesale inventory, product sourcing |
| Platform fees | Commission, transaction fees, promoted listings |
| Shipping | Seller-subsidized shipping, packaging materials |
| Packaging | Bubble wrap, poly mailers, boxes, tape, thank-you cards |
| Marketing | Shopee Ads, vouchers funded by seller, free shipping promos |
| Returns/Refunds | Returned items, refund deductions from settlements |
| Tools | Barcode scanner, label printer, inventory management |

### Common Financial Blind Spots
1. **Not tracking actual platform fees** — commission + transaction fee + shipping fee + program fees can total **10–20%+ of gross** (Shopee mandatory alone is ~10–13%; with programs, 15–18%+). One seller calculated: "If you sell 100 orders a day at ₱5/order processing fee, that's ₱15,000/month gone"
2. **Not accounting for returns/refunds** — 3–10% return rate directly reduces effective revenue
3. **Confusing gross sales with actual income** — platform shows ₱500K gross but after fees, shipping, COGS, actual profit may be ₱75K–₱150K
4. **COD payments not tracked** — cash collected by riders, may not reconcile to platform dashboard
5. **Inventory sitting as cash** — ₱200K of unsold stock is ₱200K not in the bank
6. **Multiple GCash/bank accounts** — settlements arrive in different wallets, total picture is unclear
7. **EWT (Expanded Withholding Tax)** — platforms may withhold 1–2% EWT; sellers don't know this counts as tax credit on their ITR

### Pain Timing
| When | Pain |
|------|------|
| Daily | Order processing, packing, shipping logistics |
| Weekly | Reconciling settlements across platforms vs GCash/bank |
| Monthly | Computing actual profit (gross vs net confusion), BIR filing |
| Campaign days | Extreme volume, stock-outs, packing marathon, customer complaints |
| Quarterly | BIR quarterly filing — which platform fees are deductible? VAT on gross or net? |

---

## 3. Freelance/Creative Business Profile (Ana Persona)

### Overview
| Attribute | Value |
|-----------|-------|
| Typical monthly revenue | ₱25,000–₱80,000 (highly variable) |
| Typical net margin | 60–80% (low COGS, mostly time/skill-based) |
| Primary sales channels | Upwork, direct clients via social media, referrals, Fiverr |
| Primary payment methods | Bank transfer (40%), PayPal (30%), GCash (25%), crypto (5%) |
| Business model | Project-based or retainer |
| Employees | Almost always solo |

### Income Patterns
- **Feast-or-famine**: 3 clients one month, zero the next
- **Retainer vs project**: Retainers (₱15K–₱40K/month per client) provide stability; project-based is higher ceiling but unpredictable
- **Invoice delays**: Net 15 or Net 30 standard, but ~40% of clients pay late (Net 45–60 in practice)
- **Currency mix**: International clients pay in USD/EUR; local clients in PHP — FX adds complexity
- **Platform fees**: Upwork charges a flat ~10% service fee (restructured May 2025, replacing the old tiered 20%/10%/5% system). Fiverr takes 20%. OnlineJobs.ph charges 0% to freelancers (employer-paid subscription model).

### Common Rate Structures

| Type | Typical Range | Notes |
|------|--------------|-------|
| Graphic design (per project) | ₱3,000–₱25,000 | Logo, branding, social media packs |
| Web design/dev (per project) | ₱15,000–₱80,000 | Landing page to full site |
| Writing/content (per piece) | ₱1,500–₱8,000 | Blog posts, copywriting |
| Video editing (per video) | ₱3,000–₱20,000 | Short-form to full production |
| Retainer (monthly) | ₱15,000–₱40,000 | Ongoing social media, content, design |
| Hourly (international) | $10–$35/hr | Upwork/direct international clients |

### Cash Flow Pattern
```
Pitch/find client → Agree on scope → Do work → Invoice → Wait for payment (cash in)
```
- **Work happens BEFORE payment** — opposite stress from Maria (who buys ingredients first)
- Deposit policy: some freelancers require 50% upfront, many don't enforce it
- PayPal holds: new accounts may have 21-day holds on international payments
- FX conversion: PayPal rate is ~2–3% worse than mid-market; GCash-to-bank is free but has limits

### Common Expense Categories
| Category | Examples |
|----------|----------|
| Software | Adobe Creative Cloud (₱1,500–₱3,000/mo), Canva Pro, Figma, hosting |
| Equipment | Laptop, drawing tablet, camera, monitor |
| Internet | Fiber plan (₱1,500–₱3,000/mo) — essential tool, not optional |
| Coworking | Hot desk or per-day rental (₱200–₱500/day) — some freelancers |
| Training | Online courses, tutorials, certifications |
| Marketing | Portfolio website hosting, domain renewal |

### Common Financial Blind Spots
1. **Not invoicing promptly** — finishes work, sends invoice a week later, then waits Net 30 on top of that
2. **Not tracking time per client** — underestimates hours, effective rate drops below minimum
3. **Mixing personal and business expenses** — Adobe sub, internet, laptop are all partially business expenses but not tracked
4. **Not saving for tax quarters** — income arrives irregularly but BIR wants quarterly payments; empty bank account on filing day
5. **Ignoring platform fees** — Upwork's 10% on first $500 per client significantly reduces effective rate
6. **No emergency fund** — feast months spent, famine months panic
7. **FX losses not tracked** — PayPal/Wise conversion rates eat 2–4% of international income

### Pain Timing
| When | Pain |
|------|------|
| Monthly | Chasing late invoices, variable income stress |
| Quarterly | BIR filing — income varies wildly quarter to quarter, hard to estimate |
| Annual | 1701A filing — gathering all income sources, platform statements, FX records |
| Project gaps | Zero income weeks — anxiety about pipeline |

---

## 4. Sari-Sari/Retail Business Profile (Andoy Persona)

> **Note:** Lighter coverage — Andoy persona is Phase 3 priority. Core structure for reference.

### Overview
| Attribute | Value |
|-----------|-------|
| Typical daily revenue | ₱500–₱3,000 gross |
| Typical monthly revenue | ₱15,000–₱90,000 |
| Typical net margin | 15–25% (thin margins, high volume) |
| Primary sales channels | Walk-in, neighborhood |
| Primary payment methods | Cash (80%), GCash (15%), utang/credit (5%) |
| Business model | Buy wholesale, sell retail |
| Employees | Family-run (no formal employees) |

### Cost Structure

| Category | % of Revenue | Notes |
|----------|-------------|-------|
| Inventory/COGS | 70–80% | Wholesale from distributors, Puregold, S&R |
| Utilities | 3–5% | Electricity (ref, lighting), water |
| Utang write-offs | 5–10% | Neighborhood credit that's never collected |
| Misc | 2–3% | Plastic bags, change fund, minor repairs |

### Cash Flow Pattern
```
Buy wholesale inventory (cash out) → Stock shelves → Sell retail daily (cash in) → Repeat
```
- **Daily cycle**: Cash comes in throughout the day in small amounts
- **Inventory timing**: Restock every 1–3 days for perishables, weekly for dry goods
- **Utang problem**: Neighbors buy on credit ("Ipunin ko na lang"), 10–20% may never be collected
- **No separation**: Store cash and personal cash are the same pocket/wallet

### Common Financial Blind Spots
1. **Cash mixing** — store earnings and personal money are the same. "Kumikita ba ako?" is genuinely unknown.
2. **Utang not tracked** — mental ledger or notebook, no systematic tracking, embarrassment prevents collection
3. **Spoilage/expiry not costed** — expired products are thrown away but not tracked as a loss
4. **No formal BIR registration** — many sari-sari stores operate informally. Not necessarily evading — just unaware of requirements.
5. **Pricing by convention** — prices set by "what everyone else charges," not by actual margin calculation
6. **Pilferage** — family members or helpers taking stock without logging it

---

## 5. Common Across All Filipino MSMEs

### GCash as Financial Infrastructure (Updated April 2026)
| Fact | Detail |
|------|--------|
| Users | 94 million (as of 2026); IPO expected H2 2026 |
| Basic account wallet limit | ₱50,000 |
| Fully Verified wallet limit | ₱100,000 |
| Fully Verified + linked bank limit | **₱500,000** |
| Daily outgoing limit (Fully Verified) | ₱100,000 |
| Monthly incoming limit | ₱100,000 |
| Cash-in fees | Free via bank transfer; ₱2–₱25 via OTC/7-Eleven |
| Cash-out fees | ₱15 flat (to bank); free to own linked bank |
| Business account | GCash for Business: Starter/Standard/Advanced packages. Requires DTI/SEC registration. In-store QR + Webpay. Role-based access (Owner/Finance/Cashier). |
| Business use reality | Most MSMEs still use **personal** GCash for business — no separation of personal/business funds |
| New features (2026) | Tap to Pay (NFC, Mastercard), ADB $30M MSME credit program |

### Facebook as Primary Sales Channel
- **DM-based ordering**: Customer sees post → sends DM → negotiates → pays via GCash → seller ships/delivers
- **No formal order system**: Orders tracked via chat screenshots, notebooks, or memory
- **Customer communication volume**: 20–100+ DMs/day during peak for active sellers
- **Live selling**: Growing channel — Facebook Live + comment-based ordering
- **Groups**: Local buy-and-sell groups, food groups, community groups

### Social Commerce Landscape (2026)
- **Market size:** USD 28.4 billion (2025), projected USD 96.4 billion by 2034 (14.54% CAGR)
- **56% of Filipinos** shop online every single week, often directly through social platforms
- **TikTok Shop:** 30,780 Philippine shops (11.64% of global total); 200%+ sales growth for sellers in 2025
- **Live selling:** PHP 180 billion in sales, projected PHP 420 billion by 2027. Described as a "national pastime"
- **Facebook** remains dominant for DM-based selling + Facebook Live; TikTok fastest-growing
- **Affiliate commerce:** Creator affiliate programs grew 87% in H1 2024
- **Mobile-first:** 78.52% of e-commerce sales generated on smartphones
- **Digital payments:** 57.4% of retail transactions are now cashless (exceeded BSP target)

### Maya/PayMaya for Business (2026)
- **Flexi Loan:** Up to ₱2M revolving credit for businesses
- **Short-Term Business Loan:** Up to ₱350K, payable up to 90 days
- **SPARK! partnership** (April 2026): Supporting women micro-entrepreneurs with payments, savings, and credit
- **Digital credit scoring** using personal financial behavior data
- IPO also anticipated for 2026 (alongside GCash)

### Seasonal Patterns (Philippine Market)

| Period | Event | Impact |
|--------|-------|--------|
| Oct–Dec | Christmas rush ("Ber months") | Highest sales across all segments. Food: corporate orders, noche buena. Online: gift buying. |
| Feb | Valentine's Day | Food/baking spike (cakes, chocolates). Freelance: design rush. |
| Mar–Apr | Graduation, summer | Food: cakes, catering. Freelance: slower (clients on vacation). |
| May | Mother's Day, election season | Food: cake orders. General: lower spend (summer end). |
| Jun | Back to school | Online selling: uniforms, supplies. Sari-sari: school supplies. |
| Jul–Sep | Rainy season | Slower across all — delivery challenges, lower foot traffic, fewer events |
| 9.9, 10.10, 11.11, 12.12 | Platform campaigns | Online sellers: 3–10x daily sales. Preparation starts 2–4 weeks before. |
| 15th, 30th monthly | Payday | Spending spikes across all consumer-facing businesses |

### Universal Financial Blind Spots
1. **Not separating personal and business money** — single GCash wallet, single bank account
2. **Not tracking delivery/shipping costs** — absorbed as "cost of doing business"
3. **Not computing actual profit** — knows revenue but not expenses, thinks "busy = profitable"
4. **BIR procrastination** — knows deadlines exist, puts off filing until penalty notices arrive
5. **No emergency fund** — one slow month or equipment breakdown = crisis
6. **Undervaluing own time** — especially freelancers and food sellers who work 12+ hour days

### Community Voice: What MSMEs Are Actually Saying (April 2026)
> Sourced from Reddit (r/taxPH, r/BusinessPH, r/buhaydigital, r/phinvest) and Facebook seller/freelancer groups.

**Top pain by persona:**
- **Ana (Freelancer):** "There is a lot of concerns here and my anxiety disorder doesn't help. My main worry are penalties/incarceration." — BIR filing confusion and penalty fear dominate. 8% vs graduated decision confuses almost everyone.
- **Jose (Online Seller):** "Commission fee almost 24-25% now. Almost 1/4 of your price goes to Shopee." — Platform fee rage is real. Sellers report "walang kita" (no profit) after all deductions.
- **Maria (Food Business):** "My Mom has a small business and I've seen her struggle with all the paperworks and processes she needs to do to comply with BIR." — Multi-agency registration maze is the #1 barrier.
- **Andoy (Sari-Sari):** Smallest digital footprint but largest offline market. Handwritten notebooks for customer credit. People buying ₱100–₱500 Excel GCash tracker templates on Facebook — confirming willingness to pay for simple tracking tools.

**What they're asking for (feature demand signals):**
1. Simple tax calculator for freelancers (8% vs graduated) — HIGH demand
2. BIR deadline reminder system — HIGH demand
3. Receipt/invoice recording for online sellers — HIGH demand
4. Platform fee calculator ("true profit after Shopee/Lazada fees") — HIGH demand
5. Simple bookkeeping for non-accountants — HIGH demand
6. GCash transaction tracker for business — MEDIUM demand
7. BIR registration step-by-step guide — HIGH demand

**Tools currently being recommended in communities:**
Manager.io (free), Google Sheets (default), Wave (free), Taxumo, JuanTax, Oojeema. No existing tool combines tax guidance + bookkeeping + BIR compliance in conversational Filipino with a proactive AI voice.

### Digital Literacy Profile
| Skill | Level | Notes |
|-------|-------|-------|
| Smartphone use | High | Daily driver for everything — social media, payments, communication |
| Social media | High | Facebook, Instagram, TikTok — both personal and business |
| Mobile payments | High | GCash, Maya — comfortable with QR and send money |
| Spreadsheets/accounting | Low | Most use notebooks or nothing. Excel/Sheets feels intimidating. |
| Desktop/laptop use | Low–Medium | Many are phone-only. No desktop workflow. |
| App installation | Medium | Download apps from Play Store but sensitive to storage space on mid-range phones |

### BIR Anxiety Profile
- **Fear of penalties** is the #1 emotion — not understanding the rules, just fear of getting caught
- **Confusion about forms** — "Which form am I supposed to file?" is the most common question
- **Procrastination cycle**: confused → anxious → avoid → deadline passes → penalty → more anxiety
- **Trust in word-of-mouth**: "My friend said I don't need to file" carries more weight than BIR.gov.ph
- **CPA cost barrier**: ₱5,000–₱15,000/year for a CPA feels expensive for micro businesses
- **KA opportunity**: Break the anxiety cycle by making compliance feel manageable and non-judgmental

---

## 6. KA Conversation Triggers

Situations where KA should proactively surface knowledge from this file:

### Cost Structure Triggers
| Trigger | KA Action | Business Type |
|---------|-----------|---------------|
| User logs expenses consistently below typical cost % | "Baka may gastos na hindi mo na-log? Sa food business, usually 40–50% ang ingredients." | Food/Baking |
| User's platform fees not appearing in expenses | "Na-track mo ba ang Shopee commission? Usually 5–8% yan ng gross sales mo." | Online Selling |
| User not logging software subscriptions | "Paalala lang — yung Adobe at internet mo, business expense yun. I-log mo para sa deductions." | Freelance |
| Rent/lease not appearing in expenses | "Na-log mo ba ang renta ng shop mo? Usually 15–25% yan ng revenue sa salon/service business." | Service/Salon |
| LPG/gas not tracked as expense | "Yung LPG mo, business expense yun — usually 5–8% ng revenue sa karinderya." | Food/Carinderia |

### Cash Flow Triggers
| Trigger | KA Action | Business Type |
|---------|-----------|---------------|
| Large ingredient purchase logged | "Malaking cash out — kelan ang expected payment para sa orders na 'to?" | Food/Baking |
| Settlement delay detected (no income in 5+ days) | "Normal lang ang 3–7 day settlement sa Shopee. Dapat dumating na this week." | Online Selling |
| Invoice overdue (past Net 30) | "May pending invoice ka pa kay [Client] — 35 days na. I-follow up na?" | Freelance |
| Daily sales dip below ₱1,500 for 3+ consecutive days | "Medyo mababa ang sales this week — may nag-iba ba sa menu o sa area?" | Food/Carinderia |
| No income logged on weekdays (salon/service) | "Walang walk-in or appointment na na-log today — slow day or hindi na-track?" | Service/Salon |

### Seasonal Triggers
| Trigger | KA Action | All Types |
|---------|-----------|-----------|
| October starts | "Ber months na! Christmas rush is coming — ready ka na ba sa orders?" | Food/Baking |
| 2 weeks before 9.9/11.11/12.12 | "Campaign season sa [Platform] in 2 weeks. Ready na ba ang inventory mo?" | Online Selling |
| January slow period | "Normal lang ang bagal ng January. Good time to catch up on filing and planning." | All |
| Approaching payday (13th, 28th) | "Payday bukas — expect more orders. Stock up?" | Food, Retail |

### BIR Triggers (cross-ref with bir-knowledge-base.md)
| Trigger | KA Action | All Types |
|---------|-----------|-----------|
| Revenue approaching ₱3M annual | "Malapit ka na sa ₱3M VAT threshold. I-monitor natin — baka kailangan mo ng CPA soon." | All |
| First quarter with AKBai | "First quarterly filing mo with AKBai — gusto mo ba ng walkthrough sa process?" | All |
| Filing deadline in 7 days | Per bir-knowledge-base.md §2 notification sequence | All |

---

## 7. Food/Carinderia Business Profile

### Overview
| Attribute | Value |
|-----------|-------|
| Typical daily revenue | ₱1,500–₱8,000 |
| Typical monthly revenue | ₱45,000–₱240,000 |
| Typical net margin | 20–30% |
| Primary sales channels | Walk-in (95%), Grab Food / foodpanda (5%, growing) |
| Primary payment methods | Cash (85%), GCash (15%) |
| Business model | Daily cook-and-sell, fixed menu or rotating "ulam of the day" |
| Employees | Family + 1–3 hired helpers (cook, server, dishwasher) |

### Cost Structure

| Category | % of Revenue | Notes |
|----------|-------------|-------|
| Raw ingredients | 50–60% | Palengke or market daily. Rice (bulk), meat, vegetables, cooking oil. Prices fluctuate with supply. |
| LPG / cooking fuel | 5–8% | Major recurring cost. ₱800–₱1,200 per 11kg tank, 2–4 tanks/month depending on volume. |
| Labor | 10–15% | Helpers paid daily (₱350–₱500/day) or monthly (₱6,000–₱10,000). Often family = unpaid. |
| Rent | 0–15% | ₱0 if home-based, ₱5,000–₱15,000 if renting a stall/space near offices or schools |
| Utilities | 3–5% | Electricity (ref, rice cooker, lighting), water (heavy use for washing) |
| Packaging / takeout | 2–5% | Styrofoam, plastic bags, rice containers. Rising cost due to single-use plastic regulations. |

### Revenue Patterns
- **Daily cycle**: Lunch rush (11am–1pm) = 60–70% of daily revenue. Some have breakfast or merienda service.
- **Weekly pattern**: Steady Mon–Sat (office/factory workers). Sunday often closed or half-day.
- **Seasonal**: Stable year-round (people always need to eat). Slight dip during holidays when offices close. Slight spike near payday (15th, 30th).
- **Growth path**: Volume-based — more seats, faster turnover, delivery app listing.

### Cash Flow Pattern
```
Buy ingredients at palengke (5–7am, cash out) → Cook (7–10am) → Sell (11am–2pm, cash in) → Repeat daily
```
- **Same-day cash cycle** — unlike food/baking, cash out and cash in happen on the same day
- Ingredient purchases are daily (perishable goods), not batch
- No deposits or advance payments — purely walk-in cash
- Leftover food = spoilage loss (not tracked by most operators)
- Delivery app settlements (Grab/foodpanda) arrive 1–3 days later

### Common Expense Categories
| Category | Examples |
|----------|----------|
| Ingredients | Rice, meat, vegetables, cooking oil, condiments, spices |
| LPG / fuel | Cooking gas tanks, charcoal (for grilling) |
| Labor | Helper daily wages, cook salary |
| Rent | Stall/space rental (if not home-based) |
| Utilities | Electricity, water (heavy use) |
| Packaging | Styrofoam, plastic bags, banana leaves, containers |
| Cleaning | Dishwashing soap, sanitizer, rags, waste disposal |

### Common Financial Blind Spots
1. **Not tracking LPG as a business expense** — "gas lang naman yun" but it's 5–8% of revenue
2. **Spoilage/leftover losses not tracked** — food that doesn't sell is thrown away or eaten by family, never counted as a cost
3. **Family labor not costed** — wife/husband/children work for free, actual labor cost is hidden
4. **Rent-free ≠ cost-free** — home-based karinderiyas don't account for the space, electricity, and water their home absorbs
5. **No per-dish costing** — doesn't know which ulam items are profitable vs. loss leaders
6. **Daily cash mixing** — revenue goes straight to the household, no separation

### Pain Timing
| When | Pain |
|------|------|
| Daily (5–7am) | Palengke run — ingredient prices vary daily, no standardized costing |
| Daily (2pm+) | Leftover assessment — how much was wasted? No tracking. |
| Monthly | BIR filing — most karinderiyas operate informally, fear formalization |
| Quarterly | BIR quarterly deadline — confusion, avoidance, penalties |

---

## 8. Service/Salon Business Profile

### Overview
| Attribute | Value |
|-----------|-------|
| Typical monthly revenue | ₱30,000–₱150,000 |
| Typical net margin | 20–35% |
| Primary sales channels | Walk-in (60%), referral/word-of-mouth (25%), Facebook/Instagram (15%) |
| Primary payment methods | Cash (60%), GCash (35%), card (5%) |
| Business model | Service-based (haircut, color, treatment, nails, spa). Revenue = labor × price per service. |
| Employees | Owner-operator + 1–5 staff (commission-based or daily wage) |

### Cost Structure

| Category | % of Revenue | Notes |
|----------|-------------|-------|
| Supplies / products | 15–25% | Shampoo, color, bleach, wax, nail polish, skincare products. Bought in bulk or from suppliers. |
| Rent | 15–25% | Location is critical — high-traffic area = more walk-ins. ₱8,000–₱25,000/month typical for commercial space. |
| Labor / commission | 20–30% | Staff paid via commission (40–60% of service price) or daily rate (₱400–₱600/day). Owner-operators keep more margin. |
| Utilities | 5–8% | Electricity (aircon, dryers, lighting), water (heavy use for washing) |
| Equipment maintenance | 2–5% | Chairs, mirrors, dryers, sterilizers — periodic replacement and repair |
| Marketing | 1–3% | Facebook posts, Instagram, printed tarpaulin signage. Minimal paid ads. |

### Revenue Patterns
- **Weekly pattern**: Sat–Sun busiest (50–60% of weekly revenue). Weekday afternoons moderate. Monday/Tuesday slowest.
- **Monthly pattern**: Spike around payday (15th, 30th) — customers splurge on haircuts, treatments, nails.
- **Seasonal peaks**: December (Christmas parties, family gatherings), February (Valentine's), graduation season (March–April), prom season, wedding season.
- **Service mix**: Basic services (haircut ₱100–₱300) are volume plays. Premium services (hair color ₱1,500–₱5,000, rebond ₱2,000–₱4,000, nails ₱500–₱1,500) are margin plays.

### Cash Flow Pattern
```
Customer walks in or books appointment → Service performed → Payment collected immediately (cash in)
Supplies purchased weekly/biweekly from supplier (cash out)
Rent paid monthly (cash out)
Staff commission paid daily or weekly (cash out)
```
- **Immediate cash cycle** — payment at time of service, no receivables
- Supplies are the main "invest before earn" cost, but purchased in bulk (not daily)
- Rent is the largest fixed cost — non-negotiable even on slow months
- Staff commission model means labor cost scales with revenue (good for cash flow)

### Common Expense Categories
| Category | Examples |
|----------|----------|
| Supplies | Hair color, developer, shampoo, conditioner, wax, nail polish, cotton, foil |
| Rent | Shop space rental, deposit payments |
| Labor | Staff commission, daily wages, SSS/PhilHealth (if formal) |
| Utilities | Electricity (aircon, dryers), water, internet/WiFi |
| Equipment | Chairs, mirrors, dryer units, sterilizer, towels, capes |
| Cleaning | Sanitizer, cleaning supplies, laundry for towels/capes |
| Marketing | Facebook ads, signage, loyalty cards |

### Common Financial Blind Spots
1. **Not tracking per-service profitability** — doesn't know if hair color services are more profitable than haircuts after accounting for product cost + time
2. **Commission variance not tracked** — different staff have different commission rates, total labor cost fluctuates
3. **Supply wastage** — opened products that expire or get wasted (especially color and chemicals)
4. **Rent as % of revenue not monitored** — if rent is ₱20K and revenue drops to ₱50K, that's 40% on rent alone
5. **No appointment tracking = no show data** — doesn't know how many no-shows happen or their revenue impact
6. **Personal grooming products mixed with business** — owner uses salon products for personal use, cost blurs

### Pain Timing
| When | Pain |
|------|------|
| Daily | Staff commission calculation — manual, error-prone |
| Weekly | Supply reorder decisions — which products are running low? |
| Monthly | Rent due + BIR + staff wages all hit at once |
| Slow days (Mon–Tue) | Revenue dip but fixed costs (rent, utilities) continue |

---

## 9. Business Type Taxonomy & Fallback Map

> This section is the single source of truth for mapping business types to profiles and prompt context.
> When implementing `business-context.ts` (Layer 2.5), use this table to determine which context to load.

### Full Taxonomy (16 types, 8 categories)

| Category | business_type | Display Name | Phase | Full Profile | Fallback To |
|----------|--------------|-------------|-------|-------------|------------|
| Food & Beverage | `food_baking` | Baking / Food Business | 1 | §1 | — |
| Food & Beverage | `food_carinderia` | Karinderya / Carinderia | 2 | §7 | — |
| Food & Beverage | `food_catering` | Catering / Food Cart | 3 | §10 stub | `food_baking` |
| Online Commerce | `online_selling` | Online Selling | 1 | §2 | — |
| Freelance | `freelance_creative` | Freelance / Creative | 1 | §3 | — |
| Freelance | `freelance_professional` | Professional Services | 3 | §10 stub | `freelance_creative` |
| Retail | `sari_sari_retail` | Sari-Sari / Retail Store | 1 | §4 | — |
| Services | `service_salon` | Salon / Barbershop / Spa | 2 | §8 | — |
| Services | `service_laundry` | Laundry Shop | 3 | §10 stub | `service_salon` |
| Services | `service_auto` | Auto Repair / Carwash | 3 | §10 stub | `service_salon` |
| Transport | `transport_operator` | Tricycle / UV Express / Delivery Fleet | 3 | §10 stub | generic (§5) |
| Agriculture | `agri_farm` | Small Farm / Livestock | 3 | §10 stub | generic (§5) |
| Agriculture | `agri_vendor` | Fish / Meat / Produce Vendor | 3 | §10 stub | generic (§5) |
| Manufacturing | `manufacturing_crafts` | Garments / Crafts / Furniture | 3 | §10 stub | generic (§5) |
| Property | `property_rental` | Boarding House / Apartment Rental | 3 | §10 stub | generic (§5) |
| Other | `other` | Iba Pa (Other Business) | 1 | — | generic (§5) |

### Fallback Chain Logic

When loading business context for prompt assembly:

```
1. Exact match: business_type has a full profile → use it
2. Category fallback: business_type has a stub → use the fallback type's profile
3. Generic fallback: no match or 'other' → use §5 Common Across All MSMEs
```

**Fallback assignments:**

| business_type | → Falls back to | Rationale |
|--------------|----------------|-----------|
| `food_catering` | `food_baking` | Similar cost structure (ingredients-heavy, order-based) |
| `freelance_professional` | `freelance_creative` | Similar income pattern (project/retainer), tax treatment |
| `service_laundry` | `service_salon` | Similar fixed-cost model (rent, utilities, labor) |
| `service_auto` | `service_salon` | Similar service-based model (walk-in, parts = supplies) |
| `transport_operator` | generic (§5) | Unique economics, no close match |
| `agri_farm` | generic (§5) | Unique seasonal/harvest cycle |
| `agri_vendor` | generic (§5) | Daily cash cycle similar to sari-sari but perishable-focused |
| `manufacturing_crafts` | generic (§5) | Order-based but unique production cycle |
| `property_rental` | generic (§5) | Passive income model, unique among MSMEs |
| `other` | generic (§5) | Catch-all — KA uses universal MSME knowledge |

### Naming Convention

Format: `{category}_{subtype}` — stored as TEXT in `business_profiles.business_type`

- Category prefix enables grouping in queries: `WHERE business_type LIKE 'food_%'`
- No Postgres ENUM — adding new types requires no migration
- The `other` type is first-class — users should never be forced into a wrong category

### Onboarding Display (Kilala Kita Step 2)

Phase 1 shows 5 options:
1. 🍰 Food / Baking (`food_baking`)
2. 🛒 Online Selling (`online_selling`)
3. 🎨 Freelance / Creative (`freelance_creative`)
4. 🏪 Sari-Sari / Retail (`sari_sari_retail`)
5. ➕ Iba Pa (`other`) — with free-text field for description

Phase 2 expands to 7:
- Add 🍲 Karinderya (`food_carinderia`)
- Add 💇 Salon / Barbershop (`service_salon`)

Phase 3 expands further based on `other` type descriptions collected from users (demand signal).

---

## 10. Phase 3 Business Type Stubs

> Stub profiles — Overview table only. Full profiles written when Phase 3 build begins or when user demand signals justify earlier investment.

### Food/Catering & Food Cart (`food_catering`)

| Attribute | Value |
|-----------|-------|
| Typical monthly revenue | ₱50,000–₱300,000 (highly variable, event-dependent) |
| Typical net margin | 25–35% |
| Primary sales channels | Word-of-mouth, Facebook, event planners |
| Primary payment methods | GCash (50%), bank transfer (30%), cash (20%) |
| Business model | Event-based (catering) or daily foot-traffic (food cart/stall) |
| Key cost drivers | Ingredients (45–55%), labor (15–20%), transport (5–10%) |
| Unique challenge | Lumpy revenue — big events then nothing. Advance deposits critical. |

### Professional Services (`freelance_professional`)

| Attribute | Value |
|-----------|-------|
| Typical monthly revenue | ₱40,000–₱120,000 |
| Typical net margin | 65–85% |
| Primary sales channels | Referrals, LinkedIn, professional networks |
| Primary payment methods | Bank transfer (60%), GCash (30%), check (10%) |
| Business model | Hourly/retainer (tutoring, consulting) or project-based (accounting, legal) |
| Key cost drivers | Office/coworking (10–15%), software/tools (5–10%), transport (5%) |
| Unique challenge | Client acquisition — fewer but higher-value clients than creative freelancers |

### Laundry Shop (`service_laundry`)

| Attribute | Value |
|-----------|-------|
| Typical monthly revenue | ₱40,000–₱120,000 |
| Typical net margin | 25–35% |
| Primary sales channels | Walk-in (80%), neighborhood word-of-mouth (20%) |
| Primary payment methods | Cash (70%), GCash (30%) |
| Business model | Per-kilo or per-load pricing. Self-service or full-service. |
| Key cost drivers | Utilities/water (15–20%), detergent/supplies (10–15%), rent (15–25%), equipment (10%) |
| Unique challenge | High fixed costs (machines, rent, water) — need minimum volume to break even |

### Auto Repair / Carwash (`service_auto`)

| Attribute | Value |
|-----------|-------|
| Typical monthly revenue | ₱30,000–₱150,000 |
| Typical net margin | 25–40% |
| Primary sales channels | Walk-in, word-of-mouth, Viber/Facebook groups for car communities |
| Primary payment methods | Cash (65%), GCash (30%), card (5%) |
| Business model | Service-based (labor + parts). Carwash: per-vehicle pricing. |
| Key cost drivers | Parts/supplies (30–40%), labor (20–25%), rent (10–20%), tools/equipment (5%) |
| Unique challenge | Parts sourcing — genuine vs. surplus vs. aftermarket pricing complexity |

### Tricycle / Delivery Fleet (`transport_operator`)

| Attribute | Value |
|-----------|-------|
| Typical monthly revenue | ₱15,000–₱50,000 (per vehicle) |
| Typical net margin | 30–45% |
| Primary sales channels | Fixed routes, barangay franchise, delivery app partnerships |
| Primary payment methods | Cash (90%), GCash (10%) |
| Business model | Daily "boundary" system (driver pays fixed daily fee to operator) or owner-driver |
| Key cost drivers | Fuel (30–40%), maintenance (10–15%), franchise/boundary fees (if applicable) |
| Unique challenge | All-cash, zero paper trail. Fuel costs fluctuate. Vehicle depreciation ignored. |

### Small Farm / Livestock (`agri_farm`)

| Attribute | Value |
|-----------|-------|
| Typical monthly revenue | ₱20,000–₱100,000 (seasonal/harvest-dependent) |
| Typical net margin | 15–30% |
| Primary sales channels | Traders/middlemen, direct palengke sales, farm-to-table Facebook groups |
| Primary payment methods | Cash (80%), GCash (15%), check from traders (5%) |
| Business model | Harvest cycles (crops) or continuous production (livestock/eggs/fish) |
| Key cost drivers | Feed/inputs (40–50%), labor (15–20%), transport to market (10%) |
| Unique challenge | Highly seasonal, weather-dependent, perishable output, middleman pricing power |

### Fish / Meat / Produce Vendor (`agri_vendor`)

| Attribute | Value |
|-----------|-------|
| Typical daily revenue | ₱3,000–₱15,000 |
| Typical net margin | 15–25% |
| Primary sales channels | Palengke stall, talipapa, roadside |
| Primary payment methods | Cash (90%), GCash (10%) |
| Business model | Buy wholesale (early morning) → sell retail (throughout day). Daily inventory cycle. |
| Key cost drivers | Inventory/COGS (70–80%), stall rent (5–10%), ice/cold storage (3–5%) |
| Unique challenge | Perishable inventory — unsold product is a total loss. Spoilage = biggest hidden cost. |

### Garments / Crafts / Furniture (`manufacturing_crafts`)

| Attribute | Value |
|-----------|-------|
| Typical monthly revenue | ₱30,000–₱150,000 |
| Typical net margin | 25–40% |
| Primary sales channels | Facebook, Shopee, craft fairs, direct orders, consignment |
| Primary payment methods | GCash (40%), bank transfer (30%), COD (20%), cash (10%) |
| Business model | Made-to-order or small batch production. Often combines online selling + local market. |
| Key cost drivers | Raw materials (35–45%), labor (20–30%), shipping/delivery (5–10%) |
| Unique challenge | Long production cycle, custom orders = scope creep, raw material price volatility |

### Boarding House / Apartment Rental (`property_rental`)

| Attribute | Value |
|-----------|-------|
| Typical monthly revenue | ₱15,000–₱80,000 (depending on units) |
| Typical net margin | 40–60% (after mortgage/loan, if applicable) |
| Primary sales channels | Word-of-mouth, Facebook Marketplace, Carousell |
| Primary payment methods | GCash (40%), bank transfer (30%), cash (30%) |
| Business model | Monthly rental income. Fixed tenants (boarding house) or rotating (short-term). |
| Key cost drivers | Maintenance/repairs (10–15%), utilities (5–10%), property tax (5%), mortgage/loan (variable) |
| Unique challenge | Unpaid rent/late payments, maintenance requests, utility disputes with tenants |

---

## 11. How This File Connects to the Codebase

### Current (Reference)
- Source material for FINANCIAL_SCOPE in `scopes.ts` — enriches boundary rules with business understanding
- Feeds Build 1 (Kilala Kita) — business type selection → inferred cost structure, revenue pattern, pain points
- Informs `kilala-kita-context.md` — first-response templates need business-specific knowledge
- §9 taxonomy is the source of truth for `business-context.ts` fallback chain

### Build 1 Integration
- Business profile data (§1–4, §7–8) → injected into `business-context.ts` Layer 2.5 (see design spec in `context_update.md`)
- Fallback chain (§9) → determines which context to load per business type
- §10 stub profiles → provide minimal context for Phase 3 types via fallback to full profiles
- KA can infer: "Maria selected Food/Baking → typical margins are 25–35%, biggest costs are ingredients and delivery"
- Personalization variables: `business_type`, `income_range`, `primary_pain` → select relevant snippets

### Build 1+ Integration (business_benchmarks table)
- §1–4, §7–8 cost structure data → seed the `business_benchmarks` Supabase table (`computation_version: 0`)
- Real user data from `transactions` table → monthly aggregation replaces seed data (`computation_version: 1+`)
- KA references benchmarks at prompt assembly time: "Similar food businesses spend ~45% on ingredients"
- `min_sample_threshold = 5` — KA only cites real data when enough users of that type exist

### Build 2 Integration (Dashboard)
- Cost structure tables → power the "Saan Napunta" expense categorization defaults
- Revenue patterns → inform Morning Briefing comparison baselines ("Your sales this week vs typical for [month]")
- Seasonal patterns → drive proactive alerts ("Christmas rush is coming")
- Benchmarks table → "Your expenses are 52% on ingredients — similar businesses average 45%"

### Build 3 Integration (Resibo Scanner)
- Common expense categories → pre-populated category suggestions after OCR
- Business-type-specific categories → food seller sees "Ingredients, Packaging, Delivery" not generic categories
- Carinderia sees "Ingredients, LPG, Labor" — distinct from food/baking categories

### Regression Testing
8 test cases to verify KA uses correct business knowledge:
1. Maria (food seller) logs ₱50K ingredients → KA recognizes this as ~50% of typical revenue, doesn't flag as unusual
2. Jose (online seller) asks about profit → KA mentions platform fees, shipping costs, returns as deductions from gross
3. Ana (freelancer) has zero income for 2 weeks → KA normalizes this as "feast-or-famine pattern," doesn't panic
4. Any user's expenses are 0% of revenue for a month → KA gently asks if expenses are being tracked
5. User approaching ₱3M annual → KA surfaces VAT threshold warning (cross-ref with bir-knowledge-base.md §4)
6. Carinderia user logs ₱0 LPG expenses → KA asks "Na-log mo ba ang LPG mo? Usually 5–8% yan ng revenue."
7. Salon user's rent exceeds 30% of revenue → KA flags: "Mataas ang rent mo vs revenue — 30%+ na. Monitor mo."
8. `food_catering` user (no full profile) → KA falls back to food_baking context, not generic

---

## Sources

- [DTI MSME Statistics 2024](https://www.dti.gov.ph/negosyo/msme-statistics/) — 1,236,908 MSMEs (99.63% of all businesses), 62.4% of employment, ~36-40% of GDP
- [Shopee Seller Fees Philippines](https://seller.shopee.ph/edu/article/421)
- [Lazada Seller Commission Rates](https://pages.lazada.com.ph/wow/gcp/route/lazada/ph/upr_1000345_lazada/channel/ph/upr-router/ph)
- AKBai Market Research v1.1
- AKBai Operations Playbook v7
- Philippine Statistics Authority — 2023 MSME Survey

### Sources added April 2026
- [Cloud Ecommerce: Shopee Fees Guide 2026](https://www.cloudecommerce.com/blog/complete-shopee-fees-guide-2026-commission-payment-and-hidden-costs-for-philippine-sellers/)
- [BigSeller: Shopee PH 2026 Seller Program Fees](https://www.bigseller.com/blog/articleDetails/4259/shopee-philippines-2026-seller-program-service-fees-adjustment.htm)
- [BigSeller: Lazada PH Commission 2026](https://www.bigseller.com/blog/articleDetails/4211/commission-fees-for-selling-on-lazada-philippines-2026.htm)
- [TikTok Shop Academy PH](https://seller-ph.tiktok.com/university/essay?knowledge_id=2675772847064834)
- [IMARC: Philippines Social Commerce Market](https://www.imarcgroup.com/philippines-social-commerce-market)
- [Trabahong Online: Freelancer Salary Guide PH 2026](https://trabahongonline.com/en/salary)
- [Upwork Help: Freelancer Service Fee](https://support.upwork.com/hc/en-us/articles/211062538)
- [GCash Help: Account Limits](https://help.gcash.com/hc/en-us/articles/360021112894)
- [Maya Business](https://www.maya.ph/business)
- [Meltwater: Social Media Statistics PH 2026](https://www.meltwater.com/en/blog/social-media-statistics-philippines)
