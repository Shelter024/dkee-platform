/**
 * Subscription Payment Routes
 * Handle subscription checkout and payment processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface SubscriptionPricing {
  plan: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  interval: 'MONTHLY' | 'YEARLY';
  amount: number;
  currency: string;
}

// Subscription pricing (in GHS - Ghana Cedis)
const SUBSCRIPTION_PRICING: Record<string, SubscriptionPricing> = {
  'BASIC_MONTHLY': {
    plan: 'BASIC',
    interval: 'MONTHLY',
    amount: 50,
    currency: 'GHS',
  },
  'BASIC_YEARLY': {
    plan: 'BASIC',
    interval: 'YEARLY',
    amount: 500, // ~17% discount
    currency: 'GHS',
  },
  'PREMIUM_MONTHLY': {
    plan: 'PREMIUM',
    interval: 'MONTHLY',
    amount: 150,
    currency: 'GHS',
  },
  'PREMIUM_YEARLY': {
    plan: 'PREMIUM',
    interval: 'YEARLY',
    amount: 1500, // ~17% discount
    currency: 'GHS',
  },
  'ENTERPRISE_MONTHLY': {
    plan: 'ENTERPRISE',
    interval: 'MONTHLY',
    amount: 300,
    currency: 'GHS',
  },
  'ENTERPRISE_YEARLY': {
    plan: 'ENTERPRISE',
    interval: 'YEARLY',
    amount: 3000, // ~17% discount
    currency: 'GHS',
  },
};

/**
 * GET /api/subscriptions/pricing
 * Get subscription pricing information
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's current subscription
    const currentSubscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
      },
      orderBy: {
        endDate: 'desc',
      },
    });

    return NextResponse.json({
      pricing: SUBSCRIPTION_PRICING,
      currentSubscription: currentSubscription
        ? {
            plan: currentSubscription.plan,
            status: currentSubscription.status,
            interval: currentSubscription.interval,
            endDate: currentSubscription.endDate,
            features: currentSubscription.features,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching subscription pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription pricing' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscriptions/checkout
 * Create a checkout session for subscription
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { plan, interval } = body;

    if (!plan || !interval) {
      return NextResponse.json(
        { error: 'Missing required fields: plan, interval' },
        { status: 400 }
      );
    }

    const pricingKey = `${plan}_${interval}`;
    const pricing = SUBSCRIPTION_PRICING[pricingKey];

    if (!pricing) {
      return NextResponse.json({ error: 'Invalid subscription plan' }, { status: 400 });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Initialize Paystack payment
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecretKey) {
      // For development/testing, create subscription directly
      const endDate = new Date();
      if (interval === 'MONTHLY') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const subscription = await prisma.subscription.create({
        data: {
          userId: session.user.id,
          plan: pricing.plan,
          interval: pricing.interval,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate,
          amount: pricing.amount,
          features: getFeaturesByPlan(pricing.plan),
          autoRenew: true,
          paymentMethod: 'TEST',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Test subscription created (no payment gateway configured)',
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          interval: subscription.interval,
          endDate: subscription.endDate,
        },
      });
    }

    // Initialize Paystack transaction
    const reference = `sub_${Date.now()}_${session.user.id}`;
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: pricing.amount * 100, // Paystack expects amount in kobo/pesewas
        currency: pricing.currency,
        reference,
        metadata: {
          userId: session.user.id,
          plan: pricing.plan,
          interval: pricing.interval,
          custom_fields: [
            {
              display_name: 'Subscription Plan',
              variable_name: 'subscription_plan',
              value: `${pricing.plan} (${pricing.interval})`,
            },
          ],
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/customer/subscription/callback`,
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      console.error('Paystack initialization failed:', paystackData);
      return NextResponse.json(
        { error: 'Failed to initialize payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
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
