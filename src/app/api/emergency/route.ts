import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { logSuccess, logFailure } from '@/lib/audit';

/**
 * POST /api/emergency
 * Submit a new emergency assistance request
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, location, latitude, longitude, priority, contactPhone } = body;

    // Validate required fields
    if (!title || !description || !location || !priority) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, location, priority' },
        { status: 400 }
      );
    }

    // Create emergency request in database
    const emergencyRequest = await prisma.emergencyRequest.create({
      data: {
        userId: session.user.id,
        title,
        description,
        location,
        latitude: latitude || null,
        longitude: longitude || null,
        priority: priority.toUpperCase(),
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Log audit trail
    await logSuccess('service.create', {
      userId: session.user.id,
      headers: req.headers,
      metadata: {
        targetId: emergencyRequest.id,
        priority: priority,
        location,
      },
    });

    // Notify staff via email (send to all STAFF/ADMIN/MANAGER roles)
    try {
      const staffUsers = await prisma.user.findMany({
        where: {
          role: {
            in: ['ADMIN', 'CEO', 'MANAGER', 'STAFF_AUTO', 'STAFF_PROPERTY'],
          },
        },
        select: {
          email: true,
        },
      });

      // Send email to all staff members
      const emailPromises = staffUsers.map((staff) =>
        sendEmail({
          to: staff.email,
          subject: `🚨 EMERGENCY REQUEST: ${title}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .header h1 { color: white; margin: 0; font-size: 24px; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
                .details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
                .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                .detail-row:last-child { border-bottom: none; }
                .button { display: inline-block; padding: 12px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🚨 EMERGENCY ASSISTANCE REQUEST</h1>
                </div>
                <div class="content">
                  <div class="alert-box">
                    <strong>⚠️ Priority: ${priority.toUpperCase()}</strong>
                  </div>
                  <h2>Emergency Details</h2>
                  <div class="details">
                    <div class="detail-row">
                      <span><strong>Type:</strong></span>
                      <span>${title}</span>
                    </div>
                    <div class="detail-row">
                      <span><strong>Customer:</strong></span>
                      <span>${emergencyRequest.user.name}</span>
                    </div>
                    <div class="detail-row">
                      <span><strong>Phone:</strong></span>
                      <span>${contactPhone || emergencyRequest.user.phone || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                      <span><strong>Location:</strong></span>
                      <span>${location}</span>
                    </div>
                    <div class="detail-row">
                      <span><strong>Time:</strong></span>
                      <span>${new Date().toLocaleString()}</span>
                    </div>
                  </div>
                  <h3>Description:</h3>
                  <p style="background: white; padding: 15px; border-radius: 6px;">${description}</p>
                  <a href="${process.env.NEXTAUTH_URL}/dashboard/admin/emergency" class="button">View in Dashboard</a>
                  <p style="margin-top: 20px; color: #dc2626; font-weight: bold;">
                    ⏰ Please respond to this emergency request as soon as possible.
                  </p>
                </div>
                <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} DK Executive Engineers. All rights reserved.</p>
                  <p>Accra, Ghana | +233 24 101 8947 | emergency@dkexecutive.com</p>
                </div>
              </div>
            </body>
            </html>
          `,
        })
      );

      await Promise.allSettled(emailPromises);
    } catch (emailError) {
      // Don't fail request if emails fail - just log the error
      console.error('[Emergency API] Failed to send notification emails:', emailError);
    }

    return NextResponse.json(
      {
        success: true,
        data: emergencyRequest,
        message: 'Emergency request submitted successfully. Help is on the way!',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Emergency API] Error creating emergency request:', error);

    // Log failure
    try {
      const session = await getServerSession(authOptions);
      await logFailure('service.create', error instanceof Error ? error.message : 'Unknown error', {
        userId: session?.user?.id,
        headers: req.headers,
      });
    } catch (auditError) {
      console.error('[Emergency API] Audit log failed:', auditError);
    }

    return NextResponse.json(
      { error: 'Failed to submit emergency request. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/emergency
 * Fetch all emergency requests for the current user (customers) or all requests (staff)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isStaff = ['ADMIN', 'CEO', 'MANAGER', 'STAFF_AUTO', 'STAFF_PROPERTY'].includes(
      session.user.role
    );

    // Staff can see all requests, customers only see their own
    const emergencyRequests = await prisma.emergencyRequest.findMany({
      where: isStaff ? {} : { userId: session.user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ data: emergencyRequests }, { status: 200 });
  } catch (error) {
    console.error('[Emergency API] Error fetching emergency requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emergency requests' },
      { status: 500 }
    );
  }
}
