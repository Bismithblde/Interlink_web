const crypto = require("node:crypto");
const { fetchMatchmakingDataset } = require("../data/profileRepository");
const { sortSlotsAscending, intersectSchedules, totalDurationMinutes, serializeIntervals, summarizeSchedule } = require("../utils/scheduleUtils");
const { compareSchedules, normalizeMinimumOverlap } = require("../utils/bitmapSchedule");
const { buildIdf, rankCandidate } = require("./rankingService");
const { buildAffinityContext, computeGroupCompatibility } = require("../utils/affinityUtils");

const SUPPORTED_MODES = {
  "one-on-one": "one-on-one", "1-on-1": "one-on-one", one_on_one: "one-on-one",
  "one-on-two": "one-on-two", "1-on-2": "one-on-two", one_on_two: "one-on-two",
  "one-on-three": "one-on-three", "1-on-3": "one-on-three", one_on_three: "one-on-three",
};

const normalizedMode = (mode) => SUPPORTED_MODES[`${mode || "one-on-one"}`.toLowerCase().replace(/\s/g, "-")] || "one-on-one";
const unique = (...arrays) => [...new Set(arrays.filter(Array.isArray).flat().map((value) => `${value}`.trim()).filter(Boolean))];

const mergeSeekerProfile = (incoming = {}, persisted = {}) => ({
  ...persisted, ...incoming,
  interests: unique(persisted.interests, incoming.interests), hobbies: unique(persisted.hobbies, incoming.hobbies),
  classes: unique(persisted.classes, incoming.classes), tags: unique(persisted.tags, incoming.tags),
  openTo: unique(persisted.openTo, incoming.openTo),
});

const pickCandidateProfile = (candidate) => ({
  id: candidate.id, name: candidate.name, email: candidate.email, major: candidate.major,
  graduationYear: candidate.graduationYear, interests: candidate.interests || [], hobbies: candidate.hobbies || [],
  classes: candidate.classes || [], tags: candidate.tags || [], openTo: candidate.openTo || [], bio: candidate.bio,
  funFact: candidate.funFact, favoriteSpot: candidate.favoriteSpot, vibeCheck: candidate.vibeCheck,
  instagram: candidate.instagram, avatarUrl: candidate.avatarUrl,
});

const evaluateFilters = (candidate, filters = {}) => {
  const includesAny = (source, wanted) => !wanted?.length || wanted.some((item) => (source || []).some((value) => `${value}`.toLowerCase() === `${item}`.toLowerCase()));
  const rejectionReasons = [];
  if (!includesAny(candidate.interests, filters.interests)) rejectionReasons.push("interests");
  if (filters.majors?.length && !filters.majors.includes(candidate.major)) rejectionReasons.push("major");
  if (!includesAny(candidate.classes, filters.classes)) rejectionReasons.push("classes");
  if (filters.hobbyQuery && !(candidate.hobbies || []).some((value) => value.toLowerCase().includes(filters.hobbyQuery.toLowerCase()))) rejectionReasons.push("hobby_query");
  return { accepted: rejectionReasons.length === 0, rejectionReasons };
};

const applyFilters = (candidates, filters = {}, logger) => {
  const accepted = [];
  const rejectionCounts = {};
  candidates.forEach((candidate) => {
    const decision = evaluateFilters(candidate, filters);
    logger?.debug("candidate.filter_evaluated", {
      stage: "filtering",
      candidateId: candidate.id,
      accepted: decision.accepted,
      rejectionReasons: decision.rejectionReasons,
    });
    if (decision.accepted) accepted.push(candidate);
    else decision.rejectionReasons.forEach((reason) => { rejectionCounts[reason] = (rejectionCounts[reason] || 0) + 1; });
  });
  logger?.info("candidates.filtered", {
    stage: "filtering",
    inputCount: candidates.length,
    acceptedCount: accepted.length,
    rejectedCount: candidates.length - accepted.length,
    rejectionCounts,
    activeFilterKeys: Object.keys(filters),
  });
  return accepted;
};

