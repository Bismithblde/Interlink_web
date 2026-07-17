const { findMatches } = require("../services/matchService");
const { fetchMatchmakingDataset } = require("../data/profileRepository");
const {
  generateActivitySuggestions,
  generateHangoutPlan,
} = require("../services/activitySuggestionService");
const { recordEvents } = require("../services/recommendationEventService");
const {
  createMatchmakingLogger,
  createRequestId,
} = require("../utils/matchmakingLogger");

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
  const openTo = sanitizeStringList(payload.openTo);

  const seeker = {
    id: typeof payload.id === "string" ? payload.id : undefined,
    name: typeof payload.name === "string" ? payload.name : undefined,
    interests,
    hobbies,
    openTo,
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
  const requestId = createRequestId();
  const logger = createMatchmakingLogger({ requestId, operation: "hangout_plan" });
  res.set("X-Matchmaking-Request-Id", requestId);
  try {
    if (!process.env.GEMINI_API_KEY) {
      logger.warn("request.rejected", { stage: "configuration", reason: "gemini_api_key_missing" });
      return res.status(501).json({
        error: "Hangout planning not configured",
        message: "Set GEMINI_API_KEY to enable AI-powered hangout planning.",
      });
    }

    const { seeker, friends, focus, durationMinutes } = sanitizeHangoutPayload(
      req.body ?? {}
    );

    if (!seeker?.id || friends.length === 0) {
      logger.warn("request.rejected", { stage: "validation", reason: "missing_participants", seekerId: seeker?.id || null, friendCount: friends.length });
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
      logger,
    });

    logger.info("request.completed", { stage: "http", outcome: "success", friendCount: friends.length, hasFocus: Boolean(focus) });

    return res.status(200).json({
      plan,
      generatedAt: new Date().toISOString(),
      friendCount: friends.length,
      hasFocus: Boolean(focus),
    });
  } catch (error) {
    logger.error("request.failed", { stage: "http", error });
    return res.status(error.status || 500).json({
      error: "Failed to generate hangout plan",
      message: error.message ?? error,
    });
  }
};

const suggestActivities = async (req, res) => {
  const requestId = createRequestId();
  const logger = createMatchmakingLogger({ requestId, operation: "activity_suggestions" });
  res.set("X-Matchmaking-Request-Id", requestId);
  try {
    if (!process.env.GEMINI_API_KEY) {
      logger.warn("request.rejected", { stage: "configuration", reason: "gemini_api_key_missing" });
      return res.status(501).json({
        error: "Activity suggestions not configured",
        message: "Set GEMINI_API_KEY to enable AI-powered activity ideas.",
      });
    }

    const description = sanitizeDescription(req.body?.description ?? "");
    const hobbies = sanitizeStringList(req.body?.hobbies);

    if (!description && hobbies.length === 0) {
      logger.warn("request.rejected", { stage: "validation", reason: "missing_description_and_hobbies" });
      return res.status(400).json({
        error: "Provide a short description or at least one hobby.",
      });
    }

    const suggestions = await generateActivitySuggestions({
      description,
      hobbies,
      logger,
    });

    logger.info("request.completed", { stage: "http", outcome: "success", suggestionCount: suggestions.length });

    return res.status(200).json({
      suggestions,
      metadata: {
        generatedAt: new Date().toISOString(),
        hobbyCount: hobbies.length,
        hasDescription: Boolean(description),
      },
    });
  } catch (error) {
    logger.error("request.failed", { stage: "http", error });
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
  const requestId = createRequestId();
  const logger = createMatchmakingLogger({ requestId, operation: "find_matches" });
  res.set("X-Matchmaking-Request-Id", requestId);
  const finishRequest = logger.timer("request.completed", { stage: "http" });
  try {
    const { user, availability, mode, filters, intent, openTo, minOverlapMinutes } = req.body || {};

    logger.info("request.received", {
      stage: "http",
      seekerId: typeof user?.id === "string" ? user.id : null,
      availabilityCount: Array.isArray(availability) ? availability.length : 0,
      requestedMode: mode || "one-on-one",
      requestedMinimumOverlapMinutes: minOverlapMinutes ?? null,
      filterKeys: filters && typeof filters === "object" ? Object.keys(filters) : [],
      hasIntent: Boolean(intent),
    });

    if (!Array.isArray(availability) || availability.length === 0) {
      logger.warn("request.rejected", { stage: "validation", reason: "missing_availability" });
      finishRequest({ outcome: "rejected", statusCode: 400 }, "warn");
      return res.status(400).json({
        error: "availability array is required",
        hint: "Send the serialized slots captured on the Schedule page.",
      });
    }

    const seeker = sanitizeSeeker(user);
    if (Array.isArray(openTo)) seeker.openTo = sanitizeStringList(openTo);
    const sanitizedFilters = sanitizeFilters(filters);

    logger.debug("request.sanitized", {
      stage: "validation",
      seekerId: seeker.id || null,
      seekerSignalCounts: {
        interests: seeker.interests.length,
        hobbies: seeker.hobbies.length,
        classes: seeker.classes?.length || 0,
        openTo: seeker.openTo.length,
      },
      filterKeys: Object.keys(sanitizedFilters),
      availabilityCount: availability.length,
      mode: mode || "one-on-one",
    });

    const payload = await findMatches({
      requestId,
      logger,
      seeker,
      availability,
      mode,
      intent,
      minOverlapMinutes,
      filters: sanitizedFilters,
    });

    finishRequest({ outcome: "success", statusCode: 200, matchCount: payload.matches.length });
    return res.status(200).json(payload);
  } catch (error) {
    logger.error("request.failed", { stage: "http", error });
    finishRequest({ outcome: "error", statusCode: error.status || 500 }, "error");
    return res.status(error.status || 500).json({
      error: "Failed to generate matches",
      message: error.message ?? error,
    });
  }
};

const recordRecommendationEvents = async (req, res) => {
  try {
    const rows = await recordEvents(req.body?.events, req.user?.id);
    return res.status(202).json({ accepted: rows.length });
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.message });
  }
};

module.exports = {
  createMatchPlan,
  searchHobbies,
  suggestActivities,
  planHangout,
  recordRecommendationEvents,
};
