import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// PUT - Approve/Reject manual attendance entry
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    const canApprove = ['CEO', 'ADMIN', 'HR', 'MANAGER'].includes(userRole);

    if (!canApprove) {
      const permissions = await prisma.staffPermission.findUnique({
        where: { userId: session.user.id },
      });

      if (!permissions?.canApproveManualLogs) {
        return NextResponse.json(
          { error: 'You do not have permission to approve attendance logs' },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { action, reviewNotes } = body;

    const log = await prisma.attendanceLog.findUnique({
      where: { id: params.id },
      include: {
        staff: {
          select: {
            name: true,
            email: true,
            staffId: true,
          },
        },
      },
    });

    if (!log) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    if (!log.isManualEntry) {
      return NextResponse.json(
        { error: 'Only manual entries can be approved/rejected' },
        { status: 400 }
      );
    }

    if (action === 'APPROVE') {
      const updatedLog = await prisma.attendanceLog.update({
        where: { id: params.id },
        data: {
          manualEntryApproved: true,
          approvedById: session.user.id,
          approvedAt: new Date(),
          reviewNotes,
          flaggedForReview: false,
        },
      });

      // Notify staff
      await sendEmail({
        to: log.staff.email,
        subject: 'Manual Attendance Entry Approved',
        html: `
          <h2>Attendance Entry Approved</h2>
          <p>Dear ${log.staff.name},</p>
          <p>Your manual attendance entry has been approved.</p>
          <h3>Details:</h3>
          <ul>
            <li><strong>Date:</strong> ${log.logDate.toLocaleDateString()}</li>
            <li><strong>Reason:</strong> ${log.manualEntryReason}</li>
            ${reviewNotes ? `<li><strong>Notes:</strong> ${reviewNotes}</li>` : ''}
          </ul>
        `,
      });

      return NextResponse.json({
        message: 'Manual entry approved',
        log: updatedLog,
      });
    }

    if (action === 'REJECT') {
      const updatedLog = await prisma.attendanceLog.update({
        where: { id: params.id },
        data: {
          manualEntryApproved: false,
          approvedById: session.user.id,
          approvedAt: new Date(),
          reviewNotes,
          flaggedForReview: false,
        },
      });

      // Notify staff
      await sendEmail({
        to: log.staff.email,
        subject: 'Manual Attendance Entry Rejected',
        html: `
          <h2>Attendance Entry Rejected</h2>
          <p>Dear ${log.staff.name},</p>
          <p>Your manual attendance entry has been rejected.</p>
          <h3>Details:</h3>
          <ul>
            <li><strong>Date:</strong> ${log.logDate.toLocaleDateString()}</li>
            <li><strong>Reason:</strong> ${log.manualEntryReason}</li>
            ${reviewNotes ? `<li><strong>Rejection Notes:</strong> ${reviewNotes}</li>` : ''}
          </ul>
          <p>Please contact HR if you have questions.</p>
        `,
      });

      return NextResponse.json({
        message: 'Manual entry rejected',
        log: updatedLog,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing log action:', error);
    return NextResponse.json(
      { error: 'Failed to process action', details: error.message },
      { status: 500 }
    );
  }
}
