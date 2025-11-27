import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || undefined,
  environment: process.env.SENTRY_ENV || 'development',
  release: process.env.SENTRY_RELEASE || undefined,
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0'),
  integrations: (integrations) => integrations,
});

// Example manual capture for initialization success
Sentry.captureMessage('Sentry server initialized');