const combinations = (list, size, start = 0, prefix = [], result = []) => {
  if (prefix.length === size) { result.push(prefix); return result; }
  for (let index = start; index < list.length; index += 1) combinations(list, size, index + 1, [...prefix, list[index]], result);
  return result;
};

const diversifyMatches = (matches, limit = 5, logger) => {
  const remaining = [...matches];
  const selected = [];
  while (remaining.length && selected.length < limit) {
    let bestIndex = 0;
    let bestAdjusted = -Infinity;
    remaining.forEach((match, index) => {
      const tags = new Set(match.participants?.[0]?.tags || []);
      const maximumSimilarity = selected.reduce((maximum, chosen) => {
        const other = new Set(chosen.participants?.[0]?.tags || []);
        const union = new Set([...tags, ...other]);
        const intersection = [...tags].filter((tag) => other.has(tag)).length;
        return Math.max(maximum, union.size ? intersection / union.size : 0);
      }, 0);
      const adjusted = match.rankScore - maximumSimilarity * 0.06;
      if (adjusted > bestAdjusted) { bestAdjusted = adjusted; bestIndex = index; }
    });
    const chosen = remaining.splice(bestIndex, 1)[0];
    selected.push(chosen);
    logger?.debug("candidate.diversification_selected", {
      stage: "diversification",
      position: selected.length,
      candidateId: chosen.participants?.[0]?.id,
      rawRankScore: chosen.rankScore,
      adjustedRankScore: Number(bestAdjusted.toFixed(4)),
    });
  }
  logger?.info("matches.diversified", { stage: "diversification", inputCount: matches.length, outputCount: selected.length });
  return selected;
};

