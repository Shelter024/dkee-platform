import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isElevatedRole } from '@/lib/roles';
import { generateInvoicePDF, generateReceiptPDF } from '@/lib/pdf';
import { uploadFile } from '@/lib/cloudinary';
import { generateInvoiceNumber } from '@/lib/utils';
import { z } from 'zod';

const createInvoiceSchema = z.object({
  customerId: z.string(),
  automotiveServiceId: z.string().optional(),
  description: z.string(),
  items: z.array(
    z.object({
      description: z.string(),
      quantity: z.number().min(1),
      price: z.number().min(0),
    })
  ),
  tax: z.number().default(0),
  dueDate: z.string(),
  notes: z.string().optional(),
});

// POST /api/invoices - Create invoice with PDF
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !isElevatedRole(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const validation = createInvoiceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { customerId, automotiveServiceId, description, items, tax, dueDate, notes } =
      validation.data;

    // Get customer details
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        user: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Calculate totals
    const itemsWithTotals = items.map((item) => ({
      ...item,
      total: item.quantity * item.price,
    }));

    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal + tax;

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();

    // Get service details if linked
    let service = null;
    if (automotiveServiceId) {
      service = await prisma.automotiveService.findUnique({
        where: { id: automotiveServiceId },
        include: { vehicle: true },
      });
    }

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId,
        automotiveServiceId,
        description,
        subtotal,
        tax,
        total,
        dueDate: new Date(dueDate),
        notes,
        paymentStatus: 'UNPAID',
      },
    });

    // Generate PDF
    // Note: Use generateReceiptPDF for payment receipts (compact format)
    // Use generateInvoicePDF for detailed invoices (full A4 format)
    try {
      const pdfBuffer = await generateReceiptPDF({
        invoiceNumber,
        date: invoice.createdAt,
        dueDate: new Date(dueDate),
        customer: {
          name: customer.user.name,
          email: customer.user.email,
          phone: customer.user.phone || undefined,
          address: customer.address || undefined,
        },
        service: service
          ? {
              description: service.description,
              vehicleInfo: `${service.vehicle.make} ${service.vehicle.model} (${service.vehicle.year})`,
            }
          : undefined,
        items: itemsWithTotals,
        subtotal,
        tax,
        total,
        notes,
      });

      // Upload PDF to Cloudinary
      const uploadResult = await uploadFile(pdfBuffer, {
        folder: 'invoices',
        filename: `invoice-${invoiceNumber}`,
        resourceType: 'raw',
      });

      // Update invoice with PDF URL
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          pdfUrl: uploadResult.url,
          pdfGeneratedAt: new Date(),
        },
      });

      invoice.pdfUrl = uploadResult.url;
      invoice.pdfGeneratedAt = new Date();
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      // Invoice created but PDF failed - can be regenerated later
    }

    return NextResponse.json({
      message: 'Invoice created successfully',
      invoice,
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}

// GET /api/invoices - List invoices
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    let where: any = {};

    // Customers see only their own invoices
    if (session.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: session.user.id },
      });

      if (!customer) {
        return NextResponse.json({ invoices: [], pagination: { total: 0, page, limit, pages: 0 } });
      }

      where.customerId = customer.id;
    }

    // Filter by payment status
    if (status) {
      where.paymentStatus = status;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: {
            include: {
              user: {
                select: { name: true, email: true },
              },
            },
          },
          automotiveService: {
            select: {
              id: true,
              serviceType: true,
              jobCardNumber: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List invoices error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
