import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1, // Low sample rate for solo founder budget
  replaysSessionSampleRate: 0, // Disable session replay (cost)
  replaysOnErrorSampleRate: 0.1, // Capture 10% of error replays
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
});
