/**
 * BIR Deadline Watcher — Loading State
 * Feature: BIR Deadline Watcher (Build 6)
 * Role: Next.js loading UI boundary — shown while page.tsx is fetching data
 *
 * Design: Skeleton cards in Warm Honey (brand's loading indicator color)
 *         to match AKBai's loading pattern. Approximate card dimensions
 *         for visual continuity when content loads.
 *
 * Dependencies: Tailwind CSS (animate-pulse, bg-card, etc.)
 */

export default function DeadlinesLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      {/* --- Header Skeleton --- */}
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-card" />
        <div className="h-4 w-32 animate-pulse rounded-lg bg-card" />
      </div>

      {/* --- Section Title Skeleton --- */}
      <div className="h-4 w-40 animate-pulse rounded-lg bg-card" />

      {/* --- Card Skeletons --- */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-xl bg-card p-4 animate-pulse"
        >
          {/* --- Header Row --- */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-5 w-24 bg-card-alt rounded" />
              <div className="h-4 w-32 bg-card-alt rounded" />
            </div>
            <div className="h-6 w-20 bg-card-alt rounded-full" />
          </div>

          {/* --- Body Row --- */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-2">
              <div className="h-3 w-16 bg-card-alt rounded" />
              <div className="h-4 w-28 bg-card-alt rounded" />
            </div>
            <div className="h-16 w-20 bg-card-alt rounded-lg" />
          </div>

          {/* --- Footer Row --- */}
          <div className="h-3 w-40 bg-card-alt rounded pt-2 border-t border-gray-700/50" />
        </div>
      ))}
    </div>
  );
}
