// app/(app)/(features)/deadlines/error.tsx
// Error boundary for deadlines page

'use client';

export default function DeadlinesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 p-8 text-center pb-24">
      <div className="rounded-full bg-red-900/20 p-3">
        <svg
          className="h-6 w-6 text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <div>
        <h1 className="text-lg font-bold text-white mb-1">May problema sa pag-load</h1>
        <p className="text-sm text-gray-400">
          Hindi namin nakuha ang iyong deadlines. Subukan ulit?
        </p>
      </div>

      <button
        onClick={reset}
        className="
          min-h-touch min-w-touch
          rounded-xl bg-gradient-to-r from-honey-light to-honey-deep
          px-6 font-semibold text-white
          transition-opacity duration-200 active:opacity-80
        "
      >
        Subukan Ulit
      </button>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 w-full rounded-lg bg-red-900/10 p-3 text-left">
          <p className="text-xs font-mono text-red-300 break-all">
            {error.message || 'Unknown error'}
          </p>
        </div>
      )}
    </div>
  );
}
