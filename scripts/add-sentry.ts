import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSentrySettings() {
  console.log('🔍 Adding Sentry error tracking settings...');

  try {
    // Sentry DSN (not sensitive - it's meant to be public)
    const dsn = process.env.SENTRY_DSN || '';
    if (!dsn) {
      console.error('❌ SENTRY_DSN environment variable not set');
      process.exit(1);
    }
    
    await prisma.setting.upsert({
      where: { key: 'SENTRY_DSN' },
      update: { value: dsn },
      create: {
        key: 'SENTRY_DSN',
        value: dsn,
      },
    });

    // Extract region from DSN for display
    const region = dsn.includes('.de.sentry.io') ? 'EU (Germany)' : 'US';

    console.log('✅ Sentry error tracking settings added successfully!');
    console.log(`   - DSN: ${dsn.substring(0, 40)}...`);
    console.log(`   - Region: ${region}`);
    console.log('\n🔍 Error tracking is now active!');
    console.log('   ✓ Real-time error monitoring');
    console.log('   ✓ Performance tracking');
    console.log('   ✓ Error alerts & notifications');
    console.log('   ✓ Stack traces & breadcrumbs');
    console.log('\n💡 View errors at: https://sentry.io/');
  } catch (error) {
    console.error('❌ Error adding settings:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addSentrySettings();
