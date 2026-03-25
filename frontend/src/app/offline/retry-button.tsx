'use client';

/**
 * Retry Button — Client component that reloads the page
 * Feature: PWA Hardening (Sprint 5)
 */

export default function RetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="rounded-lg px-6 py-3 text-base font-semibold text-white transition-colors hover:opacity-90"
      style={{ backgroundColor: '#f97316' }}
    >
      I-refresh
    </button>
  );
}
