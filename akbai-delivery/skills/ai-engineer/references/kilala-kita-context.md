# AKBai — Kilala Kita Onboarding Context
> Used by: ai-engineer, fullstack-engineer (Build 1), ux-designer, product-owner
> Source: ux-flows.md §1, msme-business-knowledge.md §1–9, bir-knowledge-base.md §1–5
> Last updated: 2026-03-22
> **This file defines what KA knows at each onboarding step and how to deliver the "Maria Moment" — the first response that proves KA gets the user's business.**

---

## 1. Step-by-Step KA Knowledge Map

The 5-step Kilala Kita flow progressively builds KA's understanding of the user. After each step, KA can infer more about the user's business, tax situation, and pain points.

### After Step 1: Welcome + Name

**Stored:** `users.display_name` = `[Name]`

**KA knows:**
- User's first name → use in all greetings, milestones, and error recovery
- Nothing about the business yet — KA is warm but generic

**KA says:** "Nice to meet you, [Name]! Tara, kilalanin kita nang kaunti."

---

### After Step 2: Business Type

**Stored:** `business_profiles.business_type` = one of:
- `food_baking` | `online_selling` | `freelance_creative` | `sari_sari_retail` | `other`
- Phase 2 adds: `food_carinderia` | `service_salon`

**KA now infers (cross-ref with `msme-business-knowledge.md`):**

| business_type | Inferred BIR Forms | Typical Margin | Biggest Cost | Cash Flow Pattern |
|--------------|-------------------|---------------|-------------|-------------------|
| `food_baking` | 1701Q, 1701A (+ 2551Q if graduated) | 25–35% | Ingredients (40–50%) | Cash out before cash in |
| `online_selling` | 1701Q, 1701A (+ 2550Q if VAT) | 15–30% | COGS + platform fees (55–65%) | Settlement delay (3–14 days) |
| `freelance_creative` | 1701Q, 1701A (8% flat likely) | 60–80% | Software + time | Work before payment |
| `sari_sari_retail` | 1701Q, 1701A (+ 2551Q if graduated) | 15–25% | Inventory (70–80%) | Daily cash cycle |
| `food_carinderia` | 1701Q, 1701A (+ 2551Q if graduated) | 20–30% | Ingredients (50–60%) | Same-day cash cycle |
| `service_salon` | 1701Q, 1701A (+ 2551Q if graduated) | 20–35% | Rent + labor (35–55%) | Immediate payment |
| `other` | Generic — ask during first interaction | Unknown | Unknown | Unknown |

**KA also infers:**
- Relevant expense categories for Resibo Scanner auto-categorization
- Seasonal patterns (Christmas rush for food, campaign spikes for online)
- Common financial blind spots to watch for
- Fallback chain if type is `other` → use §5 Common MSME knowledge

**KA says:** "Ah, [type] — marami akong kakilala diyan! Next question..."

---

### After Step 3: Monthly Income Range

**Stored:** `business_profiles.income_range` = one of:
- `below_50k` | `50k_150k` | `150k_500k` | `above_500k`

**KA now infers:**

| income_range | Annual Estimate | Tax Complexity | VAT Risk | Tier Fit |
|-------------|----------------|---------------|----------|----------|
| `below_50k` | < ₱600K | Simple — 8% flat likely optimal | None | Free tier may suffice initially |
| `50k_150k` | ₱600K–₱1.8M | Moderate — 8% flat vs graduated decision | Low | Pro tier clear ROI |
| `150k_500k` | ₱1.8M–₱6M | Complex — may cross ₱3M VAT threshold | **Monitor** | Pro tier essential |
| `above_500k` | > ₱6M | High — likely VAT-registered or should be | **Likely VAT** | Business tier |

**Combined inference (business_type + income_range):**
- `food_baking` + `150k_500k` → Maria is successful, approaching VAT threshold. Monitor cumulative annual.
- `freelance_creative` + `below_50k` → Ana may be starting out. 8% flat is simplest. Quarterly filing reminders.
- `online_selling` + `above_500k` → Jose is likely VAT-registered or should be. Suggest CPA immediately.
- `sari_sari_retail` + `below_50k` → Andoy may not be BIR-registered. Guide toward formalization gently.

---

### After Step 4: Biggest Pain Point

**Stored:** `users.primary_pain` = one of:
- `receipt_tracking` | `bir_compliance` | `customer_messages` | `knowing_earnings`

