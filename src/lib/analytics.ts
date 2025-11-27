/**
 * Analytics utilities for page view tracking
 */

import { prisma } from './prisma';
import { headers } from 'next/headers';

interface TrackPageViewOptions {
  path: string;
  slug?: string;
  type?: 'blog' | 'page' | 'home' | 'automotive' | 'property' | 'contact' | 'other';
  userId?: string;
}

/**
 * Track a page view
 * Call this in server components or API routes
 */
export async function trackPageView(options: TrackPageViewOptions): Promise<void> {
  try {
    const headersList = headers();
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0].trim() || 
                     headersList.get('x-real-ip') || 
                     'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';
    const referer = headersList.get('referer') || undefined;

    // Generate or get session ID from cookie
    // For simplicity, use IP + UserAgent hash as session
    const sessionId = `${ipAddress}-${hashCode(userAgent)}`;

    await prisma.pageView.create({
      data: {
        path: options.path,
        slug: options.slug,
        type: options.type,
        userId: options.userId,
        sessionId,
        ipAddress,
        userAgent,
        referer,
      },
    });
  } catch (error) {
    // Don't throw - analytics should not break the application
    console.error('[ANALYTICS] Failed to track page view:', error);
  }
}

/**
 * Get page view stats for a specific path or slug
 */
export async function getPageViewStats(pathOrSlug: string) {
  const stats = await prisma.pageView.groupBy({
    by: ['path'],
    where: {
      OR: [
        { path: pathOrSlug },
        { slug: pathOrSlug },
      ],
    },
    _count: { id: true },
  });

  return { totalViews: stats.reduce((sum: number, s: any) => sum + s._count.id, 0) };
}

/**
 * Get top viewed pages
 */
export async function getTopPages(limit: number = 10) {
  const views = await prisma.pageView.groupBy({
    by: ['path', 'slug', 'type'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  });

  return views.map((v: any) => ({
    path: v.path,
    slug: v.slug,
    type: v.type,
    views: v._count.id,
  }));
}

/**
 * Get analytics summary for date range
 */
export async function getAnalyticsSummary(startDate: Date, endDate: Date) {
  const totalViews = await prisma.pageView.count({
    where: { createdAt: { gte: startDate, lte: endDate } },
  });

  const uniqueSessions = await prisma.pageView.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    select: { sessionId: true },
    distinct: ['sessionId'],
  });

  const blogViews = await prisma.pageView.count({
    where: { type: 'blog', createdAt: { gte: startDate, lte: endDate } },
  });

  const topPages = await getTopPages(5);

  return {
    totalViews,
    uniqueVisitors: uniqueSessions.length,
    blogViews,
    topPages,
  };
}

/**
 * Simple hash function for session ID generation
 */
function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
