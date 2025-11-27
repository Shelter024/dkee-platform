# PDF Templates - Quick Reference

## 🎨 What's New?

Your platform now generates **professional PDFs** matching DK Executive Engineers' business document style:

### ✅ Job Cards (Automotive Work Orders)
- Multi-page A4 format
- Complete service documentation
- Customer & vehicle information
- Work performed tracking
- Parts & labor breakdown
- Signature sections

### ✅ Receipts (Payment Documents)
- Compact receipt format
- Perfect for printing & digital use
- Professional branding
- Clear payment breakdown

### ✅ Full Invoices (Detailed Billing)
- Full A4 format
- Extended line items
- Corporate billing ready

---

## 🚀 Quick Usage

### Generate Job Card (After Service Approval)

```typescript
// API automatically generates when service is approved
GET /api/services/{serviceId}/job-card

// Returns:
{
  "message": "Job card generated successfully",
  "pdfUrl": "https://cloudinary.com/.../job-card-JC-ABC123.pdf",
  "jobCardNumber": "JC-ABC123"
}
```

### Generate Receipt/Invoice

```typescript
// Create invoice (automatically generates receipt PDF)
POST /api/invoices
{
  "customerId": "cust_123",
  "automotiveServiceId": "serv_456", // optional
  "description": "Engine oil change",
  "items": [
    { "description": "Engine Oil 5W-30", "quantity": 1, "price": 250 },
    { "description": "Labor", "quantity": 1, "price": 150 }
  ],
  "tax": 0,
  "dueDate": "2024-02-01",
  "notes": "Paid via mobile money"
}

// Returns invoice with pdfUrl field
```

---

## 📋 Document Styles

### Brand Colors
- **Red**: #d32f2f (Headers, emphasis)
- **Navy**: #1a237e (Company branding, text)
- **Light Navy**: Section backgrounds

### Typography
- **Company Name**: Bold, large
- **Section Headers**: Bold, colored backgrounds
- **Body Text**: Clean, readable
- **Small Details**: Compact but clear

### Layout
- Clean, professional sections
- Clear information hierarchy
- Print-friendly formats
- Mobile-viewable PDFs

---

## 🔧 Code Examples

### In Your API Route

```typescript
import { generateJobCardPDF, generateReceiptPDF } from '@/lib/pdf';

// Job Card
const jobCardPDF = await generateJobCardPDF({
  jobCardNumber: 'JC-ABC123',
  date: new Date(),
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
  serviceRequested: 'Engine oil change',
  workPerformed: ['Changed oil', 'Replaced filter'],
  partsUsed: [
    { name: 'Engine Oil', quantity: 1, unitPrice: 250 }
  ],
  laborCharges: 150,
});

// Receipt
const receiptPDF = await generateReceiptPDF({
  invoiceNumber: 'RCP-2024-001',
  date: new Date(),
  dueDate: new Date(),
  customer: { name: '...', email: '...', phone: '...' },
  items: [...],
  subtotal: 400,
  tax: 0,
  total: 400,
});
```

### Upload to Cloudinary

```typescript
import { uploadFile } from '@/lib/cloudinary';

const uploadResult = await uploadFile(pdfBuffer, {
  folder: 'job-cards', // or 'invoices'
  filename: `job-card-${jobCardNumber}`,
  resourceType: 'raw',
});

// Save URL to database
await prisma.automotiveService.update({
  where: { id: serviceId },
  data: { jobCardPdfUrl: uploadResult.url },
});
```

---

## 📁 File Organization

PDFs are automatically organized in Cloudinary:

```
dkee-platform/
├── job-cards/
│   ├── job-card-JC-ABC123.pdf
│   ├── job-card-JC-ABC124.pdf
│   └── ...
└── invoices/
    ├── invoice-INV-2024-001.pdf
    ├── invoice-RCP-2024-001.pdf
    └── ...
```

---

## ✅ What's Implemented

- ✅ Job card PDF generation
- ✅ Receipt PDF generation  
- ✅ Full invoice PDF generation
- ✅ Automatic upload to Cloudinary
- ✅ Database URL storage
- ✅ Brand colors throughout
- ✅ Ghana localization (GHS, Accra address)
- ✅ Professional typography
- ✅ Multi-page support (job cards)
- ✅ Smart text wrapping
- ✅ API endpoints

---

## 📖 Need More Details?

See **PDF_TEMPLATES.md** for:
- Complete specifications
- All section layouts
- Design guidelines
- Advanced customization
- Testing procedures

---

## 🎯 Best Practices

1. **Job Cards**: Generate after service approval
2. **Receipts**: Use for standard invoicing (default)
3. **Full Invoices**: Use for detailed corporate billing
4. **File Names**: Include job card/invoice numbers
5. **Storage**: Always upload to Cloudinary
6. **Database**: Save pdfUrl for customer access

---

## 🆘 Common Issues

**PDF not generating?**
- Check all required fields are provided
- Verify customer and vehicle data exists
- Ensure service is approved (for job cards)

**Upload failing?**
- Verify Cloudinary credentials in `.env`
- Check folder permissions
- Ensure `resourceType: 'raw'` for PDFs

**Text overlapping?**
- Text auto-wraps based on character count
- Very long descriptions may need manual truncation
- Consider splitting into multiple fields

---

**Generated**: November 2025  
**Platform**: DK Executive Engineers Unified Platform  
**Technology**: Next.js 14 + Prisma + pdf-lib + Cloudinary
