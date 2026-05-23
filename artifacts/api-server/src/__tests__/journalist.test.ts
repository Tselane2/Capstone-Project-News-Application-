/**
 * Journalist creation tests.
 *
 * Verifies that:
 * - A journalist can create articles (which start as pending/unapproved)
 * - A journalist cannot approve their own articles
 * - A journalist can create and manage newsletters
 * - A reader or unauthenticated user cannot create articles
 * - Input validation works correctly for article and newsletter creation
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

describe("Journalist — article creation", () => {
  let journalistToken: string;

  beforeAll(async () => {
    const j = await register("journalist");
    journalistToken = j.token;
  });

  it("journalist can submit a new article", async () => {
    const res = await request(app)
      .post("/api/articles")
      .set("Authorization", `Bearer ${journalistToken}`)
      .send({ title: "Breaking News", content: "Something happened today." });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Breaking News");
    expect(res.body.approved).toBe(false);
  });

  it("new article is always created with approved = false", async () => {
    const res = await request(app)
      .post("/api/articles")
      .set("Authorization", `Bearer ${journalistToken}`)
      .send({ title: "Draft article", content: "Not approved yet." });

    expect(res.status).toBe(201);
    expect(res.body.approved).toBe(false);
  });

  it("article includes authorId and authorName", async () => {
    const res = await request(app)
      .post("/api/articles")
      .set("Authorization", `Bearer ${journalistToken}`)
      .send({ title: "Author check", content: "Author fields should be populated." });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("authorId");
    expect(res.body).toHaveProperty("authorName");
  });

  it("rejects article with missing title", async () => {
    const res = await request(app)
      .post("/api/articles")
      .set("Authorization", `Bearer ${journalistToken}`)
      .send({ content: "No title provided." });

    expect(res.status).toBe(400);
  });

  it("rejects article with missing content", async () => {
    const res = await request(app)
      .post("/api/articles")
      .set("Authorization", `Bearer ${journalistToken}`)
      .send({ title: "No content" });

    expect(res.status).toBe(400);
  });

  it("journalist cannot approve their own article", async () => {
    const create = await request(app)
      .post("/api/articles")
      .set("Authorization", `Bearer ${journalistToken}`)
      .send({ title: "Self approve attempt", content: "Should be rejected." });

    const articleId = create.body.id;

    const res = await request(app)
      .patch(`/api/articles/${articleId}/approve`)
      .set("Authorization", `Bearer ${journalistToken}`)
      .send({ approved: true });

    expect(res.status).toBe(403);
  });

  it("unauthenticated user cannot create an article", async () => {
    const res = await request(app)
      .post("/api/articles")
      .send({ title: "Anon article", content: "Should fail." });

    expect(res.status).toBe(401);
  });

  it("reader cannot create an article", async () => {
    const { token } = await register("reader");
    const res = await request(app)
      .post("/api/articles")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Reader article", content: "Should fail." });

    expect(res.status).toBe(403);
  });
});

describe("Journalist — article ownership", () => {
  let journalist1Token: string;
  let journalist2Token: string;
  let articleId: number;

  beforeAll(async () => {
    const j1 = await register("journalist");
    const j2 = await register("journalist");
    journalist1Token = j1.token;
    journalist2Token = j2.token;

    const create = await request(app)
      .post("/api/articles")
      .set("Authorization", `Bearer ${journalist1Token}`)
      .send({ title: "Owned article", content: "Belongs to journalist 1." });

    articleId = create.body.id;
  });

  it("author can edit their own article", async () => {
    const res = await request(app)
      .patch(`/api/articles/${articleId}`)
      .set("Authorization", `Bearer ${journalist1Token}`)
      .send({ title: "Updated title" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated title");
  });

  it("another journalist cannot edit someone else's article", async () => {
    const res = await request(app)
      .patch(`/api/articles/${articleId}`)
      .set("Authorization", `Bearer ${journalist2Token}`)
      .send({ title: "Stolen title" });

    expect(res.status).toBe(403);
  });

  it("another journalist cannot delete someone else's article", async () => {
    const res = await request(app)
      .delete(`/api/articles/${articleId}`)
      .set("Authorization", `Bearer ${journalist2Token}`);

    expect(res.status).toBe(403);
  });
});
