import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /robots.txt - Generate robots.txt
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://dkee.com';

  const robotsTxt = `# Allow all crawlers
User-agent: *
Allow: /

# Disallow admin and API routes
Disallow: /api/
Disallow: /dashboard/

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml
`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
    },
  });
}
