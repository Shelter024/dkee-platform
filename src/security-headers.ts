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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com;",
      "style-src 'self' 'unsafe-inline';",
      "img-src 'self' data: blob: https://*;",
      "font-src 'self' data:;",
      "connect-src 'self' https://*;",
      "frame-src 'self';",
      "object-src 'none';",
      "base-uri 'self';",
      "form-action 'self';"
    ].join(' ')
  );

  // HTTP Strict Transport Security (HSTS)
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  // X-Frame-Options
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // X-Content-Type-Options
  res.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer Policy
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature Policy)
  res.headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');

  return res;
}

export const config = {
  matcher: ['/((?!_next|static|favicon.ico).*)'],
};
