/**
 * Resibo Scanner — Loading State
 * Feature: Resibo Scanner (Build 3)
 * Route: /app/(app)/(features)/resibo/loading.tsx
 *
 * Role: Loading skeleton shown while page is fetching receipts from Supabase
 *
 * Flow: User navigates to /resibo → loading.tsx displays skeleton
 *       → server component fetches data → page.tsx replaces skeleton with actual content
 *
 * Design: Animated pulse skeletons in Warm Honey color (brand loading indicator)
 *         for button + 3 receipt card placeholders
 * Tested by: QA — skeleton displays during network delay, no layout shift on swap
 */

export default function ResiboLoading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* --- Header Skeleton --- */}
      <div className="mb-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-card" />
        <div className="mt-2 h-4 w-32 animate-pulse rounded-lg bg-card" />
      </div>

      {/* --- Scan Button Skeleton --- */}
      <div className="min-h-touch w-full animate-pulse rounded-xl bg-gradient-to-r from-honey-light/20 to-honey-deep/20" />

      {/* --- Receipt Cards Skeleton (3 placeholders) --- */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="space-y-3 rounded-xl bg-card p-4"
          >
            {/* Vendor name + confidence badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 animate-pulse rounded-lg bg-card-alt" />
                <div className="h-3 w-24 animate-pulse rounded-lg bg-card-alt" />
              </div>
              <div className="h-6 w-20 animate-pulse rounded-full bg-card-alt" />
            </div>

            {/* Date + amount rows */}
            <div className="space-y-2 border-t border-gray-700 pt-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-16 animate-pulse rounded-lg bg-card-alt" />
                <div className="h-4 w-24 animate-pulse rounded-lg bg-card-alt" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-4 w-16 animate-pulse rounded-lg bg-card-alt" />
                <div className="h-4 w-28 animate-pulse rounded-lg bg-card-alt" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
