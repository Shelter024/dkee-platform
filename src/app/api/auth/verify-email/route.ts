import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const verifySchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { token } = validation.data;

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (user.emailVerificationExpiry && new Date() > user.emailVerificationExpiry) {
      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { 
          message: 'Email already verified. Your account is pending admin approval.',
          accountStatus: user.accountStatus,
        },
        { status: 200 }
      );
    }

    // Update user to verified and pending approval
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationExpiry: null,
        accountStatus: 'PENDING_APPROVAL',
      },
    });

    return NextResponse.json({
      message: 'Email verified successfully! Your account is now pending admin approval. You will be notified once approved.',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        accountStatus: updatedUser.accountStatus,
        emailVerified: true,
      },
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}

// GET endpoint for verification via email link
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (user.emailVerificationExpiry && new Date() > user.emailVerificationExpiry) {
      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { 
          message: 'Email already verified. Your account is pending admin approval.',
          accountStatus: user.accountStatus,
        },
        { status: 200 }
      );
    }

    // Update user to verified and pending approval
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationExpiry: null,
        accountStatus: 'PENDING_APPROVAL',
      },
    });

    return NextResponse.json({
      message: 'Email verified successfully! Your account is now pending admin approval. You will be notified once approved.',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        accountStatus: updatedUser.accountStatus,
        emailVerified: true,
      },
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
