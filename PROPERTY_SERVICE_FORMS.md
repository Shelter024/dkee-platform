# Property Service Request Forms

## Overview
This document describes the property service request forms system that allows customers to fill out detailed, service-specific forms for each type of property service offered by DK Engineers.

## Features

### Core Functionality
- **6 Specialized Forms**: Each property service has a custom-tailored form
- **Print-Friendly**: Forms can be printed as PDF documents
- **Submit Online**: Forms can be submitted directly through the platform
- **Data Validation**: Required fields ensure complete information collection
- **Responsive Design**: Forms work seamlessly on all devices
- **Professional Layout**: Clean, organized forms with gradient headers

### User Capabilities
1. **Fill Out Form**: Complete detailed service request forms
2. **Print Form**: Generate printable PDF version of the form
3. **Submit Online**: Submit form data directly to the platform
4. **Save Progress**: Form data persists while modal is open

## Available Forms

### 1. Property Sales Form
**Purpose**: For clients buying or selling residential/commercial properties

**Sections**:
- **Personal Information**
  - Full Name (required)
  - Email Address (required)
  - Phone Number (required)
  - Alternative Phone

- **Property Details**
  - Transaction Type: Buying/Selling (required)
  - Property Type: Residential/Commercial/Land/Industrial (required)
  - Property Location (required)
  - Budget/Expected Price in GHS (required)
  - Property Size in sq ft
  - Additional Requirements (text area)

- **Timeline & Documentation**
  - Preferred Closing Date
  - Existing Land Title Documentation: Yes/No

### 2. Leasing & Rental Form
**Purpose**: For tenants looking for properties or landlords wanting to rent out

**Sections**:
- **Personal Information**
  - Full Name (required)
  - Email Address (required)
  - Phone Number (required)
  - Ghana Card Number

- **Rental Information**
  - User Type: Tenant/Landlord (required)
  - Property Type: Apartment/House/Commercial/Office (required)
  - Preferred Location (required)
  - Monthly Budget in GHS (required)
  - Number of Bedrooms
  - Desired Move-in Date (required)
  - Lease Duration: 1/2/3 years or Flexible
  - Special Requirements (text area)

### 3. Property Survey Form
**Purpose**: For clients needing professional property surveys

**Sections**:
- **Client Information**
  - Full Name (required)
  - Email Address (required)
  - Phone Number (required)
  - Company Name

- **Survey Details**
  - Survey Type: Boundary/Topographical/Building/Land/Cadastral (required)
  - Property Location/Address (required)
  - Property Size in acres/hectares
  - Purpose: Purchase/Development/Legal/Dispute/Subdivision (required)
  - Preferred Survey Date (required)
  - Existing Survey Plans: Yes/No
  - Additional Information (text area)

### 4. Property Valuation Form
**Purpose**: For property valuation services

**Sections**:
- **Client Information**
  - Full Name (required)
  - Email Address (required)
  - Phone Number (required)
  - Organization

- **Valuation Details**
  - Purpose: Sale/Purchase/Mortgage/Insurance/Tax/Investment/Legal (required)
  - Property Type: Residential/Commercial/Industrial/Land/Mixed (required)
  - Property Address (required)
  - Property Size in sq ft
  - Year Built
  - Number of Rooms
  - Number of Bathrooms
  - Deadline for Report (required)
  - Property Description & Special Features (text area)

### 5. Consultation Form
**Purpose**: For real estate consultation and advisory services

**Sections**:
- **Personal/Company Information**
  - Full Name (required)
  - Email Address (required)
  - Phone Number (required)
  - Company Name

- **Consultation Details**
  - Consultation Type: Investment/Market Analysis/Development/Portfolio/Regulatory/Feasibility (required)
  - Area of Interest: Residential/Commercial/Industrial/Land/Mixed (required)
  - Investment Budget in GHS
  - Preferred Consultation Date (required)
  - Consultation Mode: In-Person/Video/Phone
  - Consultation Needs (text area, required)
  - Real Estate Experience: Yes/No

### 6. Property Management Form
**Purpose**: For property owners seeking management services

**Sections**:
- **Owner Information**
  - Full Name (required)
  - Email Address (required)
  - Phone Number (required)
  - Alternative Contact

- **Property Information**
  - Property Type: Single/Multi-Family/Apartment/Commercial/Office/Mixed (required)
  - Property Address (required)
  - Number of Units (required)
  - Total Size in sq ft
  - Year Built
  - Occupancy Status: Vacant/Partially Occupied/Fully Occupied (required)
  - Expected Monthly Rent in GHS

