import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/vehicles/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
          },
        },
        services: {
          include: {
            invoice: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // Authorization: customers can only see their own vehicles
    const isStaff = ['ADMIN', 'STAFF_AUTO', 'STAFF_PROPERTY', 'CEO', 'MANAGER'].includes(session.user.role);
    if (!isStaff) {
      const customer = await prisma.customer.findUnique({
        where: { userId: session.user.id },
      });
      if (!customer || vehicle.customerId !== customer.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({ vehicle });
  } catch (error: any) {
    console.error('GET /api/vehicles/[id] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}

// PUT /api/vehicles/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.id },
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // Authorization: customers can only edit their own vehicles
    const isStaff = ['ADMIN', 'STAFF_AUTO', 'STAFF_PROPERTY', 'CEO', 'MANAGER'].includes(session.user.role);
    if (!isStaff) {
      const customer = await prisma.customer.findUnique({
        where: { userId: session.user.id },
      });
      if (!customer || vehicle.customerId !== customer.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { make, model, year, licensePlate, color, vin, mileage } = body;

    const updated = await prisma.vehicle.update({
      where: { id: params.id },
      data: {
        ...(make && { make }),
        ...(model && { model }),
        ...(year && { year: Number(year) }),
        ...(licensePlate && { licensePlate }),
        ...(color !== undefined && { color: color || null }),
        ...(vin !== undefined && { vin: vin || null }),
        ...(mileage !== undefined && { mileage: mileage ? Number(mileage) : null }),
      },
      include: {
        customer: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
          },
        },
      },
    });

    return NextResponse.json({ vehicle: updated });
  } catch (error: any) {
    console.error('PUT /api/vehicles/[id] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}

// DELETE /api/vehicles/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.id },
      include: {
        services: true,
      },
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // Authorization: customers can only delete their own vehicles
    const isStaff = ['ADMIN', 'STAFF_AUTO', 'STAFF_PROPERTY', 'CEO', 'MANAGER'].includes(session.user.role);
    if (!isStaff) {
      const customer = await prisma.customer.findUnique({
        where: { userId: session.user.id },
      });
      if (!customer || vehicle.customerId !== customer.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Check if vehicle has services
    if (vehicle.services.length > 0) {
      return NextResponse.json({ error: 'Cannot delete vehicle with service history' }, { status: 400 });
    }

    await prisma.vehicle.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Vehicle deleted' });
  } catch (error: any) {
    console.error('DELETE /api/vehicles/[id] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
