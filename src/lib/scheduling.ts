import { prisma } from '@/lib/prisma';

/**
 * Process scheduled publish/unpublish for BlogPost and Page.
 * This runs opportunistically at read-time to avoid a background worker.
 */
export async function runScheduling() {
  const now = new Date();
  try {
    // Publish blog posts whose scheduledPublishAt has passed
    await prisma.blogPost.updateMany({
      where: {
        published: false,
        scheduledPublishAt: { lte: now },
      },
      data: {
        published: true,
        publishedAt: now,
      },
    });

    // Unpublish blog posts whose scheduledUnpublishAt has passed
    await prisma.blogPost.updateMany({
      where: {
        published: true,
        scheduledUnpublishAt: { lte: now },
      },
      data: {
        published: false,
      },
    });

    // Publish pages
    await prisma.page.updateMany({
      where: {
        published: false,
        scheduledPublishAt: { lte: now },
      },
      data: {
        published: true,
        publishedAt: now,
      },
    });

    // Unpublish pages
    await prisma.page.updateMany({
      where: {
        published: true,
        scheduledUnpublishAt: { lte: now },
      },
      data: {
        published: false,
      },
    });
  } catch (err) {
    console.error('Scheduling processing error:', err);
  }
}
