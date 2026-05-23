/**
 * Global test setup — runs once before and after each test file.
 *
 * - Sets SESSION_SECRET so JWT signing works without a real .env file.
 * - After every test file, removes all rows created during that run by
 *   deleting any user whose email ends with "@test.com". All dependent
 *   rows (articles, newsletters, subscriptions) are removed in dependency
 *   order so foreign-key constraints are satisfied.
 *
 * This keeps the shared development database clean and prevents test
 * data (e.g. randomly-suffixed article titles) from appearing in the UI.
 */

import { afterAll } from "vitest";
import { db } from "@workspace/db";
import {
  usersTable,
  articlesTable,
  newslettersTable,
  newsletterArticlesTable,
  readerPublisherSubscriptionsTable,
  readerJournalistSubscriptionsTable,
} from "@workspace/db";
import { inArray, like, sql } from "drizzle-orm";

process.env.SESSION_SECRET = "test-secret-for-vitest-only";

afterAll(async () => {
  // Collect IDs of every user created by tests (all use @test.com addresses)
  const testUsers = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(like(usersTable.email, "%@test.com"));

  if (testUsers.length === 0) return;

  const testUserIds = testUsers.map((u) => u.id);

  // Remove rows in dependency order to satisfy foreign-key constraints.
  // Subscriptions and newsletter-article links first, then the parent rows.
  await db
    .delete(readerJournalistSubscriptionsTable)
    .where(inArray(readerJournalistSubscriptionsTable.readerId, testUserIds));

  await db
    .delete(readerPublisherSubscriptionsTable)
    .where(inArray(readerPublisherSubscriptionsTable.readerId, testUserIds));

  const testArticles = await db
    .select({ id: articlesTable.id })
    .from(articlesTable)
    .where(inArray(articlesTable.authorId, testUserIds));

  const testArticleIds = testArticles.map((a) => a.id);

  if (testArticleIds.length > 0) {
    await db
      .delete(newsletterArticlesTable)
      .where(inArray(newsletterArticlesTable.articleId, testArticleIds));
  }

  const testNewsletters = await db
    .select({ id: newslettersTable.id })
    .from(newslettersTable)
    .where(inArray(newslettersTable.authorId, testUserIds));

  const testNewsletterIds = testNewsletters.map((n) => n.id);

  if (testNewsletterIds.length > 0) {
    await db
      .delete(newsletterArticlesTable)
      .where(inArray(newsletterArticlesTable.newsletterId, testNewsletterIds));

    await db
      .delete(newslettersTable)
      .where(inArray(newslettersTable.id, testNewsletterIds));
  }

  if (testArticleIds.length > 0) {
    await db
      .delete(articlesTable)
      .where(inArray(articlesTable.id, testArticleIds));
  }

  await db
    .delete(usersTable)
    .where(inArray(usersTable.id, testUserIds));
});
