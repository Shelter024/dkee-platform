import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  // Static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/automotive`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/property`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Dynamic pages
  try {
    const pages = await prisma.page.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true, category: true },
    });

    const pageRoutes: MetadataRoute.Sitemap = pages.map(page => ({
      url: `${baseUrl}/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: page.category === 'News' ? 'daily' : 'monthly',
      priority: page.category === 'News' ? 0.7 : 0.6,
    }));

    routes.push(...pageRoutes);
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  // Blog posts
  try {
    const blogPosts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      take: 100,
    });

    const blogRoutes: MetadataRoute.Sitemap = blogPosts.map(post => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

    routes.push(...blogRoutes);
  } catch (error) {
    console.error('Error generating blog sitemap:', error);
  }

  return routes;
}
