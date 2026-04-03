# Free Tool Usage Metrics
> Tracks engagement with AKBai's free BIR tools (the "tool is marketing" strategy)
> Last updated: 2026-04-03 | Source: PostHog

---

## Tools to Track

| Tool | Launch Sprint | PostHog Event | Status |
|------|-------------|---------------|--------|
| BIR Deadline Checker | M2 | `tool_used {tool_name: "bir_deadline_checker"}` | NOT BUILT |
| 8% Flat Tax Calculator | M3 | `tool_used {tool_name: "tax_calculator"}` | NOT BUILT |
| Receipt Cost Calculator | M3 | `tool_used {tool_name: "cost_calculator"}` | NOT BUILT |

---

## PostHog Events Specification

### tool_used
Fired when a user completes a tool interaction (gets a result).

```typescript
posthog.capture('tool_used', {
  tool_name: string,        // 'bir_deadline_checker' | 'tax_calculator' | 'cost_calculator'
  business_type?: string,   // User's selected business type (if applicable)
  result_type?: string,     // What kind of result was shown
  session_source?: string,  // How user arrived (utm_source or referrer)
});
```

### tool_shared
Fired when a user clicks the "Share sa Facebook" button on a tool result.

```typescript
posthog.capture('tool_shared', {
  tool_name: string,
  share_platform: string,   // 'facebook' | 'twitter' | 'copy_link'
});
```

### tool_to_waitlist
Fired when a user clicks the waitlist CTA after using a tool.

```typescript
posthog.capture('tool_to_waitlist', {
  tool_name: string,
  time_on_tool: number,     // Seconds spent on tool before clicking CTA
});
```

---

## Weekly Tool Performance Report

### Template

```
## Week of [DATE]

### Tool Sessions
| Tool | Sessions | Unique Users | Avg. Time on Tool | Shares | Waitlist Clicks | Conversion |
|------|----------|-------------|-------------------|--------|----------------|-----------|
| BIR Deadline Checker | | | | | | |
| 8% Tax Calculator | | | | | | |
| Receipt Cost Calculator | | | | | | |
| **TOTAL** | | | | | | |

### Funnel: Tool → Waitlist
| Step | Count | Drop-off |
|------|-------|----------|
| Tool page loaded | | -- |
| Tool interaction completed | | % |
| Waitlist CTA seen | | % |
| Waitlist CTA clicked | | % |
| Email submitted | | % |

### Top Traffic Sources to Tools
| Source | Sessions | Waitlist Signups | Conversion |
|--------|----------|-----------------|-----------|
| Google Search (organic) | | | |
| Facebook (group posts) | | | |
| Direct | | | |
| Reddit | | | |
| Email | | | |

### BIR Deadline Checker — Business Type Breakdown
| Business Type Selected | Count | % of Total |
|----------------------|-------|-----------|
| Freelancer / Professional | | |
| Online Seller | | |
| Food Business | | |
| Sari-Sari / Retail | | |
| Other | | |

### Key Insights
1. [Which tool converts best?]
2. [Which traffic source brings highest-intent users?]
3. [What business types are most represented?]
```

---

## Monthly Trend

| Month | Total Sessions | Unique Users | Waitlist from Tools | Tool → Waitlist Rate |
|-------|---------------|-------------|--------------------|--------------------|
| April 2026 | | | | |
| May 2026 | | | | |
| June 2026 | | | | |

---

## Success Benchmarks

| Metric | Target | Rationale |
|--------|--------|-----------|
| Total tool sessions (M2-M5) | 500+ | Validates demand for free BIR tools |
| Tool → waitlist conversion | 15%+ | Tool users are warm leads -- should convert higher than blog |
| Tool share rate | 5%+ | Indicates viral potential |
| Return visitors (used tool 2+ times) | 20%+ | BIR Deadline Checker should have recurring usage before each deadline |
| Most popular business type | Freelancer or Online Seller | Validates our persona prioritization |

---

## Tool Optimization Checklist

For each tool, check after 2 weeks of data:

- [ ] Is the tool loading in <2 seconds? (LCP check)
- [ ] Are users completing the tool interaction? (drop-off at which step?)
- [ ] Is the waitlist CTA visible without scrolling after results?
- [ ] Is the "Share sa Facebook" button generating shares?
- [ ] Are the OG tags generating a good preview when shared?
- [ ] Is the PostHog tracking firing correctly for all events?

---

*Free tools are our #1 conversion channel. Every optimization here directly impacts waitlist numbers. Review tool metrics weekly alongside channel metrics.*
