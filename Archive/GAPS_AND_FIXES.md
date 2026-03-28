# AKBai — Cross-Document Audit: Gaps, Contradictions & Fixes
> Audit performed: March 19, 2026
> Scope: All shared context files, 12 SKILL.md files, 36 reference files, MASTER_BRIEF, HANDOFF, EMERGENT_SESSION_GUIDE, plugin.json, README
> Categories: (A) Contradictions between files, (B) Technical spec gaps Emergent needs, (C) Skill file inconsistencies with roadmap

---

## Category A — Contradictions Between Files

### A-01: Gap Registry Count Mismatch (CRITICAL for session onboarding)
**Where:** CLAUDE.md header, README.md, vs gap-registry.md
**Contradiction:**
- CLAUDE.md says: "26 pre-launch gaps, 8 CRITICAL hard gates"
- README.md says: "26 pre-launch gaps, 8 CRITICAL hard gates"
- gap-registry.md actual count: **29 gaps, 10 CRITICAL**
**Impact:** Any agent or developer reading CLAUDE.md or README first will expect fewer blockers than actually exist. The 2 missing CRITICAL gates (E1 Resibo OCR spike, E3 onboarding rate-limit exemption) could be skipped.
**Fix:** Update CLAUDE.md and README.md to say "29 pre-launch gaps, 10 CRITICAL hard gates".
**Status:** REMEDIATED

### A-02: Roadmap Version in README.md (Stale Reference)
**Where:** README.md source documents table
**Contradiction:**
- README references "Complete Roadmap v13" — current is **v14**
- README references "Operations Playbook v6" — current is **v7**
**Impact:** Agents loading README first may look for wrong document version or miss v14 additions (Build 0 Pre-Build Checklist, Category E gaps).
**Fix:** Update README source table to reference v14 and v7 respectively.
**Status:** REMEDIATED

### A-03: File Paths in README.md (Wrong Directory)
**Where:** README.md source documents table
**Contradiction:**
- README references `/AKBai/Project Documents/` — actual path is `/AKBai/project/`
- README references `/AKBai/AKBai Brand Kit/` — actual path is `/AKBai/brand/`
**Impact:** Any agent following README paths will fail to locate source documents.
**Fix:** Update all paths in README to match actual filesystem.
**Status:** REMEDIATED

### A-04: Tagline Inconsistency
**Where:** brand-context.md vs project-context.md vs MASTER_BRIEF
**Contradiction:**
- brand-context.md tagline: "Kaakbay mo sa negosyo." (Your co-traveler in business.)
- project-context.md tagline: "Katuwang ng Negosyo Mo" (Your Business Partner)
- MASTER_BRIEF: "Katuwang ng Negosyo Mo"
**Analysis:** These serve different purposes. "Katuwang ng Negosyo Mo" is the product subtitle/descriptor. "Kaakbay mo sa negosyo" is the marketing tagline from the brand guide. Both are valid but the distinction is not documented anywhere.
**Impact:** Any agent writing copy will pick one at random. Emergent scaffold and future marketing will be inconsistent.
**Fix:** Add clarifying note in brand-context.md distinguishing product descriptor from marketing tagline.
**Status:** REMEDIATED

### A-05: Deployment Platform Contradiction
**Where:** tech-stack.md, project-context.md vs devops-engineer SKILL.md, EMERGENT_SESSION_GUIDE
**Contradiction:**
- tech-stack.md: "Primary: Cloudflare Pages (M1-M6 free, M7+ $5/mo)"
- project-context.md: "Deploy: Cloudflare Pages"
- devops-engineer deployment-guide.md: "Platform: Vercel (primary, free tier sufficient Phase 1)"
- EMERGENT_SESSION_GUIDE: "Vercel deployment config"
- MASTER_BRIEF: "Cloudflare Pages for deployment. If Emergent uses Vercel, that's acceptable."
**Impact:** Emergent will likely deploy to Vercel (per its guide), but devops skill treats Vercel as primary while shared context says Cloudflare. An agent running /deploy could target the wrong platform.
**Fix:** Standardize: Vercel is the Phase 1 deployment target (simpler for solo founder, free tier covers needs). Cloudflare Pages is the cost-optimization migration target for Month 7+. Update tech-stack.md to reflect this practical reality.
**Status:** REMEDIATED

