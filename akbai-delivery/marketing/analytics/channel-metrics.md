# Channel Performance Metrics -- Weekly Tracker
> Updated every Friday. Source: PostHog, Resend, platform analytics.
> Last updated: 2026-04-03

---

## Weekly Performance Report

### Template

Copy this template for each weekly report:

```
## Week of [DATE]

### Overview
| Metric | This Week | Last Week | Change | Notes |
|--------|-----------|-----------|--------|-------|
| Total waitlist signups (cumulative) | | | | |
| New signups this week | | | | |
| Site visitors (unique) | | | | |
| Visitor → signup conversion rate | | | | |

### Channel Breakdown
| Channel | Visitors | Signups | Conversion | Best Content |
|---------|----------|---------|-----------|-------------|
| Free BIR Tools | | | | |
| SEO Blog | | | | |
| Facebook Groups | | | | |
| TikTok/Instagram | | | | |
| Reddit | | | | |
| Email Referral | | | | |
| Direct/Other | | | | |

### Email Performance
| Email | Sent | Opens | Open Rate | Clicks | Click Rate | Unsubs |
|-------|------|-------|----------|--------|-----------|--------|
| [email name] | | | | | | |

### Facebook Group Activity
| Group | Posts This Week | Comments Received | Saves | AKBai Mentions |
|-------|----------------|-------------------|-------|---------------|
| [group name] | | | | |

### SEO Performance
| Article | Page Views | Avg. Time on Page | Bounce Rate | Waitlist Clicks |
|---------|-----------|-------------------|-------------|----------------|
| [article title] | | | | |

### Key Takeaways
1. [What worked this week]
2. [What didn't work]
3. [What to try next week]

### Action Items
- [ ] [Action 1]
- [ ] [Action 2]
- [ ] [Action 3]
```

---

## PostHog Events to Track

These events should be wired into the landing page and free tools:

| Event Name | Trigger | Properties |
|-----------|---------|-----------|
| `page_view` | Any page load | `path`, `referrer`, `utm_source`, `utm_medium`, `utm_campaign` |
| `waitlist_signup` | Email submitted on waitlist form | `source` (tool name, blog, direct), `email_domain` |
| `tool_used` | Free tool interaction completed | `tool_name` (bir_deadline_checker, tax_calculator, cost_calculator), `business_type` |
| `tool_shared` | User clicks "Share sa Facebook" on tool result | `tool_name`, `share_platform` |
| `blog_read` | User scrolls past 50% of article | `article_slug`, `time_on_page` |
| `cta_clicked` | User clicks any CTA button | `cta_type` (waitlist, tool, share), `location` (hero, footer, inline) |
| `email_link_clicked` | User clicks link in nurture email | `email_name`, `link_target` |

### UTM Parameter Convention

Use consistent UTM parameters for all links shared on external channels:

```
?utm_source=[channel]&utm_medium=[type]&utm_campaign=phase0b

Examples:
- Facebook group post: ?utm_source=facebook&utm_medium=group_post&utm_campaign=phase0b
- Reddit comment: ?utm_source=reddit&utm_medium=comment&utm_campaign=phase0b
- TikTok bio: ?utm_source=tiktok&utm_medium=bio_link&utm_campaign=phase0b
- Email nurture: ?utm_source=email&utm_medium=nurture&utm_campaign=phase0b
- Blog article CTA: ?utm_source=blog&utm_medium=inline_cta&utm_campaign=phase0b
```

---

## KPI Dashboard (Running Totals)

| KPI | Target | Current | Status |
|-----|--------|---------|--------|
| Waitlist signups | 100+ | 0 | NOT STARTED |
| Email open rate | 40%+ | -- | NOT STARTED |
| FB groups active in | 3+ | 0 | NOT STARTED |
| SEO articles published | 6 | 0 | NOT STARTED |
| Free tool sessions | 500+ | 0 | NOT STARTED |
| Monthly site visitors | 1,000+ | 0 | NOT STARTED |
| CAC | ₱0 | ₱0 | ON TRACK |

---

## Monthly Trend (Update at End of Each Month)

| Month | Signups | Visitors | Conversion | Top Channel | Notes |
|-------|---------|----------|-----------|-------------|-------|
| April 2026 | | | | | M1-M2 infrastructure |
| May 2026 | | | | | M3-M4 content push |
| June 2026 | | | | | M5 optimization |

---

*If any metric is trending below target for 2+ consecutive weeks, escalate to strategy review. Adjust channel allocation based on what's actually converting, not what we expected to convert.*
