import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const requestSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  requestedRole: z.enum(['STAFF_AUTO', 'STAFF_PROPERTY', 'HR', 'MANAGER']),
  reason: z.string().min(10, 'Please provide a reason for the account request'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, phone, requestedRole, reason } = validation.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Create a notification for all admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
    });

    const notificationData = {
      title: 'New Staff Account Request',
      message: `${name} (${email}) has requested a ${requestedRole} account. Reason: ${reason}`,
      type: 'INFO' as const,
    };

    await Promise.all(
      admins.map((admin) =>
        prisma.notification.create({
          data: {
            ...notificationData,
            userId: admin.id,
          },
        })
      )
    );

    // TODO: You could also store this in a separate StaffAccountRequest table
    // For now, we'll just send notifications

    return NextResponse.json({
      message: 'Staff account request submitted successfully. An admin will contact you soon.',
      requestDetails: {
        name,
        email,
        requestedRole,
      },
    });
  } catch (error) {
    console.error('Error submitting staff account request:', error);
    return NextResponse.json(
      { error: 'Failed to submit request' },
      { status: 500 }
    );
  }
}
