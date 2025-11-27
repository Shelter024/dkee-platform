import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/cms/config - Get Cloudinary config for upload widget
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch Cloudinary settings from database
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_UPLOAD_PRESET'],
        },
      },
    });

    const cloudName = settings.find((s: { key: string }) => s.key === 'CLOUDINARY_CLOUD_NAME')?.value;
    let uploadPreset = settings.find((s: { key: string }) => s.key === 'CLOUDINARY_UPLOAD_PRESET')?.value;

    // If no upload preset configured, use default or create one
    if (!uploadPreset) {
      uploadPreset = 'dkee_unsigned_uploads';
    }

    // Fallback to env if not in database
    const finalCloudName = cloudName || process.env.CLOUDINARY_CLOUD_NAME || '';

    return NextResponse.json({
      cloudName: finalCloudName,
      uploadPreset,
    });
  } catch (error) {
    console.error('Error fetching Cloudinary config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}
