/**
 * Resibo Scanner — Error Boundary
 * Feature: Resibo Scanner (Build 3)
 * Route: /app/(app)/(features)/resibo/error.tsx
 *
 * Role: Client-side error handler for page and server component errors
 *
 * Flow: Server component throws error (e.g., Supabase query fails) or client code errors
 *       → error.tsx boundary catches it
 *       → display Taglish error message + retry button
 *
 * Design: Warm, empathetic error message. Retry button re-runs server component fetch.
 *         Never shows technical error details to user.
 * Tested by: QA — error state display, retry button functionality,
 *            graceful handling of Supabase connection failures
 */

'use client';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ResiboError({ error, reset }: ErrorProps) {
  // Log error to console for debugging (server-side error will be in logs)
  console.error('Resibo page error:', error.message);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-8 text-center">
      {/* --- Error Icon & Title --- */}
      <div className="space-y-2">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-xl font-semibold text-white">
          May problema sa pag-load
        </h1>
      </div>

      {/* --- Error Message (Taglish) --- */}
      <p className="max-w-sm text-sm text-gray-400">
        Kailangan namin mag-load ng mga nai-scan mong resibo, pero may nangyari.
        Subukan ulit at i-refresh ang page kung patuloy pa rin ang problema.
      </p>

      {/* --- Retry Button --- */}
      <button
        onClick={reset}
        className="min-h-touch rounded-xl bg-gradient-to-r from-honey-light to-honey-deep
                   px-6 font-semibold text-ink transition-all hover:shadow-lg active:scale-95"
      >
        Subukan Ulit
      </button>

      {/* --- Error Digest (for support debugging) --- */}
      {error.digest && (
        <div className="text-xs text-gray-600">
          Error ID: {error.digest}
        </div>
      )}
    </div>
  );
}
