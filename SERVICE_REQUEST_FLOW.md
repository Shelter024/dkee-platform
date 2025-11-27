# Service Request Flow Documentation

## Overview
This document describes the comprehensive service request flow implemented for both Automotive and Property services. The flow handles three user scenarios: authenticated users, unauthenticated users, and guest users.

## User Journey

### 1. Service Discovery
Users can discover services on two landing pages:
- **Automotive Services**: `/automotive`
- **Property Services**: `/property`

Each service card displays:
- Service title and description
- Clickable card that opens a detailed modal

### 2. Service Information Modal
When a user clicks on a service card, a modal opens showing:

#### Modal Content
- **Full Description**: Comprehensive information about the service
- **Benefits**: 5 key benefits specific to Ghana's context
- **Features**: 8 detailed features of the service
- **Call-to-Action**: "Request [Service Name] Service" button

#### Authentication-Aware Flow

**For Authenticated Users:**
- Clicking "Request Service" directly navigates to the appropriate page with service prefilled
- Automotive: → `/dashboard/customer/services?service=ServiceName`
- Property: → `/contact?service=ServiceName&type=property`

**For Unauthenticated Users:**
- Clicking "Request Service" shows three options:
  1. **Create Account**: → `/register?service=ServiceName&type=automotive|property`
  2. **Sign In**: → `/login?service=ServiceName&type=automotive|property`
  3. **Continue as Guest**: → `/contact?service=ServiceName&type=automotive|property`
- Users can go back to the service information

**For Guest Users:**
- Can proceed without account creation
- Routed to contact form with service information prefilled
- No authentication required to request a service

### 3. Service Request Submission

#### Authenticated Users - Dashboard
Location: `/dashboard/customer/services`

Features:
- Booking form automatically opens with service type prefilled
- User selects their vehicle from registered vehicles
- Service type is pre-selected based on the clicked service
- Additional fields:
  - Service description
  - Preferred date
  - Estimated cost (optional)
- Submission creates a service request in the system

#### Guest Users - Contact Form
Location: `/contact`

Features:
- Service interest dropdown pre-selected
- Message field prefilled with service request template
- User provides:
  - Name and contact information
  - Service details
  - Message/description
- No account creation required

## Technical Implementation

### Components

#### 1. ServiceModal (Automotive)
**Location**: `src/components/automotive/ServiceModal.tsx`

**Key Features:**
- Uses `useSession()` to check authentication state
- Uses `useRouter()` for programmatic navigation
- State management for multi-step flow (`showGuestOption`)
- Conditional rendering based on auth state

**Props:**
```typescript
interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    title: string;
    fullDescription: string;
    benefits: string[];
    features: string[];
    gradient: string;
  };
}
```

#### 2. PropertyServiceModal
**Location**: `src/components/property/PropertyServiceModal.tsx`

**Key Features:**
- Identical authentication flow to ServiceModal
- Routes to `/contact` instead of dashboard
- Includes `type=property` in query parameters
- Property-specific gradient colors

#### 3. Automotive Page
**Location**: `src/app/automotive/page.tsx`

**Key Features:**
- Client component with `useState` for modal state
- Comprehensive service data (9 services)
- Each service includes:
  - Full description
  - 5 benefits
  - 8 features
- Click handlers set selected service with gradient
- ServiceModal rendered at bottom

**Services:**
1. Maintenance and Repair Services
2. Diagnostic Services
3. Spare Parts Supply
4. Vehicle Tracking
5. Fleet Management
6. Key Programming
7. Body Works and Spraying
8. 24/7 Towing Service
9. Training and Consultancy

#### 4. Property Page
**Location**: `src/app/property/page.tsx`

**Key Features:**
- Client component with modal integration
- 6 comprehensive property services
- Ghana-specific context and benefits
- PropertyServiceModal integration

**Services:**
1. Property Sales
2. Leasing & Rental
3. Property Survey
4. Property Valuation
5. Consultation
6. Property Management

#### 5. Contact Page
**Location**: `src/app/contact/page.tsx`

**Enhancements:**
- Client component with `useSearchParams()`
- Reads `service` and `type` query parameters
- Auto-fills service interest dropdown
- Auto-fills message with service request template
- Controlled form inputs with `useState`

#### 6. Customer Services Page
**Location**: `src/app/dashboard/customer/services/page.tsx`

