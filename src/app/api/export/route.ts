import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { createGzip } from 'zlib';
import { Readable } from 'stream';
import crypto from 'crypto';
import { rateLimit } from '@/lib/rate-limit';

async function buildPDF(title: string, headers: string[], rows: string[][], summary?: Record<string,string>) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const margin = 40;
  const rowHeight = 16;
  const headerHeight = 20;
  const pageWidth = 612; // Letter width
  const usableWidth = pageWidth - margin * 2;
  const colWidth = usableWidth / Math.max(1, headers.length);
  let page = pdf.addPage();
  let y = page.getHeight() - margin;

  const drawTableHeader = (continuation: boolean) => {
    page.drawText(title + (continuation ? ' (cont.)' : ''), { x: margin, y, size: continuation ? 14 : 16, font: bold });
    y -= 26;
    headers.forEach((h, i) => {
      const x = margin + i * colWidth;
      page.drawText(h, { x, y, size: 10, font: bold, maxWidth: colWidth - 4 });
    });
    y -= headerHeight - 6;
  };

  drawTableHeader(false);

  const drawRow = (row: string[]) => {
    if (y < margin + rowHeight) {
      page = pdf.addPage();
      y = page.getHeight() - margin;
      drawTableHeader(true);
    }
    row.forEach((cell, i) => {
      const x = margin + i * colWidth;
      const text = (cell || '').toString();
      page.drawText(text.length > 110 ? text.slice(0,107) + '…' : text, { x, y, size: 9, font, maxWidth: colWidth - 4 });
    });
    y -= rowHeight;
  };

  rows.forEach(r => drawRow(r));

  if (summary) {
    if (y < margin + 60) {
      page = pdf.addPage();
      y = page.getHeight() - margin;
      drawTableHeader(true);
    }
    y -= 10;
    page.drawText('Summary', { x: margin, y, size: 14, font: bold });
    y -= 20;
    Object.entries(summary).forEach(([k,v]) => {
      if (y < margin + 24) {
        page = pdf.addPage();
        y = page.getHeight() - margin;
        drawTableHeader(true);
        page.drawText('Summary (cont.)', { x: margin, y, size: 14, font: bold });
        y -= 20;
      }
      page.drawText(`${k}: ${v}`, { x: margin, y, size: 10, font });
      y -= 14;
    });
  }

  return Buffer.from(await pdf.save());
}

