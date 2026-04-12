/**
 * Admin Stats — Top-level statistics cards
 * Feature: Admin Dashboard (Gap D10)
 * Role: Displays total users, paying users, MRR, active today.
 *       Fetches from /api/admin/users and /api/admin/mrr.
 */

'use client';

import { useEffect, useState } from 'react';
import { centavosToPeso } from '@/lib/utils/money';

// ============================================================
// Types
// ============================================================

interface StatsData {
  totalUsers: number;
  payingUsers: number;
  mrrCentavos: number;
  activeToday: number;
}

// ============================================================
// StatCard — Individual metric card
// ============================================================

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-container p-4 shadow-sm">
      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-bold text-on-surface mt-1">{value}</p>
    </div>
  );
}

// ============================================================
// AdminStats — Fetches and displays top-level stats
// ============================================================

export default function AdminStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usersRes, mrrRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/mrr'),
        ]);

        const usersJson = await usersRes.json();
        const mrrJson = await mrrRes.json();

        if (usersJson.success && mrrJson.success) {
          const users = usersJson.data as Array<{
            last_sign_in_at: string | null;
            subscription_tier: string;
          }>;

          // Count users active in the last 24 hours
          const now = Date.now();
          const oneDayMs = 24 * 60 * 60 * 1000;
          const activeToday = users.filter((u) => {
            if (!u.last_sign_in_at) return false;
            return now - new Date(u.last_sign_in_at).getTime() < oneDayMs;
          }).length;

          setStats({
            totalUsers: users.length,
            payingUsers: mrrJson.data.paying_users,
            mrrCentavos: mrrJson.data.total_mrr_centavos,
            activeToday,
          });
        }
      } catch {
        // Silently handle — stats are non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-surface-container p-4 shadow-sm animate-pulse h-20" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <p className="text-on-surface-variant text-sm">Failed to load stats.</p>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Total Users" value={String(stats.totalUsers)} />
      <StatCard label="Paying Users" value={String(stats.payingUsers)} />
      <StatCard label="MRR" value={centavosToPeso(stats.mrrCentavos)} />
      <StatCard label="Active Today" value={String(stats.activeToday)} />
    </div>
  );
}
