import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/analytics - Dashboard metrics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isStaff = ['ADMIN', 'CEO', 'MANAGER', 'STAFF_AUTO', 'STAFF_PROPERTY'].includes(session.user.role);
    if (!isStaff) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30'; // days
    const since = new Date();
    since.setDate(since.getDate() - Number(period));

    // Revenue metrics
    const revenueData = await prisma.invoice.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: since },
        paymentStatus: { in: ['PAID', 'PARTIALLY_PAID'] },
      },
      _sum: { amountPaid: true },
    });

    // Service metrics
    const serviceStats = await prisma.automotiveService.groupBy({
      by: ['status'],
      where: { createdAt: { gte: since } },
      _count: true,
    });

    // Top services
    const topServices = await prisma.automotiveService.groupBy({
      by: ['serviceType'],
      where: { createdAt: { gte: since } },
      _count: true,
      orderBy: { _count: { serviceType: 'desc' } },
      take: 5,
    });

    // Customer growth
    const customerGrowth = await prisma.customer.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: since } },
      _count: true,
    });

    // Outstanding payments
    const outstanding = await prisma.invoice.aggregate({
      where: { paymentStatus: { in: ['UNPAID', 'PARTIALLY_PAID'] } },
      _sum: { total: true, amountPaid: true },
    });

    const outstandingAmount = ((outstanding._sum?.total || 0) - (outstanding._sum?.amountPaid || 0));

    // Top customers by revenue
    const topCustomers = await prisma.customer.findMany({
      include: {
        user: { select: { name: true, email: true } },
        automotiveServices: {
          include: { invoice: true },
        },
      },
      take: 10,
    });

    const customersWithRevenue = topCustomers
      .map(c => ({
        id: c.id,
        name: c.user.name,
        email: c.user.email,
        revenue: c.automotiveServices.reduce((sum, s) => sum + (s.invoice?.amountPaid || 0), 0),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return NextResponse.json({
      revenue: revenueData,
      serviceStats,
      topServices,
      customerGrowth,
      outstandingAmount,
      topCustomers: customersWithRevenue,
    });
  } catch (error: any) {
    console.error('GET /api/analytics error:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
