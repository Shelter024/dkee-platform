import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const socialMediaPostSchema = z.object({
  platform: z.enum(['FACEBOOK', 'INSTAGRAM', 'TWITTER', 'TIKTOK', 'LINKEDIN']),
  title: z.string().optional(),
  content: z.string(),
  mediaUrls: z.array(z.string()).default([]),
  scheduledFor: z.string().datetime().optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED']).default('DRAFT'),
});

// Check if user has social media permissions
async function checkSocialMediaAccess(userId: string, userRole: string) {
  if (['ADMIN', 'CEO'].includes(userRole)) {
    return true;
  }

  if (userRole === 'STAFF_SOCIAL_MEDIA') {
    const permissions = await prisma.staffPermission.findUnique({
      where: { userId },
    });
    return permissions?.canManageSocial || false;
  }

  return false;
}

// GET - Fetch social media posts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = (session.user as any).role;

    const hasAccess = await checkSocialMediaAccess(userId, userRole);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');

    const where: any = {};
    if (platform) where.platform = platform;
    if (status) where.status = status;

    const posts = await prisma.socialMediaPost.findMany({
      where,
      orderBy: [
        { scheduledFor: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error('Error fetching social media posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create social media post
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = (session.user as any).role;

    const hasAccess = await checkSocialMediaAccess(userId, userRole);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = socialMediaPostSchema.parse(body);

    const post = await prisma.socialMediaPost.create({
      data: {
        ...validatedData,
        scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : null,
        createdBy: userId,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        userId,
        targetModel: 'SocialMediaPost',
        targetId: post.id,
      },
    });

    return NextResponse.json({
      success: true,
      post,
      message: 'Post created successfully',
    });
  } catch (error: any) {
    console.error('Error creating social media post:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create post', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update social media post
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = (session.user as any).role;

    const hasAccess = await checkSocialMediaAccess(userId, userRole);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    const existingPost = await prisma.socialMediaPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // If publishing, set published fields
    if (updateData.status === 'PUBLISHED' && existingPost.status !== 'PUBLISHED') {
      updateData.publishedAt = new Date();
      updateData.publishedBy = userId;
    }

    const post = await prisma.socialMediaPost.update({
      where: { id },
      data: {
        ...updateData,
        scheduledFor: updateData.scheduledFor ? new Date(updateData.scheduledFor) : undefined,
        updatedAt: new Date(),
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        userId,
        targetModel: 'SocialMediaPost',
        targetId: post.id,
        changes: updateData,
      },
    });

    return NextResponse.json({
      success: true,
      post,
      message: 'Post updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating social media post:', error);
    return NextResponse.json(
      { error: 'Failed to update post', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete social media post
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = (session.user as any).role;

    const hasAccess = await checkSocialMediaAccess(userId, userRole);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    await prisma.socialMediaPost.delete({ where: { id } });

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        userId,
        targetModel: 'SocialMediaPost',
        targetId: id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting social media post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post', details: error.message },
      { status: 500 }
    );
  }
}
