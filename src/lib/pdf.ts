import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { formatCurrency, formatDate } from './utils';

export interface InvoiceData {
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  customer: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  service?: {
    description: string;
    vehicleInfo?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
}

export interface JobCardData {
  jobCardNumber: string;
  date: Date;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  vehicle: {
    make: string;
    model: string;
    year?: number;
    registrationNumber: string;
    mileage?: string;
  };
  serviceRequested: string;
  diagnosis?: string;
  workPerformed?: string[];
  partsUsed?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  laborCharges?: number;
  recommendations?: string;
  technicianName?: string;
  estimatedCompletion?: Date;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let yPosition = height - 50;

  // Company Header
  page.drawText('D.K Executive Engineers', {
    x: 50,
    y: yPosition,
    size: 24,
    font: fontBold,
    color: rgb(0.827, 0.184, 0.184), // Brand red #d32f2f
  });

  yPosition -= 20;
  page.drawText('Pawpaw Street, East Legon, Accra, Ghana', {
    x: 50,
    y: yPosition,
    size: 10,
    font,
    color: rgb(0.102, 0.137, 0.494), // Brand navy #1a237e
  });

  yPosition -= 15;
  page.drawText('Phone: +233 XX XXX XXXX | Email: info@dkengineers.com', {
    x: 50,
    y: yPosition,
    size: 10,
    font,
    color: rgb(0.102, 0.137, 0.494), // Brand navy
  });

