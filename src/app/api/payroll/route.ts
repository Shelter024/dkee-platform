import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/payroll
 * Get payroll records
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period');
    const staffId = searchParams.get('staffId');
    const status = searchParams.get('status');

    // Check authorization
    const isStaff = session.user.role !== 'CUSTOMER';
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'HR';

    const where: any = {};
    if (period) where.period = period;
    if (status) where.status = status;

    // Staff can only see their own payroll
    if (!isAdmin) {
      where.staffId = session.user.id;
    } else if (staffId) {
      where.staffId = staffId;
    }

    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        deductionItems: true,
        allowanceItems: true,
      },
      orderBy: { payDate: 'desc' },
    });

    return NextResponse.json({ payrolls });
  } catch (error) {
    console.error('Get payroll error:', error);
    return NextResponse.json({ error: 'Failed to fetch payroll' }, { status: 500 });
  }
}

/**
 * POST /api/payroll
 * Generate payroll for a staff member (HR/Admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'HR')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { staffId, period, payDate, overtime, bonuses, notes } = await req.json();

    if (!staffId || !period || !payDate) {
      return NextResponse.json(
        { error: 'staffId, period, and payDate are required' },
        { status: 400 }
      );
    }

    // Check if payroll already exists
    const existing = await prisma.payroll.findUnique({
      where: {
        staffId_period: {
          staffId,
          period,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Payroll already exists for this period' },
        { status: 400 }
      );
    }

    // Get salary configuration
    const salaryConfig = await prisma.salaryConfiguration.findUnique({
      where: { staffId },
    });

    if (!salaryConfig) {
      return NextResponse.json(
        { error: 'Salary configuration not found for this staff member' },
        { status: 404 }
      );
    }

    // Calculate allowances
    const totalAllowances =
      salaryConfig.allowTransport +
      salaryConfig.allowHousing +
      salaryConfig.allowMeal +
      salaryConfig.allowOther;

    // Calculate gross pay
    const grossPay =
      salaryConfig.baseSalary +
      totalAllowances +
      (overtime || 0) +
      (bonuses || 0);

    // Calculate deductions
    const taxAmount = (grossPay * salaryConfig.taxRate) / 100;
    const ssnit = grossPay * 0.055; // Ghana SSNIT contribution (5.5% employee)
    const totalDeductions = taxAmount + ssnit;

    // Net pay
    const netPay = grossPay - totalDeductions;

    // Generate payroll number
    const count = await prisma.payroll.count();
    const payrollNumber = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Create payroll
    const payroll = await prisma.payroll.create({
      data: {
        payrollNumber,
        staffId,
        period,
        payDate: new Date(payDate),
        baseSalary: salaryConfig.baseSalary,
        allowances: totalAllowances,
        bonuses: bonuses || 0,
        overtime: overtime || 0,
        grossPay,
        deductions: totalDeductions,
        taxAmount,
        ssnit,
        netPay,
        notes,
        processedBy: session.user.id,
        processedAt: new Date(),
      },
    });

    // Create allowance items
    const allowanceItems: any[] = [];
    if (salaryConfig.allowTransport > 0) {
      allowanceItems.push({
        payrollId: payroll.id,
        type: 'TRANSPORT',
        description: 'Transport Allowance',
        amount: salaryConfig.allowTransport,
      });
    }
    if (salaryConfig.allowHousing > 0) {
      allowanceItems.push({
        payrollId: payroll.id,
        type: 'HOUSING',
        description: 'Housing Allowance',
        amount: salaryConfig.allowHousing,
      });
    }
    if (salaryConfig.allowMeal > 0) {
      allowanceItems.push({
        payrollId: payroll.id,
        type: 'MEAL',
        description: 'Meal Allowance',
        amount: salaryConfig.allowMeal,
      });
    }
    if (salaryConfig.allowOther > 0) {
      allowanceItems.push({
        payrollId: payroll.id,
        type: 'OTHER',
        description: 'Other Allowance',
        amount: salaryConfig.allowOther,
      });
    }

    if (allowanceItems.length > 0) {
      await prisma.payrollAllowance.createMany({ data: allowanceItems });
    }

    // Create deduction items
    const deductionItems = [
      {
        payrollId: payroll.id,
        type: 'TAX',
        description: 'Income Tax',
        amount: taxAmount,
      },
      {
        payrollId: payroll.id,
        type: 'SSNIT',
        description: 'SSNIT Contribution (5.5%)',
        amount: ssnit,
      },
    ];

    await prisma.payrollDeduction.createMany({ data: deductionItems });

    const fullPayroll = await prisma.payroll.findUnique({
      where: { id: payroll.id },
      include: {
        deductionItems: true,
        allowanceItems: true,
      },
    });

    return NextResponse.json({
      payroll: fullPayroll,
      message: 'Payroll generated successfully',
    });
  } catch (error) {
    console.error('Generate payroll error:', error);
    return NextResponse.json({ error: 'Failed to generate payroll' }, { status: 500 });
  }
}
