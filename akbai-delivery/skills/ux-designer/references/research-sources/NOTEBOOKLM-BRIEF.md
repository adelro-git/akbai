# Phase 1 — NotebookLM Research Brief

**Owner:** Anton (runs the NotebookLM session)
**Output consumer:** Claude (distills into `ui-ux-principles-akbai.md` + `filipino-design-context.md`)
**Time estimate:** 60–90 minutes of NotebookLM Q&A

This brief tells you exactly what to load into NotebookLM and what to ask it, so the output flows cleanly into the two Phase 1 deliverables. Two notebooks (or one notebook with two folders) — one for UI/UX, one for Filipino MSME context.

---

## Notebook 1 — "AKBai UI/UX Principles" (10–15 sources)

### Sources to add via NotebookLM "Discover sources" / URL paste

NotebookLM can fetch URLs directly. Paste these into the source-add UI; if any fail, copy-paste the article text manually.

**Laws of UX (highest priority)**
1. https://lawsofux.com/jakobs-law/
2. https://lawsofux.com/hicks-law/
3. https://lawsofux.com/fittss-law/
4. https://lawsofux.com/aesthetic-usability-effect/
5. https://lawsofux.com/peak-end-rule/
6. https://lawsofux.com/teslers-law/
7. https://lawsofux.com/goal-gradient-effect/  (closest to Endowed Progress)

**Mobile UX & retention**
8. https://www.nngroup.com/articles/mobile-ux/  (NN/g — Mobile User Experience)
9. https://www.nngroup.com/articles/mobile-ux-design-articles/  (NN/g index — pick 1 standout sub-article)
10. https://www.smashingmagazine.com/2017/03/mobile-ux-mistakes/  (or any current Smashing mobile UX article)

**Emotional design + retention**
11. https://jnd.org/emotion-design-attractive-things-work-better/  (Don Norman, Emotional Design summary)
12. https://www.nirandfar.com/hooked/  (Hooked model overview — Variable Reward, Trigger, Action, Investment)

**Accessibility + performance**
13. https://www.w3.org/WAI/WCAG21/quickref/?versions=2.1  (WCAG 2.1 Quickref — bookmark, don't try to load whole)
14. https://web.dev/articles/prefers-reduced-motion  (or web.dev's reduced-motion article)
15. https://web.dev/articles/lcp  (Core Web Vitals — Largest Contentful Paint for mobile perf)

If any URL fails to fetch, the Q&A can still proceed — NotebookLM tolerates missing sources well. Aim for ≥ 10 successful loads.

### Questions to run in NotebookLM (UI/UX notebook)

For each question, paste the answer into a section of `ui-ux-principles-akbai-RAW.md` (a scratch doc). Don't worry about formatting yet — Claude will distill.

**Q1.** "Across these sources, list 12 UX laws or principles most relevant to a mobile-first PWA for first-time-tool-users (small business owners). For each: (a) the principle in one sentence, (b) the strongest single quote or example from the sources, (c) one concrete UI rule it implies."

**Q2.** "What do these sources say about retention drivers in mobile productivity apps? Give me the top 5 evidence-backed mechanisms (e.g., habit loops, peak-end framing, variable rewards) with citations."

**Q3.** "What are the most-cited accessibility and performance rules for a mobile PWA targeting users on mid-range Android phones over slow networks? List 8–10 with brief rationales and citations."

**Q4.** "What does emotional design (Don Norman) say about why warmth and ornament can improve perceived usability of utilitarian apps? Summarize the visceral / behavioral / reflective layers in 3 short paragraphs with citations."

**Q5.** "What's the established UX guidance on form design and onboarding for low-digital-literacy users? Single question per screen vs. all-at-once? Touch target sizing? Error recovery? Cite specific sources."

**Q6.** "If we had to pick the 3 UX investments that move first-week retention the most for a mobile productivity app, what would they be — based only on these sources?"

### Output format from Notebook 1

A scratch markdown file `ui-ux-principles-akbai-RAW.md` with each Q&A pasted in, NotebookLM citations preserved. Claude will distill it.

---

## Notebook 2 — "AKBai Filipino MSME Context" (20–30 sources)

This notebook leverages a corpus that **already exists locally**.

### Step 1 — Upload the existing cache

Most of the Filipino MSME research is already gathered at [`.firecrawl/`](./../.firecrawl/) at the AKBai repo root (61 files). The most valuable for NotebookLM:

**Upload first (highest signal):**
1. [`COMMUNITY_RESEARCH_REPORT.md`](./../../../../.firecrawl/COMMUNITY_RESEARCH_REPORT.md) — 410-line synthesis with verbatim quotes, persona heat maps, pain rankings (April 2026)

