# PDF Document Templates

This document describes the professional PDF templates used by DK Executive Engineers for business documents.

## Overview

The platform generates three types of PDF documents:
1. **Job Cards** - Multi-page service work orders for automotive services
2. **Receipts** - Compact payment receipts (recommended for invoicing)
3. **Invoices** - Full A4 detailed invoices

All documents incorporate DK Executive Engineers branding with company colors (red #d32f2f and navy #1a237e).

---

## 1. Job Card Template

### Purpose
Professional work order for automotive services that tracks the entire service lifecycle from request to completion.

### Format
- **Size**: A4 (595 x 842 points)
- **Pages**: 1-2 pages (auto-expands for detailed services)
- **Layout**: Multi-section structured format

### Page 1 Structure

#### Header Section
- **Navy background bar** with white text
- Company name: "D.K EXECUTIVE ENGINEERS"
- Tagline: "AUTOMOTIVE SERVICES & PROPERTY MANAGEMENT"
- Address: Pawpaw Street, East Legon, Accra
- Contact: Phone number

#### Title Bar
- **Red background** with white text
- "JOB CARD" title on left
- Job card number on right (e.g., "No: JC-ABC123")

#### Customer Information Section
- Light navy background header
- Customer name, phone, email
- Clearly labeled fields

#### Vehicle Information Section
- Light navy background header
- Make, model, year
- Registration number, mileage

#### Service Requested Section
- Light navy background header
- Full service description (auto-wrapped text)

#### Diagnosis Section (if applicable)
- Light navy background header
- Technical diagnosis details

#### Work Performed Section (if applicable)
- Light navy background header
- Bulleted list of completed work

### Page 2 Structure (if needed)

#### Continuation Header
- Job card number reference

#### Parts Used Section
- Light navy background header
- Table format:
  - Part Description
  - Quantity
  - Unit Price
- Parts total calculated

#### Labor Charges
- Clearly displayed labor cost

#### Recommendations Section
- Future service recommendations
- Maintenance advice

#### Signature Section
- Technician name field
- Customer signature line
- Horizontal divider line

### Usage Example

```typescript
import { generateJobCardPDF } from '@/lib/pdf';

const pdfBuffer = await generateJobCardPDF({
  jobCardNumber: 'JC-ABC123',
  date: new Date(),
  estimatedCompletion: new Date('2024-01-20'),
  customer: {
    name: 'Kwame Mensah',
    phone: '+233 24 123 4567',
    email: 'kwame@example.com',
  },
  vehicle: {
    make: 'Toyota',
    model: 'Camry',
    year: 2018,
    registrationNumber: 'GR-1234-20',
    mileage: '85,000 km',
  },
  serviceRequested: 'Engine diagnostic and oil change',
  diagnosis: 'Engine oil low. Air filter needs replacement.',
  workPerformed: [
    'Changed engine oil (5W-30 synthetic)',
    'Replaced oil filter',
    'Replaced air filter',
    'Checked tire pressure',
  ],
  partsUsed: [
    { name: 'Engine Oil 5W-30 (5L)', quantity: 1, unitPrice: 250 },
    { name: 'Oil Filter', quantity: 1, unitPrice: 45 },
    { name: 'Air Filter', quantity: 1, unitPrice: 80 },
  ],
  laborCharges: 150,
  recommendations: 'Replace brake pads within next 5,000 km',
  technicianName: 'Michael Boateng',
});
```

### API Endpoint
```
GET /api/services/[id]/job-card
```
Automatically generates and uploads job card PDF for approved services.

---

## 2. Receipt Template (Recommended for Invoices)

### Purpose
Compact, professional payment receipt suitable for both physical printing and digital distribution.

### Format
- **Size**: Compact (420 x 595 points) - fits receipt printers
- **Pages**: Single page
- **Layout**: Structured receipt format

### Structure

#### Header Section
- **Navy background block** with white text
- Company name in two lines:
  - "D.K EXECUTIVE"
  - "ENGINEERS"
- Full address and contact details

#### Title Bar
- **Red background strip** with white text
- "OFFICIAL RECEIPT" centered

#### Receipt Details
- Receipt number
- Date of issue

#### Customer Information
- "RECEIVED FROM:" label
- Customer name
- Phone number

#### Service Description
- "FOR:" label
- Service description (auto-wrapped)
- Vehicle info (if applicable) in lighter text

#### Items Table
- Light navy background header row
- Columns:
  - Description
  - Qty
  - Price
  - Total
- Compact font size (8pt) for space efficiency

#### Totals Section
- Divider line
- Subtotal
- Tax
- **Red background box** for total amount (white text, emphasized)

#### Footer
- Payment notes (if any)
- Divider line
- "Thank you for your business!" in navy
- Email and website in gray

### Usage Example

```typescript
import { generateReceiptPDF } from '@/lib/pdf';

const pdfBuffer = await generateReceiptPDF({
  invoiceNumber: 'RCP-2024-001',
  date: new Date(),
  dueDate: new Date(),
  customer: {
    name: 'Kwame Mensah',
    phone: '+233 24 123 4567',
    email: 'kwame@example.com',
  },
  service: {
    description: 'Engine oil change and filter replacement',
    vehicleInfo: 'Toyota Camry (2018)',
  },
  items: [
    { description: 'Engine Oil 5W-30', quantity: 1, price: 250, total: 250 },
    { description: 'Oil Filter', quantity: 1, price: 45, total: 45 },
    { description: 'Labor', quantity: 1, price: 150, total: 150 },
  ],
  subtotal: 445,
  tax: 0,
  total: 445,
  notes: 'Paid in full via mobile money',
});
```

### API Usage
Receipt format is the **default** for invoice generation:

```typescript
POST /api/invoices
// Returns invoice with receipt-style PDF
```

---

## 3. Full Invoice Template

### Purpose
Detailed A4 invoice for comprehensive billing with extensive line items.

### Format
- **Size**: A4 (595 x 842 points)
- **Pages**: Single page (can expand if needed)
- **Layout**: Professional invoice format

### Structure

Similar to receipt but with:
- Full A4 size for more detailed information
- Larger fonts for readability
- "INVOICE" title instead of "OFFICIAL RECEIPT"
- More space for extensive line items
- Additional notes section

### When to Use
- Detailed service breakdowns with many items
- Corporate billing requirements
- When physical A4 printing is required
- Archival documentation

### Usage Example

```typescript
import { generateInvoicePDF } from '@/lib/pdf';

// Same data structure as receipt
const pdfBuffer = await generateInvoicePDF({
  invoiceNumber: 'INV-2024-001',
  // ... rest of data
});
```

---

## Design Specifications

### Brand Colors
- **Primary Red**: `rgb(0.827, 0.184, 0.184)` - #d32f2f
- **Primary Navy**: `rgb(0.102, 0.137, 0.494)` - #1a237e
- **Light Navy**: `rgb(0.914, 0.918, 0.961)` - Section backgrounds
- **White**: `rgb(1, 1, 1)` - Text on colored backgrounds
- **Gray**: `rgb(0.5, 0.5, 0.5)` - Dividers and secondary text

### Typography
- **Headers**: Helvetica Bold
- **Body**: Helvetica
- **Company Name**: 20-26pt Bold
- **Section Headers**: 12pt Bold
- **Body Text**: 9-10pt
- **Small Text**: 7-8pt

### Layout Principles
1. **Clear Hierarchy**: Section headers with colored backgrounds
2. **Consistent Spacing**: 15-20pt between sections
3. **Professional Appearance**: Clean lines, organized data
4. **Ghana Context**: Currency in GHS, local address
5. **Brand Identity**: Navy and red throughout

---

## File Storage

All generated PDFs are automatically:
1. Uploaded to Cloudinary
2. Organized in folders:
   - `job-cards/` - Job card PDFs
   - `invoices/` - Invoice/receipt PDFs
3. Accessible via secure URLs
4. Linked to database records (pdfUrl fields)

---

## Best Practices

### For Job Cards
- Generate after service approval
- Include all relevant vehicle and service details
- Provide clear recommendations for future maintenance
- Ensure technician name is recorded

### For Receipts/Invoices
- Use receipt format for faster generation and smaller file size
- Use invoice format for detailed corporate billing
- Always include service description and vehicle info
- Add payment notes for clarity

### For All PDFs
- Generate immediately upon creation/approval
- Store securely in cloud storage
- Provide download links to customers
- Maintain backup copies in database URLs

---

## Testing

Test PDF generation with:

```bash
# Create test invoice (receipt format)
POST /api/invoices
{
  "customerId": "...",
  "description": "Test service",
  "items": [...],
  "tax": 0,
  "dueDate": "2024-01-31"
}

# Generate job card for approved service
GET /api/services/{serviceId}/job-card
```

Check:
- ✅ Correct branding colors
- ✅ All data fields populated
- ✅ Proper text wrapping
- ✅ Clean layout without overlaps
- ✅ PDF opens correctly in viewers
- ✅ Cloudinary upload successful

---

## Customization Notes

The PDF templates are designed to match DK Executive Engineers' actual business documents while providing:

1. **Professional Appearance**: Clean, modern design
2. **Brand Consistency**: Company colors throughout
3. **Clear Information**: Well-organized sections
4. **Ghana Localization**: Local address, GHS currency
5. **Practical Layout**: Suitable for printing and digital distribution

All templates use `pdf-lib` for lightweight, fast PDF generation without external dependencies.
