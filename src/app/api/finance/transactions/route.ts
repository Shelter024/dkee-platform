import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { sendSMS } from '@/lib/sms';

// GET - Fetch financial transactions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    const isFinanceRole = ['ACCOUNTANT', 'FINANCE_MANAGER', 'CEO', 'ADMIN'].includes(userRole);

    if (!isFinanceRole) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const fiscalYear = searchParams.get('fiscalYear');
    const fiscalMonth = searchParams.get('fiscalMonth');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};

    if (status) where.status = status;
    if (type) where.transactionType = type;
    if (fiscalYear) where.fiscalYear = parseInt(fiscalYear);
    if (fiscalMonth) where.fiscalMonth = parseInt(fiscalMonth);

    const transactions = await prisma.financialTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create financial transaction
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    const isFinanceRole = ['ACCOUNTANT', 'FINANCE_MANAGER', 'CEO', 'ADMIN'].includes(userRole);

    if (!isFinanceRole) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check permission
    const permissions = await prisma.staffPermission.findUnique({
      where: { userId: session.user.id },
    });

    if (!permissions?.canApproveTransactions && !['CEO', 'ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'You do not have permission to create transactions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      transactionType,
      amount,
      currency,
      description,
      accountCode,
      category,
      department,
      fiscalYear,
      fiscalMonth,
      attachments,
      notes,
    } = body;

    // Generate transaction number
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const count = await prisma.financialTransaction.count({
      where: {
        transactionNumber: {
          startsWith: `TXN-${year}${month}`,
        },
      },
    });
    const transactionNumber = `TXN-${year}${month}-${String(count + 1).padStart(4, '0')}`;

    const transaction = await prisma.financialTransaction.create({
      data: {
        transactionNumber,
        transactionType,
        amount: parseFloat(amount),
        currency: currency || 'NGN',
        description,
        accountCode,
        category,
        fiscalYear: fiscalYear || currentDate.getFullYear(),
        fiscalMonth: fiscalMonth || currentDate.getMonth() + 1,
        status: 'PENDING',
        requestedById: session.user.id,
        requestedByName: session.user.name || 'Unknown',
        attachments: attachments || [],
        notes,
      },
    });

    // Notify finance manager for approval
    const financeManagers = await prisma.user.findMany({
      where: {
        role: {
          in: ['FINANCE_MANAGER', 'CEO', 'ADMIN'],
        },
      },
      select: {
        email: true,
        phone: true,
        name: true,
      },
    });

    for (const manager of financeManagers) {
      // Send email
      await sendEmail({
        to: manager.email,
        subject: `New Transaction Approval Required: ${transactionNumber}`,
        html: `
          <h2>Transaction Approval Required</h2>
          <p>Dear ${manager.name},</p>
          <p>A new financial transaction has been submitted and requires your approval.</p>
          <h3>Transaction Details:</h3>
          <ul>
            <li><strong>Transaction Number:</strong> ${transactionNumber}</li>
            <li><strong>Type:</strong> ${transactionType}</li>
            <li><strong>Amount:</strong> ${currency} ${amount.toLocaleString()}</li>
            <li><strong>Description:</strong> ${description}</li>
            <li><strong>Requested By:</strong> ${session.user.name}</li>
          </ul>
          <p>Please review and approve/reject this transaction in the Finance Dashboard.</p>
        `,
      });

      // Send SMS if phone is available
      if (manager.phone) {
        await sendSMS(
          manager.phone,
          `New transaction ${transactionNumber} (${currency} ${amount.toLocaleString()}) awaiting your approval. Login to review.`
        );
      }
    }

    return NextResponse.json({
      message: 'Transaction created successfully',
      transaction,
    });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction', details: error.message },
      { status: 500 }
    );
  }
}
