# Phase 2.5 -- Component Reuse Audit

**Date:** 2026-04-26
**Lead:** build-ux
**Governance rule:** Never introduce a parallel component when an existing one can be re-skinned. Sprint 5 lesson: duplicate tile components fragmented the dashboard. This table is the single source of truth on component sources. Per-screen specs reference it; they do not duplicate the table.

---

## Source key

| Tag | Meaning |
|---|---|
| **Current (re-skin)** | Existing component; change only visual tokens. Preserve API. |
| **Handoff (port)** | New component from prototype JSX in design_handoff_akbai_redesign/prototype/. |
| **Library (wrap)** | Third-party library already installed; thin wrapper with AKBai tokens. |
| **New build** | Does not exist anywhere; build from scratch per spec. |
| **Reject parallel** | Proposed component duplicating an existing one -- do not build. |

| sidebar-nav.tsx | Current (re-skin) | frontend/src/components/dashboard/sidebar-nav.tsx | Same, re-skinned | 10-shared-chrome (all) |
| bottom-nav.tsx | Current (re-skin) | frontend/src/components/dashboard/bottom-nav.tsx | Same, re-skinned | 10-shared-chrome (all) |
| dashboard-card.tsx -> feature-tile.tsx | Current (re-skin) | frontend/src/components/dashboard/dashboard-card.tsx | frontend/src/components/ui/feature-tile.tsx | 00-home, 06-invoices |
| check-in-modal.tsx | Current (extend) | frontend/src/components/dashboard/check-in-modal.tsx | Same, extended in place | 08-checkin |
| morning-briefing-card.tsx | Current (re-skin) | frontend/src/components/dashboard/morning-briefing-card.tsx | Same | 00-home |
| kai-greeting.tsx | Current (re-skin) | frontend/src/components/dashboard/kai-greeting.tsx | Same | 00-home |
| KaiSitting mark | Current (wrap) | frontend/public/icons/mark-honey.png | frontend/src/components/ui/kai-mark.tsx | 00-home, 10-sidebar |
| Kai expression avatar | Current (wrap) | frontend/src/components/illustrations/svg/ka-expressions/ | frontend/src/components/ui/kai-avatar.tsx | All Kai-callout screens |
| Expense category icons | Current (keep) | frontend/src/components/illustrations/svg/expense-categories/ | Same, no changes | 02-expenses |
| Financial icons | Current (keep) | frontend/src/components/illustrations/svg/financial/ | Same, no changes | Various |
| Business-type illustrations | Current (keep) | frontend/src/components/illustrations/svg/business-types/ | Same, no changes | Onboarding |
| Costing illustration | Current (port to layout) | Existing costing empty-state asset | Same asset, new layout | 05-costing empty state |
| Invoice illustration | Current (port to layout) | Existing invoice empty-state asset | Same asset, new layout | 06-invoices empty state |
| PaperNote primitive | New build | -- | frontend/src/components/ui/paper-note.tsx | 00-home, 02-expenses, 04-deadlines, 08-checkin, 09-kuwento |
| TapeStrip | Handoff (port) | prototype/components/screen-home.jsx inline | frontend/src/components/ui/tape-strip.tsx | Inside PaperNote |
| BanigBarChart | New build | -- | frontend/src/components/ui/banig-bar-chart.tsx | 00-home, 02-expenses, 09-kuwento |
| Donut chart | Library (wrap) | Recharts installed | frontend/src/components/ui/donut-chart.tsx | 02-expenses |
| Category progress bar | New build | -- | frontend/src/components/ui/category-progress-bar.tsx | 02-expenses |
| WovenDivider | Handoff (port) | prototype/components/screen-home.jsx inline | frontend/src/components/ui/woven-divider.tsx | 00-home (pending B5) |
| CapizPattern | Handoff (port) | prototype/components/ui.jsx | frontend/src/components/ui/capiz-pattern.tsx | 00-home hero bg (pending B5) |
| FloatingPetals | Handoff (port) | prototype/components/screen-home.jsx inline | frontend/src/components/ui/floating-petals.tsx | 00-home only (pending B6) |
| Squiggle | Handoff (port) | prototype/components/screen-home.jsx | frontend/src/components/ui/squiggle.tsx | 00-home kumusta ka underline only (pending B5) |
| Radix slider themed | Library (wrap) | @radix-ui/react-slider installed | frontend/src/components/ui/honey-slider.tsx | 05-costing, 08-checkin |
| Energy slider emoji ticks | New build | -- | Inline in check-in-modal.tsx | 08-checkin |
| Date chip 56x56 | New build | -- | frontend/src/components/ui/date-chip.tsx | 04-deadlines |
| Form-code pill | Current (re-skin) | Existing pill/badge component | Same, honey-pale fill variant | 04-deadlines |
| Status pills invoice | Current (re-skin) | Existing status badge | Same, 3-variant: sage/honey/error | 06-invoices |
| Invoice FAB | New build | -- | frontend/src/components/ui/fab.tsx | 06-invoices |
| KPI grid Kuwento 2x2 | New build | -- | frontend/src/components/kuwento/kpi-grid.tsx | 09-kuwento |
| Narrative paragraph highlights | New build | -- | frontend/src/components/kuwento/narrative-paragraph.tsx | 09-kuwento |
| Share CTA + Vaul sheet | New build | -- | frontend/src/components/kuwento/share-cta.tsx | 09-kuwento |
| Vaul More drawer | Library (wrap) | vaul installed | frontend/src/components/ui/more-drawer.tsx | 10-shared-chrome |
| Language toggle pills | New build inline | -- | Inline in sidebar-nav.tsx -- not a separate component | 10-shared-chrome |
| Persona pill | New build inline | -- | Inline in sidebar-nav.tsx -- not a separate component | 10-shared-chrome |
| palette-context.tsx | New build | -- | frontend/src/lib/palette/palette-context.tsx | All routes (Phase 3) |
| IconResibo | Handoff port pending B4 | prototype/components/icons.jsx | frontend/src/components/icons/icon-resibo.tsx | 00-home tile |
| IconUsap | Handoff port pending B4 | prototype/components/icons.jsx | frontend/src/components/icons/icon-usap.tsx | 00-home tile |
| IconKalendaryo | Handoff port pending B4 | prototype/components/icons.jsx | frontend/src/components/icons/icon-kalendaryo.tsx | 00-home tile, 04-deadlines |
| IconPrecio | Handoff port pending B4 | prototype/components/icons.jsx | frontend/src/components/icons/icon-precio.tsx | 00-home tile, 05-costing |
| IconInvoice | Handoff port pending B4 | prototype/components/icons.jsx | frontend/src/components/icons/icon-invoice.tsx | 00-home tile, 06-invoices |
| IconPera | Handoff port pending B4 | prototype/components/icons.jsx | frontend/src/components/icons/icon-pera.tsx | 00-home Kuwento, 09-kuwento |
| Sampaguita | Handoff port pending B4 | prototype/components/icons.jsx | frontend/src/components/icons/sampaguita.tsx | 00-home, chart peak marker |

