# akbai-delivery

AKBai product delivery plugin for Claude Code / Cowork.

**12 role-based skills** across 3 phases, **15 slash commands** (pending — 0 of 15 built), **5 shared context files**, and **~36 skill-specific reference files**.

## Structure

```
akbai-delivery/
├── .claude-plugin/plugin.json     # Plugin metadata
├── README.md                      # This file
├── shared/                        # Shared context (all skills read these)
│   ├── project-context.md         # Product briefing (~200 lines)
│   ├── tech-stack.md              # Canonical tech stack reference
│   ├── gap-registry.md            # 29 pre-launch gaps, 10 CRITICAL hard gates
│   ├── glossary.md                # Product, business, technical, Taglish terms
│   └── brand-context.md           # Brand identity, voice, colors, messaging
├── skills/                        # 12 role-based skills
│   ├── project-manager/           # Phase A — Foundation
│   │   ├── SKILL.md
│   │   └── references/
│   ├── solutions-architect/       # Phase A
│   │   ├── SKILL.md
│   │   └── references/
│   ├── data-architect/            # Phase A
│   │   ├── SKILL.md
│   │   └── references/
│   ├── fullstack-engineer/        # Phase A
│   │   ├── SKILL.md
│   │   └── references/
│   ├── ai-engineer/               # Phase B — Engineering Depth
│   │   ├── SKILL.md
│   │   └── references/
│   ├── qa-engineer/               # Phase B
│   │   ├── SKILL.md
│   │   └── references/
│   ├── security-compliance/       # Phase B
│   │   ├── SKILL.md
│   │   └── references/
│   ├── devops-engineer/           # Phase B
│   │   ├── SKILL.md
│   │   └── references/
│   ├── ux-designer/               # Phase C — Full Delivery
│   │   ├── SKILL.md
│   │   └── references/
│   ├── marketing-lead/            # Phase C
│   │   ├── SKILL.md
│   │   └── references/
│   ├── product-owner/             # Phase C
│   │   ├── SKILL.md
│   │   └── references/
│   └── ops-lead/                  # Phase C
│       ├── SKILL.md
│       └── references/
└── commands/                      # 15 slash commands (PENDING — not yet built)
    # Planned: sprint, build, review, test, deploy, incident, standup,
    #          gap-check, sense-check, schema, prompt, copy, compliance,
    #          metrics, retro
```

## Build Phases

- **Phase A** (Sessions 2–4): project-manager, solutions-architect, data-architect, fullstack-engineer
- **Phase B** (Sessions 5–6): ai-engineer, qa-engineer, security-compliance, devops-engineer
- **Phase C** (Sessions 7–8): ux-designer, marketing-lead, product-owner, ops-lead
- **Session 9**: Integration testing — fire every command, verify outputs
- **Session 10**: Description optimization with skill-creator

## Source Documents

| Document | Version | Location |
|----------|---------|----------|
| Complete Roadmap | v14 | /AKBai/project/AKBai_Complete_Roadmap_v14.pdf |
| Financial Model | v5 | /AKBai/project/AKBai_Financial_Model_v5.xlsx |
| Market Research | v1 | /AKBai/project/AKBai_Market_Research_v1.pdf |
| Operations Playbook | v7 | /AKBai/project/AKBai_Operations_Playbook_v7.pdf |
| Operations Roadmap | v6 | /AKBai/project/AKBai_Operations_Roadmap_v6.pdf |
| Competitive Brief | v2 | /AKBai/project/AKBai_Competitive_Brief_v2.pdf |
| Post-Implementation Vision | v1 | /AKBai/project/AKBai_Post_Implementation_Vision_v1.pdf |
| Brand Guide | v1.0 | /AKBai/brand/AKBai Brand Book.pdf |
| Plugin Strategy | v1 | /AKBai/project/AKBai_Plugin_Strategy_v1.html |
| Skills Utilization Guide | v1 | /AKBai/project/AKBai_Skills_Utilization_Guide_v1.html |
