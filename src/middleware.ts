import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { middleware as securityHeadersMiddleware } from './security-headers';
import { getToken } from 'next-auth/jwt';

// Premium routes that require active subscription
const PREMIUM_ROUTES = [
  '/dashboard/customer/service-reminders',
  '/dashboard/customer/tracking',
];

// Restrict access for non-approved customer accounts to certain protected areas
export async function middleware(req: NextRequest) {
  // Apply security headers globally
  const res = securityHeadersMiddleware(req);

  const pathname = req.nextUrl.pathname;
  
  // Enforce role guard for admin dashboard: block non-staff
  if (pathname.startsWith('/dashboard/admin')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const role = (token as any)?.role as string | undefined;
    const isStaff = role && role !== 'CUSTOMER';
    if (!token || !isStaff) {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard/customer';
      return NextResponse.redirect(url);
    }
  }

  // Check if route requires premium subscription
  const isPremiumRoute = PREMIUM_ROUTES.some((route) => pathname.startsWith(route));

  if (isPremiumRoute) {
    try {
      // Get the user's session token
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token?.sub) {
        // No authentication - redirect to login
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = '/login';
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Note: Full subscription validation happens in the API routes
      // This middleware just ensures authentication for premium routes
      // The page components will show upgrade prompts if subscription is invalid
    } catch (error) {
      console.error('Middleware error:', error);
    }
  }

  // Define protected customer areas that require APPROVED status
  const protectedCustomerPaths = [
    '/dashboard/customer',
    '/dashboard/customer/vehicles',
    '/dashboard/customer/services',
    '/dashboard/customer/properties',
    '/dashboard/customer/invoices',
    '/dashboard/customer/account',
  ];

  // Only run checks for those paths
  if (protectedCustomerPaths.some((p) => pathname.startsWith(p))) {
    const token = req.cookies.get('next-auth.session-token') || req.cookies.get('__Secure-next-auth.session-token');
    // If no auth token, redirect to login
    if (!token) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // We rely on client-side session for fine-grained gating; server-side could decode JWT if needed.
    // For simplicity, let the page fetch session and show gating UI.
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next|static|favicon.ico).*)',
    '/dashboard/customer/:path*',
    '/dashboard/admin/:path*'
  ],
};