function toCSV(headers: string[], rows: string[][]) {
  const esc = (s: string) => '"' + s.replace(/"/g,'""') + '"';
  return [headers.join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
}

// GET /api/export?type=services|invoices|customers|vehicles|properties&format=csv|pdf&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&stream=true
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    // Access control with optional signed token bypass
    const role = session?.user?.role;
    const allowByRole: Record<string, string[]> = {
      ADMIN: ['services','invoices','customers','vehicles','properties','inquiries','emergencies','payments','staff','messages'],
      CEO: ['services','invoices','customers','vehicles','properties','inquiries','emergencies','payments','staff','messages'],
      MANAGER: ['services','invoices','customers','vehicles','properties','inquiries','emergencies','payments','staff','messages'],
      STAFF_AUTO: ['services','invoices','customers','vehicles','emergencies','payments','messages'],
      STAFF_PROPERTY: ['properties','customers','inquiries','invoices','payments','messages'],
      HR: ['staff'],
      CUSTOMER: [],
    };

    const verifyToken = (t: string) => {
      try {
        const secret = process.env.EXPORT_SECRET || process.env.NEXTAUTH_SECRET || 'export-secret';
        const [payloadB64, sig] = t.split('.');
        const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf-8'));
        const expected = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
        if (sig !== expected) return null;
        if (payload.exp && Date.now() > payload.exp) return null;
        return payload;
      } catch { return null; }
    };

    const signed = token ? verifyToken(token) : null;
    // Rate limiting (Redis-backed fallback to memory)
    const key = (session?.user?.id || signed?.uid || req.headers.get('x-forwarded-for') || 'anon') as string;
    const rl = await rateLimit(`export:${key}`, 20, 60);
    if (!rl.allowed) {
      return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': '60' } });
    }
    if (!signed) {
      if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const type = searchParams.get('type') || 'services';
    const format = searchParams.get('format') || 'csv';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const stream = searchParams.get('stream') === 'true';
    const acceptEncoding = (req.headers.get('accept-encoding') || '').toLowerCase();
    const useGzip = stream && acceptEncoding.includes('gzip');
    const columnsParam = searchParams.get('columns');
    const selectedColumns = columnsParam ? columnsParam.split(',') : null;
    const locale = searchParams.get('locale') || 'en-US';
    const currency = searchParams.get('currency') || 'USD';
    const numberFmt = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 });
    const dateFmt = new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' });

    // Enforce role-based allowed types unless signed token present
    if (!signed && session?.user?.role) {
      const allowed = allowByRole[session.user.role] || [];
      if (!allowed.includes(type)) {
        return NextResponse.json({ error: 'Forbidden: export type not allowed' }, { status: 403 });
      }
    }

    let dateFilter: any = {};
    if (startDateParam) {
      const sd = new Date(startDateParam);
      if (!isNaN(sd.getTime())) dateFilter.gte = sd;
    }
    if (endDateParam) {
      const ed = new Date(endDateParam);
      if (!isNaN(ed.getTime())) dateFilter.lte = new Date(ed.getTime() + 24*60*60*1000 - 1); // end of day
    }
    const createdAtFilter = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    let headers: string[] = [];
    let objRows: Array<Record<string, string>> = [];

    if (type === 'services') {
      headers = ['ID','Type','Status','Customer','Created'];
      const data = await prisma.automotiveService.findMany({
        include: { customer: { include: { user: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
        where: { ...createdAtFilter },
        take: stream ? 2000 : 500,
      });
      objRows = data.map(d => ({
        ID: d.id,
        Type: d.serviceType,
        Status: d.status,
        Customer: d.customer.user.name,
        Created: d.createdAt.toISOString(),
      }));
    } else if (type === 'invoices') {
      headers = ['Number','Customer','Status','Total','Paid','DueDate'];
      const data = await prisma.invoice.findMany({
        include: { customer: { include: { user: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
        where: { ...createdAtFilter },
        take: stream ? 2000 : 500,
      });
      objRows = data.map(d => ({
        Number: d.invoiceNumber,
        Customer: d.customer.user.name,
        Status: d.paymentStatus,
        Total: d.total.toFixed(2),
        Paid: d.amountPaid.toFixed(2),
        DueDate: d.dueDate.toISOString().slice(0,10),
      }));
    } else if (type === 'customers') {
      headers = ['Name','Email','Phone','Created'];
      const data = await prisma.customer.findMany({
        include: { user: { select: { name: true, email: true, phone: true, createdAt: true } } },
        orderBy: { createdAt: 'desc' },
        where: { ...createdAtFilter },
        take: stream ? 2000 : 500,
      });
      objRows = data.map(d => ({
        Name: d.user.name,
        Email: d.user.email,
        Phone: d.user.phone || '',
        Created: d.user.createdAt.toISOString().slice(0,10),
      }));
    } else if (type === 'vehicles') {
      headers = ['ID','Make','Model','Year','LicensePlate','Customer','Created'];
      const data = await prisma.vehicle.findMany({
        include: { customer: { include: { user: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
        where: { ...createdAtFilter },
        take: stream ? 2000 : 500,
      });
      objRows = data.map(d => ({
        ID: d.id,
        Make: d.make,
        Model: d.model,
        Year: String(d.year),
        LicensePlate: d.licensePlate || '',
        Customer: d.customer.user.name,
        Created: dateFmt.format(d.createdAt),
      }));
    } else if (type === 'properties') {
      headers = ['ID','Title','Type','Status','City','Price','ListedBy','Created'];
      const data = await prisma.property.findMany({
        include: { listedBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        where: { ...createdAtFilter },
        take: stream ? 2000 : 500,
      });
      objRows = data.map(d => ({
        ID: d.id,
        Title: d.title,
        Type: d.propertyType,
        Status: d.status,
        City: d.city,
        Price: d.price.toFixed(2),
        ListedBy: d.listedBy.name,
        Created: d.createdAt.toISOString(),
      }));
    } else if (type === 'inquiries') {
      headers = ['ID','Property','Customer','Email','Phone','Message','Status','Created'];
      const data = await prisma.propertyInquiry.findMany({
        include: {
          property: true,
          customer: { include: { user: { select: { name: true, email: true, phone: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        where: { ...createdAtFilter },
        take: stream ? 2000 : 500,
      });
      objRows = data.map(d => ({
        ID: d.id,
        Property: d.property.title,
        Customer: d.customer.user.name,
        Email: d.customer.user.email,
        Phone: d.customer.user.phone || '',
        Message: d.message,
        Status: d.status,
        Created: d.createdAt.toISOString(),
      }));
    } else if (type === 'emergencies') {
      headers = ['ID','Title','User','Phone','Status','Priority','Location','ResolvedAt','Created'];
      const data = await prisma.emergencyRequest.findMany({
        include: { user: { select: { name: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        where: { ...createdAtFilter },
        take: stream ? 2000 : 500,
      });
      objRows = data.map(d => ({
        ID: d.id,
        Title: d.title,
        User: d.user.name,
        Phone: d.user.phone || '',
        Status: d.status,
        Priority: d.priority,
        Location: d.location || '',
        ResolvedAt: d.resolvedAt ? d.resolvedAt.toISOString() : '',
        Created: d.createdAt.toISOString(),
      }));
    } else if (type === 'payments') {
      headers = ['ID','Invoice','Customer','Amount','Method','Reference','RecordedBy','Date'];
      const data: any[] = await (prisma as any).payment.findMany({
        include: {
          invoice: {
            include: { customer: { include: { user: { select: { name: true } } } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        where: { ...createdAtFilter },
        take: stream ? 2000 : 2000,
      });
      objRows = (data as any[]).map((d: any) => ({
        ID: d.id,
        Invoice: d.invoice?.invoiceNumber || '',
        Customer: d.invoice?.customer?.user?.name || '',
        Amount: d.amount.toFixed(2),
        Method: d.method,
        Reference: d.reference || '',
        RecordedBy: d.recordedBy || '',
        Date: d.createdAt.toISOString(),
      }));
    } else if (type === 'staff') {
      headers = ['Name','Email','Phone','Role','Created'];
      const data = await prisma.user.findMany({
        where: { NOT: { role: 'CUSTOMER' as any } },
        orderBy: { createdAt: 'desc' },
        take: stream ? 2000 : 1000,
      });
      objRows = data.map(d => ({
        Name: d.name,
        Email: d.email,
        Phone: d.phone || '',
        Role: d.role as unknown as string,
        Created: (d as any).createdAt?.toISOString?.() || '',
      }));
    } else if (type === 'messages') {
      headers = ['ID','Subject','Sender','Recipient','IsRead','Created'];
      const data: any[] = await (prisma as any).message.findMany({
        include: {
          user: { select: { name: true } },
          recipient: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        where: { ...createdAtFilter },
        take: stream ? 2000 : 1000,
      });
      objRows = (data as any[]).map((d: any) => ({
        ID: d.id,
        Subject: d.subject,
        Sender: d.user?.name || d.userId || '',
        Recipient: d.recipient?.name || d.recipientId || '',
        IsRead: d.isRead ? 'Yes' : 'No',
        Created: (d as any).createdAt?.toISOString?.() || '',
      }));
    } else {
      return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
    }

    const originalHeaders = [...headers];
    let skipped = 0;
    let rows: string[][] = [];
    if (!stream) {
      rows = objRows.map(rowObj => {
        try {
          return originalHeaders.map(h => (rowObj[h] ?? ''));
        } catch {
          skipped++;
          return originalHeaders.map(() => '');
        }
      });
      if (selectedColumns && selectedColumns.length) {
        headers = originalHeaders.filter(h => selectedColumns.includes(h));
        rows = rows.map(rowArr => headers.map(h => rowArr[originalHeaders.indexOf(h)] ?? ''));
      }
    }

    // Audit log (fire-and-forget)
    try {
      const userId = session?.user?.id || signed?.uid || 'anon';
      await (prisma as any).exportLog.create({
        data: {
          userId,
          type,
          format,
          filters: JSON.stringify({ startDate: startDateParam, endDate: endDateParam, columns: selectedColumns, stream, token: !!token }),
        },
      });
    } catch {}

    if (format === 'csv') {
      if (stream) {
        // Cursor-based pagination streaming
        const batchSize = 500;
        const encoder = new TextEncoder();
        let lastId: string | null = null;
        let firstChunk = true;
        // Build a function to fetch a batch per type
        const fetchBatch = async () => {
          if (type === 'services') {
            const data = await prisma.automotiveService.findMany({
              include: { customer: { include: { user: { select: { name: true } } } } },
              where: { ...createdAtFilter },
              orderBy: { id: 'asc' },
              ...(lastId ? { cursor: { id: lastId }, skip: 1 } : {}),
              take: batchSize,
            });
            return data.map(d => ({
              ID: d.id,
              Type: d.serviceType,
              Status: d.status,
              Customer: d.customer.user.name,
              Created: d.createdAt.toISOString(),
            }));
          } else if (type === 'invoices') {
            const data = await prisma.invoice.findMany({
              include: { customer: { include: { user: { select: { name: true } } } } },
              where: { ...createdAtFilter },
              orderBy: { id: 'asc' },
              ...(lastId ? { cursor: { id: lastId }, skip: 1 } : {}),
              take: batchSize,
            });
            return data.map(d => ({
              Number: d.invoiceNumber,
              Customer: d.customer.user.name,
              Status: d.paymentStatus,
              Total: numberFmt.format(d.total),
              Paid: numberFmt.format(d.amountPaid),
              DueDate: dateFmt.format(d.dueDate),
            }));
          } else if (type === 'customers') {
            const data = await prisma.customer.findMany({
              include: { user: { select: { name: true, email: true, phone: true, createdAt: true } } },
              where: { ...createdAtFilter },
              orderBy: { id: 'asc' },
              ...(lastId ? { cursor: { id: lastId }, skip: 1 } : {}),
              take: batchSize,
            });
            return data.map(d => ({
              Name: d.user.name,
              Email: d.user.email,
              Phone: d.user.phone || '',
              Created: dateFmt.format(d.user.createdAt),
            }));
          } else if (type === 'vehicles') {
            const data = await prisma.vehicle.findMany({
              include: { customer: { include: { user: { select: { name: true } } } } },
              where: { ...createdAtFilter },
              orderBy: { id: 'asc' },
              ...(lastId ? { cursor: { id: lastId }, skip: 1 } : {}),
              take: batchSize,
            });
            return data.map(d => ({
              ID: d.id,
              Make: d.make,
              Model: d.model,
              Year: String(d.year),
              LicensePlate: d.licensePlate || '',
              Customer: d.customer.user.name,
              Created: dateFmt.format(d.createdAt),
            }));
          } else if (type === 'properties') {
            const data = await prisma.property.findMany({
              include: { listedBy: { select: { name: true } } },
              where: { ...createdAtFilter },
              orderBy: { id: 'asc' },
              ...(lastId ? { cursor: { id: lastId }, skip: 1 } : {}),
              take: batchSize,
            });
            return data.map(d => ({
              ID: d.id,
              Title: d.title,
              Type: d.propertyType,
              Status: d.status,
              City: d.city,
              Price: numberFmt.format(d.price),
              ListedBy: d.listedBy.name,
              Created: dateFmt.format(d.createdAt),
            }));
          } else if (type === 'inquiries') {
            const data = await prisma.propertyInquiry.findMany({
              include: { property: true, customer: { include: { user: { select: { name: true, email: true, phone: true } } } } },
              where: { ...createdAtFilter },
              orderBy: { id: 'asc' },
              ...(lastId ? { cursor: { id: lastId }, skip: 1 } : {}),
              take: batchSize,
            });
            return data.map(d => ({
              ID: d.id,
              Property: d.property.title,
              Customer: d.customer.user.name,
              Email: d.customer.user.email,
              Phone: d.customer.user.phone || '',
              Message: d.message,
              Status: d.status,
              Created: d.createdAt.toISOString(),
            }));
          } else if (type === 'emergencies') {
            const data = await prisma.emergencyRequest.findMany({
              include: { user: { select: { name: true, phone: true } } },
              where: { ...createdAtFilter },
              orderBy: { id: 'asc' },
              ...(lastId ? { cursor: { id: lastId }, skip: 1 } : {}),
              take: batchSize,
            });
            return data.map(d => ({
              ID: d.id,
              Title: d.title,
              User: d.user.name,
              Phone: d.user.phone || '',
              Status: d.status,
              Priority: d.priority,
              Location: d.location || '',
              ResolvedAt: d.resolvedAt ? dateFmt.format(d.resolvedAt) : '',
              Created: d.createdAt.toISOString(),
            }));
          } else if (type === 'payments') {
            const data: any[] = await (prisma as any).payment.findMany({
              include: { invoice: { include: { customer: { include: { user: { select: { name: true } } } } } } },
              where: { ...createdAtFilter },
              orderBy: { id: 'asc' },
              ...(lastId ? { cursor: { id: lastId }, skip: 1 } : {}),
              take: batchSize,
            });
            return data.map((d: any) => ({
              ID: d.id,
              Invoice: d.invoice?.invoiceNumber || '',
              Customer: d.invoice?.customer?.user?.name || '',
              Amount: numberFmt.format(d.amount),
              Method: d.method,
              Reference: d.reference || '',
              RecordedBy: d.recordedBy || '',
              Date: dateFmt.format(d.createdAt),
            }));
          } else if (type === 'staff') {
            const data = await prisma.user.findMany({
              where: { NOT: { role: 'CUSTOMER' as any } },
              orderBy: { id: 'asc' },
              ...(lastId ? { cursor: { id: lastId }, skip: 1 } : {}),
              take: batchSize,
            });
            return data.map(d => ({
              Name: d.name,
              Email: d.email,
              Phone: d.phone || '',
              Role: d.role as unknown as string,
              Created: d.createdAt ? dateFmt.format(d.createdAt as any) : '',
            }));
          } else if (type === 'messages') {
            const data: any[] = await (prisma as any).message.findMany({
              include: { user: { select: { name: true } }, recipient: { select: { name: true } } },
              where: { ...createdAtFilter },
              orderBy: { id: 'asc' },
              ...(lastId ? { cursor: { id: lastId }, skip: 1 } : {}),
              take: batchSize,
            });
            return data.map((d: any) => ({
              ID: d.id,
              Subject: d.subject,
              Sender: d.user?.name || d.userId || '',
              Recipient: d.recipient?.name || d.recipientId || '',
              IsRead: d.isRead ? 'Yes' : 'No',
              Created: d.createdAt ? dateFmt.format(d.createdAt as any) : '',
            }));
          }
          return [] as Array<Record<string,string>>;
        };

        const streamBody = new ReadableStream({
          async pull(controller) {
            if (firstChunk) {
              // Adjust headers for selected columns
              let hdrs = originalHeaders;
              if (selectedColumns && selectedColumns.length) {
                hdrs = originalHeaders.filter(h => selectedColumns.includes(h));
                headers = hdrs; // mutate for response headers if needed later
              }
              controller.enqueue(encoder.encode(hdrs.join(',') + '\n'));
              firstChunk = false;
            }
            const batch = await fetchBatch();
            if (!batch.length) {
              controller.close();
              return;
            }
            for (const rowObj of batch) {
              try {
                const hdrs = selectedColumns && selectedColumns.length ? headers : originalHeaders;
                const arr = hdrs.map(h => (rowObj as Record<string, any>)[h] ?? '');
                controller.enqueue(encoder.encode(arr.map(v => '"' + v.replace(/"/g,'""') + '"').join(',') + '\n'));
              } catch {
                skipped++;
              }
            }
            // Update cursor
            lastId = (batch[batch.length - 1] as any).ID || (batch[batch.length - 1] as any).Number || null;
          }
        });

        if (useGzip) {
          // Convert web stream to Node readable then gzip then back to web
          const nodeReadable = Readable.from(streamBody as any);
          const gzip = createGzip();
          const zipped = nodeReadable.pipe(gzip);
          const webReadable = (zipped as any).toWeb ? (zipped as any).toWeb() : zipped; // fallback
          return new NextResponse(webReadable as any, {
            status: 200,
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename=${type}-export.csv`,
              'Content-Encoding': 'gzip',
            },
          });
        }

        return new NextResponse(streamBody, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename=${type}-export.csv`,
          },
        });
      }
      const csv = toCSV(headers, rows);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=${type}-export.csv`,
          ...(skipped ? { 'X-Export-Skipped': String(skipped) } : {}),
        },
      });
    } else if (format === 'pdf') {
      const summary: Record<string,string> = {
        Rows: String(stream ? 'Streaming' : rows.length),
        GeneratedAt: new Date().toISOString(),
        RangeStart: startDateParam || '—',
        RangeEnd: endDateParam || '—',
        Locale: locale,
      };
      if (type === 'invoices') {
        const totals = objRows.reduce((acc,r) => {
          const t = r.Total ? Number(r.Total.replace(/[^0-9.\-]/g,'')) : 0;
          const p = r.Paid ? Number(r.Paid.replace(/[^0-9.\-]/g,'')) : 0;
          acc.total += t; acc.paid += p; return acc;
        }, { total: 0, paid: 0 });
        summary['Invoice Total'] = numberFmt.format(totals.total);
        summary['Invoice Paid'] = numberFmt.format(totals.paid);
      }
      if (type === 'payments') {
        const total = objRows.reduce((acc,r) => acc + (r.Amount ? Number(r.Amount.replace(/[^0-9.\-]/g,'')) : 0), 0);
        summary['Payments Sum'] = numberFmt.format(total);
      }
      const pdfBuffer = await buildPDF(`${type.toUpperCase()} Export`, headers, stream ? [] : rows, summary);
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=${type}-export.pdf`,
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
  } catch (e: any) {
    console.error('GET /api/export error', e);
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
