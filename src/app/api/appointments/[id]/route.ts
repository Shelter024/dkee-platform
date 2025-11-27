import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/appointments/[id]
 * Get appointment details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          include: { user: { select: { id: true, name: true, email: true, phone: true } } },
        },
        vehicle: true,
        assignedTechnician: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Check authorization
    if (session.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: session.user.id },
      });
      if (!customer || appointment.customerId !== customer.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('Get appointment error:', error);
    return NextResponse.json({ error: 'Failed to fetch appointment' }, { status: 500 });
  }
}

/**
 * PATCH /api/appointments/[id]
 * Update appointment (status, assigned technician, etc.)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: { customer: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const body = await req.json();

    // Customers can only cancel their own appointments
    if (session.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: session.user.id },
      });
      if (!customer || appointment.customerId !== customer.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Customers can only cancel
      if (body.status && body.status !== 'CANCELLED') {
        return NextResponse.json(
          { error: 'Customers can only cancel appointments' },
          { status: 403 }
        );
      }

      const updated = await prisma.appointment.update({
        where: { id: params.id },
        data: {
          status: 'CANCELLED',
          cancelledReason: body.cancelledReason || 'Cancelled by customer',
        },
        include: {
          customer: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          vehicle: true,
        },
      });

      return NextResponse.json({ appointment: updated });
    }

    // Staff can update any field
    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.assignedTo) updateData.assignedTo = body.assignedTo;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.preferredDate) updateData.preferredDate = new Date(body.preferredDate);
    if (body.preferredTime) updateData.preferredTime = body.preferredTime;
    if (body.duration) updateData.duration = body.duration;
    if (body.cancelledReason) updateData.cancelledReason = body.cancelledReason;

    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        vehicle: true,
        assignedTechnician: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ appointment: updated });
  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}

/**
 * DELETE /api/appointments/[id]
 * Delete appointment (admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.appointment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 });
  }
}
