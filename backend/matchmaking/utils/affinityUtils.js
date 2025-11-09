const MAX_HIGHLIGHT_LENGTH = 140;
const STOP_WORDS = new Set([
  "and",
  "the",
  "for",
  "with",
  "you",
  "your",
  "about",
  "this",
  "that",
  "from",
  "have",
  "just",
  "like",
  "they",
  "their",
  "them",
  "are",
  "was",
  "were",
  "she",
  "him",
  "her",
  "his",
  "its",
  "it's",
  "cant",
  "can't",
  "dont",
  "don't",
  "but",
  "into",
  "over",
  "under",
  "also",
  "really",
  "very",
  "more",
  "most",
  "some",
  "any",
  "each",
  "every",
  "other",
  "than",
  "then",
  "will",
  "what",
  "when",
  "where",
  "why",
  "who",
  "how",
  "been",
  "because",
  "year",
  "years",
  "student",
  "students",
  "major",
  "class",
  "classes",
  "study",
  "studying",
  "love",
  "enjoy",
  "enjoys",
  "enjoying",
  "likes",
  "liked",
  "looking",
  "forward",
]);

const tokenize = (text) => {
  if (typeof text !== "string") return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
};

const buildFrequencyMap = (tokens = []) => {
  const map = new Map();
  tokens.forEach((token) => {
    map.set(token, (map.get(token) || 0) + 1);
  });
  return map;
};

const toVector = (tokens = []) => {
  const frequencies = buildFrequencyMap(tokens);
  let magnitudeSquared = 0;
  frequencies.forEach((count) => {
    magnitudeSquared += count * count;
  });
  return {
    frequencies,
    magnitude: Math.sqrt(magnitudeSquared),
  };
};

const cosineFromVectors = (a, b) => {
  if (!a || !b || a.magnitude === 0 || b.magnitude === 0) return 0;
  const [smaller, larger] =
    a.frequencies.size < b.frequencies.size
      ? [a.frequencies, b.frequencies]
      : [b.frequencies, a.frequencies];
  let dot = 0;
  smaller.forEach((count, token) => {
    if (!larger.has(token)) return;
    dot += count * larger.get(token);
  });
  if (dot === 0) return 0;
  return dot / (a.magnitude * b.magnitude);
};

const toList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((entry) => `${entry}`.trim())
      .filter((entry) => entry.length > 0);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return [];
};

const intersectLists = (source = [], target = []) => {
  if (!Array.isArray(source) || !Array.isArray(target)) return [];
  const normalizedSource = new Set(
    source.map((value) => `${value}`.trim().toLowerCase()).filter(Boolean)
  );
  if (!normalizedSource.size) return [];
  const matches = target
    .map((value) => `${value}`.trim())
    .filter((value) => value.length > 0 && normalizedSource.has(value.toLowerCase()));
  return Array.from(new Set(matches));
};

const sanitizeSentence = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const buildProfileDocument = (profile = {}) => {
  const segments = [];
  if (profile.name) segments.push(`Name: ${profile.name}`);
  if (profile.major) segments.push(`Major: ${profile.major}`);
  if (profile.graduationYear) segments.push(`Graduation year: ${profile.graduationYear}`);
  const interests = toList(profile.interests);
  if (interests.length) segments.push(`Interests: ${interests.join(", ")}`);
  const hobbies = toList(profile.hobbies);
  if (hobbies.length) segments.push(`Hobbies: ${hobbies.join(", ")}`);
  const classes = toList(profile.classes);
  if (classes.length) segments.push(`Classes: ${classes.join(", ")}`);
  const bio = sanitizeSentence(profile.bio);
  if (bio) segments.push(`Bio: ${bio}`);
  const funFact = sanitizeSentence(profile.funFact);
  if (funFact) segments.push(`Fun fact: ${funFact}`);
  const vibeCheck = sanitizeSentence(profile.vibeCheck);
  if (vibeCheck) segments.push(`Vibe: ${vibeCheck}`);
  const favoriteSpot = sanitizeSentence(profile.favoriteSpot);
  if (favoriteSpot) segments.push(`Favorite spot: ${favoriteSpot}`);

  if (!segments.length) return null;
  return segments.join("\n");
};

const buildTokenVector = (profile = {}) => {
  const document = buildProfileDocument(profile);
  if (!document) return null;
  const listTokens = [
    ...toList(profile.hobbies),
    ...toList(profile.interests),
    ...toList(profile.classes),
    ...toList(profile.clubs),
  ]
    .map((entry) => `${entry}`.toLowerCase())
    .filter(Boolean)
    .flatMap((entry) => entry.split(/\s+/).filter((token) => token.length > 2));

  const tokens = tokenize(document).concat(listTokens);
  if (!tokens.length) return null;
  return toVector(tokens);
};

