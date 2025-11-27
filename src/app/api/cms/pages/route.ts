import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isElevatedRole } from '@/lib/roles';

// GET /api/cms/pages - List all pages
export async function GET(req: NextRequest) {
  try {
    // Opportunistic scheduling processing
    const { runScheduling } = await import('@/lib/scheduling');
    await runScheduling();

    const session = await getServerSession(authOptions);
    
    // Public can only see published pages
    const { searchParams } = new URL(req.url);
    const publishedOnly = searchParams.get('published') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const where = publishedOnly || !session ? { published: true } : {};

    const pages = await prisma.page.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(pages);
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

// POST /api/cms/pages - Create a new page
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !isElevatedRole(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { 
      title, 
      slug, 
      content, 
      published,
      metaTitle,
      metaDescription,
      ogImage,
      canonicalUrl,
      noIndex,
      scheduledPublishAt,
      scheduledUnpublishAt,
    } = body;

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingPage = await prisma.page.findUnique({
      where: { slug },
    });

    if (existingPage) {
      return NextResponse.json(
        { error: 'A page with this slug already exists' },
        { status: 400 }
      );
    }

    // Create the page
    const page = await prisma.page.create({
      data: {
        title,
        slug,
        content: content || '',
        published: published || false,
        publishedAt: published ? new Date() : null,
          metaTitle,
          metaDescription,
          ogImage,
          canonicalUrl,
          noIndex: noIndex || false,
          scheduledPublishAt: scheduledPublishAt ? new Date(scheduledPublishAt) : null,
          scheduledUnpublishAt: scheduledUnpublishAt ? new Date(scheduledUnpublishAt) : null,
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    );
  }
}
