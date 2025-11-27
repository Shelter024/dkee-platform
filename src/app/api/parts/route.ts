import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch all spare parts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const parts = await prisma.sparePart.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { partNumber: { contains: search, mode: 'insensitive' } },
                  { description: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          category ? { category: category } : {},
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(parts);
  } catch (error) {
    console.error('Error fetching spare parts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new spare part (staff/admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or auto staff
    const isAuthorized =
      session.user.role === 'ADMIN' ||
      session.user.role === 'STAFF_AUTO' ||
      session.user.role === 'CEO' ||
      session.user.role === 'MANAGER';

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden. Only staff can manage inventory.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, partNumber, category, description, price, stock, supplier } = body;

    // Validation
    if (!name || !partNumber || !category || price === undefined || stock === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, partNumber, category, price, stock' },
        { status: 400 }
      );
    }

    // Check if part number already exists
    const existing = await prisma.sparePart.findUnique({
      where: { partNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Part number already exists' },
        { status: 400 }
      );
    }

    const part = await prisma.sparePart.create({
      data: {
        name,
        partNumber,
        category,
        description: description || null,
        price: parseFloat(price),
        stock: parseInt(stock),
        supplier: supplier || null,
      },
    });

    return NextResponse.json(part, { status: 201 });
  } catch (error) {
    console.error('Error creating spare part:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
