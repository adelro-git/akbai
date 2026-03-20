'use client';

export default function ResiboError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 p-8 text-center min-h-screen flex-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20">
        <span className="text-3xl">⚠️</span>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-semibold text-red-400">
          May problema sa pag-load ng Resibo Scanner
        </h1>
        <p className="text-sm text-gray-400">
          Subukan ulit o mag-refresh ng page kung tuloy-tuloy ang problema
        </p>
      </div>

      {/* Error Details (development only) */}
      {process.env.NODE_ENV === 'development' && error.message && (
        <div className="w-full max-w-md rounded-lg bg-card-alt p-3 border border-red-500/30">
          <p className="text-xs text-red-300 font-mono break-words">
            {error.message}
          </p>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={reset}
        className="min-h-[44px] min-w-[200px] rounded-xl bg-gradient-to-r from-honey-light to-honey-deep
                   px-6 font-semibold text-white active:scale-95 transition-transform"
      >
        Subukan Ulit
      </button>

      {/* Secondary Action */}
      <button
        onClick={() => window.location.href = '/'}
        className="min-h-[44px] min-w-[200px] rounded-xl bg-card border border-gray-700
                   px-6 font-semibold text-white active:scale-95 transition-transform"
      >
        Bumalik sa Home
      </button>
    </div>
  );
}
