import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SUBSCRIPTION_PLANS, YEARLY_PLANS } from '@/lib/subscriptions';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId, interval } = await req.json();

    const plans = interval === 'YEARLY' ? YEARLY_PLANS : SUBSCRIPTION_PLANS;
    const plan = plans.find((p) => p.id === planId);

    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    if (plan.id === 'FREE') {
      return NextResponse.json({ error: 'Cannot subscribe to free plan' }, { status: 400 });
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (interval === 'YEARLY') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Get features for this plan
    const features = plan.features;

    // If free plan or no payment needed
    if (plan.price === 0) {
      const subscription = await prisma.subscription.create({
        data: {
          userId: session.user.id,
          plan: plan.id as any,
          status: 'ACTIVE',
          interval,
          startDate,
          endDate,
          amount: 0,
          features,
        },
      });

      return NextResponse.json({ subscription });
    }

    // Initialize Paystack payment
    if (!PAYSTACK_SECRET) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const payload = {
      email: user.email,
      amount: Math.round(plan.price * 100), // Convert to pesewas
      currency: 'GHS',
      reference: `SUB-${plan.id}-${Date.now()}`,
      metadata: {
        userId: session.user.id,
        planId: plan.id,
        interval,
        features: JSON.stringify(features),
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscriptions?status=success`,
    };

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data?.data?.authorization_url) {
      console.error('Paystack error:', data);
      return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 502 });
    }

    return NextResponse.json({
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
        endDate: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ subscription: subscription || null });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
