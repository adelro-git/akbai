# Phase 1 + Phase 1.5 Research — Findings Map

A one-page index of where each NotebookLM research finding landed in the canonical AKBai docs. The intent: you can trace any finding back to the RAW Q&A and the live notebook for re-querying, and you know which canonical doc owns the rule.

**Phase 1 date:** 2026-04-25
**Phase 1.5 date:** 2026-04-26 (expansion: added 22 repo canonicals + ~80 web sources via deep-research; cleaned to 79 UI/UX + 105 Filipino sources after dedupe + error pruning; ran 9 targeted gap-filling questions)

**Notebooks (live):**
- UI/UX — `0127f12f-8da7-4932-833b-9a3b195cce94` ([open](https://notebooklm.google.com/notebook/0127f12f-8da7-4932-833b-9a3b195cce94)) — **79 sources** (Phase 1.5)
- Filipino MSME Context — `8ee05ad7-f7b9-4dc3-8215-a821105be136` ([open](https://notebooklm.google.com/notebook/8ee05ad7-f7b9-4dc3-8215-a821105be136)) — **105 sources** (Phase 1.5)

**RAW Q&A:**
- Phase 1: [`ui-ux-principles-akbai-RAW.md`](./ui-ux-principles-akbai-RAW.md), [`filipino-design-context-RAW.md`](./filipino-design-context-RAW.md)
- Phase 1.5: [`phase-1.5/RAW.md`](./phase-1.5/RAW.md)

---

## Findings landed in canonical docs

| Finding | Lives in | Note |
|---|---|---|
| 10 applied UX laws (Hick / Fitts / Jakob / Tesler / Goal-Gradient / Peak-End / Aesthetic-Usability / Hooked / Interruptions / LCP) | [`references/ui-ux-principles-akbai.md`](../ui-ux-principles-akbai.md) | Net-new, kept as standalone. No overlap with existing docs. |
| Top 3 retention investments (triggers / artificial progress / peak-end optimization) | [`references/ui-ux-principles-akbai.md`](../ui-ux-principles-akbai.md) | Same. |
| Don Norman three layers (visceral / behavioral / reflective) — why warmth is load-bearing | [`references/design-system.md`](../design-system.md) §1 | Added under Creative North Star to anchor every warmth decision. |
| Decorative motif vocabulary — banig, capiz, sampaguita, paper-note, sachet, yero IN; bahay-kubo, fiesta, saint imagery, regional textiles OUT | [`references/design-system.md`](../design-system.md) §6 | New section. Decorative SVG implementation rules attached. |
| Filipino mobile baseline — 35 Mbps median, patchy connectivity, mid-range Android target, payday peak loads | [`references/mobile-first.md`](../mobile-first.md) §1 | New "Filipino Connectivity & Device Baseline" subsection. Includes open-question note on prepaid-cap behavior to validate via PostHog post-launch. |
| Family-victory framing for Linggong Kuwento weekly recap | [`references/conversational-filipino-manual.md`](../conversational-filipino-manual.md) §6 | 3 new rows (positive week / flat-or-negative week / first weekly recap) + an anti-pattern note. |
| BCG/BSP stats backing the 3 voice pillars (74% GCash, 64% family-driven, 42-49% afraid of debt) | [`shared/brand-context.md`](../../../shared/brand-context.md) — "Why these pillars work" | Annotates each pillar with the empirical pattern it answers, not new rules. |
| Top pain points by frequency + persona heat | Already in [`shared/market-sentiment-research.md`](../../../shared/market-sentiment-research.md) and [`shared/project-context.md`](../../../shared/project-context.md) §2. NotebookLM run added incremental verbatim quotes; nothing structurally new. | Skipped — would have duplicated. |
| 8 verbatim code-switching patterns | Patterns are already encoded as rules in [`conversational-filipino-copy-guide.md`](../conversational-filipino-copy-guide.md) §2 + [`conversational-filipino-manual.md`](../conversational-filipino-manual.md) §10. NotebookLM run confirmed those rules are correct (live community speech matches). | Skipped — confirmation, not addition. |
| Empty-state worst-pattern anti-examples (alarmist, English-only, deflection-only) | Already covered as anti-patterns in [`conversational-filipino-manual.md`](../conversational-filipino-manual.md) §4 + §5 "DON'T" columns. | Skipped — no gap. |

---

## Findings deliberately deferred (documented in RAW; surface at relevant phase)

These insights are real and useful but don't yet need a canonical home. They live in the RAW Q&A and the live notebook; surface them at the phase that needs them.

| Finding | Surface at | How |
|---|---|---|
| 4 family/community/peer patterns (breadwinner framing, utang dynamic, viral-panic→viral-relief, peer-vouched trust) | Phase 6 (Onboarding redesign) and Phase 10 (Linggong Kuwento + share design) | Re-query notebook 8ee05ad7 with Q8 prompt during phase synthesis. |
| BCG digital adoption barriers — 5 barriers beyond cost | Phase 12 (Retention validation) — informs interview probes and feature-priority retros | Already partly in `shared/project-context.md` §2; deeper enumeration available via re-query. |
| Specific verbatim Reddit quotes per pain point | When writing marketing copy, reply drafts, error states | Already covered by `shared/market-sentiment-research.md`; deeper pull available via NotebookLM. |

---

## Phase 1.5 findings landed in canonical docs

| Finding | Lives in | Note |
|---|---|---|
| Sachet economy + dual-SIM + Wi-Fi-deferral patterns (Globe Go+149, Smart PowerAll/Magic Data, DITO ₱10/day) | [`mobile-first.md`](../mobile-first.md) §1 (Filipino Connectivity Baseline → Data behavior row) | Sharpens Phase 1 row that flagged this as a design assumption. Now evidence-backed. |
| NCR vs provincial connectivity stats (NCR 68.7% home internet / 6.1 hr-day vs BARMM 27.7% / Cagayan Valley 3.4 hr) + Transsion budget hardware in provincial | [`mobile-first.md`](../mobile-first.md) §1 (new "Regional split" row) | Net-new row. Required by the plan's Phase 12 retention validation (regional segmentation). |
| Concrete PWA budgets — LCP ≤ 2.5s / FCP < 1.5s / TTI < 3.5s, page < 500KB / JS < 200KB / images ≤ 200KB | [`mobile-first.md`](../mobile-first.md) §1 design implications + §10 Performance Budget | Aligned existing budgets to the validated cross-app numbers. |
| Validated SW caching stack — `next-pwa` + TanStack Query + Persister, daily/stale-while-revalidate, incremental foreground, queued mutations | [`mobile-first.md`](../mobile-first.md) §1 design implications + §7 Offline-First Behavior | Confirms current stack choice; adds explicit rules for cold-cache + foreground-update + setup-level cache. |
| Hand-me-down hardware as device-tier validation (older sari-sari owners use kids' old phones) | [`mobile-first.md`](../mobile-first.md) §1 (Device tier row) | Net-new design assumption. Plus "Child as Digital Bridge" pattern noted in RAW for Phase 6 onboarding. |
| Hard retention metrics: 45% engagement lift / 2× login frequency / Khatabook 3× faster payment / Moniepoint weekly streak / Flourish Fi 32% deposit + $600/6mo | [`ui-ux-principles-akbai.md`](../ui-ux-principles-akbai.md) §"3 highest-leverage retention investments" → new evidence-anchor block | Net-new evidence anchor for Phase 12 retention targets. |
| Hooked variance rule: high content variance / low reliability variance / 3-tonal rotation (Energetic / Observant / Celebratory) | [`ui-ux-principles-akbai.md`](../ui-ux-principles-akbai.md) §8 Hooked Model | Sharpens "warm unpredictability" line into an actionable AI-prompt rule. |
| Family-share UX rules: dark inverted palette, banig chart, pre-drafted FIL copy (*"Isang linggo ng tubo at pag-asa"*), Messenger/Viber > SMS, peak-end timing | [`ui-ux-principles-akbai.md`](../ui-ux-principles-akbai.md) §6 Peak-End Rule | Net-new operational rules under existing Peak-End principle. |
| Regional language comprehension rule (understand Cebuano/Bisaya/Hiligaynon, respond in standard conversational Filipino) | [`conversational-filipino-manual.md`](../conversational-filipino-manual.md) §11 (new section) | Net-new rule. Resolves: should Kai localize per region? Answer: input flexes, output stays consistent. |
| Sari-sari quartet refinement (64% / 71% family-independence + 38% / 53% children's education) | [`shared/brand-context.md`](../../../../shared/brand-context.md) — Pillar 3 row | Sharpens existing Phase 1 entry with the all-MSME-vs-sari-sari contrast. |
| Hiya design framings (5 patterns) | Already in [`conversational-filipino-manual.md`](../conversational-filipino-manual.md) §3, §4, §5, §6 | Skipped — Phase 1.5 confirmed existing canonical patterns are correct. No update needed. |
| Platform-seller (Lazada/Shopee/TikTok) vs sari-sari/baking archetype split with daily workflows + retention drivers | Already in [`shared/project-context.md`](../../../../shared/project-context.md) §personas + [`skills/product-owner/references/user-personas.md`](../../../product-owner/references/user-personas.md) | Skipped — Phase 1.5 confirmed personas are correct. Mega-campaign (9.9, 11.11) 3-10× volume + payday spike data added inline to mobile-first.md `Peak-hour load` row. |
| "Child as Digital Bridge" / Hand-Me-Down Hardware / Uncosted Family Labor patterns | Surface in Phase 6 (Onboarding) and project-context updates | Documented in `phase-1.5/RAW.md`; redundant for current canonicals — Phase 6 onboarding spec will pull these directly. |

---

## Phase 1.5 findings deferred (documented in RAW; surface at relevant phase)

| Finding | Surface at | How |
|---|---|---|
| Cebuano/Bisaya address-term cheatsheet (bai/dong/day/pila/maayong buntag) | Phase 6 (Onboarding) and Phase 8 (Kausap chat) | Already in `conversational-filipino-manual.md` §11; Kai system prompt picks up at build time. |
| Khatabook 40× growth via WhatsApp integration as Filipino Messenger/Viber analogue | Phase 10 (Linggong Kuwento share design) | Already in `ui-ux-principles-akbai.md` §6; Phase 10 spec will reference. |
| Moniepoint weekly-resetting tier streak as advanced retention pattern | Phase 12 (Retention validation) — A/B candidate | Re-query notebook 0127f12f at that phase. |

---

## Phase 1.5 gaps still unfilled (validate post-launch via PostHog)

1. **PH-specific retail/sari-sari thumb-zone evidence** — Q6 timed out twice on the Filipino notebook. Corpus lacks explicit research. Use general thumb-zone rules in `mobile-first.md` §5 until PostHog tap heatmaps validate.
2. **Image-avoidance behavior on prepaid-cap exhaustion** — no direct corpus evidence. Treat the 200KB cold-home budget as conservative defense.
3. **BIR compliance / financial literacy split between NCR and provincial** — no regional differentiation in corpus. Treat as uniform until Phase 12 retention validation.

---

## Re-query protocol (for any later phase)

```bash
# UI/UX questions
notebooklm ask -n 0127f12f "your question here" --save-as-note --note-title "<short label>"

# Filipino MSME context
notebooklm ask -n 8ee05ad7 "your question here" --save-as-note --note-title "<short label>"
```

When a re-query produces a useful new pattern, append it to the appropriate canonical doc with the same `<!-- Phase X re-query, YYYY-MM-DD -->` annotation style. Do **not** create a parallel doc.

**Notebook hygiene:** if you use `notebooklm source add-research --import-all`, follow up with the cleanup script pattern at [`phase-1.5/RAW.md`](./phase-1.5/RAW.md) — `--import-all` will pull errored TikTok/YouTube URLs and duplicates that need pruning.
