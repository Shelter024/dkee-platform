import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/loyalty/rewards
 * Get available rewards for redemption
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const rewards = await prisma.reward.findMany({
      where: {
        active: true,
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } },
        ],
      },
      orderBy: { pointsCost: 'asc' },
    });

    // Filter by tier and affordability
    const availableRewards = rewards.filter((reward) => {
      const tierOrder = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
      const customerTierIndex = tierOrder.indexOf(customer.loyaltyTier);
      const rewardTierIndex = tierOrder.indexOf(reward.minimumTier);
      
      return customerTierIndex >= rewardTierIndex && customer.loyaltyPoints >= reward.pointsCost;
    });

    const lockedRewards = rewards.filter((reward) => {
      const tierOrder = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
      const customerTierIndex = tierOrder.indexOf(customer.loyaltyTier);
      const rewardTierIndex = tierOrder.indexOf(reward.minimumTier);
      
      return customerTierIndex < rewardTierIndex || customer.loyaltyPoints < reward.pointsCost;
    });

    return NextResponse.json({
      availableRewards,
      lockedRewards,
      customerPoints: customer.loyaltyPoints,
      customerTier: customer.loyaltyTier,
    });
  } catch (error) {
    console.error('Get rewards error:', error);
    return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
  }
}

/**
 * POST /api/loyalty/rewards
 * Create a new reward (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      description,
      type,
      pointsCost,
      discountPercentage,
      discountAmount,
      minimumTier,
      validFrom,
      validUntil,
      usageLimit,
      termsConditions,
    } = body;

    if (!name || !description || !type || !pointsCost) {
      return NextResponse.json(
        { error: 'name, description, type, and pointsCost are required' },
        { status: 400 }
      );
    }

    const reward = await prisma.reward.create({
      data: {
        name,
        description,
        type,
        pointsCost,
        discountPercentage,
        discountAmount,
        minimumTier: minimumTier || 'BRONZE',
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        usageLimit,
        termsConditions,
      },
    });

    return NextResponse.json({ reward });
  } catch (error) {
    console.error('Create reward error:', error);
    return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 });
  }
}
