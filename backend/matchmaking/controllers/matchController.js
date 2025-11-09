const { findMatches } = require("../services/matchService");
const { fetchMatchmakingDataset } = require("../data/profileRepository");
const {
  generateActivitySuggestions,
  generateHangoutPlan,
} = require("../services/activitySuggestionService");

const sanitizeStringList = (value) =>
  Array.isArray(value)
    ? value
        .map((entry) => `${entry}`.trim())
        .filter((entry) => entry.length > 0)
    : [];

const sanitizeDescription = (value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.slice(0, 800);
};

const sanitizeOptionalString = (value) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

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

const sanitizeSeeker = (payload = {}) => {
  const interests = sanitizeStringList(payload.interests);
  const hobbies = sanitizeStringList(payload.hobbies);
  const classes = sanitizeStringList(payload.classes);

  const seeker = {
    id: typeof payload.id === "string" ? payload.id : undefined,
    name: typeof payload.name === "string" ? payload.name : undefined,
    interests,
    hobbies,
  };

  if (classes.length > 0) {
    seeker.classes = classes;
  }

  const major = sanitizeOptionalString(payload.major);
  if (major) seeker.major = major;

  const favoriteSpot = sanitizeOptionalString(payload.favoriteSpot);
  if (favoriteSpot) seeker.favoriteSpot = favoriteSpot;

  const funFact = sanitizeOptionalString(payload.funFact);
  if (funFact) seeker.funFact = funFact;

  const vibeCheck = sanitizeOptionalString(payload.vibeCheck);
  if (vibeCheck) seeker.vibeCheck = vibeCheck;

  const bio = sanitizeOptionalString(payload.bio);
  if (bio) seeker.bio = bio;

  const instagram = sanitizeInstagram(payload.instagram);
  if (instagram) seeker.instagram = instagram;

  return seeker;
};

const sanitizeFilters = (payload = {}) => {
  const filters = {};

  if (Array.isArray(payload.interests)) {
    filters.interests = payload.interests.filter(
      (interest) => typeof interest === "string" && interest.trim().length > 0
    );
  }

  if (Array.isArray(payload.majors)) {
    filters.majors = payload.majors.filter(
      (major) => typeof major === "string" && major.trim().length > 0
    );
  }

  if (Array.isArray(payload.classes)) {
    filters.classes = payload.classes.filter(
      (course) => typeof course === "string" && course.trim().length > 0
    );
  }

  if (payload.requireSameCourse === true) {
    filters.requireSameCourse = true;
  }

  if (typeof payload.hobbyQuery === "string") {
    const trimmed = payload.hobbyQuery.trim();
    if (trimmed.length > 0) {
      filters.hobbyQuery = trimmed;
    }
  }

  return filters;
};

const sanitizeProfileSummary = (payload = {}) => {
  return {
    id: typeof payload.id === "string" ? payload.id : undefined,
    name: typeof payload.name === "string" ? payload.name : undefined,
    major: sanitizeOptionalString(payload.major),
    hobbies: sanitizeStringList(payload.hobbies),
    interests: sanitizeStringList(payload.interests),
  };
};

const sanitizeHangoutPayload = (payload = {}) => {
  const seeker = sanitizeProfileSummary(payload.seeker);
  const friends =
    Array.isArray(payload.friends) && payload.friends.length > 0
      ? payload.friends.map((friend) => sanitizeProfileSummary(friend))
      : [];

  const focus = sanitizeOptionalString(payload.focus);
  const durationMinutes =
    typeof payload.durationMinutes === "number" && payload.durationMinutes > 0
      ? Math.min(Math.round(payload.durationMinutes), 240)
      : undefined;

  return {
    seeker,
    friends,
    focus,
    durationMinutes,
  };
};

