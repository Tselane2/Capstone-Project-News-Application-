import { Router } from "express";
import { db } from "@workspace/db";
import {
  articlesTable,
  usersTable,
  publishersTable,
  readerPublisherSubscriptionsTable,
  readerJournalistSubscriptionsTable,
} from "@workspace/db";
import { eq, and, or, ilike, desc, count, inArray, type SQL } from "drizzle-orm";
import {
  ListArticlesQueryParams,
  CreateArticleBody,
  GetArticleParams,
  UpdateArticleParams,
  UpdateArticleBody,
  DeleteArticleParams,
  ApproveArticleParams,
  ApproveArticleBody,
} from "@workspace/api-zod";
import { requireAuth, requireRole, optionalAuth } from "../middlewares/requireAuth";
import { notifyArticleApproved } from "../lib/notifications";

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Enrich a raw article row with its author's username and the publisher's name.
 * Both lookups are run in parallel when a publisherId is present to minimise
 * round-trips to the database.
 */
async function buildArticle(article: typeof articlesTable.$inferSelect) {
  // Fetch author name and (optionally) publisher name in parallel
  const [authorResult, publisherResult] = await Promise.all([
    db
      .select({ username: usersTable.username })
      .from(usersTable)
      .where(eq(usersTable.id, article.authorId))
      .then(([row]) => row),
    article.publisherId
      ? db
          .select({ name: publishersTable.name })
          .from(publishersTable)
          .where(eq(publishersTable.id, article.publisherId))
          .then(([row]) => row)
      : Promise.resolve(null),
  ]);

  return {
    id: article.id,
    title: article.title,
    content: article.content,
    authorId: article.authorId,
    authorName: authorResult?.username ?? "Unknown",
    publisherId: article.publisherId ?? null,
    publisherName: publisherResult?.name ?? null,
    approved: article.approved,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /articles
 * List all approved articles. Supports optional filtering by publisher,
 * author, and a case-insensitive title search, plus pagination via
 * limit/offset query parameters.
 */
router.get("/articles", optionalAuth, async (req, res, next): Promise<void> => {
  try {
    const params = ListArticlesQueryParams.safeParse(req.query);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const { publisherId, authorId, search, limit = 20, offset = 0 } = params.data;

    // Always restrict to approved articles for public listing
    const conditions: SQL[] = [eq(articlesTable.approved, true)];
    if (publisherId) conditions.push(eq(articlesTable.publisherId, publisherId));
    if (authorId) conditions.push(eq(articlesTable.authorId, authorId));
    if (search) conditions.push(ilike(articlesTable.title, `%${search}%`));

    const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

    // Run the count and data queries in parallel
    const [totalRow, articles] = await Promise.all([
      db.select({ count: count() }).from(articlesTable).where(whereClause).then(([row]) => row),
      db
        .select()
        .from(articlesTable)
        .where(whereClause)
        .orderBy(desc(articlesTable.createdAt))
        .limit(limit ?? 20)
        .offset(offset ?? 0),
    ]);

    const items = await Promise.all(articles.map(buildArticle));
    res.json({ items, total: Number(totalRow?.count ?? 0) });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /articles/subscribed
 * Return approved articles from publishers and journalists the current user
 * follows. Aggregates both subscription types into a single chronological feed.
 * Requires authentication — unauthenticated users should use GET /articles.
 */
router.get("/articles/subscribed", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Fetch both subscription lists in parallel
    const [publisherSubs, journalistSubs] = await Promise.all([
      db
        .select({ publisherId: readerPublisherSubscriptionsTable.publisherId })
        .from(readerPublisherSubscriptionsTable)
        .where(eq(readerPublisherSubscriptionsTable.readerId, userId)),
      db
        .select({ journalistId: readerJournalistSubscriptionsTable.journalistId })
        .from(readerJournalistSubscriptionsTable)
        .where(eq(readerJournalistSubscriptionsTable.readerId, userId)),
    ]);

    const subscribedPublisherIds = publisherSubs.map((s) => s.publisherId);
    const subscribedJournalistIds = journalistSubs.map((s) => s.journalistId);

    // Return an empty feed if the user has no subscriptions yet
    if (subscribedPublisherIds.length === 0 && subscribedJournalistIds.length === 0) {
      res.json([]);
      return;
    }

    // Build a filter that matches articles from subscribed publishers OR journalists
    const conditions: SQL[] = [eq(articlesTable.approved, true)];
    const sourceConditions: SQL[] = [];
    if (subscribedPublisherIds.length > 0) {
      sourceConditions.push(inArray(articlesTable.publisherId, subscribedPublisherIds));
    }
    if (subscribedJournalistIds.length > 0) {
      sourceConditions.push(inArray(articlesTable.authorId, subscribedJournalistIds));
    }
    conditions.push(
      sourceConditions.length === 1 ? sourceConditions[0] : or(...sourceConditions)!,
    );

    const articles = await db
      .select()
      .from(articlesTable)
      .where(and(...conditions))
      .orderBy(desc(articlesTable.createdAt))
      .limit(50);

    res.json(await Promise.all(articles.map(buildArticle)));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /articles/pending
 * Return all articles awaiting editorial review, ordered newest-first.
 * Restricted to users with the "editor" role.
 */
router.get(
  "/articles/pending",
  requireAuth,
  requireRole("editor"),
  async (_req, res, next): Promise<void> => {
    try {
      const articles = await db
        .select()
        .from(articlesTable)
        .where(eq(articlesTable.approved, false))
        .orderBy(desc(articlesTable.createdAt));

      res.json(await Promise.all(articles.map(buildArticle)));
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /articles/:articleId
 * Return a single article by ID. Both approved and pending articles are
 * accessible so editors can preview submissions before approving them.
 */
router.get("/articles/:articleId", optionalAuth, async (req, res, next): Promise<void> => {
  try {
    const params = GetArticleParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [article] = await db
      .select()
      .from(articlesTable)
      .where(eq(articlesTable.id, params.data.articleId));

    if (!article) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    res.json(await buildArticle(article));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /articles
 * Create a new article. The article starts in a pending (unapproved) state
 * and will appear in the editor's review queue. Restricted to journalists.
 */
router.post(
  "/articles",
  requireAuth,
  requireRole("journalist"),
  async (req, res, next): Promise<void> => {
    try {
      const parsed = CreateArticleBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
      }

      const [article] = await db
        .insert(articlesTable)
        .values({
          title: parsed.data.title,
          content: parsed.data.content,
          publisherId: parsed.data.publisherId ?? null,
          authorId: req.user!.userId,
          approved: false, // All new articles require editorial approval
        })
        .returning();

      res.status(201).json(await buildArticle(article));
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PATCH /articles/:articleId
 * Update an article's title, content, or publisher.
 * Only the original author or an editor may edit an article.
 */
router.patch("/articles/:articleId", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const params = UpdateArticleParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateArticleBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(articlesTable)
      .where(eq(articlesTable.id, params.data.articleId));

    if (!existing) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    const { userId, role } = req.user!;
    const isAuthor = existing.authorId === userId;
    const isEditor = role === "editor";

    if (!isAuthor && !isEditor) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    // Only include fields that were actually provided in the request body
    const updates: Record<string, unknown> = {};
    if (parsed.data.title != null) updates.title = parsed.data.title;
    if (parsed.data.content != null) updates.content = parsed.data.content;
    if ("publisherId" in parsed.data) updates.publisherId = parsed.data.publisherId ?? null;

    const [updatedArticle] = await db
      .update(articlesTable)
      .set(updates)
      .where(eq(articlesTable.id, params.data.articleId))
      .returning();

    res.json(await buildArticle(updatedArticle));
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /articles/:articleId
 * Permanently remove an article. Only the original author or an editor may
 * delete an article.
 */
router.delete("/articles/:articleId", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const params = DeleteArticleParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(articlesTable)
      .where(eq(articlesTable.id, params.data.articleId));

    if (!existing) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    const { userId, role } = req.user!;
    if (existing.authorId !== userId && role !== "editor") {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    await db.delete(articlesTable).where(eq(articlesTable.id, params.data.articleId));
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /articles/:articleId/approve
 * Set an article's approval status to true (publish) or false (reject/unpublish).
 * Restricted to editors. Logs the status change for audit purposes.
 */
router.patch(
  "/articles/:articleId/approve",
  requireAuth,
  requireRole("editor"),
  async (req, res, next): Promise<void> => {
    try {
      const params = ApproveArticleParams.safeParse(req.params);
      if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
      }

      const parsed = ApproveArticleBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
      }

      const [existing] = await db
        .select()
        .from(articlesTable)
        .where(eq(articlesTable.id, params.data.articleId));

      if (!existing) {
        res.status(404).json({ error: "Article not found" });
        return;
      }

      const [updatedArticle] = await db
        .update(articlesTable)
        .set({ approved: parsed.data.approved })
        .where(eq(articlesTable.id, params.data.articleId))
        .returning();

      req.log.info(
        { articleId: updatedArticle.id, approved: updatedArticle.approved },
        "Article approval status changed",
      );

      // Fire approval notifications (email + X post) when an article is published.
      // We look up the author to get their email and username for the notification.
      if (parsed.data.approved) {
        const [author] = await db
          .select({ email: usersTable.email, username: usersTable.username })
          .from(usersTable)
          .where(eq(usersTable.id, updatedArticle.authorId));

        if (author) {
          notifyArticleApproved({
            articleId: updatedArticle.id,
            articleTitle: updatedArticle.title,
            authorEmail: author.email,
            authorUsername: author.username,
          }).catch((notifyErr) =>
            req.log.warn({ notifyErr }, "Notification dispatch failed"),
          );
        }
      }

      res.json(await buildArticle(updatedArticle));
    } catch (err) {
      next(err);
    }
  },
);

export default router;
