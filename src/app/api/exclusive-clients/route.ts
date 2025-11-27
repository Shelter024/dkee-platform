import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { sendSMS } from '@/lib/sms';

// GET - Fetch exclusive client assignments
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const staffId = searchParams.get('staffId');
    const clientId = searchParams.get('clientId');
    const assignmentId = searchParams.get('assignmentId');

    // Check if user is staff with permission
    const isStaff = ['STAFF_PROPERTY', 'STAFF_AUTO', 'MANAGER', 'CEO', 'ADMIN'].includes(
      session.user.role
    );

    // Build query
    const where: any = {};

    // If specific assignment requested
    if (assignmentId) {
      where.id = assignmentId;
    }

    // Filter by status
    if (status) {
      where.transactionStatus = status;
    }

    // Staff can only see their own assignments unless they have permission
    if (staffId) {
      where.staffId = staffId;
    } else if (!['ADMIN', 'CEO', 'MANAGER'].includes(session.user.role)) {
      where.staffId = session.user.id;
    }

    // Filter by client
    if (clientId) {
      where.clientId = clientId;
    }

    const assignments = await prisma.exclusiveClientAssignment.findMany({
      where,
      include: {
        interactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

// POST - Create exclusive client assignment
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      clientId,
      clientName,
      clientEmail,
      clientPhone,
      serviceType,
      assignmentTitle,
      description,
      priority,
      lockedReason,
      estimatedValue,
      expectedCompletionDate,
      staffEmailAlerts,
      staffSmsAlerts,
      clientEmailAlerts,
      clientSmsAlerts,
    } = body;

    // Check if staff has permission to onboard exclusive clients
    const staffPermission = await prisma.staffPermission.findUnique({
      where: { userId: session.user.id },
    });

    if (
      !['ADMIN', 'CEO', 'MANAGER'].includes(session.user.role) &&
      !staffPermission?.canOnboardExclusiveClients
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to onboard exclusive clients' },
        { status: 403 }
      );
    }

    // Check if client is already exclusively assigned
    const existingAssignment = await prisma.exclusiveClientAssignment.findFirst({
      where: {
        clientId,
        transactionStatus: { in: ['ACTIVE', 'PENDING_COMPLETION'] },
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        {
          error: 'Client is already exclusively assigned to another staff member',
          existingAssignment,
        },
        { status: 409 }
      );
    }

    // Generate assignment number
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    const lastAssignment = await prisma.exclusiveClientAssignment.findFirst({
      where: {
        assignmentNumber: {
          startsWith: `ECA-${dateStr}`,
        },
      },
      orderBy: { assignmentNumber: 'desc' },
    });

    let sequence = 1;
    if (lastAssignment) {
      const lastSequence = parseInt(lastAssignment.assignmentNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    const assignmentNumber = `ECA-${dateStr}-${sequence.toString().padStart(4, '0')}`;

    // Get staff details
    const staff = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true },
    });

    // Create assignment
    const assignment = await prisma.exclusiveClientAssignment.create({
      data: {
        assignmentNumber,
        staffId: session.user.id,
        staffName: staff?.name || 'Unknown',
        staffEmail: staff?.email || '',
        staffPhone: staff?.phone,
        clientId,
        clientName,
        clientEmail,
        clientPhone,
        serviceType,
        assignmentTitle,
        description,
        priority: priority || 'NORMAL',
        isLocked: true,
        lockedReason: lockedReason || 'Exclusive service assignment',
        estimatedValue,
        expectedCompletionDate: expectedCompletionDate
          ? new Date(expectedCompletionDate)
          : null,
        staffEmailAlerts: staffEmailAlerts !== false,
        staffSmsAlerts: staffSmsAlerts || false,
        clientEmailAlerts: clientEmailAlerts !== false,
        clientSmsAlerts: clientSmsAlerts || false,
      },
    });

    // Update customer record
    await prisma.customer.updateMany({
      where: { userId: clientId },
      data: {
        hasExclusiveAssignment: true,
        exclusiveStaffId: session.user.id,
      },
    });

    // Log the assignment creation
    await prisma.clientAssignmentStatusHistory.create({
      data: {
        assignmentId: assignment.id,
        fromStatus: 'NONE',
        toStatus: 'ACTIVE',
        changedBy: 'STAFF',
        changerId: session.user.id,
        changerName: staff?.name || 'Unknown',
        reason: 'Initial assignment',
        notes: `Exclusive client assignment created: ${assignmentTitle}`,
      },
    });

    // Send alerts
    if (staffEmailAlerts !== false) {
      await sendEmail({
        to: staff?.email || '',
        subject: `New Exclusive Client Assignment - ${assignmentNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #B91C1C 0%, #DC2626 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Exclusive Client Assignment</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <h2 style="color: #1f2937;">Assignment Created</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                You have been assigned an exclusive client. This client is now locked to you until the transaction is completed.
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Assignment Number:</strong> ${assignmentNumber}</p>
                <p><strong>Client:</strong> ${clientName}</p>
                <p><strong>Service Type:</strong> ${serviceType.replace(/_/g, ' ')}</p>
                <p><strong>Title:</strong> ${assignmentTitle}</p>
                <p><strong>Priority:</strong> ${priority || 'NORMAL'}</p>
                ${estimatedValue ? `<p><strong>Estimated Value:</strong> $${estimatedValue.toLocaleString()}</p>` : ''}
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                Only you can communicate and work with this client until the assignment is closed.
              </p>
            </div>
          </div>
        `,
      });
    }

    if (clientEmailAlerts !== false) {
      await sendEmail({
        to: clientEmail,
        subject: `Your Dedicated Service Representative - ${staff?.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #B91C1C 0%, #DC2626 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Welcome to Our Exclusive Service</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <h2 style="color: #1f2937;">Your Dedicated Representative</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                We're pleased to assign you a dedicated service representative who will handle all your needs personally.
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Your Representative:</strong> ${staff?.name}</p>
                <p><strong>Email:</strong> ${staff?.email}</p>
                ${staff?.phone ? `<p><strong>Phone:</strong> ${staff.phone}</p>` : ''}
                <p><strong>Service:</strong> ${serviceType.replace(/_/g, ' ')}</p>
                <p><strong>Reference Number:</strong> ${assignmentNumber}</p>
              </div>
              <p style="color: #4b5563; line-height: 1.6;">
                ${staff?.name} will be your single point of contact throughout this transaction. 
                You can reach out directly for any questions or updates.
              </p>
            </div>
          </div>
        `,
      });
    }

    // Send SMS alerts if enabled
    if (staffSmsAlerts && staff?.phone) {
      await sendSMS(
        staff.phone,
        `New exclusive client assigned: ${clientName}. Assignment #${assignmentNumber}. Priority: ${priority || 'NORMAL'}`
      );
    }

    if (clientSmsAlerts && clientPhone) {
      await sendSMS(
        clientPhone,
        `Welcome! ${staff?.name} is now your dedicated representative for ${serviceType.replace(/_/g, ' ')}. Ref: ${assignmentNumber}`
      );
    }

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}

