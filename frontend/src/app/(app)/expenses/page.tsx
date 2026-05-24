'use client';

// ============================================================
// /expenses — Saan Napunta? (Phase 8d ADOPT HANDOFF, A3)
// Full layout replacement. Money-story flow: header eyebrow + Fraunces
// H1 → time-range pills → total card with donut + delta → "Bawat
// Kategorya" rows → Kai paper-note callout → 7-day banig chart →
// empty state.
// Data layer reuses the existing /api/expenses contract (month query
// param). MonthPicker UI is replaced by the new pills, but the under-
// lying date math is the same.
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { IllustrationWrapper } from '@/components/illustrations/IllustrationWrapper';
import { PageBackground } from '@/components/ui/page-background';
import { PaperNote } from '@/components/ui/paper-note';
import { Kai } from '@/components/illustrations/kai/kai';
import { IconPera } from '@/components/illustrations/icons';
import { BanigBarChart } from '@/components/ui/banig-bar-chart';
import { getManilaToday } from '@/lib/timezone';
import AddTransactionModal from '@/components/expenses/add-transaction-modal';
import ExpensesDonut from '@/components/expenses/expenses-donut';
import CategoryBreakdownRow from '@/components/expenses/category-breakdown-row';
import type { WeeklyStoryDay } from '@/lib/weekly-story/types';

// ============================================================
// Types — match /api/expenses GET response shape
// ============================================================

interface Transaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  description: string | null;
  transaction_date: string;
  source: string;
}

interface CategorySummary {
  category: string;
  total: number;
  count: number;
}

interface ExpensesData {
  transactions: Transaction[];
  summary: {
    total_income: number;
    total_expenses: number;
    net: number;
    by_category: CategorySummary[];
  };
}

type TimeRange = 'linggo' | 'buwan' | 'taon';

const FILIPINO_DAY_LABELS = ['Lun', 'Mar', 'Miy', 'Hue', 'Bie', 'Sab', 'Lin'];

// Sprint 14 — pills now hit `/api/expenses?range=linggo|buwan|taon`.
// The route resolves the Manila-local date window server-side (see
// `lib/expenses/range.ts`); the page just forwards the pill choice.
function rangeToQuery(range: TimeRange): string {
  return `range=${range}`;
}

// ============================================================
// Helpers
// ============================================================

/** Build a 7-day kita/gastos breakdown from raw transactions for the BanigBarChart. */
function buildSevenDayBreakdown(transactions: Transaction[], today: string): WeeklyStoryDay[] {
  const todayDate = new Date(`${today}T00:00:00+08:00`);
  const days: WeeklyStoryDay[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - offset);
    const yyyyMmDd = d.toISOString().slice(0, 10);
    // Manila weekday — Mon = 1 .. Sun = 0; remap to Lun..Lin
    const jsDay = d.getDay(); // 0=Sun..6=Sat
    const filIndex = jsDay === 0 ? 6 : jsDay - 1;
    const dayLabel = FILIPINO_DAY_LABELS[filIndex];
    let kita = 0;
    let gastos = 0;
    for (const tx of transactions) {
      if (tx.transaction_date !== yyyyMmDd) continue;
      if (tx.type === 'income') kita += tx.amount;
      else if (tx.type === 'expense') gastos += tx.amount;
    }
    days.push({
      date: yyyyMmDd,
      day_label: dayLabel,
      kita_centavos: kita,
      gastos_centavos: gastos,
    });
  }
  return days;
}

function pickKaiInsight(totalExpensesCentavos: number, totalIncomeCentavos: number): {
  expression: 'happy' | 'concerned';
  copy: string;
} {
  // Conservative voice-manual-aware copy.
  if (totalExpensesCentavos === 0) {
    return {
      expression: 'happy',
      copy: 'Wala ka pang gastos ngayong buwan. Magaan ang pisikal na pera ngayon.',
    };
  }
  if (totalIncomeCentavos > 0 && totalIncomeCentavos > totalExpensesCentavos) {
    return {
      expression: 'happy',
      copy: 'Mas malaki ang kita kaysa gastos ngayon — patuloy lang natin itong bantayan.',
    };
  }
  if (totalIncomeCentavos > 0 && totalExpensesCentavos > totalIncomeCentavos * 1.15) {
    return {
      expression: 'concerned',
      copy: 'Mas malaki ang gastos kaysa kita ngayon. Tingnan natin saan tayo pwedeng bumawas.',
    };
  }
  return {
    expression: 'happy',
    copy: 'Heto ang takbo ng gastos mo ngayong buwan — tingnan natin nang mabuti.',
  };
}

// ============================================================
// Page
// ============================================================

