import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vehicleId = params.id;

    // Get vehicle to check ownership
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { customer: true },
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // Check if user owns this vehicle (for customers) or has admin/staff access
    const isCustomer = session.user.role === 'CUSTOMER';
    if (isCustomer && vehicle.customer.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch job history for this vehicle
    const jobHistory = await prisma.jobHistory.findMany({
      where: { vehicleId: vehicleId },
      orderBy: { startDate: 'desc' },
      include: {
        performedByUser: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(jobHistory);
  } catch (error) {
    console.error('Error fetching vehicle job history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