### A-06: KA vs Kai Persona Name Confusion
**Where:** project-context.md, glossary.md vs brand-context.md, MASTER_BRIEF
**Contradiction:**
- project-context.md §8 is titled "KA Persona" and uses "KA" as the user-facing name throughout
- glossary.md defines "KA" as the AI persona name
- brand-context.md says persona name is "Kai"
- MASTER_BRIEF §6 #14: "The persona name is 'Kai' (not 'KA' in UI)"
**Impact:** project-context.md — the most-read shared file — still uses "KA" as if it's user-facing, contradicting the brand decision.
**Fix:** Add clarifying note in project-context.md that "KA" is the internal/documentation name and "Kai" is the user-facing name.
**Status:** REMEDIATED

### A-07: System Prompt Layer Count
**Where:** tech-stack.md vs ai-engineer SKILL.md
**Contradiction:**
- tech-stack.md §System Prompt Assembly: 5 steps (Core Persona, Domain Scopes, User Context, Conversation History, Current Message)
- ai-engineer SKILL.md: 6 layers (adds "Feature Context" between Domain Scope and User Context)
**Impact:** A developer implementing the system prompt assembly will get different layer counts depending on which file they read first.
**Fix:** Update tech-stack.md to reference 6 layers, matching the ai-engineer spec (which is more detailed and authoritative for this component).
**Status:** REMEDIATED

### A-08: Core Table Count Discrepancy
**Where:** tech-stack.md vs data-architect supabase-schema.md
**Contradiction:**
- tech-stack.md lists 10 core tables
- data-architect reference lists 14 core tables (adds audit_log, redirect_logs, daily_api_spend, cost_cards/cost_items)
**Analysis:** The additional tables in data-architect are correct — they're referenced by other systems (circuit breaker needs daily_api_spend, domain-expandable architecture needs redirect_logs, Build 8 needs cost tables). tech-stack.md is just outdated.
**Fix:** Update tech-stack.md core tables list to include the 4 missing tables.
**Status:** REMEDIATED

### A-09: Pro Annual Discount Math Error
**Where:** glossary.md
**Contradiction:**
- glossary.md: "₱2,499/year (~30% discount vs monthly)"
- Actual math: ₱399 x 12 = ₱4,788/year. ₱2,499 / ₱4,788 = 52% of monthly price = **48% discount**, not ~30%.
**Impact:** If this pricing appears in marketing materials, the discount claim will be wrong.
**Fix:** Correct to "~48% discount vs monthly".
**Status:** REMEDIATED

### A-10: Reference File Count in README
**Where:** README.md
**Contradiction:**
- README says "~26 skill-specific reference files"
- Actual count: **36 reference files** across 12 skills
**Fix:** Update to "~36 skill-specific reference files".
**Status:** REMEDIATED

### A-11: Brand Kit Asset Paths (Files Moved)
**Where:** brand-context.md Brand Kit Asset Index
**Contradiction:**
- brand-context.md lists files at `/AKBai/AKBai Brand Kit/01 - Logo System.html`, etc.
- Actual filesystem: Brand Kit HTML files are in `/AKBai/Archive/brand archive/`, logo PNGs are in `/AKBai/brand/Logo Files/`, Brand Book PDF is at `/AKBai/brand/AKBai Brand Book.pdf`
- The path `/AKBai/AKBai Brand Kit/` does not exist on disk
**Impact:** Any agent or Emergent session following brand-context.md asset paths will fail to locate brand files.
**Fix:** Update brand-context.md asset index to reflect actual paths.
**Status:** REMEDIATED

---

## Category B — Technical Spec Gaps Emergent Needs

### B-01: Missing 192x192 PWA Icon
**Gap:** PWA manifest requires both 192x192 and 512x512 icons. Only AKBai_Icon_512.png is documented/provided.
**Impact:** PWA install will fail or show generic icon on Android if 192x192 is missing.
**Action:** Emergent should generate a 192x192 variant from the 512x512 source, or note this as a post-scaffold task.
**Status:** NOTED (no file fix — Emergent action item)

### B-02: No Service Worker Caching Strategy Specified
**Gap:** next-pwa is specified but no guidance on what to cache (network-first for API, cache-first for static, stale-while-revalidate for morning briefing).
**Impact:** Default next-pwa config will cache everything indiscriminately, potentially serving stale financial data.
**Action:** Document caching strategy in tech-stack.md.
**Status:** REMEDIATED (added to tech-stack.md)

