export default function ResiboScannerLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">📸 Resibo Scanner</h1>
          <p className="text-sm text-slate-600 mt-1">
            Scan ang iyong receipts at i-track ang gastos
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Scan Button Skeleton */}
        <div className="h-14 bg-slate-200 rounded-lg animate-pulse" />

        {/* Section Header Skeleton */}
        <div className="h-6 bg-slate-200 rounded-lg animate-pulse w-48" />

        {/* Receipt Cards Skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              {/* Vendor and Badge */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-slate-200 rounded animate-pulse" />
                    <div className="h-4 bg-slate-100 rounded animate-pulse w-32" />
                  </div>
                  <div className="h-6 w-24 bg-slate-200 rounded-full animate-pulse" />
                </div>

                {/* Amount Section */}
                <div className="bg-slate-100 rounded-lg p-3">
                  <div className="h-3 bg-slate-200 rounded animate-pulse mb-2 w-20" />
                  <div className="h-7 bg-slate-200 rounded animate-pulse w-32" />
                </div>

                {/* Expand Button */}
                <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
