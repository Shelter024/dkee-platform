import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generateOTP, sendOTP } from '@/lib/twilio';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizePhone } from '@/lib/sanitize';

const sendOTPSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  userId: z.string().optional(),
}); // userId optional; if absent we will locate user by phone for login OTP

const verifyOTPSchema = z.object({
  phone: z.string(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  userId: z.string().optional(),
});

// POST /api/auth/otp/send
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (body.action === 'verify') {
      return verifyOTPHandler(body);
    }

    // Rate limiting: 3 OTP requests per phone per 10 minutes
    if (body.phone) {
      const phone = body.phone;
      const rateLimitResult = await rateLimit(`otp:${phone}`, 3, 600);
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { error: 'Too many OTP requests. Please try again later.' },
          { status: 429 }
        );
      }
    }

    // Send OTP
    const validation = sendOTPSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { phone: rawPhone, userId } = validation.data;

    // Sanitize phone
    const phone = sanitizePhone(rawPhone);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Persist OTP either by explicit userId (registration/phone verify) or by phone (login OTP)
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { otpSecret: otp, otpExpiry },
      });
    } else {
      const userByPhone = await prisma.user.findUnique({ where: { phone } });
      if (!userByPhone) {
        return NextResponse.json(
          { error: 'Phone number not registered' },
          { status: 404 }
        );
      }
      await prisma.user.update({
        where: { id: userByPhone.id },
        data: { otpSecret: otp, otpExpiry },
      });
    }

    // Send OTP via Twilio
    const sent = await sendOTP(phone, otp);

    if (!sent) {
      // In development, return OTP for testing
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          message: 'OTP generated (dev mode)',
          otp, // Only in development!
        });
      }

      return NextResponse.json(
        { error: 'Failed to send OTP' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'OTP sent successfully',
      expiresIn: 600, // seconds
    });
  } catch (error) {
    console.error('OTP send error:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}

async function verifyOTPHandler(body: any) {
  const validation = verifyOTPSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0].message },
      { status: 400 }
    );
  }

  const { phone, otp, userId } = validation.data;

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID required for verification' },
      { status: 400 }
    );
  }

  // Find user and verify OTP
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  if (!user.otpSecret || !user.otpExpiry) {
    return NextResponse.json(
      { error: 'No OTP found. Please request a new one.' },
      { status: 400 }
    );
  }

  if (new Date() > user.otpExpiry) {
    return NextResponse.json(
      { error: 'OTP expired. Please request a new one.' },
      { status: 400 }
    );
  }

  if (user.otpSecret !== otp) {
    return NextResponse.json(
      { error: 'Invalid OTP' },
      { status: 400 }
    );
  }

  // Mark phone as verified
  await prisma.user.update({
    where: { id: userId },
    data: {
      phoneVerified: true,
      phone,
      otpSecret: null,
      otpExpiry: null,
    },
  });

  return NextResponse.json({
    message: 'Phone verified successfully',
    phoneVerified: true,
  });
}
