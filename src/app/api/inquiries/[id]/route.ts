import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/inquiries/[id] - Update inquiry status
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isStaff = ['ADMIN', 'STAFF_PROPERTY', 'CEO', 'MANAGER'].includes(session.user.role);
    if (!isStaff) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status required' }, { status: 400 });
    }

    const inquiry = await prisma.propertyInquiry.update({
      where: { id: params.id },
      data: { status },
      include: {
        property: true,
        customer: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
          },
        },
      },
    });

    return NextResponse.json({ inquiry });
  } catch (error: any) {
    console.error('PUT /api/inquiries/[id] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
