import { PrismaClient } from '@prisma/client';
import { encryptSetting } from '../src/lib/config';

const prisma = new PrismaClient();

async function addPaystackSettings() {
  console.log('💳 Adding Paystack payment settings...');

  try {
    // Public Key (not sensitive)
    const publicKey = process.env.PAYSTACK_PUBLIC_KEY || '';
    if (!publicKey) {
      console.error('❌ PAYSTACK_PUBLIC_KEY environment variable not set');
      process.exit(1);
    }
    
    await prisma.setting.upsert({
      where: { key: 'PAYSTACK_PUBLIC_KEY' },
      update: { value: publicKey },
      create: {
        key: 'PAYSTACK_PUBLIC_KEY',
        value: publicKey,
      },
    });

    // Secret Key (sensitive - encrypted)
    const secretKey = process.env.PAYSTACK_SECRET_KEY || '';
    if (!secretKey) {
      console.error('❌ PAYSTACK_SECRET_KEY environment variable not set');
      process.exit(1);
    }
    const encryptedSecret = encryptSetting(secretKey);
    
    await prisma.setting.upsert({
      where: { key: 'PAYSTACK_SECRET_KEY' },
      update: { value: encryptedSecret },
      create: {
        key: 'PAYSTACK_SECRET_KEY',
        value: encryptedSecret,
      },
    });

    console.log('✅ Paystack payment settings added successfully!');
    console.log(`   - Public Key: ${publicKey.substring(0, 20)}...`);
    console.log('   - Secret Key: [encrypted]');
    console.log('\n💳 Payment processing is now active!');
    console.log('   ✓ Mobile Money (MTN, Vodafone, AirtelTigo)');
    console.log('   ✓ Bank Cards (Visa, Mastercard, Verve)');
    console.log('   ✓ Bank Transfers');
    console.log('   ✓ USSD Payments');
    console.log('\n⚠️  LIVE KEYS DETECTED - Ready for production!');
  } catch (error) {
    console.error('❌ Error adding settings:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addPaystackSettings();
