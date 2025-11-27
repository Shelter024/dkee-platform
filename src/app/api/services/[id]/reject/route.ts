import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isElevatedRole } from '@/lib/roles';
import { sendRealtimeNotification } from '@/lib/pusher';

// PUT /api/services/[id]/reject - Reject service (staff only)
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

    if (!body.reason) {
      return NextResponse.json(
        { error: 'Rejection reason required' },
        { status: 400 }
      );
    }

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

    const updated = await prisma.automotiveService.update({
      where: { id: serviceId },
      data: {
        approvalStatus: 'REJECTED',
        approvedBy: session.user.id,
        approvedAt: new Date(),
        rejectionReason: body.reason,
        status: 'CANCELLED',
      },
      include: {
        customer: {
          include: { user: true },
        },
        vehicle: true,
      },
    });

    // Send real-time notification to customer
    await sendRealtimeNotification(service.customer.userId, {
      title: 'Service Request Update',
      message: `Your ${service.serviceType} request needs review. Please contact us.`,
      type: 'WARNING',
      link: `/dashboard/customer/services/${serviceId}`,
    });

    return NextResponse.json({
      message: 'Service rejected',
      service: updated,
    });
  } catch (error) {
    console.error('Reject service error:', error);
    return NextResponse.json(
      { error: 'Failed to reject service' },
      { status: 500 }
    );
  }
}
