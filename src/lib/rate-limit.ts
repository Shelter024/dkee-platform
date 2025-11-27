import { getRedis } from './redis';

interface RateResult {
  allowed: boolean;
  remaining: number;
}

const memoryBuckets = new Map<string, { count: number; reset: number }>();
// In-memory counters for metrics fallback when Redis unavailable
const memoryMetrics = {
  rateLimitAllowed: 0,
  rateLimitBlocked: 0,
};

export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateResult> {
  const redis = getRedis();
  const now = Date.now();
  if (redis) {
    const windowKey = `rl:${key}:${Math.floor(now / (windowSeconds * 1000))}`;
    const current = await redis.incr(windowKey);
    if (current === 1) {
      await redis.expire(windowKey, windowSeconds);
    }
    const allowed = current <= limit;
    // Increment metrics counters
    await redis.incr(allowed ? 'metrics:rate_limit_allowed_total' : 'metrics:rate_limit_blocked_total');
    return { allowed, remaining: Math.max(0, limit - current) };
  }
  // Fallback memory
  const bucket = memoryBuckets.get(key);
  if (!bucket || now > bucket.reset) {
    memoryBuckets.set(key, { count: 1, reset: now + windowSeconds * 1000 });
    return { allowed: true, remaining: limit - 1 };
  }
  if (bucket.count >= limit) {
    memoryMetrics.rateLimitBlocked += 1;
    return { allowed: false, remaining: 0 };
  }
  bucket.count += 1;
  memoryMetrics.rateLimitAllowed += 1;
  return { allowed: true, remaining: limit - bucket.count };
}

export function getRateLimitMemoryMetrics() {
  return { ...memoryMetrics };
}