const pairMatches = ({ seeker, availability, candidates, intent, minimum, requestId, debug, logger }) => {
  const allProfiles = [seeker, ...candidates];
  const idf = buildIdf(allProfiles);
  logger?.debug("ranking.idf_built", { stage: "ranking", profileCount: allProfiles.length, uniqueTagCount: idf.size });
  const ranked = candidates.map((candidate) => {
  const schedule = candidate.availability || [];
  const bitmapOverlap = compareSchedules([availability, schedule]);
  if (bitmapOverlap.longestOverlapMinutes < minimum) {
    logger?.debug("candidate.schedule_rejected", {
      stage: "schedule",
      candidateId: candidate.id,
      candidateSlotCount: schedule.length,
      overlapMinutes: bitmapOverlap.overlapMinutes,
      longestOverlapMinutes: bitmapOverlap.longestOverlapMinutes,
      requiredLongestOverlapMinutes: minimum,
    });
    return null;
  }
  const rank = rankCandidate({ viewer: seeker, candidate, allProfiles, idf, intent, requestId });
  const intervals = intersectSchedules([sortSlotsAscending(availability), sortSlotsAscending(schedule)]);
  const intervalMinutes = totalDurationMinutes(intervals);
  debug.push(`[matchService] candidate=${candidate.id} longestOverlap=${bitmapOverlap.longestOverlapMinutes} affinity=${rank.profileAffinity} reciprocal=${rank.reciprocalAffinity}`);
  logger?.debug("candidate.ranked", {
    stage: "ranking",
    candidateId: candidate.id,
    schedule: {
      candidateSlotCount: schedule.length,
      overlapMinutes: bitmapOverlap.overlapMinutes,
      longestOverlapMinutes: bitmapOverlap.longestOverlapMinutes,
    },
    scores: {
      profileAffinity: rank.profileAffinity,
      reciprocalAffinity: rank.reciprocalAffinity,
      graphScore: rank.graphScore,
      confidence: rank.confidence,
      finalScore: rank.finalScore,
    },
    diagnostics: rank.diagnostics,
    sharedTags: rank.sharedTags,
    isExploration: rank.isExploration,
  });
  return {
    matchId: `${seeker.id || "anonymous"}::${candidate.id}`, requestId, matchVersion: "2.0", version: "2.0",
    participants: [pickCandidateProfile(candidate)], overlapMinutes: bitmapOverlap.overlapMinutes,
    longestOverlapMinutes: bitmapOverlap.longestOverlapMinutes,
    overlappingAvailability: serializeIntervals(intervals),
    sharedInterests: (seeker.interests || []).filter((item) => (candidate.interests || []).some((other) => other.toLowerCase() === item.toLowerCase())),
    sharedHobbies: (seeker.hobbies || []).filter((item) => (candidate.hobbies || []).some((other) => other.toLowerCase() === item.toLowerCase())),
    sharedTags: rank.sharedTags, profileAffinity: rank.profileAffinity, reciprocalAffinity: rank.reciprocalAffinity,
    affinity: rank.profileAffinity, reciprocal: rank.reciprocalAffinity,
    graphScore: rank.graphScore, confidence: rank.confidence, isExploration: rank.isExploration, exploration: rank.isExploration,
    explanations: rank.explanations, compatibilityScore: Math.round(45 + rank.finalScore * 54),
    compatibilityBreakdown: { schedule: 1, affinity: rank.profileAffinity, reciprocal: rank.reciprocalAffinity, graph: rank.graphScore },
    compatibilitySummary: `${bitmapOverlap.longestOverlapMinutes} consecutive shared minutes - ${rank.explanations[0]}`,
    candidateScheduleSummary: summarizeSchedule(sortSlotsAscending(schedule)),
    semanticSimilarity: rank.profileAffinity, semanticHighlight: rank.explanations[0],
    rankScore: rank.finalScore, rawIntervalOverlapMinutes: intervalMinutes,
  };
  }).filter(Boolean).sort((a, b) => b.rankScore - a.rankScore || b.longestOverlapMinutes - a.longestOverlapMinutes || a.participants[0].id.localeCompare(b.participants[0].id));
  logger?.info("candidates.ranked", {
    stage: "ranking",
    inputCount: candidates.length,
    scheduleEligibleCount: ranked.length,
    scheduleRejectedCount: candidates.length - ranked.length,
    topCandidates: ranked.slice(0, 10).map((match) => ({ candidateId: match.participants[0].id, rankScore: match.rankScore })),
  });
  return diversifyMatches(ranked, 5, logger);
};

const groupMatches = async ({ seeker, availability, candidates, mode, minimum, requestId, debug, logger }) => {
  const size = mode === "one-on-two" ? 2 : 3;
  const finishAffinity = logger?.timer("group.affinity_context_built", { stage: "ranking", candidateCount: candidates.length });
  const affinityContext = await buildAffinityContext({ seeker, candidates, logger });
  finishAffinity?.({ outcome: "success" });
  const groups = combinations(candidates, size);
  logger?.info("groups.generated", { stage: "grouping", groupSize: size, combinationCount: groups.length });
  const eligibleMatches = groups.map((group) => {
    const overlap = compareSchedules([availability, ...group.map((candidate) => candidate.availability || [])]);
    if (overlap.longestOverlapMinutes < minimum) {
      logger?.debug("group.schedule_rejected", { stage: "schedule", candidateIds: group.map((candidate) => candidate.id), longestOverlapMinutes: overlap.longestOverlapMinutes, requiredLongestOverlapMinutes: minimum });
      return null;
    }
    const intervals = intersectSchedules([sortSlotsAscending(availability), ...group.map((candidate) => sortSlotsAscending(candidate.availability || []))]);
    const compatibility = computeGroupCompatibility({ overlapMinutes: overlap.overlapMinutes, participants: group, affinityContext, minimumOverlapTarget: minimum });
    debug.push(`[matchService] group=${group.map((candidate) => candidate.id).join("+")} longestOverlap=${overlap.longestOverlapMinutes}`);
    logger?.debug("group.ranked", { stage: "ranking", candidateIds: group.map((candidate) => candidate.id), longestOverlapMinutes: overlap.longestOverlapMinutes, compatibilityScore: compatibility.score, breakdown: compatibility.breakdown });
    return {
      matchId: `${seeker.id || "anonymous"}::group::${group.map((candidate) => candidate.id).join("+")}`,
      requestId, matchVersion: "2.0", version: "2.0", participants: group.map(pickCandidateProfile), overlapMinutes: overlap.overlapMinutes,
      longestOverlapMinutes: overlap.longestOverlapMinutes, overlappingAvailability: serializeIntervals(intervals),
      sharedInterests: compatibility.sharedInterests, sharedHobbies: compatibility.sharedHobbies, sharedTags: [],
      compatibilityScore: compatibility.score, compatibilityBreakdown: compatibility.breakdown,
      compatibilitySummary: compatibility.summary, confidence: 0.5, explanations: ["Everyone has a consecutive shared availability block"],
      isExploration: false, profileAffinity: compatibility.breakdown.affinity, reciprocalAffinity: compatibility.breakdown.affinity, graphScore: 0,
      exploration: false, affinity: compatibility.breakdown.affinity, reciprocal: compatibility.breakdown.affinity,
    };
  }).filter(Boolean).sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  const matches = eligibleMatches.slice(0, 5);
  logger?.info("groups.ranked", { stage: "ranking", inputCount: groups.length, eligibleCount: eligibleMatches.length, returnedCount: matches.length });
  return matches;
};

