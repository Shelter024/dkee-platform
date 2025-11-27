# Advanced Features: Loyalty, Inventory, Marketing & Payroll

## Overview
This document covers the newly implemented features for the DKee automotive management system:
- **Customer Loyalty & Referral Program**
- **Advanced Inventory Management**
- **Marketing Automation**
- **HR Payroll System**

All features are Ghana-market optimized with local compliance (SSNIT, tax rates, mobile money).

---

## 1. Customer Loyalty & Referral Program

### Loyalty Tiers
Four-tier system with automatic progression based on total spending:

| Tier | Requirements | Benefits |
|------|-------------|----------|
| **BRONZE** | Default tier | 1x points per GHS spent |
| **SILVER** | GHS 5,000+ spent | 1.5x points, 5% discount |
| **GOLD** | GHS 15,000+ spent | 2x points, 10% discount, priority booking |
| **PLATINUM** | GHS 50,000+ spent | 3x points, 15% discount, priority booking, extended warranty |

### Points Earning
- **1 point per GHS** spent on services/parts
- Multipliers apply based on tier
- Bonus points awarded by staff for special occasions
- Referral rewards: 100 points for both referrer and referee

### API Endpoints

#### Get Loyalty Dashboard
```http
GET /api/loyalty/points
Authorization: Bearer {token}
```

**Response:**
```json
{
  "points": 2500,
  "tier": "SILVER",
  "totalSpent": 7500,
  "tierBenefits": {
    "pointsMultiplier": 1.5,
    "discountPercentage": 5,
    "priorityBooking": false,
    "extendedWarranty": false
  },
  "nextTier": {
    "name": "GOLD",
    "requiredSpending": 15000,
    "pointsToNext": 7500
  },
  "recentTransactions": [
    {
      "id": "txn_1",
      "type": "EARNED",
      "points": 150,
      "description": "Service payment INV-2024-001",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Award Bonus Points
```http
POST /api/loyalty/points
Authorization: Bearer {staff-token}
Content-Type: application/json

{
  "customerId": "cust_123",
  "points": 100,
  "description": "Birthday bonus"
}
```

#### Generate Referral Code
```http
POST /api/loyalty/referral
Authorization: Bearer {token}
```

**Response:**
```json
{
  "referralCode": "DKEE-AB12CD34",
  "message": "Share this code to earn 100 points per referral"
}
```

#### Apply Referral Code (During Registration)
```http
GET /api/loyalty/referral?code=DKEE-AB12CD34
```

**Response:**
```json
{
  "valid": true,
  "referrerName": "John Doe",
  "reward": 100
}
```

---

## 2. Rewards Catalog & Redemption

### Reward Types
1. **DISCOUNT_PERCENTAGE** - X% off next service
2. **DISCOUNT_FIXED** - Fixed GHS amount off
3. **FREE_SERVICE** - Complimentary service (oil change, car wash, etc.)
4. **FREE_PART** - Free spare part (up to value limit)
5. **PRIORITY_BOOKING** - Jump to front of queue for 30 days
6. **EXTENDED_WARRANTY** - +6 months warranty on repairs

### API Endpoints

#### List Available Rewards
```http
GET /api/loyalty/rewards
Authorization: Bearer {token}
```

**Response:**
```json
{
  "rewards": [
    {
      "id": "rwd_1",
      "name": "10% Off Next Service",
      "description": "Get 10% discount on your next service visit",
      "type": "DISCOUNT_PERCENTAGE",
      "pointsCost": 500,
      "minimumTier": "BRONZE",
      "value": 10,
      "validityDays": 90,
      "maxUsagePerCustomer": 4
    },
    {
      "id": "rwd_2",
      "name": "Free Car Wash",
      "description": "Complimentary premium car wash",
      "type": "FREE_SERVICE",
      "pointsCost": 200,
      "minimumTier": "BRONZE",
      "validityDays": 60
    },
    {
      "id": "rwd_3",
      "name": "Priority Booking",
      "description": "Skip the queue for 30 days",
      "type": "PRIORITY_BOOKING",
      "pointsCost": 1000,
      "minimumTier": "GOLD",
      "validityDays": 30
    }
  ]
}
```

#### Redeem Reward
```http
POST /api/loyalty/redeem
Authorization: Bearer {token}
Content-Type: application/json

