import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateVerificationToken, getVerificationExpiry, sendVerificationEmail } from '@/lib/email-verification';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Valid email required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { email } = validation.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.accountStatus !== 'PENDING_VERIFICATION') {
      return NextResponse.json({ error: 'Email already verified or account not pending verification' }, { status: 400 });
    }

    // Generate new token
    const token = generateVerificationToken();
    const expiry = getVerificationExpiry();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: token,
        emailVerificationExpiry: expiry,
      },
    });

    try {
      await sendVerificationEmail(user.email, user.name, token);
    } catch (e) {
      console.error('Failed to send verification email:', e);
      // Don't fail the endpoint if sending fails; user can retry.
    }

    return NextResponse.json({ message: 'Verification email sent if delivery succeeded.' });
  } catch (err) {
    console.error('Resend verification error:', err);
    return NextResponse.json({ error: 'Failed to resend verification' }, { status: 500 });
  }
}
