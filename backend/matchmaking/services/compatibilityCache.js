/**
 * Top-k Redis cache for compatibility scores.
 * Stores for each user the top-k match results; only recompute when
 * profile version changes (new user or updated profile/schedule).
 */
const Redis = require("ioredis");
const config = require("../../config");

const PREFIX = "compat:topk:";

let redis = null;

const isEnabled = () => Boolean(config.redisUrl && config.redisUrl.trim().length > 0);

const getClient = () => {
  if (!isEnabled()) return null;
  if (redis) return redis;
  try {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });
    redis.on("error", (err) => {
      console.warn("[compatibilityCache] Redis error", err.message);
    });
    return redis;
  } catch (err) {
    console.warn("[compatibilityCache] Redis init failed", err.message);
    return null;
  }
};

/**
 * Cached entry shape: { candidateId, seekerVersion, candidateVersion, matchPayload }
 * @typedef {Object} CachedEntry
 * @property {string} candidateId
 * @property {string} seekerVersion
 * @property {string} candidateVersion
 * @property {Object} matchPayload
 */

/**
 * Get cached top-k matches for a seeker. Entries are valid only when
 * current seeker/candidate versions match the cached versions.
 * @param {string} seekerId
 * @returns {Promise<CachedEntry[]|null>} Array of cached entries or null
 */
const getTopK = async (seekerId) => {
  const client = getClient();
  if (!client || !seekerId) return null;
  try {
    const key = `${PREFIX}${seekerId}`;
    const raw = await client.get(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.warn("[compatibilityCache] getTopK failed", err.message);
    return null;
  }
};

/**
 * Store top-k matches for a seeker.
 * @param {string} seekerId
 * @param {CachedEntry[]} entries
 * @param {number} [ttlSeconds] Optional TTL; defaults to config.compatibilityCacheTtlSeconds
 */
const setTopK = async (seekerId, entries, ttlSeconds) => {
  const client = getClient();
  if (!client || !seekerId) return;
  const ttl = ttlSeconds ?? config.compatibilityCacheTtlSeconds;
  try {
    const key = `${PREFIX}${seekerId}`;
    const value = JSON.stringify(Array.isArray(entries) ? entries : []);
    if (ttl > 0) {
      await client.setex(key, ttl, value);
    } else {
      await client.set(key, value);
    }
  } catch (err) {
    console.warn("[compatibilityCache] setTopK failed", err.message);
  }
};

/**
 * Invalidate cache for a user (e.g. after profile/schedule update if we want to force recompute).
 * With version-based validation this is optional; cache entries become stale when version changes.
 * @param {string} userId
 */
const invalidateUser = async (userId) => {
  const client = getClient();
  if (!client || !userId) return;
  try {
    await client.del(`${PREFIX}${userId}`);
  } catch (err) {
    console.warn("[compatibilityCache] invalidateUser failed", err.message);
  }
};

const close = async () => {
  if (redis) {
    await redis.quit().catch(() => {});
    redis = null;
  }
};

module.exports = {
  isEnabled,
  getTopK,
  setTopK,
  invalidateUser,
  getClient,
  close,
  /** Max number of top matches to store per user (from config). */
  getTopKSize: () => config.compatibilityTopK,
};
