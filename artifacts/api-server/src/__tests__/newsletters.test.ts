/**
 * Newsletter logic tests.
 *
 * Verifies that:
 * - Journalists can create newsletters
 * - Newsletters can be created with an initial set of article links
 * - The newsletter response includes full article objects (not just IDs)
 * - Article links can be updated (replaced) via PATCH
 * - Only the author or an editor may edit or delete a newsletter
 * - Readers and unauthenticated users cannot create newsletters
 * - Fetching a non-existent newsletter returns 404
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

async function createArticle(journalistToken: string): Promise<number> {
  const res = await request(app)
    .post("/api/articles")
    .set("Authorization", `Bearer ${journalistToken}`)
    .send({ title: `Article ${uid()}`, content: "Newsletter article content." });
  return res.body.id as number;
}

describe("Newsletter — creation", () => {
  let journalistToken: string;
  let readerToken: string;
  let articleId: number;

  beforeAll(async () => {
    const [j, r] = await Promise.all([register("journalist"), register("reader")]);
    journalistToken = j.token;
    readerToken = r.token;
    articleId = await createArticle(journalistToken);
  });

  it("journalist can create a newsletter without articles", async () => {
    const res = await request(app)
      .post("/api/newsletters")
      .set("Authorization", `Bearer ${journalistToken}`)
      .send({ title: "Weekly Digest", description: "A roundup of the week's top stories." });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Weekly Digest");
    expect(res.body.articleIds).toEqual([]);
    expect(res.body.articles).toEqual([]);
  });

  it("journalist can create a newsletter with linked articles", async () => {
    const res = await request(app)
      .post("/api/newsletters")
      .set("Authorization", `Bearer ${journalistToken}`)
      .send({ title: "Curated Edition", description: "Handpicked stories.", articleIds: [articleId] });

    expect(res.status).toBe(201);
    expect(res.body.articleIds).toContain(articleId);
    expect(res.body.articles.length).toBeGreaterThanOrEqual(1);
  });

  it("newsletter response includes authorName", async () => {
    const res = await request(app)
      .post("/api/newsletters")
      .set("Authorization", `Bearer ${journalistToken}`)
      .send({ title: "Author check", description: "Should have authorName." });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("authorName");
    expect(typeof res.body.authorName).toBe("string");
  });

  it("reader cannot create a newsletter", async () => {
    const res = await request(app)
      .post("/api/newsletters")
      .set("Authorization", `Bearer ${readerToken}`)
      .send({ title: "Reader attempt", description: "Should fail." });

    expect(res.status).toBe(403);
  });

  it("unauthenticated user cannot create a newsletter", async () => {
    const res = await request(app)
      .post("/api/newsletters")
      .send({ title: "Anon attempt", description: "Should fail." });

    expect(res.status).toBe(401);
  });

  it("rejects a newsletter with missing title", async () => {
    const res = await request(app)
      .post("/api/newsletters")
      .set("Authorization", `Bearer ${journalistToken}`)
      .send({ description: "No title." });

    expect(res.status).toBe(400);
  });
});

describe("Newsletter — retrieval", () => {
  let journalistToken: string;
  let newsletterId: number;

  beforeAll(async () => {
    const j = await register("journalist");
    journalistToken = j.token;

    const create = await request(app)
      .post("/api/newsletters")
      .set("Authorization", `Bearer ${journalistToken}`)
      .send({ title: "Retrieval test", description: "For GET tests." });

    newsletterId = create.body.id;
  });

  it("GET /api/newsletters returns an array", async () => {
    const res = await request(app).get("/api/newsletters");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/newsletters/:id returns the newsletter", async () => {
    const res = await request(app).get(`/api/newsletters/${newsletterId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(newsletterId);
    expect(res.body).toHaveProperty("articles");
  });

  it("GET /api/newsletters/99999999 returns 404", async () => {
    const res = await request(app).get("/api/newsletters/99999999");
    expect(res.status).toBe(404);
  });
});

describe("Newsletter — update and article link replacement", () => {
  let journalistToken: string;
  let otherJournalistToken: string;
  let editorToken: string;
  let newsletterId: number;
  let articleId1: number;
  let articleId2: number;

  beforeAll(async () => {
    const [j, j2, e] = await Promise.all([register("journalist"), register("journalist"), register("editor")]);
    journalistToken = j.token;
    otherJournalistToken = j2.token;
    editorToken = e.token;

    [articleId1, articleId2] = await Promise.all([
      createArticle(journalistToken),
      createArticle(journalistToken),
    ]);

    const create = await request(app)
      .post("/api/newsletters")
      .set("Authorization", `Bearer ${journalistToken}`)
      .send({ title: "Update test", description: "Will be patched.", articleIds: [articleId1] });

    newsletterId = create.body.id;
  });

  it("author can update the newsletter title", async () => {
    const res = await request(app)
      .patch(`/api/newsletters/${newsletterId}`)
      .set("Authorization", `Bearer ${journalistToken}`)
      .send({ title: "Updated title" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated title");
  });

  it("author can replace the article link list", async () => {
    const res = await request(app)
      .patch(`/api/newsletters/${newsletterId}`)
      .set("Authorization", `Bearer ${journalistToken}`)
      .send({ articleIds: [articleId2] });

    expect(res.status).toBe(200);
    expect(res.body.articleIds).toContain(articleId2);
    expect(res.body.articleIds).not.toContain(articleId1);
  });

  it("editor can update any newsletter", async () => {
    const res = await request(app)
      .patch(`/api/newsletters/${newsletterId}`)
      .set("Authorization", `Bearer ${editorToken}`)
      .send({ description: "Editor updated this." });

    expect(res.status).toBe(200);
    expect(res.body.description).toBe("Editor updated this.");
  });

  it("another journalist cannot update someone else's newsletter", async () => {
    const res = await request(app)
      .patch(`/api/newsletters/${newsletterId}`)
      .set("Authorization", `Bearer ${otherJournalistToken}`)
      .send({ title: "Stolen" });

    expect(res.status).toBe(403);
  });
});

describe("Newsletter — deletion", () => {
  it("author can delete their newsletter", async () => {
    const j = await register("journalist");
    const create = await request(app)
      .post("/api/newsletters")
      .set("Authorization", `Bearer ${j.token}`)
      .send({ title: "To be deleted", description: "Bye." });

    const res = await request(app)
      .delete(`/api/newsletters/${create.body.id}`)
      .set("Authorization", `Bearer ${j.token}`);

    expect(res.status).toBe(204);
  });

  it("deleting a non-existent newsletter returns 404", async () => {
    const { token } = await register("editor");
    const res = await request(app)
      .delete("/api/newsletters/99999999")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
