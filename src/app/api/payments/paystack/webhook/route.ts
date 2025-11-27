import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    const signature = req.headers.get('x-paystack-signature') || '';

    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(raw).digest('hex');
    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(raw);
    if (event?.event === 'charge.success') {
      const data = event.data;
      const amount = (data.amount || 0) / 100;
      const reference = data.reference;
      const metadata = data.metadata || {};
      const invoiceId = metadata.invoiceId as string | undefined;

      if (invoiceId) {
        const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
        if (invoice) {
          const newPaid = (invoice.amountPaid || 0) + amount;
          const isPaidFull = newPaid >= invoice.total - 0.0001;

          await prisma.payment.create({
            data: {
              invoiceId: invoice.id,
              amount,
              method: 'Paystack',
              reference,
            },
          });

          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              amountPaid: newPaid,
              paymentStatus: isPaidFull ? 'PAID' : 'PARTIALLY_PAID',
              paidAt: isPaidFull ? new Date() : invoice.paidAt,
              paymentMethod: 'Paystack',
              transactionRef: reference,
            },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
