'use client';

/**
 * Mga Costing Card Mo — List page
 *
 * Shows all user's costing cards sorted by most recently updated.
 * Empty state with illustration for first-time users.
 * FAB to create new costing card.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { IllustrationWrapper } from '@/components/illustrations/IllustrationWrapper';
import CostingCardList from '@/components/costing/costing-card-list';

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

// ─── Page ───────────────────────────────────────────────────────────

export default function CostingPage() {
  const router = useRouter();
  const [cards, setCards] = useState<CostingCardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/costing');
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message_tl ?? 'Hindi makuha ang mga costing card.');
        return;
      }
      setCards(json.data);
    } catch {
      setError('Hindi makapag-connect. I-check ang internet mo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const hasCards = cards.length > 0;

  return (
    <div className="min-h-dvh pb-20 md:pb-6" data-testid="costing-page">
      {/* ── Header ── */}
      <header className="px-4 pt-5 pb-3 md:px-8 md:pt-8 md:pb-5 md:flex md:items-center md:justify-between">
        <h1 className="text-on-surface text-lg md:text-2xl font-extrabold mb-3 md:mb-0">
          Mga Costing Card Mo
        </h1>
        {hasCards && (
          <button
            type="button"
            onClick={() => router.push('/costing/new')}
            className="hidden md:flex items-center gap-2 bg-primary-container text-on-primary font-semibold rounded-xl px-5 py-2.5 transition-colors hover:bg-primary"
          >
            <Plus className="w-4 h-4" />
            Bagong Costing Card
          </button>
        )}
      </header>

      {/* ── Loading ── */}
      {loading && (
        <div className="px-4 py-8 text-center">
          <p className="text-on-surface-variant text-sm">Loading...</p>
        </div>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div className="px-4 py-8 text-center">
          <p className="text-destructive text-sm">{error}</p>
          <button onClick={fetchCards} className="mt-2 text-primary text-sm font-semibold" type="button">
            Subukan muli
          </button>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && !hasCards && (
        <div className="px-4 py-10 text-center md:py-20">
          <div className="flex justify-center mb-3">
            <IllustrationWrapper
              src="empty-states/costing-empty.webp"
              alt="Wala ka pang costing card"
              category="empty-state"
            />
          </div>
          <p className="text-on-surface text-sm font-semibold mb-1">
            Wala ka pang costing card
          </p>
          <p className="text-on-surface-variant text-xs mb-4">
            Alamin kung magkano talaga ang gastos mo sa bawat produkto at kung tama ang presyo mo.
          </p>
          <button
            type="button"
            onClick={() => router.push('/costing/new')}
            className="inline-flex items-center gap-1.5 bg-primary-container text-on-primary text-sm font-semibold rounded-xl px-5 py-2.5 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            Gumawa ng costing card
          </button>
        </div>
      )}

      {/* ── Card list ── */}
      {!loading && !error && hasCards && (
        <div className="px-4 md:px-8">
          <CostingCardList cards={cards} />
        </div>
      )}

      {/* ── Mobile FAB ── */}
      {hasCards && (
        <button
          type="button"
          onClick={() => router.push('/costing/new')}
          className="md:hidden fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] right-4 w-14 h-14 bg-primary-container text-on-primary rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 z-40"
          aria-label="Bagong costing card"
          data-testid="add-costing-fab"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
