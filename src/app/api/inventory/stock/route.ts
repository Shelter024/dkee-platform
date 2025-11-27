import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/inventory/stock
 * Get inventory stock levels with alerts
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    const category = searchParams.get('category');
    const lowStock = searchParams.get('lowStock') === 'true';

    const where: any = {};
    if (branchId) where.branchId = branchId;
    if (category) where.category = category;

    let parts = await prisma.sparePart.findMany({
      where,
      include: {
        branch: true,
        suppliers: {
          include: {
            supplier: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    if (lowStock) {
      parts = parts.filter(part => part.stock <= part.reorderPoint);
    }

    const stockSummary = {
      totalParts: parts.length,
      totalValue: parts.reduce((sum, part) => sum + (part.price * part.stock), 0),
      lowStockCount: parts.filter(part => part.stock <= part.reorderPoint).length,
      outOfStockCount: parts.filter(part => part.stock === 0).length,
    };

    return NextResponse.json({
      parts,
      summary: stockSummary,
    });
  } catch (error) {
    console.error('Get stock error:', error);
    return NextResponse.json({ error: 'Failed to fetch stock' }, { status: 500 });
  }
}

/**
 * POST /api/inventory/stock
 * Add or adjust stock levels
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { partId, quantity, type, notes, referenceId, referenceType } = await req.json();

    if (!partId || !quantity || !type) {
      return NextResponse.json(
        { error: 'partId, quantity, and type are required' },
        { status: 400 }
      );
    }

    const part = await prisma.sparePart.findUnique({
      where: { id: partId },
    });

    if (!part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }

    const previousStock = part.stock;
    const adjustedQuantity = type === 'STOCK_IN' ? quantity : -quantity;
    const newStock = Math.max(0, previousStock + adjustedQuantity);

    // Update stock and create movement record
    const [updatedPart, movement] = await prisma.$transaction([
      prisma.sparePart.update({
        where: { id: partId },
        data: {
          stock: newStock,
          lastRestockedAt: type === 'STOCK_IN' ? new Date() : undefined,
        },
      }),
      prisma.stockMovement.create({
        data: {
          partId,
          type,
          quantity: adjustedQuantity,
          previousStock,
          newStock,
          reference: referenceId,
          referenceType,
          notes,
          performedBy: session.user.id,
        },
      }),
    ]);

    return NextResponse.json({
      part: updatedPart,
      movement,
      message: `Stock ${type === 'STOCK_IN' ? 'added' : 'removed'} successfully`,
    });
  } catch (error) {
    console.error('Stock adjustment error:', error);
    return NextResponse.json({ error: 'Failed to adjust stock' }, { status: 500 });
  }
}
