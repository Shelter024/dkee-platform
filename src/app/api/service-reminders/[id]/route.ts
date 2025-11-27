import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireFeatureAccess } from '@/lib/subscription-gate';
import { sanitizeString } from '@/lib/sanitize';

/**
 * GET /api/service-reminders/[id]
 * Get a specific service reminder
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription access
    const accessError = await requireFeatureAccess(session.user.id, 'OIL_SERVICE_REMINDER');
    if (accessError) {
      return NextResponse.json(accessError, { status: 403 });
    }

    const reminder = await prisma.serviceReminder.findFirst({
      where: {
        id: params.id,
        vehicle: {
          customer: {
            userId: session.user.id,
          },
        },
      },
      include: {
        vehicle: true,
      },
    });

    if (!reminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    return NextResponse.json({ reminder }, { status: 200 });
  } catch (error) {
    console.error('Error fetching service reminder:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service reminder' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/service-reminders/[id]
 * Update a service reminder
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription access
    const accessError = await requireFeatureAccess(session.user.id, 'OIL_SERVICE_REMINDER');
    if (accessError) {
      return NextResponse.json(accessError, { status: 403 });
    }

    // Verify reminder belongs to user
    const existingReminder = await prisma.serviceReminder.findFirst({
      where: {
        id: params.id,
        vehicle: {
          customer: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!existingReminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      serviceType,
      dueDate,
      dueMileage,
      notifyDaysBefore,
      notes,
      status,
    } = body;

    // Sanitize inputs
    const updateData: any = {};
    if (serviceType) updateData.serviceType = sanitizeString(serviceType);
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (dueMileage) updateData.dueMileage = parseInt(dueMileage);
    if (notifyDaysBefore !== undefined) updateData.notifyDaysBefore = parseInt(notifyDaysBefore);
    if (notes !== undefined) updateData.notes = notes ? sanitizeString(notes) : null;
    if (status) updateData.status = status;

    const reminder = await prisma.serviceReminder.update({
      where: { id: params.id },
      data: updateData,
      include: {
        vehicle: {
          select: {
            make: true,
            model: true,
            licensePlate: true,
          },
        },
      },
    });

    return NextResponse.json({ reminder }, { status: 200 });
  } catch (error) {
    console.error('Error updating service reminder:', error);
    return NextResponse.json(
      { error: 'Failed to update service reminder' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/service-reminders/[id]
 * Delete a service reminder
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription access
    const accessError = await requireFeatureAccess(session.user.id, 'OIL_SERVICE_REMINDER');
    if (accessError) {
      return NextResponse.json(accessError, { status: 403 });
    }

    // Verify reminder belongs to user
    const existingReminder = await prisma.serviceReminder.findFirst({
      where: {
        id: params.id,
        vehicle: {
          customer: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!existingReminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    await prisma.serviceReminder.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Reminder deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting service reminder:', error);
    return NextResponse.json(
      { error: 'Failed to delete service reminder' },
      { status: 500 }
    );
  }
}
