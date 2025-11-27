import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch audit logs
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['CEO', 'ADMIN', 'AUDITOR'].includes(session.user.role)) {
      const permissions = await prisma.staffPermission.findUnique({
        where: { userId: session.user.id },
      });

      if (!permissions?.canAccessAllRecords) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }

    const { searchParams } = new URL(req.url);
    const eventType = searchParams.get('eventType');
    const riskLevel = searchParams.get('riskLevel');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (eventType) where.eventType = eventType;
    if (riskLevel) where.riskLevel = riskLevel;
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const logs = await prisma.systemAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
