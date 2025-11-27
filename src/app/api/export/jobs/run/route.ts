import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

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

// POST /api/export/jobs/run -> process the next pending job (admin or manager only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const role = session.user.role as string;
    const allowed = ['ADMIN', 'CEO', 'MANAGER'];
    if (!allowed.includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const job = await prisma.exportJob.findFirst({ where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' } });
    if (!job) return NextResponse.json({ message: 'No pending jobs' }, { status: 200 });

    const params = (() => { try { return JSON.parse(job.params || '{}'); } catch { return {}; } })() as any;
    const { token, url } = buildSignedUrl({
      userId: job.userId,
      type: job.type,
      format: job.format,
      startDate: params.startDate || null,
      endDate: params.endDate || null,
      columns: Array.isArray(params.columns) ? params.columns : null,
      stream: !!params.stream,
    });

    await prisma.exportJob.update({ where: { id: job.id }, data: { status: 'DONE', token } });
    await prisma.notification.create({
      data: {
        userId: job.userId,
        title: 'Export Ready',
        message: `${job.type.toUpperCase()} export is ready for download`,
        type: 'SUCCESS',
        link: url,
      },
    });

    return NextResponse.json({ jobId: job.id, status: 'DONE', url });
  } catch (e: any) {
    console.error('POST /api/export/jobs/run error', e);
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
