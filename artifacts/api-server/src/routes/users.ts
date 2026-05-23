import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, articlesTable, newslettersTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { ListUsersQueryParams, GetUserParams, UpdateMeBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Fetch a user row by ID together with their published article and newsletter
 * counts. Returns null if no user with the given ID exists.
 */
async function getUserWithCounts(userId: number) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user) return null;

  // Run both count queries in parallel to minimise latency
  const [articleCountRow, newsletterCountRow] = await Promise.all([
    db
      .select({ count: count() })
      .from(articlesTable)
      .where(eq(articlesTable.authorId, userId))
      .then(([row]) => row),
    db
      .select({ count: count() })
      .from(newslettersTable)
      .where(eq(newslettersTable.authorId, userId))
      .then(([row]) => row),
  ]);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    bio: user.bio ?? null,
    createdAt: user.createdAt,
    articleCount: Number(articleCountRow?.count ?? 0),
    newsletterCount: Number(newsletterCountRow?.count ?? 0),
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /users/me
 * Return the full profile of the currently authenticated user, including
 * their article and newsletter counts.
 */
router.get("/users/me", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const profile = await getUserWithCounts(userId);

    if (!profile) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(profile);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /users/me
 * Update the current user's username and/or bio.
 * Only fields present in the request body are updated (partial update).
 */
router.patch("/users/me", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const parsed = UpdateMeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    // Build a partial update object — only include fields the client sent
    const updates: Record<string, unknown> = {};
    if (parsed.data.username != null) updates.username = parsed.data.username;
    if (parsed.data.bio != null) updates.bio = parsed.data.bio;

    await db.update(usersTable).set(updates).where(eq(usersTable.id, userId));

    // Re-fetch with counts so the response shape is consistent with GET /users/me
    const profile = await getUserWithCounts(userId);
    if (!profile) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(profile);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /users
 * List all users, optionally filtered by role (reader | journalist | editor).
 * Password hashes are never included in the response.
 */
router.get("/users", async (req, res, next): Promise<void> => {
  try {
    const params = ListUsersQueryParams.safeParse(req.query);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    let query = db.select().from(usersTable).$dynamic();
    if (params.data.role) {
      query = query.where(eq(usersTable.role, params.data.role));
    }

    const users = await query;

    // Strip sensitive fields before sending
    res.json(
      users.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        bio: u.bio ?? null,
        createdAt: u.createdAt,
      })),
    );
  } catch (err) {
    next(err);
  }
});

/**
 * GET /users/:userId
 * Return a single user's public profile, including article and newsletter counts.
 */
router.get("/users/:userId", async (req, res, next): Promise<void> => {
  try {
    const params = GetUserParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const profile = await getUserWithCounts(params.data.userId);
    if (!profile) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(profile);
  } catch (err) {
    next(err);
  }
});

export default router;
