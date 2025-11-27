import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

/**
 * POST /api/loyalty/referral
 * Generate or retrieve referral code for customer
 */
export async function POST(req: NextRequest) {
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

    // Generate referral code if doesn't exist
    if (!customer.referralCode) {
      const code = nanoid(8).toUpperCase();
      
      await prisma.customer.update({
        where: { id: customer.id },
        data: { referralCode: code },
      });

      return NextResponse.json({
        referralCode: code,
        message: 'Referral code generated successfully',
      });
    }

    return NextResponse.json({
      referralCode: customer.referralCode,
      message: 'Existing referral code retrieved',
    });
  } catch (error) {
    console.error('Generate referral code error:', error);
    return NextResponse.json({ error: 'Failed to generate referral code' }, { status: 500 });
  }
}

/**
 * GET /api/loyalty/referral?code=ABC12345
 * Validate referral code
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 });
    }

    const referrer = await prisma.customer.findUnique({
      where: { referralCode: code },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!referrer) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      referrerName: referrer.user.name,
      reward: 'Both you and your referrer get 100 points!',
    });
  } catch (error) {
    console.error('Validate referral code error:', error);
    return NextResponse.json({ error: 'Failed to validate referral code' }, { status: 500 });
  }
}
