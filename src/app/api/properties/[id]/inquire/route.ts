import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/properties/[id]/inquire - Customer submit inquiry
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const inquiry = await prisma.propertyInquiry.create({
      data: {
        propertyId: params.id,
        customerId: customer.id,
        message,
        status: 'NEW',
      },
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
    console.error('POST /api/properties/[id]/inquire error:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
