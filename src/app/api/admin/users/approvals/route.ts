import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { 
  sendAccountApprovedEmail, 
  sendAccountRejectedEmail 
} from '@/lib/email-verification';

// GET /api/admin/users/approvals - List pending approvals
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'PENDING_APPROVAL';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      role: 'CUSTOMER',
    };

    if (status !== 'ALL') {
      where.accountStatus = status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          customer: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        accountStatus: user.accountStatus,
        emailVerified: !!user.emailVerified,
        phoneVerified: user.phoneVerified,
        rejectionReason: user.rejectionReason,
        approvedBy: user.approvedBy,
        approvedAt: user.approvedAt,
        createdAt: user.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending approvals' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users/approvals - Approve or reject user
const approvalSchema = z.object({
  userId: z.string(),
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = approvalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { userId, action, rejectionReason } = validation.data;

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Only customer accounts can be approved/rejected' },
        { status: 400 }
      );
    }

    const updateData: any = {
      approvedBy: session.user.id,
      approvedAt: new Date(),
    };

    if (action === 'approve') {
      updateData.accountStatus = 'APPROVED';
      updateData.rejectionReason = null;
    } else {
      if (!rejectionReason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        );
      }
      updateData.accountStatus = 'REJECTED';
      updateData.rejectionReason = rejectionReason;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Send notification email
    try {
      if (action === 'approve') {
        await sendAccountApprovedEmail(updatedUser.email, updatedUser.name);
      } else {
        await sendAccountRejectedEmail(
          updatedUser.email,
          updatedUser.name,
          rejectionReason!
        );
      }
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Don't fail the approval if email fails
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId: updatedUser.id,
        title: action === 'approve' ? 'Account Approved!' : 'Account Registration Update',
        message:
          action === 'approve'
            ? 'Your account has been approved. You now have full access to all features.'
            : `Your account registration was not approved. Reason: ${rejectionReason}`,
        type: action === 'approve' ? 'SUCCESS' : 'WARNING',
      },
    });

    return NextResponse.json({
      message: `User ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        accountStatus: updatedUser.accountStatus,
      },
    });
  } catch (error) {
    console.error('Error processing approval:', error);
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}
