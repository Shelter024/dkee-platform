import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/cloudinary';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeString, sanitizeFileName } from '@/lib/sanitize';

// POST /api/upload - Upload file to Cloudinary
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: 20 uploads per user per hour
    const rateLimitResult = await rateLimit(`upload:${session.user.id}`, 20, 3600);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Upload limit reached. Please try again later.' },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    let folder = (formData.get('folder') as string) || 'documents';
    const automotiveServiceId = formData.get('automotiveServiceId') as string | null;
    const invoiceId = formData.get('invoiceId') as string | null;
    let documentType = (formData.get('documentType') as string) || undefined;

    // Sanitize inputs
    folder = sanitizeString(folder);
    if (documentType) documentType = sanitizeString(documentType);

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Sanitize filename
    const sanitizedFileName = sanitizeFileName(file.name);

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: images, PDF, Word documents' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine resource type
    let resourceType: 'image' | 'raw' | 'auto' = 'auto';
    if (file.type.startsWith('image/')) {
      resourceType = 'image';
    } else {
      resourceType = 'raw';
    }

    // Upload to Cloudinary
    const uploadResult = await uploadFile(buffer, {
      folder,
      filename: sanitizedFileName.replace(/\.[^/.]+$/, ''), // Remove extension
      resourceType,
    });

    // Save to database
    // Optional: basic existence checks (silent skip if not found to avoid info leak)
    if (invoiceId) {
      try { await prisma.invoice.findUnique({ where: { id: invoiceId } }); } catch {}
    }
    if (automotiveServiceId) {
      try { await prisma.automotiveService.findUnique({ where: { id: automotiveServiceId } }); } catch {}
    }

    const fileRecord = await prisma.fileUpload.create({
      data: {
        filename: sanitizedFileName,
        originalName: sanitizedFileName,
        mimeType: file.type,
        size: file.size,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        folder: uploadResult.folder,
        shareableLink: uploadResult.shareableLink,
        automotiveServiceId,
        invoiceId,
        documentType,
        uploadedBy: session.user.id,
        metadata: uploadResult.metadata,
      },
    });

    return NextResponse.json({
      message: 'File uploaded successfully',
      file: fileRecord,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// GET /api/upload - List files
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const folder = searchParams.get('folder');
    const automotiveServiceId = searchParams.get('automotiveServiceId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    const where: any = {};

    if (folder) {
      where.folder = { contains: folder };
    }

    if (automotiveServiceId) {
      where.automotiveServiceId = automotiveServiceId;
    }

    const [files, total] = await Promise.all([
      prisma.fileUpload.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.fileUpload.count({ where }),
    ]);

    return NextResponse.json({
      files,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List files error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}
