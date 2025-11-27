# Manual Document Workflow (Invoices, Receipts, Job Cards)

The platform now uses a manual process for generating invoices, receipts, and job cards. These documents are created physically (paper) and then captured (photo or scan) and uploaded to the system so customers and staff can access them digitally.

## Goals
- Eliminate in-app PDF generation complexity
- Preserve authentic handwritten/field workflow
- Ensure searchable, structured metadata (totals, vehicle reg, customer, service type)
- Support warranties and discounts per job

## Data Model Changes
- `FileUpload` now supports linkage to either an `AutomotiveService` or an `Invoice` plus `documentType` (e.g. `INVOICE_SCAN`, `RECEIPT_SCAN`, `JOBCARD_SCAN`).
- Use `invoiceId` or `automotiveServiceId` when uploading.

## Upload API (`POST /api/upload`)
Form Data Fields:
- `file` (required): Image (jpg/png/webp) or PDF scan.
- `folder` (optional): Suggested values:
  - `invoices/manual`
  - `receipts/manual`
  - `jobcards/manual`
- `invoiceId` (optional): Attach to invoice record.
- `automotiveServiceId` (optional): Attach to service/job.
- `documentType` (optional): One of `INVOICE_SCAN`, `RECEIPT_SCAN`, `JOBCARD_SCAN`.

## Recommended Front-End Flow
1. Staff completes a job manually and fills physical job card.
2. Staff records structured metadata in the UI form:
   - Service type
   - Vehicle registration number
   - Customer name (auto from selection)
   - Totals (subtotal, tax, total) if invoice
   - Warranty period (e.g. 30 days) and discount applied (if any)
3. Staff takes a clear photo or scans document.
4. Upload via UI component calling `POST /api/upload` with appropriate IDs and `documentType`.
5. Persist metadata separately in `AutomotiveService` or `Invoice` fields (do NOT rely only on image).

## Suggested Metadata Extensions (Optional)
If needed later, extend schema:
- `Invoice`: add `warrantyMonths Int?`, `discountPercentage Float?`, `discountReason String?`.
- `AutomotiveService`: add `warrantyMonths Int?`, `discountAmount Float?`.

## Customer Portal Display
- Show list of related documents under each service/invoice.
- Provide thumbnail + modal viewer.
- Surface structured metadata (totals, warranty expiration, discount applied) alongside the image.

## Searchability Strategy
Because images are not text-searchable initially:
- Store key metadata fields in their models.
- (Future) Add optional OCR step to extract text if needed.

## Security & Validation
- Limit file types and size (already enforced: max 10MB).
- Only authenticated users with proper roles can upload linked documents.
- Consider adding rate limits for uploads (future).

## Next Implementation Steps
1. Add front-end form components for manual metadata entry.
2. (Optional) Add warranty/discount fields to Prisma if required immediately.
3. Build document gallery UI for services & invoices.
4. Add role-based access control checks (e.g., only staff/admin can upload).
5. Add delete endpoint for erroneous uploads (`DELETE /api/upload/[id]`).

## Example FormData Submission (Pseudo-Code)
```
const form = new FormData();
form.append('file', fileInput.files[0]);
form.append('invoiceId', invoice.id);
form.append('folder', 'invoices/manual');
form.append('documentType', 'INVOICE_SCAN');
await fetch('/api/upload', { method: 'POST', body: form });
```

## Notes
- Existing PDF generation utilities remain but are currently unused; they can be removed later if confirmed unnecessary.
- Keep consistent naming conventions for `folder` to simplify filtering.

---
If you want to proceed with adding warranty/discount fields now, let me know and I will patch the schema accordingly.
