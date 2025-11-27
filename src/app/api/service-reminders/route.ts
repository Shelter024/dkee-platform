import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireFeatureAccess } from '@/lib/subscription-gate';
import { sanitizeString } from '@/lib/sanitize';

/**
 * GET /api/service-reminders
 * Get all service reminders for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription access
    const accessError = await requireFeatureAccess(session.user.id, 'OIL_SERVICE_REMINDER');
    if (accessError) {
      return NextResponse.json(accessError, { status: 403 });
    }

    // Get user's vehicles first
    const vehicles = await prisma.vehicle.findMany({
      where: { 
        customer: { userId: session.user.id },
      },
      select: { id: true, make: true, model: true, licensePlate: true },
    });

    // Get all reminders for user's vehicles
    const reminders = await prisma.serviceReminder.findMany({
      where: {
        vehicleId: { in: vehicles.map(v => v.id) },
      },
      include: {
        vehicle: {
          select: {
            make: true,
            model: true,
            year: true,
            licensePlate: true,
            mileage: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json({ reminders }, { status: 200 });
  } catch (error) {
    console.error('Error fetching service reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service reminders' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/service-reminders
 * Create a new service reminder
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription access
    const accessError = await requireFeatureAccess(session.user.id, 'OIL_SERVICE_REMINDER');
    if (accessError) {
      return NextResponse.json(accessError, { status: 403 });
    }

    const body = await req.json();
    const {
      vehicleId,
      serviceType,
      dueDate,
      dueMileage,
      notifyDaysBefore,
      notes,
    } = body;

    // Validate required fields
    if (!vehicleId || !serviceType || (!dueDate && !dueMileage)) {
      return NextResponse.json(
        { error: 'Missing required fields: vehicleId, serviceType, and either dueDate or dueMileage' },
        { status: 400 }
      );
    }

    // Verify vehicle belongs to user
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        customer: { userId: session.user.id },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found or does not belong to user' },
        { status: 404 }
      );
    }

    // Get user's active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
      },
      orderBy: { endDate: 'desc' },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 403 }
      );
    }

    // Sanitize inputs
    const sanitizedData: any = {
      subscriptionId: subscription.id,
      vehicleId,
      serviceType: sanitizeString(serviceType),
      reminderSent: false,
      completed: false,
    };

    if (dueDate) sanitizedData.dueDate = new Date(dueDate);
    if (dueMileage) sanitizedData.dueMileage = parseInt(dueMileage);
    if (notes) sanitizedData.notes = sanitizeString(notes);

    const reminder = await prisma.serviceReminder.create({
      data: sanitizedData,
      include: {
        vehicle: {
          select: {
            make: true,
            model: true,
            licensePlate: true,
          },
        },
      },
    });

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (error) {
    console.error('Error creating service reminder:', error);
    return NextResponse.json(
      { error: 'Failed to create service reminder' },
      { status: 500 }
    );
  }
}
