import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isElevatedRole } from '@/lib/roles';

// GET /api/blog/[id] - Get a single blog post
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { ok: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, post });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/blog/[id] - Update a blog post
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isElevatedRole(session.user.role)) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { 
      title, 
      slug, 
      content, 
      excerpt, 
      tags, 
      featuredImage, 
      published,
      metaTitle,
      metaDescription,
      ogImage,
      canonicalUrl,
      noIndex,
      scheduledPublishAt,
      scheduledUnpublishAt,
    } = body;

    const existing = await prisma.blogPost.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // If slug is changing, check if new slug is available
    if (slug && slug !== existing.slug) {
      const slugTaken = await prisma.blogPost.findUnique({
        where: { slug },
      });
      if (slugTaken) {
        return NextResponse.json(
          { ok: false, error: 'Slug already in use' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (tags !== undefined) updateData.tags = tags;
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
      if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
      if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
      if (ogImage !== undefined) updateData.ogImage = ogImage;
      if (canonicalUrl !== undefined) updateData.canonicalUrl = canonicalUrl;
      if (noIndex !== undefined) updateData.noIndex = noIndex;
      if (scheduledPublishAt !== undefined) {
        updateData.scheduledPublishAt = scheduledPublishAt ? new Date(scheduledPublishAt) : null;
      }
      if (scheduledUnpublishAt !== undefined) {
        updateData.scheduledUnpublishAt = scheduledUnpublishAt ? new Date(scheduledUnpublishAt) : null;
      }
    if (published !== undefined) {
      updateData.published = published;
      // Set publishedAt when publishing for the first time
      if (published && !existing.published) {
        updateData.publishedAt = new Date();
      }
    }

    // Save a revision before applying update (if something is changing)
    await prisma.blogPostRevision.create({
      data: {
        blogPostId: existing.id,
        title: existing.title,
        slug: existing.slug,
        content: existing.content,
        excerpt: existing.excerpt ?? undefined,
        coverImage: existing.coverImage ?? undefined,
        tags: existing.tags,
        published: existing.published,
        metaTitle: (existing as any).metaTitle ?? undefined,
        metaDescription: (existing as any).metaDescription ?? undefined,
        ogImage: (existing as any).ogImage ?? undefined,
        canonicalUrl: (existing as any).canonicalUrl ?? undefined,
        noIndex: (existing as any).noIndex ?? false,
        publishedAt: existing.publishedAt ?? undefined,
        scheduledPublishAt: (existing as any).scheduledPublishAt ?? undefined,
        scheduledUnpublishAt: (existing as any).scheduledUnpublishAt ?? undefined,
      },
    });

    const post = await prisma.blogPost.update({
      where: { id: params.id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, post });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/blog/[id] - Delete a blog post
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isElevatedRole(session.user.role)) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const post = await prisma.blogPost.findUnique({
      where: { id: params.id },
    });

    if (!post) {
      return NextResponse.json(
        { ok: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    await prisma.blogPost.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true, message: 'Post deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
