import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/tracking
 * Get all vehicle tracking data for all customers (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== 'ADMIN' && session.user.role !== 'CEO') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    // Build query filter
    const where: any = {};

    // Search by vehicle make/model or customer name
    if (search) {
      where.OR = [
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { licensePlate: { contains: search, mode: 'insensitive' } },
        {
          customer: {
            user: {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    // Get all vehicles with tracking enabled
    const vehicles = await prisma.vehicle.findMany({
      where: {
        trackingDevice: true,
        ...where,
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        trackingLogs: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 1, // Get latest tracking log only
        },
      },
    });

    // Get the latest tracking location for each vehicle
    const vehiclesWithTracking = vehicles.map((vehicle: any) => {
      const latestLog = vehicle.trackingLogs[0];

      let status = 'offline';
      if (latestLog) {
        const lastUpdate = new Date(latestLog.timestamp).getTime();
        const now = Date.now();
        const minutesAgo = (now - lastUpdate) / (1000 * 60);

        if (minutesAgo < 5) {
          // Updated in last 5 minutes
          if (latestLog.speed && latestLog.speed > 5) {
            status = 'moving';
          } else if (latestLog.speed && latestLog.speed > 0) {
            status = 'idling';
          } else {
            status = 'parked';
          }
        } else if (minutesAgo < 60) {
          // Updated in last hour
          status = 'recent';
        }
      }

      return {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.licensePlate,
        color: vehicle.color,
        mileage: vehicle.mileage,
        customer: {
          id: vehicle.customer.id,
          name: vehicle.customer.user.name,
          email: vehicle.customer.user.email,
          phone: vehicle.customer.user.phone,
        },
        latestTracking: latestLog
          ? {
              latitude: latestLog.latitude,
              longitude: latestLog.longitude,
              speed: latestLog.speed,
              heading: latestLog.heading,
              accuracy: latestLog.accuracy,
              address: latestLog.address,
              timestamp: latestLog.timestamp,
            }
          : null,
        status,
      };
    });

    // Calculate statistics
    const statistics = {
      total: vehiclesWithTracking.length,
      active: vehiclesWithTracking.filter((v: any) => v.status !== 'offline').length,
      moving: vehiclesWithTracking.filter((v: any) => v.status === 'moving').length,
      parked: vehiclesWithTracking.filter((v: any) => v.status === 'parked').length,
      idling: vehiclesWithTracking.filter((v: any) => v.status === 'idling').length,
      offline: vehiclesWithTracking.filter((v: any) => v.status === 'offline').length,
      averageSpeed:
        vehiclesWithTracking.filter((v: any) => v.latestTracking?.speed).length > 0
          ? vehiclesWithTracking
              .filter((v: any) => v.latestTracking?.speed)
              .reduce((sum: number, v: any) => sum + (v.latestTracking?.speed || 0), 0) /
            vehiclesWithTracking.filter((v: any) => v.latestTracking?.speed).length
          : 0,
    };

    return NextResponse.json({
      vehicles: vehiclesWithTracking,
      statistics,
    });
  } catch (error) {
    console.error('Error fetching admin tracking data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking data' },
      { status: 500 }
    );
  }
}
