import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { draftMode } from 'next/headers';

export const metadata: Metadata = {
  title: 'Blog | DK Executive Engineers',
  description: 'Latest insights and updates from DK Executive Engineers',
};

const POSTS_PER_PAGE = 12;

interface BlogPageProps {
  searchParams: { page?: string; tag?: string };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { isEnabled } = draftMode();
  const currentPage = Number(searchParams.page) || 1;
  const tag = searchParams.tag;

  // Build where clause
  const where = {
    ...(isEnabled ? {} : { published: true }),
    ...(tag ? { tags: { has: tag } } : {}),
  };

  // Get total count for pagination
  const totalPosts = await prisma.blogPost.count({ where });
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);

  // Get posts for current page
  const posts = await prisma.blogPost.findMany({
    where,
    include: { author: true },
    orderBy: { publishedAt: 'desc' },
    skip: (currentPage - 1) * POSTS_PER_PAGE,
    take: POSTS_PER_PAGE,
  });

  // Get all tags for filter
  const allPosts = await prisma.blogPost.findMany({
    where: isEnabled ? {} : { published: true },
    select: { tags: true },
  });
  const allTags = Array.from(new Set(allPosts.flatMap((p) => p.tags))).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-brand-navy-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {tag ? `Posts tagged: ${tag}` : 'Blog'}
          </h1>
          <p className="text-xl text-gray-300">
            Insights, updates, and expertise from our team
          </p>
        </div>
      </section>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <section className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap gap-2">
              <Link href="/blog">
                <span
                  className={`px-3 py-1 rounded text-sm transition-colors cursor-pointer ${
                    !tag
                      ? 'bg-brand-gold-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Posts
                </span>
              </Link>
              {allTags.map((t) => (
                <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`}>
                  <span
                    className={`px-3 py-1 rounded text-sm transition-colors cursor-pointer ${
                      tag === t
                        ? 'bg-brand-gold-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Blog Posts */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length === 0 ? (
          <Card className="p-12">
            <div className="text-center text-gray-500">
              <p className="text-xl">
                {tag ? `No posts found with tag "${tag}"` : 'No blog posts published yet'}
              </p>
              <p className="mt-2">
                {tag ? (
                  <Link href="/blog" className="text-brand-gold-600 hover:underline">
                    View all posts
                  </Link>
                ) : (
                  'Check back soon for updates!'
                )}
              </p>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    {post.coverImage && (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    )}
                    <div className="p-6">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="px-2 py-1 bg-brand-gold-500 text-white text-xs rounded"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <h2 className="text-xl font-bold mb-2 line-clamp-2">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{post.author.name}</span>
                        <span>
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString()
                            : 'Draft'}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  baseUrl={tag ? `/blog?tag=${encodeURIComponent(tag)}` : '/blog'}
                />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
