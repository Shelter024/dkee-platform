/**
 * Content restore script
 * Restores blog posts, pages, and related data from JSON backup
 * 
 * Usage: node --loader ts-node/esm scripts/restore-content.ts <backup-file>
 * Or: tsx scripts/restore-content.ts <backup-file>
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

async function restoreContent(backupFile: string): Promise<void> {
  console.log('📦 Starting content restore...');
  console.log(`📄 Reading backup file: ${backupFile}`);

  try {
    // Read backup file
    const backupPath = path.isAbsolute(backupFile)
      ? backupFile
      : path.join(process.cwd(), backupFile);

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    const backupContent = fs.readFileSync(backupPath, 'utf-8');
    const backup: BackupData = JSON.parse(backupContent);

    console.log(`  Backup version: ${backup.version}`);
    console.log(`  Backup timestamp: ${backup.timestamp}`);
    console.log(`  Blog posts: ${backup.blogPosts.length}`);
    console.log(`  Pages: ${backup.pages.length}`);

    // Confirm restore
    console.log('\n⚠️  WARNING: This will restore content from backup.');
    console.log('⚠️  Existing content with the same IDs will be updated.');
    console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Restore blog posts
    console.log('  Restoring blog posts...');
    for (const post of backup.blogPosts) {
      const { author, ...postData } = post;
      
      await prisma.blogPost.upsert({
        where: { id: postData.id },
        create: postData,
        update: postData,
      });
    }

    // Restore pages
    console.log('  Restoring pages...');
    for (const page of backup.pages) {
      await prisma.page.upsert({
        where: { id: page.id },
        create: page,
        update: page,
      });
    }

    // Restore blog post revisions
    console.log('  Restoring blog post revisions...');
    for (const revision of backup.blogPostRevisions) {
      await prisma.blogPostRevision.upsert({
        where: { id: revision.id },
        create: revision,
        update: revision,
      });
    }

    // Restore page revisions
    console.log('  Restoring page revisions...');
    for (const revision of backup.pageRevisions) {
      await prisma.pageRevision.upsert({
        where: { id: revision.id },
        create: revision,
        update: revision,
      });
    }

    console.log('✅ Restore completed successfully!');
    console.log(`📊 Restored:`);
    console.log(`   - Blog posts: ${backup.blogPosts.length}`);
    console.log(`   - Pages: ${backup.pages.length}`);
    console.log(`   - Blog post revisions: ${backup.blogPostRevisions.length}`);
    console.log(`   - Page revisions: ${backup.pageRevisions.length}`);
  } catch (error) {
    console.error('❌ Restore failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get backup file from command line arguments
const backupFile = process.argv[2];

if (!backupFile) {
  console.error('❌ Error: Backup file path required');
  console.error('Usage: tsx scripts/restore-content.ts <backup-file>');
  process.exit(1);
}

// Run restore
restoreContent(backupFile);
