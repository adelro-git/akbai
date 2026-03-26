'use client';

import { useRouter } from 'next/navigation';

interface SessionExpiryModalProps {
  isOpen: boolean;
}

/**
 * Full-screen glassmorphism overlay shown when the user's session
 * expires unexpectedly. Redirects to /login on CTA click.
 */
export default function SessionExpiryModal({ isOpen }: SessionExpiryModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  function handleLogin() {
    router.push('/login');
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[20px] bg-black/20"
      data-testid="session-expiry-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Session expired"
    >
      <div className="bg-surface rounded-2xl p-8 mx-6 max-w-sm w-full shadow-ambient-lg text-center flex flex-col items-center gap-6">
        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-primary-container/10 flex items-center justify-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            className="text-primary"
            aria-hidden="true"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Copy */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-on-surface">
            Session expired
          </h2>
          <p
            className="text-on-surface-variant text-sm leading-relaxed"
            data-testid="session-expiry-message"
          >
            Oops, nag-expire ang session mo. Mag-login ulit para makapag-continue.
          </p>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleLogin}
          className="w-full bg-primary-container hover:bg-primary text-on-primary font-semibold py-3 px-4 rounded-xl transition-all min-h-[44px]"
          data-testid="session-expiry-login-btn"
        >
          Mag-login ulit
        </button>
      </div>
    </div>
  );
}
