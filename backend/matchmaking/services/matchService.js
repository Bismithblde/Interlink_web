const { fetchMatchmakingDataset } = require("../data/profileRepository");
const {
  sortSlotsAscending,
  intersectSchedules,
  totalDurationMinutes,
  serializeIntervals,
  summarizeSchedule,
} = require("../utils/scheduleUtils");
const {
  buildAffinityContext,
  computeCompatibilityScore,
  computeGroupCompatibility,
  buildCompatibilitySummary,
} = require("../utils/affinityUtils");

const SUPPORTED_MODES = {
  "one-on-one": "one-on-one",
  "1-on-1": "one-on-one",
  one_on_one: "one-on-one",
  "one-on-three": "one-on-three",
  "1-on-3": "one-on-three",
  one_on_three: "one-on-three",
};

const getNormalizedMode = (mode) => {
  if (!mode) return SUPPORTED_MODES["one-on-one"];
  const normalizedKey = `${mode}`.toLowerCase().replace(/[\s]/g, "-");
  return SUPPORTED_MODES[normalizedKey] || SUPPORTED_MODES["one-on-one"];
};

const pickCandidateProfile = (candidate) => ({
  id: candidate.id,
  name: candidate.name,
  email: candidate.email,
  major: candidate.major,
  graduationYear: candidate.graduationYear,
  interests: candidate.interests,
  bio: candidate.bio,
  hobbies: candidate.hobbies || [],
  classes: candidate.classes || [],
  funFact: candidate.funFact,
  favoriteSpot: candidate.favoriteSpot,
  vibeCheck: candidate.vibeCheck,
  instagram: candidate.instagram,
});

const computeSharedInterests = (seekerInterests = [], candidates) => {
  const normalizedSeeker = new Set(
    seekerInterests.map((interest) => interest.toLowerCase())
  );
  if (normalizedSeeker.size === 0) return [];

  const shared = candidates
    .flatMap((candidate) => candidate.interests || [])
    .filter((interest) => normalizedSeeker.has(interest.toLowerCase()));

  return Array.from(new Set(shared));
};

const combinations = (
  list,
  groupSize,
  startIndex = 0,
  prefix = [],
  acc = []
) => {
  if (prefix.length === groupSize) {
    acc.push(prefix.map((index) => list[index]));
    return acc;
  }

  for (let i = startIndex; i < list.length; i += 1) {
    combinations(list, groupSize, i + 1, [...prefix, i], acc);
  }

  return acc;
};

const sortMatches = (matches) =>
  matches.sort((a, b) => {
    if (
      typeof b.compatibilityScore === "number" &&
      typeof a.compatibilityScore === "number" &&
      b.compatibilityScore !== a.compatibilityScore
    ) {
      return b.compatibilityScore - a.compatibilityScore;
    }
    return b.overlapMinutes - a.overlapMinutes;
  });

const buildMatchPayload = ({
  mode,
  seeker,
  matches,
  datasetSize,
  scheduleSummary,
  debugLog = [],
  emptyReason = null,
}) => ({
  mode,
  generatedAt: new Date().toISOString(),
  seeker: {
    id: seeker.id,
    name: seeker.name,
    interests: seeker.interests || [],
  },
  availabilitySummary: scheduleSummary,
  datasetSize,
  matches,
  debug: debugLog,
  emptyReason,
});

