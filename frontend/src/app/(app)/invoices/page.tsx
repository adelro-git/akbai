'use client';

/**
 * Mga Invoice Mo — Invoice List Page (Build 8)
 *
 * Shows all invoices with status filter tabs and search.
 * Empty state with illustration when no invoices exist.
 * Mobile-first: single column, FAB for new invoice.
 * Desktop: wider layout.
 *
 * Dependencies: InvoiceList, StatusBadge, API: GET /api/invoices
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { IllustrationWrapper } from '@/components/illustrations/IllustrationWrapper';
import InvoiceList from '@/components/invoices/invoice-list';
import { createClient } from '@/lib/supabase/client';
import { SKIP_AUTH } from '@/lib/supabase/dev-auth';
import type { Invoice, InvoiceStatus } from '@/lib/invoices/types';

// ============================================================
// Types
// ============================================================

interface InvoiceSummary {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  cancelled: number;
}

interface InvoicesData {
  invoices: Invoice[];
  summary: InvoiceSummary;
}

// ============================================================
// Status Tabs Config
// ============================================================

const STATUS_TABS: { key: InvoiceStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Lahat' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
];

// ============================================================
// Page Component
// ============================================================

export default function InvoicesPage() {
  const router = useRouter();
  const [data, setData] = useState<InvoicesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<InvoiceStatus | 'all'>('all');
  const searchRef = useRef<HTMLInputElement>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // ── Auth gate (Sprint 15 Capacitor conversion) ──
  useEffect(() => {
    async function gate() {
      if (SKIP_AUTH) {
        setAuthChecked(true);
        return;
      }
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.replace('/login');
        return;
      }
      setAuthChecked(true);
    }
    gate().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('invoices page auth gate failed', err);
      router.replace('/login');
    });
  }, [router]);

  // --- Fetch invoices ---
  const fetchInvoices = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('status', activeTab);
      if (search) params.set('search', search);

      const res = await fetch(`/api/invoices?${params.toString()}`);
      const json = await res.json();

      if (!json.success) {
        setError(json.error?.message_tl ?? 'Hindi makuha ang mga invoice.');
        return;
      }

      setData(json.data);
    } catch {
      setError('Hindi makapag-connect. Check ang internet mo.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!authChecked) return;
    fetchInvoices();
  }, [authChecked, fetchInvoices]);

  // --- Search handler ---
  const handleSearch = useCallback(() => {
    const query = searchRef.current?.value?.trim() ?? '';
    fetchInvoices(query || undefined);
  }, [fetchInvoices]);

  const hasInvoices = data && data.invoices.length > 0;

  return (
    <div className="min-h-dvh pb-20 tablet:pb-6" data-testid="invoices-page">
      {/* ── Header ── */}
      <header className="px-4 pt-5 pb-3 tablet:px-8 tablet:pt-8 tablet:pb-5">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-on-surface text-lg tablet:text-2xl font-extrabold">
            Mga Invoice Mo
          </h1>
          <button
            onClick={() => router.push('/invoices/new')}
            className="hidden tablet:inline-flex items-center gap-1.5 bg-primary-container text-on-primary text-sm font-semibold rounded-xl px-4 py-2.5 min-h-[44px] transition-colors"
            type="button"
            data-testid="new-invoice-desktop"
          >
            <Plus className="w-4 h-4" />
            Bagong Invoice
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Hanapin ang client o invoice number..."
            className="w-full bg-surface-container-low rounded-xl pl-9 pr-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container min-h-[44px]"
            data-testid="search-invoices"
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-primary text-xs font-semibold px-2 py-1"
            type="button"
          >
            Hanapin
          </button>
        </div>
      </header>

      {/* ── Status Tabs ── */}
      <div className="px-4 mb-3 overflow-x-auto">
        <div className="flex gap-1.5 min-w-max">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const s = data?.summary;
            const count = s
              ? tab.key === 'all' ? s.total
              : tab.key === 'draft' ? s.draft
              : tab.key === 'sent' ? s.sent
              : tab.key === 'paid' ? s.paid
              : tab.key === 'overdue' ? s.overdue
              : s.cancelled
              : 0;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors min-h-[36px] ${
                  isActive
                    ? 'bg-primary-container text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
                type="button"
                data-testid={`tab-${tab.key}`}
              >
                {tab.label} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

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
          <button onClick={() => fetchInvoices()} className="mt-2 text-primary text-sm font-semibold" type="button">
            Subukan muli
          </button>
        </div>
      )}

      {/* ── Empty State ── */}
      {data && !loading && !error && !hasInvoices && (
        <div className="px-4 py-10 text-center tablet:py-20">
          <div className="flex justify-center mb-3">
            <IllustrationWrapper
              src="empty-states/invoice-empty.webp"
              alt="Wala ka pang invoice"
              category="empty-state"
            />
          </div>
          <p className="text-on-surface text-sm font-semibold mb-1">
            Wala pa kang invoice
          </p>
          <p className="text-on-surface-variant text-xs mb-4">
            Gumawa ng invoice para sa mga customer mo at i-track ang bayad.
          </p>
          <button
            onClick={() => router.push('/invoices/new')}
            className="inline-flex items-center gap-1.5 bg-primary-container text-on-primary text-sm font-semibold rounded-xl px-5 py-2.5 min-h-[44px]"
            type="button"
            data-testid="new-invoice-empty"
          >
            <Plus className="w-4 h-4" />
            Gumawa ng Invoice
          </button>
        </div>
      )}

      {/* ── Invoice List ── */}
      {data && !loading && !error && hasInvoices && (
        <div className="px-4 tablet:px-8">
          <InvoiceList invoices={data.invoices} />
        </div>
      )}

      {/* ── Mobile FAB ── */}
      {!loading && (
        <button
          onClick={() => router.push('/invoices/new')}
          className="tablet:hidden fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] right-4 w-14 h-14 bg-primary-container text-on-primary rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 z-40"
          aria-label="Gumawa ng bagong invoice"
          data-testid="new-invoice-fab"
          type="button"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
