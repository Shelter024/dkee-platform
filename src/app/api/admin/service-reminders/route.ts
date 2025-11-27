import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/service-reminders
 * Get all service reminders for all customers (admin only)
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
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query filter
    const where: any = {};

    // Filter by completion status
    if (status === 'completed') {
      where.completed = true;
    } else if (status === 'active') {
      where.completed = false;
    }

    // Search by vehicle make/model or customer name
    if (search) {
      where.OR = [
        {
          vehicle: {
            OR: [
              { make: { contains: search, mode: 'insensitive' } },
              { model: { contains: search, mode: 'insensitive' } },
              { licensePlate: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        {
          vehicle: {
            customer: {
              user: {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          },
        },
      ];
    }

    const reminders = await prisma.serviceReminder.findMany({
      where,
      include: {
        vehicle: {
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
          },
        },
        subscription: {
          select: {
            plan: true,
            status: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // Calculate statistics
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const statistics = {
      total: reminders.length,
      active: reminders.filter((r) => !r.completed).length,
      completed: reminders.filter((r) => r.completed).length,
      upcoming: reminders.filter(
        (r) => !r.completed && r.dueDate && new Date(r.dueDate) > sevenDaysFromNow
      ).length,
      dueSoon: reminders.filter(
        (r) =>
          !r.completed &&
          r.dueDate &&
          new Date(r.dueDate) <= sevenDaysFromNow &&
          new Date(r.dueDate) >= now
      ).length,
      overdue: reminders.filter(
        (r) => !r.completed && r.dueDate && new Date(r.dueDate) < now
      ).length,
      notified: reminders.filter((r) => r.reminderSent).length,
    };

    return NextResponse.json({
      reminders,
      statistics,
    });
  } catch (error) {
    console.error('Error fetching admin service reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service reminders' },
      { status: 500 }
    );
  }
}
