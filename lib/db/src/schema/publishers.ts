import { pgTable, text, serial, timestamp, integer, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const publishersTable = pgTable("publishers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const publisherEditorsTable = pgTable("publisher_editors", {
  publisherId: integer("publisher_id").notNull().references(() => publishersTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.publisherId, t.userId] })]);

export const publisherJournalistsTable = pgTable("publisher_journalists", {
  publisherId: integer("publisher_id").notNull().references(() => publishersTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.publisherId, t.userId] })]);

export const insertPublisherSchema = createInsertSchema(publishersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPublisher = z.infer<typeof insertPublisherSchema>;
export type Publisher = typeof publishersTable.$inferSelect;
