import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || undefined,
  environment: process.env.SENTRY_ENV || 'development',
  release: process.env.SENTRY_RELEASE || undefined,
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0'),
});

// Optional: filter noisy errors
Sentry.addEventProcessor((event) => {
  if (event.exception && event.exception.values) {
    const msg = event.exception.values.map(v => v.value).join(' ');
    if (/ResizeObserver loop limit exceeded/i.test(msg)) return null;
  }
  return event;
});