const buildSemanticHighlight = ({ candidate, seeker, sharedHobbies, sharedInterests }) => {
  if (sharedHobbies && sharedHobbies.length) {
    return `Shared hobby: ${sharedHobbies[0]}`;
  }
  if (sharedInterests && sharedInterests.length) {
    return `Overlap on ${sharedInterests.slice(0, 2).join(", ")}`;
  }
  if (candidate.vibeCheck) {
    return candidate.vibeCheck.length > MAX_HIGHLIGHT_LENGTH
      ? `${candidate.vibeCheck.slice(0, MAX_HIGHLIGHT_LENGTH - 1)}…`
      : candidate.vibeCheck;
  }
  if (candidate.funFact) {
    return candidate.funFact.length > MAX_HIGHLIGHT_LENGTH
      ? `${candidate.funFact.slice(0, MAX_HIGHLIGHT_LENGTH - 1)}…`
      : candidate.funFact;
  }
  if (candidate.bio) {
    return candidate.bio.length > MAX_HIGHLIGHT_LENGTH
      ? `${candidate.bio.slice(0, MAX_HIGHLIGHT_LENGTH - 1)}…`
      : candidate.bio;
  }
  if (seeker?.favoriteSpot && candidate.favoriteSpot && seeker.favoriteSpot === candidate.favoriteSpot) {
    return `Both love ${candidate.favoriteSpot}`;
  }
  if (candidate.favoriteSpot) {
    return `Favorite spot: ${candidate.favoriteSpot}`;
  }
  return null;
};

const baseAffinityEntry = ({ candidate, sharedHobbies, sharedInterests, sameMajor, seeker }) => ({
  candidate,
  clusterIndex: 0,
  clusterId: "cluster-1",
  semanticSimilarity: 0,
  semanticHighlight: buildSemanticHighlight({
    candidate,
    seeker,
    sharedHobbies,
    sharedInterests,
  }),
  sharedHobbies,
  sharedInterests,
  sameMajor,
  traitHighlights: [],
});

const buildAffinityContext = async ({ seeker = {}, candidates = [] }) => {
  const seekerHobbies = toList(seeker.hobbies);
  const seekerInterests = toList(seeker.interests);

  const affinityMap = new Map();

  candidates.forEach((candidate) => {
    const sharedHobbies = intersectLists(seekerHobbies, candidate.hobbies || []);
    const sharedInterests = intersectLists(seekerInterests, candidate.interests || []);
    const sameMajor = seeker.major && candidate.major && seeker.major === candidate.major;

    affinityMap.set(
      candidate.id,
      baseAffinityEntry({
        candidate,
        sharedHobbies,
        sharedInterests,
        sameMajor,
        seeker,
      })
    );
  });

  const context = {
    candidateAffinities: affinityMap,
    getClusterLabel() {
      return this.metadata.similarityLabel || "Schedule Match";
    },
    metadata: {
      similarityStrategy: "baseline",
      similarityLabel: "Schedule Match",
      assignments: 0,
    },
  };

  const seekerVector = buildTokenVector(seeker);
  if (!seekerVector) {
    console.info(
      "[affinityUtils] seeker profile missing descriptive data; semantic similarity will remain at 0"
    );
    return context;
  }

  let similaritiesAssigned = 0;

  candidates.forEach((candidate) => {
    const entry = affinityMap.get(candidate.id);
    if (!entry) return;

    const candidateVector = buildTokenVector(candidate);
    if (!candidateVector) return;

    const textSimilarity = Math.max(
      0,
      Math.min(1, cosineFromVectors(seekerVector, candidateVector))
    );

    const sharedHobbies = entry.sharedHobbies || [];
    const sharedInterests = entry.sharedInterests || [];
    const listOverlapScore = Math.min(
      0.35,
      sharedHobbies.length * 0.12 + sharedInterests.length * 0.08
    );

    const combinedSimilarity = Math.max(
      textSimilarity,
      Math.min(1, textSimilarity * 0.7 + listOverlapScore)
    );

    entry.semanticSimilarity =
      combinedSimilarity > 0 ? Number(combinedSimilarity.toFixed(3)) : 0;

    entry.semanticHighlight =
      buildSemanticHighlight({
        candidate,
        seeker,
        sharedHobbies,
        sharedInterests,
      }) || entry.semanticHighlight;

    if (entry.semanticSimilarity > 0) {
      similaritiesAssigned += 1;
    }
  });

  context.metadata.similarityStrategy = "profile-tokens";
  context.metadata.similarityLabel =
    similaritiesAssigned > 0 ? "Profile Match" : "Schedule Match";
  context.metadata.assignments = similaritiesAssigned;

  console.info("[affinityUtils] semantic similarity computed locally", {
    strategy: context.metadata.similarityStrategy,
    candidatesProcessed: candidates.length,
    similaritiesAssigned,
  });

  return context;
};

