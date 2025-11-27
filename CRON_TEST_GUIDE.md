# Quick Test Guide for Cron Job

## 1. Test Locally

```bash
# Make sure your dev server is running
npm run dev

# In another terminal, test the cron endpoint:
curl -X GET http://localhost:3000/api/cron/reminder-notifications \
  -H "Authorization: Bearer f6RBrjIBEs7qBe9CP8b5TYYyGbsoL9PS8cYKFKDY3H0=" \
  -H "Content-Type: application/json"
```

## 2. Create Test Data

Open Prisma Studio:
```bash
npx prisma studio
```

### Create Test Scenario:
1. **Find/Create a User** with email and phone
2. **Create a Customer** record linked to that user
3. **Create a Vehicle** for that customer
4. **Create an Active Subscription** for the user (PREMIUM or ENTERPRISE plan, status: ACTIVE)
5. **Create a Service Reminder**:
   - Link to the subscription
   - Link to the vehicle
   - Set `dueDate` to 5-7 days from today
   - Set `completed: false`
   - Set `reminderSent: false`
   - Add a `serviceType` like "Oil Change"

Example values for Service Reminder:
```javascript
{
  subscriptionId: "your-subscription-id",
  vehicleId: "your-vehicle-id",
  serviceType: "Oil Change",
  dueDate: new Date("2025-11-30"), // Adjust to 5-7 days from today
  dueMileage: 5000,
  completed: false,
  reminderSent: false,
  notes: "Regular maintenance"
}
```

## 3. Trigger the Cron Job

```bash
curl -X GET http://localhost:3000/api/cron/reminder-notifications \
  -H "Authorization: Bearer f6RBrjIBEs7qBe9CP8b5TYYyGbsoL9PS8cYKFKDY3H0="
```

Expected Response:
```json
{
  "success": true,
  "results": {
    "processed": 1,
    "sent": 1,
    "failed": 0
  }
}
```

## 4. Verify Results

### Check Console Logs
Look for messages like:
```
Starting service reminder notification process...
Found 1 reminders to send notifications for
Sent notification for reminder clxxxxxx
Service reminder notification process completed: { processed: 1, sent: 1, failed: 0 }
```

### Check Database
In Prisma Studio, verify the reminder was updated:
- `reminderSent: true`
- `reminderDate: [current date/time]`

### Check Email/SMS
- If email is configured, check the recipient's inbox
- If SMS is configured, check the recipient's phone

## 5. Common Issues & Solutions

### ❌ 401 Unauthorized
**Problem:** CRON_SECRET doesn't match
**Solution:** Check the Authorization header matches `.env` file

### ❌ "No active subscription found"
**Problem:** User doesn't have an active subscription
**Solution:** Create a Subscription with `status: 'ACTIVE'` for the user

### ❌ "Found 0 reminders"
**Problem:** No reminders match the criteria
**Solution:** 
- Ensure `dueDate` is within 7 days
- Set `completed: false`
- Set `reminderSent: false`

### ❌ "Failed to send email/SMS"
**Problem:** Email/SMS services not configured
**Solution:** This is OK for testing - notifications will be logged to console

## 6. Deploy to Production

### Vercel Deployment

1. Push code to GitHub
2. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

3. Add `CRON_SECRET` in Vercel Dashboard:
   - Project Settings → Environment Variables
   - Key: `CRON_SECRET`
   - Value: `f6RBrjIBEs7qBe9CP8b5TYYyGbsoL9PS8cYKFKDY3H0=`
   - Apply to: Production, Preview, Development

4. Vercel will automatically set up the cron from `vercel.json`

5. Monitor executions:
   - Vercel Dashboard → Deployments → Functions
   - Look for `/api/cron/reminder-notifications`

### Test Production Endpoint

```bash
curl -X GET https://your-domain.vercel.app/api/cron/reminder-notifications \
  -H "Authorization: Bearer f6RBrjIBEs7qBe9CP8b5TYYyGbsoL9PS8cYKFKDY3H0="
```

## 7. Monitoring Schedule

The cron runs daily at 9:00 AM UTC. To verify:
- Check Vercel Dashboard → Cron Jobs tab
- View execution history and logs
- Set up alerts for failures

## Need Help?

See full documentation in `CRON_SETUP.md`