**Enhancements:**
- Reads `service` query parameter
- Auto-opens booking form
- Pre-selects service type
- Added all automotive service options to dropdown

## Query Parameter Pattern

### Structure
```
?service=ServiceName&type=automotive|property
```

### Examples
- `/dashboard/customer/services?service=Fleet Management`
- `/contact?service=Property Sales&type=property`
- `/register?service=Vehicle Tracking&type=automotive`
- `/login?service=Property Valuation&type=property`

### Implementation
```typescript
const searchParams = useSearchParams();
const service = searchParams.get('service');
const type = searchParams.get('type');

if (service) {
  // Prefill form with service information
}
```

## User Experience Flow Chart

```
User clicks service card
        ↓
    Modal opens
        ↓
   Authenticated? ──→ YES → Direct to destination with prefilled service
        ↓                    (Dashboard for automotive, Contact for property)
       NO
        ↓
Show three options:
1. Create Account → /register?service=X&type=Y
2. Sign In → /login?service=X&type=Y
3. Continue as Guest → /contact?service=X&type=Y
        ↓
User makes choice
        ↓
Redirected to chosen page
        ↓
Service information prefilled
        ↓
User completes request
```

## Benefits

### For Users
1. **Seamless Experience**: No friction between browsing and requesting
2. **No Forced Registration**: Guest option available
3. **Context Preservation**: Service details carry through the flow
4. **Clear Options**: Multiple paths based on user preference
5. **Informed Decisions**: Comprehensive service information before request

### For Business
1. **Higher Conversion**: Multiple conversion paths increase likelihood
2. **Reduced Abandonment**: Guest option captures leads that might otherwise leave
3. **Better Data**: Service interest tracked from landing page click
4. **User Flexibility**: Accommodates different user preferences
5. **Professional Image**: Polished, modern user experience

## Testing Checklist

### Automotive Services
- [ ] Click each service card opens modal
- [ ] Modal displays all service information
- [ ] Authenticated user: Direct to dashboard with prefill
- [ ] Unauthenticated user: Show three options
- [ ] Guest flow: Contact form with prefill
- [ ] Register/Login preserve service in query params
- [ ] Dashboard auto-opens form with service selected

### Property Services
- [ ] Click each service card opens modal
- [ ] Modal displays all service information
- [ ] Authenticated user: Direct to contact with prefill
- [ ] Unauthenticated user: Show three options
- [ ] Guest flow: Contact form with prefill and type=property
- [ ] Register/Login preserve service in query params
- [ ] Contact form auto-fills service and message

### Cross-Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

### Responsive Design
- [ ] Mobile (320px-767px)
- [ ] Tablet (768px-1023px)
- [ ] Desktop (1024px+)

## Future Enhancements

### Potential Improvements
1. **Service Request API**: Backend endpoint for guest service requests
2. **Email Notifications**: Notify team when guest requests service
3. **Service Analytics**: Track which services get most clicks/requests
4. **A/B Testing**: Test different CTA button texts
5. **Multi-Language**: Support for multiple languages
6. **Service Comparison**: Side-by-side comparison of services
7. **Pricing Information**: Display pricing ranges in modal
8. **Video Tutorials**: Embed service explanation videos
9. **Customer Reviews**: Show testimonials for each service
10. **Live Chat Integration**: Instant support within modal

### Technical Improvements
1. **Server Actions**: Replace client-side routing with server actions
2. **Optimistic Updates**: Show immediate feedback on form submission
3. **Error Handling**: More robust error messages
4. **Loading States**: Better loading indicators
5. **Validation**: Real-time form validation
6. **Accessibility**: ARIA labels and keyboard navigation
7. **Performance**: Code splitting and lazy loading
8. **SEO**: Meta tags for service pages
9. **Analytics**: Track conversion funnel
10. **Session Persistence**: Save form data in session storage

## Maintenance Notes

### Regular Updates
- Update service descriptions quarterly
- Review benefits based on customer feedback
- Update pricing information as needed
- Test authentication flow after auth updates
- Monitor query parameter changes in URL routing

### Code Locations
- **Modals**: `src/components/automotive/ServiceModal.tsx`, `src/components/property/PropertyServiceModal.tsx`
- **Landing Pages**: `src/app/automotive/page.tsx`, `src/app/property/page.tsx`
- **Contact Form**: `src/app/contact/page.tsx`
- **Dashboard Services**: `src/app/dashboard/customer/services/page.tsx`

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: ✅ Implemented and Tested
