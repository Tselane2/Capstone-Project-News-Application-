# Class / Model Diagram
## The Press Room — News Portal Platform

> Models are defined using Drizzle ORM in `lib/db/src/schema/`.
> This diagram shows the TypeScript inferred types and their relationships.

---

## 1. Class Diagram

```
┌──────────────────────────────────────┐
│                User                  │
├──────────────────────────────────────┤
│ + id: number                         │
│ + username: string                   │
│ + email: string                      │
│ + passwordHash: string               │
│ + role: "reader"|"journalist"|"editor"│
│ + bio: string | null                 │
│ + createdAt: Date                    │
├──────────────────────────────────────┤
│ (methods handled via API routes)     │
└──────────────┬───────────────────────┘
               │
       ┌───────┴──────────┐
       │                  │
       ▼                  ▼
┌─────────────┐    ┌─────────────────────────────────┐
│  Publisher  │    │            Article              │
├─────────────┤    ├─────────────────────────────────┤
│+ id: number │    │ + id: number                    │
│+ name: string│   │ + title: string                 │
│+ description│    │ + content: string               │
│+ createdAt  │    │ + authorId: number (FK→User)    │
└──────┬──────┘    │ + publisherId: number|null (FK) │
       │           │ + approved: boolean             │
       │           │ + createdAt: Date               │
       │           │ + updatedAt: Date               │
       │           └──────────────┬──────────────────┘
       │                          │
       │    ┌─────────────────────┘
       │    │
       ▼    ▼
┌──────────────────────────────────┐
│       Newsletter                 │
├──────────────────────────────────┤
│ + id: number                     │
│ + title: string                  │
│ + description: string            │
│ + authorId: number (FK→User)     │
│ + createdAt: Date                │
└──────────────────────────────────┘

─── Join / Association Classes ────────────────────────────────────

┌────────────────────────┐   ┌────────────────────────┐
│  NewsletterArticle     │   │   PublisherEditor      │
├────────────────────────┤   ├────────────────────────┤
│ + newsletterId (FK)    │   │ + publisherId (FK)     │
│ + articleId (FK)       │   │ + userId (FK)          │
└────────────────────────┘   └────────────────────────┘

┌─────────────────────────────┐   ┌──────────────────────────────┐
│  ReaderPublisherSubscription│   │ ReaderJournalistSubscription  │
├─────────────────────────────┤   ├──────────────────────────────┤
│ + readerId (FK→User)        │   │ + readerId (FK→User)         │
│ + publisherId (FK)          │   │ + journalistId (FK→User)     │
│ + createdAt: Date           │   │ + createdAt: Date            │
└─────────────────────────────┘   └──────────────────────────────┘

┌──────────────────────────┐
│  PublisherJournalist     │
├──────────────────────────┤
│ + publisherId (FK)       │
│ + userId (FK)            │
└──────────────────────────┘
```

---

## 2. Relationship Summary

| From | Relationship | To | Cardinality |
|------|-------------|-----|-------------|
| User (journalist) | writes | Article | 1 → many |
| Article | belongs to | Publisher | many → 1 (optional) |
| User (journalist) | writes | Newsletter | 1 → many |
| Newsletter | contains | Article | many ↔ many (via newsletter_articles) |
| User (editor/journalist) | associated with | Publisher | many ↔ many (via publisher_editors / publisher_journalists) |
| User (reader) | subscribes to | Publisher | many ↔ many (via reader_publisher_subscriptions) |
| User (reader) | subscribes to | User (journalist) | many ↔ many (via reader_journalist_subscriptions) |

---

## 3. Drizzle ORM Schema (Simplified TypeScript)

```typescript
// users table
export const usersTable = pgTable("users", {
  id:           serial("id").primaryKey(),
  username:     varchar("username", { length: 50 }).notNull().unique(),
  email:        varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role:         varchar("role", { length: 20 }).notNull(),  // reader|journalist|editor
  bio:          text("bio"),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});

// articles table
export const articlesTable = pgTable("articles", {
  id:          serial("id").primaryKey(),
  title:       varchar("title", { length: 255 }).notNull(),
  content:     text("content").notNull(),
  authorId:    integer("author_id").notNull().references(() => usersTable.id),
  publisherId: integer("publisher_id").references(() => publishersTable.id),
  approved:    boolean("approved").default(false).notNull(),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
});

// newsletters table
export const newslettersTable = pgTable("newsletters", {
  id:          serial("id").primaryKey(),
  title:       varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  authorId:    integer("author_id").notNull().references(() => usersTable.id),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

// newsletter_articles join table
export const newsletterArticlesTable = pgTable("newsletter_articles", {
  newsletterId: integer("newsletter_id").notNull().references(() => newslettersTable.id),
  articleId:    integer("article_id").notNull().references(() => articlesTable.id),
});

// reader_publisher_subscriptions
export const readerPublisherSubscriptionsTable = pgTable(
  "reader_publisher_subscriptions",
  {
    readerId:    integer("reader_id").notNull().references(() => usersTable.id),
    publisherId: integer("publisher_id").notNull().references(() => publishersTable.id),
    createdAt:   timestamp("created_at").defaultNow().notNull(),
  }
);
```

---

## 4. Role Permissions Matrix

| Action | Reader | Journalist | Editor |
|--------|--------|-----------|--------|
| View approved articles | ✓ | ✓ | ✓ |
| View pending articles | ✗ | ✗ | ✓ |
| Create article | ✗ | ✓ | ✗ |
| Edit own article | ✗ | ✓ | ✓ |
| Delete any article | ✗ | Own only | ✓ |
| Approve/reject article | ✗ | ✗ | ✓ |
| Create newsletter | ✗ | ✓ | ✗ |
| Edit own newsletter | ✗ | ✓ | ✓ |
| Create publisher | ✗ | ✓ | ✓ |
| Edit publisher | ✗ | ✗ | ✓ |
| Subscribe to publisher | ✓ | ✗ | ✗ |
| Subscribe to journalist | ✓ | ✗ | ✗ |
| View personalised feed | ✓ | ✗ | ✗ |
