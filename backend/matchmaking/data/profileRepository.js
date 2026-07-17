const supabase = require("../../auth/services/supabaseClient");
const sampleUsers = require("./sampleUsers");
const scheduleStore = require("../../schedule/store");

const getClientStatus =
  typeof supabase.__status === "function" ? supabase.__status : () => null;
const supabaseStatus = getClientStatus() || {};
const isSupabaseConfigured =
  typeof supabase.from === "function" &&
  !supabaseStatus.usesStub &&
  supabaseStatus.isConfigured !== false;

const normalizeArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return [];
};

const normalizeAvailability = (entries = []) =>
  entries
    .filter(
      (entry) =>
        entry &&
        (entry.start || entry.start_time) &&
        (entry.end || entry.end_time)
    )
    .map((entry) => ({
      id: entry.id,
      title: entry.title || "Availability",
      start: new Date(entry.start_time || entry.start).toISOString(),
      end: new Date(entry.end_time || entry.end).toISOString(),
      ...(entry.color ? { color: entry.color } : {}),
    }));

const sanitizeInstagram = (value) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const withoutUrl = trimmed
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/\/+$/, "");
  const withoutAt =
    withoutUrl.startsWith("@") && withoutUrl.length > 1
      ? withoutUrl.slice(1)
      : withoutUrl;
  const compact = withoutAt.replace(/\s+/g, "");
  return compact.length > 0 ? compact : undefined;
};

const toProfile = (record = {}) => ({
  id: record.id,
  name: record.full_name || record.name,
  email: record.email,
  major: record.major,
  graduationYear: record.graduation_year || record.graduationYear,
  interests: normalizeArray(record.interests),
  hobbies: normalizeArray(record.hobbies),
  classes: normalizeArray(record.classes),
  bio: record.bio,
  funFact: record.fun_fact || record.funFact,
  favoriteSpot: record.favorite_spot || record.favoriteSpot,
  vibeCheck: record.vibe_check || record.vibeCheck,
  avatarUrl: record.avatar_url || record.avatarUrl,
  openTo: normalizeArray(record.open_to || record.openTo),
  tags: Array.isArray(record.profileTags)
    ? record.profileTags.map((entry) => entry?.tag?.slug || entry?.tag_id).filter(Boolean)
    : normalizeArray(record.tags),
  connections: normalizeArray(record.connections),
  recentImpressions: Number(record.recentImpressions || 0),
  availability: normalizeAvailability(record.availability || record.availabilitySlots),
  instagram:
    sanitizeInstagram(record.instagram) ||
    sanitizeInstagram(record.instagram_handle) ||
    sanitizeInstagram(record.social_instagram),
});

const fetchFromSampleDataset = async ({ seekerId, logger }) => {
  const normalizedSeekerId =
    seekerId && typeof seekerId === "string" ? seekerId : null;
  const seekerProfile =
    sampleUsers.find((user) => user.id === normalizedSeekerId) || null;
  const candidates = sampleUsers.filter((user) => user.id !== normalizedSeekerId);

  logger?.debug("dataset.sample.loaded", {
    stage: "dataset",
    seekerFound: Boolean(seekerProfile),
    candidateCount: candidates.length,
  });

  return {
    seekerProfile,
    candidates,
    totalCandidates: candidates.length,
  };
};

