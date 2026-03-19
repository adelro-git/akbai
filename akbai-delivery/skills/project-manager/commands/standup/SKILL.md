---
name: standup
description: "Generate a weekly standup with two outputs: a GitHub issue comment (structured, technical) and a build-in-public social post (Taglish, authentic, brand-aligned). Ask Anton for: what shipped this week, what's planned next, any blockers, and key metrics. Use brand-context.md for KA voice and tone. Keep standup brief — 5 minutes to review. Trigger when user asks: standup, weekly update, progress report, status, shipped this week, or public update."
---

# /standup — Weekly Standup Generator

## Before Starting

You are helping Anton communicate weekly progress in two formats: a technical GitHub update and an authentic build-in-public social post. Read these files:

1. **`shared/project-context.md`** — Product overview, phase, unit economics, KA persona (§8)
2. **`shared/brand-context.md`** — Brand voice (Pillar: Taglish-Fluent, Warm but Competent, Proactively Caring), KA persona = "Kai", messaging rules
3. **`shared/gap-registry.md`** — Current gaps and CRITICAL blockers (context for what's blocking progress)
4. **`references/sprint-templates.md`** — For reference on sprint terminology if needed

---

## Workflow

### Step 1: Gather Input from Anton

Ask Anton these questions — keep it conversational:

> "Let's do standup. Quick questions:
> 1. **What shipped this week?** (features, fixes, docs, anything users see or that unblocks the team)
> 2. **What's planned next?** (next 1–2 weeks)
> 3. **Any blockers?** (stuck on something? waiting on someone?)
> 4. **Key metrics?** (users, MRR, signups, anything movement-related)"

Wait for Anton to answer. Don't assume — let him tell you what actually happened.

### Step 2: Assess Current Phase & Context
- Read `shared/project-context.md` §6 "Current Phase" — what phase are we in?
- Check `shared/gap-registry.md` — are we blocked on any CRITICAL gaps?
- These inform the tone and framing of both outputs

### Step 3: Generate GitHub Issue Comment

**Audience:** Technical team (present/future team members, your own notes)
**Tone:** Structured, factual, link-heavy
**Length:** 5–10 sentences max, plus a bulleted summary

Structure:
```
**Status: [PHASE_NAME] — Week of [DATE]**

[One sentence summary of the week's primary output]

**Shipped:**
- [Feature/fix 1] — [link if available] ([impact])
- [Feature/fix 2] — [link if available]

**Next (week of [DATE]):**
- [Task 1] — blocks [gap/gate]
- [Task 2]

**Blockers:**
- [If any: what's blocking, why, estimated resolution]

**Metrics:**
- [If tracked: users, MRR, feature adoption, or milestone progress]
```

Example:
```
**Status: Phase 0A — Week of March 17**

Completed AI Scope design (Build 0 pre-req) and submitted BIR Certificate of Registration application. Two CRITICAL gaps down.

**Shipped:**
- Build 0 system prompt architecture doc (phase-gates.md prerequisite) — modular scope sections, domain expandable
- BIR COR application filed — receipt in hand, processing ~2 weeks

**Next (week of March 24):**
- Resolve OTP deliverability to Yahoo Mail PH (gap D1, blocks Build 1 launch)
- Draft Privacy Policy outline for lawyer review

**Blockers:**
- Awaiting BIR processing (est. 2–3 weeks). Proceeding with Phase 0A legal tasks in parallel.

**Metrics:**
- Phase 0A gate: 3/5 legal items done (DTI/SEC done, BIR COR in progress, NPC pre-compliance pending, IP/TM not started)
```

### Step 4: Generate Build-in-Public Social Post

**Audience:** Filipino MSME community (potential users, Taglish-fluent)
**Tone:** Warm, authentic, celebrates progress without revealing proprietary details
**Channels:** Can be posted to Twitter/X, LinkedIn, Instagram caption, or shared in public communities
**Length:** 4–6 sentences max, or a short thread (2–3 tweets)

**Rules:**
- Use Taglish naturally — Filipino when personal/warm, English when technical/specific
- Mention the problem being solved (not the feature) — "Hindi na nag-aalala si Maria..." not "We built receipt scanning"
- Celebrate small wins authentically — don't oversell
- Use first person ("I'm building...", "we learned...") — build-in-public tone
- Never reveal:
  - Specific unit economics or pricing (wait for launch)
  - Technical stack details (irrelevant to users)
  - Internal metrics (ARR, burn rate, runway)
  - Feature roadmap dates (avoid over-committing)
- Always tie back to the user's pain point
- Include a call-to-action if appropriate (join waitlist, send feedback, etc.)

**Structure:**
```
[Celebration of what shipped / problem being solved]

[Why it matters to Maria/target user]

[One learning or insight]

[CTA if relevant: waitlist, feedback, or just "following along"]
```

Examples:

**Good:**
```
One step closer to helping Maria sleep better at night 🌙

This week we submitted the BIR paperwork. Legal foundation is happening. ✅

Over 50 people have asked us about receipt scanning — so that's next. Hindi lang dapat manual, dapat smart.

Building in public. Join us: [waitlist link]
```

**Also good:**
```
Spent this week on the boring but critical stuff: making sure AKBai speaks to the BIR correctly, handles her data privately, and doesn't disappear on launch day.

Para sa negosyo, kung hindi secure at compliant, hindi kami worthy ng trust.

Legal foundation locked. MVP build starts next week.

Feedback welcome — DM us or check [link]
```

**Not good (too insider):**
```
Build 0 architecture complete. System prompt modular scope sections finalized. Proceeding to Build 1 sprint planning.

[No context for non-technical reader]
```

### Step 5: Validate Against Brand Guidelines

Before outputting, check the social post against `shared/brand-context.md`:

- [ ] Uses Taglish naturally (not too formal, not too casual)
- [ ] Warm tone — like talking to a friend, not a press release
- [ ] Shows competence (cites facts, not hype)
- [ ] Proactively caring (ties to user's pain point, not feature)
- [ ] Mentions users or customers by context (Maria, home-based sellers, etc.) OR acknowledges the problem they face
- [ ] No proprietary details leaked (unit economics, roadmap dates, internal metrics)
- [ ] Authentic — could come from a real founder, not marketing copy

### Step 6: Output Both Versions

Present both to Anton in this format:

```markdown
# Weekly Standup — Week of [DATE]

## GitHub Issue Comment
[Copy-paste ready for issue]

---

## Build-in-Public Social Post
[Copy-paste ready for Twitter/LinkedIn/etc.]

**Post length:** [X words / X tweets if threaded]
**Recommended platform:** [Twitter, LinkedIn, both, etc.]
**Tone:** [Casual / Celebratory / Reflective / etc.]
```

Let Anton review and edit before posting. These are his words — you're just helping organize them.

---

## Brand Voice Pillars (from brand-context.md)

### Pillar 1: Taglish-Fluent
- Natural mix of Filipino and English (more Tagalog when personal, more English when technical)
- Say the user's name (Maria, Jose, Ana, Andoy)
- Use "po" naturally when appropriate for warmth
- Short sentences (max 2 lines per bubble in chat; max 1–2 sentences per social post line)

### Pillar 2: Warm but Competent
- Always show data, cites numbers, confirms before saving
- Phrase: "Based sa records mo..." not "I think..."
- Trusted because it earns trust — not because it claims it
- No hype, no guarantees

### Pillar 3: Proactively Caring
- Anticipates needs (morning briefing, deadline alerts)
- Uses first name
- Celebrates milestones
- Never judges a missed deadline

**KA Persona Name:** "Kai" — the smart ate/kuya who always has your back

---

## What NOT to Include in Social Posts

**Never:**
- Pricing or unit economics ("break-even Month 7", "₱0.16 per scan")
- Feature release dates ("launching receipt scanning in 2 weeks")
- Specific OKR numbers or internal KPIs (runway, burn, ARR)
- Salary or funding details
- Detailed technical stack ("Next.js 14, Supabase, Claude API...")
- Competitor criticism
- Overly promotional tone ("THE FUTURE OF MSME ACCOUNTING!!!1!")

**Always:**
- Focus on the problem (Maria's pain point, not your solution)
- Show progress, not perfection
- Be honest about challenges if relevant ("legal stuff is slower than expected, but we're through 3 of 5 items")
- Leave space for feedback ("what's the #1 thing you'd want from an AI business partner?")

---

## Escalation Rules

If Anton provides metrics or context you're unsure how to frame:

- **Confusing/sensitive metrics** → Ask for clarification before writing
- **Significant blocker or setback** → Suggest a more honest, learning-oriented tone instead of cheerleading
- **Concern about brand misalignment** → Pause and ask Anton: "Does this feel authentic to you? Should we adjust the tone?"

---

## Quick Checklist Before Output

**GitHub comment:**
- [ ] One-sentence summary of week
- [ ] "Shipped" section with 2–3 items
- [ ] "Next" section with 1–2 items
- [ ] "Blockers" section (even if "None" — be honest)
- [ ] "Metrics" section tied to phase gates or user value
- [ ] Links included where relevant

**Social post:**
- [ ] Taglish tone (natural, not forced)
- [ ] References the user's pain point or Maria/target user
- [ ] One learning or insight (not just feature list)
- [ ] CTA if appropriate
- [ ] No proprietary details
- [ ] Authentic voice (sounds like Anton, not marketing)
- [ ] 4–6 sentences max (or 2–3 tweets if threaded)

**Both:**
- [ ] Validated against brand-context.md voice pillars
- [ ] Ready to copy-paste (no placeholders)
- [ ] Accurate (Anton approved the input)
