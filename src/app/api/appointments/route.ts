import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/appointments
 * List appointments with filters
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const technicianId = searchParams.get('technicianId');

    const where: any = {};

    // Customers can only see their own appointments
    if (session.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: session.user.id },
      });
      if (!customer) {
        return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
      }
      where.customerId = customer.id;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by date
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      where.preferredDate = {
        gte: startDate,
        lt: endDate,
      };
    }

    // Filter by technician
    if (technicianId) {
      where.assignedTo = technicianId;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        customer: {
          include: { user: { select: { id: true, name: true, email: true, phone: true } } },
        },
        vehicle: true,
        assignedTechnician: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      orderBy: [{ preferredDate: 'asc' }, { preferredTime: 'asc' }],
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('List appointments error:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

/**
 * POST /api/appointments
 * Create a new appointment
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { vehicleId, serviceType, description, preferredDate, preferredTime, duration } = body;

    // Validate required fields
    if (!serviceType || !description || !preferredDate || !preferredTime) {
      return NextResponse.json(
        { error: 'serviceType, description, preferredDate, and preferredTime are required' },
        { status: 400 }
      );
    }

    // Get customer
    let customerId: string;
    if (session.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: session.user.id },
      });
      if (!customer) {
        return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
      }
      customerId = customer.id;
    } else {
      // Admin/staff can create appointments for any customer
      if (!body.customerId) {
        return NextResponse.json(
          { error: 'customerId is required for staff bookings' },
          { status: 400 }
        );
      }
      customerId = body.customerId;
    }

    // Validate vehicle ownership if provided
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });
      if (!vehicle || vehicle.customerId !== customerId) {
        return NextResponse.json(
          { error: 'Invalid vehicle for this customer' },
          { status: 400 }
        );
      }
    }

    // Validate appointment date is in the future
    const appointmentDate = new Date(preferredDate);
    if (appointmentDate < new Date()) {
      return NextResponse.json(
        { error: 'Appointment date must be in the future' },
        { status: 400 }
      );
    }

    // Generate appointment number
    const count = await prisma.appointment.count();
    const appointmentNumber = `APT-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Check for conflicts (optional - if time slots are strict)
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        preferredDate: appointmentDate,
        preferredTime,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
      },
    });

    const appointment = await prisma.appointment.create({
      data: {
        appointmentNumber,
        customerId,
        vehicleId: vehicleId || undefined,
        serviceType,
        description,
        preferredDate: appointmentDate,
        preferredTime,
        duration: duration || 60,
        notes: body.notes,
        status: existingAppointment ? 'PENDING' : 'CONFIRMED',
      },
      include: {
        customer: {
          include: { user: { select: { id: true, name: true, email: true, phone: true } } },
        },
        vehicle: true,
      },
    });

    // TODO: Send confirmation email/SMS

    return NextResponse.json({
      appointment,
      message: existingAppointment
        ? 'Appointment created and pending confirmation due to time slot conflict'
        : 'Appointment confirmed successfully',
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}
