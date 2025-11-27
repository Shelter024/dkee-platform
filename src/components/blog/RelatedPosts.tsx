import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

interface RelatedPostsProps {
  currentPostId: string;
  tags: string[];
  limit?: number;
}

export async function RelatedPosts({ currentPostId, tags, limit = 3 }: RelatedPostsProps) {
  // Find posts with matching tags
  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      id: { not: currentPostId },
      published: true,
      tags: {
        hasSome: tags,
      },
    },
    include: {
      author: true,
    },
    orderBy: {
      publishedAt: 'desc',
    },
    take: limit,
  });

  // If no related posts by tags, get most recent posts
  if (relatedPosts.length === 0) {
    const recentPosts = await prisma.blogPost.findMany({
      where: {
        id: { not: currentPostId },
        published: true,
      },
      include: {
        author: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: limit,
    });

    if (recentPosts.length === 0) {
      return null; // No posts to show
    }

    return (
      <section className="mt-16 pt-16 border-t">
        <h2 className="text-3xl font-bold mb-8">Recent Posts</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {recentPosts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                {post.coverImage && (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-40 object-cover rounded-t-lg"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-bold mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="text-xs text-gray-500">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString()
                      : 'Draft'}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-16 pt-16 border-t">
      <h2 className="text-3xl font-bold mb-8">Related Posts</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {relatedPosts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              {post.coverImage && (
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-40 object-cover rounded-t-lg"
                />
              )}
              <div className="p-4">
                <div className="flex flex-wrap gap-1 mb-2">
                  {post.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-brand-gold-500 text-white text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-lg font-bold mb-2 line-clamp-2">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
                <div className="text-xs text-gray-500">
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString()
                    : 'Draft'}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
