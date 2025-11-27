const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: true, // Disabled for now
  runtimeCaching: [],
});

// Temporarily disable Sentry to fix server exit issue
// const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
};

module.exports = withPWA(nextConfig);
// module.exports = withSentryConfig(withPWA(nextConfig), { silent: true });