**KA now infers:**

| primary_pain | First Feature to Suggest | Morning Briefing Lead | Conversation Tone |
|-------------|------------------------|---------------------|-------------------|
| `receipt_tracking` | Resibo Scanner | Expense summary card | Quick wins — "I-scan mo lang" |
| `bir_compliance` | Deadline Watcher | Next BIR deadline card | Calm reassurance — "Hindi kailangang matakot" |
| `customer_messages` | Reply Drafter | Pending replies card | Efficiency — "I-draft ko para sa'yo" |
| `knowing_earnings` | Dashboard / Daily Check-In | Cash position card | Eye-opening — "Eto ang actual na kita mo" |

**This step drives the first-response template selection** (see §2 below).

---

### After Step 5: BIR Data Consent

**Stored:** `users.bir_consent` = `true` or `false`

**If `true` (consented):**
- Deadline Watcher: ENABLED
- BIR form calendar: Auto-generated based on `business_type` + `income_range`
  - `food_baking` + non-VAT → 1701Q (May/Aug/Nov 15), 1701A (Apr 15), 2551Q (Jan/Apr/Jul/Oct 25)
  - `freelance_creative` + 8% flat → 1701Q (May/Aug/Nov 15), 1701A (Apr 15). NO 2551Q.
  - See `bir-knowledge-base.md` §2 for full calendar
- Push notification sequence: 7/3/1-day reminders for Pro/Business tier
- TAX_SCOPE: Fully active in system prompt

**If `false` (skipped):**
- Deadline Watcher: DISABLED (can enable in Settings later)
- BIR form calendar: Not generated
- TAX_SCOPE: Still available for general questions, but no proactive BIR alerts
- KA does NOT nag about enabling it — respect the user's choice

**Full personalization now unlocked.** KA has enough data to deliver the first meaningful message.

---

## 2. First KA Messages After Onboarding

> These are **static conversational Filipino templates**, NOT Claude API calls.
> The critical first impression must be consistent, human-crafted, and demonstrate that KA "gets" the user.
> Implementation: `getFirstKAMessage(businessType, primaryPainPoint)` lookup table.

### Phase 1 Templates (20 = 5 types × 4 pain points)

#### food_baking

| Pain Point | KA Message | Feature Nudge |
|-----------|-----------|---------------|
| `receipt_tracking` | "[Name], sisimulan ko nang i-organize ang expenses mo. I-scan mo ang first receipt mo — papakita ko sa'yo kung saan napupunta ang pera mo." | Resibo Scanner |
| `bir_compliance` | "Hindi kailangang matakot sa BIR, [Name]. I-set up ko na ang deadline reminders mo — 1701Q at 1701A lang naman usually sa food business." | Deadline Watcher |
| `customer_messages` | "[Name], alam kong nakakapagod mag-reply sa lahat ng orders. I-draft ko ang replies mo — i-paste mo na lang." | Reply Drafter |
| `knowing_earnings` | "Kumikita ka ba talaga, [Name]? Tara, alamin natin. I-log ang daily sales at expenses mo — ipapakita ko ang actual profit mo." | Dashboard + Daily Check-In |

#### online_selling

| Pain Point | KA Message | Feature Nudge |
|-----------|-----------|---------------|
| `receipt_tracking` | "[Name], maraming gastos sa online selling na hindi na-track — platform fees, shipping, packaging. I-scan mo ang receipts mo, I'll organize everything." | Resibo Scanner |
| `bir_compliance` | "BIR deadlines, [Name] — I-track natin. Kailangan mo ng 1701Q quarterly. Kung VAT ka na, 2550Q pa. I-set up ko na?" | Deadline Watcher |
| `customer_messages` | "DM overload, [Name]? I-paste mo ang customer message, I'll draft a reply. Copy-paste na lang." | Reply Drafter |
| `knowing_earnings` | "Tara, [Name] — i-track natin ang actual profit mo. Hindi lang sales ha — kasama na ang platform fees, shipping, at returns." | Dashboard |

#### freelance_creative

