import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRedis } from '@/lib/redis';
import { getRateLimitMemoryMetrics } from '@/lib/rate-limit';

// Basic Prometheus-style metrics endpoint.
// Adds database-derived gauges/counters and Redis counters (fallback to memory).

export async function GET() {
  try {
    const redis = getRedis();
    // Export counts from DB (may be slow if tables huge; acceptable initial approach)
    const [exportsTotal, jobsPending] = await Promise.all([
      prisma.exportLog.count(),
      prisma.exportJob.count({ where: { status: 'PENDING' as any } }),
    ]);

    let rateAllowed = 0;
    let rateBlocked = 0;
    if (redis) {
      const allowedStr = await redis.get('metrics:rate_limit_allowed_total');
      const blockedStr = await redis.get('metrics:rate_limit_blocked_total');
      rateAllowed = Number(allowedStr || '0');
      rateBlocked = Number(blockedStr || '0');
    } else {
      const m = getRateLimitMemoryMetrics();
      rateAllowed = m.rateLimitAllowed;
      rateBlocked = m.rateLimitBlocked;
    }

    const lines: string[] = [];
    lines.push('# HELP dkee_exports_total Total number of export operations logged');
    lines.push('# TYPE dkee_exports_total counter');
    lines.push(`dkee_exports_total ${exportsTotal}`);

    lines.push('# HELP dkee_export_jobs_pending Number of export jobs pending processing');
    lines.push('# TYPE dkee_export_jobs_pending gauge');
    lines.push(`dkee_export_jobs_pending ${jobsPending}`);

    lines.push('# HELP dkee_rate_limit_allowed_total Total allowed requests through rate limiter');
    lines.push('# TYPE dkee_rate_limit_allowed_total counter');
    lines.push(`dkee_rate_limit_allowed_total ${rateAllowed}`);

    lines.push('# HELP dkee_rate_limit_blocked_total Total blocked requests by rate limiter');
    lines.push('# TYPE dkee_rate_limit_blocked_total counter');
    lines.push(`dkee_rate_limit_blocked_total ${rateBlocked}`);

    // Basic process metrics
    lines.push('# HELP dkee_process_start_time Unix timestamp when process metrics first emitted');
    lines.push('# TYPE dkee_process_start_time gauge');
    const uptime = typeof process?.uptime === 'function' ? process.uptime() : 0;
    lines.push(`dkee_process_start_time ${Math.floor(uptime ? Date.now()/1000 - uptime : Date.now()/1000)}`);

    const body = lines.join('\n') + '\n';
    return new NextResponse(body, { status: 200, headers: { 'Content-Type': 'text/plain; version=0.0.4' } });
  } catch (e: any) {
    return new NextResponse(`# Metrics error: ${e.message}\n`, { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }
}