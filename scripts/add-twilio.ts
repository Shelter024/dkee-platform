import { PrismaClient } from '@prisma/client';
import { encryptSetting } from '../src/lib/config';

const prisma = new PrismaClient();

async function addTwilioSettings() {
  console.log('📱 Adding Twilio SMS settings...');

  try {
    // Account SID (sensitive - encrypted)
    const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    if (!accountSid) {
      console.error('❌ TWILIO_ACCOUNT_SID environment variable not set');
      process.exit(1);
    }
    const encryptedSid = encryptSetting(accountSid);
    
    await prisma.setting.upsert({
      where: { key: 'TWILIO_ACCOUNT_SID' },
      update: { value: encryptedSid },
      create: {
        key: 'TWILIO_ACCOUNT_SID',
        value: encryptedSid,
      },
    });

    // Auth Token (sensitive - encrypted)
    const authToken = process.env.TWILIO_AUTH_TOKEN || '';
    if (!authToken) {
      console.error('❌ TWILIO_AUTH_TOKEN environment variable not set');
      process.exit(1);
    }
    const encryptedToken = encryptSetting(authToken);
    
    await prisma.setting.upsert({
      where: { key: 'TWILIO_AUTH_TOKEN' },
      update: { value: encryptedToken },
      create: {
        key: 'TWILIO_AUTH_TOKEN',
        value: encryptedToken,
      },
    });

    // Phone Number (not sensitive)
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
    if (!phoneNumber) {
      console.error('❌ TWILIO_PHONE_NUMBER environment variable not set');
      process.exit(1);
    }
    
    await prisma.setting.upsert({
      where: { key: 'TWILIO_PHONE_NUMBER' },
      update: { value: phoneNumber },
      create: {
        key: 'TWILIO_PHONE_NUMBER',
        value: phoneNumber,
      },
    });

    console.log('✅ Twilio SMS settings added successfully!');
    console.log('   - Account SID: [encrypted]');
    console.log('   - Auth Token: [encrypted]');
    console.log(`   - Phone Number: ${phoneNumber}`);
    console.log('\n📱 SMS service is now active!');
    console.log('   - Customer notifications enabled');
    console.log('   - Service reminders ready');
    console.log('   - OTP verification available');
  } catch (error) {
    console.error('❌ Error adding settings:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addTwilioSettings();
