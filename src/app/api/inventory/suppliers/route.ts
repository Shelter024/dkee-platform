import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/inventory/suppliers
 * Get all suppliers
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const active = searchParams.get('active');

    const where: any = {};
    if (active !== null) {
      where.active = active === 'true';
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        parts: {
          include: {
            part: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error('Get suppliers error:', error);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

/**
 * POST /api/inventory/suppliers
 * Create a new supplier
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, contactPerson, email, phone, address, paymentTerms, taxId, notes } = body;

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactPerson,
        email,
        phone,
        address,
        paymentTerms,
        taxId,
        notes,
      },
    });

    return NextResponse.json({ supplier });
  } catch (error) {
    console.error('Create supplier error:', error);
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}
