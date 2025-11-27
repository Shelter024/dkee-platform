import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = await prisma.staffPermission.findUnique({
      where: { userId: session.user.id },
    });

    if (!permissions?.canApproveLeaveRequests && !['CEO', 'ADMIN', 'HR', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await req.json();
    const { action, rejectionReason } = body;

    if (action === 'APPROVE') {
      const updated = await prisma.leaveRequest.update({
        where: { id: params.id },
        data: {
          status: 'APPROVED',
          approvedById: session.user.id,
          approvedAt: new Date(),
        },
      });

      return NextResponse.json({ message: 'Leave approved', leave: updated });
    }

    if (action === 'REJECT') {
      const updated = await prisma.leaveRequest.update({
        where: { id: params.id },
        data: {
          status: 'REJECTED',
          approvedById: session.user.id,
          approvedAt: new Date(),
          rejectionReason,
        },
      });

      return NextResponse.json({ message: 'Leave rejected', leave: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
