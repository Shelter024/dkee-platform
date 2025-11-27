import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { z } from 'zod';

// Validation schema
const propertyRequestSchema = z.object({
  serviceType: z.enum([
    'PROPERTY_SALES',
    'LEASING_RENTAL',
    'PROPERTY_SURVEY',
    'PROPERTY_VALUATION',
    'CONSULTATION',
    'PROPERTY_MANAGEMENT',
  ]),
  formData: z.record(z.any()),
  email: z.string().email(),
  phone: z.string(),
  isDraft: z.boolean().default(false),
  submittedBy: z.string().optional(),
});

// GET - Fetch property requests
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    
    const status = searchParams.get('status');
    const serviceType = searchParams.get('serviceType');
    const isDraft = searchParams.get('isDraft');
    const requestNumber = searchParams.get('requestNumber');

    // Build where clause
    const where: any = {};
    
    // Staff can see all requests, customers only their own
    if (session?.user) {
      const userRole = (session.user as any).role;
      const userId = session.user.id;

      // Check staff permissions
      const hasPropertyAccess = ['ADMIN', 'STAFF_PROPERTY', 'CEO', 'MANAGER'].includes(userRole);
      
      if (!hasPropertyAccess) {
        // Customer can only see their own requests
        where.userId = userId;
      }
    } else {
      // Unauthenticated users cannot fetch requests
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (status) where.status = status;
    if (serviceType) where.serviceType = serviceType;
    if (isDraft !== null) where.isDraft = isDraft === 'true';
    if (requestNumber) where.requestNumber = requestNumber;

    const requests = await prisma.propertyRequest.findMany({
      where,
      include: {
        documents: true,
        comments: {
          include: {
            // We'll add user relation later
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error('Error fetching property requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create or update property request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    // Validate request body
    const validatedData = propertyRequestSchema.parse(body);

    const userId = session?.user?.id || null;
    const userName = session?.user?.name || validatedData.submittedBy || 'Guest';

    // Generate request number if not draft
    let requestNumber = '';
    if (!validatedData.isDraft) {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const count = await prisma.propertyRequest.count({
        where: {
          requestNumber: { startsWith: `PR-${dateStr}` },
        },
      });
      requestNumber = `PR-${dateStr}-${String(count + 1).padStart(4, '0')}`;
    }

    // Create property request
    const propertyRequest = await prisma.propertyRequest.create({
      data: {
        requestNumber: requestNumber || `DRAFT-${Date.now()}`,
        serviceType: validatedData.serviceType,
        formData: validatedData.formData,
        email: validatedData.email,
        phone: validatedData.phone,
        userId,
        submittedBy: userName,
        isDraft: validatedData.isDraft,
        status: validatedData.isDraft ? 'DRAFT' : 'SUBMITTED',
        submittedAt: validatedData.isDraft ? null : new Date(),
      },
      include: {
        documents: true,
      },
    });

    // Send email notifications if not draft
    if (!validatedData.isDraft) {
      try {
        // Email to customer
        await sendEmail({
          to: validatedData.email,
          subject: `Property Request Received - ${requestNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">DK Engineers Ghana</h1>
              </div>
              <div style="padding: 30px; background: #f9fafb;">
                <h2 style="color: #1f2937;">Request Received</h2>
                <p>Dear ${userName},</p>
                <p>We have received your ${validatedData.serviceType.replace(/_/g, ' ').toLowerCase()} request.</p>
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Request Number:</strong> ${requestNumber}</p>
                  <p><strong>Service Type:</strong> ${validatedData.serviceType.replace(/_/g, ' ')}</p>
                  <p><strong>Status:</strong> Submitted</p>
                  <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <p>Our team will review your request and get back to you within 24-48 hours.</p>
                <p>Thank you for choosing DK Engineers Ghana!</p>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
                  <p>DK Engineers Ghana - Property Management Services</p>
                  <p>Pawpaw Street, East Legon, Accra</p>
                </div>
              </div>
            </div>
          `,
        });

        // Email to admin/staff
        const adminUsers = await prisma.user.findMany({
          where: {
            OR: [
              { role: 'ADMIN' },
              { role: 'STAFF_PROPERTY' },
              { role: 'CEO' },
              { role: 'MANAGER' },
            ],
          },
          select: { email: true },
        });

        if (adminUsers.length > 0) {
          await sendEmail({
            to: adminUsers.map(u => u.email).join(', '),
            subject: `New Property Request - ${requestNumber}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0;">New Property Request</h1>
                </div>
                <div style="padding: 30px; background: #f9fafb;">
                  <h2 style="color: #1f2937;">Request Details</h2>
                  <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Request Number:</strong> ${requestNumber}</p>
                    <p><strong>Service Type:</strong> ${validatedData.serviceType.replace(/_/g, ' ')}</p>
                    <p><strong>Customer Name:</strong> ${userName}</p>
                    <p><strong>Email:</strong> ${validatedData.email}</p>
                    <p><strong>Phone:</strong> ${validatedData.phone}</p>
                    <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                  </div>
                  <p>Please review and respond to this request in the admin dashboard.</p>
                  <a href="${process.env.NEXTAUTH_URL}/dashboard/admin/property-requests" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
                    View Request
                  </a>
                </div>
              </div>
            `,
          });
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      request: propertyRequest,
      message: validatedData.isDraft
        ? 'Draft saved successfully'
        : 'Request submitted successfully',
    });
  } catch (error: any) {
    console.error('Error creating property request:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create request', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update existing request
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Request ID required' }, { status: 400 });
    }

    // Check if user has permission to update
    const existingRequest = await prisma.propertyRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const userRole = (session.user as any).role;
    const userId = session.user.id;
    const hasPropertyAccess = ['ADMIN', 'STAFF_PROPERTY', 'CEO', 'MANAGER'].includes(userRole);

    // Customer can only update their own drafts
    if (!hasPropertyAccess && existingRequest.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update request
    const updatedRequest = await prisma.propertyRequest.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        documents: true,
        comments: true,
      },
    });

    return NextResponse.json({
      success: true,
      request: updatedRequest,
    });
  } catch (error: any) {
    console.error('Error updating property request:', error);
    return NextResponse.json(
      { error: 'Failed to update request', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete request (drafts only for customers, any for staff)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Request ID required' }, { status: 400 });
    }

    const existingRequest = await prisma.propertyRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const userRole = (session.user as any).role;
    const userId = session.user.id;
    const hasPropertyAccess = ['ADMIN', 'STAFF_PROPERTY', 'CEO', 'MANAGER'].includes(userRole);

    // Customer can only delete their own drafts
    if (!hasPropertyAccess && (existingRequest.userId !== userId || !existingRequest.isDraft)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.propertyRequest.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Request deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting property request:', error);
    return NextResponse.json(
      { error: 'Failed to delete request', details: error.message },
      { status: 500 }
    );
  }
}
