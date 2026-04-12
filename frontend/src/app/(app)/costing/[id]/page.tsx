'use client';

/**
 * Costing Card Detail/Edit — Single card view
 *
 * Shows the full costing card with summary, line items, and edit controls.
 * Delete with confirmation. Edit navigates to the same form in edit mode.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Loader2 } from 'lucide-react';
import type { CostingCardWithItems } from '@/lib/costing/types';
import { centavosToPeso } from '@/lib/utils/money';
import CostingSummary from '@/components/costing/costing-summary';
import CostingCardForm from '@/components/costing/costing-card-form';

// ─── Page ───────────────────────────────────────────────────────────

export default function CostingCardDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [card, setCard] = useState<CostingCardWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchCard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/costing/${id}`);
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message_tl ?? 'Hindi mahanap ang costing card.');
        return;
      }
      setCard(json.data);
    } catch {
      setError('Hindi makapag-connect. I-check ang internet mo.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchCard(); }, [fetchCard]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/costing/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        router.push('/costing');
        router.refresh();
      }
    } catch {
      setError('Hindi ma-delete. Subukan muli.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [id, router]);

  // ── Edit mode ──
  if (isEditing && card) {
    return <CostingCardForm card={card} />;
  }

  return (
    <div className="min-h-dvh pb-20 md:pb-6" data-testid="costing-detail-page">
      {/* ── Header ── */}
      <header className="px-4 pt-5 pb-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/costing')}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors"
          aria-label="Bumalik sa mga costing card"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </button>
        <h1 className="flex-1 text-on-surface text-lg font-extrabold truncate">
          {card?.product_name ?? 'Costing Card'}
        </h1>
        {card && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors"
              aria-label="I-edit"
              data-testid="edit-btn"
            >
              <Pencil className="w-4 h-4 text-on-surface" />
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-destructive/10 transition-colors"
              aria-label="I-delete"
              data-testid="delete-btn"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
          </div>
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
          <button onClick={fetchCard} className="mt-2 text-primary text-sm font-semibold" type="button">
            Subukan muli
          </button>
        </div>
      )}

      {/* ── Card detail ── */}
      {card && !loading && !error && (
        <div className="px-4 space-y-4">
          {/* Description */}
          {card.description && (
            <p className="text-on-surface-variant text-sm">{card.description}</p>
          )}
          {card.product_category && (
            <span className="inline-block bg-surface-container text-on-surface-variant text-xs font-semibold px-2.5 py-1 rounded-lg">
              {card.product_category}
            </span>
          )}

          {/* Summary */}
          <CostingSummary
            totalCostCentavos={card.total_cost_centavos}
            suggestedPriceCentavos={card.suggested_price_centavos}
            sellingPriceCentavos={card.selling_price_centavos}
            actualMarginPct={card.actual_margin_pct}
            breakEvenQty={card.break_even_qty}
            yieldQuantity={card.yield_quantity}
            yieldUnit={card.yield_unit}
          />

          {/* Line items */}
          <div>
            <p className="text-on-surface text-xs font-bold uppercase tracking-wider mb-2">
              Mga Gastos ({card.items.length} items)
            </p>
            <div className="space-y-2">
              {card.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface-container-lowest rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-on-surface text-sm font-semibold truncate">
                      {item.item_name}
                    </p>
                    <p className="text-on-surface-variant text-xs">
                      {item.quantity} {item.unit} x ₱{(item.unit_cost_centavos / 100).toFixed(2)}
                      <span className="text-on-surface-variant/50 ml-1.5">
                        ({item.item_type})
                      </span>
                    </p>
                  </div>
                  <p className="text-on-surface text-sm font-extrabold ml-3">
                    {centavosToPeso(item.total_cost_centavos)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation overlay ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5 max-w-sm w-full space-y-4">
            <h2 className="text-on-surface text-lg font-bold">I-delete ang costing card?</h2>
            <p className="text-on-surface-variant text-sm">
              Hindi na ito mababalik. Sigurado ka ba?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-surface-container text-on-surface font-semibold rounded-xl py-2.5 min-h-[44px] transition-colors hover:bg-surface-container-high"
              >
                Huwag muna
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-destructive text-white font-semibold rounded-xl py-2.5 min-h-[44px] flex items-center justify-center gap-2 transition-colors hover:bg-destructive/90 disabled:opacity-50"
                data-testid="confirm-delete-btn"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'I-delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