{
  "rewardId": "rwd_1",
  "notes": "Want to use for upcoming major service"
}
```

**Response:**
```json
{
  "success": true,
  "redemption": {
    "id": "red_1",
    "rewardName": "10% Off Next Service",
    "pointsDeducted": 500,
    "remainingPoints": 2000,
    "expiresAt": "2024-04-15T23:59:59Z",
    "redemptionCode": "REDEEM-XY78ZA"
  }
}
```

**Error Cases:**
- `400` - Insufficient points
- `403` - Tier too low
- `409` - Usage limit reached

---

## 3. Advanced Inventory Management

### Features
- **Multi-location tracking** - Track stock across branches
- **Barcode scanning** - Unique barcodes for parts
- **Reorder automation** - Low stock alerts
- **Stock movements** - Full audit trail (IN, OUT, ADJUSTMENT, TRANSFER)
- **Supplier management** - Track suppliers and pricing
- **Purchase orders** - Structured PO workflow

### Stock Movement Types
- `IN` - Stock received from supplier
- `OUT` - Stock used in service/sold
- `ADJUSTMENT` - Inventory corrections (damage, theft, audit)
- `TRANSFER` - Move stock between branches

### API Endpoints

#### Get Stock Levels
```http
GET /api/inventory/stock
Authorization: Bearer {staff-token}

Query Parameters:
- branchId (optional) - Filter by branch
- lowStock=true - Show only items below reorder point
```

**Response:**
```json
{
  "inventory": [
    {
      "id": "part_123",
      "name": "Toyota Oil Filter",
      "barcode": "5060123456789",
      "currentStock": 15,
      "reorderPoint": 10,
      "minimumStock": 5,
      "maximumStock": 50,
      "location": "Warehouse A-12",
      "branch": "Accra Main",
      "supplier": "AutoParts Ghana Ltd",
      "unitPrice": 25.00,
      "status": "adequate",
      "lastRestocked": "2024-01-10T08:00:00Z"
    },
    {
      "id": "part_456",
      "name": "Brake Pads (Front)",
      "currentStock": 3,
      "reorderPoint": 8,
      "status": "low_stock",
      "alertSent": true
    }
  ],
  "lowStockCount": 1
}
```

#### Record Stock Movement
```http
POST /api/inventory/stock
Authorization: Bearer {staff-token}
Content-Type: application/json

{
  "partId": "part_123",
  "type": "IN",
  "quantity": 20,
  "fromBranchId": null,
  "toBranchId": "branch_1",
  "reference": "PO-2024-001",
  "notes": "Supplier delivery"
}
```

**Stock Transfer Example:**
```json
{
  "partId": "part_456",
  "type": "TRANSFER",
  "quantity": 5,
  "fromBranchId": "branch_1",
  "toBranchId": "branch_2",
  "reference": "TRF-001",
  "notes": "Replenish Kumasi branch"
}
```

#### Supplier Management
```http
GET /api/inventory/suppliers
POST /api/inventory/suppliers

