process.env.SUPABASE_USE_STUB = "true";

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { createApp } = require("../app");
const { scheduleToBitmap, countBits, compareSchedules, normalizeMinimumOverlap } = require("../matchmaking/utils/bitmapSchedule");
const { rankCandidate } = require("../matchmaking/services/rankingService");
const { validateNewTags, deterministicTags } = require("../matchmaking/services/enrichmentService");
const { findMatches } = require("../matchmaking/services/matchService");
const { createMatchmakingLogger } = require("../matchmaking/utils/matchmakingLogger");

const app = createApp();

describe("Matchmaking v2 domain", () => {
  test("weekly bitmap uses 30-minute blocks and measures consecutive overlap", () => {
    const seeker = [{ start: "2025-01-13T14:00:00.000Z", end: "2025-01-13T16:00:00.000Z" }];
    const candidate = [{ start: "2025-02-03T14:30:00.000Z", end: "2025-02-03T16:30:00.000Z" }];
    assert.equal(countBits(scheduleToBitmap(seeker)), 4);
    const result = compareSchedules([seeker, candidate]);
    assert.equal(result.overlapMinutes, 90);
    assert.equal(result.longestOverlapMinutes, 90);
  });

  test("only supported strict cutoffs are accepted", () => {
    assert.equal(normalizeMinimumOverlap(120), 120);
    assert.throws(() => normalizeMinimumOverlap(45), /30, 60, 90, or 120/);
  });

  test("reciprocal rank uses tags, class affinity, intent, and graph", () => {
    const viewer = { id: "a", tags: ["robotics", "coffee"], classes: ["CS 241"], openTo: ["study-buddy"], connections: ["m1"] };
    const candidate = { id: "b", tags: ["robotics"], classes: ["CS 241"], openTo: ["study-buddy"], connections: ["m1"] };
    const result = rankCandidate({ viewer, candidate, allProfiles: [viewer, candidate], intent: "study-buddy", requestId: "request" });
    assert.ok(result.reciprocalAffinity > 0.5);
    assert.ok(result.graphScore > 0);
    assert.deepEqual(result.sharedTags, ["robotics"]);
    assert.ok(result.explanations.length > 0);
  });

  test("tag creation guardrails require strong grounded non-sensitive proposals", () => {
    const accepted = validateNewTags([
      { label: "Speed Cubing", category: "hobby", confidence: 0.97, evidence: "speed cubing" },
      { label: "Private Email", category: "topic", confidence: 0.99, evidence: "email" },
      { label: "Weak Tag", category: "hobby", confidence: 0.7, evidence: "weak tag" },
    ], "I organize speed cubing meetups. My email is hidden.");
    assert.equal(accepted.length, 1);
    assert.equal(accepted[0].slug, "speed-cubing");
    assert.ok(deterministicTags({ bio: "I study artificial intelligence and play chess" }).some((tag) => tag.slug === "artificial-intelligence"));
  });

  test("structured trace records each matching stage and redacts sensitive fields", async () => {
    const previousLevel = process.env.MATCHMAKING_LOG_LEVEL;
    process.env.MATCHMAKING_LOG_LEVEL = "debug";
    const records = [];
    const requestId = "trace-test-request";
    const logger = createMatchmakingLogger({ requestId, operation: "find_matches", sink: (record) => records.push(record) });
    if (previousLevel === undefined) delete process.env.MATCHMAKING_LOG_LEVEL;
    else process.env.MATCHMAKING_LOG_LEVEL = previousLevel;

    logger.debug("redaction.check", { email: "person@example.edu", profileAffinity: 0.75 });
    const result = await findMatches({
      requestId,
      logger,
      seeker: { id: "trace-seeker", interests: ["ai"] },
      availability: [{ start: "2025-01-15T14:00:00.000Z", end: "2025-01-15T16:00:00.000Z" }],
      mode: "one-on-one",
      filters: {},
    });

    assert.equal(result.requestId, requestId);
    assert.ok(records.every((record) => record.requestId === requestId));
    assert.ok(records.some((record) => record.event === "dataset.source_selected"));
    assert.ok(records.some((record) => record.event === "candidates.filtered"));
    assert.ok(records.some((record) => record.event === "candidate.ranked" && typeof record.scores.finalScore === "number"));
    assert.ok(records.some((record) => record.event === "matches.diversified"));
    assert.ok(records.some((record) => record.event === "pipeline.completed"));
    const redaction = records.find((record) => record.event === "redaction.check");
    assert.equal(redaction.email, "[REDACTED]");
    assert.equal(redaction.profileAffinity, 0.75);
  });
});

describe("Matchmaking v2 routes", () => {
  test("strict cutoff filters out shorter consecutive overlaps and response is versioned", async () => {
    const response = await request(app).post("/matchmaking/matches").send({
      user: { id: "v2-seeker", tags: ["robotics"], openTo: ["study-buddy"] },
      availability: [{ start: "2025-01-15T14:00:00.000Z", end: "2025-01-15T16:00:00.000Z" }],
      intent: "study-buddy", minOverlapMinutes: 120,
    }).expect(200);
    assert.match(response.body.requestId, /^[0-9a-f-]{36}$/);
    assert.equal(response.headers["x-matchmaking-request-id"], response.body.requestId);
    assert.equal(response.body.matchVersion, "2.0");
    response.body.matches.forEach((match) => {
      assert.ok(match.longestOverlapMinutes >= 120);
      assert.ok(Array.isArray(match.sharedTags));
      assert.ok(Array.isArray(match.explanations));
    });
  });

  test("invalid overlap cutoff is a client error", async () => {
    await request(app).post("/matchmaking/matches").send({ user: { id: "v2" }, availability: [{ start: "2025-01-15T14:00:00Z", end: "2025-01-15T16:00:00Z" }], minOverlapMinutes: 45 }).expect(400);
  });

  test("recommendation events validate dwell and accept a batch", async () => {
    const credentials = { email: "events@example.edu", password: "SafePassword!123" };
    await request(app).post("/auth/signup").send(credentials);
    const signin = await request(app).post("/auth/signin").send(credentials);
    const auth = `Bearer ${signin.body.session.access_token}`;
    await request(app).post("/matchmaking/events").set("Authorization", auth).send({ events: [{ type: "dwell", candidateId: "c", requestId: "r", dwellSeconds: 7 }] }).expect(400);
    const response = await request(app).post("/matchmaking/events").set("Authorization", auth).send({ events: [{ type: "dwell", candidateId: "c", requestId: "r", dwellSeconds: 8 }, { type: "impression", candidateId: "c", requestId: "r" }] }).expect(202);
    assert.equal(response.body.accepted, 2);
  });
});
