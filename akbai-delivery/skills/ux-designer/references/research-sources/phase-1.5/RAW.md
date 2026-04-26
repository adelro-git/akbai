# Phase 1.5 — Expanded Research Q&A (RAW)

**Date:** 2026-04-26
**Purpose:** Targeted gap-filling on the post-expansion corpus.

**Notebooks:**
- UI/UX — `0127f12f-8da7-4932-833b-9a3b195cce94` — 79 sources
- Filipino MSME Context — `8ee05ad7-f7b9-4dc3-8215-a821105be136` — 105 sources

**Phase 1.5 expansion summary:**
- Added 9 repo canonical UX docs to UI/UX notebook (incl. cross-cutting brand/master docs).
- Added 13 repo canonical Filipino docs to Filipino notebook.
- Ran 4 deep-research searches on Filipino notebook + 2 on UI/UX notebook (Discover-style web search via `notebooklm source add-research --mode deep --import-all`), then cleaned up errored + duplicate sources.
- Asked 6 targeted Filipino questions + 4 targeted UI/UX questions. **9 of 10 returned answers.** Q6 (PH-specific thumb zones in retail context) timed out twice — corpus does not contain explicit evidence on this; defer to general thumb-zone guidance in `mobile-first.md`.

---

## Filipino notebook — Q1: Prepaid mobile data behavior + design implications

**Q:** Across the loaded sources, what specific behaviors do Filipino MSME owners exhibit when their prepaid mobile data cap is exhausted or near-exhausted? Cover free Wi-Fi behavior, deferring app use, image avoidance, GoSurf/SmartBro promo cycles. What design implications for an offline-first PWA?

**A:**
**1. GoSurf, SmartBro, and Promo Cycles**
Filipino mobile behavior is deeply rooted in the "sachet economy," where users rely heavily on bite-sized, prepaid data promos rather than postpaid plans.
- **Promo Stacking and Shifting:** Users actively manage their data by stacking promos like Globe's Go+149 (open access + app-specific data) or Smart's PowerAll and "Magic Data" (non-expiring). DITO offers ultra-low-cost "Data Sachets" starting at ₱10 for 1-day access.
- **Dual-SIM "Mix and Match" Behavior:** To maximize data caps and avoid running out of load, many Filipinos carry dual-SIM devices, jumping between networks (e.g., Globe to Smart) depending on which telco currently offers the best promo or signal in their location.
- **Promo Frustration:** Users are highly sensitive to promo changes; when telcos remove flexible options (e.g., 7-day promo extension, GoCREATE), they migrate to alternative networks or non-expiry data options.

**2. Free Wi-Fi Behavior and Deferring App Use**
To avoid exhausting prepaid data caps, users defer cellular data and switch it on only when out, relying on home/office Wi-Fi for heavier internet needs.

**3. Image Avoidance**
Sources do not explicitly evidence "image avoidance" behaviors. (Gap — assume conservatively in design.)

**4. Design Implications for Offline-First PWA**
- **Offline-First Architecture & Caching:** PWA manifest + service worker, TanStack Query + Persister for offline-first caching. App shell + recent data load instantly without active connection.
- **Uninterrupted Core Workflows:** App must never block essential daily tasks because a data promo expired. Logging sales, daily check-in, scanning receipts must work offline.
- **Background Syncing:** When offline, save input locally and auto-sync to Supabase when connection restored.
- **Reassuring Microcopy:** Use warm conversational Filipino: *"Walang internet ngayon — na-save ko muna sa phone mo. I-sync ko pag may connection."* (Establishes calm, not panic.)

---

## Filipino notebook — Q2: Hiya and money culture, design framings

**Q:** What does the loaded research say about hiya (shame/face) and its interaction with money tracking? How does hiya manifest as financial avoidance? What design patterns/copy framings overcome the "I don't want to look" behavior in a warm, non-shaming way?

