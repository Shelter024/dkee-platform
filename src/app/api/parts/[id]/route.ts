import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch single spare part
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const part = await prisma.sparePart.findUnique({
      where: { id: params.id },
    });

    if (!part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }

    return NextResponse.json(part);
  } catch (error) {
    console.error('Error fetching spare part:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update spare part (staff/admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization
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

    // Check if part number is being changed and already exists
    if (partNumber) {
      const existing = await prisma.sparePart.findFirst({
        where: {
          partNumber,
          NOT: { id: params.id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Part number already exists' },
          { status: 400 }
        );
      }
    }

    const part = await prisma.sparePart.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(partNumber && { partNumber }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(supplier !== undefined && { supplier }),
      },
    });

    return NextResponse.json(part);
  } catch (error) {
    console.error('Error updating spare part:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete spare part (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete
    if (session.user.role !== 'ADMIN' && session.user.role !== 'CEO') {
      return NextResponse.json(
        { error: 'Forbidden. Only admins can delete parts.' },
        { status: 403 }
      );
    }

    await prisma.sparePart.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Part deleted successfully' });
  } catch (error) {
    console.error('Error deleting spare part:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
