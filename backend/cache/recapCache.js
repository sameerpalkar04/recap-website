import { createHash } from 'node:crypto';
import { createClient } from 'redis';

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;
const RECENT_RECAP_LIMIT = 100;
const localRecaps = new Map();
const localRateLimits = new Map();
let redis = null;
let cacheInitialized = false;

export async function initializeCache() {
  if (cacheInitialized) return;
  cacheInitialized = true;
  if (!process.env.REDIS_URL) return;

  redis = createClient({ url: process.env.REDIS_URL, socket: { connectTimeout: 3000 } });
  redis.on('error', (error) => console.error('Redis connection error:', error.message));
  try {
    await redis.connect();
    console.log('Connected to shared Redis cache');
  } catch (error) {
    console.error('Could not connect to Redis; using process-local cache:', error.message);
  }
}

function makeId(show, seasonNo, episodeNo) {
  const normalizedShow = show.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
  const cacheVersion = `prompt-v3:${process.env.GEMINI_MODEL || 'gemini-3.6-flash'}`;
  return createHash('sha256').update(`${cacheVersion}:${normalizedShow}:${seasonNo}:${episodeNo}`).digest('hex');
}

export async function getCachedRecap(show, seasonNo, episodeNo) {
  const id = makeId(show, seasonNo, episodeNo);
  if (redis?.isReady) {
    try {
      const value = await redis.get(`recap:${id}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis read failed; checking local cache:', error.message);
    }
  }
  return localRecaps.get(id) ?? null;
}

export async function saveCachedRecap({ show, seasonNo, episodeNo, summary }) {
  const id = makeId(show, seasonNo, episodeNo);
  const recap = { id, show, seasonNo, episodeNo, summary, generatedAt: new Date().toISOString() };
  if (redis?.isReady) {
    const key = `recap:${id}`;
    try {
      await redis.set(key, JSON.stringify(recap), { EX: CACHE_TTL_SECONDS });
      await redis.zAdd('recaps:recent', { score: Date.now(), value: key });
      await redis.expire('recaps:recent', CACHE_TTL_SECONDS);
      await redis.zRemRangeByRank('recaps:recent', 0, -(RECENT_RECAP_LIMIT + 1));
      return recap;
    } catch (error) {
      console.error('Redis write failed; storing recap in process memory:', error.message);
    }
  }
  localRecaps.set(id, recap);
  while (localRecaps.size > RECENT_RECAP_LIMIT) {
    localRecaps.delete(localRecaps.keys().next().value);
  }
  return recap;
}

export async function listCachedRecaps(limit = 20) {
  if (redis?.isReady) {
    const keys = await redis.zRange('recaps:recent', -limit, -1, { REV: true });
    if (!keys.length) return [];
    const values = await redis.mGet(keys);
    return values.filter(Boolean).map((value) => JSON.parse(value));
  }
  return [...localRecaps.values()].slice(-limit).reverse();
}

export async function consumeGenerationAllowance(identity, limit = 5, windowSeconds = 600) {
  if (redis?.isReady) {
    try {
      const key = `rate:recap:${identity}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, windowSeconds);
      return { allowed: count <= limit, retryAfter: await redis.ttl(key) };
    } catch (error) {
      console.error('Redis rate limit failed; using process-local limit:', error.message);
    }
  }

  const now = Date.now();
  if (localRateLimits.size > 10_000) {
    for (const [key, value] of localRateLimits) {
      if (value.expiresAt <= now) localRateLimits.delete(key);
    }
  }
  const current = localRateLimits.get(identity);
  const expiresAt = now + windowSeconds * 1000;
  if (!current || current.expiresAt <= now) {
    localRateLimits.set(identity, { count: 1, expiresAt });
    return { allowed: true, retryAfter: windowSeconds };
  }
  current.count += 1;
  return { allowed: current.count <= limit, retryAfter: Math.max(1, Math.ceil((current.expiresAt - now) / 1000)) };
}

export async function closeCache() {
  if (redis?.isOpen) await redis.quit();
}
