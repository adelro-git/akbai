#!/usr/bin/env node
// Phase 2.2 — Visual decisions report
//
// Renders the per-screen verdicts with image pairs alongside, plus
// color-coded foundation/chrome/voice/interaction/a11y tables.
//
// Run: node design_handoff_akbai_redesign/synthesis/build-decisions-html.mjs

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HANDOFF_DIR = path.resolve(__dirname, '..', 'screenshots');
const CURRENT_DIR = path.resolve(__dirname, 'screenshots');
const OUTPUT = path.resolve(__dirname, 'decisions.html');

// --- Per-screen verdicts (Section A — locked) -------------------------------

const PER_SCREEN = [
  {
    id: '00-home',
    label: 'Home (/dashboard)',
    verdict: 'HYBRIDIZE',
    handoffPng: '01-home-honey-fil-andoy.png',
    summary: 'Layout structure + daily check-in positioning + Kai hero presence: ADOPT HANDOFF. Background: KEEP CURRENT (white). Nav label: REJECT BOTH — use literal "Home".',
    actions: [
      { src: 'handoff', label: 'Layout, hero, check-in positioning, Kai mark' },
      { src: 'current', label: 'White background (#fdf9f2), not honey-cream' },
      { src: 'new', label: 'Nav label "Home" (not "Dashboard" or "Umaga Mo")' },
    ],
  },
  {
    id: '01-chat',
    label: 'Chat / Kausap (/chat)',
    verdict: 'HYBRIDIZE',
    handoffPng: '06-chat-honey-fil.png',
    summary: 'Overall look: ADOPT HANDOFF. "Chat with Kai" branding/header: KEEP CURRENT. Kai avatar/illustration in chat bubbles: KEEP CURRENT.',
    actions: [
      { src: 'handoff', label: 'Bubble palette (honey-deep user / cream Kai), suggested-question chips, "● Nandito ako para sa\'yo" status' },
      { src: 'current', label: 'Branded "Chat with Kai" header + existing Kai illustration in bubbles' },
    ],
  },
  {
    id: '02-expenses',
    label: 'Saan napunta / Expenses (/expenses)',
    verdict: 'ADOPT HANDOFF',
    handoffPng: '07-saan-honey-fil.png',
    summary: 'Replace current with handoff Saan: total card + donut, category rows with progress bars, banig 7-day chart, Kai callout paper-note. Keep current month-picker logic (data-layer only).',
    actions: [
      { src: 'handoff', label: 'Visual layout, donut chart, banig texture, Kai callout' },
      { src: 'current', label: 'Month picker logic (data-layer reuse)' },
    ],
  },
  {
    id: '03-scan',
    label: 'Resibo Scanner (/scan)',
    verdict: 'KEEP CURRENT',
    handoffPng: '08-scan-honey-fil.png',
    summary: 'Camera UI, viewfinder, capture flow, post-scan card slide-in stay as-is. Handoff dark-bleed scan UI rejected — current already feels right.',
    actions: [
      { src: 'current', label: 'All scan UI, capture flow, batch behavior preserved' },
    ],
  },
  {
    id: '04-deadlines',
    label: 'BIR Deadlines (/deadlines)',
    verdict: 'ADOPT HANDOFF',
    handoffPng: '09-deadlines-honey-fil.png',
    summary: 'Replace with handoff: serif H1 + 56×56 date chip rows + days-left counter + Kai pre-deadline paper-note callout. Form-code prominence comes for free.',
    actions: [
      { src: 'handoff', label: 'Full visual replacement; form-code (1701Q) made prominent' },
    ],
  },
  {
    id: '05-costing',
    label: 'Tamang Presyo / Costing (/costing)',
    verdict: 'HYBRIDIZE',
    handoffPng: '10-costing-honey-fil.png',
    summary: 'Layout + slider + recommended-price card + Kai callout: ADOPT HANDOFF. Existing illustration on empty/intro state: KEEP CURRENT — port into the new layout.',
    actions: [
      { src: 'handoff', label: 'Layout, slider treatment, "Kita bawat isa" framing, Kai callout' },
      { src: 'current', label: 'Existing costing illustration on empty state' },
    ],
  },
  {
    id: '06-invoices',
    label: 'Mga Invoice (/invoices)',
    verdict: 'HYBRIDIZE',
    handoffPng: '11-invoices-honey-fil.png',
    summary: 'Same pattern as Costing. Layout + summary tiles + status pills + serif H1 "Sinong may utang pa sa\'yo?": ADOPT HANDOFF. Existing invoice illustration on empty state: KEEP CURRENT.',
    actions: [
      { src: 'handoff', label: 'Two summary tiles, status pills, serif H1' },
      { src: 'current', label: 'Existing invoice illustration on empty state' },
    ],
  },
  {
    id: '07-profile',
    label: 'Profile (/profile)',
    verdict: 'HYBRIDIZE',
    handoffPng: null,
    summary: 'Structure + content density: KEEP CURRENT. Visual chrome (typography, spacing, paper-note treatments where appropriate): ADOPT HANDOFF elements. "Current with sprinkled handoff polish."',
    actions: [
      { src: 'current', label: 'Structure, content density, route conventions' },
      { src: 'handoff', label: 'Typography (serif), spacing, paper-note treatments where appropriate' },
    ],
  },
  {
    id: '08-checkin',
    label: 'Daily Check-in (modal on /dashboard)',
    verdict: 'KEEP CURRENT',
    handoffPng: '12-checkin-honey-fil.png',
    summary: 'Daily Check-in stays as the existing modal/inline component on the home page. Do NOT extract to a separate /checkin route. Phase 1.5 schema enrichment (energy_level, note) still applies — added inline to existing modal.',
    actions: [
      { src: 'current', label: 'Modal placement on /dashboard preserved' },
      { src: 'handoff', label: 'Energy slider + note textarea added to existing modal (per Phase 1.5 schema)' },
      { src: 'plan-override', label: 'Overrides original plan Phase 10 §10.4 — no new /checkin route' },
    ],
  },
  {
    id: '09-kuwento',
    label: 'Linggong Kuwento (Sunday Story)',
    verdict: 'HYBRIDIZE',
    handoffPng: '13-sundaystory-honey-fil.png',
    summary: 'New /kuwento route per Phase 10. REJECT the dark inverted palette — Kuwento stays on the same honey-cream scheme as the rest of the redesign (Anton override). ADOPT the narrative structure, KPI grid, banig chart, and "I-share sa family" CTA.',
    actions: [
      { src: 'handoff', label: 'Narrative paragraph structure with honey-deep highlights' },
      { src: 'handoff', label: '2×2 KPI grid + banig chart + "I-share sa family" CTA' },
      { src: 'plan-override', label: 'Reject dark inverted palette — keep honey-cream scheme like other screens' },
    ],
  },
];

