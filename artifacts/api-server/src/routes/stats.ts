import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  articlesTable,
  newslettersTable,
  publishersTable,
} from "@workspace/db";
import { eq, count, desc, inArray, sql } from "drizzle-orm";

const router = Router();

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /stats
 * Return aggregate counts for the platform dashboard:
 * total/approved/pending articles, newsletters, publishers, journalists,
 * readers, and how many articles were approved in the last 7 days.
 * All count queries run in parallel to keep response latency low.
 */
router.get("/stats", async (_req, res, next): Promise<void> => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalArticlesRow,
      approvedRow,
      pendingRow,
      newslettersRow,
      publishersRow,
      journalistsRow,
      readersRow,
      recentApprovalsRow,
    ] = await Promise.all([
      db.select({ count: count() }).from(articlesTable).then(([r]) => r),
      db
        .select({ count: count() })
        .from(articlesTable)
        .where(eq(articlesTable.approved, true))
        .then(([r]) => r),
      db
        .select({ count: count() })
        .from(articlesTable)
        .where(eq(articlesTable.approved, false))
        .then(([r]) => r),
      db.select({ count: count() }).from(newslettersTable).then(([r]) => r),
      db.select({ count: count() }).from(publishersTable).then(([r]) => r),
      db
        .select({ count: count() })
        .from(usersTable)
        .where(eq(usersTable.role, "journalist"))
        .then(([r]) => r),
      db
        .select({ count: count() })
        .from(usersTable)
        .where(eq(usersTable.role, "reader"))
        .then(([r]) => r),
      db
        .select({ count: count() })
        .from(articlesTable)
        .where(
          sql`${articlesTable.approved} = true AND ${articlesTable.updatedAt} >= ${sevenDaysAgo}`,
        )
        .then(([r]) => r),
    ]);

    res.json({
      totalArticles: Number(totalArticlesRow?.count ?? 0),
      approvedArticles: Number(approvedRow?.count ?? 0),
      pendingArticles: Number(pendingRow?.count ?? 0),
      totalNewsletters: Number(newslettersRow?.count ?? 0),
      totalPublishers: Number(publishersRow?.count ?? 0),
      totalJournalists: Number(journalistsRow?.count ?? 0),
      totalReaders: Number(readersRow?.count ?? 0),
      recentApprovals: Number(recentApprovalsRow?.count ?? 0),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /stats/recent-activity
 * Return a chronologically sorted feed of the 15 most recent platform events
 * (article publications and newsletter creations).
 *
 * Activity item IDs use a namespaced string format ("a-{id}" / "nl-{id}") so
 * article and newsletter IDs can never collide in the combined list.
 */
router.get("/stats/recent-activity", async (_req, res, next): Promise<void> => {
  try {
    // Fetch the most recent articles and newsletters in parallel
    const [recentArticles, recentNewsletters] = await Promise.all([
      db
        .select()
        .from(articlesTable)
        .orderBy(desc(articlesTable.createdAt))
        .limit(10),
      db
        .select()
        .from(newslettersTable)
        .orderBy(desc(newslettersTable.createdAt))
        .limit(5),
    ]);

    // Collect all unique author IDs so we can batch-fetch usernames
    const uniqueAuthorIds = [
      ...new Set([
        ...recentArticles.map((a) => a.authorId),
        ...recentNewsletters.map((n) => n.authorId),
      ]),
    ];

    // Fetch all relevant usernames in a single query using inArray
    const authorRows =
      uniqueAuthorIds.length > 0
        ? await db
            .select({ id: usersTable.id, username: usersTable.username })
            .from(usersTable)
            .where(inArray(usersTable.id, uniqueAuthorIds))
        : [];

    const authorMap = new Map(authorRows.map((u) => [u.id, u.username]));

    // Map articles to activity items — "a-{id}" avoids collisions with
    // newsletter IDs when both lists are merged
    const articleItems = recentArticles.map((a) => ({
      id: `a-${a.id}`,
      type: a.approved ? ("article_published" as const) : ("article_created" as const),
      title: a.title,
      actorName: authorMap.get(a.authorId) ?? "Unknown",
      createdAt: a.createdAt,
      articleId: a.id,
      newsletterId: null,
    }));

    // Map newsletters to activity items — "nl-{id}" namespace
    const newsletterItems = recentNewsletters.map((n) => ({
      id: `nl-${n.id}`,
      type: "newsletter_created" as const,
      title: n.title,
      actorName: authorMap.get(n.authorId) ?? "Unknown",
      createdAt: n.createdAt,
      articleId: null,
      newsletterId: n.id,
    }));

    // Merge and sort by creation time, newest first, capped at 15 items
    const combined = [...articleItems, ...newsletterItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 15);

    res.json(combined);
  } catch (err) {
    next(err);
  }
});

export default router;