**A:**
**How hiya manifests as financial avoidance:**
- **Uncollected Debt due to Embarrassment:** For sari-sari owners, *utang* extension is common; "mental ledger or notebook" with "no systematic tracking" because **"embarrassment prevents collection."** Significant amounts are written off due to social friction.
- **Compliance Procrastination Cycle:** confused → anxious → avoid → deadline passes → penalty → more anxiety.
- **Guilt and Denial over Cash Flow:** Bookkeeping evokes "avoidance, guilt"; zero cash-flow visibility leads to "denial, worry." Mix personal/business cash, don't know if profitable, avoid checking out of fear.
- **Structural Avoidance:** ~42% of MSMEs and 49% of sari-sari owners who haven't applied for formal loans avoid them because **"afraid of going into debt."**

**Design patterns to overcome avoidance (Sage-Caregiver framing):**

1. **Normalize fear:** *"First filing mo — normal lang kabahan. Step by step natin gagawin."*
2. **Reframe negative weeks without shame:** *"Mahirap ang linggong 'to, pero ginalingan mo pa rin. Eto ang mga maliliit na panalo..."* — frame as "part of accountability, not shame," safe to share with family.
3. **Observation over judgment:** Soften, never command. *"Ayon sa cash flow mo, mukhang tight ang susunod na buwan. Observation lang ito — ikaw ang magde-decide."* For corrections: *"Mukhang off ang amount — paki-check? Baka may extra zero?"* (note "baka" = maybe, saves face).
4. **Action-oriented empty states:** *"Wala ka pang naka-log na gastos. I-try mo ang Resibo Scanner?"*
5. **Trust Recovery (AI owns mistakes):** *"Ay, mali pala ang amount kanina... Na-correct ko na. Sorry po!"* — by normalizing apologies, reduces user's own *hiya* about business mistakes.

(All 5 patterns already exist in `conversational-filipino-manual.md` — confirmation, not net-new. Stat additions: 42% / 49% loan avoidance is new evidence for `brand-context.md`.)

---

## Filipino notebook — Q3: Platform sellers vs sari-sari MSME archetypes

**Q:** How do Lazada/Shopee/TikTok Shop sellers differ from sari-sari and home-baking MSMEs in pain, workflows, retention, features? Which archetype most strongly responds to Filipino-language conversational tools, family-victory framing, weekly recaps?

**A:**
**Pain points:**
- *Platform sellers (Jose):* Platform fees eating margins (Shopee/Lazada/TikTok 10–25% of gross). GCash income reconciliation nightmares (3–14 day settlement, batched payments). DM/Chat overload across 3–5 platforms simultaneously. Lost sales during peak hours.
- *Sari-sari & home-baking (Andoy/Maria):* Cash flow blindness (mixed personal/business in single GCash). Receipt chaos (faded/handwritten palengke receipts). Sari-sari: uncollected utang, spoilage. Home bakers: uncounted delivery/packaging eating margins. Both: paralyzing BIR compliance terror.

**Daily workflows:**
- *Platform sellers:* Highly structured digital fulfillment. 8 AM seller-center checks → 9–12 waybills/packing → returns/listings. **Heavily dictated by payday spikes (15th, 30th) + mega campaigns (9.9, 11.11) → 3–10x normal daily volume.**
- *Sari-sari & home-baking:* Physical labor + daily cash cycles. Home bakers 6 AM FB/Viber check → palengke run → cook → personal/GrabExpress delivery. Sari-sari: continuous walk-in customer cycle, cash box, afternoon wholesaler restock, manual cash count at night with little record-keeping.

**Retention drivers:**
- *Platform sellers:* Advanced margin clarity + auto-reconciliation. GCash payments auto-matched to platform orders, accurate per-product margins (with hidden platform fees), clear VAT computations.
- *Sari-sari & home-baking:* Emotional relief + instant visibility. Home bakers: the **"Maria Moment"** — opening app and seeing reassuring insight ("Kumikita ka. ₱18,400 ang net mo this month"). Sari-sari: 60-second daily check-in revealing actual daily profit for the first time.

