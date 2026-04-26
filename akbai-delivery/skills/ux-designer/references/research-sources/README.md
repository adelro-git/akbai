# Research Sources Index — AKBai UI/UX + Filipino Context

This directory holds the evidence base for the Phase 1 research that grounds the AKBai redesign. Two reference docs in the parent directory ([`ui-ux-principles-akbai.md`](../ui-ux-principles-akbai.md) and [`filipino-design-context.md`](../filipino-design-context.md)) are distilled outputs of the NotebookLM Q&A over this corpus.

## How research was done

NotebookLM is the persistent research workspace — it holds the full corpus stably (well beyond a single LLM context window) and lets later phases re-query the same sources without rebuilding. The session was driven by the [NotebookLM CLI](https://pypi.org/project/notebooklm-py/) (`notebooklm` command, installed at `~/AppData/Local/Python/.../Scripts/notebooklm`) so the Q&A run is reproducible. Firecrawl was used previously to populate the existing 60-file Filipino-MSME cache (`.firecrawl/`); fresh UI/UX sources were added directly via NotebookLM URL paste.

The brief that drove the session is at [`NOTEBOOKLM-BRIEF.md`](./NOTEBOOKLM-BRIEF.md). Raw outputs are at:
- [`ui-ux-principles-akbai-RAW.md`](./ui-ux-principles-akbai-RAW.md) — 6 questions × ~50 lines each
- [`filipino-design-context-RAW.md`](./filipino-design-context-RAW.md) — 8 questions × ~65 lines each

## NotebookLM notebooks (live, queryable across phases)

| Notebook | ID | Web URL | Sources |
|---|---|---|---|
| AKBai UI/UX Principles | `0127f12f-8da7-4932-833b-9a3b195cce94` | https://notebooklm.google.com/notebook/0127f12f-8da7-4932-833b-9a3b195cce94 | 14 active (15 added; 1 was a 404 page) |
| AKBai Filipino MSME Context | `8ee05ad7-f7b9-4dc3-8215-a821105be136` | https://notebooklm.google.com/notebook/8ee05ad7-f7b9-4dc3-8215-a821105be136 | 11 active |

To re-query from any later phase:
```bash
notebooklm ask -n 0127f12f "your question here"      # UI/UX
notebooklm ask -n 8ee05ad7 "your question here"      # Filipino
```

## Source manifests

### Notebook 1 — AKBai UI/UX Principles (15 sources)

| # | Title | Type |
|---|---|---|
| 1 | Jakob's Law — Laws of UX | web |
| 2 | Hick's Law — Laws of UX | web |
| 3 | Fitts's Law — Laws of UX | web |
| 4 | Aesthetic-Usability Effect — Laws of UX | web |
| 5 | Peak-End Rule — Laws of UX | web |
| 6 | Tesler's Law — Laws of UX | web |
| 7 | Goal-Gradient Effect — Laws of UX | web |
| 8 | Mobile User Experience — NN/g | web |
| 9 | Mobile UX Design Articles — NN/g | web |
| 10 | Mobile UX Mistakes — Smashing Magazine *(404 — only minimal content; contributed nothing)* | web |
| 11 | Emotion & Design — Don Norman / JND.org | web |
| 12 | Hooked Book — Nir Eyal | web |
| 13 | WCAG 2.1 Quickref — W3C | web |
| 14 | prefers-reduced-motion — web.dev | web |
| 15 | Largest Contentful Paint (LCP) — web.dev | web |

### Notebook 2 — AKBai Filipino MSME Context (11 active sources)

| # | Title | Type | Notes |
|---|---|---|---|
| 1 | COMMUNITY_RESEARCH_REPORT.md | markdown | AKBai's pre-existing synthesis of 25 Reddit/FB/YouTube/TikTok mines. Highest-signal source. |
| 2 | Digital 2025: The Philippines — DataReportal | web | Mobile/internet penetration stats. |
| 3 | Filipino startups help digitize corner stores — Rest of World | web | Sari-sari digitization, trust-building patterns. |
| 4 | scrape-bcg-msme.md | markdown | BCG MSME report — adoption barriers, family motivations. |
| 5 | scrape-shopee-mistakes.md | markdown | Shopee seller pain. |
| 6 | scrape-sme-digital.md | markdown | SME digital adoption signals. |
| 7 | scrape-chat-management.md | markdown | DM overload. |
| 8 | scrape-13-bir-calendar.md | markdown | BIR official calendar. |
| 9 | shopee-seller-fees.md | markdown | Shopee fees breakdown. |

Failed (excluded from active count): BSP MSME page (404), PSA MSMEs landing (rate limit), one stray reddit-taxph JSON (still preparing).

## Pre-existing Firecrawl cache

A 61-file Firecrawl cache already exists at the AKBai repo root in [`.firecrawl/`](../../../../../.firecrawl/) — gathered during prior community research (April 2026). The richest synthesis is [`COMMUNITY_RESEARCH_REPORT.md`](../../../../../.firecrawl/COMMUNITY_RESEARCH_REPORT.md) — 410 lines covering top pain points, verbatim quotes, persona heat maps, feature requests, and a community directory.

Cached corpus highlights:
- 11 Reddit threads (r/taxPH, r/buhaydigital, r/BusinessPH, r/phinvest, r/SmallBusinessPH, r/online-selling-tips)
- 9 Facebook group searches (BIR difficulty, bookkeeping, sari-sari, Shopee, GCash, freelancer tax, food business, salon)
- BCG MSME report scrape
- BIR calendar scrapes (BIR official, PwC, Grant Thornton)
- 22 search-result dumps on Filipino MSME pain topics

Converted scrapes (markdown copies that NotebookLM accepted) live in [`/.firecrawl-converted/`](../../../../../.firecrawl-converted/).

## Cross-phase re-query protocol

When Phase 2/6/9/10/12 needs a grounded answer the distilled docs don't cover:
1. Re-query the relevant notebook via `notebooklm ask -n <id> "..."`.
2. Append the answer + citations to the distilled doc with a `(Phase X re-query, YYYY-MM-DD)` tag.
3. Note any new entry in [`../SKILL.md`](../SKILL.md) so the agent loads it next session.

This is what justifies the upfront cost of Phase 1: the corpus pays back across the full redesign without re-research.
