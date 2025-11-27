/**
 * Content backup and export script
 * Exports all blog posts, pages, and related data to JSON
 * 
 * Usage: node --loader ts-node/esm scripts/backup-content.ts
 * Or: tsx scripts/backup-content.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface BackupData {
  version: string;
  timestamp: string;
  blogPosts: any[];
  pages: any[];
  blogPostRevisions: any[];
  pageRevisions: any[];
}

async function backupContent(): Promise<void> {
  console.log('📦 Starting content backup...');

  try {
    // Fetch all blog posts with relations
    console.log('  Fetching blog posts...');
    const blogPosts = await prisma.blogPost.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Fetch all pages
    console.log('  Fetching pages...');
    const pages = await prisma.page.findMany();

    // Fetch blog post revisions
    console.log('  Fetching blog post revisions...');
    const blogPostRevisions = await prisma.blogPostRevision.findMany();

    // Fetch page revisions
    console.log('  Fetching page revisions...');
    const pageRevisions = await prisma.pageRevision.findMany();

    // Create backup object
    const backup: BackupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      blogPosts,
      pages,
      blogPostRevisions,
      pageRevisions,
    };

    // Create backups directory if it doesn't exist
    const backupsDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // Generate filename with timestamp
    const filename = `content-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(backupsDir, filename);

    // Write backup to file
    console.log(`  Writing backup to ${filename}...`);
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

    console.log('✅ Backup completed successfully!');
    console.log(`📄 Backup file: ${filepath}`);
    console.log(`📊 Stats:`);
    console.log(`   - Blog posts: ${blogPosts.length}`);
    console.log(`   - Pages: ${pages.length}`);
    console.log(`   - Blog post revisions: ${blogPostRevisions.length}`);
    console.log(`   - Page revisions: ${pageRevisions.length}`);
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run backup
backupContent();
