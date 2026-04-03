# AKBai — Daily Rhythm Reference
> Used by: ops-lead
> Last updated: March 2026 | Source: Operations Playbook v7, Solo Founder Constraints

---

## 1. Morning Check (5 min, phone — before work or during commute)

This is designed to be done on a phone screen. No logins to complex dashboards. Just quick scans of notification-style tools.

### Checklist

| # | Check | Tool | What to Look For | Time |
|---|-------|------|-----------------|------|
| 1 | Errors | Sentry (mobile app or email digest) | New unresolved errors in last 24h. Focus on: P0 crashes, payment-related errors, data integrity issues. | 1 min |
| 2 | Uptime | UptimeRobot (mobile app or SMS alerts) | Any downtime events. Check: main app, API endpoints, Xendit webhook endpoint. | 30 sec |
| 3 | Support queue | Messenger / email inbox | New messages from users. Quickly classify: can Kai handle it (Tier 1), or does Anton need to respond (Tier 2/3)? | 1.5 min |
| 4 | Payment alerts | Xendit dashboard or email notifications | Failed payments, subscription changes, new signups. | 1 min |
| 5 | Flag queue | Admin view or Supabase dashboard | New flag-as-wrong submissions since last check. Note count only — detailed review happens in evening. | 30 sec |

### Decision After Morning Check

- **All green:** No action needed. Go to work. Evening build session proceeds as planned.
- **Yellow items exist:** Note them for tonight's session. Reorder evening priorities if needed.
- **Red items (Tier 3):** This is the only scenario where AKBai work happens during Globe hours. Data breach or legal issues can't wait. See SKILL.md §7 (Incident Response).

### Phone Setup Tips

To make this sustainable long-term:
- Enable Sentry email digest (daily, 7AM PHT)
- Enable UptimeRobot SMS alerts for downtime only (not recovery — you don't need the "back up" ping)
- Pin the Xendit dashboard as a home screen shortcut
- Set a recurring 7:30AM alarm labeled "AKBai 5-min check" — build the habit before it's needed

---

## 2. Evening Build Session Structure (Wed + Sat, 2–4 hrs)

The evening session is where real work happens. The key insight: don't spend the first 30 minutes figuring out what to do. The morning check and weekly standup should have already set priorities.

### Session Flow

```
[0:00–0:10] Warm-up: Review & Triage (10 min)
  → Check morning notes — any yellows or reds that changed status?
  → Pull up tonight's priority list (set during Monday standup or morning check)
  → If no pre-set priorities, use the default priority order:
      1. Tier 2 support tickets approaching SLA (>18h old)
      2. Flag-as-wrong reviews (batch review, aim for 0 queue)
      3. Sprint backlog items (from project-manager)
      4. Technical debt or ops improvements

[0:10–0:50] Deep Work Block 1 (40 min)
  → Focus on highest-priority item
  → No context switching — commit to one thing
  → If blocked, note the blocker and move to next item

[0:50–1:00] Break (10 min)
  → Step away from the screen. This isn't optional for sustained evening work.

[1:00–1:40] Deep Work Block 2 (40 min)
  → Next priority item, or continue block 1 if unfinished
  → If doing support: batch all Tier 2 responses in this block

[1:40–1:50] Break (10 min)

[1:50–2:20] Deep Work Block 3 (30 min) — if energy permits
  → Lower-priority items, polish, or prep for next session
  → Good time for: flag reviews, documentation updates, test writing

[2:20–2:30] Wrap-up (10 min)
  → Commit and push any code changes
  → Update task status (mark done, note blockers)
  → Write a 2-line note for tomorrow-Anton: "Did X. Next: Y. Blocked on: Z."
  → If Saturday session: prep Sunday metrics review (pull numbers now so Sunday is just analysis)
```

### Session Rules

- **Never start a 4-hour item in a 2-hour session.** Break it down first. If a task can't be broken into <2hr chunks, it needs decomposition (use project-manager skill).
- **Support responses are batched, not reactive.** Don't check messages mid-build. Batch them in one block.
- **The wrap-up note is sacred.** Future-Anton has zero context when he sits down 2 days later. The note bridges the gap.

---

## 3. Weekly Rhythm Overview

| Day | Activity | Duration | Focus |
|-----|----------|----------|-------|
| Mon (morning) | Monday Standup | 10 min | Review last week, set this week's priorities |
| Mon–Fri (morning) | Morning Check | 5 min | System health, support queue, payment alerts |
| Wed (evening) | Build Session | 2–4 hrs | Priority ops + development work |
| Sat (evening) | Build Session | 2–4 hrs | Priority ops + development work |
| Sun (morning) | Metrics + Competitor | 15 min | MRR review, product health, competitor pulse |

### Globe Day-Job Boundaries

- **No AKBai development work during Globe hours.** Period. The only exception is a Tier 3 incident (data breach, legal).
- **Lunch break (30 min)** can be used for: quick Messenger replies to urgent Tier 2 tickets, reading (not responding to) flag reviews, scanning competitor news. Never for coding or complex ops work.
- **Morning commute** is ideal for the 5-min check — it's a habit anchor.

---

## 4. Energy Management

Solo founder burnout is the biggest risk to AKBai. The rhythm is designed to prevent it:

- **Two build sessions per week, not three.** Resist the urge to add Friday nights. Consistency beats intensity.
- **Sunday is 15 minutes, not 2 hours.** Pull the numbers, note the trends, close the laptop. Don't let metrics reviews spiral into "let me just fix this one thing."
- **Skip a session if you need to.** The morning check catches anything urgent. A missed Wednesday build session is recoverable. A burned-out founder is not.
- **Build session energy follows a curve.** Block 1 is highest energy — put the hardest or most important work there. Block 3 is lowest — save mechanical tasks (support responses, flag reviews) for the end.