// --- Foundation / Chrome / Voice / Interaction / A11y verdicts (Section B-F) ---

const FOUNDATION = [
  { id: 'B1', dim: 'Color palette — global default', verdict: 'HYBRIDIZE', desc: 'Two-palette: home stays white (#fdf9f2). All other surfaces (Chat, Saan, Deadlines, Costing, Invoices, Kuwento, Profile) on honey-cream (#fef4dd). NO dark inverted palette anywhere (Kuwento stays light per A10 override). Implementation: `palette` context (cream/honey) per route.' },
  { id: 'B2', dim: 'Typography', verdict: 'HYBRIDIZE', desc: 'Plus Jakarta Sans retained as `--font-sans`. Add Fraunces as `--font-serif` for display headings (greetings, narrative paragraphs, KPI labels). Body remains PJS.' },
  { id: 'B3', dim: 'Surface hierarchy', verdict: 'HYBRIDIZE', desc: 'Keep current MD3 6-level surface tokens as the contrast system. Override only `--bg`/`--surface` per active palette context. Handoff 3-level scale too coarse.' },
  { id: 'B4', dim: 'Iconography', verdict: 'DEFER — build icon repo first', desc: 'Anton override: build a reviewable icon repository (repos/icons.html) showing each candidate at multiple sizes / backgrounds / weights, alongside existing AKBai illustrations for style consistency. Approved icons become canonical; rejected ones drop. lucide-react retained for utility regardless.' },
  { id: 'B5', dim: 'Decorative motifs (capiz, petals, woven)', verdict: 'DEFER — build motif repo first', desc: 'Anton override: build a motif repository (repos/motifs.html) showing CapizPattern, FloatingPetals, WovenDivider, Squiggle, TapeStrip in isolation + against home-white and honey-cream backgrounds + at scale + with annotated "where used." Approved motifs ship inline as SVG with reduced-motion gating, ≤ 200KB cold-load budget.' },
  { id: 'B6', dim: 'Animation library', verdict: 'DEFER — build animation repo first', desc: 'Anton override: animations must "stay true to the images we want to showcase." Build animation repository (repos/animations.html) where each keyframe (kai-bob, petal-drift, squish, slide-up, fade-in) is demoed in isolation paired with the actual image/element it\'ll animate. Anton reviews each in context. All approved gated on prefers-reduced-motion.' },
  { id: 'B7', dim: 'Border treatment', verdict: 'HYBRIDIZE', desc: 'Keep current No-Line Rule for cards/chips. Adopt asymmetric 4px 12px 4px 12px radius + rotate(-1.2deg) tilt on the paper-note primitive ONLY (check-in invite, Kai callouts, Kuwento takeaway).' },
];

