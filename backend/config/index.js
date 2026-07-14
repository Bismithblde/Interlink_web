require('dotenv').config();

const config = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  redisUrl: process.env.REDIS_URL || '',
  /** Top-k compatibility cache: store this many top matches per user. */
  compatibilityTopK: Math.max(1, parseInt(process.env.COMPATIBILITY_TOP_K || '10', 10)),
  /** TTL in seconds for compatibility cache entries. */
  compatibilityCacheTtlSeconds: Math.max(60, parseInt(process.env.COMPATIBILITY_CACHE_TTL_SECONDS || '86400', 10)),
};

module.exports = config;
