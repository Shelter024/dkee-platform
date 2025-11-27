import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const form = await req.formData();
    const file = form.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Max file size is 5MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadFile(buffer, { folder: 'avatars', filename: session.user.id, resourceType: 'image' });

    await prisma.user.update({ where: { id: session.user.id }, data: { image: uploaded.url } });
    return NextResponse.json({ url: uploaded.url, publicId: uploaded.publicId });
  } catch (e) {
    console.error('Avatar upload error', e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
