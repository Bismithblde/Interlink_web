const crypto = require("node:crypto");

const normalize = (value) => `${value || ""}`.trim().toLowerCase();
const slugify = (value) => normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const unique = (values) => [...new Set((values || []).map(normalize).filter(Boolean))];

const profileTags = (profile = {}) => unique([
  ...(profile.tags || []).map((tag) => typeof tag === "string" ? tag : tag.slug),
  ...(profile.interests || []),
  ...(profile.hobbies || []),
]).map(slugify).filter(Boolean);

const classJaccard = (a = [], b = []) => {
  const left = new Set(unique(a));
  const right = new Set(unique(b));
  const union = new Set([...left, ...right]);
  if (!union.size) return 0;
  let intersection = 0;
  left.forEach((item) => { if (right.has(item)) intersection += 1; });
  return intersection / union.size;
};

const buildIdf = (profiles = []) => {
  const documentCount = Math.max(1, profiles.length);
  const frequency = new Map();
  profiles.forEach((profile) => {
    new Set(profileTags(profile)).forEach((tag) => frequency.set(tag, (frequency.get(tag) || 0) + 1));
  });
  return new Map([...frequency].map(([tag, count]) => [tag, Math.log((documentCount + 1) / (count + 1)) + 1]));
};

const weightedTagAffinity = (a, b, idf) => {
  const left = new Set(profileTags(a));
  const right = new Set(profileTags(b));
  const union = new Set([...left, ...right]);
  let sharedWeight = 0;
  let unionWeight = 0;
  union.forEach((tag) => {
    const weight = idf.get(tag) || 1;
    unionWeight += weight;
    if (left.has(tag) && right.has(tag)) sharedWeight += weight;
  });
  return { score: unionWeight ? sharedWeight / unionWeight : 0, sharedTags: [...left].filter((tag) => right.has(tag)) };
};

const intentCompatibility = (viewer = {}, candidate = {}, requestedIntent) => {
  const intent = normalize(requestedIntent);
  if (!intent) return { towardCandidate: 0.5, towardViewer: 0.5 };
  const candidateOpenTo = unique(candidate.openTo);
  const viewerOpenTo = unique(viewer.openTo);
  const towardCandidate = candidateOpenTo.length ? Number(candidateOpenTo.includes(intent)) : 0.5;
  const towardViewer = viewerOpenTo.length ? Number(viewerOpenTo.includes(intent)) : 0.5;
  return { towardCandidate, towardViewer };
};

const boundedGraphScore = (viewer = {}, candidate = {}) => {
  const viewerConnections = new Set(viewer.connections || []);
  const mutual = (candidate.connections || []).filter((id) => viewerConnections.has(id)).length;
  return Math.min(1, mutual / 3);
};

const deterministicFraction = (...parts) => {
  const digest = crypto.createHash("sha256").update(parts.join("|")).digest();
  return digest.readUInt32BE(0) / 0xffffffff;
};

const rankCandidate = ({ viewer, candidate, allProfiles, idf: suppliedIdf, intent, requestId }) => {
  const idf = suppliedIdf || buildIdf(allProfiles);
  const aToBTags = weightedTagAffinity(viewer, candidate, idf);
  const bToATags = weightedTagAffinity(candidate, viewer, idf);
  const classes = classJaccard(viewer.classes, candidate.classes);
  const affinityAB = 0.9 * aToBTags.score + 0.1 * classes;
  const affinityBA = 0.9 * bToATags.score + 0.1 * classes;
  const intentScore = intentCompatibility(viewer, candidate, intent);
  const directionalAB = 0.75 * affinityAB + 0.25 * intentScore.towardCandidate;
  const directionalBA = 0.75 * affinityBA + 0.25 * intentScore.towardViewer;
  const reciprocalAffinity = Math.sqrt(Math.max(0, directionalAB * directionalBA));
  const graphScore = boundedGraphScore(viewer, candidate);
  const base = 0.85 * reciprocalAffinity + 0.15 * graphScore;
  const recentImpressions = Number(candidate.recentImpressions || 0);
  const fatigueMultiplier = Math.max(0.72, 1 - recentImpressions * 0.04);
  const isExploration = deterministicFraction(requestId, candidate.id) < 0.15;
  const explorationBoost = isExploration ? 0.08 * (1 - base) : 0;
  const finalScore = Math.min(1, base * fatigueMultiplier + explorationBoost);
  const sharedTags = aToBTags.sharedTags;
  const confidence = Math.min(1, 0.4 + Math.min(sharedTags.length, 4) * 0.12 + (classes > 0 ? 0.12 : 0));
  const explanations = [];
  if (sharedTags.length) explanations.push(`Shared interests: ${sharedTags.slice(0, 3).join(", ")}`);
  if (classes > 0) explanations.push("You share at least one class");
  if (graphScore > 0) explanations.push("You have mutual connections");
  if (!explanations.length) explanations.push("A promising profile to explore");
  return {
    profileAffinity: Number(((affinityAB + affinityBA) / 2).toFixed(4)),
    reciprocalAffinity: Number(reciprocalAffinity.toFixed(4)),
    graphScore: Number(graphScore.toFixed(4)),
    confidence: Number(confidence.toFixed(4)),
    sharedTags,
    isExploration,
    finalScore: Number(finalScore.toFixed(4)),
    explanations,
    diagnostics: {
      tagAffinityTowardCandidate: Number(aToBTags.score.toFixed(4)),
      tagAffinityTowardViewer: Number(bToATags.score.toFixed(4)),
      classJaccard: Number(classes.toFixed(4)),
      intentTowardCandidate: intentScore.towardCandidate,
      intentTowardViewer: intentScore.towardViewer,
      directionalTowardCandidate: Number(directionalAB.toFixed(4)),
      directionalTowardViewer: Number(directionalBA.toFixed(4)),
      baseScore: Number(base.toFixed(4)),
      recentImpressions,
      fatigueMultiplier: Number(fatigueMultiplier.toFixed(4)),
      explorationBoost: Number(explorationBoost.toFixed(4)),
    },
  };
};

module.exports = { slugify, profileTags, classJaccard, buildIdf, weightedTagAffinity, rankCandidate };
