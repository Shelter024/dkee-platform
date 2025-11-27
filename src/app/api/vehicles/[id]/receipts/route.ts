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

    // Fetch receipts for this customer
    const receipts = await prisma.receipt.findMany({
      where: {
        customerId: vehicle.customerId,
        // Only get receipts for invoices related to this vehicle
        invoice: {
          automotiveService: {
            vehicleId: vehicleId,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        receiptNumber: true,
        amount: true,
        paymentMethod: true,
        description: true,
        pdfUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json(receipts);
  } catch (error) {
    console.error('Error fetching vehicle receipts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
