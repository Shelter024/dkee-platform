export async function register() {
  // Temporarily disabled to debug server exit issue
  // if (process.env.NEXT_RUNTIME === 'nodejs') {
  //   const Sentry = await import('@sentry/nextjs');
  //   
  //   Sentry.init({
  //     dsn: process.env.SENTRY_DSN || undefined,
  //     environment: process.env.SENTRY_ENV || 'development',
  //     release: process.env.SENTRY_RELEASE || undefined,
  //     tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0'),
  //     debug: false,
  //   });
  // }
}
