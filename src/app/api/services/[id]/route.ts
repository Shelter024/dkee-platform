import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin, isStaff } from '@/lib/roles';

// GET /api/services/[id] - Get service details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = await prisma.automotiveService.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        vehicle: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
        spareParts: {
          include: {
            part: true,
          },
        },
        invoice: true,
        files: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Check access permissions
    const isOwner = service.customer.userId === session.user.id;
    const hasStaffAccess = isAdmin(session.user) || isStaff(session.user);

    if (!isOwner && !hasStaffAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error('Get service error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    );
  }
}

// PATCH /api/services/[id] - Update service (Staff/Admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only staff and admin can update services
    if (!isAdmin(session.user) && !isStaff(session.user)) {
      return NextResponse.json(
        { error: 'Forbidden. Only staff and admins can update services.' },
        { status: 403 }
      );
    }

    const service = await prisma.automotiveService.findUnique({
      where: { id: params.id },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      status,
      diagnosis,
      workPerformed,
      recommendations,
      technicianName,
      estimatedCost,
      actualCost,
      warrantyMonths,
      discountAmount,
      discountReason,
      scheduledDate,
      completedDate,
    } = body;

    const updateData: any = {};

    if (status !== undefined) updateData.status = status;
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
    if (workPerformed !== undefined) updateData.workPerformed = workPerformed;
    if (recommendations !== undefined) updateData.recommendations = recommendations;
    if (technicianName !== undefined) updateData.technicianName = technicianName;
    if (estimatedCost !== undefined) updateData.estimatedCost = parseFloat(estimatedCost);
    if (actualCost !== undefined) updateData.actualCost = parseFloat(actualCost);
    if (warrantyMonths !== undefined) updateData.warrantyMonths = parseInt(warrantyMonths);
    if (discountAmount !== undefined) updateData.discountAmount = parseFloat(discountAmount);
    if (discountReason !== undefined) updateData.discountReason = discountReason;
    if (scheduledDate !== undefined) updateData.scheduledDate = new Date(scheduledDate);
    if (completedDate !== undefined) {
      updateData.completedDate = new Date(completedDate);
      if (status === 'COMPLETED' && !service.completedDate) {
        updateData.completedDate = new Date();
      }
    }

    const updatedService = await prisma.automotiveService.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        vehicle: true,
        assignedTo: true,
      },
    });

    return NextResponse.json({
      message: 'Service updated successfully',
      service: updatedService,
    });
  } catch (error) {
    console.error('Update service error:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

// DELETE /api/services/[id] - Delete service (Admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete services
    if (!isAdmin(session.user)) {
      return NextResponse.json(
        { error: 'Forbidden. Only admins can delete services.' },
        { status: 403 }
      );
    }

    await prisma.automotiveService.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Service deleted successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    console.error('Delete service error:', error);
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}