---

## Reject list

If a PR introduces any of the following, request the existing component be re-skinned instead.

| Proposed component | Reject reason | Use instead |
|---|---|---|
| DashboardTile, HomeTile, ActionTile, QuickActionCard | Parallel to dashboard-card.tsx | Re-skin dashboard-card.tsx into feature-tile.tsx |
| InvoiceSummaryTile | Parallel to feature-tile.tsx | Re-skin feature-tile.tsx with invoice props |
| CheckinPage or /(app)/checkin/page.tsx | Deprecated by A9 verdict | Extend check-in-modal.tsx in place |
| NewSidebarNav, DesignSystemSidebar | Parallel to sidebar-nav.tsx | Re-skin sidebar-nav.tsx |
| NewBottomNav, RedesignedNav | Parallel to bottom-nav.tsx | Re-skin bottom-nav.tsx |
| Any new chart library (Visx, Chart.js, nivo) | Recharts already installed | Use Recharts with custom Bar shapes |

---

## Fraunces font addition (Phase 3 prerequisite)

Fraunces is not currently installed. Add via next/font/google in frontend/src/app/layout.tsx before any serif screen is built. Subset to Latin only. Budget impact: approximately 30KB gzipped -- within the 500KB page-weight budget per pattern:media-hand-me-down-baseline.

---

## Palette context system (Phase 3 prerequisite)

palette-context.tsx sets data-palette="cream" on /dashboard and data-palette="honey" on all other routes. No dark inverted palette anywhere (A10 override). CSS var overrides live in globals.css under [data-palette="honey"]. Current cream values are the default and require no attribute.

---

**Cross-reference:** Per-screen specs in screens/ reference this table by component name. Verdicts in 02-decisions.md drove all source decisions above.
