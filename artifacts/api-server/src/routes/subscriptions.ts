import { Router } from "express";
import { db } from "@workspace/db";
import {
  readerPublisherSubscriptionsTable,
  readerJournalistSubscriptionsTable,
  publishersTable,
  usersTable,
} from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import {
  SubscribePublisherParams,
  UnsubscribePublisherParams,
  SubscribeJournalistParams,
  UnsubscribeJournalistParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router = Router();

// ── Publisher subscriptions ───────────────────────────────────────────────────

/**
 * POST /subscriptions/publishers/:publisherId
 * Subscribe the current reader to a publisher.
 * Silently succeeds if the subscription already exists (idempotent).
 * Restricted to users with the "reader" role.
 */
router.post(
  "/subscriptions/publishers/:publisherId",
  requireAuth,
  requireRole("reader"),
  async (req, res, next): Promise<void> => {
    try {
      const params = SubscribePublisherParams.safeParse(req.params);
      if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
      }

      const readerId = req.user!.userId;
      const { publisherId } = params.data;

      // Check for an existing subscription before inserting to avoid duplicates
      const [existing] = await db
        .select()
        .from(readerPublisherSubscriptionsTable)
        .where(
          and(
            eq(readerPublisherSubscriptionsTable.readerId, readerId),
            eq(readerPublisherSubscriptionsTable.publisherId, publisherId),
          ),
        );

      if (!existing) {
        await db
          .insert(readerPublisherSubscriptionsTable)
          .values({ readerId, publisherId });
      }

      res.json({ subscribed: true, message: "Subscribed to publisher" });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * DELETE /subscriptions/publishers/:publisherId
 * Unsubscribe the current user from a publisher.
 * Silently succeeds if no subscription exists (idempotent).
 */
router.delete(
  "/subscriptions/publishers/:publisherId",
  requireAuth,
  async (req, res, next): Promise<void> => {
    try {
      const params = UnsubscribePublisherParams.safeParse(req.params);
      if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
      }

      await db
        .delete(readerPublisherSubscriptionsTable)
        .where(
          and(
            eq(readerPublisherSubscriptionsTable.readerId, req.user!.userId),
            eq(readerPublisherSubscriptionsTable.publisherId, params.data.publisherId),
          ),
        );

      res.json({ subscribed: false, message: "Unsubscribed from publisher" });
    } catch (err) {
      next(err);
    }
  },
);

// ── Journalist subscriptions ──────────────────────────────────────────────────

/**
 * POST /subscriptions/journalists/:journalistId
 * Subscribe the current reader to an individual journalist.
 * Silently succeeds if the subscription already exists (idempotent).
 * Restricted to users with the "reader" role.
 */
router.post(
  "/subscriptions/journalists/:journalistId",
  requireAuth,
  requireRole("reader"),
  async (req, res, next): Promise<void> => {
    try {
      const params = SubscribeJournalistParams.safeParse(req.params);
      if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
      }

      const readerId = req.user!.userId;
      const { journalistId } = params.data;

      // Only insert if the subscription does not already exist
      const [existing] = await db
        .select()
        .from(readerJournalistSubscriptionsTable)
        .where(
          and(
            eq(readerJournalistSubscriptionsTable.readerId, readerId),
            eq(readerJournalistSubscriptionsTable.journalistId, journalistId),
          ),
        );

      if (!existing) {
        await db
          .insert(readerJournalistSubscriptionsTable)
          .values({ readerId, journalistId });
      }

      res.json({ subscribed: true, message: "Subscribed to journalist" });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * DELETE /subscriptions/journalists/:journalistId
 * Unsubscribe the current user from a journalist.
 * Silently succeeds if no subscription exists (idempotent).
 */
router.delete(
  "/subscriptions/journalists/:journalistId",
  requireAuth,
  async (req, res, next): Promise<void> => {
    try {
      const params = UnsubscribeJournalistParams.safeParse(req.params);
      if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
      }

      await db
        .delete(readerJournalistSubscriptionsTable)
        .where(
          and(
            eq(readerJournalistSubscriptionsTable.readerId, req.user!.userId),
            eq(readerJournalistSubscriptionsTable.journalistId, params.data.journalistId),
          ),
        );

      res.json({ subscribed: false, message: "Unsubscribed from journalist" });
    } catch (err) {
      next(err);
    }
  },
);

// ── Subscription summary ──────────────────────────────────────────────────────

/**
 * GET /subscriptions/me
 * Return the full list of publishers and journalists the current user follows.
 * Previously this only returned the first subscription of each type — this
 * version correctly fetches all of them using inArray.
 */
router.get("/subscriptions/me", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Fetch both subscription ID lists in parallel
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

    // Fetch the full records for all subscribed publishers and journalists,
    // also in parallel, using inArray to cover all IDs in one query each
    const [publishers, journalists] = await Promise.all([
      subscribedPublisherIds.length > 0
        ? db
            .select()
            .from(publishersTable)
            .where(inArray(publishersTable.id, subscribedPublisherIds))
        : Promise.resolve([]),
      subscribedJournalistIds.length > 0
        ? db
            .select()
            .from(usersTable)
            .where(inArray(usersTable.id, subscribedJournalistIds))
        : Promise.resolve([]),
    ]);

    res.json({
      publishers: publishers.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        createdAt: p.createdAt,
        articleCount: 0,
        editorIds: [],
        journalistIds: [],
      })),
      journalists: journalists.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        bio: u.bio ?? null,
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
