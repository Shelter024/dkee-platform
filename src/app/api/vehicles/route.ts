import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/vehicles - List vehicles (customers see only their own, staff see all)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');

    const isStaff = ['ADMIN', 'STAFF_AUTO', 'STAFF_PROPERTY', 'CEO', 'MANAGER'].includes(session.user.role);

    let where: any = {};
    if (isStaff && customerId) {
      where.customerId = customerId;
    } else if (!isStaff) {
      // Customers see only their own vehicles
      const customer = await prisma.customer.findUnique({
        where: { userId: session.user.id },
      });
      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
      where.customerId = customer.id;
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        customer: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
          },
        },
        services: {
          select: { id: true, serviceType: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ vehicles });
  } catch (error: any) {
    console.error('GET /api/vehicles error:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}

// POST /api/vehicles - Create vehicle
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { make, model, year, licensePlate, color, vin, mileage } = body;

    if (!make || !model || !year || !licensePlate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
    });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        customerId: customer.id,
        make,
        model,
        year: Number(year),
        licensePlate,
        color: color || undefined,
        vin: vin || undefined,
        mileage: mileage ? Number(mileage) : undefined,
      },
      include: {
        customer: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
          },
        },
      },
    });

    return NextResponse.json({ vehicle });
  } catch (error: any) {
    console.error('POST /api/vehicles error:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