const findMatches = async ({ seeker = {}, availability, mode, filters = {}, intent, minOverlapMinutes, requestId = crypto.randomUUID(), logger }) => {
  if (!Array.isArray(availability) || !availability.length) throw new Error("availability must be a non-empty array of time slots");
  const minimum = normalizeMinimumOverlap(minOverlapMinutes);
  const requestedMode = normalizedMode(mode);
  logger?.info("pipeline.started", { stage: "pipeline", matchVersion: "2.0", requestedMode, minimumOverlapMinutes: minimum });
  const dataset = await fetchMatchmakingDataset({ seekerId: seeker.id, logger });
  const mergedSeeker = mergeSeekerProfile(seeker, dataset.seekerProfile || {});
  logger?.debug("seeker.merged", { stage: "profile", seekerId: mergedSeeker.id || null, signalCounts: { interests: mergedSeeker.interests.length, hobbies: mergedSeeker.hobbies.length, classes: mergedSeeker.classes.length, tags: mergedSeeker.tags.length, openTo: mergedSeeker.openTo.length }, persistedProfileFound: Boolean(dataset.seekerProfile) });
  const candidates = applyFilters(dataset.candidates, filters, logger);
  const debug = [`[matchService] request=${requestId} version=2.0 mode=${requestedMode} minOverlap=${minimum}`, `[matchService] dataSource=${dataset.usesSampleData ? "sample-dataset" : "supabase"} candidates=${candidates.length}`];
  const matches = requestedMode === "one-on-one"
    ? pairMatches({ seeker: mergedSeeker, availability, candidates, intent, minimum, requestId, debug, logger })
    : await groupMatches({ seeker: mergedSeeker, availability, candidates, mode: requestedMode, minimum, requestId, debug, logger });
  logger?.info("pipeline.completed", { stage: "pipeline", outcome: matches.length ? "matches_found" : "no_matches", datasetSize: dataset.totalCandidates, filteredCandidateCount: candidates.length, matchCount: matches.length });
  return {
    requestId, matchVersion: "2.0", version: "2.0", mode: requestedMode, generatedAt: new Date().toISOString(),
    seeker: { id: mergedSeeker.id, name: mergedSeeker.name, interests: mergedSeeker.interests || [] },
    availabilitySummary: { ...summarizeSchedule(sortSlotsAscending(availability)), minimumConsecutiveMinutes: minimum },
    datasetSize: dataset.totalCandidates, matches, debug,
    emptyReason: matches.length ? null : `No profiles have at least ${minimum} consecutive shared minutes with these filters.`,
  };
};

module.exports = { findMatches };
