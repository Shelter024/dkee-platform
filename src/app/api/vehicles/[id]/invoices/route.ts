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

    // Fetch invoices for services related to this vehicle
    const invoices = await prisma.invoice.findMany({
      where: {
        customerId: vehicle.customerId,
        automotiveService: {
          vehicleId: vehicleId,
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        invoiceNumber: true,
        description: true,
        total: true,
        paymentStatus: true,
        dueDate: true,
        pdfUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching vehicle invoices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
