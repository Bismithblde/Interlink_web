/**
 * Profile versioning for compatibility cache invalidation.
 * Version = when the user's profile or schedule was last updated.
 * New users or updated profile/schedule get a new timestamp so we only recompute
 * compatibility when needed.
 */
const supabase = require("../../auth/services/supabaseClient");

const getClientStatus =
  typeof supabase.__status === "function" ? supabase.__status : () => null;
const supabaseStatus = getClientStatus() || {};
const isSupabaseConfigured =
  typeof supabase.from === "function" &&
  !supabaseStatus.usesStub &&
  supabaseStatus.isConfigured !== false;

/**
 * Get profile version for one user (max of profile.updated_at and latest slot updated_at).
 * @param {string} userId
 * @returns {Promise<string|null>} ISO timestamp or null if not found / not configured
 */
const getProfileVersion = async (userId) => {
  if (!userId || !isSupabaseConfigured) return null;
  const versions = await getProfileVersions([userId]);
  return versions.get(userId) ?? null;
};

/**
 * Get profile versions for multiple users in one query.
 * Version is max( match_profiles.updated_at, max(availability_slots.updated_at) )
 * so that profile or schedule changes invalidate cache.
 * @param {string[]} userIds
 * @returns {Promise<Map<string, string>>} Map of userId -> ISO version string
 */
const getProfileVersions = async (userIds = []) => {
  const result = new Map();
  const ids = [...new Set(userIds)].filter((id) => id && typeof id === "string");
  if (!ids.length || !isSupabaseConfigured) return result;

  const { data: profiles, error: profileError } = await supabase
    .from("match_profiles")
    .select("id, updated_at")
    .in("id", ids);

  if (profileError) {
    console.warn("[profileVersionService] getProfileVersions profile error", profileError);
    return result;
  }

  const { data: slots, error: slotsError } = await supabase
    .from("availability_slots")
    .select("user_id, updated_at")
    .in("user_id", ids);

  if (slotsError) {
    console.warn("[profileVersionService] getProfileVersions slots error", slotsError);
  }

  const slotMaxByUser = new Map();
  (slots || []).forEach((row) => {
    const uid = row.user_id;
    const t = row.updated_at ? new Date(row.updated_at).getTime() : 0;
    const prev = slotMaxByUser.get(uid);
    slotMaxByUser.set(uid, prev == null ? t : Math.max(prev, t));
  });

  (profiles || []).forEach((row) => {
    const profileTime = row.updated_at ? new Date(row.updated_at).getTime() : 0;
    const slotTime = slotMaxByUser.get(row.id) ?? 0;
    const versionMs = Math.max(profileTime, slotTime);
    result.set(row.id, new Date(versionMs).toISOString());
  });

  ids.forEach((id) => {
    if (!result.has(id) && slotMaxByUser.has(id)) {
      result.set(id, new Date(slotMaxByUser.get(id)).toISOString());
    }
  });

  return result;
};

module.exports = {
  getProfileVersion,
  getProfileVersions,
  isSupabaseConfigured,
};
