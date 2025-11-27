import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/cloudinary';

// POST - Upload document for property request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const formData = await req.formData();
    
    const file = formData.get('file') as File;
    const propertyRequestId = formData.get('propertyRequestId') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!propertyRequestId) {
      return NextResponse.json({ error: 'Property request ID required' }, { status: 400 });
    }

    // Check if request exists
    const request = await prisma.propertyRequest.findUnique({
      where: { id: propertyRequestId },
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Verify user has permission to upload
    const userId = session?.user?.id || null;
    const userRole = session?.user ? (session.user as any).role : null;
    const hasPropertyAccess = userRole && ['ADMIN', 'STAFF_PROPERTY', 'CEO', 'MANAGER'].includes(userRole);

    if (!hasPropertyAccess && request.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate file type and size
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PDF, Images, Word documents' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await uploadFile(buffer, {
      folder: `property-requests/${propertyRequestId}`,
      resourceType: 'auto',
    });

    // Save document record
    const document = await prisma.propertyRequestDocument.create({
      data: {
        propertyRequestId,
        fileName: file.name,
        fileUrl: uploadResult.url,
        fileSize: file.size,
        fileType: file.type,
        uploadedBy: userId || 'guest',
      },
    });

    return NextResponse.json({
      success: true,
      document,
      message: 'File uploaded successfully',
    });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove document
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    const document = await prisma.propertyRequestDocument.findUnique({
      where: { id },
      include: {
        propertyRequest: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check permissions
    const userId = session.user.id;
    const userRole = (session.user as any).role;
    const hasPropertyAccess = ['ADMIN', 'STAFF_PROPERTY', 'CEO', 'MANAGER'].includes(userRole);

    if (!hasPropertyAccess && document.propertyRequest.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.propertyRequestDocument.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document', details: error.message },
      { status: 500 }
    );
  }
}