const CHROME = [
  { id: 'C1', dim: 'Sidebar (≥ 860px)', verdict: 'HYBRIDIZE', desc: 'Adopt handoff structure: AKBai wordmark + Kai sitting mark + persona pill + nav items + language toggle pills at bottom. RE-USE current sidebar-nav.tsx API (re-skin, don\'t replace).' },
  { id: 'C2', dim: 'Bottom nav (< 860px)', verdict: 'HYBRIDIZE — KEEP 5 TABS', desc: 'KEEP 5-tab structure (Home / Chat / Scan / Pera / More). Adopt handoff honey-gradient active styling. Glass blur preserved. Removing Scan from nav would hurt highest-traffic action. Confirm with PostHog post-launch — if Scan tab clicks <10% over 30d, revisit.' },
  { id: 'C3', dim: 'Mobile breakpoint', verdict: 'ADOPT HANDOFF (860px)', desc: 'Action grid needs 4 cols on tablets. Switch from current 768px to 860px.' },
  { id: 'C4', dim: 'Persona pill in sidebar', verdict: 'ADOPT HANDOFF', desc: 'Display business name + tagline. Tap opens profile screen (single-user — no multi-account switcher).' },
  { id: 'C5', dim: 'Language toggle (FIL/EN)', verdict: 'ADOPT HANDOFF', desc: 'Pills in sidebar bottom + compact mobile affordance in More drawer. next-intl cookie-based locale resolution. Functional from Phase 5.' },
  { id: 'C6', dim: 'Glass nav blur', verdict: 'KEEP CURRENT', desc: 'backdrop-blur preserved. Already shipped, well-loved on Android Chrome + iOS Safari.' },
  { id: 'C7', dim: '"More" drawer contents', verdict: 'ADOPT HANDOFF', desc: 'BIR Deadlines, Tamang Presyo, Mga Invoice, Mga Draft, Daily Check-in (history), Linggong Kuwento. Vaul drawer (already installed).' },
];

