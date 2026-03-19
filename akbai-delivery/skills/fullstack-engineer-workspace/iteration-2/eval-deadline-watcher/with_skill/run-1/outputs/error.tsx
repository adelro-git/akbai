/**
 * BIR Deadline Watcher — Error Boundary Component
 * Feature: BIR Deadline Watcher (Build 6)
 * Role: Next.js error UI boundary — catches errors from page.tsx or DeadlineCard
 *
 * Design: User-friendly error message in Taglish, with retry button.
 *         Logs error details to console for debugging.
 *
 * Dependencies: React error boundary pattern (Next.js 14 convention)
 */

'use client';

import { useEffect } from 'react';

interface DeadlinesErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DeadlinesError({
  error,
  reset,
}: DeadlinesErrorProps) {
  // --- Error Logging: Log to console for debugging ---
  useEffect(() => {
    console.error('[deadlines/error]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 min-h-dvh p-4">
      {/* --- Error Icon and Title --- */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-xl font-bold text-white">
          May problema sa pag-load
        </h1>
      </div>

      {/* --- Error Message --- */}
      <p className="text-sm text-gray-400 text-center max-w-sm">
        Hindi namin kaya mag-load ng iyong BIR deadlines ngayon.
        Ito ay maaaring isang temporary issue. Subukan ulit sa ilang sandali.
      </p>

      {/* --- Debug Info (Development Only) --- */}
      {process.env.NODE_ENV === 'development' && (
        <details className="w-full max-w-sm bg-card rounded-lg p-3 text-xs text-gray-500">
          <summary className="cursor-pointer font-semibold mb-2">
            Error Details (Dev Only)
          </summary>
          <pre className="overflow-auto whitespace-pre-wrap break-words">
            {error.message}
          </pre>
        </details>
      )}

      {/* --- Action Buttons --- */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={reset}
          className="w-full min-h-[44px] rounded-xl bg-gradient-to-r from-honey-light
                     to-honey-deep font-semibold text-white active:opacity-80
                     transition-opacity"
        >
          Subukan Ulit
        </button>
        <a
          href="/dashboard"
          className="w-full min-h-[44px] flex items-center justify-center rounded-xl
                     border border-gray-700 font-semibold text-white
                     active:opacity-80 transition-opacity"
        >
          Bumalik sa Dashboard
        </a>
      </div>

      {/* --- Footer Note --- */}
      <p className="text-xs text-gray-600 text-center mt-4">
        Kung patuloy ang problema, makipag-ugnayan sa aming support team.
      </p>
    </div>
  );
}
