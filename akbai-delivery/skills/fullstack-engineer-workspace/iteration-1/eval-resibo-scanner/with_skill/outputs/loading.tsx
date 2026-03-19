export default function ResiboLoading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-card" />
        <div className="h-4 w-64 animate-pulse rounded-lg bg-card" />
      </div>

      {/* Button skeletons */}
      <div className="flex gap-3">
        <div className="flex-1 h-12 animate-pulse rounded-xl bg-card" />
        <div className="flex-1 h-12 animate-pulse rounded-xl bg-card" />
      </div>

      {/* Divider */}
      <div className="h-px bg-card my-2" />

      {/* Recent receipts header */}
      <div className="h-6 w-40 animate-pulse rounded-lg bg-card" />

      {/* Receipt card skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl bg-card p-4 flex flex-col gap-3 animate-pulse">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-5 w-32 bg-card-alt rounded" />
              <div className="h-3 w-24 bg-card-alt rounded" />
              <div className="h-6 w-20 bg-card-alt rounded mt-1" />
            </div>
            <div className="h-6 w-16 bg-card-alt rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