const VOICE = [
  { id: 'D1', dim: 'Kai voice (FIL + naturalized English)', verdict: 'KEEP CURRENT', desc: 'Canonical voice docs (conversational-filipino-manual + copy-guide + Phase 1.5 §11 regional rule) win in any conflict. Handoff strings are illustrative only.' },
  { id: 'D2', dim: 'Empty states', verdict: 'KEEP CURRENT', desc: '"Wala ka pang gastos. I-try mo ang Resibo Scanner?" pattern is canonical. Action-oriented, never blame.' },
  { id: 'D3', dim: 'Error states', verdict: 'KEEP CURRENT', desc: '"Hindi ko ma-scan, boss…" Trust Recovery Pattern is canonical.' },
  { id: 'D4', dim: 'Streak counter framing', verdict: 'ADOPT HANDOFF', desc: '"Pang-12 araw na natin" framing. Goal-Gradient + togetherness rule. Beats "Day 12" or numeric counter.' },
  { id: 'D5', dim: 'Linggong Kuwento share-image copy', verdict: 'HYBRIDIZE — persona-calibrated', desc: 'Pre-drafted "Isang linggo ng tubo at pag-asa" on positive weeks. Hiya rule is calibrated by persona, NOT applied uniformly (Anton override). Sari-sari + home-baking get warmer "ginalingan mo pa rin" framing on flat/negative weeks. Platform sellers (Jose) get more direct "Flat ang sales this week — eto ang nakita ko" without sugar-coating. Default: warm but plain-stated; escalate to soft only when business_type is in soft-tone segment. Channel: Messenger / Viber > SMS.' },
  { id: 'D6', dim: 'Variable reward variance for daily takeaway', verdict: 'ADOPT HANDOFF + PHASE 1.5', desc: '3-tonal rotation: Energetic / Observant / Celebratory. High variance in content, low variance in reliability. (Hooked rule, "coach not casino".)' },
];

const INTERACTION = [
  { id: 'E1', dim: 'Forms — useRef + onClick', verdict: 'KEEP CURRENT', desc: 'React 19 controlled-input bug means useRef + onClick is canonical (CLAUDE.md). Handoff implicit-controlled is unsafe in our stack.' },
  { id: 'E2', dim: 'Card swipe gestures (40% threshold)', verdict: 'KEEP CURRENT', desc: 'Already-learned interaction. Removing would frustrate current users. Handoff has none — that\'s its omission.' },
  { id: 'E3', dim: 'Long-press menus / context actions', verdict: 'KEEP CURRENT', desc: 'Existing pattern preserved.' },
  { id: 'E4', dim: 'Pull-to-refresh', verdict: 'KEEP CURRENT', desc: 'Existing native PWA gesture preserved.' },
];

const A11Y = [
  { id: 'F1', dim: 'Touch target floor (44×44 minimum)', verdict: 'KEEP CURRENT', desc: 'WCAG 2.1 AAA + project rule. Strict on all new components.' },
  { id: 'F2', dim: 'Reduced-motion gating', verdict: 'EXTEND', desc: 'Current respects prefers-reduced-motion. Extend to all new motifs (kai-bob, petal-drift, squish). Layout intact when motion off.' },
  { id: 'F3', dim: 'Contrast (WCAG AA)', verdict: 'VERIFY', desc: 'Verify every new honey-deep × honey-cream pairing in Phase 3 token addition. Current MD3 set already verified.' },
  { id: 'F4', dim: 'Performance budget', verdict: 'TIGHTEN to Phase 1.5', desc: 'LCP ≤ 2.5s / FCP < 1.5s / TTI < 3.5s on Slow 3G + mid-range Android. Page < 500KB initial; JS < 200KB gzipped; image budget ≤ 200KB cold home load.' },
  { id: 'F5', dim: 'Offline-first architecture', verdict: 'KEEP CURRENT + EXTEND', desc: 'next-pwa + TanStack Query + Persister already shipped. Extend per Phase 1.5: daily/stale-while-revalidate morning briefing, incremental foreground update for heavy lists, queued mutations with Synced ✓ toast.' },
];

// --- Render -----------------------------------------------------------------

