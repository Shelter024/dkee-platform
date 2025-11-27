import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/marketing/campaigns
 * Get all campaigns
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        recipients: {
          take: 5, // Only fetch first 5 recipients for list view
        },
        _count: {
          select: { recipients: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Get campaigns error:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

/**
 * POST /api/marketing/campaigns
 * Create a new campaign
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      description,
      type,
      channel,
      subject,
      messageTemplate,
      targetAudience,
      tierFilter,
      sendAt,
    } = body;

    if (!name || !type || !channel || !messageTemplate || !targetAudience) {
      return NextResponse.json(
        { error: 'name, type, channel, messageTemplate, and targetAudience are required' },
        { status: 400 }
      );
    }

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        type,
        channel,
        subject,
        messageTemplate,
        targetAudience,
        tierFilter,
        sendAt: sendAt ? new Date(sendAt) : undefined,
        status: sendAt ? 'SCHEDULED' : 'DRAFT',
        createdBy: session.user.id,
      },
    });

    // Build recipient list based on target audience
    let customers: any[] = [];
    
    if (targetAudience === 'ALL') {
      customers = await prisma.customer.findMany({
        include: { user: true },
      });
    } else if (targetAudience === 'NEW_CUSTOMERS') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      customers = await prisma.customer.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        include: { user: true },
      });
    } else if (targetAudience === 'LOYALTY_TIER' && tierFilter) {
      customers = await prisma.customer.findMany({
        where: { loyaltyTier: tierFilter },
        include: { user: true },
      });
    } else if (targetAudience === 'INACTIVE') {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      customers = await prisma.customer.findMany({
        where: {
          automotiveServices: {
            none: {
              createdAt: { gte: ninetyDaysAgo },
            },
          },
        },
        include: { user: true },
      });
    }

    // Create campaign recipients
    const recipients = customers.map((customer) => ({
      campaignId: campaign.id,
      customerId: customer.id,
      email: channel.includes('EMAIL') ? customer.user.email : undefined,
      phone: channel.includes('SMS') ? customer.user.phone : undefined,
      name: customer.user.name,
    }));

    if (recipients.length > 0) {
      await prisma.campaignRecipient.createMany({
        data: recipients,
      });

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { totalRecipients: recipients.length },
      });
    }

    return NextResponse.json({
      campaign,
      message: `Campaign created with ${recipients.length} recipients`,
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
