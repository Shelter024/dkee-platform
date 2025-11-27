import { PrismaClient } from '@prisma/client';
import { encryptSetting } from '../src/lib/config';

const prisma = new PrismaClient();

async function addPusherSettings() {
  console.log('⚡ Adding Pusher real-time settings...');

  try {
    // App ID (not sensitive)
    const appId = process.env.PUSHER_APP_ID || '';
    if (!appId) {
      console.error('❌ PUSHER_APP_ID environment variable not set');
      process.exit(1);
    }
    
    await prisma.setting.upsert({
      where: { key: 'PUSHER_APP_ID' },
      update: { value: appId },
      create: {
        key: 'PUSHER_APP_ID',
        value: appId,
      },
    });

    // Key (public, not sensitive)
    const key = process.env.PUSHER_KEY || '';
    if (!key) {
      console.error('❌ PUSHER_KEY environment variable not set');
      process.exit(1);
    }
    
    await prisma.setting.upsert({
      where: { key: 'PUSHER_KEY' },
      update: { value: key },
      create: {
        key: 'PUSHER_KEY',
        value: key,
      },
    });

    // Secret (sensitive - encrypted)
    const secret = process.env.PUSHER_SECRET || '';
    if (!secret) {
      console.error('❌ PUSHER_SECRET environment variable not set');
      process.exit(1);
    }
    const encryptedSecret = encryptSetting(secret);
    
    await prisma.setting.upsert({
      where: { key: 'PUSHER_SECRET' },
      update: { value: encryptedSecret },
      create: {
        key: 'PUSHER_SECRET',
        value: encryptedSecret,
      },
    });

    // Cluster (not sensitive)
    const cluster = process.env.PUSHER_CLUSTER || '';
    if (!cluster) {
      console.error('❌ PUSHER_CLUSTER environment variable not set');
      process.exit(1);
    }
    
    await prisma.setting.upsert({
      where: { key: 'PUSHER_CLUSTER' },
      update: { value: cluster },
      create: {
        key: 'PUSHER_CLUSTER',
        value: cluster,
      },
    });

    console.log('✅ Pusher real-time settings added successfully!');
    console.log(`   - App ID: ${appId}`);
    console.log(`   - Key: ${key}`);
    console.log('   - Secret: [encrypted]');
    console.log(`   - Cluster: ${cluster}`);
    console.log('\n⚡ Real-time notifications are now active!');
    console.log('   - Live dashboard updates');
    console.log('   - Instant notifications');
    console.log('   - Real-time status changes');
  } catch (error) {
    console.error('❌ Error adding settings:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addPusherSettings();
