import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/marketing/campaigns/[id]/send
 * Send campaign to all recipients
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        recipients: {
          where: { status: 'pending' },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status === 'SENT') {
      return NextResponse.json({ error: 'Campaign already sent' }, { status: 400 });
    }

    // Update campaign status
    await prisma.campaign.update({
      where: { id: params.id },
      data: {
        status: 'SENDING',
      },
    });

    // TODO: Implement actual email/SMS sending logic here
    // For now, we'll mark as sent immediately
    // In production, this should be a background job

    let successCount = 0;
    let failureCount = 0;

    for (const recipient of campaign.recipients) {
      try {
        // Simulate sending (replace with actual email/SMS service)
        // await sendEmail(recipient.email, campaign.subject, campaign.messageTemplate);
        // await sendSMS(recipient.phone, campaign.messageTemplate);

        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
          },
        });

        successCount++;
      } catch (error) {
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: 'failed',
            errorMessage: (error as Error).message,
          },
        });

        failureCount++;
      }
    }

    // Update campaign with results
    await prisma.campaign.update({
      where: { id: params.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        successCount,
        failureCount,
      },
    });

    return NextResponse.json({
      message: 'Campaign sent successfully',
      successCount,
      failureCount,
      totalRecipients: campaign.recipients.length,
    });
  } catch (error) {
    console.error('Send campaign error:', error);
    
    // Mark campaign as failed
    await prisma.campaign.update({
      where: { id: params.id },
      data: { status: 'FAILED' },
    });

    return NextResponse.json({ error: 'Failed to send campaign' }, { status: 500 });
  }
}