function verdictColor(v) {
  if (v.startsWith('KEEP CURRENT')) return { bg: '#dcfce7', fg: '#14532d', border: '#86efac' };
  if (v.startsWith('ADOPT HANDOFF')) return { bg: '#ffedd5', fg: '#9a3412', border: '#fdba74' };
  if (v.startsWith('HYBRIDIZE')) return { bg: '#dbeafe', fg: '#1e3a8a', border: '#93c5fd' };
  if (v.startsWith('REJECT')) return { bg: '#fee2e2', fg: '#991b1b', border: '#fca5a5' };
  if (v.startsWith('DEFER')) return { bg: '#f3f4f6', fg: '#374151', border: '#d1d5db' };
  if (v.startsWith('TIGHTEN') || v.startsWith('EXTEND') || v.startsWith('VERIFY')) {
    return { bg: '#fef3c7', fg: '#92400e', border: '#fde68a' };
  }
  return { bg: '#f3f4f6', fg: '#374151', border: '#d1d5db' };
}

function actionColor(src) {
  if (src === 'current') return { bg: '#dcfce7', fg: '#14532d' };
  if (src === 'handoff') return { bg: '#ffedd5', fg: '#9a3412' };
  if (src === 'new') return { bg: '#ede9fe', fg: '#5b21b6' };
  if (src === 'plan-override') return { bg: '#fee2e2', fg: '#991b1b' };
  return { bg: '#f3f4f6', fg: '#374151' };
}

function badge(text, c) {
  return `<span style="background:${c.bg};color:${c.fg};border:1px solid ${c.border ?? c.fg};padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;white-space:nowrap;">${text}</span>`;
}

function actionBadge(src) {
  const c = actionColor(src);
  const labelMap = { current: 'CURRENT', handoff: 'HANDOFF', new: 'NEW', 'plan-override': 'PLAN OVERRIDE' };
  return `<span style="background:${c.bg};color:${c.fg};padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:0.04em;margin-right:8px;">${labelMap[src] ?? src.toUpperCase()}</span>`;
}

function findCurrentScreenshot(id, viewport) {
  const dir = path.join(CURRENT_DIR, id);
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png') && f.includes(viewport));
  return files[0] ? path.posix.join('screenshots', id, files[0]) : null;
}

function renderPerScreen(s) {
  const c = verdictColor(s.verdict);
  const currentMobile = findCurrentScreenshot(s.id, 'mobile');
  const handoffPath = s.handoffPng ? path.posix.join('..', 'screenshots', s.handoffPng) : null;

  const currentImg = currentMobile
    ? `<a href="${currentMobile}" target="_blank"><img src="${currentMobile}" alt="current ${s.id}" loading="lazy"></a>`
    : `<div class="missing">no current capture</div>`;
  const handoffImg = handoffPath
    ? `<a href="${handoffPath}" target="_blank"><img src="${handoffPath}" alt="handoff ${s.id}" loading="lazy"></a>`
    : `<div class="missing">no handoff reference (new in redesign)</div>`;

  const actionRows = s.actions.map((a) => `<div class="action-row">${actionBadge(a.src)}<span>${a.label}</span></div>`).join('\n');

  return `
    <article class="screen" id="${s.id}">
      <header>
        <h2>${s.id} — ${s.label}</h2>
        ${badge(s.verdict, c)}
      </header>
      <div class="layout">
        <div class="images">
          <figure>
            <figcaption>Current</figcaption>
            ${currentImg}
          </figure>
          <figure>
            <figcaption>Handoff (reference)</figcaption>
            ${handoffImg}
          </figure>
        </div>
        <div class="reasoning">
          <p class="summary">${s.summary}</p>
          <h3>What from each</h3>
          <div class="actions">${actionRows}</div>
        </div>
      </div>
    </article>
  `;
}

