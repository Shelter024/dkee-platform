// src/security-headers.ts
// Middleware to set recommended security headers for Next.js
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Content Security Policy (CSP)
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self';",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://js.pusher.com;",
      "style-src 'self' 'unsafe-inline';",
      "img-src 'self' data: blob: https://* https://res.cloudinary.com;",
      "font-src 'self' data:;",
      "connect-src 'self' https://* wss://*;",
      "media-src 'self' https://res.cloudinary.com;",
      "frame-src 'self';",
      "object-src 'none';",
      "base-uri 'self';",
      "form-action 'self';",
      "upgrade-insecure-requests;"
    ].join(' ')
  );

  // HTTP Strict Transport Security (HSTS) - 1 year with subdomains
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // X-Frame-Options - prevent clickjacking
  res.headers.set('X-Frame-Options', 'DENY');

  // X-Content-Type-Options - prevent MIME sniffing
  res.headers.set('X-Content-Type-Options', 'nosniff');

  // X-DNS-Prefetch-Control - control DNS prefetching
  res.headers.set('X-DNS-Prefetch-Control', 'on');

  // Referrer Policy
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature Policy)
  res.headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), payment=()');

  return res;
}

export const config = {
  matcher: ['/((?!_next|static|favicon.ico).*)'],
};
