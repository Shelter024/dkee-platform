/**
 * Service Reminder Notification Scheduler
 * This should be run as a cron job (e.g., daily at 9 AM)
 * Can be triggered via /api/cron/reminder-notifications or serverless function
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendSMS } from '@/lib/sms';
import { sendEmail } from '@/lib/email';

/**
 * Check and send notifications for service reminders
 */
async function processServiceReminders() {
  try {
    console.log('Starting service reminder notification process...');

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const reminders = await prisma.serviceReminder.findMany({
      where: {
        completed: false,
        reminderSent: false,
        dueDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      include: {
        vehicle: {
          include: {
            customer: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log(`Found ${reminders.length} reminders to send notifications for`);

    const notificationResults = {
      processed: 0,
      sent: 0,
      failed: 0,
    };

    for (const reminder of reminders) {
      notificationResults.processed++;

      try {
        const user = reminder.vehicle.customer.user;
        const vehicle = `${reminder.vehicle.make} ${reminder.vehicle.model}${reminder.vehicle.licensePlate ? ` (${reminder.vehicle.licensePlate})` : ''}`;
        
        const dueDate = reminder.dueDate
          ? new Date(reminder.dueDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'soon';

        const title = `Service Reminder: ${reminder.serviceType}`;
        const message = `Your ${vehicle} is due for ${reminder.serviceType} on ${dueDate}. Book your service appointment today!`;

        // Send Email
        if (user.email) {
          await sendEmail({
            to: user.email,
            subject: title,
            text: message,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1e3a8a;">${title}</h2>
                <p>Hi ${user.name},</p>
                <p>${message}</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">Service Details:</h3>
                  <ul style="list-style: none; padding: 0;">
                    <li><strong>Service Type:</strong> ${reminder.serviceType}</li>
                    <li><strong>Vehicle:</strong> ${vehicle}</li>
                    <li><strong>Due Date:</strong> ${dueDate}</li>
                    ${reminder.dueMileage ? `<li><strong>Due Mileage:</strong> ${reminder.dueMileage.toLocaleString()} km</li>` : ''}
                  </ul>
                </div>
                <p style="margin: 30px 0 20px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/customer/service-reminders" 
                     style="background: #1e3a8a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    View Reminders
                  </a>
                </p>
                <p style="color: #6b7280; font-size: 14px;">
                  This is an automated reminder from DK Executive Engineers.
                </p>
              </div>
            `,
          }).catch((err: any) => {
            console.error('Failed to send email:', err);
          });
        }

        // Send SMS
        if (user.phone) {
          const smsMessage = `DK Executive: Your ${vehicle} is due for ${reminder.serviceType} on ${dueDate}. Book now!`;
          await sendSMS(user.phone, smsMessage).catch((err: any) => {
            console.error('Failed to send SMS:', err);
          });
        }

        // Mark notification as sent
        await prisma.serviceReminder.update({
          where: { id: reminder.id },
          data: {
            reminderSent: true,
            reminderDate: new Date(),
          },
        });

        notificationResults.sent++;
        console.log(`Sent notification for reminder ${reminder.id}`);
      } catch (error: any) {
        notificationResults.failed++;
        console.error(`Failed to send notification for reminder ${reminder.id}:`, error);
      }
    }

    console.log('Service reminder notification process completed:', notificationResults);
    return notificationResults;
  } catch (error) {
    console.error('Error in service reminder notification process:', error);
    throw error;
  }
}

/**
 * GET /api/cron/reminder-notifications
 * Trigger the reminder notification process
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await processServiceReminders();

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('Error in reminder notification cron job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
