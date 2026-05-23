/**
 * Notification service tests — mock email and X (Twitter) posting.
 *
 * Verifies that:
 * - sendApprovalEmail returns the correct shape and marks email as sent
 * - postApprovalToX returns the correct shape and marks post as posted
 * - notifyArticleApproved fires both channels in parallel and aggregates results
 * - The X post text includes the author's username and article title
 * - The email subject references the article title
 * - The notification service does not throw when called (resilience)
 *
 * These are pure unit tests — no database or HTTP calls are made.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import {
  sendApprovalEmail,
  postApprovalToX,
  notifyArticleApproved,
  type ArticleApprovedPayload,
} from "../lib/notifications";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const samplePayload: ArticleApprovedPayload = {
  articleId: 42,
  articleTitle: "The Future of Investigative Journalism",
  authorEmail: "ben@pressroom.com",
  authorUsername: "ben",
};

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Email channel ─────────────────────────────────────────────────────────────

describe("sendApprovalEmail", () => {
  it("returns sent = true", async () => {
    const result = await sendApprovalEmail(samplePayload);
    expect(result.sent).toBe(true);
  });

  it("returns the correct recipient email address", async () => {
    const result = await sendApprovalEmail(samplePayload);
    expect(result.to).toBe(samplePayload.authorEmail);
  });

  it("subject line includes the article title", async () => {
    const result = await sendApprovalEmail(samplePayload);
    expect(result.subject).toContain(samplePayload.articleTitle);
  });

  it("logs the email to stdout without throwing", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await expect(sendApprovalEmail(samplePayload)).resolves.not.toThrow();
    expect(spy).toHaveBeenCalled();
  });
});

// ── X (Twitter) channel ───────────────────────────────────────────────────────

describe("postApprovalToX", () => {
  it("returns posted = true", async () => {
    const result = await postApprovalToX(samplePayload);
    expect(result.posted).toBe(true);
  });

  it("post text includes the author username", async () => {
    const result = await postApprovalToX(samplePayload);
    expect(result.text).toContain(samplePayload.authorUsername);
  });

  it("post text includes the article title", async () => {
    const result = await postApprovalToX(samplePayload);
    expect(result.text).toContain(samplePayload.articleTitle);
  });

  it("post text includes the platform hashtag", async () => {
    const result = await postApprovalToX(samplePayload);
    expect(result.text).toContain("#ThePressRoom");
  });

  it("logs the post to stdout without throwing", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await expect(postApprovalToX(samplePayload)).resolves.not.toThrow();
    expect(spy).toHaveBeenCalled();
  });
});

// ── Orchestrator ──────────────────────────────────────────────────────────────

describe("notifyArticleApproved", () => {
  it("returns both email and xPost results", async () => {
    const result = await notifyArticleApproved(samplePayload);
    expect(result).toHaveProperty("email");
    expect(result).toHaveProperty("xPost");
  });

  it("email channel is marked as sent", async () => {
    const result = await notifyArticleApproved(samplePayload);
    expect(result.email.sent).toBe(true);
  });

  it("X channel is marked as posted", async () => {
    const result = await notifyArticleApproved(samplePayload);
    expect(result.xPost.posted).toBe(true);
  });

  it("fires both channels (email spy and X spy both called)", async () => {
    const emailSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await notifyArticleApproved(samplePayload);
    // Both channels call console.log — verify it was called at least twice
    expect(emailSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("handles a different article payload correctly", async () => {
    const anotherPayload: ArticleApprovedPayload = {
      articleId: 7,
      articleTitle: "Climate Change and the Media",
      authorEmail: "cara@pressroom.com",
      authorUsername: "cara",
    };
    const result = await notifyArticleApproved(anotherPayload);
    expect(result.email.to).toBe("cara@pressroom.com");
    expect(result.xPost.text).toContain("cara");
    expect(result.xPost.text).toContain("Climate Change and the Media");
  });
});

// ── Integration — approval route fires notifications ──────────────────────────

describe("Approval route — notification integration", () => {
  it("notifyArticleApproved is invoked via the HTTP approval endpoint", async () => {
    // Import supertest here to keep the notification unit tests self-contained
    const request = (await import("supertest")).default;
    const app = (await import("../app")).default;

    const uid = () => Math.random().toString(36).slice(2, 8);
    const id = uid();

    const [journalistRes, editorRes] = await Promise.all([
      request(app).post("/api/auth/register").send({
        username: `jnotify_${id}`, email: `jnotify_${id}@test.com`, password: "password123", role: "journalist",
      }),
      request(app).post("/api/auth/register").send({
        username: `enotify_${id}`, email: `enotify_${id}@test.com`, password: "password123", role: "editor",
      }),
    ]);

    const create = await request(app)
      .post("/api/articles")
      .set("Authorization", `Bearer ${journalistRes.body.token}`)
      .send({ title: "Notify on approval", content: "This triggers the notification service." });

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const approval = await request(app)
      .patch(`/api/articles/${create.body.id}/approve`)
      .set("Authorization", `Bearer ${editorRes.body.token}`)
      .send({ approved: true });

    expect(approval.status).toBe(200);

    // Give the fire-and-forget notification a tick to execute
    await new Promise((r) => setTimeout(r, 50));

    // console.log is called by both sendApprovalEmail and postApprovalToX
    const emailCallFound = logSpy.mock.calls.some((args) =>
      String(args[0]).startsWith("[EMAIL]"),
    );
    const xCallFound = logSpy.mock.calls.some((args) =>
      String(args[0]).startsWith("[X POST]"),
    );

    expect(emailCallFound).toBe(true);
    expect(xCallFound).toBe(true);
  });
});
