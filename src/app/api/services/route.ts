import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { nanoid } from 'nanoid';

const createServiceSchema = z.object({
  vehicleId: z.string(),
  serviceType: z.string(),
  description: z.string().min(10),
  estimatedCost: z.number().optional(),
  scheduledDate: z.string().optional(),
});

// POST /api/services - Create service request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = createServiceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { vehicleId, serviceType, description, estimatedCost, scheduledDate } =
      validation.data;

    // Verify vehicle belongs to customer
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
      include: { vehicles: true },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    const vehicle = customer.vehicles.find((v) => v.id === vehicleId);

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found or does not belong to you' },
        { status: 403 }
      );
    }

    // Create service request
    const service = await prisma.automotiveService.create({
      data: {
        customerId: customer.id,
        vehicleId,
        serviceType,
        description,
        estimatedCost,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        status: 'PENDING',
        approvalStatus: 'PENDING',
      },
      include: {
        vehicle: true,
        customer: {
          include: {
            user: {
              select: { name: true, email: true, phone: true },
            },
          },
        },
      },
    });

    // TODO: Send notification to staff

    return NextResponse.json({
      message: 'Service request submitted successfully',
      service,
    });
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json(
      { error: 'Failed to create service request' },
      { status: 500 }
    );
  }
}

// GET /api/services - List services
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const approvalStatus = searchParams.get('approvalStatus');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    let where: any = {};

    // Customers see only their own services
    if (session.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: session.user.id },
      });

      if (!customer) {
        return NextResponse.json({ services: [], pagination: { total: 0, page, limit, pages: 0 } });
      }

      where.customerId = customer.id;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    if (approvalStatus) {
      where.approvalStatus = approvalStatus;
    }

    const [services, total] = await Promise.all([
      prisma.automotiveService.findMany({
        where,
        include: {
          customer: {
            include: {
              user: {
                select: { name: true, email: true, phone: true },
              },
            },
          },
          vehicle: true,
          assignedTo: {
            select: { name: true, email: true },
          },
          spareParts: {
            include: {
              part: true,
            },
          },
          invoice: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.automotiveService.count({ where }),
    ]);

    return NextResponse.json({
      services,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List services error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}
