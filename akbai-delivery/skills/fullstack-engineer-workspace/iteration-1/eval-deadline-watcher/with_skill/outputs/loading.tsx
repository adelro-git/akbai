// app/(app)/(features)/deadlines/loading.tsx
// Loading skeleton for deadlines page

export default function DeadlinesLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      {/* Header skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-card" />
        <div className="h-4 w-64 animate-pulse rounded-lg bg-card/50" />
      </div>

      {/* Section header skeleton */}
      <div className="h-4 w-24 animate-pulse rounded-lg bg-card/50" />

      {/* Card skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl p-4 bg-card animate-pulse">
          {/* Header row: form type and badge */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="h-5 w-32 bg-card-alt rounded" />
            <div className="h-6 w-24 bg-card-alt rounded-full" />
          </div>

          {/* Due date row */}
          <div className="mb-3">
            <div className="h-3 w-20 bg-card-alt rounded mb-1" />
            <div className="h-4 w-40 bg-card-alt rounded" />
          </div>

          {/* Days remaining row */}
          <div className="h-4 w-32 bg-card-alt rounded mb-4" />

          {/* Button skeleton */}
          <div className="h-10 w-full bg-card-alt rounded-lg" />
        </div>
      ))}
    </div>
  );
}
