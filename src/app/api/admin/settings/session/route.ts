import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Retrieve session settings
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
    let settings = await prisma.sessionSettings.findFirst();
    
    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.sessionSettings.create({
        data: {
          customerRememberMe: true,
          staffSessionTimeout: 15,
          autoLogoutEnabled: true,
          customerSessionMaxAge: 2592000, // 30 days
          staffSessionMaxAge: 28800, // 8 hours
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching session settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session settings' },
      { status: 500 }
    );
  }
}

// PUT: Update session settings
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
    const {
      customerRememberMe,
      staffSessionTimeout,
      autoLogoutEnabled,
      customerSessionMaxAge,
      staffSessionMaxAge,
    } = body;

    // Validation
    if (staffSessionTimeout !== undefined && (staffSessionTimeout < 1 || staffSessionTimeout > 480)) {
      return NextResponse.json(
        { error: 'Staff session timeout must be between 1 and 480 minutes' },
        { status: 400 }
      );
    }

    if (customerSessionMaxAge !== undefined && (customerSessionMaxAge < 3600 || customerSessionMaxAge > 7776000)) {
      return NextResponse.json(
        { error: 'Customer session max age must be between 1 hour and 90 days' },
        { status: 400 }
      );
    }

    if (staffSessionMaxAge !== undefined && (staffSessionMaxAge < 900 || staffSessionMaxAge > 86400)) {
      return NextResponse.json(
        { error: 'Staff session max age must be between 15 minutes and 24 hours' },
        { status: 400 }
      );
    }

    // Get existing settings or create new
    let settings = await prisma.sessionSettings.findFirst();

    if (settings) {
      // Update existing
      settings = await prisma.sessionSettings.update({
        where: { id: settings.id },
        data: {
          customerRememberMe: customerRememberMe ?? settings.customerRememberMe,
          staffSessionTimeout: staffSessionTimeout ?? settings.staffSessionTimeout,
          autoLogoutEnabled: autoLogoutEnabled ?? settings.autoLogoutEnabled,
          customerSessionMaxAge: customerSessionMaxAge ?? settings.customerSessionMaxAge,
          staffSessionMaxAge: staffSessionMaxAge ?? settings.staffSessionMaxAge,
          updatedBy: userId,
        },
      });
    } else {
      // Create new with provided values
      settings = await prisma.sessionSettings.create({
        data: {
          customerRememberMe: customerRememberMe ?? true,
          staffSessionTimeout: staffSessionTimeout ?? 15,
          autoLogoutEnabled: autoLogoutEnabled ?? true,
          customerSessionMaxAge: customerSessionMaxAge ?? 2592000,
          staffSessionMaxAge: staffSessionMaxAge ?? 28800,
          updatedBy: userId,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating session settings:', error);
    return NextResponse.json(
      { error: 'Failed to update session settings' },
      { status: 500 }
    );
  }
}