| Pain Point | KA Message | Feature Nudge |
|-----------|-----------|---------------|
| `receipt_tracking` | "[Name], yung software subscriptions at internet mo — business expense yan. I-log natin para sa tax deductions mo." | Resibo Scanner |
| `bir_compliance` | "Freelancer ka, [Name]? 8% flat tax ang pinaka-simple — quarterly filing lang. I-set up ko ang reminders mo." | Deadline Watcher |
| `customer_messages` | "[Name], I'll help you draft client replies — professional pero hindi robotic. I-paste mo lang ang message nila." | Reply Drafter |
| `knowing_earnings` | "Feast or famine ang freelance life, [Name]. I-track natin ang income mo per client — para alam mo kung sino ang worth it." | Dashboard |

#### sari_sari_retail

| Pain Point | KA Message | Feature Nudge |
|-----------|-----------|---------------|
| `receipt_tracking` | "[Name], alam kong mahirap mag-track ng gastos sa tindahan — palengke, distributors, lahat cash. Simulan natin nang dahan-dahan." | Resibo Scanner |
| `bir_compliance` | "[Name], okay lang kung hindi ka pa BIR-registered — marami namang ganyan. Pag ready ka, tutulungan kita sa process." | Deadline Watcher (if consented) |
| `customer_messages` | "[Name], para sa tindahan mo — i-log natin ang daily sales at gastos. Simple lang, 60 seconds every gabi." | Daily Check-In |
| `knowing_earnings` | "Kumikita ka ba talaga, [Name]? Hirap malaman kung iisa ang GCash ng personal at negosyo. Tara, i-separate natin." | Dashboard + Daily Check-In |

#### other (Iba Pa)

| Pain Point | KA Message | Feature Nudge |
|-----------|-----------|---------------|
| `receipt_tracking` | "[Name], kahit anong business mo — ang receipts ang susi sa financial clarity. I-scan mo ang first receipt mo, tara!" | Resibo Scanner |
| `bir_compliance` | "[Name], I-help kita sa BIR deadlines. Sabihin mo lang ang business type mo nang mas detalyado — i-customize ko ang reminders." | Deadline Watcher |
| `customer_messages` | "[Name], kapag may customer message ka na kailangan i-reply — i-paste mo dito. I'll draft it for you." | Reply Drafter |
| `knowing_earnings` | "[Name], tara — i-track natin ang income at expenses mo. Kahit simple lang muna, makikita mo kung kumikita ka talaga." | Dashboard + Daily Check-In |

### Phase 2 Templates (8 = 2 types × 4 pain points)

#### food_carinderia

| Pain Point | KA Message | Feature Nudge |
|-----------|-----------|---------------|
| `receipt_tracking` | "[Name], sa karinderya alam ko — palengke every morning, lahat walang resibo. I-log natin kahit estimate lang muna." | Resibo Scanner + Daily Check-In |
| `bir_compliance` | "[Name], maraming karinderya ang hindi pa registered sa BIR — at okay lang, tutulong ako pag ready ka na. Una, i-track muna natin ang sales mo." | Daily Check-In |
| `customer_messages` | "[Name], para sa karinderya mo — mas importante muna ang i-track ang daily sales at gastos. 60 seconds lang every gabi." | Daily Check-In |
| `knowing_earnings` | "[Name], sa karinderya mahirap malaman kung kumikita ka — ang daming cash na pumapasok at lumalabas. I-log natin araw-araw." | Dashboard + Daily Check-In |

#### service_salon

| Pain Point | KA Message | Feature Nudge |
|-----------|-----------|---------------|
| `receipt_tracking` | "[Name], sa salon maraming gastos — supplies, renta, commission. I-organize natin para makita mo kung saan napupunta ang pera." | Resibo Scanner |
| `bir_compliance` | "[Name], I-set up natin ang BIR deadlines mo. Sa salon business, 1701Q quarterly ang need mo usually." | Deadline Watcher |
| `customer_messages` | "[Name], kapag may nag-message for appointment or inquiry — i-paste mo dito, I'll draft a quick reply." | Reply Drafter |
| `knowing_earnings` | "[Name], alam mo ba kung anong service ang pinaka-profitable sa salon mo? Haircut vs. color vs. treatment — i-track natin." | Dashboard |

---

## 3. Personalization Variables Set by Kilala Kita

### Variable-to-System Flow

