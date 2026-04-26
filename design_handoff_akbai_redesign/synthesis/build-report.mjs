#!/usr/bin/env node
// Phase 2.1 — Side-by-side report generator
//
// Reads:
//   ../screenshots/                 — handoff reference PNGs (mobile-only)
//   ./screenshots/<screen>/         — current-app captures from compare.spec.ts
//
// Writes:
//   ./index.html                    — static side-by-side viewer
//
// Run:  node design_handoff_akbai_redesign/synthesis/build-report.mjs

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HANDOFF_PNG_DIR = path.resolve(__dirname, '..', 'screenshots');
const CURRENT_PNG_DIR = path.resolve(__dirname, 'screenshots');
const OUTPUT_HTML = path.resolve(__dirname, 'index.html');

// Maps current-app screen names to handoff PNGs. The handoff has multiple home
// variants (palette / locale / persona) and a few screens that don't yet exist
// in the current app (kuwento, daily check-in screen).
const SCREENS = [
  {
    id: '00-home',
    label: 'Home / Umaga Mo',
    currentRoute: '/dashboard',
    handoff: ['01-home-honey-fil-andoy.png', '02-home-honey-fil-mobile.png', '03-home-honey-en.png', '04-home-dawn-fil.png'],
  },
  { id: '01-chat', label: 'Kausap (Chat)', currentRoute: '/chat', handoff: ['06-chat-honey-fil.png'] },
  { id: '02-expenses', label: 'Saan napunta (Expenses)', currentRoute: '/expenses', handoff: ['07-saan-honey-fil.png'] },
  { id: '03-scan', label: 'Resibo Scanner', currentRoute: '/scan', handoff: ['08-scan-honey-fil.png'] },
  { id: '04-deadlines', label: 'BIR Deadlines', currentRoute: '/deadlines', handoff: ['09-deadlines-honey-fil.png'] },
  { id: '05-costing', label: 'Tamang Presyo (Costing)', currentRoute: '/costing', handoff: ['10-costing-honey-fil.png'] },
  { id: '06-invoices', label: 'Mga Invoice', currentRoute: '/invoices', handoff: ['11-invoices-honey-fil.png'] },
  { id: '07-profile', label: 'Profile / Persona', currentRoute: '/profile', handoff: [] },
  { id: '08-checkin', label: 'Daily Check-in', currentRoute: '/dashboard (modal)', handoff: ['12-checkin-honey-fil.png'] },
  { id: '09-kuwento', label: 'Linggong Kuwento (Sunday Story)', currentRoute: '(not yet implemented)', handoff: ['13-sundaystory-honey-fil.png'] },
];

function findCurrentScreenshots(screenId) {
  const dir = path.join(CURRENT_PNG_DIR, screenId);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.png'))
    .sort()
    .map((f) => path.posix.join('screenshots', screenId, f));
}

function relHandoffPath(filename) {
  return path.posix.join('..', 'screenshots', filename);
}

function imgTag(src, alt, missingLabel) {
  if (!src) {
    return `<div class="missing">${missingLabel}</div>`;
  }
  return `<a href="${src}" target="_blank"><img src="${src}" alt="${alt}" loading="lazy"></a>`;
}