### B-03: Chat Table Naming Inconsistency
**Where:** MASTER_BRIEF §7 vs all other docs
**Contradiction:**
- MASTER_BRIEF §7 checklist: "conversations (user_id FK, role, content, domain)"
- All other docs: "ka_conversations"
**Impact:** Emergent may create table as "conversations" while all skill files reference "ka_conversations".
**Fix:** Standardize to "ka_conversations" in MASTER_BRIEF.
**Status:** REMEDIATED

### B-04: No Error Response Schema for /api/chat
**Gap:** Success path for /api/chat is well-documented but error responses are not specified. fullstack-engineer reference defines `{ success: false, error: { code, message, message_tl? } }` but this isn't in MASTER_BRIEF or EMERGENT_SESSION_GUIDE.
**Impact:** Emergent will likely return ad-hoc error JSON, requiring refactoring in Build 0.
**Action:** Note in EMERGENT_SESSION_GUIDE that the error envelope pattern from fullstack-engineer should be followed.
**Status:** NOTED (guidance exists in skill files; Emergent should adopt)

### B-05: No manifest.json theme_color/background_color Specified
**Gap:** Brand colors are well-documented but PWA manifest theme_color and background_color are never specified.
**Derived values:** theme_color should be #F59E0B (Warm Honey) and background_color should be #07101e (Ink).
**Status:** NOTED (Emergent should use brand colors)

### B-06: Missing commands/ Directory Content
**Where:** README.md lists 15 slash commands (sprint, build, review, test, deploy, etc.)
**Reality:** `/AKBai/akbai-delivery/commands/` directory exists but is empty — 0 command files.
**Impact:** plugin.json claims "commands_count: 15" but there are no command files. Any agent attempting to use slash commands will find nothing.
**Action:** Either create the 15 command files or update README and plugin.json to reflect current state.
**Status:** REMEDIATED (updated plugin.json and README to note commands are pending)

### B-07: Phase 0C Not Formally Defined
**Where:** glossary.md, gap-registry.md (D8) reference "Phase 0C — Paid Pilot"
**Gap:** project-context.md phase structure goes 0A → 0B → Phase 1 with no Phase 0C. But glossary defines it and gap D8 references it for beta-to-paid transition pricing.
**Impact:** Unclear whether Phase 0C is still planned or was merged into Phase 0B/Phase 1.
**Fix:** Add Phase 0C to project-context.md phase structure or note it was absorbed.
**Status:** REMEDIATED (added as optional sub-phase in project-context.md)

### B-08: Daily Check-In / Reconciliation Flows Not in Build Order
**Where:** glossary.md defines "Daily Check-In", "Weekly Reconciliation", "Monthly Reconciliation" as features
**Gap:** None of these appear in the Build 0-8 sequence in project-context.md or MASTER_BRIEF.
**Impact:** These features have no assigned build sprint and could be forgotten.
**Fix:** Note in project-context.md that these are part of Build 2 (Dashboard) or Build 5 (Morning Briefing) scope.
**Status:** REMEDIATED (added clarifying note in project-context.md)

### B-09: OPS Builds vs Feature Builds Mapping Unclear
**Where:** glossary.md defines OPS Build 0-5B but these are never cross-referenced to Feature Builds 0-8
**Gap:** A developer doesn't know when to run OPS Build 2 (Admin observability) relative to Feature Build 3 (Resibo Scanner).
**Impact:** Operational infrastructure may be built too late or forgotten.
**Status:** NOTED (mapping exists in Operations Roadmap v6 PDF but not in shared context files)

---

## Category C — Skill File Inconsistencies with Roadmap

### C-01: devops-engineer Treats Vercel as Primary (Conflicts with Shared Context)
**Where:** devops-engineer/references/deployment-guide.md
**Issue:** Entire deployment guide is written around Vercel (environment variables in Vercel dashboard, Vercel CLI, Vercel preview deployments). Shared context files say Cloudflare Pages.
**Resolution:** Per fix A-05, Vercel is now documented as Phase 1 primary. devops skill is correct in practice.
**Status:** RESOLVED (via A-05 fix)

