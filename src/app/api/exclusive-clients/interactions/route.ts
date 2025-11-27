import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { sendSMS } from '@/lib/sms';

// POST - Add interaction to assignment
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      assignmentId,
      interactionType,
      subject,
      details,
      duration,
      location,
      latitude,
      longitude,
      attachments,
      requiresFollowUp,
      followUpDate,
      followUpNotes,
    } = body;

    // Get assignment and verify access
    const assignment = await prisma.exclusiveClientAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const isAssignedStaff = assignment.staffId === session.user.id;
    const isClient = assignment.clientId === session.user.id;

    if (!isAssignedStaff && !isClient) {
      return NextResponse.json(
        { error: 'Access denied - Only assigned staff or client can add interactions' },
        { status: 403 }
      );
    }

    // Create interaction
    const interaction = await prisma.clientAssignmentInteraction.create({
      data: {
        assignmentId,
        interactionType,
        initiatedBy: isClient ? 'CLIENT' : 'STAFF',
        initiatorId: session.user.id,
        initiatorName: session.user.name || 'Unknown',
        subject,
        details,
        duration,
        location,
        latitude,
        longitude,
        attachments,
        requiresFollowUp: requiresFollowUp || false,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        followUpNotes,
      },
    });

    // Update assignment metrics
    await prisma.exclusiveClientAssignment.update({
      where: { id: assignmentId },
      data: {
        totalInteractions: { increment: 1 },
        lastContactDate: new Date(),
        nextFollowUpDate: requiresFollowUp && followUpDate ? new Date(followUpDate) : undefined,
      },
    });

    // Send alerts
    let alertSentToStaff = false;
    let alertSentToClient = false;

    // If client initiated, alert staff
    if (isClient && assignment.staffEmailAlerts) {
      await sendEmail({
        to: assignment.staffEmail,
        subject: `Client Interaction - ${assignment.assignmentNumber}`,
        html: `
          <h2>New Client Interaction</h2>
          <p><strong>Assignment:</strong> ${assignment.assignmentNumber}</p>
          <p><strong>Client:</strong> ${assignment.clientName}</p>
          <p><strong>Type:</strong> ${interactionType.replace(/_/g, ' ')}</p>
          ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
          <p><strong>Details:</strong> ${details}</p>
          ${requiresFollowUp ? `<p><strong>Follow-up Required:</strong> ${new Date(followUpDate).toLocaleDateString()}</p>` : ''}
        `,
      });
      alertSentToStaff = true;

      if (assignment.staffSmsAlerts && assignment.staffPhone) {
        await sendSMS(
          assignment.staffPhone,
          `${assignment.clientName} contacted you - ${interactionType.replace(/_/g, ' ')}. ${assignment.assignmentNumber}`
        );
      }
    }

    // If staff initiated, alert client
    if (isAssignedStaff && assignment.clientEmailAlerts) {
      await sendEmail({
        to: assignment.clientEmail,
        subject: `Update from ${assignment.staffName}`,
        html: `
          <h2>Service Update</h2>
          <p><strong>From:</strong> ${assignment.staffName}</p>
          <p><strong>Reference:</strong> ${assignment.assignmentNumber}</p>
          <p><strong>Type:</strong> ${interactionType.replace(/_/g, ' ')}</p>
          ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
          <p><strong>Message:</strong> ${details}</p>
          ${requiresFollowUp ? `<p><strong>Next Contact:</strong> ${new Date(followUpDate).toLocaleDateString()}</p>` : ''}
        `,
      });
      alertSentToClient = true;

      if (assignment.clientSmsAlerts && assignment.clientPhone) {
        await sendSMS(
          assignment.clientPhone,
          `Update from ${assignment.staffName}: ${interactionType.replace(/_/g, ' ')}. ${assignment.assignmentNumber}`
        );
      }
    }

    // Update interaction with alert status
    await prisma.clientAssignmentInteraction.update({
      where: { id: interaction.id },
      data: {
        alertSentToStaff,
        alertSentToClient,
      },
    });

    return NextResponse.json({ interaction }, { status: 201 });
  } catch (error) {
    console.error('Error creating interaction:', error);
    return NextResponse.json(
      { error: 'Failed to create interaction' },
      { status: 500 }
    );
  }
}

// GET - Fetch interactions for assignment
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 });
    }

    // Verify access
    const assignment = await prisma.exclusiveClientAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const isAssignedStaff = assignment.staffId === session.user.id;
    const isClient = assignment.clientId === session.user.id;
    const isAdmin = ['ADMIN', 'CEO', 'MANAGER'].includes(session.user.role);

    if (!isAssignedStaff && !isClient && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const interactions = await prisma.clientAssignmentInteraction.findMany({
      where: { assignmentId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ interactions });
  } catch (error) {
    console.error('Error fetching interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
}
