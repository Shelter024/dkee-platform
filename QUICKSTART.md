# 🚀 Quick Start Guide - DK Executive Engineers Platform

## ✅ Completed Features

### 1. **Authentication & Security**
- ✅ Email/password registration (`/api/auth/register`)
- ✅ Phone OTP verification via Twilio (`/api/auth/otp`)
- ✅ WebAuthn schema ready (Touch ID, Face ID, Windows Hello)
- ✅ JWT-based sessions with NextAuth
- ✅ Role-based access control

### 2. **Customer Management**  
- ✅ List all customers (`GET /api/customers`)
- ✅ Get customer details (`GET /api/customers/[id]`)
- ✅ Update customer profile (`PUT /api/customers/[id]`)
- ✅ Vehicle tracking & service history
- ✅ Admin and self-service access

### 3. **Service Booking & Job Cards**
- ✅ Submit service requests (`POST /api/services`)
- ✅ List services with filters (`GET /api/services`)
- ✅ Approval workflow (`PUT /api/services/[id]/approve`)
- ✅ Rejection with reason (`PUT /api/services/[id]/reject`)
- ✅ Auto-generated job card numbers
- ✅ Status tracking (PENDING → IN_PROGRESS → COMPLETED)

### 4. **Real-time Messaging**
- ✅ Send messages (`POST /api/messages`)
- ✅ List messages with pagination (`GET /api/messages`)
- ✅ Mark as read with receipt (`PUT /api/messages/[id]/read`)
- ✅ Real-time delivery via Pusher
- ✅ Read receipts broadcasting
- ✅ Unread count tracking

### 5. **Invoicing & PDF Generation**
- ✅ Create invoice with auto-PDF (`POST /api/invoices`)
- ✅ Generate job card PDFs (`GET /api/services/[id]/job-card`)
- ✅ List invoices by payment status (`GET /api/invoices`)
- ✅ Three professional PDF templates (Job Card, Receipt, Full Invoice)
- ✅ DK Executive Engineers branding (red & navy colors)
- ✅ Ghana localization (GHS currency, Accra address)
- ✅ Payment tracking (UNPAID, PARTIALLY_PAID, PAID, OVERDUE)
- ✅ Cloudinary PDF storage with organized folders
- ✅ Auto-upload and URL storage in database

### 6. **File Uploads**
- ✅ Upload files to Cloudinary (`POST /api/upload`)
- ✅ List files by folder/service (`GET /api/upload`)
- ✅ Delete files (`DELETE /api/upload/[id]`)
- ✅ Organized folder structure
- ✅ Shareable links generation
- ✅ 10MB size limit, multiple file types

---

## 🛠️ Setup Instructions

### Step 1: Environment Variables
Copy `.env.example` to `.env` and fill in:

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:pass@localhost:5432/dk_engineers"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Twilio (SMS/OTP)
TWILIO_ACCOUNT_SID="your_sid"
TWILIO_AUTH_TOKEN="your_token"
TWILIO_PHONE_NUMBER="+233XXXXXXXXX"

# Cloudinary (File Storage)
CLOUDINARY_CLOUD_NAME="your_cloud"
CLOUDINARY_API_KEY="your_key"
CLOUDINARY_API_SECRET="your_secret"

# Pusher (Real-time)
NEXT_PUBLIC_PUSHER_APP_KEY="your_key"
PUSHER_APP_ID="your_id"
PUSHER_SECRET="your_secret"
PUSHER_CLUSTER="eu"
```

### Step 2: Database Setup
```bash
# Push schema to database
npx prisma db push

# Seed database with sample data
npm run db:seed
```

### Step 3: Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📋 Test Credentials (After Seeding)

**Admin Account:**
- Email: `admin@dkengineers.com`
- Password: `admin123`
- Role: ADMIN

**Customer Account:**
- Email: `customer@example.com`
- Password: `customer123`
- Role: CUSTOMER

---

## 🧪 Testing Workflows

### Test 1: Registration with OTP
```bash
# 1. Register new user
POST /api/auth/register
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "phone": "+233XXXXXXXXX"
}

