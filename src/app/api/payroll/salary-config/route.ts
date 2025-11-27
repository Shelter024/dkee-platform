import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/payroll/salary-config
 * Get salary configuration for staff
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId');

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'HR';
    const targetStaffId = isAdmin && staffId ? staffId : session.user.id;

    const config = await prisma.salaryConfiguration.findUnique({
      where: { staffId: targetStaffId },
    });

    if (!config) {
      return NextResponse.json({ error: 'Salary configuration not found' }, { status: 404 });
    }

    // Hide sensitive info from non-admin
    if (!isAdmin) {
      const { bankName, accountNumber, taxNumber, ssnitNumber, ...safeConfig } = config;
      return NextResponse.json({ config: safeConfig });
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Get salary config error:', error);
    return NextResponse.json({ error: 'Failed to fetch salary configuration' }, { status: 500 });
  }
}

/**
 * POST /api/payroll/salary-config
 * Create or update salary configuration (HR/Admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'HR')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      staffId,
      baseSalary,
      paymentFrequency,
      bankName,
      accountNumber,
      taxNumber,
      ssnitNumber,
      taxRate,
      allowTransport,
      allowHousing,
      allowMeal,
      allowOther,
      effectiveFrom,
    } = body;

    if (!staffId || !baseSalary) {
      return NextResponse.json(
        { error: 'staffId and baseSalary are required' },
        { status: 400 }
      );
    }

    const config = await prisma.salaryConfiguration.upsert({
      where: { staffId },
      update: {
        baseSalary,
        paymentFrequency: paymentFrequency || 'MONTHLY',
        bankName,
        accountNumber,
        taxNumber,
        ssnitNumber,
        taxRate: taxRate || 0,
        allowTransport: allowTransport || 0,
        allowHousing: allowHousing || 0,
        allowMeal: allowMeal || 0,
        allowOther: allowOther || 0,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      },
      create: {
        staffId,
        baseSalary,
        paymentFrequency: paymentFrequency || 'MONTHLY',
        bankName,
        accountNumber,
        taxNumber,
        ssnitNumber,
        taxRate: taxRate || 0,
        allowTransport: allowTransport || 0,
        allowHousing: allowHousing || 0,
        allowMeal: allowMeal || 0,
        allowOther: allowOther || 0,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      },
    });

    return NextResponse.json({
      config,
      message: 'Salary configuration saved successfully',
    });
  } catch (error) {
    console.error('Save salary config error:', error);
    return NextResponse.json({ error: 'Failed to save salary configuration' }, { status: 500 });
  }
}
