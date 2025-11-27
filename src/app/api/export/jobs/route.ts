import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Helper to create a signed token and URL matching /api/export/sign behavior
function buildSignedUrl(params: {
  userId: string;
  type: string;
  format?: string;
  startDate?: string | null;
  endDate?: string | null;
  columns?: string[] | null;
  stream?: boolean;
  expiresInSeconds?: number;
}) {
  const {
    userId,
    type,
    format = 'csv',
    startDate = null,
    endDate = null,
    columns = null,
    stream = true,
    expiresInSeconds = 900,
  } = params;

  const payload = {
    t: type,
    f: format,
    sd: startDate,
    ed: endDate,
    c: columns,
    s: !!stream,
    uid: userId,
    exp: Date.now() + Math.max(60, Math.min(3600, Number(expiresInSeconds))) * 1000,
  };
  const secret = process.env.EXPORT_SECRET || process.env.NEXTAUTH_SECRET || 'export-secret';
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const sig = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
  const token = `${payloadB64}.${sig}`;

  const qs = new URLSearchParams();
  qs.set('type', payload.t);
  qs.set('format', payload.f);
  if (payload.sd) qs.set('startDate', payload.sd);
  if (payload.ed) qs.set('endDate', payload.ed);
  if (payload.c) qs.set('columns', (payload.c as string[]).join(','));
  if (payload.s) qs.set('stream', 'true');
  qs.set('token', token);
  return { token, url: `/api/export?${qs.toString()}` };
}

// POST /api/export/jobs -> queue an export job (processed immediately for now)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { type, format = 'csv', startDate, endDate, columns, stream = true } = body || {};
    if (!type) return NextResponse.json({ error: 'type required' }, { status: 400 });

    // Create PENDING job record
    const job = await prisma.exportJob.create({
      data: {
        userId: session.user.id,
        type,
        format,
        params: JSON.stringify({ startDate, endDate, columns, stream }),
        status: 'PENDING',
      },
    });

    // Process immediately (synchronous background-lite)
    const { token, url } = buildSignedUrl({
      userId: session.user.id,
      type,
      format,
      startDate: startDate || null,
      endDate: endDate || null,
      columns: Array.isArray(columns) ? columns : null,
      stream: !!stream,
    });

    await prisma.exportJob.update({
      where: { id: job.id },
      data: { status: 'DONE', token },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: 'Export Ready',
        message: `${type.toUpperCase()} export is ready for download`,
        type: 'SUCCESS',
        link: url,
      },
    });

    return NextResponse.json({ jobId: job.id, status: 'DONE', url });
  } catch (e: any) {
    console.error('POST /api/export/jobs error', e);
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}

// GET /api/export/jobs -> list current user's recent jobs
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const jobs = await prisma.exportJob.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 25,
      select: { id: true, type: true, format: true, status: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json({ jobs });
  } catch (e: any) {
    console.error('GET /api/export/jobs error', e);
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
