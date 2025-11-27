import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Retrieve system settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'CEO') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get settings or return defaults
    let settings = await prisma.systemSettings.findFirst();
    
    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.systemSettings.create({
        data: {
          companyName: 'DK Executive Engineers',
          companyEmail: 'info@dkexecutive.com',
          companyPhone: '+233-200-000-0000',
          companyAddress: 'Pawpaw Street, East Legon, Accra',
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
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    );
  }
}

// PUT: Update system settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    
    if (userRole !== 'ADMIN' && userRole !== 'CEO') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    
    // Get existing settings or create new
    let settings = await prisma.systemSettings.findFirst();

    if (settings) {
      // Update existing
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
          ...body,
          updatedBy: userId,
        },
      });
    } else {
      // Create new with provided values
      settings = await prisma.systemSettings.create({
        data: {
          ...body,
          updatedBy: userId,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating system settings:', error);
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    );
  }
}
