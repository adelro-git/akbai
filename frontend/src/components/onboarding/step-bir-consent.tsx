'use client';

interface StepBirConsentProps {
  onComplete: (birConsent: boolean) => void;
  loading: boolean;
  firstName: string;
}

export default function StepBirConsent({ onComplete, loading, firstName }: StepBirConsentProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* KA bubble */}
      <div className="bg-kai-card rounded-2xl rounded-tl-sm p-4 max-w-[85%]">
        <p className="text-white text-base leading-relaxed">
          Last question, <span className="text-honey font-semibold">{firstName}</span> — gusto mo
          bang i-track ko ang BIR deadlines mo?
        </p>
      </div>

      {/* Explanation */}
      <div className="bg-kai-card-alt rounded-xl p-4 space-y-3">
        <p className="text-slate-300 text-sm leading-relaxed">
          Pag nag-yes ka, gagawin ko ito:
        </p>
        <ul className="text-slate-400 text-sm space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-teal mt-0.5">✓</span>
            <span>Automatic BIR deadline reminders</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal mt-0.5">✓</span>
            <span>Tax form recommendations based sa negosyo mo</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal mt-0.5">✓</span>
            <span>Filing date alerts (7, 3, at 1 day before)</span>
          </li>
        </ul>
        <p className="text-slate-500 text-xs">
          Pwede mo i-change anytime sa Settings. Hindi ito tax advice — gabay lang.
        </p>
      </div>

      {/* Consent buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onComplete(false)}
          disabled={loading}
          className="py-3 px-4 rounded-xl border border-white/10 bg-kai-card-alt text-slate-300 font-semibold transition-all hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? '...' : 'Hindi muna'}
        </button>
        <button
          type="button"
          onClick={() => onComplete(true)}
          disabled={loading}
          className="py-3 px-4 rounded-xl bg-honey hover:bg-honey-deep text-ink font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? '...' : 'Oo, sige!'}
        </button>
      </div>
    </div>
  );
}
