import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch assets
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const assetType = searchParams.get('assetType');

    const where: any = {};
    if (status) where.status = status;
    if (assetType) where.assetType = assetType;

    const assets = await prisma.companyAsset.findMany({
      where,
      orderBy: { purchaseDate: 'desc' },
      take: 100,
    });

    return NextResponse.json({ assets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create asset
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = await prisma.staffPermission.findUnique({
      where: { userId: session.user.id },
    });

    if (!permissions?.canManageAssets && !['CEO', 'ADMIN', 'OPERATIONS_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await req.json();
    const { assetType, name, brand, model, serialNumber, purchaseDate, purchasePrice, location, condition, description } = body;

    const count = await prisma.companyAsset.count();
    const assetNumber = `AST-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const asset = await prisma.companyAsset.create({
      data: {
        assetNumber,
        assetType,
        name,
        brand,
        model,
        serialNumber,
        purchaseDate: new Date(purchaseDate),
        purchasePrice: parseFloat(purchasePrice),
        currentValue: parseFloat(purchasePrice),
        location,
        status: 'ACTIVE',
        condition: condition || 'GOOD',
        description,
      },
    });

    return NextResponse.json({ message: 'Asset created', asset });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
