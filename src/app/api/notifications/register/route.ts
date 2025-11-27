import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { expoPushToken } = await req.json();
    if (!expoPushToken) {
      return NextResponse.json({ error: 'Missing expoPushToken' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { expoPushToken },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
