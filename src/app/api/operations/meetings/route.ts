import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch meetings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const upcoming = searchParams.get('upcoming') === 'true';

    const where: any = {};
    if (upcoming) {
      where.scheduledDate = { gte: new Date() };
    }

    const meetings = await prisma.meeting.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
      take: 50,
    });

    return NextResponse.json({ meetings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create meeting
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, meetingType, scheduledDate, startTime, endTime, location, meetingLink, participants, agenda, description } = body;

    const count = await prisma.meeting.count();
    const meetingNumber = `MTG-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

    const meeting = await prisma.meeting.create({
      data: {
        meetingNumber,
        title,
        meetingType,
        scheduledDate: new Date(scheduledDate),
        startTime,
        endTime,
        location,
        meetingLink,
        organizer: session.user.id,
        organizerName: session.user.name,
        participants: participants || [],
        agenda: agenda || [],
        description,
        status: 'SCHEDULED',
      },
    });

    return NextResponse.json({ message: 'Meeting scheduled', meeting });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
