'use client';

// ============================================================
// DashboardCard — Phase 7 re-skin (in place per 04-reuse-audit.md)
// Role: 100x100+ tap target tile rendered on the home action grid (5 tiles)
//       and reused as the canonical home-tile primitive for any other surface
//       that wants a single feature CTA (preserve API).
//
// Phase 7 changes (Q3 resolution — re-derived tints for the cream `#fdf9f2`
// home background; no new Tailwind tokens added):
//   - icon: extended ICON_MAP with the 5 brand icons (Resibo / Usap / Kalendaryo
//     / Precio / Invoice). Legacy `camera|wallet|calendar|message-circle|message-square`
//     keys retained for backward-compat callers.
//   - chrome: per-tile honey/sage/ink tonal tint (each ≥ 3:1 on cream); icon
//     container is `bg-on-surface/5` (subtle inset, no hairline border per the
//     No-Line Rule).
//   - hover: `hover:ring-honey-deep/40`.
//   - press: `active:animate-pandesal-squish` (B6 keyframe, reduced-motion gates
//     globally via globals.css).
// ============================================================

import Link from 'next/link';
import {
  ResiboScanner,
  CashFlow,
  BirDeadlines,
  CustomerMessages,
  ReplyDrafter,
} from '@/components/illustrations/svg';
import {
  IconResibo,
  IconUsap,
  IconKalendaryo,
  IconPrecio,
  IconInvoice,
} from '@/components/illustrations/icons';

// ICON_MAP — string-key shape preserved for prop API stability. New Phase 7
// brand icons (resibo / usap / kalendaryo / precio / invoice) are the home
// canonical set; the legacy lucide-derived illustration keys remain so other
// dashboard consumers don't break while they migrate.
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  // Phase 7 brand icons (B4 approved)
  resibo: IconResibo,
  usap: IconUsap,
  kalendaryo: IconKalendaryo,
  precio: IconPrecio,
  invoice: IconInvoice,
  // Backward-compat legacy keys (other callers may still pass these)
  camera: ResiboScanner,
  wallet: CashFlow,
  calendar: BirDeadlines,
  'message-circle': CustomerMessages,
  'message-square': ReplyDrafter,
};

// TILE_TINT — Warm Precision action-tile fill. The prototype's action grid uses
// the pale honey secondary-container for every tile (the pricing tile renders
// plain surface-container). Single illustrated icon, NO corner motifs.
const TILE_TINT: Record<string, string> = {
  resibo: 'bg-secondary-container',
  usap: 'bg-secondary-container',
  kalendaryo: 'bg-secondary-container',
  precio: 'bg-surface-container', // plain tile (prototype "tile-plain")
  invoice: 'bg-secondary-container',
  // legacy keys keep the existing chrome
  camera: 'bg-surface-container',
  wallet: 'bg-surface-container',
  calendar: 'bg-surface-container',
  'message-circle': 'bg-surface-container',
  'message-square': 'bg-surface-container',
};

interface DashboardCardProps {
  title: string;
  description: string;
  href: string;
  icon: string;
  emptyState?: string;
  hasData?: boolean;
  summary?: string;
}

export default function DashboardCard({
  title,
  description,
  href,
  icon,
  emptyState,
  hasData = false,
  summary,
}: DashboardCardProps) {
  const IconComponent = ICON_MAP[icon];
  const tintClass = TILE_TINT[icon] ?? 'bg-surface-container';

  return (
    <Link
      href={href}
      className={`block ${tintClass} rounded-2xl p-4 min-h-[100px] transition-all hover:ring-1 hover:ring-honey-deep/40 active:animate-pandesal-squish focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-deep`}
      data-testid={`dashboard-card-${icon}`}
      style={{ minHeight: '100px' }} // enforces 44x44 minimum touch target floor
    >
      {/* Warm Precision action tile — single 40px illustrated icon (no inset
          chip / corner motif), title + sub stacked below per the prototype. */}
      <div className="flex flex-col gap-2.5">
        <div className="w-10 h-10 flex items-center justify-center">
          {IconComponent ? (
            <IconComponent size={40} />
          ) : (
            <span className="text-honey-deep text-sm">?</span>
          )}
        </div>

        <div className="min-w-0">
          {/* Warm Precision: card title uses the wp-h3 type token (Jakarta 600/18). */}
          <h3 className="wp-h3 text-on-surface truncate">{title}</h3>
          {hasData ? (
            <>
              <p className="text-on-surface-variant text-xs mt-0.5 line-clamp-2">
                {description}
              </p>
              {summary && (
                <p
                  className="text-honey-deep text-xs mt-1 font-semibold truncate"
                  data-testid={`dashboard-card-summary-${icon}`}
                >
                  {summary}
                </p>
              )}
            </>
          ) : (
            <p className="text-ink-faint text-xs mt-0.5 italic line-clamp-2">
              {emptyState ?? description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
