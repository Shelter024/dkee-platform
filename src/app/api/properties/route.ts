import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/properties - Public/staff can list
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const propertyType = searchParams.get('propertyType');
    const city = searchParams.get('city');

    const where: any = {};
    if (status) where.status = status;
    if (propertyType) where.propertyType = propertyType;
    if (city) where.city = city;

    const properties = await prisma.property.findMany({
      where,
      include: {
        listedBy: {
          select: { name: true, email: true, phone: true },
        },
        inquiries: {
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ properties });
  } catch (error: any) {
    console.error('GET /api/properties error:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}

// POST /api/properties - Admin/staff create listing
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isStaff = ['ADMIN', 'STAFF_PROPERTY', 'CEO', 'MANAGER'].includes(session.user.role);
    if (!isStaff) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title, description, propertyType, status, address, city, state, zipCode,
      price, size, bedrooms, bathrooms, yearBuilt, images, features,
      surveyConducted, surveyReport
    } = body;

    if (!title || !description || !propertyType || !address || !city || !state || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const property = await prisma.property.create({
      data: {
        title,
        description,
        propertyType,
        status: status || 'AVAILABLE',
        address,
        city,
        state,
        zipCode,
        price: Number(price),
        size: size ? Number(size) : undefined,
        bedrooms: bedrooms ? Number(bedrooms) : undefined,
        bathrooms: bathrooms ? Number(bathrooms) : undefined,
        yearBuilt: yearBuilt ? Number(yearBuilt) : undefined,
        images: images || [],
        features: features || [],
        listedById: session.user.id,
        surveyConducted: surveyConducted || false,
        surveyReport: surveyReport || undefined,
      },
      include: {
        listedBy: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({ property });
  } catch (error: any) {
    console.error('POST /api/properties error:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
