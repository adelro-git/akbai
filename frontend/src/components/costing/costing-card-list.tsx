'use client';

/**
 * CostingCardList — Grid of costing card summaries
 *
 * Shows product name, category, total cost, margin indicator.
 * Links to detail view on click. Mobile: single column, Desktop: 2-col grid.
 */

import Link from 'next/link';
import { centavosToPeso } from '@/lib/utils/money';

// ─── Types ──────────────────────────────────────────────────────────

interface CostingCardSummary {
  id: string;
  product_name: string;
  product_category: string | null;
  total_cost_centavos: number;
  selling_price_centavos: number | null;
  suggested_price_centavos: number | null;
  actual_margin_pct: number | null;
  target_margin_pct: number;
  item_count: number;
  updated_at: string;
}

interface CostingCardListProps {
  cards: CostingCardSummary[];
}

// ─── Helpers ────────────────────────────────────────────────────────

function getMarginBadge(margin: number | null): { text: string; className: string } {
  if (margin === null) return { text: 'Walang presyo', className: 'bg-surface-container text-on-surface-variant' };
  if (margin >= 30) return { text: `${margin.toFixed(0)}% margin`, className: 'bg-tertiary/10 text-tertiary' };
  if (margin >= 15) return { text: `${margin.toFixed(0)}% margin`, className: 'bg-primary-container/10 text-primary-container' };
  if (margin >= 0) return { text: `${margin.toFixed(0)}% margin`, className: 'bg-destructive/10 text-destructive' };
  return { text: 'Lugi', className: 'bg-destructive/10 text-destructive' };
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'ngayon lang';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

// ─── Component ──────────────────────────────────────────────────────

export default function CostingCardList({ cards }: CostingCardListProps) {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-3"
      data-testid="costing-card-list"
    >
      {cards.map((card) => {
        const badge = getMarginBadge(card.actual_margin_pct);

        return (
          <Link
            key={card.id}
            href={`/costing/${card.id}`}
            className="block bg-surface-container-lowest rounded-2xl p-4 transition-colors hover:bg-surface-container-low active:scale-[0.98]"
            data-testid={`costing-card-${card.id}`}
          >
            {/* Top: Name + Badge */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-on-surface text-sm font-bold truncate">
                  {card.product_name}
                </h3>
                {card.product_category && (
                  <p className="text-on-surface-variant text-xs truncate">
                    {card.product_category}
                  </p>
                )}
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg whitespace-nowrap ${badge.className}`}>
                {badge.text}
              </span>
            </div>

            {/* Middle: Cost + Price */}
            <div className="flex items-baseline gap-3 mb-2">
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-wider">Gastos</p>
                <p className="text-on-surface text-sm font-extrabold">
                  {centavosToPeso(card.total_cost_centavos)}
                </p>
              </div>
              {card.selling_price_centavos && (
                <div>
                  <p className="text-on-surface-variant text-[10px] uppercase tracking-wider">Presyo</p>
                  <p className="text-on-surface text-sm font-extrabold">
                    {centavosToPeso(card.selling_price_centavos)}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom: Item count + time */}
            <div className="flex items-center justify-between">
              <p className="text-on-surface-variant text-xs">
                {card.item_count} item{card.item_count !== 1 ? 's' : ''}
              </p>
              <p className="text-on-surface-variant text-xs">
                {formatRelativeTime(card.updated_at)}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
