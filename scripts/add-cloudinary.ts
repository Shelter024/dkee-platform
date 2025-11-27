import { PrismaClient } from '@prisma/client';
import { encryptSetting } from '../src/lib/config';

const prisma = new PrismaClient();

async function addCloudinarySettings() {
  console.log('🔧 Adding Cloudinary settings...');

  try {
    // Cloud Name (not sensitive)
    await prisma.setting.upsert({
      where: { key: 'CLOUDINARY_CLOUD_NAME' },
      update: { value: 'da5vwoyhl' },
      create: {
        key: 'CLOUDINARY_CLOUD_NAME',
        value: 'da5vwoyhl',
      },
    });

    // API Key (not sensitive, but stored)
    await prisma.setting.upsert({
      where: { key: 'CLOUDINARY_API_KEY' },
      update: { value: '495269668286739' },
      create: {
        key: 'CLOUDINARY_API_KEY',
        value: '495269668286739',
      },
    });

    // API Secret (sensitive - encrypted)
    const apiSecret = process.env.CLOUDINARY_API_SECRET || '<your_api_secret>';
    const encryptedSecret = encryptSetting(apiSecret);
    
    await prisma.setting.upsert({
      where: { key: 'CLOUDINARY_API_SECRET' },
      update: { value: encryptedSecret },
      create: {
        key: 'CLOUDINARY_API_SECRET',
        value: encryptedSecret,
      },
    });

    console.log('✅ Cloudinary settings added successfully!');
    console.log('   - Cloud Name: da5vwoyhl');
    console.log('   - API Key: 495269668286739');
    console.log('   - API Secret: [encrypted]');
    console.log('\n📝 Note: You can also update these via the Settings page in the admin dashboard.');
  } catch (error) {
    console.error('❌ Error adding settings:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addCloudinarySettings();
