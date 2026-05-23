# Entity–Relationship Diagram & Normalization Notes
## The Press Room — News Portal Platform

---

## 1. Entity–Relationship Diagram

```
┌──────────────────────┐         ┌──────────────────────────┐
│        users         │         │        publishers        │
├──────────────────────┤         ├──────────────────────────┤
│ id (PK)              │         │ id (PK)                  │
│ username (UNIQUE)    │         │ name                     │
│ email (UNIQUE)       │         │ description              │
│ password_hash        │         │ created_at               │
│ role                 │         └──────────────────────────┘
│ bio                  │                  │
│ created_at           │                  │
└──────────────────────┘          ┌───────┴────────────────────────┐
          │                       │                                │
          │                       │                                │
 ┌────────┴────────┐   ┌──────────▼──────────┐   ┌────────────────▼──────┐
 │    articles     │   │  publisher_editors  │   │publisher_journalists  │
 ├─────────────────┤   ├─────────────────────┤   ├───────────────────────┤
 │ id (PK)         │   │ publisher_id (FK)   │   │ publisher_id (FK)     │
 │ title           │   │ user_id (FK)        │   │ user_id (FK)          │
 │ content         │   └─────────────────────┘   └───────────────────────┘
 │ author_id (FK)──┼──► users.id
 │ publisher_id(FK)┼──► publishers.id
 │ approved        │
 │ created_at      │         ┌────────────────────────────────┐
 │ updated_at      │         │           newsletters          │
 └────────┬────────┘         ├────────────────────────────────┤
          │                  │ id (PK)                        │
          │                  │ title                          │
          │                  │ description                    │
          │                  │ author_id (FK) ──► users.id    │
          │                  │ created_at                     │
          │                  └──────────────┬─────────────────┘
          │                                 │
          │         ┌───────────────────────┘
          │         │
          ▼         ▼
   ┌──────────────────────────┐
   │   newsletter_articles    │
   ├──────────────────────────┤
   │ newsletter_id (FK)       │
   │ article_id (FK)          │
   └──────────────────────────┘

┌─────────────────────────────────────┐
│  reader_publisher_subscriptions     │
├─────────────────────────────────────┤
│ reader_id (FK) ──► users.id         │
│ publisher_id (FK) ──► publishers.id │
│ created_at                          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  reader_journalist_subscriptions    │
├─────────────────────────────────────┤
│ reader_id (FK) ──► users.id         │
│ journalist_id (FK) ──► users.id     │
│ created_at                          │
└─────────────────────────────────────┘
```

---

## 2. Table Descriptions

### users
Stores all platform accounts. A single table handles all three roles (`reader`, `journalist`, `editor`) using a role discriminator column. This avoids role-specific tables with partially null fields and keeps authentication logic simple.

### publishers
Represents media organisations that journalists post under. A publisher has a name and description and is linked to its editors and journalists through join tables.

### publisher_editors / publisher_journalists
Many-to-many join tables linking publishers to users of specific roles. A user can be an editor or journalist for multiple publishers.

### articles
The core content entity. Each article belongs to exactly one author (a journalist) and optionally to one publisher. The `approved` boolean drives the editorial workflow — only approved articles appear in public feeds.

### newsletters
A journalist-curated collection. A newsletter belongs to one author and has many articles through `newsletter_articles`.

### newsletter_articles
Many-to-many join table linking newsletters to articles. An article can appear in multiple newsletters.

### reader_publisher_subscriptions
Records which readers follow which publishers. The composite (reader_id, publisher_id) pair is unique — no duplicate subscriptions.

### reader_journalist_subscriptions
Records which readers follow which individual journalists. The composite (reader_id, journalist_id) pair is unique.

---

## 3. Normalization Notes

### First Normal Form (1NF)
All tables satisfy 1NF:
- Every column holds a single atomic value (no comma-separated lists or arrays in columns)
- Every row is uniquely identified by its primary key
- Article tags or categories (if added later) would be stored in a separate `article_tags` join table, not in an array column

### Second Normal Form (2NF)
All tables satisfy 2NF:
- Every non-key attribute depends on the whole primary key
- The join tables (`newsletter_articles`, `reader_publisher_subscriptions`, etc.) have composite primary keys where both columns are part of the key, and there are no partial dependencies
- `articles.author_id` depends on the article's `id`, not on a partial composite key

### Third Normal Form (3NF)
All tables satisfy 3NF:
- No transitive dependencies exist
- The author's username is **not** stored on the `articles` table — it is looked up via the `users` foreign key at query time. Storing `author_name` directly on articles would violate 3NF (it would depend on `author_id`, not on the article's own `id`)
- Publisher name is similarly not denormalised onto articles — it is joined from the `publishers` table at read time

### Many-to-Many Relationship Justification

| Relationship | Join Table | Reason |
|---|---|---|
| Newsletter ↔ Article | newsletter_articles | An article can appear in multiple newsletters; a newsletter contains many articles |
| Publisher ↔ Editor | publisher_editors | An editor can work for multiple publishers |
| Publisher ↔ Journalist | publisher_journalists | A journalist can write for multiple publishers |
| Reader ↔ Publisher | reader_publisher_subscriptions | A reader follows many publishers; a publisher has many followers |
| Reader ↔ Journalist | reader_journalist_subscriptions | A reader follows many journalists; a journalist has many followers |

### Foreign Key Choices
- `articles.author_id → users.id`: enforces that every article has a valid author
- `articles.publisher_id → publishers.id` (nullable): an article may be independent or associated with a publisher
- `newsletters.author_id → users.id`: enforces that every newsletter has a valid author
- Cascading deletes are not used to preserve audit history — application logic handles related record cleanup before deletion
