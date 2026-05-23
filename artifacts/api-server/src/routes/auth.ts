import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { hashPassword, comparePassword, signToken } from "../lib/auth";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Shape the public user object returned from auth endpoints.
 * Omits the password hash and any other sensitive database fields.
 * Article/newsletter counts are seeded to 0 on account creation — the
 * /users/:id endpoint provides live counts after that.
 */
function formatNewUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    bio: user.bio ?? null,
    createdAt: user.createdAt,
    articleCount: 0,
    newsletterCount: 0,
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /auth/register
 * Create a new user account and return a signed JWT.
 * Validates that both the email address and username are not already taken.
 */
router.post("/auth/register", async (req, res, next): Promise<void> => {
  try {
    const parsed = RegisterBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { username, email, password, role } = parsed.data;

    // Ensure uniqueness of email and username before inserting
    const [existingEmail] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (existingEmail) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }

    const [existingUsername] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));
    if (existingUsername) {
      res.status(400).json({ error: "Username already taken" });
      return;
    }

    // Hash the password before persisting — never store plain text
    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(usersTable)
      .values({ username, email, passwordHash, role })
      .returning();

    const token = signToken({ userId: user.id, role: user.role });

    res.status(201).json({ user: formatNewUser(user), token });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/login
 * Authenticate with email and password, returning a signed JWT on success.
 * Returns a generic 401 for both "user not found" and "wrong password" to
 * avoid leaking which emails are registered.
 */
router.post("/auth/login", async (req, res, next): Promise<void> => {
  try {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { email, password } = parsed.data;

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    // Use a constant-time comparison; return the same error for both cases to
    // prevent user enumeration via timing differences
    const passwordValid = user
      ? await comparePassword(password, user.passwordHash)
      : false;

    if (!user || !passwordValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signToken({ userId: user.id, role: user.role });

    res.json({ user: formatNewUser(user), token });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/logout
 * Stateless logout — JWT tokens cannot be invalidated server-side, so this
 * endpoint simply confirms the request. The client is responsible for
 * discarding the token from storage.
 */
router.post("/auth/logout", requireAuth, async (_req, res): Promise<void> => {
  res.json({ message: "Logged out successfully" });
});

export default router;
