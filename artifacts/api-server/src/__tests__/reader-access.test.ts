/**
 * Reader access tests.
 *
 * Verifies that:
 * - Public endpoints are accessible without authentication
 * - Protected endpoints (subscribed feed, subscriptions) require a valid JWT
 * - A reader cannot access journalist-only or editor-only routes
 * - Auth-gated routes reject invalid / missing tokens correctly
 */

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../app";

const uid = () => Math.random().toString(36).slice(2, 8);

async function registerAndLogin(role: "reader" | "journalist" | "editor") {
  const id = uid();
  const res = await request(app)
    .post("/api/auth/register")
    .send({ username: `${role}_${id}`, email: `${role}_${id}@test.com`, password: "password123", role });
  return { token: res.body.token as string, userId: res.body.user.id as number };
}

describe("Reader access — public endpoints (no auth required)", () => {
  it("GET /api/articles returns approved articles without a token", async () => {
    const res = await request(app).get("/api/articles");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("items");
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it("GET /api/articles supports search query param", async () => {
    const res = await request(app).get("/api/articles?search=the");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("items");
  });

  it("GET /api/articles supports pagination params", async () => {
    const res = await request(app).get("/api/articles?limit=5&offset=0");
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeLessThanOrEqual(5);
  });

  it("GET /api/newsletters returns newsletters without a token", async () => {
    const res = await request(app).get("/api/newsletters");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/publishers returns publishers without a token", async () => {
    const res = await request(app).get("/api/publishers");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/stats returns platform stats without a token", async () => {
    const res = await request(app).get("/api/stats");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalArticles");
    expect(res.body).toHaveProperty("totalJournalists");
  });
});

describe("Reader access — protected endpoints require authentication", () => {
  it("GET /api/articles/subscribed returns 401 without a token", async () => {
    const res = await request(app).get("/api/articles/subscribed");
    expect(res.status).toBe(401);
  });

  it("GET /api/articles/subscribed returns 401 with a malformed token", async () => {
    const res = await request(app)
      .get("/api/articles/subscribed")
      .set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });

  it("GET /api/articles/subscribed succeeds for an authenticated reader", async () => {
    const { token } = await registerAndLogin("reader");
    const res = await request(app)
      .get("/api/articles/subscribed")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/subscriptions/me returns 401 without a token", async () => {
    const res = await request(app).get("/api/subscriptions/me");
    expect(res.status).toBe(401);
  });
});

describe("Reader access — role boundaries", () => {
  let readerToken: string;

  beforeAll(async () => {
    const r = await registerAndLogin("reader");
    readerToken = r.token;
  });

  it("reader cannot POST /api/articles (journalist only)", async () => {
    const res = await request(app)
      .post("/api/articles")
      .set("Authorization", `Bearer ${readerToken}`)
      .send({ title: "Hacked article", content: "This should fail." });
    expect(res.status).toBe(403);
  });

  it("reader cannot POST /api/newsletters (journalist only)", async () => {
    const res = await request(app)
      .post("/api/newsletters")
      .set("Authorization", `Bearer ${readerToken}`)
      .send({ title: "My newsletter", description: "Should fail." });
    expect(res.status).toBe(403);
  });

  it("reader cannot GET /api/articles/pending (editor only)", async () => {
    const res = await request(app)
      .get("/api/articles/pending")
      .set("Authorization", `Bearer ${readerToken}`);
    expect(res.status).toBe(403);
  });
});