| Variable | Onboarding Step | DB Table.Column | Prompt Layer | Runtime Effect |
|----------|----------------|----------------|-------------|---------------|
| `first_name` | Step 1 | `users.display_name` | Layer 4 (User Context) | `{{user_first_name}}` in all prompts. Used in greetings, milestones, error recovery. |
| `business_type` | Step 2 | `business_profiles.business_type` | Layer 2.5 (Business Context) | Loads type-specific context snippet. Determines expense categories, BIR form inference, seasonal alerts. |
| `income_range` | Step 3 | `business_profiles.income_range` | Layer 4 (User Context) | VAT threshold monitoring trigger. Tier recommendation logic. Tax complexity assessment. |
| `primary_pain` | Step 4 | `users.primary_pain` | Layer 3 (Feature Context) | Morning Briefing lead card. First-use feature nudge. Conversation emphasis. |
| `bir_consent` | Step 5 | `users.bir_consent` | Layer 2 (Tax Scope) | Deadline Watcher enable/disable. BIR calendar generation. TAX_SCOPE proactive alerts. |
| `onboarding_completed` | After Step 5 | `users.onboarding_completed` | Middleware | Free tier query counter starts ONLY after onboarding completes (Gap E3). |
| `profile_version` | Auto-set | `business_profiles.profile_version` | — | Starts at 1. Increments on profile update. Triggers re-personalization. |

### Model Routing Impact

| Condition | Model | Rationale |
|-----------|-------|-----------|
| Onboarding flow itself | None (static templates) | First-response messages are pre-written, not API calls |
| Free tier, post-onboarding | Haiku | Cost optimization — 10 queries/day limit |
| Free tier, receipt scan | Not available | Scans are Pro/Business only |
| Pro/Business, general chat | Sonnet | Full reasoning for personalized insights |
| Pro/Business, OCR/classification | Haiku | Extraction tasks don't need Sonnet |

### Scope Selection Impact

| business_type | Default Scopes | Rationale |
|--------------|---------------|-----------|
| `food_baking` | tax, financial | Food sellers need BIR + expense tracking |
| `online_selling` | tax, financial | Platform fees + VAT complexity |
| `freelance_creative` | tax, financial | 8% flat tax + invoice tracking |
| `sari_sari_retail` | financial | Many not BIR-registered; financial tracking first |
| `food_carinderia` | financial | Similar to sari-sari — formalization comes later |
| `service_salon` | tax, financial | Rent, commission, BIR compliance |
| `other` | financial | Safe default — add tax scope when BIR-relevant |

---

## 4. CPA Escalation Timing

> KA is NOT a CPA. KA provides guidance, not advice. These rules define when KA should proactively suggest professional help.
> On every tax output, always append: "Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo."

### Automatic CPA Recommendation Triggers

| Trigger | Threshold | KA Message (conversational Filipino) | Business Types |
|---------|-----------|---------------------|---------------|
| VAT threshold warning (80%) | Cumulative annual revenue ≥ ₱2,400,000 | "Malapit ka na sa ₱3M VAT threshold, [Name]. Maganda nang kumonsulta sa CPA para sa VAT planning." | All |
| VAT threshold critical (90%) | Cumulative annual revenue ≥ ₱2,700,000 | "₱2.7M na ang annual revenue mo — malapit na sa ₱3M. Kailangan mo na ng CPA para sa VAT registration." | All |
| VAT threshold crossed | Cumulative annual revenue > ₱3,000,000 | "Lampas ka na sa ₱3M, [Name]. Legally, kailangan mo ng VAT registration. Kumonsulta agad sa CPA." | All |
| First quarterly filing | User's first BIR deadline approaching | "First filing mo, [Name] — baka gusto mo ng tulong ng CPA para sa unang beses? Mas kampante ka." | All |
| Tax method question | User asks "8% or graduated?" | "Yan ay depende sa business situation mo — tax advice na yan. Best i-ask sa CPA mo kung alin ang mas mababa para sa'yo." | All |
| Complex structure detected | Multiple businesses, mixed income, corporation | "May complex setup ka, [Name] — highly recommended na may CPA ka para sa combined filing." | All |
| Audit or penalty mention | User mentions BIR audit, penalty, notice | "Kung may BIR notice ka, [Name], kailangan mo ng CPA or tax lawyer ASAP. Seryoso yan." | All |

### Per-Business-Type CPA Nudges

