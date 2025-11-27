import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.log('🌱 Seed skipped (NODE_ENV=production). Set FORCE_SEED=true to override.');
    if (process.env.FORCE_SEED === 'true') {
      console.log('⚠️ FORCE_SEED enabled. Proceeding with full seed...');
    } else {
      return;
    }
  }

  console.log('🌱 Seeding database (environment:', process.env.NODE_ENV, ')');

  // Support minimal seed & admin overrides via env vars
  const minimal = process.env.MINIMAL_SEED === 'true';
  const adminEmail = process.env.ADMIN_EMAIL || 'gabadashelter97@gmail.com';
  const adminPlainPassword = process.env.ADMIN_PASSWORD || 'Gabshe1797*';
  const adminName = process.env.ADMIN_NAME || 'Shelter Gabada';
  const adminPassword = await bcrypt.hash(adminPlainPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: adminPassword,
      name: adminName,
      phone: '+233241018947',
      role: 'ADMIN',
      emailVerified: new Date(),
      accountStatus: 'APPROVED',
      phoneVerified: true,
    },
  });

  if (minimal) {
    console.log('⚙️ Minimal seed requested (MINIMAL_SEED=true). Skipping sample data.');
    console.log('✅ Admin user created:', adminEmail);
    return;
  }

  // Create CEO User
  const ceoPassword = await bcrypt.hash('CeoStrong123!', 10);
  const ceo = await prisma.user.upsert({
    where: { email: 'ceo@dkexecutive.com' },
    update: {},
    create: {
      email: 'ceo@dkexecutive.com',
      password: ceoPassword,
      name: 'Chief Executive Officer',
      phone: '+233-200-000-0002',
      role: 'CEO',
      emailVerified: new Date(),
      accountStatus: 'APPROVED',
      phoneVerified: true,
    },
  });

  // Create Manager User
  const managerPassword = await bcrypt.hash('Manager123!', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@dkexecutive.com' },
    update: {},
    create: {
      email: 'manager@dkexecutive.com',
      password: managerPassword,
      name: 'Operations Manager',
      phone: '+233-200-000-0003',
      role: 'MANAGER',
      emailVerified: new Date(),
      accountStatus: 'APPROVED',
      phoneVerified: true,
    },
  });

  // Create HR User
  const hrPassword = await bcrypt.hash('HrSecure123!', 10);
  const hr = await prisma.user.upsert({
    where: { email: 'hr@dkexecutive.com' },
    update: {},
    create: {
      email: 'hr@dkexecutive.com',
      password: hrPassword,
      name: 'Human Resources',
      phone: '+233-200-000-0004',
      role: 'HR',
      emailVerified: new Date(),
      accountStatus: 'APPROVED',
      phoneVerified: true,
    },
  });

  // Create Automotive Staff
  const autoStaffPassword = await bcrypt.hash('AutoStaff123!', 10);
  const autoStaff = await prisma.user.upsert({
    where: { email: 'auto@dkexecutive.com' },
    update: {},
    create: {
      email: 'auto@dkexecutive.com',
      password: autoStaffPassword,
      name: 'Automotive Manager',
      phone: '+233-200-000-0005',
      role: 'STAFF_AUTO',
      emailVerified: new Date(),
      accountStatus: 'APPROVED',
      phoneVerified: true,
    },
  });

  // Create Property Staff
  const propertyStaffPassword = await bcrypt.hash('PropertyStaff123!', 10);
  const propertyStaff = await prisma.user.upsert({
    where: { email: 'property@dkexecutive.com' },
    update: {},
    create: {
      email: 'property@dkexecutive.com',
      password: propertyStaffPassword,
      name: 'Property Manager',
      phone: '+233-200-000-0006',
      role: 'STAFF_PROPERTY',
      emailVerified: new Date(),
      accountStatus: 'APPROVED',
      phoneVerified: true,
    },
  });

  // Create Sample Customer
  const customerPassword = await bcrypt.hash('Customer123!', 10);
  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: customerPassword,
      name: 'John Doe',
      phone: '+233-200-000-0007',
      role: 'CUSTOMER',
      emailVerified: new Date(),
      accountStatus: 'APPROVED',
      phoneVerified: true,
    },
  });

  const customer = await prisma.customer.upsert({
    where: { userId: customerUser.id },
    update: {},
    create: {
      userId: customerUser.id,
      address: '123 Main Street, Lagos',
      company: 'ABC Corporation',
    },
  });

  // Create Sample Vehicle
  const vehicle = await prisma.vehicle.create({
    data: {
      customerId: customer.id,
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      vin: 'ABC123XYZ456789',
      licensePlate: 'LAG-123-AB',
      color: 'Silver',
      mileage: 45000,
      trackingDevice: true,
    },
  });

  // Create Sample Spare Parts
  const spareParts = await prisma.sparePart.createMany({
    data: [
      {
        name: 'Engine Oil Filter',
        partNumber: 'EOF-001',
        category: 'Filters',
        description: 'High-quality engine oil filter',
        price: 2500,
        stock: 50,
        supplier: 'Auto Parts Ltd',
      },
      {
        name: 'Brake Pads (Set)',
        partNumber: 'BP-002',
        category: 'Brakes',
        description: 'Front brake pads set',
        price: 8500,
        stock: 30,
        supplier: 'Brake Solutions',
      },
      {
        name: 'Air Filter',
        partNumber: 'AF-003',
        category: 'Filters',
        description: 'Cabin air filter',
        price: 3200,
        stock: 40,
        supplier: 'Auto Parts Ltd',
      },
    ],
  });

  // Create Sample Automotive Service
  const service = await prisma.automotiveService.create({
    data: {
      customerId: customer.id,
      vehicleId: vehicle.id,
      assignedToId: autoStaff.id,
      serviceType: 'Maintenance',
      description: 'Regular maintenance service - oil change and inspection',
      status: 'COMPLETED',
      estimatedCost: 15000,
      actualCost: 14500,
      scheduledDate: new Date('2025-11-15'),
      completedDate: new Date('2025-11-16'),
      notes: 'All systems checked. Vehicle in good condition.',
    },
  });

  // Create Sample Properties
  await prisma.property.createMany({
    data: [
      {
        title: '3 Bedroom Apartment in Lekki',
        description: 'Modern apartment with great amenities in prime location',
        propertyType: 'RENT',
        status: 'AVAILABLE',
        address: '45 Admiralty Way',
        city: 'Lagos',
        state: 'Lagos State',
        zipCode: '101245',
        price: 2500000,
        size: 1200,
        bedrooms: 3,
        bathrooms: 2.5,
        yearBuilt: 2022,
        images: [],
        features: ['Swimming Pool', 'Gym', '24/7 Security', 'Parking'],
        listedById: propertyStaff.id,
        surveyConducted: true,
      },
      {
        title: '5 Bedroom Detached House',
        description: 'Spacious family home with large compound',
        propertyType: 'SALE',
        status: 'AVAILABLE',
        address: '12 Independence Avenue',
        city: 'Abuja',
        state: 'FCT',
        zipCode: '900001',
        price: 85000000,
        size: 3500,
        bedrooms: 5,
        bathrooms: 4,
        yearBuilt: 2021,
        images: [],
        features: ['BQ', 'Garden', 'Security House', 'Ample Parking'],
        listedById: propertyStaff.id,
        surveyConducted: true,
      },
    ],
  });

  // Create Head Office Branch (Accra - Pawpaw Street, East Legon)
  const headOffice = await prisma.branch.upsert({
    where: { code: 'HO-ACCRA' },
    update: {},
    create: {
      name: 'Head Office - East Legon',
      code: 'HO-ACCRA',
      address: 'Pawpaw Street, East Legon',
      city: 'Accra',
      region: 'Greater Accra',
      country: 'Ghana',
      latitude: 5.6318,
      longitude: -0.1557,
      isHeadOffice: true,
    },
  });

  // Assign branch staff roles
  await prisma.branchStaff.createMany({
    data: [
      { branchId: headOffice.id, userId: ceo.id, officeRole: 'CEO' },
      { branchId: headOffice.id, userId: manager.id, officeRole: 'MANAGER' },
      { branchId: headOffice.id, userId: hr.id, officeRole: 'HR' },
      { branchId: headOffice.id, userId: autoStaff.id, officeRole: 'STAFF_AUTO' },
      { branchId: headOffice.id, userId: propertyStaff.id, officeRole: 'STAFF_PROPERTY' },
      { branchId: headOffice.id, userId: admin.id, officeRole: 'ADMIN' },
    ],
    skipDuplicates: true,
  });

  // Sample Blog Post
  await prisma.blogPost.create({
    data: {
      title: 'Welcoming Innovation Rooted in Ghanaian Values',
      slug: 'innovation-ghanaian-values',
      content: 'At DK Executive Engineers, we fuse advanced engineering with rich Ghanaian heritage—from sustainable practices to community-centered service. This platform is the digital backbone connecting automotive reliability and property excellence across Ghana and beyond.',
      excerpt: 'Engineering + Tradition: Our digital platform launch announcement.',
      tags: ['ghana', 'launch', 'engineering', 'technology'],
      authorId: ceo.id,
      published: true,
      publishedAt: new Date(),
    },
  });

  // Sample Tip
  await prisma.tip.create({
    data: {
      title: 'Vehicle Maintenance During Harmattan',
      body: 'During Harmattan, ensure frequent air filter checks and hydrate coolant systems to prevent overheating in dusty conditions common in Ghanaian roads.',
      category: 'Automotive',
    },
  });

  // Sample Update
  await prisma.update.create({
    data: {
      title: 'Platform Beta Release',
      body: 'The unified DK platform is now live with customer portal, admin operations center, and PWA offline features tailored for Ghanaian business needs.',
      category: 'Release',
      version: '0.9.0-beta',
      publishedAt: new Date(),
    },
  });

  // Sample Integration Placeholder (AI/NLP Future)
  await prisma.integration.create({
    data: {
      name: 'AI Assistant Pipeline',
      type: 'AI',
      active: true,
      config: { provider: 'placeholder', status: 'planned', features: ['service_recommendation', 'predictive_maintenance'] },
    },
  });

  // Create default system settings
  await prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      companyName: 'DK Executive Engineers',
      companyEmail: 'info@dkexecutive.com',
      companyPhone: '+233-200-000-0000',
      companyAddress: 'Pawpaw Street, East Legon, Accra, Ghana',
      siteUrl: 'http://localhost:3000',
      siteName: 'DK Executive Engineers',
      siteDescription: 'Automotive and Property Management Solutions',
      maintenanceMode: false,
      allowRegistrations: true,
      emailFromAddress: 'noreply@dkexecutive.com',
      emailFromName: 'DK Executive Engineers',
      currency: 'GHS',
      enableBlog: true,
      enableNotifications: true,
      enableAnalytics: true,
    },
  });

  // Create default session settings
  await prisma.sessionSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      customerRememberMe: true,
      staffSessionTimeout: 15,
      autoLogoutEnabled: true,
      customerSessionMaxAge: 2592000, // 30 days
      staffSessionMaxAge: 28800, // 8 hours
    },
  });

  // Seed About and Team pages if missing
  await prisma.page.upsert({
    where: { slug: 'about' },
    update: {},
    create: {
      title: 'About DK Executive Engineers',
      slug: 'about',
      content: `**Our Mission**\n\nWe unify automotive reliability and property management excellence across West Africa.\n\n**Heritage & Innovation**\n\nRooted in Ghanaian values, we apply modern engineering, data-driven decision making, and customer empathy to deliver dependable maintenance, smart tracking, and curated property services.\n\n**What We Deliver**\n\n• Preventive automotive care and diagnostics\n• Secure Vehicle Tracking & service reminders\n• Property listing, surveying, and inquiry management\n• Integrated customer portal with real-time updates\n\n**Commitment**\n\nWe champion transparency, safety, and sustainable growth for our clients and communities.`,
      published: true,
      publishedAt: new Date(),
      category: 'General',
      template: 'default',
    }
  });

  await prisma.page.upsert({
    where: { slug: 'team' },
    update: {},
    create: {
      title: 'Meet the Team',
      slug: 'team',
      content: `**Our Team**\n\nWe are a multidisciplinary group aligning engineering, service operations, and customer success.\n\n**Leadership Principles**\n\n• Integrity in every interaction\n• Reliability in every service\n• Innovation guided by local context\n\n**Collaborative Focus**\n\nWe work cross-functionally to ensure automotive services and property solutions reinforce each other for long-term client value.`,
      published: true,
      publishedAt: new Date(),
      category: 'General',
      template: 'default',
    }
  });

  // Optional: Create a content editor user
  const editorPassword = await bcrypt.hash('Editor123!', 10);
  await prisma.user.upsert({
    where: { email: 'editor@dkexecutive.com' },
    update: {},
    create: {
      email: 'editor@dkexecutive.com',
      password: editorPassword,
      name: 'Content Editor',
      phone: '+233-200-000-0008',
      role: 'CONTENT_EDITOR',
      emailVerified: new Date(),
      accountStatus: 'APPROVED',
      phoneVerified: true,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📧 Default Users:');
  console.log(`Admin: ${adminEmail} / ${adminPlainPassword}`);
  console.log('CEO: ceo@dkexecutive.com / CeoStrong123!');
  console.log('Manager: manager@dkexecutive.com / Manager123!');
  console.log('HR: hr@dkexecutive.com / HrSecure123!');
  console.log('Automotive Staff: auto@dkexecutive.com / AutoStaff123!');
  console.log('Property Staff: property@dkexecutive.com / PropertyStaff123!');
  console.log('Customer: customer@example.com / Customer123!');
  console.log('Content Editor: editor@dkexecutive.com / Editor123!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
