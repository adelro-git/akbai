'use client';

export function DeadlinesSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-6 shadow-sm">
        <div className="mb-3 h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 w-24 animate-pulse rounded-full bg-gray-200"
            />
          ))}
        </div>

        {/* Deadline Cards Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border-2 border-gray-200 bg-white p-4"
            >
              {/* Header */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 h-5 w-20 rounded bg-gray-200" />
                  <div className="h-5 w-40 rounded bg-gray-200" />
                </div>
                <div className="h-6 w-24 rounded-full bg-gray-200" />
              </div>

              {/* Description */}
              <div className="mb-3 h-3 w-full rounded bg-gray-200" />

              {/* Date and Progress */}
              <div className="mb-4 space-y-2">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-2 w-full rounded-full bg-gray-200" />
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <div className="h-10 flex-1 rounded-md bg-gray-200" />
                <div className="h-10 flex-1 rounded-md bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return <DeadlinesSkeleton />;
}
