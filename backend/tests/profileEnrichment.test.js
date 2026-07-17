process.env.SUPABASE_USE_STUB = "true";

const { describe, beforeEach, test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { createApp } = require("../app");
const supabase = require("../auth/services/supabaseClient");

const app = createApp();

const authenticated = async () => {
  const credentials = { email: `profile-${Math.random()}@example.edu`, password: "SafePassword!123" };
  await request(app).post("/auth/signup").send(credentials).expect(201);
  const signin = await request(app).post("/auth/signin").send(credentials).expect(200);
  return signin.body.session.access_token;
};

describe("Profile enrichment routes", () => {
  beforeEach(() => supabase.__reset?.());

  test("profile completion validates bio then starts deterministic enrichment", async () => {
    const token = await authenticated();
    await request(app).patch("/auth/profile").set("Authorization", `Bearer ${token}`).send({ profileComplete: true, bio: "too short" }).expect(400);
    const bio = "I study artificial intelligence, play chess, and organize welcoming coffee chats.";
    await request(app).patch("/auth/profile").set("Authorization", `Bearer ${token}`).send({ profileComplete: true, bio, openTo: ["study-buddy"], interests: ["ai"] }).expect(200);
    const status = await request(app).get("/auth/profile/enrichment").set("Authorization", `Bearer ${token}`).expect(200);
    assert.ok(["processing", "complete"].includes(status.body.status));
    assert.ok(status.body.tags.some((tag) => tag.slug === "artificial-intelligence"));
    await request(app).post("/auth/profile/tags/artificial-intelligence/confirm").set("Authorization", `Bearer ${token}`).expect(200);
    await request(app).post("/auth/profile/tags/artificial-intelligence/dismiss").set("Authorization", `Bearer ${token}`).expect(200);
    const dismissed = await request(app).get("/auth/profile/enrichment").set("Authorization", `Bearer ${token}`).expect(200);
    assert.ok(!dismissed.body.tags.some((tag) => tag.slug === "artificial-intelligence"));
  });

  test("avatar upload validates WebP and returns a scoped stub signed-upload contract", async () => {
    const token = await authenticated();
    await request(app).post("/auth/profile/avatar-upload").set("Authorization", `Bearer ${token}`).send({ contentType: "image/png", fileSize: 100 }).expect(400);
    const response = await request(app).post("/auth/profile/avatar-upload").set("Authorization", `Bearer ${token}`).send({ contentType: "image/webp", fileSize: 1000 }).expect(200);
    assert.equal(response.body.method, "PUT");
    assert.equal(response.body.headers["Content-Type"], "image/webp");
    assert.match(response.body.uploadUrl, /avatar\.webp$/);
  });
});