**Feature priorities:**
- *Platform sellers:* Platform fee calculators, online-seller-tailored receipts/invoices, multi-platform chat management (Reply Drafters).
- *Sari-sari & home-baking:* Resibo Scanners (camera-to-expense, no typing), Deadline Watchers (proactive BIR reminders), simple Daily Check-Ins. Sari-sari eventually need utang management + inventory trackers.

**Which archetype responds most to FIL conversational + family-victory framing + weekly recaps:**
**Offline, informal MSMEs (sari-sari + home-baking) respond most powerfully.**
- 56% of MSMEs still rely on manual/paper records, 74% believe their business is "not big enough" for digital tools.
- Sari-sari specifically: low digital literacy, uncomfortable with complex apps/typing, prefer tap or voice. View formal financial systems as "distant and intimidating" — English-only corporate voice alienates them.
- Family-victory framing data: 64% of MSMEs started business for family financial independence, 38% for children's education. **Sari-sari specifically: 71% family financial independence, 53% children's education.**
- Linggong Kuwento family-victory framing (*"Naipon mo ang ₱18,400... katumbas ng buwanang tuition ni Junior"*) is the highest-resonance retention hook for these archetypes.

---

## Filipino notebook — Q4: Family economic decision-making and app adoption

**Q:** Family/spouse/children involvement in adoption and continued use? Patterns of "kid sets it up, mom uses it"? Onboarding/share UX implications?

**A:**
**Family as core economic driver:** 64% start for family financial independence, 38% for children's education.

**Observable patterns of family involvement:**
- **"Child as the Digital Bridge":** Children step in to navigate complex digital/bureaucratic hurdles for older parents. Community quote: "My Mom has a small business and I've seen her struggle with all the paperworks and processes she needs to do to comply with BIR."
- **Intergenerational Digital Upgrades:** Adoption often happens at generational handover. Jason Endaya invested in Packworks (digital inventory) immediately after inheriting his mother's manual sari-sari, citing manual = "too much stress."
- **Hand-Me-Down Hardware:** Primary business device for older "Andoy"-type sari-sari owners is often a "hand-me-down from a child."
- **Uncosted Family Labor:** Spouses/children frequently work for free → "actual labor cost is hidden" from bottom line. Margin blind spot.

**UX implications for onboarding & share:**
- **Frame milestones as family victories:** "Naipon mo ang ₱18,400 ngayong linggo, [Name] — katumbas ng buwanang tuition ni Junior."
- **"I-share sa family" CTA:** Encourage sharing even flat/negative weeks; framed as "part of accountability, not shame."
- **Conversational, low-friction onboarding:** Older MSME owners with hand-me-down devices need familiar guided chat — not SaaS forms. Use prompts like "Tara, kilalanin kita."
- **Bite-sized action prompts:** "60 seconds lang!" microcopy lowers barrier for owners managing store + family duties.

---

## Filipino notebook — Q5: Manila vs provincial regional variation

**Q:** Differences between NCR vs Cebu/Davao/provincial in mobile usage, BIR compliance, financial literacy, response to digital tools, family/community? Design adjustments?

**A:**
**Mobile usage and connectivity (hard stats):**
- **NCR/Metro Manila:** 68.7% household home internet, 79.3% individuals online, 6.1 hours/day online (highest in country).
- **Provincial:** Bangsamoro Autonomous Region in Muslim Mindanao (BARMM) just 27.7% home internet. Cagayan Valley logs lowest daily online time at 3.4 hours. Patchy/unreliable rural internet — inventory sync takes hours, digital payments fail.

**Hardware tier:**
- *NCR:* Significant share of premium/mid-range smartphone sales (higher income, retail density).
- *Provincial:* Heavy reliance on budget/entry-level smartphones — Transsion brands (TECNO, Infinix) dominate sub-$100 market. Despite poor infrastructure, rural MSMEs adopt digital tools when accessible — hundreds of thousands of provincial sari-sari stores have adopted basic POS systems on cheap tablets.