{
  "name": "AutoParts Ghana Ltd",
  "contactPerson": "Kwame Mensah",
  "email": "sales@autopartsgh.com",
  "phone": "+233244123456",
  "address": "Industrial Area, Accra",
  "paymentTerms": "Net 30",
  "taxId": "C0012345678",
  "isActive": true
}
```

---

## 4. Marketing Automation

### Features
- **Campaign creation** - Email, SMS, or both
- **Audience targeting** - Segment by behavior and loyalty
- **Template management** - Reusable email/SMS templates
- **Variable substitution** - Personalization ({{name}}, {{service}}, etc.)
- **Campaign tracking** - Delivery status and metrics

### Target Audiences
- `ALL` - All customers
- `NEW_CUSTOMERS` - Registered within last 30 days
- `INACTIVE` - No service in 90+ days
- `LOYALTY_TIER` - Specific tier (SILVER, GOLD, PLATINUM)
- `HIGH_VALUE` - Customers with GHS 10,000+ total spending
- `UPCOMING_APPOINTMENTS` - Bookings in next 7 days

### Campaign Types
- `PROMOTIONAL` - Discounts, offers
- `TRANSACTIONAL` - Invoices, receipts (automated)
- `NEWSLETTER` - Updates, tips
- `REMINDER` - Service reminders, appointment confirmations
- `SEASONAL` - Holiday greetings, seasonal promotions

### API Endpoints

#### Create Campaign
```http
POST /api/marketing/campaigns
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "name": "Spring Service Discount 2024",
  "type": "PROMOTIONAL",
  "channel": "BOTH",
  "targetAudience": "INACTIVE",
  "subject": "We Miss You! 20% Off Spring Service",
  "messageTemplate": "Hi {{name}},\n\nIt's been a while since your last visit to DKee Auto. We'd love to see you again!\n\nGet 20% off any service this month. Book now: {{bookingLink}}\n\nCheers,\nDKee Auto Team",
  "scheduledFor": "2024-03-01T09:00:00Z"
}
```

**Response:**
```json
{
  "id": "camp_1",
  "name": "Spring Service Discount 2024",
  "status": "SCHEDULED",
  "recipientCount": 342,
  "estimatedCost": {
    "sms": 68.40,
    "email": 0
  },
  "scheduledFor": "2024-03-01T09:00:00Z"
}
```

#### Send Campaign
```http
POST /api/marketing/campaigns/{campaignId}/send
Authorization: Bearer {admin-token}
```

**Response:**
```json
{
  "status": "SENDING",
  "totalRecipients": 342,
  "sent": 0,
  "failed": 0,
  "message": "Campaign is being sent in the background"
}
```

#### Campaign Status
```http
GET /api/marketing/campaigns
Authorization: Bearer {admin-token}
```

**Response:**
```json
{
  "campaigns": [
    {
      "id": "camp_1",
      "name": "Spring Service Discount 2024",
      "status": "SENT",
      "recipientCount": 342,
      "sentCount": 340,
      "failedCount": 2,
      "openRate": 45.2,
      "clickRate": 12.8,
      "sentAt": "2024-03-01T09:05:23Z"
    }
  ]
}
```

---

## 5. HR Payroll System (Ghana-Compliant)

### Features
- **Monthly payroll generation** - Automated calculations
- **Ghana tax compliance** - Progressive tax rates
- **SSNIT deductions** - 5.5% employee contribution
- **Allowances & deductions** - Transport, housing, meal allowances
- **Payslip generation** - Detailed breakdown
- **Bank integration ready** - Export for bulk transfers

### Ghana Tax Rates (2024)
| Annual Income (GHS) | Tax Rate |
|---------------------|----------|
| 0 - 4,380 | 0% |
| 4,381 - 6,000 | 5% |
| 6,001 - 9,600 | 10% |
| 9,601 - 36,000 | 17.5% |
| 36,001 - 240,000 | 25% |
| 240,001+ | 30% |

### SSNIT Contributions
- Employee: **5.5%** (deducted from gross)
- Employer: **13%** (company expense, not deducted)

### API Endpoints

#### Generate Monthly Payroll
```http
POST /api/payroll
Authorization: Bearer {hr-admin-token}
Content-Type: application/json

{
  "month": 1,
  "year": 2024,
  "userIds": ["user_1", "user_2"]  // Optional: specific employees
}
```

**Processing:**
1. Fetches salary configurations
2. Calculates gross salary: `baseSalary + allowances + overtime + bonus`
3. Computes SSNIT: `grossSalary * 0.055`
4. Applies Ghana progressive tax
5. Calculates net: `gross - tax - SSNIT - otherDeductions`

**Response:**
```json
{
  "payrollRecords": [
    {
      "id": "pay_1",
      "payrollNumber": "PAY-2024-01-001",
      "userId": "user_1",
      "employeeName": "Kwame Asante",
      "month": 1,
      "year": 2024,
      "period": "January 2024",
      "baseSalary": 3500.00,
      "allowances": {
        "transport": 300.00,
        "housing": 500.00,
        "meal": 200.00
      },
      "grossSalary": 4500.00,
      "deductions": {
        "ssnit": 247.50,
        "tax": 343.75,
        "other": 50.00
      },
      "netSalary": 3858.75,
      "status": "PENDING",
      "bankAccount": "0123456789",
      "bankName": "Ghana Commercial Bank",
      "processedAt": "2024-02-01T08:00:00Z"
    }
  ]
}
```

#### Configure Employee Salary
```http
POST /api/payroll/salary-config
Authorization: Bearer {hr-admin-token}
Content-Type: application/json

