import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const permissionSchema = z.object({
  userId: z.string(),
  canManageUsers: z.boolean().optional(),
  canManageBlog: z.boolean().optional(),
  canManagePages: z.boolean().optional(),
  canManageSocial: z.boolean().optional(),
  canViewAnalytics: z.boolean().optional(),
  canManageProperty: z.boolean().optional(),
  canManageAutomotive: z.boolean().optional(),
  canManageFinance: z.boolean().optional(),
  canApproveRequests: z.boolean().optional(),
});

// GET - Fetch staff permissions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    
    // Only admins can view all permissions
    if (userRole !== 'ADMIN' && userRole !== 'CEO') {
      // Users can view their own permissions
      const { searchParams } = new URL(req.url);
      const userId = searchParams.get('userId');
      
      if (userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (userId) {
      // Get single user's permissions
      const permission = await prisma.staffPermission.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return NextResponse.json({ permission });
    } else {
      // Get all staff permissions
      const permissions = await prisma.staffPermission.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { grantedAt: 'desc' },
      });

      return NextResponse.json({ permissions });
    }
  } catch (error: any) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Grant or update staff permissions
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    
    // Only admins and CEO can grant permissions
    if (userRole !== 'ADMIN' && userRole !== 'CEO') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = permissionSchema.parse(body);

    // Check if user exists and is staff
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is staff
    const staffRoles = [
      'STAFF_AUTO',
      'STAFF_PROPERTY',
      'STAFF_SOCIAL_MEDIA',
      'MANAGER',
      'HR',
      'CEO',
      'CONTENT_EDITOR',
    ];

    if (!staffRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'User must have a staff role to grant permissions' },
        { status: 400 }
      );
    }

    // Upsert permissions
    const permission = await prisma.staffPermission.upsert({
      where: { userId: validatedData.userId },
      create: {
        ...validatedData,
        grantedBy: session.user.id,
      },
      update: {
        ...validatedData,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        userId: session.user.id,
        targetModel: 'StaffPermission',
        targetId: permission.id,
        changes: validatedData,
      },
    });

    return NextResponse.json({
      success: true,
      permission,
      message: 'Permissions updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating permissions:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update permissions', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Revoke all permissions
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    
    if (userRole !== 'ADMIN' && userRole !== 'CEO') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    await prisma.staffPermission.delete({
      where: { userId },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        userId: session.user.id,
        targetModel: 'StaffPermission',
        targetId: userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Permissions revoked successfully',
    });
  } catch (error: any) {
    console.error('Error revoking permissions:', error);
    return NextResponse.json(
      { error: 'Failed to revoke permissions', details: error.message },
      { status: 500 }
    );
  }
}
