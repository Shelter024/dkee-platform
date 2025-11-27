import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import { draftMode } from 'next/headers';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { isEnabled } = draftMode();
  const post = await prisma.blogPost.findFirst({
    where: { slug: params.slug, ...(isEnabled ? {} : { published: true }) },
  });

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.metaTitle || `${post.title} | DK Executive Engineers Blog`,
    description: post.metaDescription || post.excerpt || undefined,
    openGraph: post.ogImage
      ? { images: [{ url: post.ogImage, alt: post.title }] }
      : undefined,
    robots: post.noIndex ? { index: false, follow: false } : undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { isEnabled } = draftMode();
  const post = await prisma.blogPost.findFirst({
    where: { slug: params.slug, ...(isEnabled ? {} : { published: true }) },
    include: { author: true },
  });

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-brand-navy-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Breadcrumbs
              items={[
                { label: 'Blog', href: '/blog' },
                { label: post.title },
              ]}
            />
          </div>
          <Link href="/blog">
            <Button variant="outline" className="mb-6 text-white border-white hover:bg-white hover:text-brand-navy-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                  <span className="px-3 py-1 bg-brand-gold-500 text-white text-sm rounded hover:bg-brand-gold-600 transition-colors cursor-pointer">
                    {tag}
                  </span>
                </Link>
              ))}
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-gray-300">
            <span>{post.author.name}</span>
            <span>•</span>
            <span>{new Date(post.publishedAt!).toLocaleDateString()}</span>
          </div>
        </div>
      </section>

      {/* Cover Image */}
      {post.coverImage && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-96 object-cover rounded-lg shadow-xl"
          />
        </div>
      )}

      {/* Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Related Posts */}
        <RelatedPosts currentPostId={post.id} tags={post.tags} />
      </article>
    </div>
  );
}
