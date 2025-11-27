import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch attendance policies
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: any = {};
    if (activeOnly) where.isActive = true;

    const policies = await prisma.attendancePolicy.findMany({
      where,
      include: {
        createdBy: {
          select: {
            name: true,
            staffId: true,
          },
        },
      },
      orderBy: {
        effectiveDate: 'desc',
      },
    });

    return NextResponse.json({ policies });
  } catch (error: any) {
    console.error('Error fetching policies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch policies', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create attendance policy (CEO/ADMIN only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    const canManage = ['CEO', 'ADMIN'].includes(userRole);

    if (!canManage) {
      const permissions = await prisma.staffPermission.findUnique({
        where: { userId: session.user.id },
      });

      if (!permissions?.canManageAttendancePolicy) {
        return NextResponse.json(
          { error: 'You do not have permission to manage attendance policies' },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const {
      policyName,
      description,
      workStartTime,
      workEndTime,
      lateThreshold,
      earlyDepartureThreshold,
      clockInGracePeriod,
      clockOutGracePeriod,
      workDays,
      excludedDates,
      requireLocationVerification,
      allowedLocations,
      locationRadius,
      allowManualLogs,
      requireApprovalForManualLogs,
      appliesTo,
      effectiveDate,
    } = body;

    const policy = await prisma.attendancePolicy.create({
      data: {
        policyName,
        description,
        workStartTime,
        workEndTime,
        lateThreshold: parseInt(lateThreshold),
        earlyDepartureThreshold: parseInt(earlyDepartureThreshold),
        clockInGracePeriod: clockInGracePeriod ? parseInt(clockInGracePeriod) : 15,
        clockOutGracePeriod: clockOutGracePeriod ? parseInt(clockOutGracePeriod) : 15,
        workDays: workDays || ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        excludedDates: excludedDates || [],
        requireLocationVerification: requireLocationVerification !== false,
        allowedLocations: allowedLocations || [],
        locationRadius: locationRadius ? parseInt(locationRadius) : 100,
        allowManualLogs: allowManualLogs !== false,
        requireApprovalForManualLogs: requireApprovalForManualLogs !== false,
        appliesTo: appliesTo || null,
        isActive: true,
        createdById: session.user.id,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      },
    });

    return NextResponse.json({
      message: 'Attendance policy created successfully',
      policy,
    });
  } catch (error: any) {
    console.error('Error creating policy:', error);
    return NextResponse.json(
      { error: 'Failed to create policy', details: error.message },
      { status: 500 }
    );
  }
}