**Family and community structures:**
- *NCR:* Urban digital commerce driven by online selling, platform marketplaces (Shopee/Lazada), logistics/delivery apps.
- *Provincial:* Sari-sari stores **double as community/social centers**. Owners are "neighbors and friends" → utang system deeply entrenched, refusing credit socially difficult, high reliance on handwritten notebooks, frequent uncollected-debt write-offs.

**BIR compliance / financial literacy:** Sources don't differentiate by region. Across the board: cash flow blindness, mixed personal/business funds (especially via GCash), BIR fear due to complex forms + steep penalties. Reliance on informal cash operations especially high in provincial sari-sari.

**Design adjustments:**
- **Offline-first architecture for patchy networks:** Never block on offline. *"Walang internet ngayon — na-save ko muna sa phone mo. I-sync ko pag may connection."*
- **Regional language COMPREHENSION (not translation):** AI should understand regional greetings ("maayong buntag" Cebuano) and address terms ("bai", "dong"), but **respond in standard conversational Filipino** to avoid tokenizing or awkward forced translations. **(NEW RULE — load-bearing.)**
- **Optimization for low-end hardware:** Provincial users on budget smartphones with lower RAM. Avoid heavy 3D animations, bloated features. Lightweight PWA with basic layouts for smaller screen resolutions and older devices.
- **Culturally sensitive utang management:** Eventually feature an utang tracker that sends polite automated SMS/Messenger reminders to remove face-to-face confrontation friction with neighbors.

---

## UI/UX notebook — Q1: Retention design patterns proven in emerging-market fintech

**Q:** Across the corpus, what specific design patterns have demonstrated measurable retention lift for micro-entrepreneur users? Cite app + metric where possible.

**A:**
**Notification timing:** Precisely timed external triggers (WhatsApp/SMS reminders for daily transactions, customer repayment prompts). **Khatabook → merchants get paid up to 3x faster** with these reminders.

**Streak design:**
- **ZA Bank:** daily check-in calendars as visual prompts.
- **Hard metrics:** **daily streaks → 45% increase in user engagement**, **check-in calendars → 2x increase in app login frequency.**
- **Moniepoint:** weekly-resetting streak system; merchants must maintain high daily transaction volumes to protect tier status next week.

**Share mechanics:**
- **MoneyLion's Achievement feature:** earn/track/share financial badges.
- For micro-entrepreneurs, **referrals + social media metrics serve as alternative-credit-scoring proxies** for community standing/reliability.

**Narrative framing (weekly recap):** Acts as the **"Retention Anchor"** — transforms raw transaction data into operational tool. Total sales, top items, outstanding credit, vs-prior-week comparison. Drives:
- Operational awareness (inventory adjustments)
- Debt management (visibility into who owes)
- Financial resilience (seasonal trend identification → cash flow prep)

**Variable reward variance:**
- **Khatabook:** "Khatabook Coins" redeemable for value-added services (automated IVR payment reminders).
- **Moniepoint:** Performance-tier rewards — 15% cash back on POS fees, 30% on interbank transfers for high-volume users.
- **Flourish Fi × Banco Carrefour, BancoSol:** **32% increase in deposit value, 2x app login frequency, users who saved nothing previously now saved ~$600 over 6–8 months.**

---

## UI/UX notebook — Q2: PWA performance budgets for mid-range Android

**Q:** Specific perf metrics that predict retention vs churn on Snapdragon 4xx-6xx, Android 11-13? Concrete budgets for first/repeat load on cold cache, prepaid 3G/4G? Service-worker caching strategies?

**A:**
**Metrics & retention:**
- Sources don't explicitly correlate CLS/INP to retention. They establish **technical reliability is a "hygiene factor" for retention** — failures from intermittent connectivity drive immediate abandonment back to paper.
- Hard targets: **LCP ≤ 2.5s, FCP < 1.5s, TTI < 3.5s.**

**Concrete budgets for Slow 3G + mid-range Android (cold cache):**
- **Total page weight:** < 500KB initially (incl. fonts + icons).
- **Total JS bundle:** < 200KB gzipped.
- **Image budget:** ≤ 200KB total cold home load. User-uploaded receipts compressed to under 200KB at 80% JPEG.
- **Visual assets:** Inline decorative SVGs + tree-shaken UI icons (Lucide React) — avoid extra HTTP requests.

