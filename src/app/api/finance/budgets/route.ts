import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// GET - Fetch budgets
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const fiscalYear = searchParams.get('fiscalYear');
    const status = searchParams.get('status');

    const where: any = {};
    if (department) where.department = department;
    if (fiscalYear) where.fiscalYear = parseInt(fiscalYear);
    if (status) where.status = status;

    const budgets = await prisma.budget.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ budgets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create budget
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = await prisma.staffPermission.findUnique({
      where: { userId: session.user.id },
    });

    if (!permissions?.canManageBudgets && !['CEO', 'ADMIN', 'FINANCE_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await req.json();
    const { department, category, allocatedAmount, fiscalYear, fiscalQuarter, fiscalMonth, description, alertThresholds } = body;

    const count = await prisma.budget.count();
    const budgetCode = `BDG-${fiscalYear}-${String(count + 1).padStart(4, '0')}`;

    const budget = await prisma.budget.create({
      data: {
        budgetCode,
        name: `${department} - ${category} Budget`,
        department,
        category,
        allocatedAmount: parseFloat(allocatedAmount),
        spentAmount: 0,
        remainingAmount: parseFloat(allocatedAmount),
        fiscalYear: parseInt(fiscalYear),
        fiscalQuarter: fiscalQuarter ? parseInt(fiscalQuarter) : null,
        fiscalMonth: fiscalMonth ? parseInt(fiscalMonth) : null,
        status: 'ACTIVE',
        description,
        alerts: alertThresholds || { warning: 75, critical: 90, exhausted: 100 },
        createdById: session.user.id,
        createdByName: session.user.name || 'Unknown',
      },
    });

    return NextResponse.json({ message: 'Budget created successfully', budget });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