const buildCompatibilitySummary = ({
  scheduleMinutes,
  semanticHighlight,
  sharedHobbies,
  sharedInterests,
}) => {
  let summary = `${Math.round(scheduleMinutes)} shared minutes available`;
  if (semanticHighlight) {
    summary += ` · ${semanticHighlight}`;
    return summary;
  }
  if (sharedHobbies && sharedHobbies.length) {
    summary += ` · Shared hobby: ${sharedHobbies[0]}`;
    return summary;
  }
  if (sharedInterests && sharedInterests.length) {
    summary += ` · Shared interest: ${sharedInterests[0]}`;
  }
  return summary;
};

const computeCompatibilityScore = ({
  overlapMinutes,
  minimumOverlapTarget = 60,
  affinity,
}) => {
  const target = Math.max(minimumOverlapTarget, 1);
  const ratio = Math.min(overlapMinutes / target, 2);
  const scheduleComponent = Math.min(ratio / 2, 1);

  const semanticSimilarity = affinity?.semanticSimilarity || 0;
  const hobbyCount = Array.isArray(affinity?.sharedHobbies)
    ? affinity.sharedHobbies.length
    : 0;
  const interestCount = Array.isArray(affinity?.sharedInterests)
    ? affinity.sharedInterests.length
    : 0;
  const majorBonus = affinity?.sameMajor ? 0.04 : 0;

  const semanticComponent = Math.min(semanticSimilarity, 1);
  const hobbyComponent = Math.min(hobbyCount * 0.05, 0.2);
  const interestComponent = Math.min(interestCount * 0.04, 0.2);

  const baseScore = 45 + scheduleComponent * 40;
  const affinityBoost = (semanticComponent + hobbyComponent + interestComponent + majorBonus) * 20;
  const score = Math.min(99, Math.round(baseScore + affinityBoost));

  return {
    score,
    breakdown: {
      schedule: Number(scheduleComponent.toFixed(3)),
      affinity: Number(semanticComponent.toFixed(3)),
      hobbies: hobbyCount,
      interests: interestCount,
      majorBonus: Number(majorBonus.toFixed(3)),
    },
  };
};

const computeGroupCompatibility = ({
  overlapMinutes,
  participants = [],
  affinityContext,
  minimumOverlapTarget = 90,
}) => {
  const target = Math.max(minimumOverlapTarget, 1);
  const ratio = Math.min(overlapMinutes / target, 2);
  const scheduleComponent = Math.min(ratio / 2, 1);

  const participantAffinities = participants
    .map((participant) => affinityContext.candidateAffinities.get(participant.id))
    .filter(Boolean);

  const semanticSimilarities = participantAffinities.map(
    (entry) => entry.semanticSimilarity || 0
  );
  const averageSemantic = semanticSimilarities.length
    ? semanticSimilarities.reduce((sum, value) => sum + value, 0) /
      semanticSimilarities.length
    : 0;

  const allSharedHobbies = participantAffinities.flatMap((entry) => entry.sharedHobbies || []);
  const allSharedInterests = participantAffinities.flatMap((entry) => entry.sharedInterests || []);

  const summaryHighlight = participantAffinities.find(
    (entry) => entry.semanticHighlight
  )?.semanticHighlight;

  const baseScore = 45 + scheduleComponent * 40;
  const affinityBoost = averageSemantic * 20;
  const hobbyBoost = Math.min(allSharedHobbies.length * 0.05, 0.2) * 20;
  const interestBoost = Math.min(allSharedInterests.length * 0.04, 0.2) * 20;

  const score = Math.min(99, Math.round(baseScore + affinityBoost + hobbyBoost + interestBoost));

  return {
    score,
    breakdown: {
      schedule: Number(scheduleComponent.toFixed(3)),
      affinity: Number(averageSemantic.toFixed(3)),
      hobbies: allSharedHobbies.length,
      interests: allSharedInterests.length,
      majorBonus: 0,
    },
    sharedHobbies: Array.from(new Set(allSharedHobbies)).slice(0, 3),
    sharedInterests: Array.from(new Set(allSharedInterests)).slice(0, 3),
    summary: buildCompatibilitySummary({
      scheduleMinutes: overlapMinutes,
      semanticHighlight: summaryHighlight,
      sharedHobbies: allSharedHobbies,
      sharedInterests: allSharedInterests,
    }),
    semanticHighlight: summaryHighlight,
    clusterLabels: [affinityContext.getClusterLabel()],
  };
};

module.exports = {
  buildAffinityContext,
  computeCompatibilityScore,
  computeGroupCompatibility,
  buildCompatibilitySummary,
};

