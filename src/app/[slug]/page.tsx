import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { draftMode } from 'next/headers';

interface Props {
  params: { slug: string };
}

interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'hero';
  content: any;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { isEnabled } = draftMode();
  const page = await prisma.page.findFirst({
    where: { slug: params.slug, ...(isEnabled ? {} : { published: true }) },
  });

  if (!page) {
    return {
      title: 'Page Not Found',
    };
  }

  return {
    title: page.metaTitle || `${page.title} | DK Executive Engineers`,
    description: page.metaDescription || `${page.title} - DK Executive Engineers`,
    openGraph: page.ogImage
      ? { images: [{ url: page.ogImage, alt: page.title }] }
      : undefined,
    robots: page.noIndex ? { index: false, follow: false } : undefined,
  };
}

export default async function CustomPage({ params }: Props) {
  const { isEnabled } = draftMode();
  const page = await prisma.page.findFirst({
    where: { slug: params.slug, ...(isEnabled ? {} : { published: true }) },
  });

  if (!page) {
    notFound();
  }

  let contentBlocks: ContentBlock[] = [];
  try {
    contentBlocks = JSON.parse(page.content);
  } catch {
    contentBlocks = [];
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {contentBlocks.map((block) => {
        // Hero Block
        if (block.type === 'hero') {
          return (
            <section
              key={block.id}
              className="relative h-[500px] flex items-center justify-center text-white"
              style={{
                backgroundImage: block.content.backgroundImage
                  ? `url(${block.content.backgroundImage})`
                  : 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black opacity-40"></div>
              <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
                <h1 className="text-5xl md:text-6xl font-bold mb-4">
                  {block.content.title}
                </h1>
                {block.content.subtitle && (
                  <p className="text-xl md:text-2xl mb-8">
                    {block.content.subtitle}
                  </p>
                )}
                {block.content.ctaText && block.content.ctaLink && (
                  <a
                    href={block.content.ctaLink}
                    className="inline-block px-8 py-3 bg-brand-gold-500 hover:bg-brand-gold-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    {block.content.ctaText}
                  </a>
                )}
              </div>
            </section>
          );
        }

        // Text Block
        if (block.type === 'text') {
          return (
            <section key={block.id} className="py-12">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
              </div>
            </section>
          );
        }

        // Image Block
        if (block.type === 'image') {
          return (
            <section key={block.id} className="py-12">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <img
                  src={block.content.url}
                  alt={block.content.alt || ''}
                  className="w-full rounded-lg shadow-lg"
                />
                {block.content.caption && (
                  <p className="text-center text-gray-600 mt-4 italic">
                    {block.content.caption}
                  </p>
                )}
              </div>
            </section>
          );
        }

        // Video Block
        if (block.type === 'video') {
          const getYouTubeEmbedUrl = (url: string) => {
            const regExp =
              /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = url.match(regExp);
            const videoId = match && match[2].length === 11 ? match[2] : null;
            return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
          };

          return (
            <section key={block.id} className="py-12">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="aspect-video">
                  <iframe
                    src={getYouTubeEmbedUrl(block.content.url)}
                    title="Video"
                    className="w-full h-full rounded-lg shadow-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                {block.content.caption && (
                  <p className="text-center text-gray-600 mt-4 italic">
                    {block.content.caption}
                  </p>
                )}
              </div>
            </section>
          );
        }

        return null;
      })}

      {/* Fallback if no content blocks */}
      {contentBlocks.length === 0 && (
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-4">{page.title}</h1>
            <p className="text-gray-600">Content coming soon...</p>
          </div>
        </section>
      )}
    </div>
  );
}
