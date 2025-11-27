import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import crypto from 'crypto';

// POST /api/export/sign - returns a signed token + URL for background/signed download
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { type, format = 'csv', startDate, endDate, columns, stream = true, expiresInSeconds = 900 } = body || {};
    if (!type) return NextResponse.json({ error: 'type required' }, { status: 400 });

    const payload = {
      t: type,
      f: format,
      sd: startDate || null,
      ed: endDate || null,
      c: Array.isArray(columns) ? columns : null,
      s: !!stream,
      uid: session.user.id,
      exp: Date.now() + Math.max(60, Math.min(3600, Number(expiresInSeconds))) * 1000,
    };

    const secret = process.env.EXPORT_SECRET || process.env.NEXTAUTH_SECRET || 'export-secret';
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64');
    const sig = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
    const token = `${payloadB64}.${sig}`;

    const params = new URLSearchParams();
    params.set('type', payload.t);
    params.set('format', payload.f);
    if (payload.sd) params.set('startDate', payload.sd);
    if (payload.ed) params.set('endDate', payload.ed);
    if (payload.c) params.set('columns', (payload.c as string[]).join(','));
    if (payload.s) params.set('stream', 'true');
    params.set('token', token);

    return NextResponse.json({ token, url: `/api/export?${params.toString()}` });
  } catch (e: any) {
    console.error('POST /api/export/sign error', e);
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
