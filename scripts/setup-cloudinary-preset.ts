import { prisma } from '../src/lib/prisma';

async function setupCloudinaryUploadPreset() {
  console.log('🔧 Setting up Cloudinary upload preset...');

  try {
    // Add upload preset to settings
    await prisma.setting.upsert({
      where: { key: 'CLOUDINARY_UPLOAD_PRESET' },
      update: {
        value: process.env.CLOUDINARY_UPLOAD_PRESET || 'dkee_unsigned_uploads',
      },
      create: {
        key: 'CLOUDINARY_UPLOAD_PRESET',
        value: process.env.CLOUDINARY_UPLOAD_PRESET || 'dkee_unsigned_uploads',
      },
    });

    console.log('✅ Cloudinary upload preset configured!');
    console.log('\n📝 Next steps:');
    console.log('1. Go to Cloudinary Dashboard → Settings → Upload');
    console.log('2. Scroll to "Upload presets"');
    console.log('3. Click "Add upload preset"');
    console.log('4. Set:');
    console.log('   - Preset name: dkee_unsigned_uploads');
    console.log('   - Signing mode: Unsigned');
    console.log('   - Folder: dkee-cms');
    console.log('   - Allowed formats: jpg, png, gif, svg, webp');
    console.log('5. Save the preset\n');
  } catch (error) {
    console.error('❌ Error setting up upload preset:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupCloudinaryUploadPreset();
