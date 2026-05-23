import { Router } from "express";
import { db } from "@workspace/db";
import {
  newslettersTable,
  newsletterArticlesTable,
  articlesTable,
  usersTable,
} from "@workspace/db";
import { eq, desc, inArray } from "drizzle-orm";
import {
  ListNewslettersQueryParams,
  CreateNewsletterBody,
  GetNewsletterParams,
  UpdateNewsletterParams,
  UpdateNewsletterBody,
  DeleteNewsletterParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Enrich a raw newsletter row with its author's username and the full details
 * of every article it links to.
 *
 * The article lookup uses inArray so all linked articles are fetched in a
 * single query rather than one per article.
 */
async function buildNewsletter(newsletter: typeof newslettersTable.$inferSelect) {
  // Fetch the newsletter author's username
  const [authorRow] = await db
    .select({ username: usersTable.username })
    .from(usersTable)
    .where(eq(usersTable.id, newsletter.authorId));

  // Fetch the ordered list of article IDs linked to this newsletter
  const articleLinks = await db
    .select({ articleId: newsletterArticlesTable.articleId })
    .from(newsletterArticlesTable)
    .where(eq(newsletterArticlesTable.newsletterId, newsletter.id));

  const articleIds = articleLinks.map((link) => link.articleId);

  // Fetch all linked articles in a single query (fixes the previous bug
  // where only the first article was retrieved with `eq`)
  let articles: object[] = [];
  if (articleIds.length > 0) {
    const rawArticles = await db
      .select()
      .from(articlesTable)
      .where(inArray(articlesTable.id, articleIds));

    // Build an author-name lookup map to avoid N+1 queries
    const uniqueAuthorIds = [...new Set(rawArticles.map((a) => a.authorId))];
    const authorRows = await db
      .select({ id: usersTable.id, username: usersTable.username })
      .from(usersTable)
      .where(inArray(usersTable.id, uniqueAuthorIds));

    const authorMap = new Map(authorRows.map((u) => [u.id, u.username]));

    articles = rawArticles.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      authorId: a.authorId,
      authorName: authorMap.get(a.authorId) ?? "Unknown",
      publisherId: a.publisherId ?? null,
      publisherName: null,
      approved: a.approved,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
  }

  return {
    id: newsletter.id,
    title: newsletter.title,
    description: newsletter.description,
    authorId: newsletter.authorId,
    authorName: authorRow?.username ?? "Unknown",
    createdAt: newsletter.createdAt,
    articleIds,
    articles,
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /newsletters
 * List all newsletters, optionally filtered by author ID, ordered newest-first.
 */
router.get("/newsletters", async (req, res, next): Promise<void> => {
  try {
    const params = ListNewslettersQueryParams.safeParse(req.query);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    let query = db.select().from(newslettersTable).$dynamic();
    if (params.data.authorId) {
      query = query.where(eq(newslettersTable.authorId, params.data.authorId));
    }

    const newsletters = await query.orderBy(desc(newslettersTable.createdAt));
    res.json(await Promise.all(newsletters.map(buildNewsletter)));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /newsletters
 * Create a new newsletter and optionally link an initial set of articles to it.
 * Restricted to journalists.
 */
router.post(
  "/newsletters",
  requireAuth,
  requireRole("journalist"),
  async (req, res, next): Promise<void> => {
    try {
      const parsed = CreateNewsletterBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
      }

      const [newsletter] = await db
        .insert(newslettersTable)
        .values({
          title: parsed.data.title,
          description: parsed.data.description,
          authorId: req.user!.userId,
        })
        .returning();

      // Insert article links if any were provided
      if (parsed.data.articleIds && parsed.data.articleIds.length > 0) {
        await db.insert(newsletterArticlesTable).values(
          parsed.data.articleIds.map((articleId) => ({
            newsletterId: newsletter.id,
            articleId,
          })),
        );
      }

      res.status(201).json(await buildNewsletter(newsletter));
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /newsletters/:newsletterId
 * Return a single newsletter with its full article list.
 */
router.get("/newsletters/:newsletterId", async (req, res, next): Promise<void> => {
  try {
    const params = GetNewsletterParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [newsletter] = await db
      .select()
      .from(newslettersTable)
      .where(eq(newslettersTable.id, params.data.newsletterId));

    if (!newsletter) {
      res.status(404).json({ error: "Newsletter not found" });
      return;
    }

    res.json(await buildNewsletter(newsletter));
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /newsletters/:newsletterId
 * Update a newsletter's title, description, and/or article list.
 * When articleIds is provided the existing article links are replaced entirely.
 * Only the original author or an editor may make changes.
 */
router.patch("/newsletters/:newsletterId", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const params = UpdateNewsletterParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateNewsletterBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(newslettersTable)
      .where(eq(newslettersTable.id, params.data.newsletterId));

    if (!existing) {
      res.status(404).json({ error: "Newsletter not found" });
      return;
    }

    const { userId, role } = req.user!;
    if (existing.authorId !== userId && role !== "editor") {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    // Apply partial updates to the newsletter's own fields.
    // Only run the UPDATE query when at least one scalar field is being changed —
    // Drizzle throws "No values to set" if the updates object is empty.
    const updates: Record<string, unknown> = {};
    if (parsed.data.title != null) updates.title = parsed.data.title;
    if (parsed.data.description != null) updates.description = parsed.data.description;

    let updatedNewsletter = existing;
    if (Object.keys(updates).length > 0) {
      const [result] = await db
        .update(newslettersTable)
        .set(updates)
        .where(eq(newslettersTable.id, params.data.newsletterId))
        .returning();
      updatedNewsletter = result;
    }

    // Replace the article list when a new set of IDs is provided
    if (parsed.data.articleIds != null) {
      await db
        .delete(newsletterArticlesTable)
        .where(eq(newsletterArticlesTable.newsletterId, updatedNewsletter.id));

      if (parsed.data.articleIds.length > 0) {
        await db.insert(newsletterArticlesTable).values(
          parsed.data.articleIds.map((articleId) => ({
            newsletterId: updatedNewsletter.id,
            articleId,
          })),
        );
      }
    }

    res.json(await buildNewsletter(updatedNewsletter));
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /newsletters/:newsletterId
 * Permanently delete a newsletter and all its article links.
 * Only the original author or an editor may delete a newsletter.
 */
router.delete("/newsletters/:newsletterId", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const params = DeleteNewsletterParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(newslettersTable)
      .where(eq(newslettersTable.id, params.data.newsletterId));

    if (!existing) {
      res.status(404).json({ error: "Newsletter not found" });
      return;
    }

    const { userId, role } = req.user!;
    if (existing.authorId !== userId && role !== "editor") {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    await db
      .delete(newslettersTable)
      .where(eq(newslettersTable.id, params.data.newsletterId));

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

export default router;
