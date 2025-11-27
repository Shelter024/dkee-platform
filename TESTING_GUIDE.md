# Testing Guide for Premium Features

## Quick Start

### 1. Generate Test Data

Run the automated test data generator:

```bash
node scripts/generate-test-data.js
```

This creates:
- ✅ Test user account (test@dkexecutive.com / password123)
- ✅ Customer profile
- ✅ 2 test vehicles
- ✅ PREMIUM subscription (1 month)
- ✅ 3 service reminders (due in 5-10 days)
- ✅ Vehicle tracking logs

### 2. Start Development Server

```bash
npm run dev
```

### 3. Test Login

Navigate to: http://localhost:3000/login

**Credentials:**
- Email: `test@dkexecutive.com`
- Password: `password123`

---

## Feature Testing Checklist

### ✅ Service Reminders

**Customer View:**
1. Go to: http://localhost:3000/dashboard/customer/service-reminders
2. Verify you see 3 service reminders
3. Check status badges (Due Soon, Upcoming)
4. Test creating a new reminder
5. Test editing a reminder
6. Test deleting a reminder

**Admin View:**
1. Go to: http://localhost:3000/dashboard/admin/service-reminders
2. Verify you see all customer reminders
3. Test search functionality
4. Test filter by status
5. Verify statistics cards show correct counts

**API Tests:**
```bash
# Get user's reminders
curl http://localhost:3000/api/service-reminders \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Create new reminder
curl -X POST http://localhost:3000/api/service-reminders \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "vehicleId": "VEHICLE_ID",
    "serviceType": "Brake Check",
    "dueDate": "2025-12-01",
    "dueMileage": 55000
  }'
```

### ✅ Vehicle Tracking

**Customer View:**
1. Go to: http://localhost:3000/dashboard/customer/tracking
2. Verify you see your vehicles
3. Check latest tracking data
4. Verify map displays (if map integration done)
5. Test location history

**Admin View:**
1. Go to: http://localhost:3000/dashboard/admin/tracking
2. Verify you see all customer vehicles
3. Check real-time status (moving/parked/offline)
4. Test search functionality
5. Verify statistics (total, active, moving, parked)
6. Check auto-refresh works (10 seconds)

**API Tests:**
```bash
# Get tracking data
curl http://localhost:3000/api/tracking \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Create tracking update
curl -X POST http://localhost:3000/api/tracking \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "vehicleId": "VEHICLE_ID",
    "latitude": 5.6037,
    "longitude": -0.1870,
    "speed": 45,
    "heading": 90,
    "address": "Test Location"
  }'
```

### ✅ Automated Notifications

**Test Cron Job:**
```bash
curl -X GET http://localhost:3000/api/cron/reminder-notifications \
  -H "Authorization: Bearer f6RBrjIBEs7qBe9CP8b5TYYyGbsoL9PS8cYKFKDY3H0="
```

**Expected Response:**
```json
{
  "success": true,
  "results": {
    "processed": 3,
    "sent": 3,
    "failed": 0
  }
}
```

**Verify:**
1. Check console logs for notification messages
2. In Prisma Studio, verify `reminderSent: true`
3. Check `reminderDate` is set to current timestamp
4. If email/SMS configured, check inbox/phone

### ✅ Subscription System

**Pricing Page:**
1. Go to: http://localhost:3000/dashboard/customer/subscription
2. Verify all 3 plans display (Basic, Premium, Enterprise)
3. Check pricing for monthly vs yearly
4. Verify "Current Plan" badge shows correctly
5. Test interval toggle (Monthly/Yearly)

**Checkout Flow:**
1. Click "Get Started" or "Upgrade" on any plan
2. If Paystack configured:
   - Verify redirect to payment page
   - Complete test payment
   - Verify callback page shows success
   - Check subscription activated in dashboard
3. If Paystack NOT configured:
   - Verify test subscription created directly
   - Check success message
   - Verify redirect to dashboard

**API Tests:**
```bash
# Get pricing
curl http://localhost:3000/api/subscriptions/checkout \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Create checkout (test mode)
curl -X POST http://localhost:3000/api/subscriptions/checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "plan": "PREMIUM",
    "interval": "MONTHLY"
  }'
```

### ✅ Subscription Middleware

**Test Protected Routes:**
1. Logout from current session
2. Try accessing: http://localhost:3000/dashboard/customer/service-reminders
3. Verify redirect to login page
4. Login and verify you can access the page
5. In Prisma Studio, set subscription `status: 'EXPIRED'`
6. Refresh page - should show upgrade prompt (via FeatureGate)

---

## Common Issues & Solutions

### ❌ "No active subscription found"

**Problem:** User doesn't have ACTIVE subscription
**Solution:**
```javascript
// In Prisma Studio, check Subscription table
// Ensure: status = 'ACTIVE' and endDate > current date
```

### ❌ "Vehicle not found or does not belong to user"

**Problem:** Vehicle's customerId doesn't match user
**Solution:**
```javascript
// In Prisma Studio:
// 1. Find User.id
// 2. Find Customer where userId = User.id
// 3. Ensure Vehicle.customerId = Customer.id
```

### ❌ TypeScript errors in API routes

**Problem:** Prisma types not updated
**Solution:**
```bash
npx prisma generate
# Then restart VS Code TypeScript server:
# Ctrl+Shift+P -> "TypeScript: Restart TS Server"
```

### ❌ Cron job 401 Unauthorized

**Problem:** CRON_SECRET doesn't match
**Solution:**
```bash
# Check .env file
grep CRON_SECRET .env

# Verify header matches exactly:
# Authorization: Bearer YOUR_EXACT_SECRET
```

---

## Performance Testing

### Load Test Tracking Logs

```bash
# Create 100 tracking logs rapidly
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/tracking \
    -H "Content-Type: application/json" \
    -H "Cookie: next-auth.session-token=TOKEN" \
    -d "{\"vehicleId\":\"ID\",\"latitude\":5.$i,\"longitude\":-0.$i,\"speed\":$((40+i))}" &
done
wait
echo "Created 100 tracking logs"
```

### Monitor Database

```bash
# Open Prisma Studio to watch data changes
npx prisma studio
```

---

## Integration Tests

### Test Complete User Journey

1. **Register** → Login → **Subscribe to Premium**
2. **Add Vehicle** → **Create Service Reminder**
3. **Update Vehicle Location** (tracking)
4. **Wait for notification** (or trigger cron manually)
5. **Verify email/SMS received**
6. **Admin views** all data
7. **Export data** (if export feature enabled)

---

## Production Deployment Tests

Before going live:

- [ ] Test with real Paystack account
- [ ] Configure actual Twilio for SMS
- [ ] Set up SendGrid/AWS SES for emails
- [ ] Test cron job on Vercel
- [ ] Verify webhook security (CRON_SECRET)
- [ ] Load test with 1000+ records
- [ ] Test subscription renewal flow
- [ ] Verify notification rate limits
- [ ] Check mobile responsiveness
- [ ] Test PWA install and offline mode

---

## Debugging Tools

### Prisma Studio
```bash
npx prisma studio
# Browse/edit all database records visually
```

### API Logs
```bash
# In development, check terminal for API logs
# Look for console.log() statements in route handlers
```

### Browser DevTools
```bash
# Network tab: Check API requests/responses
# Console: Check for client-side errors
# Application: Check cookies and local storage
```

---

## Need Help?

See full documentation:
- `CRON_SETUP.md` - Cron job configuration
- `CRON_TEST_GUIDE.md` - Quick testing steps
- `README.md` - Overall project documentation
