#!/usr/bin/env node
/**
 * Test Data Generator for Premium Features
 * Creates sample data to test service reminders and Vehicle Tracking
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting test data generation...\n');

  try {
    // 1. Find or create test user
    console.log('1️⃣  Finding/Creating test user...');
    let user = await prisma.user.findUnique({
      where: { email: 'test@dkexecutive.com' },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test@dkexecutive.com',
          name: 'Test Customer',
          phone: '+233241234567',
          password: '$2a$10$abcdefghijklmnopqrstuvwxyz123456', // Hashed "password123"
          role: 'CUSTOMER',
          accountStatus: 'APPROVED',
          emailVerified: new Date(),
          phoneVerified: true,
        },
      });
      console.log('   ✅ Created test user:', user.email);
    } else {
      console.log('   ✅ Found existing user:', user.email);
    }

    // 2. Create customer record
    console.log('\n2️⃣  Creating customer record...');
    let customer = await prisma.customer.findUnique({
      where: { userId: user.id },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          userId: user.id,
          address: '123 Test Street, Accra',
          company: 'Test Company Ltd',
        },
      });
      console.log('   ✅ Created customer record');
    } else {
      console.log('   ✅ Customer record already exists');
    }

    // 3. Create vehicles
    console.log('\n3️⃣  Creating test vehicles...');
    const vehicles = [];
    
    const vehicleData = [
      { make: 'Toyota', model: 'Camry', year: 2020, licensePlate: 'GS-1234-20' },
      { make: 'Honda', model: 'Accord', year: 2019, licensePlate: 'GS-5678-19' },
    ];

    for (const vData of vehicleData) {
      let vehicle = await prisma.vehicle.findFirst({
        where: {
          customerId: customer.id,
          licensePlate: vData.licensePlate,
        },
      });

      if (!vehicle) {
        vehicle = await prisma.vehicle.create({
          data: {
            customerId: customer.id,
            make: vData.make,
            model: vData.model,
            year: vData.year,
            licensePlate: vData.licensePlate,
            color: 'Silver',
            mileage: 45000,
            trackingDevice: true,
          },
        });
        console.log(`   ✅ Created vehicle: ${vData.make} ${vData.model}`);
      } else {
        console.log(`   ✅ Vehicle exists: ${vData.make} ${vData.model}`);
      }
      vehicles.push(vehicle);
    }

    // 4. Create PREMIUM subscription
    console.log('\n4️⃣  Creating PREMIUM subscription...');
    
    // Cancel any existing active subscriptions
    await prisma.subscription.updateMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'PREMIUM',
        status: 'ACTIVE',
        interval: 'MONTHLY',
        startDate,
        endDate,
        amount: 150,
        features: [
          'BASIC_ANALYTICS',
          'EMAIL_SUPPORT',
          'OIL_SERVICE_REMINDER',
          'VEHICLE_TRACKING',
          'PRIORITY_SUPPORT',
          'ADVANCED_ANALYTICS',
        ],
        autoRenew: true,
        paymentMethod: 'TEST',
      },
    });
    console.log('   ✅ Created PREMIUM subscription');
    console.log(`   📅 Valid until: ${endDate.toLocaleDateString()}`);

    // 5. Create service reminders
    console.log('\n5️⃣  Creating service reminders...');
    
    const reminderData = [
      {
        vehicleId: vehicles[0].id,
        serviceType: 'Oil Change',
        daysFromNow: 5,
        dueMileage: 50000,
      },
      {
        vehicleId: vehicles[0].id,
        serviceType: 'Tire Rotation',
        daysFromNow: 10,
        dueMileage: 48000,
      },
      {
        vehicleId: vehicles[1].id,
        serviceType: 'Brake Inspection',
        daysFromNow: 6,
        dueMileage: 46000,
      },
    ];

    for (const rData of reminderData) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + rData.daysFromNow);

      const reminder = await prisma.serviceReminder.create({
        data: {
          subscriptionId: subscription.id,
          vehicleId: rData.vehicleId,
          serviceType: rData.serviceType,
          dueDate,
          dueMileage: rData.dueMileage,
          reminderSent: false,
          completed: false,
          notes: `Test reminder for ${rData.serviceType}`,
        },
      });
      console.log(`   ✅ Created reminder: ${rData.serviceType} (due in ${rData.daysFromNow} days)`);
    }

    // 6. Create tracking logs
    console.log('\n6️⃣  Creating Vehicle tracking logs...');
    
    const trackingData = [
      { lat: 5.6037, lng: -0.1870, speed: 45, address: 'Accra Central' },
      { lat: 5.6137, lng: -0.1970, speed: 60, address: 'Osu, Accra' },
      { lat: 5.6237, lng: -0.2070, speed: 30, address: 'East Legon, Accra' },
    ];

    for (let i = 0; i < trackingData.length; i++) {
      const tData = trackingData[i];
      const timestamp = new Date();
      timestamp.setMinutes(timestamp.getMinutes() - (trackingData.length - i) * 10);

      await prisma.trackingLog.create({
        data: {
          subscriptionId: subscription.id,
          vehicleId: vehicles[0].id,
          latitude: tData.lat,
          longitude: tData.lng,
          speed: tData.speed,
          heading: 90 + i * 10,
          accuracy: 10,
          address: tData.address,
          timestamp,
        },
      });
    }
    console.log(`   ✅ Created ${trackingData.length} tracking logs`);

    // 7. Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST DATA GENERATION COMPLETE!\n');
    console.log('📊 Summary:');
    console.log(`   User: ${user.email}`);
    console.log(`   Password: password123 (use this to login)`);
    console.log(`   Subscription: PREMIUM (expires ${endDate.toLocaleDateString()})`);
    console.log(`   Vehicles: ${vehicles.length}`);
    console.log(`   Service Reminders: ${reminderData.length}`);
    console.log(`   Tracking Logs: ${trackingData.length}`);
    console.log('\n🔐 Login Credentials:');
    console.log(`   Email: test@dkexecutive.com`);
    console.log(`   Password: password123`);
    console.log('\n🧪 Test URLs:');
    console.log('   Login: http://localhost:3000/login');
    console.log('   Service Reminders: http://localhost:3000/dashboard/customer/service-reminders');
    console.log('   Vehicle Tracking: http://localhost:3000/dashboard/customer/tracking');
    console.log('   Admin Reminders: http://localhost:3000/dashboard/admin/service-reminders');
    console.log('   Admin Tracking: http://localhost:3000/dashboard/admin/tracking');
    console.log('\n💡 Test Cron Job:');
    console.log('   curl -X GET http://localhost:3000/api/cron/reminder-notifications \\');
    console.log('     -H "Authorization: Bearer f6RBrjIBEs7qBe9CP8b5TYYyGbsoL9PS8cYKFKDY3H0="');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error generating test data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
