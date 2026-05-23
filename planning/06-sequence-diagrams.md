# Sequence Diagrams
## The Press Room — News Portal Platform

---

## 1. Article Approval Sequence

```
 Editor Browser     React Query        API Server       Database
      │                 │                  │                │
      │  Load dashboard │                  │                │
      │────────────────►│                  │                │
      │                 │ GET /articles/pending              │
      │                 │ Authorization: Bearer <token>      │
      │                 │─────────────────►│                │
      │                 │                  │ requireAuth()  │
      │                 │                  │ requireRole("editor")
      │                 │                  │ SELECT articles│
      │                 │                  │ WHERE approved=false
      │                 │                  │───────────────►│
      │                 │                  │                │
      │                 │                  │◄───────────────│
      │                 │                  │ [article rows] │
      │                 │                  │                │
      │                 │◄─────────────────│                │
      │                 │ [{ id, title, .. }]               │
      │◄────────────────│                  │                │
      │  Render queue   │                  │                │
      │                 │                  │                │
      │  Click Approve  │                  │                │
      │────────────────►│                  │                │
      │                 │ PATCH /articles/:id/approve        │
      │                 │ { "approved": true }               │
      │                 │─────────────────►│                │
      │                 │                  │ requireAuth()  │
      │                 │                  │ requireRole("editor")
      │                 │                  │ SELECT article │
      │                 │                  │ WHERE id=?     │
      │                 │                  │───────────────►│
      │                 │                  │◄───────────────│
      │                 │                  │ UPDATE articles│
      │                 │                  │ SET approved=true
      │                 │                  │───────────────►│
      │                 │                  │◄───────────────│
      │                 │                  │ log approval   │
      │                 │◄─────────────────│                │
      │                 │ { id, approved: true, ... }       │
      │◄────────────────│                  │                │
      │  Remove from    │                  │                │
      │  pending queue  │                  │                │
```

---

## 2. Newsletter Creation Sequence

```
 Journalist Browser  React Query        API Server       Database
      │                 │                  │                │
      │  Fill form      │                  │                │
      │  Click Create   │                  │                │
      │────────────────►│                  │                │
      │                 │ POST /newsletters │                │
      │                 │ { title, description, articleIds }│
      │                 │─────────────────►│                │
      │                 │                  │ requireAuth()  │
      │                 │                  │ requireRole("journalist")
      │                 │                  │ Zod validate   │
      │                 │                  │ INSERT newsletter
      │                 │                  │───────────────►│
      │                 │                  │◄───────────────│
      │                 │                  │ [newsletter]   │
      │                 │                  │                │
      │                 │                  │ INSERT newsletter_articles
      │                 │                  │ (for each articleId)
      │                 │                  │───────────────►│
      │                 │                  │◄───────────────│
      │                 │                  │                │
      │                 │                  │ buildNewsletter()
      │                 │                  │ SELECT author  │
      │                 │                  │───────────────►│
      │                 │                  │◄───────────────│
      │                 │                  │ SELECT articles│
      │                 │                  │ WHERE id IN(?) │
      │                 │                  │───────────────►│
      │                 │                  │◄───────────────│
      │                 │◄─────────────────│                │
      │                 │ { id, title, articles: [...] }    │
      │◄────────────────│                  │                │
      │  Redirect to    │                  │                │
      │  /newsletters/1 │                  │                │
```

---

## 3. Reader Subscription Sequence

```
 Reader Browser      React Query        API Server       Database
      │                 │                  │                │
      │  View publisher │                  │                │
      │  page, click    │                  │                │
      │  "Follow"       │                  │                │
      │────────────────►│                  │                │
      │                 │ POST /subscriptions/publishers/:id│
      │                 │ Authorization: Bearer <token>     │
      │                 │─────────────────►│                │
      │                 │                  │ requireAuth()  │
      │                 │                  │ requireRole("reader")
      │                 │                  │ SELECT existing│
      │                 │                  │ subscription   │
      │                 │                  │───────────────►│
      │                 │                  │◄───────────────│
      │                 │                  │ (none found)   │
      │                 │                  │ INSERT subscription
      │                 │                  │───────────────►│
      │                 │                  │◄───────────────│
      │                 │◄─────────────────│                │
      │                 │ { subscribed: true }              │
      │◄────────────────│                  │                │
      │  Button changes │                  │                │
      │  to "Unfollow"  │                  │                │
```

---

## 4. API Request Flow: `GET /api/articles/subscribed`

```
 Reader Browser      custom-fetch       API Server       Database
      │                 │                  │                │
      │ Load dashboard  │                  │                │
      │────────────────►│                  │                │
      │                 │ GET /articles/subscribed           │
      │                 │ + Authorization header (auto)     │
      │                 │─────────────────►│                │
      │                 │                  │                │
      │                 │                  │ 1. requireAuth()
      │                 │                  │    jwt.verify()│
      │                 │                  │    req.user = payload
      │                 │                  │                │
      │                 │                  │ 2. SELECT publisher_ids
      │                 │                  │    WHERE reader_id=?
      │                 │                  │───────────────►│
      │                 │                  │◄───────────────│
      │                 │                  │ [1, 2]         │
      │                 │                  │                │
      │                 │                  │ 3. SELECT journalist_ids
      │                 │                  │    WHERE reader_id=?
      │                 │                  │───────────────►│
      │                 │                  │◄───────────────│
      │                 │                  │ [3]            │
      │                 │                  │                │
      │                 │                  │ 4. SELECT articles
      │                 │                  │    WHERE approved=true
      │                 │                  │    AND (publisher_id IN [1,2]
      │                 │                  │    OR author_id IN [3])
      │                 │                  │    ORDER BY created_at DESC
      │                 │                  │    LIMIT 50
      │                 │                  │───────────────►│
      │                 │                  │◄───────────────│
      │                 │                  │ [article rows] │
      │                 │                  │                │
      │                 │                  │ 5. buildArticle()
      │                 │                  │    for each article
      │                 │                  │    (fetch author + publisher)
      │                 │                  │                │
      │                 │◄─────────────────│                │
      │                 │ [enriched articles]               │
      │◄────────────────│                  │                │
      │  Render feed    │                  │                │
```
