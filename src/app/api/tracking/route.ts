import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireFeatureAccess } from '@/lib/subscription-gate';
import { sanitizeString } from '@/lib/sanitize';

/**
 * GET /api/tracking
 * Get tracking data for user's vehicles
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription access
    const accessError = await requireFeatureAccess(session.user.id, 'VEHICLE_TRACKING');
    if (accessError) {
      return NextResponse.json(accessError, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get('vehicleId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const whereClause: any = {
      vehicle: {
        userId: session.user.id,
      },
    };

    if (vehicleId) {
      whereClause.vehicleId = vehicleId;
    }

    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) whereClause.timestamp.gte = new Date(startDate);
      if (endDate) whereClause.timestamp.lte = new Date(endDate);
    }

    const trackingLogs = await prisma.trackingLog.findMany({
      where: whereClause,
      include: {
        vehicle: {
          select: {
            make: true,
            model: true,
            licensePlate: true,
            year: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    // Get latest location for each vehicle
    const vehicles = await prisma.vehicle.findMany({
      where: { customer: { userId: session.user.id } },
      select: { id: true, make: true, model: true, licensePlate: true },
    });

    const latestLocations = await Promise.all(
      vehicles.map(async (vehicle) => {
        const latest = await prisma.trackingLog.findFirst({
          where: { vehicleId: vehicle.id },
          orderBy: { timestamp: 'desc' },
        });
        return {
          vehicle,
          location: latest,
        };
      })
    );

    return NextResponse.json(
      {
        trackingLogs,
        latestLocations: latestLocations.filter((l) => l.location),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching tracking data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tracking
 * Create a new tracking log entry (for GPS device updates)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription access
    const accessError = await requireFeatureAccess(session.user.id, 'VEHICLE_TRACKING');
    if (accessError) {
      return NextResponse.json(accessError, { status: 403 });
    }

    const body = await req.json();
    const {
      vehicleId,
      latitude,
      longitude,
      speed,
      heading,
      altitude,
      accuracy,
      batteryLevel,
      fuelLevel,
      engineTemp,
      address,
    } = body;

    // Validate required fields
    if (!vehicleId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: vehicleId, latitude, longitude' },
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

    // Create tracking log
    const trackingLog = await prisma.trackingLog.create({
      data: {
        subscriptionId: subscription.id,
        vehicleId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        speed: speed ? parseFloat(speed) : null,
        heading: heading ? parseFloat(heading) : null,
        accuracy: accuracy ? parseFloat(accuracy) : null,
        address: address ? sanitizeString(address) : null,
        timestamp: new Date(),
      },
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

    // Update vehicle's last updated timestamp
    if (vehicle.mileage !== undefined) {
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { updatedAt: new Date() },
      });
    }

    return NextResponse.json({ trackingLog }, { status: 201 });
  } catch (error) {
    console.error('Error creating tracking log:', error);
    return NextResponse.json(
      { error: 'Failed to create tracking log' },
      { status: 500 }
    );
  }
}