const computePairMatches = ({
  seeker,
  seekerSchedule,
  candidates,
  affinityContext,
  debugLog,
}) => {
  const matches = candidates
    .map((candidate) => {
      const candidateSchedule = sortSlotsAscending(
        candidate.availability || []
      );
      const overlappingIntervals = intersectSchedules([
        seekerSchedule,
        candidateSchedule,
      ]);
      const overlapMinutes = totalDurationMinutes(overlappingIntervals);

      if (overlapMinutes <= 0) {
        return null;
      }

      const sharedInterests = computeSharedInterests(seeker.interests, [
        candidate,
      ]);
      const affinity =
        affinityContext.candidateAffinities.get(candidate.id) || {};

      debugLog.push(
        `[matchService] candidateProfile id=${
          candidate.id
        } hobbies=${JSON.stringify(
          candidate.hobbies || []
        )} interests=${JSON.stringify(
          candidate.interests || []
        )} classes=${JSON.stringify(candidate.classes || [])}`
      );
      debugLog.push(
        `[matchService] evaluating candidate=${
          candidate.id
        } overlapMinutes=${overlapMinutes} sharedInterests=${
          sharedInterests.length
        } sharedHobbies=${(affinity.sharedHobbies || []).length} similarity=${
          affinity.semanticSimilarity ?? 0
        }`
      );

      const compatibility = computeCompatibilityScore({
        overlapMinutes,
        affinity,
      });
      const clusterLabel = affinityContext.getClusterLabel(
        affinity.clusterIndex ?? affinityContext.seekerClusterId
      );

      return {
        matchId: `${seeker.id || "anonymous"}::${candidate.id}`,
        participants: [pickCandidateProfile(candidate)],
        overlapMinutes,
        overlappingAvailability: serializeIntervals(overlappingIntervals),
        sharedInterests,
        sharedHobbies: affinity.sharedHobbies || [],
        compatibilityScore: compatibility.score,
        compatibilityBreakdown: compatibility.breakdown,
        compatibilitySummary: buildCompatibilitySummary({
          scheduleMinutes: overlapMinutes,
          semanticHighlight: affinity.semanticHighlight,
          sharedHobbies: affinity.sharedHobbies,
          sharedInterests,
        }),
        clusterId: affinity.clusterId,
        clusterLabel,
        traitHighlights: affinity.traitHighlights || [],
        candidateScheduleSummary: summarizeSchedule(candidateSchedule),
        semanticSimilarity: affinity.semanticSimilarity,
        semanticHighlight: affinity.semanticHighlight,
      };
    })
    .filter(Boolean);

  return sortMatches(matches).slice(0, 5);
};

const computeGroupMatches = ({
  seeker,
  seekerSchedule,
  candidates,
  groupSize = 3,
  affinityContext,
  debugLog,
}) => {
  const candidateSchedules = candidates.map((candidate) => ({
    candidate,
    schedule: sortSlotsAscending(candidate.availability || []),
  }));

  const candidateCombos = combinations(candidateSchedules, groupSize);

  const matches = candidateCombos
    .map((combo) => {
      const schedules = combo.map((entry) => entry.schedule);
      const overlappingIntervals = intersectSchedules([
        seekerSchedule,
        ...schedules,
      ]);
      const overlapMinutes = totalDurationMinutes(overlappingIntervals);

      if (overlapMinutes <= 0) {
        return null;
      }

      const participatingCandidates = combo.map((entry) => entry.candidate);
      const groupProfiles = participatingCandidates.map(pickCandidateProfile);
      const compatibility = computeGroupCompatibility({
        overlapMinutes,
        participants: groupProfiles,
        affinityContext,
      });

      debugLog.push(
        `[matchService] group combo overlapMinutes=${overlapMinutes} sharedInterests=${compatibility.sharedInterests.length} sharedHobbies=${compatibility.sharedHobbies.length} score=${compatibility.score}`
      );
      const sharedInterests =
        compatibility.sharedInterests && compatibility.sharedInterests.length
          ? compatibility.sharedInterests
          : computeSharedInterests(seeker.interests, participatingCandidates);

      return {
        matchId: `${seeker.id || "anonymous"}::group::${participatingCandidates
          .map((candidate) => candidate.id)
          .join("+")}`,
        participants: groupProfiles,
        overlapMinutes,
        overlappingAvailability: serializeIntervals(overlappingIntervals),
        sharedInterests,
        sharedHobbies: compatibility.sharedHobbies,
        compatibilityScore: compatibility.score,
        compatibilityBreakdown: compatibility.breakdown,
        compatibilitySummary: compatibility.summary,
        clusterLabel:
          compatibility.clusterLabels && compatibility.clusterLabels.length
            ? compatibility.clusterLabels.join(" • ")
            : affinityContext.getClusterLabel(affinityContext.seekerClusterId),
        traitHighlights: participatingCandidates.flatMap((candidate) => {
          const affinity = affinityContext.candidateAffinities.get(
            candidate.id
          );
          return affinity?.traitHighlights || [];
        }),
        candidateScheduleSummaries: participatingCandidates.map(
          (candidate, idx) => ({
            candidateId: candidate.id,
            summary: summarizeSchedule(combo[idx].schedule),
          })
        ),
        semanticSimilarity: compatibility.breakdown.affinity,
        semanticHighlight: compatibility.semanticHighlight,
      };
    })
    .filter(Boolean);

  return sortMatches(matches).slice(0, 5);
};

