import { Router } from "express";
import { db } from "@workspace/db";
import {
  publishersTable,
  publisherEditorsTable,
  publisherJournalistsTable,
  articlesTable,
} from "@workspace/db";
import { eq, count } from "drizzle-orm";
import {
  CreatePublisherBody,
  GetPublisherParams,
  UpdatePublisherParams,
  UpdatePublisherBody,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Enrich a raw publisher row with its article count and the IDs of all
 * associated editors and journalists.
 * All three sub-queries run in parallel to minimise database round-trips.
 */
async function buildPublisher(publisher: typeof publishersTable.$inferSelect) {
  const [articleCountRow, editorRows, journalistRows] = await Promise.all([
    db
      .select({ count: count() })
      .from(articlesTable)
      .where(eq(articlesTable.publisherId, publisher.id))
      .then(([row]) => row),
    db
      .select({ userId: publisherEditorsTable.userId })
      .from(publisherEditorsTable)
      .where(eq(publisherEditorsTable.publisherId, publisher.id)),
    db
      .select({ userId: publisherJournalistsTable.userId })
      .from(publisherJournalistsTable)
      .where(eq(publisherJournalistsTable.publisherId, publisher.id)),
  ]);

  return {
    id: publisher.id,
    name: publisher.name,
    description: publisher.description,
    createdAt: publisher.createdAt,
    articleCount: Number(articleCountRow?.count ?? 0),
    editorIds: editorRows.map((e) => e.userId),
    journalistIds: journalistRows.map((j) => j.userId),
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /publishers
 * List all publishers with their article counts and member IDs.
 */
router.get("/publishers", async (_req, res, next): Promise<void> => {
  try {
    const publishers = await db.select().from(publishersTable);
    res.json(await Promise.all(publishers.map(buildPublisher)));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /publishers
 * Create a new publisher. Restricted to editors and journalists.
 */
router.post(
  "/publishers",
  requireAuth,
  requireRole("editor", "journalist"),
  async (req, res, next): Promise<void> => {
    try {
      const parsed = CreatePublisherBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
      }

      const [publisher] = await db
        .insert(publishersTable)
        .values(parsed.data)
        .returning();

      res.status(201).json(await buildPublisher(publisher));
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /publishers/:publisherId
 * Return a single publisher by ID with article count and member IDs.
 */
router.get("/publishers/:publisherId", async (req, res, next): Promise<void> => {
  try {
    const params = GetPublisherParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [publisher] = await db
      .select()
      .from(publishersTable)
      .where(eq(publishersTable.id, params.data.publisherId));

    if (!publisher) {
      res.status(404).json({ error: "Publisher not found" });
      return;
    }

    res.json(await buildPublisher(publisher));
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /publishers/:publisherId
 * Update a publisher's name and/or description.
 * Only fields present in the request body are modified (partial update).
 * Restricted to editors.
 */
router.patch(
  "/publishers/:publisherId",
  requireAuth,
  requireRole("editor"),
  async (req, res, next): Promise<void> => {
    try {
      const params = UpdatePublisherParams.safeParse(req.params);
      if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
      }

      const parsed = UpdatePublisherBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
      }

      // Build a partial update — only include fields the client actually sent
      const updates: Record<string, unknown> = {};
      if (parsed.data.name != null) updates.name = parsed.data.name;
      if (parsed.data.description != null) updates.description = parsed.data.description;

      const [publisher] = await db
        .update(publishersTable)
        .set(updates)
        .where(eq(publishersTable.id, params.data.publisherId))
        .returning();

      if (!publisher) {
        res.status(404).json({ error: "Publisher not found" });
        return;
      }

      res.json(await buildPublisher(publisher));
    } catch (err) {
      next(err);
    }
  },
);

export default router;
