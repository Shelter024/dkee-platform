import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { isElevatedRole } from '@/lib/roles';

const schema = z.object({
  invoiceId: z.string(),
  amount: z.number().positive(),
  method: z.enum(['Card', 'Mobile Money', 'Cash', 'Cheque']),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isElevatedRole(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { invoiceId, amount, method, reference } = parsed.data;

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    const newPaid = (invoice.amountPaid || 0) + amount;
    const fullyPaid = newPaid >= invoice.total - 0.0001;

    // Create payment record
    await prisma.payment.create({
      data: {
        invoiceId,
        amount,
        method,
        reference,
        recordedBy: session.user.id,
      },
    });

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newPaid,
        paymentStatus: fullyPaid ? 'PAID' : 'PARTIALLY_PAID',
        paidAt: fullyPaid ? new Date() : invoice.paidAt,
        paymentMethod: method,
        transactionRef: reference || invoice.transactionRef,
      },
    });

    return NextResponse.json({ message: 'Payment recorded', invoice: updated });
  } catch (e) {
    console.error('Record payment error:', e);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
