import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ user: { id: session.user.id, name: session.user.name, role: session.user.role } });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
  }
}
