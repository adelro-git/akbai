// app/(app)/(features)/deadlines/page.tsx
// Server-rendered page showing all BIR deadlines for the authenticated user

import { createClient } from '@/lib/supabase/server';
import { DeadlineCard } from '@/components/features/deadlines/deadline-card';
import { EmptyState } from '@/components/ui/empty-state';

export default async function DeadlinesPage() {
  // 1. Get authenticated user
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  // 2. Fetch deadlines for this user, sorted by due_date ascending
  const { data: deadlines, error: dbError } = await supabase
    .from('bir_deadlines')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('due_date', { ascending: true });

  if (dbError) {
    throw dbError;
  }

  // 3. Render empty state if no deadlines
  if (!deadlines || deadlines.length === 0) {
    return (
      <div className="px-4 py-8">
        <EmptyState message_tl="Walang BIR deadlines para sa iyo ngayon. Relax, ika'y updated!" />
      </div>
    );
  }

  // 4. Group deadlines: upcoming unfiled first, then filed
  const unfiledDeadlines = deadlines.filter((d) => !d.filed);
  const filedDeadlines = deadlines.filter((d) => d.filed);

  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">BIR Deadlines</h1>
        <p className="text-sm text-gray-400">
          {unfiledDeadlines.length} to file, {filedDeadlines.length} filed
        </p>
      </div>

      {/* Unfiled deadlines section */}
      {unfiledDeadlines.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
            To File
          </h2>
          <div className="flex flex-col gap-3">
            {unfiledDeadlines.map((deadline) => (
              <DeadlineCard key={deadline.id} deadline={deadline} />
            ))}
          </div>
        </div>
      )}

      {/* Filed deadlines section */}
      {filedDeadlines.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
            Filed
          </h2>
          <div className="flex flex-col gap-3">
            {filedDeadlines.map((deadline) => (
              <DeadlineCard key={deadline.id} deadline={deadline} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
