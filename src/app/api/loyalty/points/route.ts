import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

/**
 * GET /api/loyalty/points
 * Get customer loyalty points and tier information
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
      include: {
        referrals: {
          include: { user: { select: { name: true, email: true } } },
        },
        loyaltyTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        redeemedRewards: {
          include: { reward: true },
          orderBy: { usedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Calculate tier benefits
    const tierBenefits = getTierBenefits(customer.loyaltyTier);
    const nextTier = getNextTier(customer.loyaltyTier);
    const pointsToNextTier = nextTier ? calculatePointsToNextTier(customer.totalSpent, nextTier) : 0;

    return NextResponse.json({
      points: customer.loyaltyPoints,
      tier: customer.loyaltyTier,
      totalSpent: customer.totalSpent,
      referralCode: customer.referralCode,
      referralCount: customer.referrals.length,
      tierBenefits,
      nextTier,
      pointsToNextTier,
      recentTransactions: customer.loyaltyTransactions,
      redeemedRewards: customer.redeemedRewards,
    });
  } catch (error) {
    console.error('Get loyalty points error:', error);
    return NextResponse.json({ error: 'Failed to fetch loyalty data' }, { status: 500 });
  }
}

/**
 * POST /api/loyalty/points
 * Award loyalty points (staff only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { customerId, points, description, referenceId, referenceType } = await req.json();

    if (!customerId || !points || !description) {
      return NextResponse.json(
        { error: 'customerId, points, and description are required' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Create loyalty transaction
    const transaction = await prisma.loyaltyTransaction.create({
      data: {
        customerId,
        type: 'EARN_BONUS',
        points,
        description,
        referenceId,
        referenceType,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year expiry
      },
    });

    // Update customer points
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        loyaltyPoints: { increment: points },
      },
    });

    return NextResponse.json({
      transaction,
      message: `${points} points awarded successfully`,
    });
  } catch (error) {
    console.error('Award points error:', error);
    return NextResponse.json({ error: 'Failed to award points' }, { status: 500 });
  }
}

// Helper functions
function getTierBenefits(tier: string) {
  const benefits = {
    BRONZE: {
      pointsMultiplier: 1,
      discount: 0,
      prioritySupport: false,
      freeInspection: false,
    },
    SILVER: {
      pointsMultiplier: 1.25,
      discount: 5,
      prioritySupport: false,
      freeInspection: true,
    },
    GOLD: {
      pointsMultiplier: 1.5,
      discount: 10,
      prioritySupport: true,
      freeInspection: true,
    },
    PLATINUM: {
      pointsMultiplier: 2,
      discount: 15,
      prioritySupport: true,
      freeInspection: true,
    },
  };
  return benefits[tier as keyof typeof benefits] || benefits.BRONZE;
}

function getNextTier(currentTier: string): string | null {
  const tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
  const currentIndex = tiers.indexOf(currentTier);
  return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
}

function calculatePointsToNextTier(totalSpent: number, nextTier: string): number {
  const thresholds = {
    SILVER: 1000,
    GOLD: 5000,
    PLATINUM: 15000,
  };
  const threshold = thresholds[nextTier as keyof typeof thresholds] || 0;
  return Math.max(0, threshold - totalSpent);
}