### C-02: ai-engineer 6-Layer Prompt vs tech-stack 5-Step
**Resolution:** Per fix A-07, tech-stack.md updated to 6 layers. ai-engineer skill is the authority.
**Status:** RESOLVED (via A-07 fix)

### C-03: solutions-architect Performance Budgets Not in Shared Context
**Where:** solutions-architect/references/tech-stack.md (the skill's own tech-stack reference)
**Issue:** Hard performance targets (FCP <2s, TTI <3.5s, JS <200KB, Claude chat <5s p95) are only in the solutions-architect skill, not in the shared tech-stack.md.
**Impact:** Emergent and other skills won't know about these budgets.
**Fix:** Add performance budget section to shared tech-stack.md.
**Status:** REMEDIATED

### C-04: fullstack-engineer Money-in-Centavos Rule Not in Shared Context
**Where:** fullstack-engineer/references/supabase-patterns.md
**Issue:** The rule "All monetary amounts stored as integers in centavos (₱34.50 = 3450)" is only in fullstack-engineer's references, not in shared tech-stack.md or data-architect schema.
**Impact:** Different developers could store money as decimals vs integers, causing calculation errors.
**Fix:** Add money handling convention to shared tech-stack.md.
**Status:** REMEDIATED

### C-05: qa-engineer Test Counts Reference Non-Existent Features
**Where:** qa-engineer/references/test-checklist.md
**Issue:** Test checklist references BIR holiday calendar, multi-seat access (Phase 2), and GSheets OAuth — features that don't exist in Phase 1 MVP scope. Tests are correctly marked as future but could confuse sprint planning.
**Status:** ACCEPTABLE (tests are forward-looking by design; no fix needed)

### C-06: marketing-lead References "No Official Domain"
**Where:** marketing-lead/references/content-calendar.md
**Issue:** Content calendar plans SEO articles but project has no website/domain yet. Articles can't be published to an AKBai property.
**Workaround documented:** Use Medium or personal blog for Phase 0B articles, migrate when domain is live.
**Status:** ACCEPTABLE (workaround exists in marketing skill)

---

## Summary of Remediations Applied

| ID | File Changed | Change |
|----|-------------|--------|
| A-01 | README.md | Updated gap count to "29 gaps, 10 CRITICAL" |
| A-02 | README.md | Updated Roadmap to v14, Ops Playbook to v7 |
| A-03 | README.md | Fixed all file paths to match actual filesystem |
| A-04 | brand-context.md | Added note distinguishing tagline from product descriptor |
| A-05 | tech-stack.md | Updated deployment section: Vercel primary (Phase 1), Cloudflare Pages (Month 7+ cost optimization) |
| A-06 | project-context.md | Added note that "KA" = internal name, "Kai" = user-facing name |
| A-07 | tech-stack.md | Updated system prompt assembly to 6 layers |
| A-08 | tech-stack.md | Added 4 missing tables to core tables list |
| A-09 | glossary.md | Corrected Pro Annual discount from ~30% to ~48% |
| A-10 | README.md | Updated reference file count to ~36 |
| A-11 | brand-context.md | Updated Brand Kit Asset Index paths |
| B-02 | tech-stack.md | Added PWA caching strategy guidance |
| B-03 | AKBAI_MASTER_BRIEF.md | Standardized table name to ka_conversations |
| B-06 | plugin.json, README.md | Marked commands as pending (0 of 15 built) |
| B-07 | project-context.md | Added Phase 0C as optional sub-phase |
| B-08 | project-context.md | Added note mapping check-in/reconciliation to builds |
| C-03 | tech-stack.md | Added performance budget section |
| C-04 | tech-stack.md | Added money-in-centavos convention |

---

## Items NOT Fixed (Require Anton's Decision)

| ID | Item | Why Not Auto-Fixed |
|----|------|-------------------|
| B-01 | Missing 192x192 PWA icon | Requires image generation from source asset |
| B-04 | Error response schema for /api/chat | Exists in fullstack skill; Emergent should adopt pattern |
| B-05 | manifest.json theme/background colors | No file to update yet; scaffold will set these |
| B-06 | 15 command files missing | Creating 15 command files is a separate build task (Sessions 9-10 per README) |
| B-09 | OPS Builds mapping to Feature Builds | Requires cross-referencing Operations Roadmap v6 PDF; too complex for auto-fix |

---

*End of audit. Run this audit again after Emergent scaffold is complete and before Build 0 begins.*
