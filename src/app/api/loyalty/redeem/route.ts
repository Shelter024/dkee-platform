import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/loyalty/redeem
 * Redeem a reward using loyalty points
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rewardId } = await req.json();

    if (!rewardId) {
      return NextResponse.json({ error: 'rewardId is required' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
    });

    if (!reward || !reward.active) {
      return NextResponse.json({ error: 'Reward not available' }, { status: 404 });
    }

    // Check if customer has enough points
    if (customer.loyaltyPoints < reward.pointsCost) {
      return NextResponse.json(
        { error: 'Insufficient points', required: reward.pointsCost, available: customer.loyaltyPoints },
        { status: 400 }
      );
    }

    // Check tier eligibility
    const tierOrder = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
    const customerTierIndex = tierOrder.indexOf(customer.loyaltyTier);
    const rewardTierIndex = tierOrder.indexOf(reward.minimumTier);
    
    if (customerTierIndex < rewardTierIndex) {
      return NextResponse.json(
        { error: `Reward requires ${reward.minimumTier} tier`, currentTier: customer.loyaltyTier },
        { status: 400 }
      );
    }

    // Check usage limit
    if (reward.usageLimit && reward.usageCount >= reward.usageLimit) {
      return NextResponse.json({ error: 'Reward usage limit reached' }, { status: 400 });
    }

    // Create redemption
    const redemption = await prisma.rewardRedemption.create({
      data: {
        rewardId: reward.id,
        customerId: customer.id,
        pointsUsed: reward.pointsCost,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days to use
      },
    });

    // Deduct points and update reward usage
    await prisma.$transaction([
      prisma.customer.update({
        where: { id: customer.id },
        data: {
          loyaltyPoints: { decrement: reward.pointsCost },
        },
      }),
      prisma.reward.update({
        where: { id: reward.id },
        data: {
          usageCount: { increment: 1 },
        },
      }),
      prisma.loyaltyTransaction.create({
        data: {
          customerId: customer.id,
          type: 'REDEEM',
          points: -reward.pointsCost,
          description: `Redeemed: ${reward.name}`,
          referenceId: redemption.id,
          referenceType: 'REDEMPTION',
        },
      }),
    ]);

    return NextResponse.json({
      redemption,
      reward,
      message: 'Reward redeemed successfully',
      remainingPoints: customer.loyaltyPoints - reward.pointsCost,
    });
  } catch (error) {
    console.error('Redeem reward error:', error);
    return NextResponse.json({ error: 'Failed to redeem reward' }, { status: 500 });
  }
}