/**
 * Naive matchmaking implementation used to unlock frontend work. Once the
 * production schedule ingestion pipeline lands we should replace this with a
 * persistence-backed service.
 */
const mergeArrays = (...arrays) =>
  Array.from(
    new Set(
      arrays
        .filter(Array.isArray)
        .flat()
        .map((value) => `${value}`.trim())
        .filter((value) => value.length > 0)
    )
  );

const mergeSeekerProfile = (incoming = {}, persisted = {}) => ({
  id: incoming.id || persisted.id,
  name: incoming.name || persisted.name,
  email: incoming.email || persisted.email,
  interests: mergeArrays(persisted.interests, incoming.interests),
  hobbies: mergeArrays(persisted.hobbies, incoming.hobbies),
  classes: mergeArrays(persisted.classes, incoming.classes),
  major: incoming.major || persisted.major,
  graduationYear: incoming.graduationYear || persisted.graduationYear,
  instagram: incoming.instagram || persisted.instagram,
  bio: incoming.bio || persisted.bio,
  funFact: incoming.funFact || persisted.funFact,
  favoriteSpot: incoming.favoriteSpot || persisted.favoriteSpot,
  vibeCheck: incoming.vibeCheck || persisted.vibeCheck,
});

const findMatches = async ({ seeker, availability, mode, filters = {} }) => {
  if (
    !availability ||
    !Array.isArray(availability) ||
    availability.length === 0
  ) {
    throw new Error("availability must be a non-empty array of time slots");
  }

  const normalizedMode = getNormalizedMode(mode);
  const seekerSchedule = sortSlotsAscending(availability);
  const debugLog = [
    `[matchService] seeker=${seeker?.id || "anonymous"} slots=${
      availability.length
    } mode=${normalizedMode}`,
  ];

  const dataset = await fetchMatchmakingDataset({
    seekerId: seeker?.id,
  });

  debugLog.push(
    `[matchService] dataSource=${
      dataset.usesSampleData ? "sample-dataset" : "supabase"
    } candidates=${dataset.candidates.length}`
  );

  const mergedSeeker = mergeSeekerProfile(seeker, dataset.seekerProfile || {});
  debugLog.push(
    `[matchService] mergedSeeker interests=${JSON.stringify(
      mergedSeeker.interests || []
    )} hobbies=${JSON.stringify(
      mergedSeeker.hobbies || []
    )} classes=${JSON.stringify(mergedSeeker.classes || [])}`
  );

  const filteredCandidates = dataset.candidates.filter((candidate) => {
    if (!filters || Object.keys(filters).length === 0) return true;

    if (filters.interests && filters.interests.length) {
      const candidateInterests = candidate.interests || [];
      const matchesInterest = filters.interests.some((interest) =>
        candidateInterests
          .map((value) => value.toLowerCase())
          .includes(interest.toLowerCase())
      );
      if (!matchesInterest) return false;
    }

    if (filters.majors && filters.majors.length) {
      if (!candidate.major || !filters.majors.includes(candidate.major)) {
        return false;
      }
    }

    if (Array.isArray(filters.classes) && filters.classes.length) {
      const candidateClasses = (candidate.classes || []).map((course) =>
        `${course}`.toLowerCase()
      );
      const matchesCourse = filters.classes.some((course) =>
        candidateClasses.includes(`${course}`.toLowerCase())
      );
      if (!matchesCourse) {
        return false;
      }
    }

    return true;
  });

  debugLog.push(
    `[matchService] filteredCandidates=${filteredCandidates.length} totalCandidates=${dataset.totalCandidates}`
  );

  if (filters.requireSameCourse) {
    debugLog.push(
      `[matchService] requireSameCourse active with courses=${JSON.stringify(
        filters.classes || []
      )}`
    );
  }

  let candidatesToEvaluate = filteredCandidates;
  const hobbyQuery =
    filters && typeof filters.hobbyQuery === "string"
      ? filters.hobbyQuery.toLowerCase()
      : null;

  if (hobbyQuery) {
    candidatesToEvaluate = filteredCandidates.filter((candidate) =>
      (candidate.hobbies || []).some((hobby) =>
        hobby.toLowerCase().includes(hobbyQuery)
      )
    );
    debugLog.push(
      `[matchService] hobbyQuery=${hobbyQuery} filtered=${candidatesToEvaluate.length}`
    );
  }

  const scheduleSummary = summarizeSchedule(seekerSchedule);

  let emptyReason = null;

  const affinityContext = await buildAffinityContext({
    seeker: mergedSeeker,
    candidates: candidatesToEvaluate,
  });

  debugLog.push(
    `[matchService] affinity strategy=${affinityContext.metadata.similarityStrategy} assignments=${affinityContext.metadata.assignments}`.replace(
      /\s+/g,
      " "
    )
  );

  if (normalizedMode === "one-on-three") {
    if (candidatesToEvaluate.length < 3) {
      emptyReason = "Not enough candidates available to form a group pod yet.";
      debugLog.push(
        "[matchService] insufficient candidates for one-on-three matching"
      );
      return buildMatchPayload({
        mode: normalizedMode,
        seeker: mergedSeeker,
        matches: [],
        datasetSize: dataset.totalCandidates,
        scheduleSummary,
        debugLog,
        emptyReason,
      });
    }

    const matches = computeGroupMatches({
      seeker: mergedSeeker,
      seekerSchedule,
      candidates: candidatesToEvaluate,
      groupSize: 3,
      affinityContext,
      debugLog,
    });

    if (matches.length === 0) {
      emptyReason =
        "We couldn't find a shared time block with enough people for a pod yet.";
      debugLog.push("[matchService] group matching produced zero results");
    }

    console.debug("[matchService] group matches summary", {
      seeker: mergedSeeker?.id || "anonymous",
      matchCount: matches.length,
      debugLog,
    });

    return buildMatchPayload({
      mode: normalizedMode,
      seeker: mergedSeeker,
      matches,
      datasetSize: dataset.totalCandidates,
      scheduleSummary,
      debugLog,
      emptyReason,
    });
  }

  const matches = computePairMatches({
    seeker: mergedSeeker,
    seekerSchedule,
    candidates: candidatesToEvaluate,
    affinityContext,
    debugLog,
  });

  if (matches.length === 0) {
    emptyReason = candidatesToEvaluate.length
      ? "No overlapping schedule blocks with the current filters. Try widening your availability or filters."
      : "No candidates match your current filters yet.";
    debugLog.push("[matchService] pair matching produced zero results");
  }

  console.debug("[matchService] pair matches summary", {
    seeker: mergedSeeker?.id || "anonymous",
    matchCount: matches.length,
    debugLog,
  });

  return buildMatchPayload({
    mode: normalizedMode,
    seeker: mergedSeeker,
    matches,
    datasetSize: dataset.totalCandidates,
    scheduleSummary,
    debugLog,
    emptyReason,
  });
};

module.exports = {
  findMatches,
};