const fetchFromSupabase = async ({ seekerId, logger }) => {
  const finishQuery = logger?.timer("dataset.supabase.queried", { stage: "dataset" });
  const profilesResult = await supabase
    .from("match_profiles")
    .select(
      `
      id,
      full_name,
      email,
      major,
      graduation_year,
      interests,
      hobbies,
      classes,
      fun_fact,
      favorite_spot,
      vibe_check,
      bio,
      instagram,
      avatar_url,
      open_to,
      profileTags:profile_tags(
        tag_id,
        confidence,
        confirmed,
        tag:canonical_tags(slug,label,category)
      ),
      availability:availability_slots(
        id,
        title,
        start_time,
        end_time,
        color
      )
    `
    );

  const [friendshipsResult, impressionsResult] = await Promise.all([
    supabase.from("friendships").select("user_id,friend_id"),
    supabase.from("recommendation_events").select("candidate_id").eq("event_type", "impression").gte("occurred_at", new Date(Date.now() - 7 * 86400000).toISOString()),
  ]);

  const { data, error } = profilesResult;

  if (error) {
    finishQuery?.({ outcome: "error", query: "profiles", error }, "error");
    error.status = error.status || 500;
    throw error;
  }
  if (friendshipsResult.error) {
    finishQuery?.({ outcome: "error", query: "friendships", error: friendshipsResult.error }, "error");
    throw friendshipsResult.error;
  }
  if (impressionsResult.error) {
    finishQuery?.({ outcome: "error", query: "impressions", error: impressionsResult.error }, "error");
    throw impressionsResult.error;
  }

  const connectionMap = new Map();
  (friendshipsResult.data || []).forEach(({ user_id: userId, friend_id: friendId }) => {
    if (!connectionMap.has(userId)) connectionMap.set(userId, []);
    connectionMap.get(userId).push(friendId);
  });
  const impressionCounts = new Map();
  (impressionsResult.data || []).forEach(({ candidate_id: candidateId }) => impressionCounts.set(candidateId, (impressionCounts.get(candidateId) || 0) + 1));
  const profiles = (data || []).map((record) => toProfile({
    ...record,
    connections: connectionMap.get(record.id) || [],
    recentImpressions: impressionCounts.get(record.id) || 0,
  }));
  const normalizedSeekerId =
    seekerId && typeof seekerId === "string" ? seekerId : null;

  const seekerProfile =
    profiles.find((profile) => profile.id === normalizedSeekerId) || null;
  const candidates = profiles.filter(
    (profile) =>
      profile.id !== normalizedSeekerId && profile.availability.length > 0
  );

  finishQuery?.({
    outcome: "success",
    profileCount: profiles.length,
    candidateCount: candidates.length,
    friendshipCount: friendshipsResult.data?.length || 0,
    recentImpressionCount: impressionsResult.data?.length || 0,
    seekerFound: Boolean(seekerProfile),
  });

  return {
    seekerProfile,
    candidates,
    totalCandidates: candidates.length,
  };
};

const fetchSeekerScheduleFallback = async (seekerId, existingProfile, logger) => {
  if (!seekerId) return existingProfile;
  const availability = await scheduleStore.getSlots(seekerId);
  logger?.debug("dataset.seeker_schedule.loaded", {
    stage: "dataset",
    seekerId,
    persistedSlotCount: availability.length,
    usedAsFallback: availability.length > 0,
  });
  if (!existingProfile) {
    return {
      id: seekerId,
      availability,
    };
  }
  return {
    ...existingProfile,
    availability: availability.length
      ? availability
      : existingProfile.availability || [],
  };
};

const fetchMatchmakingDataset = async ({ seekerId, logger }) => {
  const finishLoad = logger?.timer("dataset.loaded", {
    stage: "dataset",
    source: isSupabaseConfigured ? "supabase" : "sample",
  });
  logger?.info("dataset.source_selected", {
    stage: "dataset",
    source: isSupabaseConfigured ? "supabase" : "sample",
    seekerId: seekerId || null,
  });
  let dataset;
  if (isSupabaseConfigured) {
    dataset = await fetchFromSupabase({ seekerId, logger });
  } else {
    dataset = await fetchFromSampleDataset({ seekerId, logger });
  }

  const seekerProfile = await fetchSeekerScheduleFallback(
    seekerId,
    dataset.seekerProfile,
    logger
  );

  finishLoad?.({
    candidateCount: dataset.candidates.length,
    seekerFound: Boolean(seekerProfile),
  });

  return {
    seekerProfile,
    candidates: dataset.candidates,
    totalCandidates: dataset.totalCandidates,
    usesSampleData: !isSupabaseConfigured,
  };
};

module.exports = {
  fetchMatchmakingDataset,
};