**Validated service-worker caching strategies (offline-first stack):**
- `next-pwa` for service worker + **TanStack Query + Persister** for data caching.
- **Daily caching (stale-while-revalidate):** Morning Briefing cached daily, marked stale after 24h. Display stale + "Last updated" indicator instead of empty state.
- **Incremental foreground updates:** Heavy lists (expense list) fully cached on first load, incrementally updated on each foreground event.
- **Setup-level caching:** User profile, BIR deadlines cached indefinitely until profile-version change.
- **Queued mutations:** Offline check-in/costing actions saved to mutation queue; auto-sync on next foreground connection with brief "Synced ✓" toast. AI OCR (requires internet) gracefully explains rather than erroring.

---

## UI/UX notebook — Q3: Variable reward variance for daily check-in

**Q:** What variance level for AI takeaway sentence — predictable warm vs randomly varied across emotional registers — maximizes habit formation without becoming annoying?

**A:**
**Rule:** **High variance in CONTENT, low variance in RELIABILITY.** Vary specific emotional register and insight daily, but restrict variance to a predictably supportive spectrum.

**1. Joy is in the anticipation (high variance in content):**
- Hooked: "joy of receiving a Reward is higher when there is uncertainty of obtaining a Reward, i.e., when the Reward is variable." Dopamine driven by *anticipation*, not receipt.
- AKBai application: Kai's morning takeaway is server-generated and varies day-to-day. Predictability kills retention; warm unpredictability builds it. Surface unexpected, varying insights ("Fun fact: Tuesday is your most profitable day!").

**2. Utility apps cannot use "failure" as variance:**
- Social media (Instagram) deliberately uses high variance by occasionally *failing* to surface interesting content (dissatisfaction → keep scrolling).
- Service apps (Uber) "require stable delivery of the Reward" — failure risks loss.
- Application: Variance in *type of insight*, never in failing to provide a useful summary.

**3. "Coach, not casino" — low variance in core empathy:**
- Extreme variable schedules in fintech blur into manipulation → compulsive behavior, risky trading.
- Sustainable retention requires "user-centric and purposeful, acting as a 'financial coach' rather than a 'casino'."
- Application: Kai (Sage-Caregiver) remains predictably empathetic and trustworthy at core.

**Operational rotation (3 tonal calibrations):**
- **Energetic/Encouraging** for morning briefings: *"3 tasks today, 1 deadline on Friday. Kaya mo 'to!"*
- **Observant/Careful** for sensitive financial advice: *"Ayon sa cash flow mo, mukhang tight ang susunod na buwan."*
- **Celebratory/Playful** for sales milestones: *"Ay, ₱100,000 na pala ang sales mo this month!"*

---

## UI/UX notebook — Q4: Family-share UX that drives retention and virality

**Q:** UX patterns from fintech/social/ecommerce that support sharing financial milestones with family in a way that drives both retention AND viral growth? What makes a "share with family" CTA convert?

**A:**
**Core thesis:** Treat family sharing not as transactional referral but as the **emotional climax of the user's weekly labor.**

64% of Filipino MSMEs start businesses for family financial independence — tapping this is the highest-leverage growth lever. Hooked Model: a user's "Investment" becomes an "external Trigger" for new users when results are made visible to others. Sharing a milestone deepens psychological investment (retention) AND casts a high-trust external trigger to family network (viral acquisition).

**1. Image format:**
- NOT spreadsheets/raw dashboards. Must feel **ritualistic celebration**.
- Linggong Kuwento uses **dark inverted palette** (deep ink background, warm cream text, honey accents) to visually distinguish from everyday data entry.
- Highlight bite-sized KPI victories: "record receipts scanned," "peak sales day," wrapped in culturally authentic design (banig-textured chart).

**2. Message preview:**
- Must sound like the MSME owner speaking to family — not automated bot.
- Conversational Filipino with VSO order, natural particles (ba, naman, pala).
- Pre-drafted copy reflects Sage-Caregiver persona: *"Isang linggo ng tubo at pag-asa."*
- Removes friction and *hiya* of bragging about money.