// PUT - Update assignment or close it
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      assignmentId,
      action, // UPDATE or CLOSE
      transactionStatus,
      actualValue,
      closureReason,
      closureNotes,
      ...updateData
    } = body;

    // Get assignment
    const assignment = await prisma.exclusiveClientAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check access rights
    const isAssignedStaff = assignment.staffId === session.user.id;
    const isClient = assignment.clientId === session.user.id;
    const isAdmin = ['ADMIN', 'CEO', 'MANAGER'].includes(session.user.role);

    if (!isAssignedStaff && !isClient && !isAdmin) {
      // Log unauthorized access attempt
      await prisma.clientAssignmentAccessLog.create({
        data: {
          assignmentId: assignment.id,
          assignmentNumber: assignment.assignmentNumber,
          accessAttemptBy: session.user.id,
          accessorName: session.user.name || 'Unknown',
          accessorRole: session.user.role,
          wasGranted: false,
          denialReason: 'Not authorized - Client locked to another staff member',
        },
      });

      return NextResponse.json(
        { error: 'Access denied - This client is exclusively assigned to another staff member' },
        { status: 403 }
      );
    }

    if (action === 'CLOSE') {
      // Check if user can close
      if (isAssignedStaff && !assignment.canStaffClose) {
        return NextResponse.json(
          { error: 'Staff is not allowed to close this assignment' },
          { status: 403 }
        );
      }

      if (isClient && !assignment.canClientClose) {
        return NextResponse.json(
          { error: 'Client is not allowed to close this assignment' },
          { status: 403 }
        );
      }

      // Close assignment
      const updated = await prisma.exclusiveClientAssignment.update({
        where: { id: assignmentId },
        data: {
          transactionStatus: 'COMPLETED',
          actualCompletionDate: new Date(),
          actualValue: actualValue || assignment.actualValue,
          closedById: session.user.id,
          closedByType: isClient ? 'CLIENT' : 'STAFF',
          closureReason: closureReason || 'Transaction completed',
          closureNotes,
          closedAt: new Date(),
        },
      });

      // Update customer record
      await prisma.customer.updateMany({
        where: { userId: assignment.clientId },
        data: {
          hasExclusiveAssignment: false,
          exclusiveStaffId: null,
        },
      });

      // Log closure
      await prisma.clientAssignmentStatusHistory.create({
        data: {
          assignmentId: assignment.id,
          fromStatus: assignment.transactionStatus,
          toStatus: 'COMPLETED',
          changedBy: isClient ? 'CLIENT' : 'STAFF',
          changerId: session.user.id,
          changerName: session.user.name || 'Unknown',
          reason: closureReason || 'Transaction completed',
          notes: closureNotes,
          alertSentToStaff: true,
          alertSentToClient: true,
        },
      });

      // Send closure notifications
      if (assignment.staffEmailAlerts) {
        await sendEmail({
          to: assignment.staffEmail,
          subject: `Assignment Closed - ${assignment.assignmentNumber}`,
          html: `
            <h2>Assignment Closed</h2>
            <p>Assignment ${assignment.assignmentNumber} has been closed.</p>
            <p><strong>Client:</strong> ${assignment.clientName}</p>
            <p><strong>Closed by:</strong> ${session.user.name} (${isClient ? 'Client' : 'Staff'})</p>
            <p><strong>Reason:</strong> ${closureReason || 'Transaction completed'}</p>
            ${actualValue ? `<p><strong>Final Value:</strong> $${actualValue.toLocaleString()}</p>` : ''}
          `,
        });
      }

      if (assignment.clientEmailAlerts) {
        await sendEmail({
          to: assignment.clientEmail,
          subject: `Service Completed - ${assignment.assignmentNumber}`,
          html: `
            <h2>Service Completed</h2>
            <p>Your service assignment has been successfully completed.</p>
            <p><strong>Reference:</strong> ${assignment.assignmentNumber}</p>
            <p><strong>Representative:</strong> ${assignment.staffName}</p>
            <p>Thank you for choosing our services!</p>
          `,
        });
      }

      return NextResponse.json({ assignment: updated, message: 'Assignment closed successfully' });
    } else {
      // Regular update
      const updated = await prisma.exclusiveClientAssignment.update({
        where: { id: assignmentId },
        data: {
          ...updateData,
          transactionStatus: transactionStatus || assignment.transactionStatus,
          actualValue: actualValue !== undefined ? actualValue : assignment.actualValue,
        },
      });

      // Log status change if status changed
      if (transactionStatus && transactionStatus !== assignment.transactionStatus) {
        await prisma.clientAssignmentStatusHistory.create({
          data: {
            assignmentId: assignment.id,
            fromStatus: assignment.transactionStatus,
            toStatus: transactionStatus,
            changedBy: isClient ? 'CLIENT' : 'STAFF',
            changerId: session.user.id,
            changerName: session.user.name || 'Unknown',
            notes: updateData.notes || 'Status updated',
          },
        });
      }

      return NextResponse.json({ assignment: updated });
    }
  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}
