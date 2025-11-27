import { PrismaClient } from '@prisma/client';
import { encryptSetting } from '../src/lib/config';

const prisma = new PrismaClient();

async function addResendSettings() {
  console.log('📧 Adding Resend email settings...');

  try {
    // Resend API Key (sensitive - encrypted)
    const apiKey = process.env.RESEND_API_KEY || '';
    if (!apiKey) {
      console.error('❌ RESEND_API_KEY environment variable not set');
      process.exit(1);
    }

    const encryptedKey = encryptSetting(apiKey);
    
    await prisma.setting.upsert({
      where: { key: 'RESEND_API_KEY' },
      update: { value: encryptedKey },
      create: {
        key: 'RESEND_API_KEY',
        value: encryptedKey,
      },
    });

    // Default from email
    await prisma.setting.upsert({
      where: { key: 'EMAIL_FROM' },
      update: { value: 'DK Executive Engineers <onboarding@resend.dev>' },
      create: {
        key: 'EMAIL_FROM',
        value: 'DK Executive Engineers <onboarding@resend.dev>',
      },
    });

    console.log('✅ Resend email settings added successfully!');
    console.log('   - API Key: [encrypted]');
    console.log('   - From Email: DK Executive Engineers <onboarding@resend.dev>');
    console.log('\n📧 Email service is now active!');
    console.log('   - Password resets will work');
    console.log('   - User notifications enabled');
    console.log('   - Invoice delivery ready');
  } catch (error) {
    console.error('❌ Error adding settings:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addResendSettings();