{
  "userId": "user_1",
  "baseSalary": 3500.00,
  "allowances": {
    "transport": 300.00,
    "housing": 500.00,
    "meal": 200.00,
    "utility": 100.00
  },
  "bankAccount": "0123456789",
  "bankName": "Ghana Commercial Bank",
  "bankBranch": "Accra Main",
  "ssnit": "S123456789",
  "taxId": "TIN-0123456789",
  "paymentFrequency": "MONTHLY"
}
```

#### Get Payroll History
```http
GET /api/payroll?month=1&year=2024
Authorization: Bearer {staff-token}
```

Staff can only see their own records. HR/Admin see all records.

---

## Integration Examples

### Complete Customer Journey with Loyalty

1. **Customer registers with referral code:**
```javascript
// During registration
const referralResponse = await fetch('/api/loyalty/referral?code=DKEE-AB12CD34');
const { valid, referrerName, reward } = await referralResponse.json();

// Both parties get 100 points
```

2. **Customer books service:**
```javascript
// Appointment booking triggers stock check
const appointment = await createAppointment({
  customerId,
  serviceId,
  appointmentDate
});
```

3. **Service completed, invoice created:**
```javascript
// Invoice creation triggers loyalty points
const invoice = await createInvoice({
  customerId,
  amount: 150.00,  // GHS
  items: [...]
});

// Customer earns 150 points (or more based on tier multiplier)
```

4. **Stock automatically adjusted:**
```javascript
// Parts used in service deducted from inventory
await recordStockMovement({
  partId: 'part_123',
  type: 'OUT',
  quantity: 2,
  reference: invoice.id
});
```

5. **Marketing campaign sent:**
```javascript
// Next day: Thank you email + service tips
const campaign = await sendTransactionalCampaign({
  customerId,
  type: 'SERVICE_FOLLOWUP',
  variables: {
    name: customer.name,
    service: invoice.serviceName,
    nextServiceDue: '3 months'
  }
});
```

---

## Testing Checklist

### Loyalty System
- [ ] Award points on invoice payment
- [ ] Tier upgrades based on total spending
- [ ] Referral code generation and validation
- [ ] Reward redemption with points deduction
- [ ] Tier restrictions on premium rewards

### Inventory
- [ ] Stock movements with audit trail
- [ ] Low stock alerts when below reorder point
- [ ] Barcode scanning integration
- [ ] Multi-branch stock transfers
- [ ] Supplier purchase order workflow

### Marketing
- [ ] Campaign audience building (segmentation)
- [ ] Template variable substitution
- [ ] Email/SMS delivery
- [ ] Campaign scheduling
- [ ] Delivery tracking and metrics

### Payroll
- [ ] Ghana tax calculation accuracy
- [ ] SSNIT 5.5% deduction
- [ ] Gross to net calculations
- [ ] Payslip generation
- [ ] Bank export format

---

## Next Steps

### Frontend Development
1. **Loyalty Dashboard** - Customer points, tier, rewards catalog
2. **Inventory Management UI** - Stock levels, movements, PO forms
3. **Campaign Builder** - Visual campaign creator with audience preview
4. **Payroll Management** - Employee salary config, payroll runs

### Mobile App Integration
- Loyalty card display (QR code for scanning)
- Points balance and history
- Rewards catalog browsing
- Redeem rewards at checkout

### External Integrations
- **Twilio** - SMS campaigns (already configured)
- **SendGrid/Mailgun** - Email campaigns
- **Barcode Scanner API** - Inventory management
- **Ghana Revenue Authority** - Tax reporting

### Performance Optimizations
- Cache loyalty tier calculations
- Batch stock movement processing
- Queue campaign sending (background jobs)
- Index frequently queried fields

---

## Support & Documentation

For API testing, use the provided Postman collection or cURL examples.

**Questions?** Contact the development team.

**Database Schema:** See `prisma/schema.prisma` for complete model definitions.
