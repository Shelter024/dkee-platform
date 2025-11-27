import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendRealtimeMessage } from '@/lib/pusher';

const createMessageSchema = z.object({
  recipientId: z.string().optional(),
  subject: z.string().min(3),
  content: z.string().min(10),
  replyTo: z.string().optional(),
});

// POST /api/messages - Send message
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = createMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { recipientId, subject, content, replyTo } = validation.data;

    const message = await prisma.message.create({
      data: {
        userId: session.user.id,
        recipientId,
        subject,
        content,
        isReply: !!replyTo,
        replyTo,
      },
    });

    // Send real-time notification if recipient specified
    if (recipientId) {
      await sendRealtimeMessage(recipientId, {
        id: message.id,
        subject: message.subject,
        content: message.content,
        senderId: session.user.id,
        senderName: session.user.name || 'User',
      });
    }

    return NextResponse.json({
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// GET /api/messages - List messages
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unread = searchParams.get('unread') === 'true';

    const skip = (page - 1) * limit;

    const where: any = {
      OR: [
        { userId: session.user.id },
        { recipientId: session.user.id },
      ],
    };

    if (unread) {
      where.isRead = false;
    }

    const [messages, total, unreadCount] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.message.count({ where }),
      prisma.message.count({
        where: {
          recipientId: session.user.id,
          isRead: false,
        },
      }),
    ]);

    return NextResponse.json({
      messages,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
