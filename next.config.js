const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: true, // Disabled for now
  runtimeCaching: [],
});
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Temporarily disable Sentry to fix server exit issue
// const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  experimental: {
    optimizePackageImports: [
      'react-icons',
    ],
  },
};

module.exports = withBundleAnalyzer(withPWA(nextConfig));
// module.exports = withSentryConfig(withPWA(nextConfig), { silent: true });
