import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isElevatedRole } from '@/lib/roles';

// GET /api/cms/pages/[id] - Get a single page
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const page = await prisma.page.findUnique({
      where: { id: params.id },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Non-authenticated users can only see published pages
    if (!page.published && !session) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 }
    );
  }
}

// PUT /api/cms/pages/[id] - Update a page
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if page exists
    const existingPage = await prisma.page.findUnique({
      where: { id: params.id },
    });

    if (!existingPage) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // If slug is being changed, check if new slug is available
    if (slug && slug !== existingPage.slug) {
      const slugTaken = await prisma.page.findUnique({
        where: { slug },
      });

      if (slugTaken) {
        return NextResponse.json(
          { error: 'A page with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Set publishedAt timestamp if publishing for the first time
    const publishedAt =
      published && !existingPage.published
        ? new Date()
        : existingPage.publishedAt;

    // Save a revision before updating
    await prisma.pageRevision.create({
      data: {
        pageId: existingPage.id,
        title: existingPage.title,
        slug: existingPage.slug,
        content: existingPage.content,
        published: existingPage.published,
        metaTitle: (existingPage as any).metaTitle ?? undefined,
        metaDescription: (existingPage as any).metaDescription ?? undefined,
        ogImage: (existingPage as any).ogImage ?? undefined,
        canonicalUrl: (existingPage as any).canonicalUrl ?? undefined,
        noIndex: (existingPage as any).noIndex ?? false,
        publishedAt: existingPage.publishedAt ?? undefined,
        scheduledPublishAt: (existingPage as any).scheduledPublishAt ?? undefined,
        scheduledUnpublishAt: (existingPage as any).scheduledUnpublishAt ?? undefined,
      },
    });

    // Update the page
    const page = await prisma.page.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(content !== undefined && { content }),
        ...(published !== undefined && { published }),
        ...(published !== undefined && { publishedAt }),
          ...(metaTitle !== undefined && { metaTitle }),
          ...(metaDescription !== undefined && { metaDescription }),
          ...(ogImage !== undefined && { ogImage }),
          ...(canonicalUrl !== undefined && { canonicalUrl }),
          ...(noIndex !== undefined && { noIndex }),
          ...(scheduledPublishAt !== undefined && { 
            scheduledPublishAt: scheduledPublishAt ? new Date(scheduledPublishAt) : null 
          }),
          ...(scheduledUnpublishAt !== undefined && { 
            scheduledUnpublishAt: scheduledUnpublishAt ? new Date(scheduledUnpublishAt) : null 
          }),
      },
    });

    return NextResponse.json(page);
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 }
    );
  }
}

// DELETE /api/cms/pages/[id] - Delete a page
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !isElevatedRole(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if page exists
    const page = await prisma.page.findUnique({
      where: { id: params.id },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Delete the page
    await prisma.page.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json(
      { error: 'Failed to delete page' },
      { status: 500 }
    );
  }
}
