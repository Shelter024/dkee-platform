import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// GET - Fetch leave requests
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const canViewAll = ['CEO', 'ADMIN', 'HR', 'MANAGER', 'ADMIN_MANAGER'].includes(session.user.role);

    const where: any = {};
    if (!canViewAll) where.employeeId = session.user.id;
    if (status) where.status = status;

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: { select: { name: true, staffId: true, department: true } },
        approvedBy: { select: { name: true, staffId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create leave request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { leaveType, startDate, endDate, reason, coveringStaffId, coveringStaffName, attachments } = body;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const numberOfDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const count = await prisma.leaveRequest.count();
    const leaveNumber = `LV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { department: true },
    });

    const leave = await prisma.leaveRequest.create({
      data: {
        leaveNumber,
        employeeId: session.user.id,
        employeeName: session.user.name || 'Unknown',
        department: user?.department || '',
        leaveType,
        startDate: start,
        endDate: end,
        numberOfDays,
        reason,
        coveringStaffId,
        coveringStaffName,
        status: 'PENDING',
        attachments: attachments || [],
      },
    });

    // Notify approvers
    const approvers = await prisma.user.findMany({
      where: { role: { in: ['CEO', 'ADMIN', 'HR', 'MANAGER'] } },
      select: { email: true, name: true },
    });

    for (const approver of approvers) {
      await sendEmail({
        to: approver.email,
        subject: `Leave Request Approval Required: ${leaveNumber}`,
        html: `<h2>New Leave Request</h2><p>${leaveType} - ${numberOfDays} days</p>`,
      });
    }

    return NextResponse.json({ message: 'Leave request submitted', leave });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
