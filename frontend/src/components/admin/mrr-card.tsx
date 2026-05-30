/**
 * MRR Card — Monthly Recurring Revenue with tier breakdown
 * Feature: Admin Dashboard (Gap D10)
 * Role: Shows total MRR and per-tier breakdown (Free, Pro, Business).
 *       Fetches from /api/admin/mrr.
 */

'use client';

import { useEffect, useState } from 'react';
import Money from '@/components/ui/money';

// ============================================================
// Types
// ============================================================

interface TierBreakdown {
  tier: string;
  count: number;
  mrr_centavos: number;
}

interface MrrData {
  total_mrr_centavos: number;
  total_users: number;
  paying_users: number;
  breakdown: TierBreakdown[];
}

// ============================================================
// MrrCard — MRR display with per-tier breakdown
// ============================================================

export default function MrrCard() {
  const [data, setData] = useState<MrrData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMrr() {
      try {
        const res = await fetch('/api/admin/mrr');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch {
        // Non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchMrr();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl bg-surface-container p-6 shadow-sm animate-pulse h-32" />
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl bg-surface-container p-6 shadow-sm">
        <p className="text-on-surface-variant text-sm">Failed to load MRR data.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface-container p-6 shadow-sm">
      <h2 className="text-lg font-bold text-on-surface mb-4">
        Monthly Recurring Revenue
      </h2>

      <p className="mb-4">
        <Money centavos={data.total_mrr_centavos} size="lg" />
      </p>

      {/* --- Tier Breakdown Table --- */}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-on-surface-variant">
            <th className="pb-2 font-semibold">Tier</th>
            <th className="pb-2 font-semibold text-right">Users</th>
            <th className="pb-2 font-semibold text-right">MRR</th>
          </tr>
        </thead>
        <tbody>
          {data.breakdown.map((row) => (
            <tr key={row.tier} className="text-on-surface">
              <td className="py-1 capitalize">{row.tier}</td>
              <td className="py-1 text-right">{row.count}</td>
              <td className="py-1 text-right">
                <Money centavos={row.mrr_centavos} size="sm" countUp={false} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
