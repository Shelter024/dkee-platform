import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { 
  generateVerificationToken, 
  getVerificationExpiry, 
  sendVerificationEmail 
} from '@/lib/email-verification';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeString, sanitizeEmail, sanitizePhone } from '@/lib/sanitize';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  registrationType: z.enum(['email', 'phone']).default('email'),
}).refine(
  (data) => {
    if (data.registrationType === 'email') {
      return !!data.email && !!data.password;
    } else {
      return !!data.phone;
    }
  },
  {
    message: 'Email and password required for email registration, or phone for phone registration',
  }
);

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 5 registration attempts per IP per hour
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimit(`register:${clientIp}`, 5, 3600);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    let { name, email, password, phone, registrationType } = validation.data;

    // Sanitize inputs
    name = sanitizeString(name);
    if (email) email = sanitizeEmail(email);
    if (phone) phone = sanitizePhone(phone);

    // Check if user exists by email or phone
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        );
      }
    }

    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone },
      });

      if (existingPhone) {
        return NextResponse.json(
          { error: 'Phone number already registered' },
          { status: 400 }
        );
      }
    }

    // Generate email verification token
    const verificationToken = generateVerificationToken();
    const verificationExpiry = getVerificationExpiry();

    // Hash password if provided
    const hashedPassword = password ? await hash(password, 12) : null;

    // Create user and customer profile
    const user = await prisma.user.create({
      data: {
        name,
        email: email || `temp_${Date.now()}@pending.dkee.com`, // Temporary email for phone-only registration
        password: hashedPassword,
        phone,
        role: 'CUSTOMER',
        emailVerificationToken: registrationType === 'email' ? verificationToken : null,
        emailVerificationExpiry: registrationType === 'email' ? verificationExpiry : null,
        accountStatus: registrationType === 'email' ? 'PENDING_VERIFICATION' : 'PENDING_APPROVAL',
        phoneVerified: registrationType === 'phone',
        customer: {
          create: {},
        },
      },
      include: {
        customer: true,
      },
    });

    // Send verification email if email registration
    if (registrationType === 'email' && email) {
      try {
        await sendVerificationEmail(email, name, verificationToken);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails
      }
    }

    return NextResponse.json({
      message: registrationType === 'email' 
        ? 'Registration successful! Please check your email to verify your account.' 
        : 'Registration successful! An OTP will be sent to your phone for verification.',
      user: {
        id: user.id,
        name: user.name,
        email: email || undefined,
        phone: phone || undefined,
        role: user.role,
        accountStatus: user.accountStatus,
        requiresEmailVerification: registrationType === 'email',
        requiresPhoneVerification: registrationType === 'phone',
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
