import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/appointments/available-slots?date=2025-11-26
 * Get available appointment time slots for a specific date
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json({ error: 'date parameter is required' }, { status: 400 });
    }

    const date = new Date(dateParam);
    
    // Validate date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return NextResponse.json({ error: 'Date must be in the future' }, { status: 400 });
    }

    // Define business hours and slot duration
    const businessHours = {
      start: '08:00',
      end: '17:00',
    };
    const slotDuration = 60; // minutes
    const maxConcurrentAppointments = 3; // Number of bays/technicians

    // Generate all possible time slots
    const timeSlots: string[] = [];
    const [startHour, startMinute] = businessHours.start.split(':').map(Number);
    const [endHour, endMinute] = businessHours.end.split(':').map(Number);

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMinute < endMinute)
    ) {
      timeSlots.push(
        `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`
      );
      currentMinute += slotDuration;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }

    // Get existing appointments for the date
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        preferredDate: {
          gte: date,
          lt: nextDay,
        },
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
        },
      },
      select: {
        preferredTime: true,
        duration: true,
      },
    });

    // Count appointments per time slot
    const slotCounts: { [key: string]: number } = {};
    existingAppointments.forEach((apt) => {
      slotCounts[apt.preferredTime] = (slotCounts[apt.preferredTime] || 0) + 1;
    });

    // Build available slots with status
    const availableSlots = timeSlots.map((time) => {
      const bookedCount = slotCounts[time] || 0;
      const availableSpots = maxConcurrentAppointments - bookedCount;

      return {
        time,
        available: availableSpots > 0,
        availableSpots,
        totalSpots: maxConcurrentAppointments,
      };
    });

    return NextResponse.json({
      date: dateParam,
      businessHours,
      slots: availableSlots,
    });
  } catch (error) {
    console.error('Available slots error:', error);
    return NextResponse.json({ error: 'Failed to fetch available slots' }, { status: 500 });
  }
}
