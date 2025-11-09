process.env.SUPABASE_USE_STUB = "true";

const { describe, beforeEach, test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { createApp } = require("../app");
const supabase = require("../auth/services/supabaseClient");
const friendStore = require("../connections/store");
const inboxStore = require("../inbox/store");

const app = createApp();

const createUserAndSession = async (overrides = {}) => {
  const email =
    overrides.email ||
    `student+${Math.random().toString(36).slice(2, 10)}@example.edu`;
  const password = overrides.password || "StrongPassword!123";
  const name = overrides.name || "Test Student";

  const signupResponse = await request(app)
    .post("/auth/signup")
    .send({ email, password, name })
    .expect(201);

  assert.ok(signupResponse.body.user?.id, "signup should return a user id");

  const signinResponse = await request(app)
    .post("/auth/signin")
    .send({ email, password })
    .expect(200);

  const session = signinResponse.body.session;
  assert.ok(session?.access_token, "signin should return an access token");

  return {
    user: signupResponse.body.user,
    token: session.access_token,
  };
};

describe("Connections routes", () => {
  beforeEach(() => {
    if (typeof supabase.__reset === "function") {
      supabase.__reset();
    }
    if (typeof friendStore.__reset === "function") {
      friendStore.__reset();
    }
    if (typeof inboxStore.__reset === "function") {
      inboxStore.__reset();
    }
  });

  test("users can send and accept friend requests", async () => {
    const alice = await createUserAndSession({ name: "Alice" });
    const bob = await createUserAndSession({ name: "Bob" });

    const sendResponse = await request(app)
      .post("/connections/requests")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ recipientId: bob.user.id, message: "Let's connect!" })
      .expect(201);

    assert.equal(sendResponse.body.request.status, "pending");
    assert.equal(sendResponse.body.request.requesterId, alice.user.id);
    assert.equal(sendResponse.body.request.recipientId, bob.user.id);

    const requestId = sendResponse.body.request.id;

    const bobGraphBefore = await request(app)
      .get("/connections")
      .set("Authorization", `Bearer ${bob.token}`)
      .expect(200);

    assert.equal(bobGraphBefore.body.incomingRequests.length, 1);
    assert.equal(bobGraphBefore.body.friends.length, 0);

    const acceptResponse = await request(app)
      .post(`/connections/requests/${requestId}/accept`)
      .set("Authorization", `Bearer ${bob.token}`)
      .expect(200);

    assert.equal(acceptResponse.body.request.status, "accepted");
    assert.equal(acceptResponse.body.friendships.length, 2);

    const bobGraphAfter = await request(app)
      .get("/connections")
      .set("Authorization", `Bearer ${bob.token}`)
      .expect(200);

    assert.equal(bobGraphAfter.body.incomingRequests.length, 0);
    assert.equal(bobGraphAfter.body.friends.length, 1);
    assert.equal(bobGraphAfter.body.friends[0].id, alice.user.id);

    const aliceGraphAfter = await request(app)
      .get("/connections")
      .set("Authorization", `Bearer ${alice.token}`)
      .expect(200);

    assert.equal(aliceGraphAfter.body.outgoingRequests.length, 0);
    assert.equal(aliceGraphAfter.body.friends.length, 1);
    assert.equal(aliceGraphAfter.body.friends[0].id, bob.user.id);
  });

  test("only the recipient can accept a friend request", async () => {
    const alice = await createUserAndSession({ name: "Alice" });
    const bob = await createUserAndSession({ name: "Bob" });
    const charlie = await createUserAndSession({ name: "Charlie" });

    const sendResponse = await request(app)
      .post("/connections/requests")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ recipientId: bob.user.id })
      .expect(201);

    const requestId = sendResponse.body.request.id;

    await request(app)
      .post(`/connections/requests/${requestId}/accept`)
      .set("Authorization", `Bearer ${charlie.token}`)
      .expect(403);

    await request(app)
      .post(`/connections/requests/${requestId}/accept`)
      .set("Authorization", `Bearer ${alice.token}`)
      .expect(403);

    const declineResponse = await request(app)
      .post(`/connections/requests/${requestId}/decline`)
      .set("Authorization", `Bearer ${bob.token}`)
      .expect(200);

    assert.equal(declineResponse.body.request.status, "declined");
  });

  test("GET /inbox returns pending requests snapshot", async () => {
    const alice = await createUserAndSession({ name: "Alice" });
    const bob = await createUserAndSession({ name: "Bob" });

    await request(app)
      .post("/connections/requests")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ recipientId: bob.user.id, message: "Inbox hello" })
      .expect(201);

    const inboxResponse = await request(app)
      .get("/inbox")
      .set("Authorization", `Bearer ${bob.token}`)
      .expect(200);

    assert.equal(inboxResponse.body.userId, bob.user.id);
    assert.equal(inboxResponse.body.counts.incoming, 1);
    assert.equal(inboxResponse.body.incomingRequests.length, 1);
    assert.equal(inboxResponse.body.outgoingRequests.length, 0);

    const aliceInbox = await request(app)
      .get("/inbox")
      .set("Authorization", `Bearer ${alice.token}`)
      .expect(200);

    assert.equal(aliceInbox.body.counts.outgoing, 1);
  });
});


