/**
 * BIR Deadline Watcher — Page Component
 * Feature: BIR Deadline Watcher (Build 6)
 * Role: Server-side page that fetches deadlines and renders the feature UI
 *
 * Flow: Auth check → Fetch deadlines from /api/deadlines → Map to
 *       DeadlineCard components → Render mobile-first layout with
 *       empty state support and error handling
 *
 * Dependencies: /api/deadlines endpoint, DeadlineCard component
 * Tested by: QA — page load, deadline list rendering, empty state, error handling
 */

import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/utils/api-response';
import { DeadlineCard } from '@/components/features/deadlines/deadline-card';
import { EmptyState } from '@/components/ui/empty-state';
import type { Deadline } from '@/lib/utils/zod-schemas/deadline-types';

// ============================================================
// Page: BIR Deadline Watcher
// Server component that fetches and displays user's upcoming deadlines
// ============================================================
export default async function DeadlinesPage() {
  // --- Auth Check: Verify user is authenticated ---
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    // This shouldn't happen if middleware is configured correctly,
    // but we include it for safety
    throw new Error('Unauthorized: User session not found');
  }

  // --- Query Deadlines: Fetch from Supabase with RLS filter ---
  // The API route (/api/deadlines) is available, but for Server Components
  // we query Supabase directly. This reduces latency and one round trip.
  const { data: deadlines, error: queryError } = await supabase
    .from('bir_deadlines')
    .select(
      'id,user_id,form_type,due_date,filed,filed_at,notification_sent_7d,notification_sent_3d,notification_sent_1d,created_at,updated_at'
    )
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('due_date', { ascending: true })
    .order('form_type', { ascending: true });

  // --- Error Handling: Log and re-throw for error.tsx boundary ---
  if (queryError) {
    console.error('[deadlines/page] Query error:', queryError);
    throw new Error(`Failed to fetch deadlines: ${queryError.message}`);
  }

  const deadlineList = (deadlines as Deadline[]) || [];

  // --- Empty State: Show encouraging message if no deadlines ---
  if (deadlineList.length === 0) {
    return (
      <div className="flex flex-col min-h-dvh gap-4 p-4">
        <h1 className="text-2xl font-bold text-white">
          BIR Deadlines
        </h1>
        <EmptyState message_tl="Wala pang BIR deadlines. Kapag may bawong deadline, i-aadd natin dito. Abangan!" />
      </div>
    );
  }

  // --- Group Deadlines: By urgency for easier scanning ---
  // Separate overdue/critical (red), due soon (amber), on track (green)
  const overdueDeadlines = deadlineList.filter((d) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(d.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  });

  const criticalDeadlines = deadlineList.filter((d) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(d.due_date);
    dueDate.setHours(0, 0, 0, 0);
    const diffMs = dueDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return !overdueDeadlines.includes(d) && daysRemaining >= 0 && daysRemaining <= 3;
  });

  const soonDeadlines = deadlineList.filter((d) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(d.due_date);
    dueDate.setHours(0, 0, 0, 0);
    const diffMs = dueDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return !overdueDeadlines.includes(d) && daysRemaining > 3 && daysRemaining <= 7;
  });

  const onTrackDeadlines = deadlineList.filter((d) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(d.due_date);
    dueDate.setHours(0, 0, 0, 0);
    const diffMs = dueDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return !overdueDeadlines.includes(d) && daysRemaining > 7;
  });

  // --- Render: Organize deadlines by urgency section ---
  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      {/* --- Header --- */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-white">BIR Deadlines</h1>
        <p className="text-sm text-gray-400">
          {deadlineList.length}{' '}
          {deadlineList.length === 1 ? 'deadline' : 'deadlines'} total
        </p>
      </div>

      {/* --- Overdue Section (if any) --- */}
      {overdueDeadlines.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-red-400">
            ⚠️ Overdue ({overdueDeadlines.length})
          </h2>
          <div className="flex flex-col gap-3">
            {overdueDeadlines.map((deadline) => (
              <DeadlineCard
                key={deadline.id}
                deadline={deadline}
              />
            ))}
          </div>
        </section>
      )}

      {/* --- Critical Section (3 days or less) --- */}
      {criticalDeadlines.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-red-400">
            🔴 Critical ({criticalDeadlines.length})
          </h2>
          <div className="flex flex-col gap-3">
            {criticalDeadlines.map((deadline) => (
              <DeadlineCard
                key={deadline.id}
                deadline={deadline}
              />
            ))}
          </div>
        </section>
      )}

      {/* --- Due Soon Section (3-7 days) --- */}
      {soonDeadlines.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-yellow-400">
            🟡 Due Soon ({soonDeadlines.length})
          </h2>
          <div className="flex flex-col gap-3">
            {soonDeadlines.map((deadline) => (
              <DeadlineCard
                key={deadline.id}
                deadline={deadline}
              />
            ))}
          </div>
        </section>
      )}

      {/* --- On Track Section (>7 days) --- */}
      {onTrackDeadlines.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-light">
            🟢 On Track ({onTrackDeadlines.length})
          </h2>
          <div className="flex flex-col gap-3">
            {onTrackDeadlines.map((deadline) => (
              <DeadlineCard
                key={deadline.id}
                deadline={deadline}
              />
            ))}
          </div>
        </section>
      )}

      {/* --- Footer Note --- */}
      <div className="text-xs text-gray-500 pt-4 border-t border-gray-700/50">
        <p>
          Deadlines are shown in your local timezone (Asia/Manila).
          Mark deadlines as "Filed" when you've submitted them to BIR.
        </p>
      </div>
    </div>
  );
}
