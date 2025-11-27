import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin, isStaff } from '@/lib/roles';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
          select: {
            id: true,
            userId: true,
            address: true,
            company: true,
            user: true,
          },
        },
        automotiveService: {
          include: {
            vehicle: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        files: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    // Check access permissions
    const isOwner = invoice.customer.userId === session.user.id;
    const hasStaffAccess = isAdmin(session.user) || isStaff(session.user);

    if (!isOwner && !hasStaffAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Get invoice error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

// PATCH /api/invoices/[id] - Update invoice (Staff/Admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only staff and admin can update invoices
    if (!isAdmin(session.user) && !isStaff(session.user)) {
      return NextResponse.json(
        { error: 'Forbidden. Only staff and admins can update invoices.' },
        { status: 403 }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      paymentStatus,
      amountPaid,
      paymentMethod,
      transactionRef,
      warrantyMonths,
      discountPercentage,
      discountAmount,
      discountReason,
      notes,
    } = body;

    const updateData: any = {};

    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (amountPaid !== undefined) updateData.amountPaid = parseFloat(amountPaid);
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (transactionRef !== undefined) updateData.transactionRef = transactionRef;
    if (warrantyMonths !== undefined) updateData.warrantyMonths = parseInt(warrantyMonths);
    if (discountPercentage !== undefined) updateData.discountPercentage = parseFloat(discountPercentage);
    if (discountAmount !== undefined) updateData.discountAmount = parseFloat(discountAmount);
    if (discountReason !== undefined) updateData.discountReason = discountReason;
    if (notes !== undefined) updateData.notes = notes;

    // Auto-update paidAt date when payment is completed
    if (paymentStatus === 'PAID' && !invoice.paidAt) {
      updateData.paidAt = new Date();
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        automotiveService: true,
        payments: true,
      },
    });

    return NextResponse.json({
      message: 'Invoice updated successfully',
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices/[id] - Delete invoice (Admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete invoices
    if (!isAdmin(session.user)) {
      return NextResponse.json(
        { error: 'Forbidden. Only admins can delete invoices.' },
        { status: 403 }
      );
    }

    await prisma.invoice.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Invoice deleted successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    console.error('Delete invoice error:', error);
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}
