import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// POST - Manual attendance entry (outside time frame)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      logDate,
      reason,
      description,
      location,
      deviceInfo,
      clockInTime,
      clockOutTime,
    } = body;

    // Get active policy
    const policy = await prisma.attendancePolicy.findFirst({
      where: { isActive: true },
      orderBy: { effectiveDate: 'desc' },
    });

    if (!policy) {
      return NextResponse.json(
        { error: 'No active attendance policy found' },
        { status: 404 }
      );
    }

    if (!policy.allowManualLogs) {
      return NextResponse.json(
        { error: 'Manual attendance logs are not allowed' },
        { status: 403 }
      );
    }

    const targetDate = new Date(logDate);
    const count = await prisma.attendanceLog.count();
    const logNumber = `ATT-MAN-${targetDate.getFullYear()}${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(5, '0')}`;

    const log = await prisma.attendanceLog.create({
      data: {
        logNumber,
        staffId: session.user.id,
        policyId: policy.id,
        logType: 'MANUAL_ENTRY',
        logDate: targetDate,
        actualClockIn: clockInTime ? new Date(clockInTime) : null,
        actualClockOut: clockOutTime ? new Date(clockOutTime) : null,
        status: reason as string,
        isManualEntry: true,
        manualEntryReason: reason,
        manualEntryDescription: description,
        manualEntryApproved: policy.requireApprovalForManualLogs ? false : true,
        clockInLocation: location,
        clockInDevice: deviceInfo,
        locationVerified: true, // Manual entries include location
        flaggedForReview: policy.requireApprovalForManualLogs,
      },
    });

    // Notify managers if approval required
    if (policy.requireApprovalForManualLogs) {
      const managers = await prisma.user.findMany({
        where: {
          role: { in: ['CEO', 'ADMIN', 'HR', 'MANAGER'] },
        },
        select: {
          email: true,
          name: true,
        },
      });

      const staff = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, staffId: true, department: true },
      });

      for (const manager of managers) {
        await sendEmail({
          to: manager.email,
          subject: `Manual Attendance Entry Requires Approval: ${staff?.name}`,
          html: `
            <h2>Manual Attendance Entry Submitted</h2>
            <p>Dear ${manager.name},</p>
            <p>A staff member has submitted a manual attendance entry that requires your approval.</p>
            <h3>Details:</h3>
            <ul>
              <li><strong>Staff:</strong> ${staff?.name} (${staff?.staffId})</li>
              <li><strong>Department:</strong> ${staff?.department}</li>
              <li><strong>Date:</strong> ${targetDate.toLocaleDateString()}</li>
              <li><strong>Reason:</strong> ${reason}</li>
              <li><strong>Description:</strong> ${description}</li>
              <li><strong>Location:</strong> ${location ? `${location.latitude}, ${location.longitude}` : 'Not provided'}</li>
            </ul>
            <p>Please review and approve/reject this entry in the Attendance Dashboard.</p>
          `,
        });
      }
    }

    return NextResponse.json({
      message: policy.requireApprovalForManualLogs
        ? 'Manual attendance entry submitted for approval'
        : 'Manual attendance entry recorded',
      log,
      requiresApproval: policy.requireApprovalForManualLogs,
    });
  } catch (error: any) {
    console.error('Error creating manual log:', error);
    return NextResponse.json(
      { error: 'Failed to create manual log', details: error.message },
      { status: 500 }
    );
  }
}
