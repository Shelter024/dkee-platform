/**
 * Rate limiting middleware for API routes
 * Enforces rate limits on write operations (POST, PUT, DELETE, PATCH)
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from './rate-limit';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

/**
 * Rate limit configuration per endpoint type
 */
const RATE_LIMITS = {
  // Write operations (POST, PUT, DELETE, PATCH)
  write: {
    limit: 30, // 30 requests
    window: 60, // per 60 seconds
  },
  // Authentication endpoints
  auth: {
    limit: 5, // 5 requests
    window: 300, // per 5 minutes
  },
  // Upload endpoints
  upload: {
    limit: 10, // 10 uploads
    window: 60, // per 60 seconds
  },
  // Export endpoints
  export: {
    limit: 5, // 5 exports
    window: 300, // per 5 minutes
  },
};

/**
 * Get rate limit key for a request
 * Uses user ID if authenticated, otherwise IP address
 */
function getRateLimitKey(req: NextRequest, prefix: string): string {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  return `${prefix}:${ip}`;
}

/**
 * Get authenticated rate limit key (per-user)
 */
async function getAuthenticatedRateLimitKey(req: NextRequest, prefix: string): Promise<string> {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      return `${prefix}:user:${session.user.id}`;
    }
  } catch {
    // Fall through to IP-based key
  }
  
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  return `${prefix}:ip:${ip}`;
}

/**
 * Apply rate limiting to write operations
 */
export async function applyWriteRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const key = await getAuthenticatedRateLimitKey(req, 'write');
  const result = await rateLimit(key, RATE_LIMITS.write.limit, RATE_LIMITS.write.window);
  
  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: RATE_LIMITS.write.window,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': RATE_LIMITS.write.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': (Date.now() + RATE_LIMITS.write.window * 1000).toString(),
          'Retry-After': RATE_LIMITS.write.window.toString(),
        },
      }
    );
  }
  
  return null; // Allow request to proceed
}

/**
 * Apply rate limiting to authentication endpoints
 */
export async function applyAuthRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const key = getRateLimitKey(req, 'auth');
  const result = await rateLimit(key, RATE_LIMITS.auth.limit, RATE_LIMITS.auth.window);
  
  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Too many authentication attempts. Please try again later.',
        retryAfter: RATE_LIMITS.auth.window,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': RATE_LIMITS.auth.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': (Date.now() + RATE_LIMITS.auth.window * 1000).toString(),
          'Retry-After': RATE_LIMITS.auth.window.toString(),
        },
      }
    );
  }
  
  return null;
}

/**
 * Apply rate limiting to upload endpoints
 */
export async function applyUploadRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const key = await getAuthenticatedRateLimitKey(req, 'upload');
  const result = await rateLimit(key, RATE_LIMITS.upload.limit, RATE_LIMITS.upload.window);
  
  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Too many uploads. Please try again later.',
        retryAfter: RATE_LIMITS.upload.window,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': RATE_LIMITS.upload.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': (Date.now() + RATE_LIMITS.upload.window * 1000).toString(),
          'Retry-After': RATE_LIMITS.upload.window.toString(),
        },
      }
    );
  }
  
  return null;
}

/**
 * Apply rate limiting to export endpoints
 */
export async function applyExportRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const key = await getAuthenticatedRateLimitKey(req, 'export');
  const result = await rateLimit(key, RATE_LIMITS.export.limit, RATE_LIMITS.export.window);
  
  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Too many export requests. Please try again later.',
        retryAfter: RATE_LIMITS.export.window,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': RATE_LIMITS.export.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': (Date.now() + RATE_LIMITS.export.window * 1000).toString(),
          'Retry-After': RATE_LIMITS.export.window.toString(),
        },
      }
    );
  }
  
  return null;
}