| business_type | Special CPA Trigger | Context |
|--------------|-------------------|---------|
| `food_baking` | Revenue consistently above ₱200K/month | Approaching ₱3M annual. Food sellers often don't realize they're scaling into VAT territory. |
| `online_selling` | EWT withholding confusion | Platforms withhold tax — Jose may not know this counts as tax credit. CPA can optimize. |
| `freelance_creative` | First year of freelancing | Many freelancers don't know they need to register with BIR and file quarterly. |
| `sari_sari_retail` | Wants to formalize | "Ready ka na mag-register sa BIR? CPA can help make it painless — ₱5K–₱15K/year lang usually." |
| `food_carinderia` | First time hearing about BIR requirements | Many karinderiyas operate informally. KA guides, never judges. |
| `service_salon` | Staff commission complexity | Commission-based pay has withholding tax implications. CPA recommended. |

### CPA Cost Context (for KA to reference)

> KA can mention this to normalize the cost barrier:
- Basic CPA for sole proprietor: ₱5,000–₱15,000/year
- CPA for quarterly filing only: ₱2,000–₱5,000/quarter
- Many CPAs offer free initial consultation
- "Mas mura pa yan sa penalty ng BIR" — KA can say this to motivate

---

## 5. Implementation Notes (for Build 1)

### First-Response Template Lookup (NOT an API call)

```typescript
// Proposed implementation in Build 1 onboarding completion handler
type PainPoint = 'receipt_tracking' | 'bir_compliance' | 'customer_messages' | 'knowing_earnings';

function getFirstKAMessage(
  businessType: string,
  painPoint: PainPoint,
  firstName: string
): { message: string; featureNudge: string } {
  const key = `${businessType}_${painPoint}`;
  const template = FIRST_RESPONSE_TEMPLATES[key] ?? FIRST_RESPONSE_TEMPLATES[`other_${painPoint}`];
  return {
    message: template.message.replace('[Name]', firstName),
    featureNudge: template.featureNudge,
  };
}
```

### Onboarding Rate-Limit Exemption (Gap E3)

The free tier 10-query/day limit must NOT apply during Kilala Kita. The query counter starts only when `users.onboarding_completed = true`. This is a CRITICAL gap — users who hit the paywall before the "Maria Moment" will churn.

### Profile Versioning

`business_profiles.profile_version` starts at 1 after Kilala Kita. It increments when:
- User updates business type or income range in Settings
- Revenue crosses a band threshold (detected by KA)
- User has 10+ transactions (richer data = re-personalize)
- User explicitly tells KA something has changed

On version increment, the system prompt should re-assemble with fresh business context.

---

## 6. How This File Connects to the Codebase

### Current (Reference)
- Source material for Build 1 Kilala Kita implementation
- Defines the 28 first-response templates (§2) that will become a TypeScript lookup table
- Maps onboarding outputs to database columns and prompt layers (§3)
- CPA escalation rules (§4) feed into guardrails logic

### Build 1 Integration
- §2 templates → `frontend/src/lib/kilala-kita/first-responses.ts` (static lookup table)
- §3 personalization variables → `assembleSystemPrompt()` Layer 2.5 + Layer 4
- §4 CPA triggers → `frontend/src/lib/claude/guardrails.ts` (extend existing BIR disclaimer logic)
- §5 rate-limit exemption → `frontend/src/app/api/chat/route.ts` (check `onboarding_completed` before counting)

### Regression Testing
5 test cases to verify Kilala Kita personalization works:
1. `food_baking` + `receipt_tracking` → first response mentions ingredients, scanning, "saan napupunta ang pera"
2. `freelance_creative` + `bir_compliance` → first response mentions 8% flat tax, quarterly filing, reassurance
3. `sari_sari_retail` + `knowing_earnings` → first response mentions separating personal/business money
4. `other` + any pain → first response is generic but encouraging, suggests tracking
5. Any type + `above_500k` → KA internally flags for VAT threshold monitoring (not in first message, but in subsequent interactions)

---

## Sources

- `akbai-delivery/skills/ux-designer/references/ux-flows.md` §1 — Kilala Kita 5-step flow
- `akbai-delivery/skills/ai-engineer/references/bir-knowledge-base.md` §1–5 — BIR forms, deadlines, rates
- `akbai-delivery/skills/ai-engineer/references/msme-business-knowledge.md` §1–9 — Business profiles, taxonomy
- `akbai-delivery/skills/ux-designer/references/conversational-filipino-copy-guide.md` — Voice rules, tone calibration
- `context_update.md` — Original spec for this file
