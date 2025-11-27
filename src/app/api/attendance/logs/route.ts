import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch attendance logs
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const pendingApproval = searchParams.get('pendingApproval') === 'true';

    const userRole = session.user.role;
    const canViewAll = ['CEO', 'ADMIN', 'HR', 'MANAGER'].includes(userRole);

    // Check permissions
    if (!canViewAll && staffId && staffId !== session.user.id) {
      const permissions = await prisma.staffPermission.findUnique({
        where: { userId: session.user.id },
      });

      if (!permissions?.canViewAllAttendance) {
        return NextResponse.json(
          { error: 'You can only view your own attendance' },
          { status: 403 }
        );
      }
    }

    const where: any = {};

    // If not admin/manager, only show own logs
    if (!canViewAll) {
      where.staffId = session.user.id;
    } else if (staffId) {
      where.staffId = staffId;
    }

    if (startDate && endDate) {
      where.logDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (status) {
      where.status = status;
    }

    if (pendingApproval) {
      where.isManualEntry = true;
      where.manualEntryApproved = false;
    }

    const logs = await prisma.attendanceLog.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            staffId: true,
            department: true,
          },
        },
        policy: {
          select: {
            policyName: true,
            workStartTime: true,
            workEndTime: true,
          },
        },
        approvedBy: {
          select: {
            name: true,
            staffId: true,
          },
        },
      },
      orderBy: {
        logDate: 'desc',
      },
      take: 100,
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs', details: error.message },
      { status: 500 }
    );
  }
}
