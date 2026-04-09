'use client';

interface StepBirConsentProps {
  onComplete: (birConsent: boolean) => void;
  loading: boolean;
  firstName: string;
}

export default function StepBirConsent({ onComplete, loading, firstName }: StepBirConsentProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Kai bubble */}
      <div className="bg-surface-container rounded-2xl rounded-tl-sm p-4 max-w-[85%]">
        <p className="text-on-surface text-base leading-relaxed">
          Last question, <span className="text-primary-container font-semibold">{firstName}</span> — gusto mo
          bang i-track ko ang BIR deadlines mo?
        </p>
      </div>

      {/* Explanation */}
      <div className="bg-surface-container-high rounded-xl p-4 space-y-3">
        <p className="text-on-surface text-sm leading-relaxed">
          Pag nag-yes ka, gagawin ko ito:
        </p>
        <ul className="text-on-surface-variant text-sm space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-teal mt-0.5">✓</span>
            <span>Automatic BIR deadline reminders</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal mt-0.5">✓</span>
            <span>Tax form recommendations ayon sa negosyo mo</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal mt-0.5">✓</span>
            <span>Filing date alerts (7, 3, at 1 day before)</span>
          </li>
        </ul>
        <p className="text-outline text-xs">
          Pwede mo i-change anytime sa Settings. Hindi ito tax advice — gabay lang.
        </p>
      </div>

      {/* Consent buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onComplete(false)}
          disabled={loading}
          className="py-3 px-4 rounded-xl border border-outline-variant/30 bg-surface-container-high text-on-surface font-semibold transition-all hover:border-outline-variant/50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? '...' : 'Hindi muna'}
        </button>
        <button
          type="button"
          onClick={() => onComplete(true)}
          disabled={loading}
          className="py-3 px-4 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? '...' : 'Oo, sige!'}
        </button>
      </div>
    </div>
  );
}
