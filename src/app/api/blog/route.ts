import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isElevatedRole } from '@/lib/roles';

// GET /api/blog - List all blog posts (with optional filters)
export async function GET(req: NextRequest) {
  try {
    // Opportunistic scheduling processing
    const { runScheduling } = await import('@/lib/scheduling');
    await runScheduling();

    const { searchParams } = new URL(req.url);
    const published = searchParams.get('published');
    const limit = searchParams.get('limit');

    const where: any = {};
    if (published === 'true') {
      where.published = true;
    }

    const posts = await prisma.blogPost.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json({ ok: true, posts });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/blog - Create a new blog post
export async function POST(req: NextRequest) {
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

    if (!title || !content) {
      return NextResponse.json(
        { ok: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    const finalSlug = slug || title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existing = await prisma.blogPost.findUnique({
      where: { slug: finalSlug },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: 'A post with this slug already exists' },
        { status: 400 }
      );
    }

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug: finalSlug,
        content,
        excerpt: excerpt || content.substring(0, 200),
        tags: tags || [],
        coverImage: featuredImage,
        published: published || false,
        publishedAt: published ? new Date() : null,
          metaTitle,
          metaDescription,
          ogImage,
          canonicalUrl,
          noIndex: noIndex || false,
          scheduledPublishAt: scheduledPublishAt ? new Date(scheduledPublishAt) : null,
          scheduledUnpublishAt: scheduledUnpublishAt ? new Date(scheduledUnpublishAt) : null,
        authorId: session.user.id,
      },
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

    return NextResponse.json({ ok: true, post }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