- **Management Services Required** (checkboxes)
  - Tenant Screening & Management
  - Rent Collection
  - Property Maintenance & Repairs
  - Regular Property Inspections
  - Financial Reporting
  - Legal Compliance & Documentation

- **Additional Information**
  - Desired Start Date (required)
  - Special Requirements (text area)

## Technical Implementation

### Component Structure

#### PropertyServiceForms Component
**Location**: `src/components/property/PropertyServiceForms.tsx`

**Props**:
```typescript
interface PropertyServiceFormsProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType: string;
}
```

**Key Features**:
- Dynamic form rendering based on `serviceType`
- State management for form data
- Form submission handling
- Print functionality
- Responsive modal layout

**Form Components**:
1. `PropertySalesForm`
2. `LeasingRentalForm`
3. `PropertySurveyForm`
4. `PropertyValuationForm`
5. `ConsultationForm`
6. `PropertyManagementForm`

Each form component receives:
- `formData`: Current form state
- `onChange`: Function to update form fields

### Integration with PropertyServiceModal

**Location**: `src/components/property/PropertyServiceModal.tsx`

**Changes**:
- Added `showForm` state to control form modal visibility
- Added "Fill Service Request Form" button (primary action)
- Added "Quick Request" button (secondary action for direct contact)
- Integrated PropertyServiceForms component
- Import statement for PropertyServiceForms

**User Flow**:
1. User clicks service card → Service modal opens
2. User clicks "Fill Service Request Form" → Form modal opens
3. User fills out form → Can submit or print
4. Alternative: User clicks "Quick Request" → Goes to contact page

### Print Functionality

**Print Styles**: Added to `src/app/globals.css`

**Features**:
- A4 page size with 2cm margins
- Exact color printing (preserves gradients)
- Hides interactive elements (buttons, close icons)
- Maintains form structure and styling
- Page break handling for long forms

**Print Classes**:
- `print:hidden` - Hide elements when printing
- `print:bg-white` - White background for print
- `print:static` - Static positioning
- `print:shadow-none` - Remove shadows
- `print:max-h-none` - Remove height restrictions
- `print:overflow-visible` - Show all content

**Usage**:
```javascript
const handlePrint = () => {
  window.print();
};
```

## User Experience Flow

### From Service Discovery to Form Submission

```
Property Page
    ↓
Click Service Card
    ↓
Service Information Modal Opens
    ↓
Two Options:
    1. Fill Service Request Form → Detailed Form Modal
       - Fill out all required fields
       - Optional: Print form as PDF
       - Submit online
    
    2. Quick Request → Contact Page
       - Pre-filled service information
       - Simpler, faster process
```

### Authentication-Aware Access

**Authenticated Users**:
- Can access forms directly
- Submissions linked to their account
- Can track request status in dashboard

**Unauthenticated Users**:
- Can still access forms (guest mode)
- Choose to create account, sign in, or continue as guest
- Guest submissions stored for follow-up

## Form Validation

### Required Fields
Each form has specific required fields marked with red asterisks (*)

**Common Required Fields**:
- Full Name
- Email Address
- Phone Number
- Service-specific primary information

**Validation Rules**:
- Email must be valid format
- Phone numbers should match Ghana format
- Dates must be in the future (where applicable)
- Numeric fields must be positive numbers

## Data Handling

### Form Submission

**Current Implementation** (Simulated):
```javascript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  alert('Form submitted successfully!');
  setSubmitting(false);
  onClose();
};
```

**Future API Integration**:
```javascript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  
  try {
    const response = await fetch('/api/property-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceType,
        formData,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) throw new Error('Submission failed');
    
    const data = await response.json();
    // Show success message, redirect to confirmation page
    router.push(`/dashboard/requests/${data.requestId}`);
  } catch (error) {
    // Show error message
    alert('Failed to submit form. Please try again.');
  } finally {
    setSubmitting(false);
  }
};
```

### State Management
```javascript
const [formData, setFormData] = useState<any>({});

const handleInputChange = (field: string, value: any) => {
  setFormData((prev: any) => ({ ...prev, [field]: value }));
};
```

## Styling & Design

### Color Scheme
Each service type has a unique gradient color scheme:
- Property Sales: Red gradient
- Leasing & Rental: Orange gradient
- Property Survey: Amber gradient
- Property Valuation: Emerald gradient
- Consultation: Cyan gradient
- Property Management: Blue gradient

