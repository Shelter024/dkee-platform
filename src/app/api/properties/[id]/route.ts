import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/properties/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      include: {
        listedBy: {
          select: { name: true, email: true, phone: true },
        },
        inquiries: {
          include: {
            customer: {
              include: {
                user: { select: { name: true, email: true, phone: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ property });
  } catch (error: any) {
    console.error('GET /api/properties/[id] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}

// PUT /api/properties/[id] - Update property
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const property = await prisma.property.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(propertyType && { propertyType }),
        ...(status && { status }),
        ...(address && { address }),
        ...(city && { city }),
        ...(state && { state }),
        ...(zipCode !== undefined && { zipCode }),
        ...(price !== undefined && { price: Number(price) }),
        ...(size !== undefined && { size: size ? Number(size) : null }),
        ...(bedrooms !== undefined && { bedrooms: bedrooms ? Number(bedrooms) : null }),
        ...(bathrooms !== undefined && { bathrooms: bathrooms ? Number(bathrooms) : null }),
        ...(yearBuilt !== undefined && { yearBuilt: yearBuilt ? Number(yearBuilt) : null }),
        ...(images !== undefined && { images }),
        ...(features !== undefined && { features }),
        ...(surveyConducted !== undefined && { surveyConducted }),
        ...(surveyReport !== undefined && { surveyReport: surveyReport || null }),
      },
      include: {
        listedBy: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({ property });
  } catch (error: any) {
    console.error('PUT /api/properties/[id] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}

// DELETE /api/properties/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = ['ADMIN', 'CEO'].includes(session.user.role);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    await prisma.property.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Property deleted' });
  } catch (error: any) {
    console.error('DELETE /api/properties/[id] error:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
