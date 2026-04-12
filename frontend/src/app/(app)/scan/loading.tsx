/**
 * Resibo Scanner — Loading State
 * Feature: Resibo Scanner (Build 3)
 * Role: Next.js loading.tsx convention. Shows skeleton while
 *       server component resolves auth and feature flag checks.
 */

export default function ScanLoading() {
  return (
    <div className="min-h-dvh pb-20 animate-pulse" data-testid="scan-loading">
      {/* Header skeleton */}
      <div className="px-4 pt-5 pb-3 flex items-center gap-3">
        <div className="w-11 h-11 bg-surface-container-high rounded-lg" />
        <div className="w-36 h-6 bg-surface-container-high rounded-lg" />
      </div>

      {/* Content skeleton */}
      <div className="px-4 space-y-4">
        {/* Illustration placeholder */}
        <div className="flex justify-center py-4">
          <div className="w-60 h-44 bg-surface-container-low rounded-2xl" />
        </div>

        {/* Action card placeholder */}
        <div className="bg-surface-container-low rounded-2xl p-6 space-y-4">
          <div className="w-48 h-5 bg-surface-container-high rounded mx-auto" />
          <div className="w-64 h-4 bg-surface-container-high rounded mx-auto" />
          <div className="space-y-3 pt-2">
            <div className="w-full h-12 bg-surface-container-high rounded-xl" />
            <div className="w-full h-12 bg-surface-container-high rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
