import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Simple DB ping: lightweight query
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', db: 'up', time: new Date().toISOString() });
  } catch (e: any) {
    return NextResponse.json({ status: 'degraded', error: e.message }, { status: 500 });
  }
}