export default function ExpensesPage() {
  const today = getManilaToday();

  const [range, setRange] = useState<TimeRange>('buwan');
  const [data, setData] = useState<ExpensesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = rangeToQuery(range);
      const res = await fetch(`/api/expenses?${qs}`);
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message_tl ?? 'Hindi makuha ang data.');
        return;
      }
      setData(json.data);
    } catch {
      setError('Hindi makakonekta. I-check mo ang internet mo.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleAddSuccess = useCallback(() => {
    setIsAddOpen(false);
    fetchExpenses();
  }, [fetchExpenses]);

  // Filter by-category to expense rows only and order by total desc.
  const expenseCategories = useMemo(() => {
    if (!data) return [];
    return data.summary.by_category
      .filter((c) => {
        const tx = data.transactions.find((t) => t.category === c.category);
        return tx?.type === 'expense';
      })
      .sort((a, b) => b.total - a.total);
  }, [data]);

  const totalExpenses = data?.summary.total_expenses ?? 0;
  const totalIncome = data?.summary.total_income ?? 0;
  const net = data?.summary.net ?? 0;
  const totalPesos = Math.round(totalExpenses / 100);

  const sevenDay = useMemo(() => {
    if (!data) return [];
    return buildSevenDayBreakdown(data.transactions, today);
  }, [data, today]);

  const peakKitaIndex = useMemo(() => {
    if (sevenDay.length === 0) return null;
    let peakIdx: number | null = null;
    let peakVal = 0;
    sevenDay.forEach((d, i) => {
      if (d.kita_centavos > peakVal) {
        peakVal = d.kita_centavos;
        peakIdx = i;
      }
    });
    return peakIdx;
  }, [sevenDay]);

  const insight = pickKaiInsight(totalExpenses, totalIncome);
  const hasData = data && data.transactions.length > 0;

  // Active month label — "Abril 2026" style. Use Manila clock so the
  // user sees the same month the backend filtered against.
  const monthLabel = useMemo(() => {
    const d = new Date(`${today}T00:00:00+08:00`);
    return d.toLocaleDateString('fil-PH', { month: 'long', year: 'numeric' });
  }, [today]);

  return (
    <PageBackground variant="expenses">
      <div
        className="min-h-dvh pb-24 max-w-[760px] mx-auto px-4 py-6"
        data-testid="expenses-page"
      >
        {/* ── Screen header ── */}
        <header className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-honey-deep" aria-hidden>
              <IconPera size={28} />
            </span>
            <span className="text-[10px] font-extrabold tracking-[0.08em] text-honey-deep">
              SAAN NAPUNTA ANG PERA?
            </span>
          </div>
          <h1
            className="font-serif text-[28px] leading-tight text-on-surface"
            style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontWeight: 500 }}
          >
            Heto kung saan napunta ang pera mo.
          </h1>
        </header>

        {/* ── Time-range pills ── */}
        <div
          className="flex gap-2 mb-5"
          role="tablist"
          aria-label="Saklaw ng panahon"
          data-testid="expenses-range-pills"
        >
          {(['linggo', 'buwan', 'taon'] as const).map((r) => {
            const labels: Record<TimeRange, string> = {
              linggo: 'Linggo',
              buwan: 'Buwan',
              taon: 'Buong Taon',
            };
            const isActive = range === r;
            return (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setRange(r)}
                className={
                  'min-h-[40px] px-4 rounded-full text-[13px] font-semibold transition-colors ' +
                  (isActive
                    ? 'bg-honey-deep text-white shadow-ambient'
                    : 'bg-surface-container-low text-ink-soft hover:bg-honey-cream/40')
                }
                data-testid={`expenses-range-${r}`}
              >
                {labels[r]}
              </button>
            );
          })}
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="px-4 py-8 text-center">
            <p className="text-ink-soft text-sm">Hinihintay ang data...</p>
          </div>
        )}

        {/* ── Error ── */}
        {error && !loading && (
          <div className="px-4 py-8 text-center">
            <p className="text-destructive text-sm mb-2">{error}</p>
            <button
              onClick={fetchExpenses}
              className="text-honey-deep text-sm font-semibold underline-offset-2 hover:underline"
              type="button"
            >
              Subukan muli
            </button>
          </div>
        )}

        {/* ── Empty state ── */}
        {data && !loading && !error && !hasData && (
          <div className="py-10 text-center">
            <div className="flex justify-center mb-3">
              <IllustrationWrapper
                src="empty-states/no-expenses.webp"
                alt="Walang pang naka-log na gastos"
                category="empty-state"
              />
            </div>
            <p className="text-on-surface text-sm font-semibold mb-1">
              Wala ka pang naka-log na gastos.
            </p>
            <p className="text-ink-soft text-xs mb-4">
              I-try mo ang Resibo Scanner?
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-1.5 bg-honey-deep text-white text-sm font-semibold rounded-xl px-5 py-2.5 shadow-ambient"
              type="button"
            >
              <Plus className="w-4 h-4" />
              Mag-add ng gastos
            </button>
          </div>
        )}

        {/* ── Data flow ── */}
        {data && !loading && !error && hasData && (
          <>
            {/* Total card */}
            <section
              className="rounded-2xl bg-surface-container-lowest p-4 mb-5 shadow-ambient"
              data-testid="expenses-total-card"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <ExpensesDonut
                    categoryTotals={expenseCategories.map((c) => ({
                      key: c.category,
                      total: c.total,
                    }))}
                    totalCentavos={totalExpenses}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-extrabold tracking-[0.08em] text-honey-deep mb-1">
                    {`GASTOS · ${
                      range === 'linggo'
                        ? 'NGAYONG LINGGO'
                        : range === 'taon'
                          ? 'NGAYONG TAON'
                          : 'NGAYONG BUWAN'
                    }`}
                  </div>
                  <div
                    className="font-serif text-[28px] leading-none text-on-surface"
                    data-testid="expenses-total"
                    style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
                  >
                    ₱{totalPesos.toLocaleString('en-PH')}
                  </div>
                  <div
                    className="mt-2 text-[12px] text-ink-soft"
                    data-testid="expenses-delta"
                  >
                    {totalIncome > 0 ? (
                      <>
                        <span className="text-sage-deep font-semibold">
                          Kita: ₱{Math.round(totalIncome / 100).toLocaleString('en-PH')}
                        </span>
                        <span className="mx-1.5 text-ink-faint">·</span>
                        <span
                          className={
                            net >= 0
                              ? 'text-sage-deep font-semibold'
                              : 'text-destructive font-semibold'
                          }
                        >
                          Tubo: ₱{Math.round(net / 100).toLocaleString('en-PH')}
                        </span>
                      </>
                    ) : (
                      <span>Walang naka-log na kita ngayong buwan.</span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Bawat Kategorya */}
            <section className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold tracking-[0.08em] text-honey-deep">
                  BAWAT KATEGORYA
                </span>
                <span className="text-[11px] text-ink-soft">{monthLabel}</span>
              </div>
              <div className="rounded-2xl bg-surface-container-lowest p-3 shadow-ambient">
                {expenseCategories.slice(0, 5).map((c) => {
                  const percent = totalExpenses > 0 ? (c.total / totalExpenses) * 100 : 0;
                  return (
                    <CategoryBreakdownRow
                      key={c.category}
                      categoryKey={c.category}
                      totalCentavos={c.total}
                      percent={percent}
                    />
                  );
                })}
              </div>
            </section>

            {/* Kai paper-note callout */}
            <PaperNote
              tilt="left"
              tone="default"
              padding="md"
              className="mb-5"
              data-testid="expenses-kai-callout"
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0">
                  <Kai expression={insight.expression} size={32} />
                </span>
                <p
                  className="font-serif italic text-[14px] leading-relaxed text-on-surface"
                  style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
                >
                  {insight.copy}
                </p>
              </div>
            </PaperNote>

            {/* 7-day banig chart */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold tracking-[0.08em] text-honey-deep">
                  PANG-ARAW-ARAW
                </span>
                <span className="text-[11px] text-ink-soft">7 araw</span>
              </div>
              <div className="rounded-2xl bg-surface-container-lowest p-3 shadow-ambient">
                <div data-testid="expenses-banig-bar">
                  <BanigBarChart days={sevenDay} peakDayIndex={peakKitaIndex} />
                </div>
              </div>
            </section>
          </>
        )}

        {/* Mobile FAB */}
        {hasData && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="tablet:hidden fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] right-4 w-14 h-14 bg-honey-deep text-white rounded-2xl flex items-center justify-center shadow-ambient-lg transition-transform hover:scale-105 active:scale-95 z-40"
            aria-label="Mag-add ng transaction"
            data-testid="add-transaction-fab"
            type="button"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}

        {/* Tablet/desktop inline add button */}
        {hasData && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="hidden tablet:flex items-center justify-center gap-2 w-full bg-honey-deep text-white font-semibold rounded-xl py-3 shadow-ambient transition-colors hover:bg-honey-deep/90"
            type="button"
            data-testid="add-transaction-inline"
          >
            <Plus className="w-5 h-5" />
            Mag-add ng Transaction
          </button>
        )}

        <AddTransactionModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onSuccess={handleAddSuccess}
        />
      </div>
    </PageBackground>
  );
}
