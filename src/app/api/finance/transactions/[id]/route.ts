import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await req.json();
    const { action } = body;

    const transaction = await prisma.financialTransaction.findUnique({
      where: { id: params.id },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Handle approval
    if (action === 'APPROVE') {
      // Check permission
      const permissions = await prisma.staffPermission.findUnique({
        where: { userId: session.user.id },
      });

      if (!permissions?.canApproveTransactions && !['CEO', 'ADMIN'].includes(userRole)) {
        return NextResponse.json(
          { error: 'You do not have permission to approve transactions' },
          { status: 403 }
        );
      }

      const updatedTransaction = await prisma.financialTransaction.update({
        where: { id: params.id },
        data: {
          status: 'APPROVED',
          approvedById: session.user.id,
          approvedAt: new Date(),
        },
      });

      // Notify requester
      await sendEmail({
        to: session.user.email!,
        subject: `Transaction Approved: ${transaction.transactionNumber}`,
        html: `
          <h2>Transaction Approved</h2>
          <p>Dear ${session.user.name},</p>
          <p>Your transaction has been approved.</p>
          <h3>Transaction Details:</h3>
          <ul>
            <li><strong>Transaction Number:</strong> ${transaction.transactionNumber}</li>
            <li><strong>Amount:</strong> ${transaction.currency} ${transaction.amount.toLocaleString()}</li>
            <li><strong>Description:</strong> ${transaction.description}</li>
          </ul>
        `,
      });

      return NextResponse.json({
        message: 'Transaction approved successfully',
        transaction: updatedTransaction,
      });
    }

    // Handle rejection
    if (action === 'REJECT') {
      const { rejectionReason } = body;

      const updatedTransaction = await prisma.financialTransaction.update({
        where: { id: params.id },
        data: {
          status: 'REJECTED',
          approvedById: session.user.id,
          approvedAt: new Date(),
          notes: rejectionReason
            ? `${transaction.notes || ''}\n\nREJECTION REASON: ${rejectionReason}`
            : transaction.notes,
        },
      });

      // Notify requester
      await sendEmail({
        to: session.user.email!,
        subject: `Transaction Rejected: ${transaction.transactionNumber}`,
        html: `
          <h2>Transaction Rejected</h2>
          <p>Dear ${session.user.name},</p>
          <p>Your transaction has been rejected.</p>
          <h3>Transaction Details:</h3>
          <ul>
            <li><strong>Transaction Number:</strong> ${transaction.transactionNumber}</li>
            <li><strong>Amount:</strong> ${transaction.currency} ${transaction.amount.toLocaleString()}</li>
            <li><strong>Reason:</strong> ${rejectionReason || 'Not provided'}</li>
          </ul>
        `,
      });

      return NextResponse.json({
        message: 'Transaction rejected',
        transaction: updatedTransaction,
      });
    }

    // Handle posting (after approval)
    if (action === 'POST') {
      if (transaction.status !== 'APPROVED') {
        return NextResponse.json(
          { error: 'Only approved transactions can be posted' },
          { status: 400 }
        );
      }

      const permissions = await prisma.staffPermission.findUnique({
        where: { userId: session.user.id },
      });

      if (!permissions?.canPostTransactions && !['CEO', 'ADMIN'].includes(userRole)) {
        return NextResponse.json(
          { error: 'You do not have permission to post transactions' },
          { status: 403 }
        );
      }

      const updatedTransaction = await prisma.financialTransaction.update({
        where: { id: params.id },
        data: {
          status: 'POSTED',
          postedById: session.user.id,
          postedAt: new Date(),
        },
      });

      return NextResponse.json({
        message: 'Transaction posted successfully',
        transaction: updatedTransaction,
      });
    }

    // Handle reconciliation
    if (action === 'RECONCILE') {
      const permissions = await prisma.staffPermission.findUnique({
        where: { userId: session.user.id },
      });

      if (!permissions?.canReconcileAccounts && !['CEO', 'ADMIN'].includes(userRole)) {
        return NextResponse.json(
          { error: 'You do not have permission to reconcile transactions' },
          { status: 403 }
        );
      }

      const updatedTransaction = await prisma.financialTransaction.update({
        where: { id: params.id },
        data: {
          isReconciled: true,
          reconciledAt: new Date(),
          reconciledById: session.user.id,
        },
      });

      return NextResponse.json({
        message: 'Transaction reconciled successfully',
        transaction: updatedTransaction,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction', details: error.message },
      { status: 500 }
    );
  }
}
