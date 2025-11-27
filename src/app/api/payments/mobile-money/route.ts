import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/mobile-money
 * Initialize mobile money payment via Paystack
 * Supports MTN, Vodafone, AirtelTigo
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: 10 payment initiations per user per hour
    const rateLimitResult = await rateLimit(`mobile-money:${session.user.id}`, 10, 3600);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many payment attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { invoiceId, provider, mobileNumber } = await req.json();

    // Validate input
    if (!invoiceId || !provider || !mobileNumber) {
      return NextResponse.json(
        { error: 'invoiceId, provider, and mobileNumber are required' },
        { status: 400 }
      );
    }

    // Validate provider
    const validProviders = ['mtn', 'vod', 'tgo'];
    if (!validProviders.includes(provider.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be mtn, vod, or tgo' },
        { status: 400 }
      );
    }

    // Validate Ghana phone number format
    const phoneRegex = /^(0|233)?[2-5][0-9]{8}$/;
    if (!phoneRegex.test(mobileNumber.replace(/\s+/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid Ghana mobile number format' },
        { status: 400 }
      );
    }

    // Load invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: { include: { user: true } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check authorization
    if (session.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: session.user.id },
      });
      if (!customer || customer.id !== invoice.customerId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Calculate outstanding amount
    const outstanding = Math.max(invoice.total - (invoice.amountPaid || 0), 0);
    if (outstanding <= 0) {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 });
    }

    if (!PAYSTACK_SECRET) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }

    // Format phone number for Paystack (must start with country code)
    let formattedPhone = mobileNumber.replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '233' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('233')) {
      formattedPhone = '233' + formattedPhone;
    }

    // Generate unique reference
    const reference = `MM-${invoice.invoiceNumber}-${Date.now()}`;

    // Map provider codes
    const providerMap: { [key: string]: string } = {
      mtn: 'mtn',
      vod: 'vod',
      tgo: 'tgo',
    };

    const payload = {
      email: invoice.customer.user.email,
      amount: Math.round(outstanding * 100), // Amount in pesewas
      currency: 'GHS',
      reference,
      mobile_money: {
        phone: formattedPhone,
        provider: providerMap[provider.toLowerCase()],
      },
      metadata: {
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        invoiceNumber: invoice.invoiceNumber,
        paymentMethod: `MOBILE_MONEY_${provider.toUpperCase()}`,
      },
      callback_url: `${APP_URL}/dashboard/customer/invoices?ref=${encodeURIComponent(
        invoice.invoiceNumber
      )}`,
    };

    // Initialize Paystack mobile money transaction
    const res = await fetch('https://api.paystack.co/charge', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data?.data) {
      console.error('Paystack mobile money error:', data);
      return NextResponse.json(
        { error: data?.message || 'Failed to initialize mobile money payment' },
        { status: 502 }
      );
    }

    // Create payment transaction record
    const mobileMoneyProvider =
      provider.toUpperCase() === 'MTN'
        ? 'MTN'
        : provider.toUpperCase() === 'VOD'
        ? 'VODAFONE'
        : 'AIRTELTIGO';

    const paymentMethodEnum =
      provider.toUpperCase() === 'MTN'
        ? 'MOBILE_MONEY_MTN'
        : provider.toUpperCase() === 'VOD'
        ? 'MOBILE_MONEY_VODAFONE'
        : 'MOBILE_MONEY_AIRTELTIGO';

    await prisma.paymentTransaction.create({
      data: {
        reference,
        amount: outstanding,
        currency: 'GHS',
        channel: 'MOBILE_MONEY',
        paymentMethod: paymentMethodEnum,
        mobileMoneyNumber: formattedPhone,
        provider: mobileMoneyProvider,
        status: data.data.status || 'pending',
        gatewayResponse: data,
        invoiceId: invoice.id,
        customerId: invoice.customerId,
      },
    });

    // Update invoice with transaction reference
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { transactionRef: reference },
    });

    // Return response based on status
    if (data.data.status === 'send_otp') {
      return NextResponse.json({
        status: 'pending_otp',
        message: 'Please approve the payment on your phone',
        reference,
        display_text: data.data.display_text,
      });
    }

    if (data.data.status === 'pay_offline') {
      return NextResponse.json({
        status: 'pending_ussd',
        message: 'Please dial the USSD code on your phone',
        reference,
        ussd_code: data.data.ussd_code,
        display_text: data.data.display_text,
      });
    }

    return NextResponse.json({
      status: data.data.status,
      message: 'Mobile money payment initiated',
      reference,
      data: data.data,
    });
  } catch (error) {
    console.error('Mobile money payment error:', error);
    return NextResponse.json(
      { error: 'Failed to process mobile money payment' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/mobile-money?reference=xxx
 * Check mobile money payment status
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'reference is required' }, { status: 400 });
    }

    // Get transaction from database
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { reference },
      include: {
        invoice: true,
        customer: { include: { user: true } },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Check authorization
    if (session.user.role === 'CUSTOMER') {
      if (transaction.customer.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // If already successful, return cached status
    if (transaction.status === 'success') {
      return NextResponse.json({
        status: 'success',
        reference: transaction.reference,
        amount: transaction.amount,
        paidAt: transaction.paidAt,
      });
    }

    // Check status with Paystack
    if (!PAYSTACK_SECRET) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }

    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error('Paystack verify error:', data);
      return NextResponse.json(
        { error: 'Failed to verify payment status' },
        { status: 502 }
      );
    }

    // Update transaction status
    const newStatus = data.data.status === 'success' ? 'success' : data.data.status;
    const paidAt = data.data.status === 'success' ? new Date() : null;

    await prisma.paymentTransaction.update({
      where: { reference },
      data: {
        status: newStatus,
        gatewayResponse: data,
        paidAt,
      },
    });

    // If payment successful, update invoice
    if (data.data.status === 'success' && transaction.invoice) {
      const newAmountPaid = transaction.invoice.amountPaid + transaction.amount;
      const newPaymentStatus =
        newAmountPaid >= transaction.invoice.total ? 'PAID' : 'PARTIALLY_PAID';

      await prisma.invoice.update({
        where: { id: transaction.invoiceId! },
        data: {
          amountPaid: newAmountPaid,
          paymentStatus: newPaymentStatus,
          paidAt: newPaymentStatus === 'PAID' ? new Date() : undefined,
          paymentMethod: transaction.paymentMethod,
        },
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          invoiceId: transaction.invoiceId!,
          amount: transaction.amount,
          method: transaction.paymentMethod || 'Mobile Money',
          reference: transaction.reference,
          notes: `Mobile Money payment via ${transaction.provider}`,
        },
      });
    }

    return NextResponse.json({
      status: data.data.status,
      reference: transaction.reference,
      amount: transaction.amount,
      paidAt: data.data.status === 'success' ? new Date() : null,
      message: data.data.gateway_response,
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}