function renderTable(rows) {
  return `
    <table>
      <thead><tr><th style="width:60px;">#</th><th style="width:240px;">Dimension</th><th style="width:200px;">Verdict</th><th>What from each / why</th></tr></thead>
      <tbody>
        ${rows.map((r) => {
          const c = verdictColor(r.verdict);
          return `<tr><td class="id">${r.id}</td><td class="dim">${r.dim}</td><td>${badge(r.verdict, c)}</td><td>${r.desc}</td></tr>`;
        }).join('\n')}
      </tbody>
    </table>
  `;
}

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AKBai — Phase 2.2 Decisions</title>
  <style>
    :root {
      --honey-cream: #fef3d9;
      --honey: #f59e0b;
      --honey-deep: #a1620e;
      --ink: #2c1f12;
      --ink-soft: #534434;
      --outline: #e6dac4;
      --bg: #fdf9f2;
    }
    * { box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, system-ui, sans-serif;
      margin: 0;
      padding: 0 24px 64px;
      background: var(--bg);
      color: var(--ink);
      line-height: 1.5;
    }
    header.page {
      position: sticky; top: 0; z-index: 10;
      background: var(--bg);
      border-bottom: 1px solid var(--outline);
      padding: 24px 0 16px;
      margin: 0 -24px 24px;
      padding-left: 24px; padding-right: 24px;
    }
    h1 { margin: 0 0 4px; font-size: 22px; font-weight: 700; }
    h1 small { font-weight: 400; color: var(--ink-soft); font-size: 14px; margin-left: 8px; }
    .meta { font-size: 13px; color: var(--ink-soft); }
    .meta a { color: var(--honey-deep); }
    nav.tabs {
      display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px;
    }
    nav.tabs a {
      font-size: 12px; padding: 6px 14px; background: white; border: 1px solid var(--outline);
      border-radius: 999px; color: var(--ink); text-decoration: none; font-weight: 600;
    }
    nav.tabs a:hover { background: var(--honey); color: white; border-color: var(--honey); }

    main { max-width: 1400px; margin: 0 auto; }
    section { margin: 0 0 64px; scroll-margin-top: 110px; }
    section > h2.section-h {
      font-size: 18px; margin: 0 0 20px;
      border-bottom: 2px solid var(--honey); padding-bottom: 8px;
      color: var(--ink); font-weight: 700;
    }

    /* Per-screen articles */
    article.screen {
      background: white; border: 1px solid var(--outline); border-radius: 12px;
      padding: 20px; margin-bottom: 24px;
    }
    article.screen header {
      display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;
      margin-bottom: 16px;
    }
    article.screen header h2 { margin: 0; font-size: 16px; font-weight: 700; }
    article.screen .layout {
      display: grid; grid-template-columns: minmax(240px, 1fr) 2fr; gap: 24px; align-items: start;
    }
    article.screen .images { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    article.screen figure { margin: 0; }
    article.screen figcaption {
      font-size: 10px; color: var(--ink-soft); text-transform: uppercase;
      letter-spacing: 0.06em; margin-bottom: 6px; font-weight: 600;
    }
    article.screen img {
      max-width: 100%; height: auto; border-radius: 8px;
      border: 1px solid var(--outline); display: block;
    }
    article.screen .missing {
      padding: 24px 12px; text-align: center; color: var(--ink-soft);
      font-size: 11px; border: 1px dashed var(--outline); border-radius: 8px;
      background: var(--honey-cream);
    }
    article.screen .summary { font-size: 14px; margin: 0 0 16px; }
    article.screen h3 {
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--ink-soft); margin: 16px 0 10px; font-weight: 700;
    }
    article.screen .actions { display: flex; flex-direction: column; gap: 6px; }
    article.screen .action-row {
      display: flex; align-items: flex-start; font-size: 13px; line-height: 1.4;
    }
    article.screen .action-row span:last-child { flex: 1; }

    @media (max-width: 900px) {
      article.screen .layout { grid-template-columns: 1fr; }
    }

    /* Foundation/Chrome/Voice/Interaction/A11y tables */
    table {
      width: 100%; border-collapse: collapse; background: white;
      border: 1px solid var(--outline); border-radius: 12px; overflow: hidden;
    }
    th, td {
      padding: 12px 16px; text-align: left; vertical-align: top;
      border-bottom: 1px solid var(--outline); font-size: 13px; line-height: 1.5;
    }
    thead th {
      background: var(--honey-cream); color: var(--honey-deep);
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700;
    }
    tbody tr:last-child td { border-bottom: 0; }
    td.id { font-family: ui-monospace, Menlo, monospace; font-weight: 700; color: var(--ink-soft); }
    td.dim { font-weight: 600; }

    /* Sign-off footer */
    .signoff {
      background: white; border: 1px solid var(--outline); border-radius: 12px;
      padding: 20px; margin-top: 32px;
    }
    .signoff h2 { margin: 0 0 12px; font-size: 16px; }
    .signoff ul { list-style: none; padding: 0; margin: 0; font-size: 13px; }
    .signoff li { margin-bottom: 6px; padding-left: 24px; position: relative; }
    .signoff li::before {
      content: '☐'; position: absolute; left: 0; font-size: 16px; color: var(--ink-soft);
    }
    .signoff li.done::before { content: '✅'; }
    .signoff li.done { color: var(--ink-soft); }
  </style>
