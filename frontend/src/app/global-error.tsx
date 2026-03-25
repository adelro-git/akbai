'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="tl">
      <body className="bg-background text-foreground min-h-dvh flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">May problema — pasensya na!</h2>
          <p className="text-on-surface-variant mb-4">
            May technical issue kami ngayon. Subukan mo ulit.
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-primary-container text-on-primary rounded-lg font-medium hover:bg-primary transition-colors"
          >
            Subukan Ulit
          </button>
        </div>
      </body>
    </html>
  );
}
