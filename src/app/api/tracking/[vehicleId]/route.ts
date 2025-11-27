import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireFeatureAccess } from '@/lib/subscription-gate';

/**
 * GET /api/tracking/[vehicleId]
 * Get tracking history for a specific vehicle
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
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

    // Verify vehicle belongs to user
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: params.vehicleId,
        customer: {
          userId: session.user.id,
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found or does not belong to user' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const whereClause: any = {
      vehicleId: params.vehicleId,
    };

    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) whereClause.timestamp.gte = new Date(startDate);
      if (endDate) whereClause.timestamp.lte = new Date(endDate);
    }

    const trackingLogs = await prisma.trackingLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    // Calculate statistics
    const stats = {
      totalLogs: trackingLogs.length,
      averageSpeed: trackingLogs.length > 0
        ? trackingLogs.reduce((sum, log) => sum + (log.speed || 0), 0) / trackingLogs.length
        : 0,
      maxSpeed: trackingLogs.length > 0
        ? Math.max(...trackingLogs.map((log) => log.speed || 0))
        : 0,
      totalDistance: 0, // Calculate from coordinates if needed
      timeRange: {
        start: trackingLogs.length > 0 ? trackingLogs[trackingLogs.length - 1].timestamp : null,
        end: trackingLogs.length > 0 ? trackingLogs[0].timestamp : null,
      },
    };

    return NextResponse.json(
      {
        vehicle,
        trackingLogs,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching vehicle tracking history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking history' },
      { status: 500 }
    );
  }
}
