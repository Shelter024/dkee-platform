import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const manageUserSchema = z.object({
  userId: z.string(),
  action: z.enum(['suspend', 'unsuspend', 'delete', 'warn']),
  reason: z.string().optional(),
  warningMessage: z.string().optional(),
});

// POST /api/admin/users/manage - Suspend, delete, warn, or unsuspend users
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = manageUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { userId, action, reason, warningMessage } = validation.data;

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admin from deleting/suspending themselves
    if (user.id === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot perform this action on yourself' },
        { status: 400 }
      );
    }

    // Prevent non-super admins from managing other admins (optional safeguard)
    if (user.role === 'ADMIN' || user.role === 'CEO') {
      return NextResponse.json(
        { error: 'Cannot manage admin or CEO accounts' },
        { status: 403 }
      );
    }

    let updatedUser;
    let notificationMessage = '';
    let notificationType: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO';

    switch (action) {
      case 'suspend':
        if (!reason) {
          return NextResponse.json(
            { error: 'Reason required for suspension' },
            { status: 400 }
          );
        }
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            accountStatus: 'SUSPENDED',
            rejectionReason: reason,
          },
        });
        notificationMessage = `Your account has been suspended. Reason: ${reason}. Contact support for assistance.`;
        notificationType = 'ERROR';
        break;

      case 'unsuspend':
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            accountStatus: 'APPROVED',
            rejectionReason: null,
          },
        });
        notificationMessage = 'Your account has been reactivated. You can now access all features.';
        notificationType = 'SUCCESS';
        break;

      case 'delete':
        if (!reason) {
          return NextResponse.json(
            { error: 'Reason required for deletion' },
            { status: 400 }
          );
        }
        // Soft delete or hard delete - here we'll do hard delete
        await prisma.user.delete({
          where: { id: userId },
        });
        return NextResponse.json({
          message: 'User deleted successfully',
          userId,
        });

      case 'warn':
        if (!warningMessage) {
          return NextResponse.json(
            { error: 'Warning message required' },
            { status: 400 }
          );
        }
        updatedUser = user; // User stays as-is
        notificationMessage = `Warning from Admin: ${warningMessage}`;
        notificationType = 'WARNING';
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Create notification for the user (delete case returned earlier)
    await prisma.notification.create({
      data: {
        userId: updatedUser!.id,
        title: action === 'warn' ? 'Account Warning' : 'Account Status Update',
        message: notificationMessage,
        type: notificationType,
      },
    });

    // Log the action in audit system (optional - create AuditLog model if needed)
    // For now, we'll just return success

    return NextResponse.json({
      message: `User ${action === 'suspend' ? 'suspended' : action === 'unsuspend' ? 'unsuspended' : 'warned'} successfully`,
      user: {
        id: updatedUser!.id,
        name: updatedUser!.name,
        email: updatedUser!.email,
        accountStatus: updatedUser!.accountStatus,
      },
    });
  } catch (error) {
    console.error('Error managing user:', error);
    return NextResponse.json(
      { error: 'Failed to manage user' },
      { status: 500 }
    );
  }
}
