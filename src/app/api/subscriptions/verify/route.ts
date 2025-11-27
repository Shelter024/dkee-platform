/**
 * Subscription Payment Verification
 * Verify Paystack payment and activate subscription
 */

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/subscriptions/verify?reference=xxx
 * Verify payment and activate subscription
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Missing payment reference' }, { status: 400 });
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    // Verify payment with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyData.status || verifyData.data.status !== 'success') {
      return NextResponse.json(
        { error: 'Payment verification failed', details: verifyData },
        { status: 400 }
      );
    }

    const { metadata, amount, currency, paid_at } = verifyData.data;
    const { userId, plan, interval } = metadata;

    // Verify the user matches
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Invalid payment user' }, { status: 403 });
    }

    // Calculate subscription end date
    const startDate = new Date(paid_at);
    const endDate = new Date(startDate);
    if (interval === 'MONTHLY') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (interval === 'YEARLY') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Cancel any existing active subscriptions
    await prisma.subscription.updateMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    // Create new subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        plan,
        interval,
        status: 'ACTIVE',
        startDate,
        endDate,
        amount: amount / 100, // Convert from kobo/pesewas
        features: getFeaturesByPlan(plan),
        autoRenew: true,
        paymentMethod: 'PAYSTACK',
        lastPayment: startDate,
        nextBilling: endDate,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        title: 'Subscription Activated',
        message: `Your ${plan} subscription has been activated successfully!`,
        type: 'SUCCESS',
        link: '/dashboard/customer/subscription',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription activated successfully',
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        interval: subscription.interval,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        features: subscription.features,
      },
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

// Helper function to get features by plan
function getFeaturesByPlan(plan: string): string[] {
  const features: Record<string, string[]> = {
    FREE: [],
    BASIC: ['BASIC_ANALYTICS', 'EMAIL_SUPPORT'],
    PREMIUM: [
      'BASIC_ANALYTICS',
      'EMAIL_SUPPORT',
      'OIL_SERVICE_REMINDER',
      'VEHICLE_TRACKING',
      'PRIORITY_SUPPORT',
      'ADVANCED_ANALYTICS',
    ],
    ENTERPRISE: [
      'BASIC_ANALYTICS',
      'EMAIL_SUPPORT',
      'OIL_SERVICE_REMINDER',
      'VEHICLE_TRACKING',
      'PRIORITY_SUPPORT',
      'ADVANCED_ANALYTICS',
      'DEDICATED_SUPPORT',
      'API_ACCESS',
      'CUSTOM_INTEGRATIONS',
      'WHITE_LABEL',
    ],
  };

  return features[plan] || [];
}
