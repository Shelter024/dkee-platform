import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isElevatedRole } from '@/lib/roles';

// GET /api/customers/[id] - Get customer details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = params.id;

    // Staff can view any customer, customers can only view themselves
    if (
      !isElevatedRole(session.user.role) &&
      session.user.role !== 'CUSTOMER'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            phoneVerified: true,
            emailVerified: true,
            createdAt: true,
          },
        },
        vehicles: {
          include: {
            _count: {
              select: { services: true },
            },
          },
        },
        automotiveServices: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            vehicle: true,
            assignedTo: {
              select: { name: true },
            },
          },
        },
        invoices: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // If customer role, ensure they're viewing their own profile
    if (session.user.role === 'CUSTOMER' && customer.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Get customer error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = params.id;
    const body = await req.json();

    // Find customer first
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Customers can only update themselves, staff can update any
    if (
      !isElevatedRole(session.user.role) &&
      customer.userId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update customer and user data
    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        address: body.address,
        company: body.company,
        user: {
          update: {
            name: body.name,
            phone: body.phone,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ customer: updated });
  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}
