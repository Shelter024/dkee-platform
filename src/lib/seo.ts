/**
 * SEO utilities for generating structured data (JSON-LD) and meta tags
 */

export interface BlogPostSEO {
  title: string;
  excerpt?: string | null;
  slug: string;
  featuredImage?: string | null;
  author?: {
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

export interface PageSEO {
  title: string;
  slug: string;
  updatedAt: Date;
}

/**
 * Generate JSON-LD structured data for a blog post (Article schema)
 */
export function generateBlogPostJsonLd(post: BlogPostSEO, baseUrl: string) {
  const url = `${baseUrl}/blog/${post.slug}`;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || '',
    url,
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      '@type': 'Person',
      name: post.author?.name || 'DKee Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'DKee',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/icons/icon-512x512.png`,
      },
    },
    image: post.featuredImage || `${baseUrl}/icons/icon-512x512.png`,
    keywords: post.tags?.join(', ') || '',
  };
}

/**
 * Generate JSON-LD structured data for a page (WebPage schema)
 */
export function generatePageJsonLd(page: PageSEO, baseUrl: string) {
  const url = `${baseUrl}/${page.slug}`;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    url,
    dateModified: page.updatedAt.toISOString(),
    publisher: {
      '@type': 'Organization',
      name: 'DKee',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/icons/icon-512x512.png`,
      },
    },
  };
}

/**
 * Generate JSON-LD structured data for the organization
 */
export function generateOrganizationJsonLd(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DKee',
    url: baseUrl,
    logo: `${baseUrl}/icons/icon-512x512.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      url: `${baseUrl}/contact`,
    },
    sameAs: [
      // Add social media URLs here when available
    ],
  };
}

/**
 * Generate default meta tags for a page
 */
export function generateMetaTags(options: {
  title: string;
  description?: string;
  image?: string;
  url: string;
  type?: 'website' | 'article';
}) {
  const {
    title,
    description = 'DKee - Professional automotive and property services',
    image = '/icons/icon-512x512.png',
    url,
    type = 'website',
  } = options;

  return {
    title: `${title} | DKee`,
    description,
    openGraph: {
      title: `${title} | DKee`,
      description,
      url,
      type,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | DKee`,
      description,
      images: [image],
    },
  };
}
