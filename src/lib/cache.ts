/**
 * Caching utilities with Redis
 * Provides cache helpers with automatic invalidation
 */

import { getRedis } from './redis';

export type CacheKey =
  | `blog:list:${string}` // Blog list with query params hash
  | `blog:slug:${string}` // Individual blog post by slug
  | `page:slug:${string}` // Individual page by slug
  | `page:list:${string}` // Page list with query params
  | `customer:${string}` // Customer by ID
  | `service:${string}` // Service by ID
  | `invoice:${string}`; // Invoice by ID

const DEFAULT_TTL = 3600; // 1 hour in seconds

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for bulk invalidation
}

/**
 * Get cached value
 */
export async function getCache<T>(key: CacheKey): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const cached = await redis.get(key);
    if (!cached) return null;

    return JSON.parse(cached) as T;
  } catch (error) {
    console.error('[CACHE] Get error:', error);
    return null;
  }
}

/**
 * Set cached value
 */
export async function setCache<T>(
  key: CacheKey,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    const ttl = options.ttl || DEFAULT_TTL;
    const serialized = JSON.stringify(value);

    await redis.setex(key, ttl, serialized);

    // Store tags for bulk invalidation
    if (options.tags && options.tags.length > 0) {
      for (const tag of options.tags) {
        await redis.sadd(`tag:${tag}`, key);
        await redis.expire(`tag:${tag}`, ttl);
      }
    }
  } catch (error) {
    console.error('[CACHE] Set error:', error);
  }
}

/**
 * Delete cached value
 */
export async function deleteCache(key: CacheKey): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    console.error('[CACHE] Delete error:', error);
  }
}

/**
 * Invalidate all cache entries with a specific tag
 */
export async function invalidateByTag(tag: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    const keys = await redis.smembers(`tag:${tag}`);
    if (keys && keys.length > 0) {
      await redis.del(...keys);
      await redis.del(`tag:${tag}`);
    }
  } catch (error) {
    console.error('[CACHE] Invalidate by tag error:', error);
  }
}

/**
 * Invalidate all cache entries matching a pattern
 */
export async function invalidateByPattern(pattern: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    const keys = await redis.keys(pattern);
    if (keys && keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('[CACHE] Invalidate by pattern error:', error);
  }
}

/**
 * Cache wrapper for async functions
 * Automatically caches function results
 */
export async function withCache<T>(
  key: CacheKey,
  fn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try to get from cache first
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute function
  const result = await fn();

  // Cache result
  await setCache(key, result, options);

  return result;
}

/**
 * Invalidate all blog-related caches
 */
export async function invalidateBlogCache(): Promise<void> {
  await Promise.all([
    invalidateByPattern('blog:*'),
    invalidateByTag('blog'),
  ]);
}

/**
 * Invalidate all page-related caches
 */
export async function invalidatePageCache(): Promise<void> {
  await Promise.all([
    invalidateByPattern('page:*'),
    invalidateByTag('page'),
  ]);
}

/**
 * Invalidate specific blog post cache
 */
export async function invalidateBlogPost(slug: string): Promise<void> {
  await Promise.all([
    deleteCache(`blog:slug:${slug}` as CacheKey),
    invalidateBlogCache(), // Also invalidate list cache
  ]);
}

/**
 * Invalidate specific page cache
 */
export async function invalidatePage(slug: string): Promise<void> {
  await Promise.all([
    deleteCache(`page:slug:${slug}` as CacheKey),
    invalidatePageCache(), // Also invalidate list cache
  ]);
}
