/**
 * Deadline List — Grouped list of deadline cards
 * Feature: Build 6 — BIR Deadline Watcher (Sprint 9)
 * Role: Fetches and displays all deadlines grouped by status
 *       (overdue first, then upcoming, then filed). Handles loading
 *       and error states. Manages mark-as-filed actions.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import type { DeadlineWithUrgency } from '@/lib/deadlines/types';
import DeadlineCard from './deadline-card';
import DeadlineEmpty from './deadline-empty';

// ============================================================
// Group deadlines by status for display order
// ============================================================

interface GroupedDeadlines {
  overdue: DeadlineWithUrgency[];
  upcoming: DeadlineWithUrgency[];
  filed: DeadlineWithUrgency[];
}

function groupDeadlines(deadlines: DeadlineWithUrgency[]): GroupedDeadlines {
  const groups: GroupedDeadlines = { overdue: [], upcoming: [], filed: [] };

  for (const dl of deadlines) {
    if (dl.status === 'filed') {
      groups.filed.push(dl);
    } else if (dl.urgency === 'overdue' || dl.days_until < 0) {
      groups.overdue.push(dl);
    } else {
      groups.upcoming.push(dl);
    }
  }

  return groups;
}

// ============================================================
// Component
// ============================================================

export default function DeadlineList() {
  const [deadlines, setDeadlines] = useState<DeadlineWithUrgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeadlines = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/deadlines');
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message_tl ?? 'Hindi makuha ang deadlines.');
        return;
      }

      setDeadlines(json.data.deadlines);
    } catch {
      setError('Network error. Check ang connection mo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeadlines();
  }, [fetchDeadlines]);

  const handleMarkFiled = async (id: string) => {
    try {
      const res = await fetch('/api/deadlines', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'filed' }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        // Optimistic update
        setDeadlines((prev) =>
          prev.map((dl) =>
            dl.id === id ? { ...dl, status: 'filed' as const } : dl
          )
        );
      }
    } catch {
      // Silent fail — user can retry
    }
  };

  // ─── Loading state ──────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col gap-3 px-4 py-6" data-testid="deadline-loading">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-surface-container animate-pulse" />
        ))}
      </div>
    );
  }

  // ─── Error state ────────────────────────────────────
  if (error) {
    return (
      <div className="px-4 py-6 text-center" data-testid="deadline-error">
        <p className="text-sm text-error mb-3">{error}</p>
        <button
          type="button"
          onClick={fetchDeadlines}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 bg-surface-container text-on-surface text-sm font-semibold rounded-xl"
          data-testid="retry-btn"
        >
          <RefreshCw className="w-4 h-4" />
          I-retry
        </button>
      </div>
    );
  }

  // ─── Empty state ────────────────────────────────────
  if (deadlines.length === 0) {
    return <DeadlineEmpty />;
  }

  // ─── Grouped list ───────────────────────────────────
  const groups = groupDeadlines(deadlines);

  return (
    <div className="flex flex-col gap-4 px-4 pb-4" data-testid="deadline-list">
      {/* Overdue section */}
      {groups.overdue.length > 0 && (
        <section data-testid="section-overdue">
          <h2 className="text-sm font-bold text-error mb-2">
            Overdue ({groups.overdue.length})
          </h2>
          <div className="flex flex-col gap-2">
            {groups.overdue.map((dl) => (
              <DeadlineCard key={dl.id} deadline={dl} onMarkFiled={handleMarkFiled} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming section */}
      {groups.upcoming.length > 0 && (
        <section data-testid="section-upcoming">
          <h2 className="text-sm font-bold text-on-surface mb-2">
            Upcoming ({groups.upcoming.length})
          </h2>
          <div className="flex flex-col gap-2">
            {groups.upcoming.map((dl) => (
              <DeadlineCard key={dl.id} deadline={dl} onMarkFiled={handleMarkFiled} />
            ))}
          </div>
        </section>
      )}

      {/* Filed section */}
      {groups.filed.length > 0 && (
        <section data-testid="section-filed">
          <h2 className="text-sm font-bold text-on-surface-variant mb-2">
            Filed na ({groups.filed.length})
          </h2>
          <div className="flex flex-col gap-2 opacity-70">
            {groups.filed.map((dl) => (
              <DeadlineCard key={dl.id} deadline={dl} onMarkFiled={handleMarkFiled} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