### Layout Structure
```
┌─────────────────────────────────────┐
│  Gradient Header (Service Icon)    │
│  Service Title & Description        │
└─────────────────────────────────────┘
│                                     │
│  Form Sections (Cards)              │
│  ┌───────────────────────────────┐ │
│  │ Section 1: Personal Info      │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │ Section 2: Service Details    │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │ Section 3: Additional Info    │ │
│  └───────────────────────────────┘ │
│                                     │
│  [Submit] [Print] [Cancel]          │
└─────────────────────────────────────┘
```

### Responsive Breakpoints
- Mobile (< 768px): Single column, full width
- Tablet (768px - 1023px): Single column, max-width
- Desktop (≥ 1024px): Two-column grid for input pairs

## Testing Checklist

### Form Functionality
- [ ] All forms open correctly from service modal
- [ ] Required field validation works
- [ ] Form data persists while modal is open
- [ ] Submit button shows loading state
- [ ] Success message appears after submission
- [ ] Cancel button closes form without submitting

### Print Functionality
- [ ] Print button triggers browser print dialog
- [ ] Forms print on A4 size paper
- [ ] Gradient headers display in print
- [ ] Interactive elements (buttons) hidden in print
- [ ] All form fields visible in print
- [ ] Page breaks appropriately for long forms

### User Experience
- [ ] Forms are intuitive and easy to fill out
- [ ] Error messages are clear and helpful
- [ ] Loading states provide feedback
- [ ] Mobile experience is smooth
- [ ] Forms are accessible (keyboard navigation)

### Integration
- [ ] Forms integrate with service modal correctly
- [ ] Multiple forms can be opened/closed without issues
- [ ] Form data doesn't leak between different service types
- [ ] Authentication state properly detected

## Future Enhancements

### Phase 1 (Immediate)
1. **Backend API Integration**
   - Create `/api/property-requests` endpoint
   - Store submissions in database
   - Send email notifications to admin

2. **File Upload Capability**
   - Allow users to attach documents
   - Support for property photos
   - Maximum file size limits

3. **Form Validation Enhancement**
   - Real-time validation feedback
   - Custom validation messages
   - Pattern validation for Ghana Card numbers

### Phase 2 (Short-term)
1. **Save Draft Functionality**
   - Auto-save form progress
   - Resume incomplete forms
   - Draft expiration management

2. **Multi-step Forms**
   - Break long forms into steps
   - Progress indicator
   - Back/Next navigation

3. **PDF Generation**
   - Generate filled form as PDF
   - Email PDF to customer
   - Admin can download submissions

### Phase 3 (Long-term)
1. **Smart Form Prefilling**
   - Use customer profile data
   - Previous request history
   - AI-suggested values

2. **Signature Support**
   - Digital signature capture
   - Legal compliance
   - Signature verification

3. **Payment Integration**
   - Service fees in form
   - Payment gateway integration
   - Invoice generation

4. **Request Tracking**
   - Status updates
   - Timeline visualization
   - Communication history

## API Endpoints (Planned)

### Submit Property Request
```
POST /api/property-requests
```

**Request Body**:
```json
{
  "serviceType": "Property Sales",
  "formData": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+233XXXXXXXXX",
    // ... other fields
  },
  "userId": "optional-user-id",
  "timestamp": "2024-11-26T10:00:00Z"
}
```

**Response**:
```json
{
  "success": true,
  "requestId": "req_123456",
  "message": "Request submitted successfully",
  "estimatedResponseTime": "24 hours"
}
```

### Get User Requests
```
GET /api/property-requests?userId={userId}
```

**Response**:
```json
{
  "requests": [
    {
      "id": "req_123456",
      "serviceType": "Property Sales",
      "status": "pending",
      "submittedAt": "2024-11-26T10:00:00Z",
      "lastUpdated": "2024-11-26T10:05:00Z"
    }
  ]
}
```

## Maintenance Notes

### Regular Updates
- Review form fields quarterly for relevance
- Update dropdown options as services evolve
- Monitor submission patterns for optimization
- Collect user feedback on form usability

### Code Locations
- **Forms Component**: `src/components/property/PropertyServiceForms.tsx`
- **Modal Integration**: `src/components/property/PropertyServiceModal.tsx`
- **Print Styles**: `src/app/globals.css`
- **Service Data**: `src/app/property/page.tsx`

---

**Last Updated**: November 26, 2024
**Version**: 1.0
**Status**: ✅ Implemented and Ready for Testing
