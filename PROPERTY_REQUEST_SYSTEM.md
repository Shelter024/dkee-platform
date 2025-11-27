# Property Request Management System - Complete Documentation

## Overview
A comprehensive full-stack property service request management system with role-based access control, file uploads, draft saving, email notifications, and social media management capabilities.

---

## 🎯 Key Features

### For Customers
- **6 Property Service Types**
  - Property Sales
  - Property Leasing
  - Property Survey
  - Property Valuation
  - Property Consultation
  - Property Management

- **Request Management**
  - Create new requests with detailed forms
  - Save drafts and resume later
  - Upload supporting documents (PDF, images, Word - max 10MB)
  - Track request status in real-time
  - View submission timeline
  - Download uploaded documents

### For Staff (Property)
- **Request Processing**
  - View all customer requests
  - Filter by status and service type
  - Fill and print blank forms for walk-in customers
  - Approve/reject/review requests
  - Add internal notes and comments
  - Assign requests to specific staff members

### For Staff (Social Media)
- **Multi-Platform Management**
  - Create posts for Facebook, Instagram, Twitter, TikTok, LinkedIn
  - Draft system for content preparation
  - Schedule posts for future publication
  - Track engagement metrics
  - Manage published content

### For Admins
- **Staff Permission Management**
  - Grant granular permissions to staff members
  - 9 permission flags available
  - Audit trail for all permission changes
  - Role-based access control

---

## 📊 Database Schema

### PropertyRequest Model
```prisma
model PropertyRequest {
  id              String    @id @default(cuid())
  requestNumber   String    @unique  // PR-YYYYMMDD-XXXX
  serviceType     PropertyRequestServiceType
  status          PropertyRequestStatus @default(SUBMITTED)
  formData        Json      // Stores all form fields
  
  // User Information
  userId          String?
  user            User?     @relation(fields: [userId], references: [id])
  email           String
  phone           String
  
  // Draft System
  isDraft         Boolean   @default(false)
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  submittedAt     DateTime?
  reviewedAt      DateTime?
  completedAt     DateTime?
  
  // Staff Assignment
  assignedToId    String?
  assignedTo      User?     @relation("AssignedRequests", fields: [assignedToId], references: [id])
  reviewedById    String?
  reviewedBy      User?     @relation("ReviewedRequests", fields: [reviewedById], references: [id])
  
  // Relations
  documents       PropertyRequestDocument[]
  comments        PropertyRequestComment[]
}
```

### PropertyRequestDocument Model
```prisma
model PropertyRequestDocument {
  id              String   @id @default(cuid())
  requestId       String
  request         PropertyRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  
  fileName        String
  fileUrl         String
  fileSize        Int
  fileType        String
  
  uploadedAt      DateTime @default(now())
  uploadedById    String?
  uploadedBy      User?    @relation(fields: [uploadedById], references: [id])
}
```

