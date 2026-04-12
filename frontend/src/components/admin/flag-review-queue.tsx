/**
 * Flag Review Queue — Review and resolve user-reported AI output issues
 * Feature: Admin Dashboard (Gap D10)
 * Role: Lists flag-as-wrong reports. Admin can review context and
 *       resolve each report with a button click.
 *       Fetches from /api/admin/flags.
 */

'use client';

import { useEffect, useState, useRef } from 'react';

// ============================================================
// Types
// ============================================================

interface FlagReport {
  id: string;
  user_id: string;
  message_id: string | null;
  reason: string | null;
  context: string | null;
  resolved: boolean;
  created_at: string;
}

// ============================================================
// FlagReviewQueue — List and resolve flagged content
// ============================================================

export default function FlagReviewQueue() {
  const [flags, setFlags] = useState<FlagReport[]>([]);
  const [loading, setLoading] = useState(true);
  const resolvingRef = useRef<Set<string>>(new Set());
  const [, forceRender] = useState(0);

  useEffect(() => {
    async function fetchFlags() {
      try {
        const res = await fetch('/api/admin/flags');
        const json = await res.json();
        if (json.success) {
          setFlags(json.data);
        }
      } catch {
        // Non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchFlags();
  }, []);

  // --- Resolve handler: PATCH to mark as resolved ---
  async function handleResolve(flagId: string) {
    resolvingRef.current.add(flagId);
    forceRender((n) => n + 1);

    try {
      const res = await fetch('/api/admin/flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: flagId }),
      });
      const json = await res.json();
      if (json.success) {
        setFlags((prev) => prev.filter((f) => f.id !== flagId));
      }
    } catch {
      // Silent fail — user can retry
    } finally {
      resolvingRef.current.delete(flagId);
      forceRender((n) => n + 1);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-surface-container p-6 shadow-sm animate-pulse h-32" />
    );
  }

  return (
    <div className="rounded-xl bg-surface-container p-6 shadow-sm">
      <h2 className="text-lg font-bold text-on-surface mb-4">
        Flag Review Queue
      </h2>

      {flags.length === 0 ? (
        <p className="text-on-surface-variant text-sm">No unresolved flags.</p>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <div
              key={flag.id}
              className="rounded-lg bg-surface-container-high p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-on-surface font-semibold">
                    {flag.reason ?? 'No reason provided'}
                  </p>
                  {flag.context && (
                    <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                      {flag.context}
                    </p>
                  )}
                  <p className="text-xs text-on-surface-variant mt-1">
                    {new Date(flag.created_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}
                    {' \u00B7 User: '}{flag.user_id.slice(0, 8)}...
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleResolve(flag.id)}
                  disabled={resolvingRef.current.has(flag.id)}
                  className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-on-primary min-h-[44px] min-w-[44px] disabled:opacity-50"
                >
                  {resolvingRef.current.has(flag.id) ? 'Resolving...' : 'Resolve'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
