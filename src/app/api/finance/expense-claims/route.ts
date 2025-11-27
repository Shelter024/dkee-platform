import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// GET - Fetch expense claims
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const canViewAll = ['CEO', 'ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT'].includes(session.user.role);

    const where: any = {};
    if (!canViewAll) where.claimantId = session.user.id;
    if (status) where.status = status;

    const claims = await prisma.expenseClaim.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ claims });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create expense claim
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { department, items, receipts, description } = body;

    const totalAmount = items.reduce((sum: number, item: any) => sum + parseFloat(item.amount), 0);
    const count = await prisma.expenseClaim.count();
    const claimNumber = `EXP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

    const claim = await prisma.expenseClaim.create({
      data: {
        claimNumber,
        claimantId: session.user.id,
        claimantName: session.user.name || 'Unknown',
        department,
        items,
        totalAmount,
        claimDate: new Date(),
        receipts: receipts || [],
        status: 'PENDING',
        description: description || '',
      },
    });

    // Notify approvers
    const approvers = await prisma.user.findMany({
      where: { role: { in: ['CEO', 'ADMIN', 'FINANCE_MANAGER'] } },
      select: { email: true, name: true },
    });

    for (const approver of approvers) {
      await sendEmail({
        to: approver.email,
        subject: `Expense Claim Approval Required: ${claimNumber}`,
        html: `<h2>New Expense Claim</h2><p>Amount: $${totalAmount.toLocaleString()}</p>`,
      });
    }

    return NextResponse.json({ message: 'Expense claim submitted', claim });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
