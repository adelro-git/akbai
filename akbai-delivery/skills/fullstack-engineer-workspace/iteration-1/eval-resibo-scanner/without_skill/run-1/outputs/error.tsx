'use client';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function ResiboScannerError({ error, reset }: ErrorProps) {
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

      {/* Error Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-8 space-y-6 text-center">
          {/* Error Icon */}
          <div className="text-6xl">⚠️</div>

          {/* Error Title */}
          <div>
            <h1 className="text-2xl font-bold text-red-900 mb-2">
              May problema sa pag-load
            </h1>
            <p className="text-red-700">
              Hindi namin makuha ang iyong mga resibo. Mangyaring subukan muli.
            </p>
          </div>

          {/* Error Details */}
          <div className="bg-white rounded-lg p-4 text-left border border-red-200">
            <p className="text-xs font-semibold text-red-700 uppercase mb-2">
              Error Details
            </p>
            <p className="text-sm text-red-800 font-mono break-words">
              {error.message || 'Unknown error occurred'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={reset}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              🔄 Subukan Ulit
            </button>
            <a
              href="/app/dashboard"
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold py-3 px-4 rounded-lg transition-colors duration-200 text-center"
            >
              ← Bumalik sa Dashboard
            </a>
          </div>

          {/* Helpful Tips */}
          <div className="bg-slate-100 rounded-lg p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-slate-700 uppercase mb-3">
              💡 Mga Tip
            </p>
            <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
              <li>Siguraduhing konektado ka sa internet</li>
              <li>Subukan ang pag-refresh ng pahina</li>
              <li>Kung patuloy ang problema, kontakin ang aming support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
