# Channel Playbook -- Phase 0B
> Specific tactics, timing, and templates for each acquisition channel
> Last updated: 2026-04-03 | Reference: content-calendar.md for full templates

---

## 1. Free BIR Tools

**Goal:** Primary conversion channel. Every tool session ends with a waitlist CTA.

### Tools to Build

| Tool | Priority | Sprint | Description |
|------|----------|--------|-------------|
| BIR Deadline Checker | #1 | M2 | Enter business type → see 2026 deadlines with countdown timers |
| 8% Flat Tax Calculator | #2 | M3 | Input annual income → compare 8% flat vs graduated rates |
| Receipt Cost Calculator | #3 | M3 | Input monthly receipts → compare manual cost vs AKBai cost |

### Conversion Flow
```
User discovers tool (via SEO, FB post, or direct link)
  → Uses tool (gets immediate value)
  → Sees result + CTA: "Gusto mo ng automatic reminders? Join the waitlist."
  → Enters email
  → PostHog tracks: tool_used (tool name), waitlist_signup (source: tool name)
  → Enters email nurture sequence
```

### Sharing Mechanics
- Each tool result includes a "Share sa Facebook" button
- Shared link includes OG tags with the tool result preview
- Example: "May 15 ang next BIR deadline mo -- 23 days na lang! Check mo rin: [link]"

### BIR Disclaimer
Every tool that shows tax-related information must display:
> "Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo."

---

## 2. Facebook Groups

**Goal:** Build credibility in 3+ groups, generate 30-50% of total waitlist signups.

### Target Groups

| Group | Est. Members | Primary Persona | Content Fit |
|-------|-------------|----------------|-------------|
| Negosyante PH | 200K+ | Maria, Jose | BIR tips, business stories, expense tracking |
| Online Sellers PH | 300K+ | Jose | Platform fees, tax on online sales, GCash tracking |
| Freelancers PH | 100K+ | Ana | 8% flat tax, quarterly filing, invoicing |
| I Need Bookkeeper PH | 10K+ | All | Expense tracking, receipt management |
| Tax Forum PH | 50K+ | All | BIR questions, filing guides |

### Phase 1: Silent Observation (Week 1-2)
- Join groups. Read 50+ posts per group.
- Note: What questions repeat? What language do they use? Who are the trusted voices?
- Do NOT post or comment yet.
- Goal: Understand the group culture before contributing.

### Phase 2: Value Bombing (Week 3-4)
- Answer 3-5 BIR/tax questions per week with genuinely helpful responses.
- Use the Katuwang voice -- conversational Filipino, warm, specific numbers, BIR disclaimer included.
- Zero mentions of AKBai. Pure value.
- Track which answers get the most engagement (saves, comments, thank-yous).

**Example answer to "Paano ko i-track expenses ko?":**
```
Depende sa volume mo, pero eto ang pinaka-simple na approach:

1. Kunan mo ng photo every receipt agad-agad (wag mo na itabi physically -- mawawala lang)
2. Every Sunday, 30 minutes lang -- i-log mo sa Google Sheets: Date, Amount, Category, Notes
3. Categories: Ingredients, Packaging, Delivery, Utilities, Miscellaneous

Hindi kailangan ng fancy app para mag-start. Ang important ay consistent ka.

Pro tip: Kung GCash ka madalas, i-screenshot mo rin yung transaction history every week -- backup yan in case na-miss mo.
```

### Phase 3: Build-in-Public (Week 5+)
- Start posting original content using Template B (Build-in-Public Story).
- "Day X of building an AI business partner for Filipino sellers..."
- Share real progress, real struggles, real learnings.
- Soft CTA: "Comment BETA if gusto mo subukan."
- Continue answering questions (value never stops).

### Phase 4: Admin Outreach (Week 7+)
- Only after 4+ weeks of genuine group presence.
- DM admin using script from content-calendar.md Section 9.
- Offer permanent free Business tier (₱899/mo value).
- No obligation to post. The product earns the endorsement.

### Posting Schedule (per group)
| Day | Content Type | Template |
|-----|-------------|----------|
| Monday | BIR tip / educational | Template A |
| Thursday | Build-in-public / story | Template B |
| Saturday | Engagement poll / question | Template C |

### Rules
- Never post the same content in multiple groups on the same day.
- Vary content between groups -- each group has a different vibe.
- If a post gets <5 engagements, the hook didn't work. Try a different angle next time.
- Never argue or get defensive in comments. Be helpful, always.
- BIR disclaimer on every tax-related post.

---

## 3. SEO Blog

**Goal:** Rank for 5-6 BIR/tax keywords, drive 1,000+ monthly sessions by M4.

### Keyword Targets

| # | Keyword | Monthly Volume (est.) | Difficulty | Article Status |
|---|---------|----------------------|-----------|---------------|
| 1 | "BIR deadline 2026 Philippines" | 5,000+ (seasonal) | Low | Not started |
| 2 | "paano mag-file ng 1701Q" | 2,000+ (seasonal) | Low-Med | Not started |
| 3 | "8% flat tax freelancer Philippines" | 1,500+ | Low | Not started |
| 4 | "GCash income tax Philippines" | 1,000+ | Low | Not started |
| 5 | "online selling tax Philippines" | 2,000+ | Medium | Not started |
| 6 | "small business expense tracker Philippines" | 500+ | Low | Not started |

### Article Template
See content-calendar.md Section 3 for full structure. Key points:

- 1,200-1,800 words per article
- Conversational Filipino (Tagalog flow + English technical terms)
- H1: Keyword-rich title
- Include FAQ section (3-5 questions) -- this powers AEO
- Add FAQ JSON-LD schema to each article
- Single soft CTA: "Join the AKBai waitlist for automatic BIR reminders."
- BIR disclaimer at the bottom

