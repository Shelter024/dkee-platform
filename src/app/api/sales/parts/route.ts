import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeString, sanitizeNumber } from '@/lib/sanitize';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only staff, admin, CEO, manager can process sales
    const authorizedRoles: UserRole[] = [UserRole.ADMIN, UserRole.STAFF_AUTO, UserRole.CEO, UserRole.MANAGER];
    if (!authorizedRoles.includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Rate limiting: 30 sales per staff per hour
    const rateLimitResult = await rateLimit(`sales:${session.user.id}`, 30, 3600);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many sales transactions. Please try again later.' },
        { status: 429 }
      );
    }

    const { customerId, items, paymentMethod, discount, subtotal, total } = await req.json();

    // Validation
    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid sale data' }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method is required' }, { status: 400 });
    }

    // Sanitize and validate numeric inputs
    const sanitizedDiscount = discount ? sanitizeNumber(discount) : 0;
    const sanitizedSubtotal = sanitizeNumber(subtotal);
    const sanitizedTotal = sanitizeNumber(total);
    const sanitizedPaymentMethod = sanitizeString(paymentMethod);

    // Validate amounts are non-negative
    if (sanitizedDiscount < 0 || sanitizedSubtotal < 0 || sanitizedTotal < 0) {
      return NextResponse.json({ error: 'Invalid amounts' }, { status: 400 });
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Verify all parts exist and have sufficient stock
    for (const item of items) {
      const part = await prisma.sparePart.findUnique({
        where: { id: item.partId },
      });

      if (!part) {
        return NextResponse.json({ error: `Part ${item.partId} not found` }, { status: 404 });
      }

      if (part.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${part.name}. Available: ${part.stock}` },
          { status: 400 }
        );
      }
    }

    // Generate receipt number
    const receiptCount = await prisma.receipt.count();
    const receiptNumber = `RCT-${String(receiptCount + 1).padStart(6, '0')}`;

    // Create sale record using transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create receipt record
      const receipt = await tx.receipt.create({
        data: {
          receiptNumber,
          customerId,
          amount: sanitizedTotal,
          paymentMethod: sanitizedPaymentMethod,
          issuedBy: session.user.id,
          pdfUrl: null, // Will be generated later if needed
        },
      });

      // Update stock for each part
      for (const item of items) {
        await tx.sparePart.update({
          where: { id: item.partId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return receipt;
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Sale completed successfully',
        receiptNumber: result.receiptNumber,
        receiptId: result.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Parts sale error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const whereClause: any = {};

    // Customers can only view their own sales
    if (session.user.role === UserRole.CUSTOMER) {
      const customer = await prisma.customer.findUnique({
        where: { userId: session.user.id },
      });

      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }

      whereClause.customerId = customer.id;
    } else if (customerId) {
      // Staff/admin can filter by customer
      whereClause.customerId = customerId;
    }

    // Date filters
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate);
      }
    }

    const sales = await prisma.receipt.findMany({
      where: whereClause,
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        issuedByUser: {
          select: {
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error('Fetch sales error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