### StaffPermission Model
```prisma
model StaffPermission {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Permission Flags
  canManageUsers        Boolean  @default(false)
  canManageBlog         Boolean  @default(false)
  canManagePages        Boolean  @default(false)
  canManageSocial       Boolean  @default(false)
  canViewAnalytics      Boolean  @default(false)
  canManageProperty     Boolean  @default(false)
  canManageAutomotive   Boolean  @default(false)
  canManageFinance      Boolean  @default(false)
  canApproveRequests    Boolean  @default(false)
  
  // Audit Trail
  grantedById           String?
  grantedBy             User?    @relation("GrantedPermissions", fields: [grantedById], references: [id])
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### SocialMediaPost Model
```prisma
model SocialMediaPost {
  id              String              @id @default(cuid())
  platform        SocialMediaPlatform
  content         String
  mediaUrl        String?
  status          SocialMediaStatus   @default(DRAFT)
  
  scheduledFor    DateTime?
  publishedAt     DateTime?
  
  engagement      Json?  // Stores likes, shares, comments, etc.
  
  createdById     String
  createdBy       User     @relation("CreatedPosts", fields: [createdById], references: [id])
  publishedById   String?
  publishedBy     User?    @relation("PublishedPosts", fields: [publishedById], references: [id])
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Enums
```prisma
enum PropertyRequestStatus {
  DRAFT
  SUBMITTED
  IN_REVIEW
  APPROVED
  REJECTED
  COMPLETED
  CANCELLED
}

enum PropertyRequestServiceType {
  SALES
  LEASING
  SURVEY
  VALUATION
  CONSULTATION
  MANAGEMENT
}

enum SocialMediaPlatform {
  FACEBOOK
  INSTAGRAM
  TWITTER
  TIKTOK
  LINKEDIN
}

enum SocialMediaStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
  FAILED
}
```

---

## 🔌 API Endpoints

### Property Requests API
**Base Path:** `/api/property-requests`

#### GET - Fetch Requests
```typescript
Query Parameters:
- status: PropertyRequestStatus (optional)
- serviceType: PropertyRequestServiceType (optional)
- isDraft: boolean (optional)

Response:
{
  requests: PropertyRequest[]
}

Access Control:
- Customers: See only their own requests
- Staff/Admin: See all requests
```

#### POST - Create Request
```typescript
Body:
{
  serviceType: PropertyRequestServiceType
  formData: object
  email: string
  phone: string
  isDraft: boolean
}

Response:
{
  request: PropertyRequest
}

Features:
- Auto-generates request number (PR-YYYYMMDD-XXXX)
- Sends confirmation email to customer
- Sends notification email to all property staff
```

#### PUT - Update Request
```typescript
Body:
{
  requestId: string
  status?: PropertyRequestStatus
  formData?: object
  isDraft?: boolean
}

Response:
{
  request: PropertyRequest
}
```

#### DELETE - Delete Request
```typescript
Query Parameters:
- requestId: string

Access Control:
- Customers: Can only delete their own drafts
- Staff/Admin: Can delete any request
```

---

### File Upload API
**Base Path:** `/api/property-requests/documents`

#### POST - Upload Document
```typescript
Body: FormData
- file: File (max 10MB)
- requestId: string

Allowed Types:
- application/pdf
- image/jpeg, image/png, image/gif
- application/msword
- application/vnd.openxmlformats-officedocument.wordprocessingml.document

Response:
{
  document: PropertyRequestDocument
}

Storage: Cloudinary
```

#### DELETE - Delete Document
```typescript
Query Parameters:
- documentId: string

Response:
{
  success: true
}
```

---

### Staff Permissions API
**Base Path:** `/api/staff/permissions`

#### GET - Fetch Permissions
```typescript
Query Parameters:
- userId: string (optional, returns all if omitted)

Response:
{
  permissions: StaffPermission[]
}

Access: Admin/CEO only
```

#### POST - Grant/Update Permissions
```typescript
Body:
{
  userId: string
  canManageUsers: boolean
  canManageBlog: boolean
  canManagePages: boolean
  canManageSocial: boolean
  canViewAnalytics: boolean
  canManageProperty: boolean
  canManageAutomotive: boolean
  canManageFinance: boolean
  canApproveRequests: boolean
}

Response:
{
  permission: StaffPermission
}

Features:
- Validates user has staff role
- Logs all changes to AuditLog
- Admin/CEO only access
```

#### DELETE - Revoke Permissions
```typescript
Query Parameters:
- userId: string

Response:
{
  success: true
}
```

---

### Social Media API
**Base Path:** `/api/social-media/posts`

#### GET - Fetch Posts
```typescript
Query Parameters:
- platform: SocialMediaPlatform (optional)
- status: SocialMediaStatus (optional)

Response:
{
  posts: SocialMediaPost[]
}

Access: Requires canManageSocial permission
```

#### POST - Create Post
```typescript
Body:
{
  platform: SocialMediaPlatform
  content: string
  mediaUrl?: string
  status: SocialMediaStatus
  scheduledFor?: DateTime
}

Response:
{
  post: SocialMediaPost
}
```

#### PUT - Update Post
```typescript
Body:
{
  postId: string
  content?: string
  mediaUrl?: string
  status?: SocialMediaStatus
  scheduledFor?: DateTime
}

Response:
{
  post: SocialMediaPost
}

Features:
- Auto-sets publishedAt when status changes to PUBLISHED
```

#### DELETE - Delete Post
```typescript
Query Parameters:
- postId: string

Response:
{
  success: true
}
```

---

## 🎨 Frontend Components

### 1. PropertyServiceForms Component
**Path:** `src/components/property/PropertyServiceForms.tsx`

**Features:**
- 6 service-specific form templates
- Real-time form validation
- Draft auto-save functionality
- File upload with drag & drop
- Print functionality for blank and filled forms
- API integration for submission

**Props:**
```typescript
interface Props {
  onClose: () => void
  draftData?: any          // Pre-fill form with draft data
  requestId?: string       // For editing existing requests
}
```

**State Management:**
- `formData`: Current form field values
- `submitting`: Submission in progress
- `savingDraft`: Draft save in progress
- `uploadedFiles`: List of uploaded documents
- `uploadingFile`: File upload in progress
- `message`: Success/error messages

**Key Functions:**
- `handleSubmit(e, isDraft)`: Submit or save draft
- `handleFileUpload(file)`: Upload document to API
- `handleFileDelete(docId)`: Remove uploaded document
- `getServiceTypeEnum()`: Map display names to enum values

---

### 2. Admin Property Requests Dashboard
**Path:** `src/app/dashboard/admin/property-requests/page.tsx`

**Features:**
- View all customer requests
- Filter by status and service type
- Search by request number, email, or phone
- View request details in modal
- Print individual requests
- Create blank forms for walk-in customers
- Document count display

**UI Elements:**
- Status-based color coding
- Request cards with metadata
- Action buttons (View, Print, Comments)
- Filter dropdowns
- Search bar

---

### 3. Staff Permissions Management
**Path:** `src/app/dashboard/admin/staff-permissions/page.tsx`

**Features:**
- List all staff members
- View current permissions for each user
- Grant/revoke permissions via checkboxes
- Real-time permission updates
- Role badges for visual identification
- Permission descriptions

**Permission Categories:**
- User Management
- Blog Management
- Page Management
- Social Media (highlighted)
- Analytics Access
- Property Requests (highlighted)
- Automotive Services
- Financial Records
- Request Approval

---

### 4. Social Media Dashboard
**Path:** `src/app/dashboard/staff/social-media/page.tsx`

**Features:**
- Multi-platform post composer
- Platform-specific icons and colors
- Draft/Schedule/Publish workflow
- Content calendar view
- Engagement metrics display
- Post management (edit, delete)
- Filter by platform and status

**Supported Platforms:**
- Facebook (blue)
- Instagram (pink)
- Twitter (sky blue)
- TikTok (black)
- LinkedIn (dark blue)

---

### 5. Customer Request Tracking
**Path:** `src/app/dashboard/customer/property-requests/page.tsx`

**Features:**
- View personal requests only
- Filter by status (All, Drafts, Submitted)
- Request timeline visualization
- Document download
- Continue editing drafts
- Delete draft requests
- Status indicators with icons

**Timeline Events:**
- Request Created
- Request Submitted
- Under Review
- Request Completed
- Pending Review (current status)

---

## 📧 Email Notifications

### Customer Confirmation Email
**Trigger:** When request is submitted (isDraft = false)

**Template:**
```html
<div style="background: linear-gradient(135deg, #B91C1C 0%, #DC2626 100%);">
  <h1>Property Request Confirmation</h1>
  <p>Request Number: PR-20250126-0001</p>
  <p>Service Type: Property Sales</p>
  <p>Status: SUBMITTED</p>
  <p>Our team will review your request and contact you shortly.</p>
</div>
```

### Staff Notification Email
**Trigger:** When request is submitted
**Recipients:** All users with ADMIN, CEO, MANAGER, or STAFF_PROPERTY role

**Template:**
```html
<div style="background: linear-gradient(135deg, #B91C1C 0%, #DC2626 100%);">
  <h1>New Property Request</h1>
  <p>Request Number: PR-20250126-0001</p>
  <p>Service Type: Property Sales</p>
  <p>Customer: john@example.com</p>
  <p>Phone: +234 123 456 7890</p>
  <a href="/dashboard/admin/property-requests">View Request</a>
</div>
```

---

## 🔐 Access Control

### User Roles
```typescript
enum UserRole {
  ADMIN           // Full system access
  CEO             // Full system access
  MANAGER         // Departmental management
  HR              // HR operations
  STAFF_AUTO      // Automotive services
  STAFF_PROPERTY  // Property services
  STAFF_SOCIAL_MEDIA // Social media management
  CONTENT_EDITOR  // Content creation
  CUSTOMER        // Customer portal access
  USER            // Basic user access
}
```

### Permission Matrix

| Permission | Admin | CEO | Manager | Staff (Property) | Staff (Social) | Customer |
|------------|-------|-----|---------|------------------|----------------|----------|
| View All Requests | ✅ | ✅ | ✅ | ✅ | ❌ | Own Only |
| Create Request | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Approve Request | ✅ | ✅ | ✅ | If granted | ❌ | ❌ |
| Delete Any Request | ✅ | ✅ | ✅ | ✅ | ❌ | Own Drafts |
| Manage Permissions | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Social Media | ✅ | ✅ | If granted | ❌ | ✅ | ❌ |
| View Analytics | ✅ | ✅ | If granted | If granted | If granted | ❌ |

---

## 🚀 Workflow Examples

### Customer Submitting Request
1. Customer logs in and navigates to property services
2. Selects service type (e.g., Property Sales)
3. Fills out the form with required details
4. Clicks "Save as Draft" to save progress
5. Uploads supporting documents (title deed, ID, etc.)
6. Reviews form and clicks "Submit"
7. System generates request number (PR-20250126-0001)
8. Confirmation email sent to customer
9. Notification email sent to all property staff
10. Request appears in customer dashboard with "SUBMITTED" status

### Staff Processing Request
1. Staff member logs in and views property requests dashboard
2. Sees new request in "SUBMITTED" status
3. Clicks "View Details" to open form modal
4. Reviews customer information and uploaded documents
5. Adds internal notes via comments system
6. Changes status to "IN_REVIEW"
7. After verification, changes status to "APPROVED"
8. Assigns request to specific staff member for completion
9. Changes status to "COMPLETED" when done
10. Customer sees updated status in their dashboard

### Staff Creating Post
1. Social media staff logs in
2. Navigates to social media dashboard
3. Clicks "New Post" button
4. Selects platform (e.g., Facebook)
5. Writes post content
6. Uploads media (optional)
7. Chooses status:
   - "Draft" to save for later
   - "Scheduled" to set future publish time
   - "Published" to post immediately
8. Clicks "Create Post"
9. Post appears in dashboard with appropriate status
10. Can track engagement metrics after publication

---

## 📁 File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── property-requests/
│   │   │   ├── route.ts              # Main CRUD API
│   │   │   └── documents/
│   │   │       └── route.ts          # File upload API
│   │   ├── staff/
│   │   │   └── permissions/
│   │   │       └── route.ts          # Permission management
│   │   └── social-media/
│   │       └── posts/
│   │           └── route.ts          # Social media API
│   │
│   └── dashboard/
│       ├── admin/
│       │   ├── property-requests/
│       │   │   └── page.tsx          # Admin request dashboard
│       │   └── staff-permissions/
│       │       └── page.tsx          # Permission management UI
│       ├── staff/
│       │   └── social-media/
│       │       └── page.tsx          # Social media dashboard
│       └── customer/
│           └── property-requests/
│               └── page.tsx          # Customer request tracking
│
├── components/
│   └── property/
│       └── PropertyServiceForms.tsx  # Enhanced form component
│
├── lib/
│   ├── prisma.ts                     # Database client
│   ├── cloudinary.ts                 # File upload utility
│   ├── email.ts                      # Email service
│   └── roles.ts                      # Role utility functions
│
└── types/
    └── next-auth.d.ts                # NextAuth type extensions

prisma/
└── schema.prisma                     # Database schema
```

---

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Email
EMAIL_FROM="noreply@dkee.com"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email"
SMTP_PASSWORD="your-password"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

### File Upload Limits
```typescript
const FILE_UPLOAD_CONFIG = {
  maxSize: 10 * 1024 * 1024,  // 10MB
  allowedTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
}
```

---

## ✅ Testing Checklist

### Customer Workflow
- [ ] Create new request with all required fields
- [ ] Save request as draft
- [ ] Resume editing draft
- [ ] Upload supporting documents
- [ ] Submit completed request
- [ ] Receive confirmation email
- [ ] View request status in dashboard
- [ ] Download uploaded documents
- [ ] Delete draft request

### Staff Workflow
- [ ] View all customer requests
- [ ] Filter requests by status
- [ ] Filter requests by service type
- [ ] Search requests by number/email/phone
- [ ] Open request details
- [ ] Print request form
- [ ] Create blank form for walk-in customer
- [ ] Change request status
- [ ] Add internal comments
- [ ] Assign request to staff member

### Admin Workflow
- [ ] View all staff members
- [ ] Grant property management permission
- [ ] Grant social media permission
- [ ] Revoke permissions
- [ ] View permission audit logs
- [ ] Verify role-based access control

### Social Media Workflow
- [ ] Create draft post
- [ ] Schedule post for future
- [ ] Publish post immediately
- [ ] Edit existing post
- [ ] Delete post
- [ ] Filter by platform
- [ ] Filter by status
- [ ] View engagement metrics

### Email Notifications
- [ ] Customer receives confirmation email
- [ ] Staff receives notification email
- [ ] Email contains correct request details
- [ ] Email links work correctly

---

## 🐛 Troubleshooting

### Issue: File upload fails
**Solution:**
- Check file size (max 10MB)
- Verify file type is allowed
- Ensure request is saved as draft first (need requestId)
- Check Cloudinary credentials in .env

### Issue: Permission changes not saving
**Solution:**
- Verify user is Admin or CEO
- Ensure target user has staff role
- Check database connection
- Review server logs for errors

### Issue: Emails not sending
**Solution:**
- Verify SMTP credentials in .env
- Check EMAIL_FROM address is valid
- Test SMTP connection manually
- Review email service logs

### Issue: Request number not generating
**Solution:**
- Check database sequence
- Verify date format is correct
- Ensure unique constraint is working
- Review API logs for errors

---

## 📈 Future Enhancements

### Phase 1 (Completed)
- ✅ Database schema with 5 models
- ✅ Property request API endpoints
- ✅ File upload system
- ✅ Draft saving functionality
- ✅ Email notifications
- ✅ Staff permission system
- ✅ Social media management
- ✅ Admin dashboards
- ✅ Customer portal

### Phase 2 (Pending)
- [ ] Request review workflow with comments
- [ ] Internal messaging between staff and customers
- [ ] SMS notifications via Twilio
- [ ] Advanced analytics dashboard
- [ ] Export requests to PDF/Excel
- [ ] Batch operations for requests
- [ ] Calendar view for scheduled social posts
- [ ] Integration with actual social media APIs (Facebook Graph, Instagram Basic Display, Twitter API)

### Phase 3 (Future)
- [ ] Mobile app for customers
- [ ] Push notifications
- [ ] Real-time chat support
- [ ] Document e-signature integration
- [ ] Payment processing for services
- [ ] Customer satisfaction surveys
- [ ] AI-powered content suggestions for social media
- [ ] Multi-language support
- [ ] Advanced reporting and business intelligence

---

## 📞 Support

For technical support or feature requests, contact:
- Email: support@dkee.com
- Phone: +234 XXX XXX XXXX

---

## 📄 License

Copyright © 2025 DKee. All rights reserved.