const planHangout = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(501).json({
        error: "Hangout planning not configured",
        message: "Set GEMINI_API_KEY to enable AI-powered hangout planning.",
      });
    }

    const { seeker, friends, focus, durationMinutes } = sanitizeHangoutPayload(
      req.body ?? {}
    );

    if (!seeker?.id || friends.length === 0) {
      return res.status(400).json({
        error:
          "Provide a seeker profile and at least one friend to generate a hangout plan.",
      });
    }

    const plan = await generateHangoutPlan({
      seeker,
      friends,
      focus,
      durationMinutes,
    });

    return res.status(200).json({
      plan,
      generatedAt: new Date().toISOString(),
      friendCount: friends.length,
      hasFocus: Boolean(focus),
    });
  } catch (error) {
    console.error("[matchController.planHangout] failed", error);
    return res.status(500).json({
      error: "Failed to generate hangout plan",
      message: error.message ?? error,
    });
  }
};

const suggestActivities = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(501).json({
        error: "Activity suggestions not configured",
        message: "Set GEMINI_API_KEY to enable AI-powered activity ideas.",
      });
    }

    const description = sanitizeDescription(req.body?.description ?? "");
    const hobbies = sanitizeStringList(req.body?.hobbies);

    if (!description && hobbies.length === 0) {
      return res.status(400).json({
        error: "Provide a short description or at least one hobby.",
      });
    }

    const suggestions = await generateActivitySuggestions({
      description,
      hobbies,
    });

    return res.status(200).json({
      suggestions,
      metadata: {
        generatedAt: new Date().toISOString(),
        hobbyCount: hobbies.length,
        hasDescription: Boolean(description),
      },
    });
  } catch (error) {
    console.error("[matchController.suggestActivities] failed", error);
    return res.status(500).json({
      error: "Failed to generate activity suggestions",
      message: error.message ?? error,
    });
  }
};

const searchHobbies = async (req, res) => {
  try {
    const rawTerm = typeof req.query.hobby === "string" ? req.query.hobby : "";
    const term = rawTerm.trim().toLowerCase();

    if (!term) {
      return res.status(400).json({
        error: "Query parameter 'hobby' is required",
      });
    }

    const seekerId =
      typeof req.query.seekerId === "string" ? req.query.seekerId : undefined;
    const dataset = await fetchMatchmakingDataset({ seekerId });

    const matches = dataset.candidates
      .map((candidate) => ({
        ...candidate,
        hobbies: Array.isArray(candidate.hobbies) ? candidate.hobbies : [],
        interests: Array.isArray(candidate.interests)
          ? candidate.interests
          : [],
      }))
      .filter((candidate) =>
        candidate.hobbies.some((value) => value.toLowerCase().includes(term))
      )
      .map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        major: candidate.major,
        classes: Array.isArray(candidate.classes) ? candidate.classes : [],
        hobbies: candidate.hobbies,
        interests: candidate.interests,
        instagram: sanitizeInstagram(candidate.instagram),
      }));

    return res.status(200).json({
      total: matches.length,
      results: matches,
    });
  } catch (error) {
    console.error("[matchController.searchHobbies] failed", error);
    return res.status(500).json({
      error: "Failed to search candidates by hobby",
      message: error.message ?? error,
    });
  }
};

const createMatchPlan = async (req, res) => {
  try {
    const { user, availability, mode, filters } = req.body || {};

    if (!Array.isArray(availability) || availability.length === 0) {
      return res.status(400).json({
        error: "availability array is required",
        hint: "Send the serialized slots captured on the Schedule page.",
      });
    }

    const seeker = sanitizeSeeker(user);
    const sanitizedFilters = sanitizeFilters(filters);

    console.debug("[matchController] createMatchPlan payload", {
      seeker,
      filterKeys: Object.keys(sanitizedFilters),
      availabilityCount: availability.length,
      mode,
    });

    const payload = await findMatches({
      seeker,
      availability,
      mode,
      filters: sanitizedFilters,
    });

    return res.status(200).json(payload);
  } catch (error) {
    console.error("[matchController.createMatchPlan] failed", error);
    return res.status(500).json({
      error: "Failed to generate matches",
      message: error.message ?? error,
    });
  }
};

module.exports = {
  createMatchPlan,
  searchHobbies,
  suggestActivities,
  planHangout,
};