# 2. Request OTP (in dev mode, returns OTP in response)
POST /api/auth/otp
{
  "phone": "+233XXXXXXXXX",
  "userId": "user_id_from_registration"
}

# 3. Verify OTP
POST /api/auth/otp
{
  "action": "verify",
  "phone": "+233XXXXXXXXX",
  "otp": "123456",
  "userId": "user_id"
}
```

### Test 2: Service Booking Flow
```bash
# 1. Customer submits service request
POST /api/services
{
  "vehicleId": "vehicle_id",
  "serviceType": "Oil Change",
  "description": "Regular maintenance oil change",
  "scheduledDate": "2025-12-01T10:00:00Z"
}

# 2. Staff approves (generates job card)
PUT /api/services/{serviceId}/approve
{
  "assignedToId": "staff_user_id"
}

# Returns: { jobCardNumber: "JC-XXXXXXXXXX" }

# 3. Customer receives real-time notification via Pusher
```

### Test 3: Generate Job Card PDF
```bash
# First, approve a service (creates job card number)
# Then generate the PDF:
GET /api/services/{serviceId}/job-card

# Returns:
{
  "message": "Job card generated successfully",
  "pdfUrl": "https://res.cloudinary.com/.../job-card-JC-ABC123.pdf",
  "jobCardNumber": "JC-ABC123"
}

# PDF features:
# - Multi-page A4 format
# - Company branding (navy & red)
# - Customer & vehicle information
# - Service details and work performed
# - Parts used table with prices
# - Labor charges
# - Technician and customer signatures
```

### Test 4: Invoice & PDF Generation
```bash
POST /api/invoices
{
  "customerId": "customer_id",
  "automotiveServiceId": "service_id",
  "description": "Oil Change Service",
  "items": [
    {
      "description": "Engine Oil (5W-30)",
      "quantity": 5,
      "price": 50
    },
    {
      "description": "Oil Filter",
      "quantity": 1,
      "price": 25
    }
  ],
  "tax": 0,
  "dueDate": "2025-12-15",
  "notes": "Thank you for your business"
}

# Returns: Invoice with pdfUrl pointing to Cloudinary
# PDF format: Compact receipt (default) - perfect for printing
# Includes: Company branding, itemized charges, payment total
```

### Test 5: Real-time Messaging
```bash
# Send message
POST /api/messages
{
  "recipientId": "user_id",
  "subject": "Service Update",
  "content": "Your vehicle is ready for pickup"
}

# Recipient receives real-time notification via Pusher channel: `user-{userId}`

# Mark as read (triggers read receipt)
PUT /api/messages/{messageId}/read
```

### Test 6: File Upload
```bash
# Upload file (multipart/form-data)
POST /api/upload
FormData:
  - file: <binary>
  - folder: "service-photos"
  - automotiveServiceId: "service_id"

# Returns: { url, publicId, shareableLink }
```

---

## 🎯 API Endpoints Summary

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/otp` | Send/verify OTP |
| POST | `/api/auth/[...nextauth]` | NextAuth login |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List all customers (staff) |
| GET | `/api/customers/[id]` | Get customer details |
| PUT | `/api/customers/[id]` | Update customer |

