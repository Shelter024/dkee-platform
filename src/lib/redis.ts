import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (process.env.FEATURE_REDIS_CACHE === 'false') return null;
  if (!redis) {
    const url = process.env.REDIS_URL;
    if (!url) return null;
    try {
      redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 2 });
      // Attempt initial connection (non-blocking)
      redis.on('error', (e) => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[redis] error', e.message);
        }
      });
    } catch {
      redis = null;
    }
  }
  return redis;
}

export async function redisPing(): Promise<boolean> {
  const r = getRedis();
  if (!r) return false;
  try {
    const pong = await r.ping();
    return pong === 'PONG';
  } catch { return false; }
}