### Publishing Cadence
- 1 article per week (M2-M4)
- Batch-write on Sunday, publish on Wednesday 10 AM
- Promote each article via FB group posts + email to waitlist

### Internal Linking Strategy
- Every article links to the BIR Deadline Checker tool
- Articles link to each other where relevant
- Landing page links to all articles (blog index)

---

## 4. TikTok / Instagram

**Goal:** 500+ followers, drive awareness and tool/waitlist traffic.

### Content Formats

| Format | Length | Frequency | Template |
|--------|--------|-----------|----------|
| "Alam Mo Ba?" | 15-30 sec | 2x/week | Quick BIR fact + tip |
| Deadline Countdown | 15 sec | Before each deadline | "[X] days before [form]!" |
| Build-in-Public | 15-30 sec | 1x/week | "Day [X] of building..." |
| Screen Recording | 30-60 sec | 1x/week (M3+) | AKBai answering real question |

### Production Tips (Solo Founder)
- Batch record 4-5 videos in one Sunday session (30-45 min)
- Use phone camera + natural lighting (no fancy setup needed)
- Screen recordings: use phone screen recorder, add captions
- Captions are mandatory -- most watch without sound
- Use trending audio only if it fits naturally

### Hashtags
```
#BIRtax #NegosyoPH #OnlineSellersPH #FreelancerPH
#SmallBusinessPH #MSMEPilipinas #TaxTipsPH
#BuildInPublic #StartupPH #AKBai
```

### Posting Times
- TikTok: 8-10 PM (evening scroll time)
- Instagram Reels: 12-1 PM (lunch break) or 8-10 PM

---

## 5. Email Nurture

**Goal:** 40%+ open rate, keep waitlist warm until launch.

### Waitlist Sequence (5 emails, 14 days)

| # | Day | Subject Line | Content | CTA |
|---|-----|-------------|---------|-----|
| 1 | 0 | "Welcome sa waitlist, [Name]! Eto ang una mong BIR tip." | Thank them + 1 useful BIR tip + set expectations | None (build trust) |
| 2 | 3 | "Alam mo ba magkano ang penalty pag late ang BIR filing mo?" | BIR penalty breakdown with real ₱ amounts | Link to BIR Deadline Checker |
| 3 | 7 | "Bakit ko ginagawa ang AKBai" | Anton's founder story -- day job, building at night, why MSMEs deserve better | Share with a friend |
| 4 | 10 | "[X] negosyante na ang nag-sign up" | Waitlist count + feature preview | Forward to a friend |
| 5 | 14 | "Malapit na ang launch -- ready ka na ba?" | Launch timeline + early access benefit | Refer a friend for priority access |

### BIR Deadline Emails (Triggered)
Sent to entire waitlist before major BIR deadlines:

- T-7 days: "Reminder: [Form] deadline on [Date]"
- T-1 day: "Bukas na ang deadline -- ready ka na ba?"
- T+1 day: "Na-file mo na? Here's what to do kung na-miss mo"

### Email Rules
- From name: "Anton from AKBai" (personal, not corporate)
- conversational Filipino subject lines always
- Unsubscribe link in every email (legal requirement)
- BIR disclaimer on tax-related emails
- Track: open rate, click rate, unsubscribe rate per email
- If open rate drops below 30%, rework subject lines

---

## 6. Reddit

**Goal:** Establish authentic presence, drive 5-10% of waitlist signups.

### Target Subreddits

| Subreddit | Members | Content Fit |
|-----------|---------|-------------|
| r/buhaydigital | 50K+ | Freelancer tax, online income, tools |
| r/phinvest | 500K+ | Financial planning, tax optimization, side income |
| r/taxPH | 10K+ | BIR questions, filing guides, penalties |
| r/BusinessPH | 20K+ | MSME stories, business tools, founder journeys |
| r/Philippines | 1M+ | General -- only for highly relevant threads |

### Reddit Strategy
- **Answer first, promote never.** Reddit users are allergic to self-promotion.
- Spend 2-3 weeks answering BIR/tax questions before ever mentioning AKBai.
- When mentioning AKBai: "I'm building a tool that does this" (casual, not salesy).
- Post a genuine founder story in r/buhaydigital or r/BusinessPH -- "I'm a Globe employee building an AI for Filipino MSMEs at night."
- Founder stories with real details (day job, hours, motivation) perform well on Reddit.

### Rules
- Never post the same content in multiple subreddits.
- Never use marketing language ("revolutionary", "game-changing", etc.).
- If someone asks a question AKBai could answer, answer it yourself first -- then mention you're building a tool to automate that.
- Respect subreddit rules. Some ban self-promotion entirely.

---

## Channel Priority Matrix

| Channel | Effort (hrs/week) | Expected Impact | Priority |
|---------|-------------------|----------------|----------|
| Free BIR Tools | 0 (after build) | HIGH -- primary converter | M1-M2 |
| Facebook Groups | 2-3 hrs | HIGH -- largest audience | M2-M5 |
| SEO Blog | 2-3 hrs | MEDIUM -- compounds over time | M2-M4 |
| Email Nurture | 0.5 hrs | MEDIUM -- keeps leads warm | M3-M5 |
| TikTok/IG | 1-2 hrs | MEDIUM -- awareness builder | M3-M5 |
| Reddit | 0.5-1 hr | LOW-MED -- quality over quantity | M2-M4 |

**Total weekly time budget:** 6-9 hrs (shared with product work in Anton's 10-15 hr/sprint)

---

*Every channel follows the same principle: teach something genuinely useful first, mention AKBai only when it naturally fits. We earn attention -- we don't buy it.*