### Services
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/services` | Submit service request |
| GET | `/api/services` | List services |
| PUT | `/api/services/[id]/approve` | Approve service |
| PUT | `/api/services/[id]/reject` | Reject service |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/messages` | Send message |
| GET | `/api/messages` | List messages |
| PUT | `/api/messages/[id]/read` | Mark as read |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/invoices` | Create invoice + PDF |
| GET | `/api/invoices` | List invoices |

### File Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload file |
| GET | `/api/upload` | List files |
| DELETE | `/api/upload/[id]` | Delete file |

---

## 📦 Database Models

**Core Models:**
- `User` - Authentication & profiles
- `WebAuthnCredential` - Biometric authentication
- `Customer` - Customer profiles
- `Vehicle` - Customer vehicles
- `AutomotiveService` - Service requests + approval workflow
- `SparePart` - Inventory management
- `Invoice` - Billing + payment tracking
- `Message` - Messaging + read receipts
- `FileUpload` - Cloud file tracking

**Ghana-specific:**
- `Branch` - Multi-location support
- `BranchStaff` - Staff assignments

**Content Management:**
- `BlogPost`, `Page`, `Tip`, `Update`, `Integration`

---

## 🔐 Security Features

✅ Password hashing (bcrypt)  
✅ JWT sessions  
✅ OTP expiry (10 minutes)  
✅ Phone verification  
✅ Role-based access control  
✅ File type validation  
✅ File size limits (10MB)  

**TODO:**
- [ ] Rate limiting on OTP endpoints
- [ ] CSRF protection
- [ ] Input sanitization middleware
- [ ] Webhook signature verification

---

## 🌍 Ghana Localization

- 🇬🇭 Currency: Ghanaian Cedi (GHS)
- 📍 Headquarters: Pawpaw Street, East Legon, Accra
- 📱 Phone format: +233XXXXXXXXX
- 🏢 Multi-branch support ready
- 💼 Executive roles: CEO, Manager, HR

---

## 📄 PDF Document Templates

The platform includes professional PDF generation matching your actual business documents:

### Three Template Types

1. **Job Cards** - Multi-page automotive service work orders
2. **Receipts** - Compact payment receipts (recommended for invoicing)
3. **Full Invoices** - Detailed A4 billing documents

### Quick Access
- **Comprehensive Guide**: `PDF_TEMPLATES.md` - Complete specifications, layouts, usage
- **Quick Reference**: `PDF_QUICK_REFERENCE.md` - Fast examples and common tasks

### Key Features
- ✅ DK Executive Engineers branding (red & navy colors)
- ✅ Ghana localization (GHS currency, Accra address)
- ✅ Professional typography and layouts
- ✅ Auto-generation on service approval/invoice creation
- ✅ Cloudinary storage with organized folders
- ✅ Smart text wrapping for long descriptions

---

## 🚀 Next Steps

### Immediate Actions
1. **Configure Services:**
   - Sign up for Twilio (SMS)
   - Sign up for Cloudinary (file storage)
   - Sign up for Pusher (real-time)
   
2. **Database Migration:**
   ```bash
   npx prisma db push
   npm run db:seed
   ```

3. **Test Core Flows:**
   - Registration → OTP → Login
   - Service booking → Approval → Invoice
   - Messaging → Read receipts
   - File upload → PDF generation

### UI Development Priority
1. Registration form with OTP verification
2. Service booking form (customer)
3. Approval workflow dashboard (staff)
4. Real-time messaging interface
5. Invoice list & PDF viewer
6. File upload component

### Production Checklist
- [ ] Set up production PostgreSQL database
- [ ] Configure production environment variables
- [ ] Set up Cloudinary production bucket
- [ ] Configure Pusher production app
- [ ] Add rate limiting middleware
- [ ] Enable CSRF protection
- [ ] Set up error monitoring (Sentry)
- [ ] Configure email notifications
- [ ] Set up automated backups
- [ ] Add payment gateway (Paystack/Flutterwave)

---

## 📚 Documentation

- `NEW_FEATURES.md` - Detailed feature documentation
- `PDF_TEMPLATES.md` - Complete PDF template specifications & design guide
- `PDF_QUICK_REFERENCE.md` - PDF usage examples & quick reference
- `README.md` - Project overview
- `FEATURES.md` - Complete feature list + Ghana localization
- `PROJECT_STRUCTURE.md` - File organization
- `GETTING_STARTED.md` - Setup guide
- `START_HERE.md` - Quick navigation

---

## 💡 Tips

**Development Mode:**
- OTP is returned in API response (no SMS sent)
- Check console for Pusher connection logs
- Use Prisma Studio to inspect database: `npm run db:studio`

**Production Mode:**
- Ensure all environment variables are set
- Test SMS delivery with real phone numbers
- Monitor Cloudinary usage (free tier: 25GB)
- Monitor Pusher connections (free tier: 100 concurrent)

---

**Status**: ✅ All core features implemented and ready for testing!

**Time to Production**: Approximately 16-24 hours for UI development + testing + deployment setup.