**3. Channel choice:**
- **Build for "dark social."** "Loyalty is forged in WhatsApp groups where consumers share and review products directly." For PH: Facebook Messenger and Viber group chats are the family ritual surface. Deep-link the rich-media Sunday Story directly.
- Khatabook achieved **40x growth** largely by integrating workflows with WhatsApp daily-communication tools.
- SMS useful for basic alerts only.

**4. Timing:**
- **Peak-End Rule.** Trigger share prompt only at the very end of the week, after highest-friction task (Friday/Saturday reconciliation).
- Concluding stressful week with celebratory recap + immediate share prompt transforms solitary administrative burden into collective family celebration.

---

## Gaps documented (deferred to later phase or general guidance)

1. **PH-specific thumb zone evidence** (Q6 timed out twice). Corpus lacks specific research on retail/sari-sari one-handed grip patterns for median Filipino smartphone user. Defer to general thumb-zone guidance in `mobile-first.md` (already canonical).
2. **Image-avoidance behavior on prepaid-cap exhaustion** (Q1). No direct evidence in corpus. Assume conservative defaults: image budget ≤ 200KB cold home load, lazy-load below the fold, prompt-aware compression on user uploads.
3. **BIR compliance / financial literacy split between NCR and provincial** (Q5). No regional differentiation in corpus. Treat as uniform until Phase 12 retention validation produces splits.

---

## Where each finding lands (canonical-doc updates applied 2026-04-26)

| Finding | Lands in | Tag |
|---|---|---|
| Sachet economy + dual-SIM + Wi-Fi-deferral patterns | `mobile-first.md` §1 (Filipino Connectivity Baseline) | `<!-- Phase 1.5 expansion, 2026-04-26 -->` |
| NCR vs provincial connectivity stats (68.7% / 27.7% home internet, 6.1 / 3.4 hr daily) + Transsion budget hardware | `mobile-first.md` §1 (Regional split sub-row) | Same tag |
| Concrete PWA budgets — LCP ≤ 2.5s / FCP < 1.5s / TTI < 3.5s, page < 500KB / JS < 200KB / images ≤ 200KB | `mobile-first.md` (Performance budget section, sharpened) | Same tag |
| Validated SW caching stack — TanStack Query + Persister, daily/stale-while-revalidate, incremental foreground, queued mutations | `mobile-first.md` (Offline behavior section, validated stack) | Same tag |
| Regional language comprehension (understand Cebuano/Bisaya, respond in Filipino) | `conversational-filipino-manual.md` §10 (new row) | Same tag |
| Hand-me-down hardware as device-tier validation | `mobile-first.md` §1 (Filipino device baseline note) | Same tag |
| Hard retention metrics: 45% engagement / 2x login / 32% deposit-value / Flourish Fi $600/6mo | `ui-ux-principles-akbai.md` (Retention investments — sharpen with evidence) | Same tag |
| Hooked variance rule: high content variance / low reliability variance / 3-tonal rotation (Energetic / Observant / Celebratory) | `ui-ux-principles-akbai.md` (Hooked Model section) | Same tag |
| Family-share UX rules: peak-end timing, dark inverted palette, pre-drafted FIL copy, Messenger/Viber > SMS | `ui-ux-principles-akbai.md` (Peak-End Rule section) | Same tag |
| 71% sari-sari family financial independence + 53% children's education + 49% loan avoidance | `shared/brand-context.md` (Why these pillars work — sari-sari refinement) | Same tag |
| "Child as Digital Bridge" + "Hand-Me-Down Hardware" + "Uncosted Family Labor" patterns | `filipino-text-vernacular.md` is wrong home; goes into `conversational-filipino-manual.md` §6 (Confirmations / family victory section enhancement) | Same tag |

(Findings already covered by existing Phase 1 entries are NOT re-applied — Q2 hiya patterns, conversational FIL voice rules already canonical.)