  yPosition -= 40;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 2,
    color: rgb(0.827, 0.184, 0.184), // Brand red
  });

  yPosition -= 30;

  // Invoice Title
  page.drawText('INVOICE', {
    x: 50,
    y: yPosition,
    size: 20,
    font: fontBold,
  });

  page.drawText(data.invoiceNumber, {
    x: width - 200,
    y: yPosition,
    size: 14,
    font: fontBold,
  });

  yPosition -= 25;

  // Dates
  page.drawText(`Date: ${formatDate(data.date)}`, {
    x: width - 200,
    y: yPosition,
    size: 10,
    font,
  });

  yPosition -= 15;

  page.drawText(`Due Date: ${formatDate(data.dueDate)}`, {
    x: width - 200,
    y: yPosition,
    size: 10,
    font,
  });

  yPosition -= 30;

  // Customer Details
  page.drawText('Bill To:', {
    x: 50,
    y: yPosition,
    size: 12,
    font: fontBold,
  });

  yPosition -= 20;

  page.drawText(data.customer.name, {
    x: 50,
    y: yPosition,
    size: 10,
    font,
  });

  yPosition -= 15;

  if (data.customer.email) {
    page.drawText(data.customer.email, {
      x: 50,
      y: yPosition,
      size: 10,
      font,
    });
    yPosition -= 15;
  }

  if (data.customer.phone) {
    page.drawText(data.customer.phone, {
      x: 50,
      y: yPosition,
      size: 10,
      font,
    });
    yPosition -= 15;
  }

  if (data.customer.address) {
    page.drawText(data.customer.address, {
      x: 50,
      y: yPosition,
      size: 10,
      font,
    });
    yPosition -= 15;
  }

  yPosition -= 20;

  // Service Info
  if (data.service) {
    page.drawText('Service Details:', {
      x: 50,
      y: yPosition,
      size: 12,
      font: fontBold,
    });
    yPosition -= 20;

    page.drawText(data.service.description, {
      x: 50,
      y: yPosition,
      size: 10,
      font,
    });
    yPosition -= 15;

    if (data.service.vehicleInfo) {
      page.drawText(`Vehicle: ${data.service.vehicleInfo}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font,
      });
      yPosition -= 15;
    }

    yPosition -= 20;
  }

  // Items Table Header
  page.drawRectangle({
    x: 50,
    y: yPosition - 15,
    width: width - 100,
    height: 20,
    color: rgb(0.914, 0.918, 0.961), // Light navy background
  });

  page.drawText('Description', {
    x: 60,
    y: yPosition - 10,
    size: 10,
    font: fontBold,
  });

  page.drawText('Qty', {
    x: 350,
    y: yPosition - 10,
    size: 10,
    font: fontBold,
  });

  page.drawText('Price', {
    x: 400,
    y: yPosition - 10,
    size: 10,
    font: fontBold,
  });

  page.drawText('Total', {
    x: 480,
    y: yPosition - 10,
    size: 10,
    font: fontBold,
  });

  yPosition -= 35;

  // Items
  for (const item of data.items) {
    page.drawText(item.description, {
      x: 60,
      y: yPosition,
      size: 10,
      font,
    });

    page.drawText(item.quantity.toString(), {
      x: 350,
      y: yPosition,
      size: 10,
      font,
    });

    page.drawText(formatCurrency(item.price), {
      x: 400,
      y: yPosition,
      size: 10,
      font,
    });

    page.drawText(formatCurrency(item.total), {
      x: 480,
      y: yPosition,
      size: 10,
      font,
    });

    yPosition -= 20;
  }

  yPosition -= 10;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  yPosition -= 25;

  // Totals
  page.drawText('Subtotal:', {
    x: 400,
    y: yPosition,
    size: 10,
    font: fontBold,
  });

  page.drawText(formatCurrency(data.subtotal), {
    x: 480,
    y: yPosition,
    size: 10,
    font,
  });

  yPosition -= 20;

  page.drawText('Tax:', {
    x: 400,
    y: yPosition,
    size: 10,
    font: fontBold,
  });

  page.drawText(formatCurrency(data.tax), {
    x: 480,
    y: yPosition,
    size: 10,
    font,
  });

  yPosition -= 20;

  page.drawText('TOTAL:', {
    x: 400,
    y: yPosition,
    size: 12,
    font: fontBold,
  });

  page.drawText(formatCurrency(data.total), {
    x: 480,
    y: yPosition,
    size: 12,
    font: fontBold,
    color: rgb(0.827, 0.184, 0.184), // Brand red for emphasis
  });

  // Notes
  if (data.notes) {
    yPosition -= 40;
    page.drawText('Notes:', {
      x: 50,
      y: yPosition,
      size: 10,
      font: fontBold,
    });

    yPosition -= 15;
    page.drawText(data.notes, {
      x: 50,
      y: yPosition,
      size: 9,
      font,
      maxWidth: width - 100,
    });
  }

  // Footer
  page.drawText('Thank you for your business!', {
    x: (width - 200) / 2,
    y: 50,
    size: 10,
    font: fontBold,
    color: rgb(0.102, 0.137, 0.494), // Brand navy
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Generate a professional Job Card PDF matching DK Executive Engineers format
 */
export async function generateJobCardPDF(data: JobCardData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  
  // Page 1 - Job Card Details
  const page1 = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page1.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 40;

  // Header - Company Logo Area (simulated with styled text)
  page1.drawRectangle({
    x: 0,
    y: y - 80,
    width: width,
    height: 100,
    color: rgb(0.102, 0.137, 0.494), // Brand navy background
  });

  page1.drawText('D.K EXECUTIVE ENGINEERS', {
    x: (width - 300) / 2,
    y: y - 30,
    size: 26,
    font: fontBold,
    color: rgb(1, 1, 1), // White text
  });

  page1.drawText('AUTOMOTIVE SERVICES & PROPERTY MANAGEMENT', {
    x: (width - 350) / 2,
    y: y - 50,
    size: 10,
    font,
    color: rgb(1, 1, 1),
  });

  page1.drawText('Pawpaw Street, East Legon, Accra | +233 XX XXX XXXX', {
    x: (width - 330) / 2,
    y: y - 68,
    size: 9,
    font,
    color: rgb(1, 1, 1),
  });

  y -= 110;

  // Job Card Title
  page1.drawRectangle({
    x: 50,
    y: y - 25,
    width: width - 100,
    height: 35,
    color: rgb(0.827, 0.184, 0.184), // Brand red background
  });

  page1.drawText('JOB CARD', {
    x: 60,
    y: y - 15,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page1.drawText(`No: ${data.jobCardNumber}`, {
    x: width - 200,
    y: y - 15,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  y -= 45;

  // Date
  page1.drawText(`Date: ${formatDate(data.date)}`, {
    x: width - 200,
    y: y,
    size: 10,
    font: fontBold,
  });

  if (data.estimatedCompletion) {
    y -= 15;
    page1.drawText(`Est. Completion: ${formatDate(data.estimatedCompletion)}`, {
      x: width - 200,
      y: y,
      size: 10,
      font,
    });
  }

  y -= 30;

  // Customer Information Section
  page1.drawRectangle({
    x: 50,
    y: y - 5,
    width: width - 100,
    height: 20,
    color: rgb(0.914, 0.918, 0.961), // Light navy
  });

  page1.drawText('CUSTOMER INFORMATION', {
    x: 60,
    y: y,
    size: 12,
    font: fontBold,
    color: rgb(0.102, 0.137, 0.494),
  });

  y -= 30;

  page1.drawText(`Name: ${data.customer.name}`, {
    x: 60,
    y: y,
    size: 10,
    font,
  });

  y -= 18;
  page1.drawText(`Phone: ${data.customer.phone}`, {
    x: 60,
    y: y,
    size: 10,
    font,
  });

  if (data.customer.email) {
    page1.drawText(`Email: ${data.customer.email}`, {
      x: 280,
      y: y,
      size: 10,
      font,
    });
  }

  y -= 30;

  // Vehicle Information Section
  page1.drawRectangle({
    x: 50,
    y: y - 5,
    width: width - 100,
    height: 20,
    color: rgb(0.914, 0.918, 0.961),
  });

  page1.drawText('VEHICLE INFORMATION', {
    x: 60,
    y: y,
    size: 12,
    font: fontBold,
    color: rgb(0.102, 0.137, 0.494),
  });

  y -= 30;

  page1.drawText(`Make: ${data.vehicle.make}`, {
    x: 60,
    y: y,
    size: 10,
    font,
  });

  page1.drawText(`Model: ${data.vehicle.model}`, {
    x: 220,
    y: y,
    size: 10,
    font,
  });

  if (data.vehicle.year) {
    page1.drawText(`Year: ${data.vehicle.year}`, {
      x: 380,
      y: y,
      size: 10,
      font,
    });
  }

  y -= 18;

  page1.drawText(`Registration: ${data.vehicle.registrationNumber}`, {
    x: 60,
    y: y,
    size: 10,
    font,
  });

  if (data.vehicle.mileage) {
    page1.drawText(`Mileage: ${data.vehicle.mileage}`, {
      x: 280,
      y: y,
      size: 10,
      font,
    });
  }

  y -= 30;

  // Service Requested Section
  page1.drawRectangle({
    x: 50,
    y: y - 5,
    width: width - 100,
    height: 20,
    color: rgb(0.914, 0.918, 0.961),
  });

  page1.drawText('SERVICE REQUESTED', {
    x: 60,
    y: y,
    size: 12,
    font: fontBold,
    color: rgb(0.102, 0.137, 0.494),
  });

  y -= 25;

  const serviceLines = wrapText(data.serviceRequested, 70);
  for (const line of serviceLines) {
    page1.drawText(line, {
      x: 60,
      y: y,
      size: 10,
      font,
    });
    y -= 15;
  }

  y -= 15;

  // Diagnosis Section
  if (data.diagnosis) {
    page1.drawRectangle({
      x: 50,
      y: y - 5,
      width: width - 100,
      height: 20,
      color: rgb(0.914, 0.918, 0.961),
    });

    page1.drawText('DIAGNOSIS', {
      x: 60,
      y: y,
      size: 12,
      font: fontBold,
      color: rgb(0.102, 0.137, 0.494),
    });

    y -= 25;

    const diagnosisLines = wrapText(data.diagnosis, 70);
    for (const line of diagnosisLines) {
      page1.drawText(line, {
        x: 60,
        y: y,
        size: 10,
        font,
      });
      y -= 15;
    }

    y -= 15;
  }

  // Work Performed Section
  if (data.workPerformed && data.workPerformed.length > 0) {
    page1.drawRectangle({
      x: 50,
      y: y - 5,
      width: width - 100,
      height: 20,
      color: rgb(0.914, 0.918, 0.961),
    });

    page1.drawText('WORK PERFORMED', {
      x: 60,
      y: y,
      size: 12,
      font: fontBold,
      color: rgb(0.102, 0.137, 0.494),
    });

    y -= 25;

    for (const work of data.workPerformed) {
      page1.drawText(`• ${work}`, {
        x: 60,
        y: y,
        size: 10,
        font,
      });
      y -= 15;
    }

    y -= 15;
  }

  // Continue on Page 2 if needed
  if (y < 150) {
    const page2 = pdfDoc.addPage([595, 842]);
    y = height - 50;

    // Page 2 Header
    page2.drawText(`Job Card No: ${data.jobCardNumber} (Continued)`, {
      x: 50,
      y: y,
      size: 12,
      font: fontBold,
      color: rgb(0.102, 0.137, 0.494),
    });

    y -= 40;

    // Parts Used Section
    if (data.partsUsed && data.partsUsed.length > 0) {
      page2.drawRectangle({
        x: 50,
        y: y - 5,
        width: width - 100,
        height: 20,
        color: rgb(0.914, 0.918, 0.961),
      });

      page2.drawText('PARTS USED', {
        x: 60,
        y: y,
        size: 12,
        font: fontBold,
        color: rgb(0.102, 0.137, 0.494),
      });

      y -= 30;

      // Table headers
      page2.drawText('Part Description', {
        x: 60,
        y: y,
        size: 9,
        font: fontBold,
      });

      page2.drawText('Qty', {
        x: 350,
        y: y,
        size: 9,
        font: fontBold,
      });

      page2.drawText('Unit Price', {
        x: 420,
        y: y,
        size: 9,
        font: fontBold,
      });

      y -= 20;

      let partsTotal = 0;
      for (const part of data.partsUsed) {
        const partTotal = part.quantity * part.unitPrice;
        partsTotal += partTotal;

        page2.drawText(part.name, {
          x: 60,
          y: y,
          size: 9,
          font,
        });

        page2.drawText(part.quantity.toString(), {
          x: 360,
          y: y,
          size: 9,
          font,
        });

        page2.drawText(formatCurrency(part.unitPrice), {
          x: 420,
          y: y,
          size: 9,
          font,
        });

        y -= 15;
      }

      y -= 10;
      page2.drawText(`Parts Total: ${formatCurrency(partsTotal)}`, {
        x: 370,
        y: y,
        size: 10,
        font: fontBold,
      });

      y -= 30;
    }

    // Labor Charges
    if (data.laborCharges !== undefined) {
      page2.drawText(`Labor Charges: ${formatCurrency(data.laborCharges)}`, {
        x: 370,
        y: y,
        size: 10,
        font: fontBold,
      });
      y -= 30;
    }

    // Recommendations
    if (data.recommendations) {
      page2.drawRectangle({
        x: 50,
        y: y - 5,
        width: width - 100,
        height: 20,
        color: rgb(0.914, 0.918, 0.961),
      });

      page2.drawText('RECOMMENDATIONS', {
        x: 60,
        y: y,
        size: 12,
        font: fontBold,
        color: rgb(0.102, 0.137, 0.494),
      });

      y -= 25;

      const recLines = wrapText(data.recommendations, 70);
      for (const line of recLines) {
        page2.drawText(line, {
          x: 60,
          y: y,
          size: 10,
          font,
        });
        y -= 15;
      }

      y -= 20;
    }

    // Signature Section
    y = Math.max(y, 150);
    page2.drawLine({
      start: { x: 50, y: y },
      end: { x: width - 50, y: y },
      thickness: 1,
      color: rgb(0.5, 0.5, 0.5),
    });

    y -= 40;

    page2.drawText('Technician:', {
      x: 60,
      y: y,
      size: 10,
      font: fontBold,
    });

    if (data.technicianName) {
      page2.drawText(data.technicianName, {
        x: 140,
        y: y,
        size: 10,
        font,
      });
    }

    page2.drawText('Customer Signature:', {
      x: 320,
      y: y,
      size: 10,
      font: fontBold,
    });

    page2.drawLine({
      start: { x: 440, y: y - 5 },
      end: { x: width - 60, y: y - 5 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Generate a professional Receipt PDF matching DK Executive Engineers format
 */
export async function generateReceiptPDF(data: InvoiceData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([420, 595]); // Compact receipt size
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 30;

  // Header with company branding
  page.drawRectangle({
    x: 0,
    y: y - 75,
    width: width,
    height: 85,
    color: rgb(0.102, 0.137, 0.494), // Brand navy
  });

  page.drawText('D.K EXECUTIVE', {
    x: (width - 150) / 2,
    y: y - 20,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('ENGINEERS', {
    x: (width - 120) / 2,
    y: y - 38,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('Pawpaw Street, East Legon', {
    x: (width - 160) / 2,
    y: y - 55,
    size: 9,
    font,
    color: rgb(1, 1, 1),
  });

  page.drawText('Accra, Ghana | +233 XX XXX XXXX', {
    x: (width - 190) / 2,
    y: y - 68,
    size: 9,
    font,
    color: rgb(1, 1, 1),
  });

  y -= 95;

  // Receipt Title
  page.drawRectangle({
    x: 20,
    y: y - 5,
    width: width - 40,
    height: 25,
    color: rgb(0.827, 0.184, 0.184), // Brand red
  });

  page.drawText('OFFICIAL RECEIPT', {
    x: (width - 130) / 2,
    y: y + 3,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  y -= 35;

  // Receipt Number and Date
  page.drawText(`Receipt No: ${data.invoiceNumber}`, {
    x: 30,
    y: y,
    size: 10,
    font: fontBold,
  });

  y -= 15;

  page.drawText(`Date: ${formatDate(data.date)}`, {
    x: 30,
    y: y,
    size: 9,
    font,
  });

  y -= 25;

  // Divider
  page.drawLine({
    start: { x: 20, y: y },
    end: { x: width - 20, y: y },
    thickness: 1,
    color: rgb(0.5, 0.5, 0.5),
  });

  y -= 20;

  // Customer Details
  page.drawText('RECEIVED FROM:', {
    x: 30,
    y: y,
    size: 9,
    font: fontBold,
  });

  y -= 15;

  page.drawText(data.customer.name, {
    x: 30,
    y: y,
    size: 10,
    font,
  });

  y -= 13;

  if (data.customer.phone) {
    page.drawText(data.customer.phone, {
      x: 30,
      y: y,
      size: 9,
      font,
    });
    y -= 13;
  }

  y -= 10;

  // Service Description
  if (data.service) {
    page.drawText('FOR:', {
      x: 30,
      y: y,
      size: 9,
      font: fontBold,
    });

    y -= 15;

    const serviceLines = wrapText(data.service.description, 50);
    for (const line of serviceLines) {
      page.drawText(line, {
        x: 30,
        y: y,
        size: 9,
        font,
      });
      y -= 13;
    }

    if (data.service.vehicleInfo) {
      y -= 5;
      page.drawText(`Vehicle: ${data.service.vehicleInfo}`, {
        x: 30,
        y: y,
        size: 8,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      y -= 15;
    }
  }

  y -= 10;

  // Items Table
  page.drawRectangle({
    x: 20,
    y: y - 15,
    width: width - 40,
    height: 18,
    color: rgb(0.914, 0.918, 0.961), // Light navy
  });

  page.drawText('Description', {
    x: 25,
    y: y - 10,
    size: 8,
    font: fontBold,
  });

  page.drawText('Qty', {
    x: 240,
    y: y - 10,
    size: 8,
    font: fontBold,
  });

  page.drawText('Price', {
    x: 280,
    y: y - 10,
    size: 8,
    font: fontBold,
  });

  page.drawText('Total', {
    x: 340,
    y: y - 10,
    size: 8,
    font: fontBold,
  });

  y -= 30;

  // Line Items
  for (const item of data.items) {
    const desc = item.description.length > 30 ? item.description.substring(0, 27) + '...' : item.description;
    
    page.drawText(desc, {
      x: 25,
      y: y,
      size: 8,
      font,
    });

    page.drawText(item.quantity.toString(), {
      x: 245,
      y: y,
      size: 8,
      font,
    });

    page.drawText(formatCurrency(item.price), {
      x: 280,
      y: y,
      size: 8,
      font,
    });

    page.drawText(formatCurrency(item.total), {
      x: 340,
      y: y,
      size: 8,
      font,
    });

    y -= 15;
  }

  y -= 10;

  // Totals Section
  page.drawLine({
    start: { x: 20, y: y },
    end: { x: width - 20, y: y },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  y -= 20;

  page.drawText('Subtotal:', {
    x: 270,
    y: y,
    size: 9,
    font,
  });

  page.drawText(formatCurrency(data.subtotal), {
    x: 340,
    y: y,
    size: 9,
    font,
  });

  y -= 15;

  page.drawText('Tax:', {
    x: 270,
    y: y,
    size: 9,
    font,
  });

  page.drawText(formatCurrency(data.tax), {
    x: 340,
    y: y,
    size: 9,
    font,
  });

  y -= 20;

  // Total with emphasis
  page.drawRectangle({
    x: 250,
    y: y - 5,
    width: width - 270,
    height: 20,
    color: rgb(0.827, 0.184, 0.184), // Brand red
  });

  page.drawText('TOTAL:', {
    x: 260,
    y: y + 2,
    size: 11,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(formatCurrency(data.total), {
    x: 340,
    y: y + 2,
    size: 11,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  y -= 30;

  // Payment Note
  if (data.notes) {
    const noteLines = wrapText(data.notes, 50);
    for (const line of noteLines) {
      page.drawText(line, {
        x: 30,
        y: y,
        size: 8,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      y -= 12;
    }
    y -= 10;
  }

  // Footer
  y = Math.max(y, 70);

  page.drawLine({
    start: { x: 20, y: y },
    end: { x: width - 20, y: y },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });

  y -= 20;

  page.drawText('Thank you for your business!', {
    x: (width - 170) / 2,
    y: y,
    size: 10,
    font: fontBold,
    color: rgb(0.102, 0.137, 0.494),
  });

  y -= 15;

  page.drawText('info@dkengineers.com | www.dkengineers.com', {
    x: (width - 210) / 2,
    y: y,
    size: 7,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Helper function to wrap text to fit width
 */
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length <= maxChars) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

