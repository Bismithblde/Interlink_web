process.env.SUPABASE_USE_STUB = "true";

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { createApp } = require("../app");
const sampleUsers = require("../matchmaking/data/sampleUsers");
const dummyProfiles = require("../matchmaking/data/dummyProfiles");

const app = createApp();

describe("Matchmaking routes", () => {
  test("POST /matchmaking/matches returns match previews", async () => {
    const response = await request(app)
      .post("/matchmaking/matches")
      .send({
        user: {
          id: "test-user",
          name: "Test User",
          interests: ["ai", "robotics"],
        },
        availability: [
          {
            id: "slot-1",
            title: "Morning focus",
            start: "2025-01-15T14:00:00.000Z",
            end: "2025-01-15T16:00:00.000Z",
          },
        ],
        mode: "one-on-one",
        filters: {
          interests: ["ai"],
        },
      })
      .expect(200);

    assert.equal(response.body.mode, "one-on-one");
    assert.ok(Array.isArray(response.body.matches));
    assert.ok(response.body.matches.length > 0, "Expected at least one match");

    const [firstMatch] = response.body.matches;
    assert.ok(firstMatch.compatibilityScore >= 45);
    assert.ok(Array.isArray(firstMatch.matchReasons));
    assert.ok(firstMatch.matchReasons.some((reason) => reason.type === "schedule"));
    assert.ok(firstMatch.matchReasons.every((reason) => typeof reason.label === "string" && reason.label.length > 0));
    assert.equal(firstMatch.rankingDebug.candidateId, firstMatch.participants[0].id);
    assert.equal(firstMatch.rankingDebug.selectionMode, firstMatch.isExploration ? "exploration" : "similarity");
    assert.equal(firstMatch.rankingDebug.embeddingSimilarity, null);
    assert.equal(firstMatch.rankingDebug.similarityStrategy, "idf-weighted-tags-plus-class-jaccard");
    assert.equal(typeof firstMatch.rankingDebug.finalRankScore, "number");
    assert.equal(typeof firstMatch.rankingDebug.explorationBoost, "number");
    assert.doesNotMatch(firstMatch.compatibilitySummary, /deterministic test|synthetic fixture/i);
    assert.doesNotMatch(firstMatch.compatibilitySummary, /you both are|everyone are/i);
    assert.ok(
      Array.isArray(response.body.debug),
      "debug log should be present for diagnostics"
    );
    assert.equal(
      response.body.emptyReason ?? null,
      null,
      "emptyReason should be null when matches are returned"
    );
  });

  test("POST /matchmaking/matches validates availability", async () => {
    const response = await request(app)
      .post("/matchmaking/matches")
      .send({
        user: { id: "invalid" },
        availability: [],
      })
      .expect(400);

    assert.match(
      response.body.error,
      /availability array is required/i,
      "Expected descriptive validation error"
    );
  });

  test("POST /matchmaking/matches supports matching with two other people", async () => {
    const response = await request(app)
      .post("/matchmaking/matches")
      .send({
        user: {
          id: "test-user-two-person-group",
          name: "Test User",
          interests: ["ai", "robotics"],
        },
        availability: [
          {
            id: "slot-group-two",
            title: "Morning focus",
            start: "2025-01-15T14:00:00.000Z",
            end: "2025-01-15T16:00:00.000Z",
          },
        ],
        mode: "one-on-two",
      })
      .expect(200);

    assert.equal(response.body.mode, "one-on-two");
    assert.ok(Array.isArray(response.body.matches));
    assert.ok(response.body.matches.length > 0, "Expected at least one group match");
    assert.equal(response.body.matches[0].participants.length, 2);
    assert.ok(response.body.matches[0].matchReasons.some((reason) => reason.type === "schedule"));
    assert.doesNotMatch(response.body.matches[0].compatibilitySummary, /everyone are/i);
  });

  test("dummy profiles read like distinct student profiles", () => {
    assert.equal(dummyProfiles.length, 18);
    assert.equal(new Set(dummyProfiles.map((profile) => profile.name)).size, 18);
    dummyProfiles.forEach((profile) => {
      assert.match(profile.name, /^[A-Z][a-z]+ [A-Z][a-z]+$/);
      assert.ok(profile.bio.length > 40);
      assert.ok(profile.funFact.length > 20);
      assert.doesNotMatch(`${profile.name} ${profile.bio} ${profile.funFact} ${profile.vibeCheck}`, /\[TEST\]|synthetic|deterministic test archetype/i);
    });
  });

  test("POST /matchmaking/matches returns empty reason when no overlap", async () => {
    const response = await request(app)
      .post("/matchmaking/matches")
      .send({
        user: {
          id: "test-user",
          name: "Test User",
          interests: ["astronomy"],
        },
        availability: [
          {
            id: "slot-1",
            title: "Late night",
            start: "2025-01-14T04:00:00.000Z",
            end: "2025-01-14T05:00:00.000Z",
          },
        ],
        mode: "one-on-one",
        filters: {
          interests: ["astronomy"],
        },
      })
      .expect(200);

    assert.equal(response.body.matches.length, 0);
    assert.ok(
      typeof response.body.emptyReason === "string" &&
        response.body.emptyReason.length > 0,
      "Expected emptyReason explanation when matches are empty"
    );
    assert.ok(
      Array.isArray(response.body.debug),
      "Expected debug array in response"
    );
  });

  test("POST /matchmaking/matches filters by hobby query", async () => {
    const testCandidate = {
      id: "user-schedule-hobby",
      name: "Schedule Hobbyist",
      email: "schedule.hobby@example.edu",
      hobbies: ["video games", "board games"],
      interests: ["ai"],
      availability: [
        {
          id: "synonym-slot",
          title: "Late night gaming",
          start: "2025-01-15T02:00:00.000Z",
          end: "2025-01-15T03:00:00.000Z",
        },
      ],
    };

    sampleUsers.push(testCandidate);

    try {
      const response = await request(app)
        .post("/matchmaking/matches")
        .send({
          user: {
            id: "seeker-hobby-test",
            name: "Seeker Hobby",
            hobbies: ["gaming"],
          },
          availability: [
            {
              id: "seeker-slot",
              title: "Night session",
              start: "2025-01-15T02:00:00.000Z",
              end: "2025-01-15T03:00:00.000Z",
            },
          ],
          mode: "one-on-one",
        })
        .expect(200);

      assert.ok(Array.isArray(response.body.matches));
      const match = response.body.matches[0];
      assert.ok(match, "Expected at least one match");
      assert.ok(match.compatibilityBreakdown.schedule >= 0);
      assert.ok(Array.isArray(match.sharedHobbies));
    } finally {
      sampleUsers.pop();
    }
  });

  test("POST /matchmaking/matches applies hobby query filter", async () => {
    const response = await request(app)
      .post("/matchmaking/matches")
      .send({
        user: {
          id: "filter-test-user",
          name: "Filter User",
        },
        availability: [
          {
            id: "slot-1",
            title: "Morning focus",
            start: "2025-01-15T14:00:00.000Z",
            end: "2025-01-15T16:00:00.000Z",
          },
        ],
        mode: "one-on-one",
        filters: {
          hobbyQuery: "espresso",
        },
      })
      .expect(200);

    assert.ok(Array.isArray(response.body.matches));
    assert.ok(
      response.body.matches.every((match) =>
        match.participants.some((participant) =>
          Array.isArray(participant.hobbies)
            ? participant.hobbies.some((hobby) =>
                hobby.toLowerCase().includes("espresso")
              )
            : false
        )
      ),
      "All returned matches should mention the hobby filter"
    );
  });

  test("GET /matchmaking/hobbies returns candidates matching hobby", async () => {
    const testCandidate = {
      id: "user-hobby-search",
      name: "Hobby Search",
      email: "hobby.search@example.edu",
      hobbies: ["gaming", "strategy games"],
      interests: ["ai"],
      availability: [],
    };

    sampleUsers.push(testCandidate);

    try {
      const response = await request(app)
        .get("/matchmaking/hobbies")
        .query({ hobby: "gaming" })
        .expect(200);

      assert.ok(Array.isArray(response.body.results));
      assert.ok(
        response.body.results.length > 0,
        "Expected at least one candidate to match hobby search"
      );
      const candidate = response.body.results[0];
      assert.ok(
        candidate.hobbies.some((hobby) =>
          hobby.toLowerCase().includes("gaming")
        )
      );
    } finally {
      sampleUsers.pop();
    }
  });
});
