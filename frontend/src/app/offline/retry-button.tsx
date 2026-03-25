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
      className="rounded-lg px-6 py-3 text-base font-semibold text-on-primary bg-primary-container transition-colors hover:bg-primary"
    >
      I-refresh
    </button>
  );
}
