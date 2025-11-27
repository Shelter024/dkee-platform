import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/export/analytics?days=30
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = session.user.role as string;
    if (!['ADMIN','CEO','MANAGER'].includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const days = Math.min(90, Math.max(1, Number(searchParams.get('days') || 30)));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Group by type counts
    const typeCountsRaw = await (prisma as any).exportLog.groupBy({
      by: ['type'],
      _count: { type: true },
      where: { createdAt: { gte: since } },
    }).catch(()=>[]);
    const typeCounts = typeCountsRaw.map((r: any) => ({ type: r.type, count: r._count.type }));

    // Daily activity last N days
    const logs = await (prisma as any).exportLog.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, type: true },
      orderBy: { createdAt: 'asc' },
    }).catch(()=>[]);
    const daily: Record<string, number> = {};
    logs.forEach((l: any) => {
      const key = l.createdAt.toISOString().slice(0,10);
      daily[key] = (daily[key] || 0) + 1;
    });

    // Top 5 days
    const topDays = Object.entries(daily).sort((a,b) => b[1]-a[1]).slice(0,5).map(([day,count]) => ({ day, count }));

    return NextResponse.json({
      since: since.toISOString().slice(0,10),
      days,
      typeCounts,
      daily,
      topDays,
      total: logs.length,
    });
  } catch (e: any) {
    console.error('GET /api/export/analytics error', e);
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
