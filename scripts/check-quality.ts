/**
 * Content quality monitoring script
 * Checks for broken links, missing alt text, and other quality issues
 * 
 * Usage: tsx scripts/check-quality.ts
 */

import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';

const prisma = new PrismaClient();

interface QualityIssue {
  type: 'broken-link' | 'missing-alt' | 'empty-heading' | 'missing-meta';
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: string;
}

interface ContentReport {
  id: string;
  title: string;
  type: 'blog' | 'page';
  slug: string;
  issues: QualityIssue[];
}

async function checkQuality(): Promise<void> {
  console.log('🔍 Starting content quality check...\n');

  const reports: ContentReport[] = [];

  // Check blog posts
  console.log('Checking blog posts...');
  const blogPosts = await prisma.blogPost.findMany({
    where: { published: true },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      excerpt: true,
      coverImage: true,
      metaTitle: true,
      metaDescription: true,
    },
  });

  for (const post of blogPosts) {
    const issues: QualityIssue[] = [];

    // Check meta fields
    if (!post.metaTitle || post.metaTitle.trim() === '') {
      issues.push({
        type: 'missing-meta',
        severity: 'warning',
        message: 'Missing meta title (falls back to post title)',
      });
    }

    if (!post.metaDescription || post.metaDescription.trim() === '') {
      issues.push({
        type: 'missing-meta',
        severity: 'warning',
        message: 'Missing meta description (falls back to excerpt)',
      });
    }

    if (!post.excerpt || post.excerpt.trim() === '') {
      issues.push({
        type: 'missing-meta',
        severity: 'info',
        message: 'Missing excerpt',
      });
    }

    if (!post.coverImage) {
      issues.push({
        type: 'missing-meta',
        severity: 'info',
        message: 'Missing cover image',
      });
    }

    // Parse HTML content
    const $ = cheerio.load(post.content);

    // Check images for alt text
    $('img').each((_: number, elem: any) => {
      const alt = $(elem).attr('alt');
      const src = $(elem).attr('src');
      if (!alt || alt.trim() === '') {
        issues.push({
          type: 'missing-alt',
          severity: 'warning',
          message: `Image missing alt text: ${src}`,
          location: src,
        });
      }
    });

    // Check for empty headings
    $('h1, h2, h3, h4, h5, h6').each((_: number, elem: any) => {
      const text = $(elem).text().trim();
      if (text === '') {
        issues.push({
          type: 'empty-heading',
          severity: 'warning',
          message: `Empty heading: ${$(elem).prop('tagName')}`,
        });
      }
    });

    // Check internal links
    $('a').each((_: number, elem: any) => {
      const href = $(elem).attr('href');
      if (href && href.startsWith('/') && !href.startsWith('//')) {
        // Internal link - could check if it exists
        // For now, just flag for manual review
        issues.push({
          type: 'broken-link',
          severity: 'info',
          message: `Internal link (review): ${href}`,
          location: href,
        });
      }
    });

    if (issues.length > 0) {
      reports.push({
        id: post.id,
        title: post.title,
        type: 'blog',
        slug: post.slug,
        issues,
      });
    }
  }

  // Check pages
  console.log('Checking pages...');
  const pages = await prisma.page.findMany({
    where: { published: true },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      metaTitle: true,
      metaDescription: true,
    },
  });

  for (const page of pages) {
    const issues: QualityIssue[] = [];

    // Check meta fields
    if (!page.metaTitle || page.metaTitle.trim() === '') {
      issues.push({
        type: 'missing-meta',
        severity: 'warning',
        message: 'Missing meta title',
      });
    }

    if (!page.metaDescription || page.metaDescription.trim() === '') {
      issues.push({
        type: 'missing-meta',
        severity: 'warning',
        message: 'Missing meta description',
      });
    }

    // Parse content (HTML)
    try {
      const $ = cheerio.load(page.content);
      // Check images for alt text
      $('img').each((_: number, elem: any) => {
        const alt = $(elem).attr('alt');
        const src = $(elem).attr('src');
        if (!alt || alt.trim() === '') {
          issues.push({
            type: 'missing-alt',
            severity: 'warning',
            message: `Image missing alt text: ${src || 'unknown'}`,
            location: src,
          });
        }
      });
    } catch (error) {
      issues.push({
        type: 'broken-link',
        severity: 'error',
        message: 'Failed to parse content blocks JSON',
      });
    }

    if (issues.length > 0) {
      reports.push({
        id: page.id,
        title: page.title,
        type: 'page',
        slug: page.slug,
        issues,
      });
    }
  }

  // Print report
  console.log('\n📊 Quality Check Report\n');
  console.log('='.repeat(60));

  if (reports.length === 0) {
    console.log('✅ No issues found! All content looks great.\n');
  } else {
    const errorCount = reports.reduce(
      (sum, r) => sum + r.issues.filter((i) => i.severity === 'error').length,
      0
    );
    const warningCount = reports.reduce(
      (sum, r) => sum + r.issues.filter((i) => i.severity === 'warning').length,
      0
    );
    const infoCount = reports.reduce(
      (sum, r) => sum + r.issues.filter((i) => i.severity === 'info').length,
      0
    );

    console.log(`Total issues: ${errorCount + warningCount + infoCount}`);
    console.log(`  Errors: ${errorCount}`);
    console.log(`  Warnings: ${warningCount}`);
    console.log(`  Info: ${infoCount}\n`);

    for (const report of reports) {
      console.log(`\n${report.type === 'blog' ? '📝' : '📄'} ${report.title}`);
      console.log(`   Type: ${report.type} | Slug: ${report.slug}`);
      console.log(`   Issues: ${report.issues.length}\n`);

      for (const issue of report.issues) {
        const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`   ${icon} [${issue.severity.toUpperCase()}] ${issue.message}`);
        if (issue.location) {
          console.log(`      Location: ${issue.location}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }

  await prisma.$disconnect();
}

// Run quality check
checkQuality();
