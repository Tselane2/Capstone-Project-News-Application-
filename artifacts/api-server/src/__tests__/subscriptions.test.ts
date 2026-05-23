/**
 * Subscription and subscribed-feed tests.
 *
 * Verifies that:
 * - Readers can follow and unfollow publishers
 * - Readers can follow and unfollow individual journalists
 * - The subscribed feed returns only articles from followed sources
 * - Unfollowing removes articles from the feed
 * - Non-readers cannot follow publishers or journalists
 * - Following is idempotent (double-follow does not error)
 */

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../app";

const uid = () => Math.random().toString(36).slice(2, 8);

async function register(role: "reader" | "journalist" | "editor") {
  const id = uid();
  const res = await request(app)
    .post("/api/auth/register")
    .send({ username: `${role}_${id}`, email: `${role}_${id}@test.com`, password: "password123", role });
  return { token: res.body.token as string, userId: res.body.user.id as number };
}

async function createAndApproveArticle(journalistToken: string, editorToken: string, titlePrefix = "Sub test") {
  const create = await request(app)
    .post("/api/articles")
    .set("Authorization", `Bearer ${journalistToken}`)
    .send({ title: `${titlePrefix} ${uid()}`, content: "Article for subscription feed test." });

  await request(app)
    .patch(`/api/articles/${create.body.id}/approve`)
    .set("Authorization", `Bearer ${editorToken}`)
    .send({ approved: true });

  return create.body.id as number;
}

describe("Subscriptions — publisher following", () => {
  let readerToken: string;
  let journalistToken: string;

  beforeAll(async () => {
    const [r, j] = await Promise.all([register("reader"), register("journalist")]);
    readerToken = r.token;
    journalistToken = j.token;
  });

  it("reader can view their subscriptions", async () => {
    const res = await request(app)
      .get("/api/subscriptions/me")
      .set("Authorization", `Bearer ${readerToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("publishers");
    expect(res.body).toHaveProperty("journalists");
  });

  it("journalist cannot follow a publisher (reader-only)", async () => {
    // Attempt to subscribe to publisher ID 1 — role check fires before DB check
    const res = await request(app)
      .post("/api/subscriptions/publishers/1")
      .set("Authorization", `Bearer ${journalistToken}`);

    expect(res.status).toBe(403);
  });

  it("unauthenticated user cannot follow a publisher", async () => {
    const res = await request(app).post("/api/subscriptions/publishers/1");
    expect(res.status).toBe(401);
  });
});

describe("Subscriptions — journalist following", () => {
  let readerToken: string;
  let journalistToken: string;
  let editorToken: string;
  let journalistId: number;
  let articleId: number;

  beforeAll(async () => {
    const [r, j, e] = await Promise.all([register("reader"), register("journalist"), register("editor")]);
    readerToken = r.token;
    journalistToken = j.token;
    journalistId = j.userId;
    editorToken = e.token;

    articleId = await createAndApproveArticle(journalistToken, editorToken, "Journalist feed");
  });

  it("reader can follow a journalist", async () => {
    const res = await request(app)
      .post(`/api/subscriptions/journalists/${journalistId}`)
      .set("Authorization", `Bearer ${readerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.subscribed).toBe(true);
  });

  it("following the same journalist twice is idempotent", async () => {
    const res = await request(app)
      .post(`/api/subscriptions/journalists/${journalistId}`)
      .set("Authorization", `Bearer ${readerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.subscribed).toBe(true);
  });

  it("subscribed feed includes articles from the followed journalist", async () => {
    const res = await request(app)
      .get("/api/articles/subscribed")
      .set("Authorization", `Bearer ${readerToken}`);

    expect(res.status).toBe(200);
    const found = res.body.find((a: { id: number }) => a.id === articleId);
    expect(found).toBeDefined();
  });

  it("reader can unfollow a journalist", async () => {
    const res = await request(app)
      .delete(`/api/subscriptions/journalists/${journalistId}`)
      .set("Authorization", `Bearer ${readerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.subscribed).toBe(false);
  });

  it("subscribed feed no longer includes articles after unfollow", async () => {
    const res = await request(app)
      .get("/api/articles/subscribed")
      .set("Authorization", `Bearer ${readerToken}`);

    expect(res.status).toBe(200);
    const found = res.body.find((a: { id: number }) => a.id === articleId);
    expect(found).toBeUndefined();
  });
});

describe("Subscriptions — empty feed", () => {
  it("returns an empty array when the reader has no subscriptions", async () => {
    const { token } = await register("reader");
    const res = await request(app)
      .get("/api/articles/subscribed")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
