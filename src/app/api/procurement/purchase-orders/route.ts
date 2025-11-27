import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// GET - Fetch purchase orders
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status) where.status = status;

    const pos = await prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ orders: pos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create purchase order
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = await prisma.staffPermission.findUnique({
      where: { userId: session.user.id },
    });

    if (!permissions?.canCreatePurchaseOrders && !['CEO', 'ADMIN', 'OPERATIONS_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await req.json();
    const { supplierName, supplierId, items, subtotal, tax, shipping, expectedDate, notes } = body;

    const count = await prisma.purchaseOrder.count();
    const poNumber = `PO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

    const total = parseFloat(subtotal) + parseFloat(tax || 0) + parseFloat(shipping || 0);

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierName,
        supplierId,
        subtotal: parseFloat(subtotal),
        tax: parseFloat(tax || 0),
        shipping: parseFloat(shipping || 0),
        total,
        status: 'PENDING',
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes,
        createdBy: session.user.id,
      },
    });

    // Notify approvers
    const approvers = await prisma.user.findMany({
      where: { role: { in: ['CEO', 'ADMIN', 'OPERATIONS_MANAGER'] } },
      select: { email: true, name: true },
    });

    for (const approver of approvers) {
      await sendEmail({
        to: approver.email,
        subject: `Purchase Order Approval Required: ${poNumber}`,
        html: `<h2>New Purchase Order</h2><p>${supplierName} - GHS ${total.toLocaleString()}</p>`,
      });
    }

    return NextResponse.json({ message: 'Purchase order created', po });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
