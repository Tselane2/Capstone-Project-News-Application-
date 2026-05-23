/**
 * Auth route tests — registration and login flows.
 *
 * Uses supertest to fire real HTTP requests against the Express app
 * and a live PostgreSQL database (the same DATABASE_URL used in dev).
 * Each test registers users with unique emails/usernames to avoid
 * collisions across test runs.
 */

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../app";

// ── Shared test state ─────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 8);

describe("POST /api/auth/register", () => {
  it("registers a new reader account and returns a JWT", async () => {
    const id = uid();
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: `reader_${id}`, email: `reader_${id}@test.com`, password: "password123", role: "reader" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.role).toBe("reader");
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  it("registers a journalist account", async () => {
    const id = uid();
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: `journalist_${id}`, email: `journalist_${id}@test.com`, password: "password123", role: "journalist" });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("journalist");
  });

  it("registers an editor account", async () => {
    const id = uid();
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: `editor_${id}`, email: `editor_${id}@test.com`, password: "password123", role: "editor" });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("editor");
  });

  it("rejects duplicate email with 400", async () => {
    const id = uid();
    const body = { username: `u_${id}`, email: `dup_${id}@test.com`, password: "password123", role: "reader" };
    await request(app).post("/api/auth/register").send(body);

    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...body, username: `u_${id}_2` });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it("rejects duplicate username with 400", async () => {
    const id = uid();
    const body = { username: `dupname_${id}`, email: `a_${id}@test.com`, password: "password123", role: "reader" };
    await request(app).post("/api/auth/register").send(body);

    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...body, email: `b_${id}@test.com` });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/username/i);
  });

  it("rejects missing required fields with 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "missing@test.com" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  let email: string;
  const password = "password123";

  beforeAll(async () => {
    const id = uid();
    email = `login_${id}@test.com`;
    await request(app)
      .post("/api/auth/register")
      .send({ username: `loginuser_${id}`, email, password, role: "reader" });
  });

  it("returns a JWT for valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
  });

  it("returns 401 for wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it("returns 401 for unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@nowhere.com", password: "whatever" });

    expect(res.status).toBe(401);
  });

  it("does not leak which field was wrong (same error message)", async () => {
    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "badpass" });
    const wrongEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: "ghost@test.com", password });

    expect(wrongPassword.body.error).toBe(wrongEmail.body.error);
  });
});

describe("POST /api/auth/logout", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(401);
  });

  it("succeeds with a valid token", async () => {
    const id = uid();
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ username: `logout_${id}`, email: `logout_${id}@test.com`, password: "password123", role: "reader" });

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${reg.body.token}`);

    expect(res.status).toBe(200);
  });
});
