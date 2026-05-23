/**
 * Editor approval workflow tests.
 *
 * Verifies that:
 * - Only editors can access the pending articles queue
 * - Editors can approve articles (making them publicly visible)
 * - Editors can reject (unpublish) articles
 * - Approved articles appear in the public feed; rejected ones do not
 * - Non-editors are blocked from the approval endpoint
 * - Approval of a non-existent article returns 404
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

describe("Editor — pending queue access", () => {
  let editorToken: string;
  let journalistToken: string;
  let readerToken: string;

  beforeAll(async () => {
    const [e, j, r] = await Promise.all([register("editor"), register("journalist"), register("reader")]);
    editorToken = e.token;
    journalistToken = j.token;
    readerToken = r.token;
  });

  it("editor can fetch the pending articles queue", async () => {
    const res = await request(app)
      .get("/api/articles/pending")
      .set("Authorization", `Bearer ${editorToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("all items in the pending queue have approved = false", async () => {
    const res = await request(app)
      .get("/api/articles/pending")
      .set("Authorization", `Bearer ${editorToken}`);

    expect(res.status).toBe(200);
    for (const article of res.body) {
      expect(article.approved).toBe(false);
    }
  });

  it("journalist cannot access the pending queue", async () => {
    const res = await request(app)
      .get("/api/articles/pending")
      .set("Authorization", `Bearer ${journalistToken}`);

    expect(res.status).toBe(403);
  });

  it("reader cannot access the pending queue", async () => {
    const res = await request(app)
      .get("/api/articles/pending")
      .set("Authorization", `Bearer ${readerToken}`);

    expect(res.status).toBe(403);
  });

  it("unauthenticated request cannot access the pending queue", async () => {
    const res = await request(app).get("/api/articles/pending");
    expect(res.status).toBe(401);
  });
});

describe("Editor — approve and reject articles", () => {
  let editorToken: string;
  let journalistToken: string;
  let readerToken: string;
  let pendingArticleId: number;

  beforeAll(async () => {
    const [e, j, r] = await Promise.all([register("editor"), register("journalist"), register("reader")]);
    editorToken = e.token;
    journalistToken = j.token;
    readerToken = r.token;

    // Submit an article that will be used for approval tests
    const create = await request(app)
      .post("/api/articles")
      .set("Authorization", `Bearer ${journalistToken}`)
      .send({ title: `Approval test ${uid()}`, content: "Content for approval test." });

    pendingArticleId = create.body.id;
  });

  it("editor can approve a pending article", async () => {
    const res = await request(app)
      .patch(`/api/articles/${pendingArticleId}/approve`)
      .set("Authorization", `Bearer ${editorToken}`)
      .send({ approved: true });

    expect(res.status).toBe(200);
    expect(res.body.approved).toBe(true);
  });

  it("approved article appears in the public feed", async () => {
    const res = await request(app).get("/api/articles");
    expect(res.status).toBe(200);
    const found = res.body.items.find((a: { id: number }) => a.id === pendingArticleId);
    expect(found).toBeDefined();
    expect(found.approved).toBe(true);
  });

  it("editor can unpublish (reject) an approved article", async () => {
    const res = await request(app)
      .patch(`/api/articles/${pendingArticleId}/approve`)
      .set("Authorization", `Bearer ${editorToken}`)
      .send({ approved: false });

    expect(res.status).toBe(200);
    expect(res.body.approved).toBe(false);
  });

  it("rejected article does not appear in the public feed", async () => {
    const res = await request(app).get("/api/articles");
    expect(res.status).toBe(200);
    const found = res.body.items.find((a: { id: number }) => a.id === pendingArticleId);
    expect(found).toBeUndefined();
  });

  it("reader cannot approve an article", async () => {
    const res = await request(app)
      .patch(`/api/articles/${pendingArticleId}/approve`)
      .set("Authorization", `Bearer ${readerToken}`)
      .send({ approved: true });

    expect(res.status).toBe(403);
  });

  it("journalist cannot approve an article", async () => {
    const res = await request(app)
      .patch(`/api/articles/${pendingArticleId}/approve`)
      .set("Authorization", `Bearer ${journalistToken}`)
      .send({ approved: true });

    expect(res.status).toBe(403);
  });

  it("approving a non-existent article returns 404", async () => {
    const res = await request(app)
      .patch("/api/articles/99999999/approve")
      .set("Authorization", `Bearer ${editorToken}`)
      .send({ approved: true });

    expect(res.status).toBe(404);
  });

  it("approve endpoint requires a boolean body field", async () => {
    const res = await request(app)
      .patch(`/api/articles/${pendingArticleId}/approve`)
      .set("Authorization", `Bearer ${editorToken}`)
      .send({ approved: "yes" });

    expect(res.status).toBe(400);
  });
});