</head>
<body>
  <header class="page">
    <h1>AKBai — Phase 2.2 Decisions <small>${new Date().toISOString().slice(0, 10)}</small></h1>
    <p class="meta">
      Visual companion to <a href="02-decisions.md">02-decisions.md</a>. Image evidence is the
      same Pixel 5 + Desktop captures from <a href="index.html">index.html</a>.
      Source markdown: <a href="01-comparison.md">01-comparison.md</a> · <a href="02-decisions.md">02-decisions.md</a>.
    </p>
    <nav class="tabs">
      <a href="#per-screen">Per-screen</a>
      <a href="#foundation">Foundation</a>
      <a href="#chrome">Chrome</a>
      <a href="#voice">Voice</a>
      <a href="#interaction">Interaction</a>
      <a href="#a11y">A11y / Perf</a>
      <a href="#signoff">Sign-off</a>
    </nav>
  </header>

  <main>
    <section id="per-screen">
      <h2 class="section-h">A. Per-screen verdicts <span style="font-size:12px;color:var(--ink-soft);font-weight:400;">(locked — Anton 2026-04-26)</span></h2>
      ${PER_SCREEN.map(renderPerScreen).join('\n')}
    </section>

    <section id="foundation">
      <h2 class="section-h">B. Foundation <span style="font-size:12px;color:var(--ink-soft);font-weight:400;">(proposed — awaiting sign-off)</span></h2>
      ${renderTable(FOUNDATION)}
    </section>

    <section id="chrome">
      <h2 class="section-h">C. Chrome <span style="font-size:12px;color:var(--ink-soft);font-weight:400;">(proposed — awaiting sign-off)</span></h2>
      ${renderTable(CHROME)}
    </section>

    <section id="voice">
      <h2 class="section-h">D. Voice & copy <span style="font-size:12px;color:var(--ink-soft);font-weight:400;">(proposed — awaiting sign-off)</span></h2>
      ${renderTable(VOICE)}
    </section>

    <section id="interaction">
      <h2 class="section-h">E. Interaction patterns <span style="font-size:12px;color:var(--ink-soft);font-weight:400;">(proposed — awaiting sign-off)</span></h2>
      ${renderTable(INTERACTION)}
    </section>

    <section id="a11y">
      <h2 class="section-h">F. A11y / Performance <span style="font-size:12px;color:var(--ink-soft);font-weight:400;">(proposed — awaiting sign-off)</span></h2>
      ${renderTable(A11Y)}
    </section>

    <section id="signoff" class="signoff">
      <h2>Sign-off status</h2>
      <ul>
        <li class="done">Section A (per-screen verdicts) — Anton, 2026-04-26 (verbatim from visual review)</li>
        <li>Section B (foundation verdicts) — pending Anton sign-off</li>
        <li>Section C (chrome verdicts) — pending Anton sign-off</li>
        <li>Section D (voice & copy verdicts) — pending Anton sign-off</li>
        <li>Section E (interaction patterns) — pending Anton sign-off</li>
        <li>Section F (a11y / perf) — pending Anton sign-off</li>
      </ul>
    </section>
  </main>
</body>
</html>
`;

fs.writeFileSync(OUTPUT, html, 'utf8');
console.log(`✓ Wrote ${path.relative(process.cwd(), OUTPUT)}`);
console.log(`  Open: file://${OUTPUT.replace(/\\/g, '/')}`);
