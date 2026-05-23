import { pgTable, text, serial, timestamp, integer, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { articlesTable } from "./articles";

export const newslettersTable = pgTable("newsletters", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  authorId: integer("author_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const newsletterArticlesTable = pgTable("newsletter_articles", {
  newsletterId: integer("newsletter_id").notNull().references(() => newslettersTable.id, { onDelete: "cascade" }),
  articleId: integer("article_id").notNull().references(() => articlesTable.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.newsletterId, t.articleId] })]);

export const insertNewsletterSchema = createInsertSchema(newslettersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertNewsletter = z.infer<typeof insertNewsletterSchema>;
export type Newsletter = typeof newslettersTable.$inferSelect;
