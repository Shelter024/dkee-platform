import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isElevatedRole } from '@/lib/roles';
import { nanoid } from 'nanoid';
import { sendRealtimeNotification } from '@/lib/pusher';

// PUT /api/services/[id]/approve - Approve service (staff only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !isElevatedRole(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const serviceId = params.id;
    const body = await req.json();

    const service = await prisma.automotiveService.findUnique({
      where: { id: serviceId },
      include: {
        customer: {
          include: { user: true },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (service.approvalStatus !== 'PENDING') {
      return NextResponse.json(
        { error: 'Service already processed' },
        { status: 400 }
      );
    }

    // Generate job card number
    const jobCardNumber = `JC-${nanoid(10).toUpperCase()}`;

    const updated = await prisma.automotiveService.update({
      where: { id: serviceId },
      data: {
        approvalStatus: 'APPROVED',
        approvedBy: session.user.id,
        approvedAt: new Date(),
        jobCardNumber,
        status: 'IN_PROGRESS',
        assignedToId: body.assignedToId || session.user.id,
      },
      include: {
        customer: {
          include: { user: true },
        },
        vehicle: true,
        assignedTo: {
          select: { name: true },
        },
      },
    });

    // Send real-time notification to customer
    await sendRealtimeNotification(service.customer.userId, {
      title: 'Service Approved',
      message: `Your ${service.serviceType} request has been approved. Job Card: ${jobCardNumber}`,
      type: 'SUCCESS',
      link: `/dashboard/customer/services/${serviceId}`,
    });

    return NextResponse.json({
      message: 'Service approved successfully',
      service: updated,
    });
  } catch (error) {
    console.error('Approve service error:', error);
    return NextResponse.json(
      { error: 'Failed to approve service' },
      { status: 500 }
    );
  }
}