**Upload these JSON files** (NotebookLM accepts JSON; if it complains, rename to `.txt` first):
2. `.firecrawl/reddit-taxph-bir-filing.json`
3. `.firecrawl/reddit-taxph-freelancer.json`
4. `.firecrawl/reddit-taxph-online-seller.json`
5. `.firecrawl/reddit-bizph-accounting.json`
6. `.firecrawl/reddit-bizph-bir-registration.json`
7. `.firecrawl/reddit-buhaydigital-freelance.json`
8. `.firecrawl/reddit-phinvest-selfemployed.json`
9. `.firecrawl/reddit-sarisari-store.json`
10. `.firecrawl/reddit-online-selling-tips.json`
11. `.firecrawl/reddit-food-business-homebased.json`
12. `.firecrawl/fb-bir-difficulty.json`
13. `.firecrawl/fb-bookkeeping.json`
14. `.firecrawl/fb-sarisari-owners.json`
15. `.firecrawl/fb-shopee-seller.json`
16. `.firecrawl/fb-gcash-tracking.json`
17. `.firecrawl/scrape-bcg-msme.json` (BCG MSME report)
18. `.firecrawl/scrape-sme-digital.json`

### Step 2 — Add fresh sources via URL paste (no Firecrawl needed)

These topics aren't well-covered in the existing cache. Paste URLs directly to NotebookLM:

**Filipino mobile usage / connectivity**
19. https://datareportal.com/reports/digital-2025-philippines  (Digital 2025: Philippines — DataReportal)
20. https://www.statista.com/statistics/1112027/philippines-android-vs-ios-market-share/  (or any Statcounter PH mobile OS share article that loads cleanly)
21. https://restofworld.org/2024/sari-sari-philippines-tech/  (already cited in COMMUNITY_RESEARCH_REPORT, but load directly so NotebookLM has the full page)

**MSME institutional / official sources**
22. https://www.bsp.gov.ph/Pages/InclusiveFinance/MSMEs.aspx  (BSP MSME page — root)
23. https://psa.gov.ph/economic-growth-and-policy/msmes  (PSA MSMEs landing — pick the latest survey)

**Cultural / heritage / design context**
24. Search NotebookLM directly: "Filipino design heritage banig sampaguita capiz contemporary use" — let it surface 2–3 sources
25. Search: "Filipino code-switching Tagalog English mobile UI" — let it surface 1–2 sources

**Hiya / money culture**
26. Search: "hiya money culture Philippines small business" — surface 1–2 sources
27. Search: "Filipino family economic unit small business income" — surface 1–2 sources

If NotebookLM's discover-sources finds better/fresher hits than what I've listed, prefer those.

### Questions to run in NotebookLM (Filipino notebook)

Paste each answer into `filipino-design-context-RAW.md`.

**Q1.** "What are the top 8 emotional and practical pain points Filipino MSME owners (sari-sari, food/baking, online sellers, freelancers) express around bookkeeping and BIR? For each, give the 1–2 strongest verbatim quotes from the sources and which persona feels it most."

**Q2.** "Summarize what these sources say about Filipino mobile-phone usage patterns for small business: device tier (Android vs iOS, mid-range vs high-end), data behavior (prepaid caps, peak hours), connectivity reliability, and one-handed use during work. Cite specific sources or stats."

**Q3.** "What does the literature/community say about Filipino financial culture (hiya around money, family-economic unit, GCash habits, mixing personal/business funds) that should shape how AKBai talks about money?"

**Q4.** "List Filipino design motifs that read as inclusive, working-class, and unisex (banig, capiz, sampaguita, paper-note, others) — and the ones that should be avoided (bahay-kubo, fiesta tropes, saint imagery, regional bias). Give a one-sentence rationale per motif from the sources."

**Q5.** "What patterns of code-switching (Filipino + English) do Filipino MSMEs use when discussing money, BIR, and platforms? Give 5–10 examples that should shape AKBai's voice."

**Q6.** "From these sources, what would be the worst-possible empty-state copy for an MSME app in the Philippines? What about the best-possible? Cite specific sentiment patterns."

**Q7.** "What does the BCG MSME report and BSP/PSA data say about MSME digital adoption barriers — beyond cost? List the top 5 with citations."

**Q8.** "What recurring family/community/peer-pressure patterns appear in these sources that AKBai's social features (e.g., Sunday Story 'I-share sa family') could lean into respectfully?"

### Output format from Notebook 2

`filipino-design-context-RAW.md` with all Q&A and citations.

---

## Handoff back to Claude

When done:
1. Save both raw files to `akbai-delivery/skills/ux-designer/references/research-sources/`:
   - `ui-ux-principles-akbai-RAW.md`
   - `filipino-design-context-RAW.md`
2. Note the NotebookLM notebook URL(s) — Claude will record these in the README for cross-phase re-querying.
3. Ping Claude: "Phase 1 NotebookLM done, distill the synthesis docs."

Claude will then:
- Read the RAW files
- Distill into the two final synthesis docs (≤ 750 words each)
- Spawn `build-marketing` for a brand-voice review of the Filipino doc
- Update SKILL.md to load both refs by default
- Update the source-index README with citations + notebook URLs
- Mark Phase 1 complete in `shared/sprint-history.md`

## Quality bar

- Each principle/concept in the final docs cites ≥ 2 sources from the notebook(s).
- The principles must be *applied* to AKBai screens, not abstract — every entry has a concrete UI rule attached.
- The Filipino-context doc avoids tourist-board romanticization (no fiesta/national-hero motifs); cultural framing is grounded in the sources.
- Both docs combined ≤ 1,500 words.
