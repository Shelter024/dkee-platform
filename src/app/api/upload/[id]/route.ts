import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deleteFile } from '@/lib/cloudinary';
import { isAdmin, isStaff } from '@/lib/roles';

// GET /api/upload/[id] - Get file details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const file = await prisma.fileUpload.findUnique({
      where: { id: params.id },
      include: {
        automotiveService: {
          include: {
            customer: {
              include: {
                user: true,
              },
            },
          },
        },
        invoice: {
          include: {
            customer: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check access permissions
    const isOwner = 
      file.automotiveService?.customer.userId === session.user.id ||
      file.invoice?.customer.userId === session.user.id;
    const hasStaffAccess = isAdmin(session.user) || isStaff(session.user);

    if (!isOwner && !hasStaffAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ file });
  } catch (error) {
    console.error('Get file error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: 500 }
    );
  }
}

// DELETE /api/upload/[id] - Delete file (Staff/Admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only staff and admin can delete files
    if (!isAdmin(session.user) && !isStaff(session.user)) {
      return NextResponse.json(
        { error: 'Forbidden. Only staff and admins can delete files.' },
        { status: 403 }
      );
    }

    const file = await prisma.fileUpload.findUnique({
      where: { id: params.id },
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete from Cloudinary if publicId exists
    if (file.publicId) {
      try {
        await deleteFile(file.publicId);
      } catch (cloudinaryError) {
        console.error('Cloudinary deletion failed:', cloudinaryError);
        // Continue with database deletion even if Cloudinary fails
      }
    }

    // Delete from database
    await prisma.fileUpload.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
