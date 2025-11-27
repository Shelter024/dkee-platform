# Cron Job Setup for Service Reminders

This document explains how to set up automated service reminder notifications.

## Overview

The system sends automated email and SMS notifications 7 days before a service reminder is due. This requires setting up a cron job to trigger the notification endpoint daily.

## Local Development

For local testing, you can manually trigger the cron job:

```bash
# Using curl with the CRON_SECRET from .env
curl -X GET http://localhost:3000/api/cron/reminder-notifications \
  -H "Authorization: Bearer f6RBrjIBEs7qBe9CP8b5TYYyGbsoL9PS8cYKFKDY3H0="
```

## Production Deployment

### Option 1: Vercel Cron (Recommended)

The `vercel.json` file is already configured to run the cron job daily at 9 AM UTC:

```json
{
  "crons": [
    {
      "path": "/api/cron/reminder-notifications",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Setup Steps:**

1. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

2. Add environment variable in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add `CRON_SECRET` with value from your `.env` file
   - Make sure it's available for Production, Preview, and Development

3. Vercel will automatically set up the cron job based on `vercel.json`

4. Monitor cron job execution in Vercel Dashboard → Deployments → Functions

**Cron Schedule Format:**
- `0 9 * * *` = Every day at 9:00 AM UTC
- Adjust timezone by changing the hour (e.g., `0 14 * * *` for 9 AM EST)

### Option 2: External Cron Service

If not using Vercel, you can use an external cron service:

**Recommended Services:**
- [cron-job.org](https://cron-job.org) (Free)
- [EasyCron](https://www.easycron.com) (Free tier available)
- [Cronitor](https://cronitor.io)

**Setup Steps:**

1. Sign up for a cron service
2. Create a new cron job with these settings:
   - **URL:** `https://your-domain.com/api/cron/reminder-notifications`
   - **Method:** GET
   - **Schedule:** Daily at 9:00 AM (your timezone)
   - **Headers:** 
     ```
     Authorization: Bearer f6RBrjIBEs7qBe9CP8b5TYYyGbsoL9PS8cYKFKDY3H0=
     ```
   - **Timeout:** 30 seconds

3. Enable notifications for failures

### Option 3: Server Cron (Self-hosted)

If self-hosting, add to your server's crontab:

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 9 AM)
0 9 * * * curl -X GET https://your-domain.com/api/cron/reminder-notifications -H "Authorization: Bearer f6RBrjIBEs7qBe9CP8b5TYYyGbsoL9PS8cYKFKDY3H0=" >> /var/log/reminder-cron.log 2>&1
```

## Notification Logic

The cron job will:

1. Find all service reminders that are:
   - Not completed
   - Not already notified
   - Due within the next 7 days

2. For each reminder:
   - Send email notification (HTML formatted)
   - Send SMS notification (if phone number available)
   - Mark reminder as notified

3. Return statistics:
   ```json
   {
     "success": true,
     "results": {
       "processed": 10,
       "sent": 8,
       "failed": 2
     }
   }
   ```

## Testing

### Test the Endpoint

```bash
# Replace with your actual CRON_SECRET
curl -X GET http://localhost:3000/api/cron/reminder-notifications \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE"
```

Expected response:
```json
{
  "success": true,
  "results": {
    "processed": 5,
    "sent": 5,
    "failed": 0
  }
}
```

### Create Test Data

```javascript
// In Prisma Studio or via API
// 1. Create a test customer with active subscription
// 2. Add a vehicle to the customer
// 3. Create a service reminder due in 5-7 days
// 4. Trigger the cron job manually
// 5. Check email/SMS for notification
```

## Monitoring

### Check Logs

**Vercel:**
- Dashboard → Deployments → Function logs
- Filter by `/api/cron/reminder-notifications`

**Self-hosted:**
```bash
tail -f /var/log/reminder-cron.log
```

### Common Issues

1. **401 Unauthorized**
   - Check `CRON_SECRET` matches in both `.env` and cron job header
   - Ensure Authorization header format: `Bearer YOUR_SECRET`

2. **No notifications sent**
   - Verify reminders exist with `reminderSent: false`
   - Check `dueDate` is within 7 days
   - Ensure email/SMS services are configured

3. **Timeout**
   - Large number of reminders may need longer timeout
   - Consider pagination or batch processing

## Security

- **CRON_SECRET** prevents unauthorized execution
- Keep secret secure and rotate periodically
- Only expose `/api/cron/*` routes via cron job
- Monitor for unusual execution patterns

## Best Practices

1. **Schedule during low-traffic hours** (early morning)
2. **Set up failure alerts** via cron service
3. **Log all executions** for audit trail
4. **Test thoroughly** before production
5. **Monitor costs** for email/SMS services

## Environment Variables Reference

Required for cron job:
```env
CRON_SECRET=f6RBrjIBEs7qBe9CP8b5TYYyGbsoL9PS8cYKFKDY3H0=
NEXT_PUBLIC_APP_URL=https://your-domain.com
DATABASE_URL=postgresql://...
```

Required for notifications:
```env
# For email (configure via System Settings UI)
# For SMS (configure via System Settings UI)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

## Troubleshooting

Run manual test:
```bash
npm run dev
# In another terminal:
curl -X GET http://localhost:3000/api/cron/reminder-notifications \
  -H "Authorization: Bearer f6RBrjIBEs7qBe9CP8b5TYYyGbsoL9PS8cYKFKDY3H0=" \
  -v
```

Check API response for detailed error messages.