const sections = SCREENS.map((screen) => {
  const currents = findCurrentScreenshots(screen.id);
  const handoffs = screen.handoff;

  const currentCells = currents.length > 0
    ? currents.map((src) => `
          <figure>
            <figcaption>${path.basename(src)}</figcaption>
            ${imgTag(src, screen.label + ' current', 'no capture')}
          </figure>`).join('\n')
    : `<div class="missing">No current capture — run <code>npm run test:e2e -- e2e/synthesis/compare.spec.ts</code></div>`;

  const handoffCells = handoffs.length > 0
    ? handoffs.map((f) => `
          <figure>
            <figcaption>${f}</figcaption>
            ${imgTag(relHandoffPath(f), screen.label + ' handoff', 'no handoff PNG')}
          </figure>`).join('\n')
    : `<div class="missing">No handoff reference (screen is new in redesign)</div>`;

  return `
    <section id="${screen.id}">
      <h2>${screen.id} — ${screen.label}</h2>
      <p class="meta"><strong>Current route:</strong> <code>${screen.currentRoute}</code></p>
      <div class="grid">
        <div class="col">
          <h3>Current AKBai</h3>
          ${currentCells}
        </div>
        <div class="col">
          <h3>Handoff (reference)</h3>
          ${handoffCells}
        </div>
      </div>
    </section>
  `;
}).join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AKBai — Phase 2.1 visual comparison</title>
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
    }
    header {
      position: sticky; top: 0;
      background: var(--bg);
      border-bottom: 1px solid var(--outline);
      padding: 24px 0 16px;
      margin-bottom: 24px;
      z-index: 10;
    }
    h1 { margin: 0 0 4px; font-size: 22px; font-weight: 700; }
    h1 small { font-weight: 400; color: var(--ink-soft); font-size: 14px; margin-left: 8px; }
    nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    nav a {
      font-size: 12px;
      padding: 4px 10px;
      background: var(--honey-cream);
      border: 1px solid var(--outline);
      border-radius: 999px;
      color: var(--honey-deep);
      text-decoration: none;
    }
    nav a:hover { background: var(--honey); color: white; }
    section {
      max-width: 1400px;
      margin: 0 auto 64px;
      scroll-margin-top: 96px;
    }
    h2 { font-size: 18px; margin: 0 0 4px; color: var(--ink); }
    .meta { font-size: 13px; color: var(--ink-soft); margin: 0 0 16px; }
    .meta code { background: var(--honey-cream); padding: 2px 6px; border-radius: 4px; }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      align-items: start;
    }
    .col {
      background: white;
      border: 1px solid var(--outline);
      border-radius: 12px;
      padding: 16px;
    }
    .col h3 {
      font-size: 14px;
      margin: 0 0 12px;
      color: var(--ink-soft);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    figure { margin: 0 0 16px; }
    figcaption { font-size: 11px; color: var(--ink-soft); font-family: ui-monospace, Menlo, monospace; margin-bottom: 6px; }
    img { max-width: 100%; height: auto; border-radius: 8px; border: 1px solid var(--outline); display: block; }
    .missing {
      padding: 32px 16px;
      text-align: center;
      color: var(--ink-soft);
      font-size: 13px;
      border: 1px dashed var(--outline);
      border-radius: 8px;
      background: var(--honey-cream);
    }
    .missing code { background: white; padding: 2px 6px; border-radius: 4px; }
    @media (max-width: 900px) {
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <h1>AKBai — Phase 2.1 Visual Comparison <small>${new Date().toISOString().slice(0, 10)}</small></h1>
    <p style="font-size:13px;color:var(--ink-soft);margin:8px 0 0;">
      Phase 2 docs: <a href="01-comparison.md" style="color:var(--honey-deep);">01-comparison.md</a> ·
      <a href="02-decisions.md" style="color:var(--honey-deep);">02-decisions.md</a> ·
      <a href="decisions.html" style="color:var(--honey-deep);"><b>decisions.html (visual)</b></a> ·
      Review repos: <a href="repos/icons.html" style="color:var(--honey-deep);">icons</a> /
      <a href="repos/motifs.html" style="color:var(--honey-deep);">motifs</a> /
      <a href="repos/animations.html" style="color:var(--honey-deep);">animations</a>
    </p>
    <nav>
      ${SCREENS.map((s) => `<a href="#${s.id}">${s.label}</a>`).join('')}
    </nav>
  </header>
  <main>
    ${sections}
  </main>
</body>
</html>
`;

fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
const screenshotCount = SCREENS.reduce((acc, s) => acc + findCurrentScreenshots(s.id).length, 0);
console.log(`✓ Wrote ${path.relative(process.cwd(), OUTPUT_HTML)}`);
console.log(`  ${screenshotCount} current-app screenshots indexed`);
console.log(`  Open in browser: file://${OUTPUT_HTML.replace(/\\/g, '/')}`);
