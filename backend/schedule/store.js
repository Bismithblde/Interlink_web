const { randomUUID } = require("node:crypto");
const supabase = require("../auth/services/supabaseClient");
const sampleUsers = require("../matchmaking/data/sampleUsers");

const schedules = new Map();

const ensuredProfiles = new Set();

const getClientStatus =
  typeof supabase.__status === "function" ? supabase.__status : () => null;
const supabaseStatus = getClientStatus() || {};
const isSupabaseConfigured =
  typeof supabase.from === "function" &&
  !supabaseStatus.usesStub &&
  supabaseStatus.isConfigured !== false;

const cloneSlot = (slot) => {
  if (!slot || typeof slot !== "object") {
    return null;
  }

  const { id, title, start, end, color } = slot;

  if (typeof start !== "string" || typeof end !== "string") {
    return null;
  }

  const cloned = {
    id,
    title,
    start,
    end,
  };

  if (typeof color === "string" && color.trim().length > 0) {
    cloned.color = color;
  }

  return cloned;
};

const cloneSlots = (slots = []) =>
  slots
    .map(cloneSlot)
    .filter(Boolean);

const seedFromSampleUsers = () => {
  if (!Array.isArray(sampleUsers)) return;
  sampleUsers.forEach((user) => {
    if (!user || !user.id || !Array.isArray(user.availability)) return;
    if (schedules.has(user.id)) return;
    schedules.set(user.id, cloneSlots(user.availability));
  });
};

const toApiSlot = (row) => ({
  id: row.id,
  title: row.title,
  start: new Date(row.start_time || row.start).toISOString(),
  end: new Date(row.end_time || row.end).toISOString(),
  ...(row.color ? { color: row.color } : {}),
});

const toPersistenceRow = (userId, slot) => ({
  id: slot.id && `${slot.id}`.trim().length > 0 ? `${slot.id}`.trim() : randomUUID(),
  user_id: userId,
  title: slot.title,
  start_time: slot.start,
  end_time: slot.end,
  color: slot.color ?? null,
});

const normalizeTextArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((entry) => `${entry}`.trim())
      .filter((entry) => entry.length > 0);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return [];
};

const fetchAuthUser = async (userId) => {
  if (
    !userId ||
    !supabase.auth ||
    !supabase.auth.admin ||
    typeof supabase.auth.admin.getUserById !== "function"
  ) {
    return null;
  }

  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error) {
      console.warn("[scheduleStore] Failed to fetch auth user", error);
      return null;
    }
    return data?.user || data || null;
  } catch (error) {
    console.warn("[scheduleStore] getUserById threw", error);
    return null;
  }
};

const ensureMatchProfile = async (userId) => {
  if (!isSupabaseConfigured || !userId) return;
  if (ensuredProfiles.has(userId)) return;

  const existing = await supabase
    .from("match_profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing.error) {
    existing.error.status = existing.error.status || 500;
    throw existing.error;
  }

  if (existing.data) {
    ensuredProfiles.add(userId);
    return;
  }

  const authUser = await fetchAuthUser(userId);
  const metadata =
    authUser && authUser.user_metadata && typeof authUser.user_metadata === "object"
      ? authUser.user_metadata
      : {};

  const interests = normalizeTextArray(metadata.interests);
  const hobbies = normalizeTextArray(metadata.hobbies);
  const classes = normalizeTextArray(metadata.classes);

  const profilePayload = {
    id: userId,
    email: authUser?.email ?? undefined,
    full_name:
      metadata.name ||
      metadata.fullName ||
      metadata.full_name ||
      metadata.displayName ||
      undefined,
    major: metadata.major || undefined,
    graduation_year: metadata.graduationYear || metadata.graduation_year || undefined,
    interests: interests.length ? interests : undefined,
    hobbies: hobbies.length ? hobbies : undefined,
    classes: classes.length ? classes : undefined,
    bio: metadata.bio || undefined,
    fun_fact: metadata.funFact || metadata.fun_fact || undefined,
    favorite_spot: metadata.favoriteSpot || metadata.favorite_spot || undefined,
    vibe_check: metadata.vibeCheck || metadata.vibe_check || undefined,
    is_opted_in:
      typeof metadata.isOptedIn === "boolean" ? metadata.isOptedIn : true,
  };

  const sanitized = Object.fromEntries(
    Object.entries(profilePayload).filter(
      ([, value]) => value !== undefined && value !== null
    )
  );

  const { error } = await supabase
    .from("match_profiles")
    .upsert(sanitized, { onConflict: "id" });

  if (error) {
    error.status = error.status || 500;
    throw error;
  }

  ensuredProfiles.add(userId);
};

const getSlotsFromSupabase = async (userId) => {
  await ensureMatchProfile(userId);
  const { data, error } = await supabase
    .from("availability_slots")
    .select("id,title,start_time,end_time,color")
    .eq("user_id", userId)
    .order("start_time", { ascending: true });

  if (error) {
    error.status = error.status || 500;
    throw error;
  }

  return (data || []).map(toApiSlot);
};

const setSlotsInSupabase = async (userId, slots) => {
  await ensureMatchProfile(userId);
  const deleteResult = await supabase
    .from("availability_slots")
    .delete()
    .eq("user_id", userId);

  if (deleteResult.error) {
    const error = deleteResult.error;
    error.status = error.status || 500;
    throw error;
  }

  if (!slots.length) {
    await bumpProfileVersion(userId);
    return [];
  }

  const rows = slots.map((slot) => toPersistenceRow(userId, slot));
  const insertResult = await supabase
    .from("availability_slots")
    .insert(rows)
    .select("id,title,start_time,end_time,color");

  if (insertResult.error) {
    const error = insertResult.error;
    error.status = error.status || 500;
    throw error;
  }

  await bumpProfileVersion(userId);
  return (insertResult.data || []).map(toApiSlot);
};

/** Bump match_profiles.updated_at so profile versioning invalidates compatibility cache. */
const bumpProfileVersion = async (userId) => {
  if (!userId || !isSupabaseConfigured) return;
  const { error } = await supabase
    .from("match_profiles")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) {
    console.warn("[scheduleStore] bumpProfileVersion failed", error.message);
  }
};

const clearSlotsInSupabase = async (userId) => {
  const { error } = await supabase
    .from("availability_slots")
    .delete()
    .eq("user_id", userId);

  if (error) {
    error.status = error.status || 500;
    throw error;
  }

  await bumpProfileVersion(userId);
};

if (!isSupabaseConfigured) {
  seedFromSampleUsers();
}

const getSlots = async (userId) => {
  if (!userId) return [];

  if (isSupabaseConfigured) {
    return getSlotsFromSupabase(userId);
  }

  const stored = schedules.get(userId);
  if (!stored) return [];
  return cloneSlots(stored);
};

const setSlots = async (userId, slots) => {
  if (!userId) return [];
  const normalized = cloneSlots(slots);

  if (isSupabaseConfigured) {
    return setSlotsInSupabase(userId, normalized);
  }

  schedules.set(userId, normalized);
  return cloneSlots(normalized);
};

const clearSlots = async (userId) => {
  if (!userId) return;

  if (isSupabaseConfigured) {
    await clearSlotsInSupabase(userId);
    return;
  }

  schedules.delete(userId);
};

module.exports = {
  getSlots,
  setSlots,
  clearSlots,
};