import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper to calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// POST - Clock In/Out
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, location, deviceInfo } = body;

    if (!['CLOCK_IN', 'CLOCK_OUT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get active policy
    const policy = await prisma.attendancePolicy.findFirst({
      where: {
        isActive: true,
      },
      orderBy: {
        effectiveDate: 'desc',
      },
    });

    if (!policy) {
      return NextResponse.json(
        { error: 'No active attendance policy found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if it's a workday
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const workDays = policy.workDays as string[];
    
    if (!workDays.includes(dayOfWeek)) {
      return NextResponse.json(
        { error: 'Today is not a work day according to the policy' },
        { status: 400 }
      );
    }

    // Verify location if required
    let locationVerified = false;
    let locationDistance: number | null = null;

    if (policy.requireLocationVerification && location) {
      const allowedLocations = policy.allowedLocations as any[];
      
      if (allowedLocations && allowedLocations.length > 0) {
        // Check if within radius of any allowed location
        for (const allowedLoc of allowedLocations) {
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            allowedLoc.latitude,
            allowedLoc.longitude
          );

          if (distance <= (allowedLoc.radius || policy.locationRadius)) {
            locationVerified = true;
            locationDistance = distance;
            break;
          }
        }
      }
    } else if (!policy.requireLocationVerification) {
      locationVerified = true;
    }

    if (action === 'CLOCK_IN') {
      // Check if already clocked in today
      const existingLog = await prisma.attendanceLog.findFirst({
        where: {
          staffId: session.user.id,
          logDate: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      if (existingLog && existingLog.actualClockIn) {
        return NextResponse.json(
          { error: 'You have already clocked in today' },
          { status: 400 }
        );
      }

      // Parse work start time
      const [startHour, startMinute] = policy.workStartTime.split(':').map(Number);
      const expectedClockIn = new Date(today);
      expectedClockIn.setHours(startHour, startMinute, 0, 0);

      // Calculate if late
      const timeDiff = now.getTime() - expectedClockIn.getTime();
      const minutesLate = Math.floor(timeDiff / (1000 * 60));
      const isLate = minutesLate > policy.lateThreshold;

      // Generate log number
      const count = await prisma.attendanceLog.count();
      const logNumber = `ATT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(5, '0')}`;

      const log = existingLog
        ? await prisma.attendanceLog.update({
            where: { id: existingLog.id },
            data: {
              actualClockIn: now,
              clockInLocation: location,
              clockInDevice: deviceInfo,
              locationVerified,
              locationDistance,
              isLate,
              lateByMinutes: isLate ? minutesLate : null,
              status: isLate ? 'LATE' : 'PRESENT',
            },
          })
        : await prisma.attendanceLog.create({
            data: {
              logNumber,
              staffId: session.user.id,
              policyId: policy.id,
              logType: 'CLOCK_IN',
              logDate: today,
              expectedClockIn,
              actualClockIn: now,
              clockInLocation: location,
              clockInDevice: deviceInfo,
              locationVerified,
              locationDistance,
              isLate,
              lateByMinutes: isLate ? minutesLate : null,
              status: isLate ? 'LATE' : 'PRESENT',
            },
          });

      return NextResponse.json({
        message: `Clocked in successfully${isLate ? ' (Late)' : ''}`,
        log,
        locationVerified,
        isLate,
        minutesLate: isLate ? minutesLate : 0,
      });
    }

    if (action === 'CLOCK_OUT') {
      // Find today's log
      const log = await prisma.attendanceLog.findFirst({
        where: {
          staffId: session.user.id,
          logDate: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      if (!log) {
        return NextResponse.json(
          { error: 'No clock-in record found for today' },
          { status: 404 }
        );
      }

      if (log.actualClockOut) {
        return NextResponse.json(
          { error: 'You have already clocked out today' },
          { status: 400 }
        );
      }

      // Parse work end time
      const [endHour, endMinute] = policy.workEndTime.split(':').map(Number);
      const expectedClockOut = new Date(today);
      expectedClockOut.setHours(endHour, endMinute, 0, 0);

      // Calculate if left early
      const timeDiff = expectedClockOut.getTime() - now.getTime();
      const minutesEarly = Math.floor(timeDiff / (1000 * 60));
      const leftEarly = minutesEarly > policy.earlyDepartureThreshold;

      // Calculate total work hours
      const workMillis = now.getTime() - log.actualClockIn!.getTime();
      const totalWorkHours = workMillis / (1000 * 60 * 60);

      const updatedLog = await prisma.attendanceLog.update({
        where: { id: log.id },
        data: {
          actualClockOut: now,
          clockOutLocation: location,
          clockOutDevice: deviceInfo,
          leftEarly,
          earlyByMinutes: leftEarly ? minutesEarly : null,
          totalWorkHours,
        },
      });

      return NextResponse.json({
        message: `Clocked out successfully${leftEarly ? ' (Left Early)' : ''}`,
        log: updatedLog,
        totalWorkHours: totalWorkHours.toFixed(2),
        leftEarly,
      });
    }
  } catch (error: any) {
    console.error('Error processing clock action:', error);
    return NextResponse.json(
      { error: 'Failed to process clock action', details: error.message },
      { status: 500 }
    );
  }
}
