import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '../../../../lib/email';
import { sendSMS } from '../../../../lib/sms';

// POST /api/notifications/send - Send notification (email/SMS/in-app)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isStaff = ['ADMIN', 'CEO', 'MANAGER', 'STAFF_AUTO', 'STAFF_PROPERTY'].includes(session.user.role);
    if (!isStaff) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, type, title, message, channels } = body; // channels: ['email', 'sms', 'in-app']

    if (!userId || !title || !message || !channels) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const results: any = {};

    // In-app notification (always create)
    if (channels.includes('in-app')) {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: type || 'GENERAL',
          title,
          message,
        },
      });
      results.inApp = notification;
    }

    // Email notification
    if (channels.includes('email') && user.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: title,
          text: message,
          html: `<p>${message}</p>`,
        });
        results.email = 'sent';
      } catch (e: any) {
        results.email = `failed: ${e.message}`;
      }
    }

    // SMS notification
    if (channels.includes('sms') && user.phone) {
      try {
        await sendSMS(user.phone, message);
        results.sms = 'sent';
      } catch (e: any) {
        results.sms = `failed: ${e.message}`;
      }
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('POST /api/notifications/send error:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
