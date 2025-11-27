import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch KPIs
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const fiscalYear = searchParams.get('fiscalYear');
    const status = searchParams.get('status');

    const where: any = {};
    if (category) where.category = category;
    if (fiscalYear) where.fiscalYear = parseInt(fiscalYear);
    if (status) where.status = status;

    const kpis = await prisma.kPI.findMany({
      where,
      orderBy: [{ fiscalYear: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });

    return NextResponse.json({ kpis });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create KPI
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = await prisma.staffPermission.findUnique({
      where: { userId: session.user.id },
    });

    if (!permissions?.canSetKPIs && !['CEO', 'ADMIN', 'FINANCE_MANAGER', 'OPERATIONS_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await req.json();
    const { name, category, targetValue, unit, fiscalYear, fiscalQuarter, fiscalMonth, department, ownerId, ownerName, description } = body;

    const count = await prisma.kPI.count();
    const kpiCode = `KPI-${fiscalYear}-${String(count + 1).padStart(4, '0')}`;

    const kpi = await prisma.kPI.create({
      data: {
        kpiCode,
        name,
        category,
        targetValue: parseFloat(targetValue),
        currentValue: 0,
        unit,
        fiscalYear: parseInt(fiscalYear),
        fiscalQuarter: fiscalQuarter ? parseInt(fiscalQuarter) : null,
        fiscalMonth: fiscalMonth ? parseInt(fiscalMonth) : null,
        department,
        ownerId,
        ownerName,
        status: 'ACTIVE',
        progress: 0,
        description,
        alertThresholds: { warning: 50, success: 100 },
      },
    });

    return NextResponse.json({ message: 'KPI created', kpi });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
