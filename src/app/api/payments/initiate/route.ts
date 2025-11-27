import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || '';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Rate limiting: 10 payment initiations per user per hour
    const rateLimitResult = await rateLimit(`payment:${session.user.id}`, 10, 3600);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many payment attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { invoiceId } = await req.json();
    if (!invoiceId) return NextResponse.json({ error: 'invoiceId required' }, { status: 400 });

    // Load invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: { include: { user: true } },
      },
    });
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    // If customer, ensure ownership
    if (session.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({ where: { userId: session.user.id } });
      if (!customer || customer.id !== invoice.customerId)
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const outstanding = Math.max(invoice.total - (invoice.amountPaid || 0), 0);
    if (outstanding <= 0) return NextResponse.json({ error: 'Nothing to pay' }, { status: 400 });

    if (!PAYSTACK_SECRET)
      return NextResponse.json({ error: 'Gateway not configured' }, { status: 500 });

    const payload = {
      email: invoice.customer.user.email,
      amount: Math.round(outstanding * 100),
      currency: 'GHS',
      reference: `INV-${invoice.invoiceNumber}-${Date.now()}`,
      metadata: {
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        invoiceNumber: invoice.invoiceNumber,
      },
      callback_url: `${APP_URL}/dashboard/customer/invoices?ref=${encodeURIComponent(
        invoice.invoiceNumber
      )}`,
    };

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data?.data?.authorization_url) {
      console.error('Paystack init error:', data);
      return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 502 });
    }

    // Store reference for traceability
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { transactionRef: data.data.reference },
    });

    return NextResponse.json({
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (error) {
    console.error('Payment initiate error:', error);
    return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 });
  }
}
