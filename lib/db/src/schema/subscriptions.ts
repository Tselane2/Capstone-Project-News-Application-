import { pgTable, integer, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { publishersTable } from "./publishers";

export const readerPublisherSubscriptionsTable = pgTable("reader_publisher_subscriptions", {
  readerId: integer("reader_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  publisherId: integer("publisher_id").notNull().references(() => publishersTable.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.readerId, t.publisherId] })]);

export const readerJournalistSubscriptionsTable = pgTable("reader_journalist_subscriptions", {
  readerId: integer("reader_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  journalistId: integer("journalist_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.readerId, t.journalistId] })]);
