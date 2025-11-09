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
  availability: normalizeAvailability(record.availability || record.availabilitySlots),
  instagram:
    sanitizeInstagram(record.instagram) ||
    sanitizeInstagram(record.instagram_handle) ||
    sanitizeInstagram(record.social_instagram),
});

const fetchFromSampleDataset = async ({ seekerId }) => {
  const normalizedSeekerId =
    seekerId && typeof seekerId === "string" ? seekerId : null;
  const seekerProfile =
    sampleUsers.find((user) => user.id === normalizedSeekerId) || null;
  const candidates = sampleUsers.filter((user) => user.id !== normalizedSeekerId);

  return {
    seekerProfile,
    candidates,
    totalCandidates: candidates.length,
  };
};

const fetchFromSupabase = async ({ seekerId }) => {
  const { data, error } = await supabase
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
      availability:availability_slots(
        id,
        title,
        start_time,
        end_time,
        color
      )
    `
    );

  if (error) {
    error.status = error.status || 500;
    throw error;
  }

  const profiles = (data || []).map(toProfile);
  const normalizedSeekerId =
    seekerId && typeof seekerId === "string" ? seekerId : null;

  const seekerProfile =
    profiles.find((profile) => profile.id === normalizedSeekerId) || null;
  const candidates = profiles.filter(
    (profile) =>
      profile.id !== normalizedSeekerId && profile.availability.length > 0
  );

  return {
    seekerProfile,
    candidates,
    totalCandidates: candidates.length,
  };
};

const fetchSeekerScheduleFallback = async (seekerId, existingProfile) => {
  if (!seekerId) return existingProfile;
  const availability = await scheduleStore.getSlots(seekerId);
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

const fetchMatchmakingDataset = async ({ seekerId }) => {
  let dataset;
  if (isSupabaseConfigured) {
    dataset = await fetchFromSupabase({ seekerId });
  } else {
    dataset = await fetchFromSampleDataset({ seekerId });
  }

  const seekerProfile = await fetchSeekerScheduleFallback(
    seekerId,
    dataset.seekerProfile
  );

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

